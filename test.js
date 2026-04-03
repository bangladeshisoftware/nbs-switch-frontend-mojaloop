const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { sendSettlementEmailsToAll } = require('../services/email.service');

const SETTLEMENT_URL =
  process.env.SETTLEMENT_URL || 'https://settlement.mojaloop.xyz/v2';
const CENTRAL_LEDGER = process.env.CENTRAL_LEDGER_URL || 'https://ledger.mojaloop.xyz';

// get open window from settlement service
async function getOpenWindowsFromService() {
  const res = await axios.get(
    `${SETTLEMENT_URL}/settlementWindows?state=OPEN`,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
  return res.data || [];
}

// get all window from settlement service
async function getWindowsFromService(state = null) {
  const url = state
    ? `${SETTLEMENT_URL}/settlementWindows?state=${state}`
    : `${SETTLEMENT_URL}/settlementWindows`;
  const res = await axios.get(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data || [];
}

// window sync in db.
async function syncWindowToDB(win) {
  const windowId = String(win.settlementWindowId || win.id);
  const status = win.state || win.status || 'OPEN';
  try {
    await pool.execute(
      `
      INSERT INTO settlement_windows (id, window_id, status, opened_at, closed_at)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status     = VALUES(status),
        closed_at  = VALUES(closed_at),
        updated_at = NOW()`,
      [
        uuidv4(),
        windowId,
        status,
        win.createdDate || win.opened_at || null,
        win.changedDate || win.closed_at || null,
      ],
    );
  } catch (e) {
    console.error(`⚠️ syncWindowToDB: ${e.message}`);
  }
}

//settlement/windows

exports.getWindows = async (req, res) => {
  try {
    // get live window
    let serviceWindows = [];
    try {
      serviceWindows = await getWindowsFromService('OPEN');

      // db sync
      for (const win of serviceWindows) {
        await syncWindowToDB(win);
      }
    } catch (e) {
      console.warn(
        `Settlement Service unavailable: ${e.message} — showing DB data`,
      );
    }

    // db sync data
    const [rows] = await pool.execute(`
      SELECT * FROM settlement_windows
      ORDER BY created_at DESC LIMIT 50`);

    res.json({
      data: rows,
      live_from_service: serviceWindows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  settlement window open
exports.getOpenWindows = async (req, res) => {
  try {
    const openWindows = await getOpenWindowsFromService();
    res.json({ data: openWindows, count: openWindows.length });
  } catch (err) {
    // if service unavailable then show db record.
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM settlement_windows WHERE status = 'OPEN' ORDER BY created_at DESC`,
      );
      res.json({ data: rows, count: rows.length, source: 'db_fallback' });
    } catch (dbErr) {
      res.status(500).json({ error: err.message });
    }
  }
};

// get position
exports.getPositions = async (req, res) => {
  try {
    const { currency, date } = req.query;

    const conditions = [`t.status = 'COMMITTED'`];
    const values = [];

    if (currency) {
      conditions.push(`t.currency = ?`);
      values.push(currency);
    }

    if (date) {
      conditions.push(`DATE(t.completed_at) = ?`);
      values.push(date);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [positions] = await pool.execute(
      `
      SELECT
        dfsp,
        currency,
        SUM(sent) AS total_sent,
        SUM(received) AS total_received,
        SUM(received) - SUM(sent) AS net_position
      FROM (
        SELECT 
          t.payer_fsp AS dfsp, 
          t.currency,
          SUM(t.amount) AS sent, 
          0 AS received
        FROM transfers t
        ${where}
        GROUP BY t.payer_fsp, t.currency

        UNION ALL

        SELECT 
          t.payee_fsp AS dfsp, 
          t.currency,
          0 AS sent, 
          SUM(t.amount) AS received
        FROM transfers t
        ${where}
        GROUP BY t.payee_fsp, t.currency
      ) positions
      GROUP BY dfsp, currency
      ORDER BY dfsp
      `,
      [...values, ...values], // duplicated twice.
    );

    res.json({ data: positions });
  } catch (err) {
    console.error('Error in getPositions:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.openWindow = async (req, res) => {
  try {
    // settlement service open
    let serviceWindowId = null;
    let serviceData = null;

    try {
      const openWindows = await getOpenWindowsFromService();

      if (openWindows.length > 0) {
        // Already Presented OPEN window
        serviceWindowId = String(
          openWindows[0].settlementWindowId || openWindows[0].id,
        );
        serviceData = openWindows[0];
        console.log(`[SETTLEMENT] Already open window: ${serviceWindowId}`);
      } else {
        serviceWindowId = uuidv4();
        console.log(`[SETTLEMENT] No open window in Settlement Service`);
      }
    } catch (e) {
      console.warn(`Settlement Service unavailable: ${e.message}`);
      serviceWindowId = uuidv4();
    }

    // DB save
    await pool.execute(
      `
      INSERT INTO settlement_windows (id, window_id, status, opened_at)
      VALUES (?, ?, 'OPEN', NOW())
      ON DUPLICATE KEY UPDATE status = 'OPEN', updated_at = NOW()`,
      [uuidv4(), serviceWindowId],
    );

    console.log(`[SETTLEMENT] Window opened: ${serviceWindowId}`);

    res.status(201).json({
      message: 'Settlement window opened',
      window_id: serviceWindowId,
      service_data: serviceData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// complete settlement.
exports.completeSettlement = async (req, res) => {
  const { reason = 'End of day settlement', window_id } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ error: 'reason is required' });
  }

  const results = {
    step1_windowClosed:      null,
    step2_settlementCreated: null,
    step3_recorded:          null,
    step4_reserved:          null,
    step5_committed:         null,
    step6_settled:           null,
  };

  try {
    // ── STEP 1: Find and close OPEN window ────────────────────
    let windowId = window_id;

    if (!windowId) {
      const openWindows = await getOpenWindowsFromService();
      if (!openWindows || openWindows.length === 0) {
        return res.status(400).json({ error: 'No open settlement windows found' });
      }
      windowId = openWindows[0].settlementWindowId || openWindows[0].id;
    }

    const closingWindowId = Number(windowId);
    console.log(`[SETTLEMENT] Step 1: Closing window ${closingWindowId}`);

    const closeRes = await axios.post(
      `${SETTLEMENT_URL}/settlementWindows/${closingWindowId}`,
      { state: 'CLOSED', reason },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // closeRes.data = newly auto-created OPEN window (NOT the closed one)
    results.step1_windowClosed = {
      closedWindowId: closingWindowId,
      newWindowId:    closeRes.data?.settlementWindowId,
      newWindowState: closeRes.data?.state,
    };

    console.log(`[SETTLEMENT] Step 1: Window ${closingWindowId} closed`);
    console.log(`[SETTLEMENT] New auto-window: ${closeRes.data?.settlementWindowId}`);

    // Update local DB
    await pool.execute(
      `UPDATE settlement_windows
       SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW()
       WHERE window_id = ?`,
      [String(closingWindowId)]
    );

    // Wait for Mojaloop to finalize window state
    await new Promise(r => setTimeout(r, 1000));

    // ── STEP 2: Create settlement ─────────────────────────────
    console.log(`[SETTLEMENT] Step 2: Creating settlement for window ${closingWindowId}`);

    let createRes;
    try {
      createRes = await axios.post(
        `${SETTLEMENT_URL}/settlements`,
        {
          reason,
          settlementModel:   'DEFERREDNET',
          settlementWindows: [{ id: closingWindowId }],
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (step2Err) {
      const errCode = step2Err.response?.data?.errorInformation?.errorCode;
      const errDesc = step2Err.response?.data?.errorInformation?.errorDescription;

      if (errCode === '3100' && errDesc?.includes('Inapplicable')) {
        return res.status(400).json({
          error:   'Settlement window has no transfers to settle',
          details: `Window ${closingWindowId} has no committed transfers. Make transfers first.`,
          results,
        });
      }

      console.error(`[SETTLEMENT] Step 2 failed: ${errCode} — ${errDesc}`);
      throw step2Err;
    }

    results.step2_settlementCreated = createRes.data;
    const settlementId = createRes.data.id;
    const participants = createRes.data.participants || [];

    console.log(`[SETTLEMENT] Step 2: Settlement ID=${settlementId} | Participants=${participants.length}`);

    if (participants.length === 0) {
      return res.status(400).json({
        error:   'Settlement created but has no participants',
        details: 'No DFSP positions to settle',
        results,
      });
    }

    // ── Helper: build state change body ───────────────────────
    const makeBody = (state, stateReason) => ({
      participants: participants.map(p => ({
        id:       p.id,
        accounts: (p.accounts || []).map(a => ({
          id:     a.id,
          state,
          reason: stateReason,
        })),
      })),
    });

    // ── STEP 3: PS_TRANSFERS_RECORDED ─────────────────────────
    console.log(`[SETTLEMENT] Step 3: PS_TRANSFERS_RECORDED`);
    await new Promise(r => setTimeout(r, 500));
    const step3Res = await axios.put(
      `${SETTLEMENT_URL}/settlements/${settlementId}`,
      makeBody('PS_TRANSFERS_RECORDED', 'Recording settlement transfers'),
      { headers: { 'Content-Type': 'application/json' } }
    );
    results.step3_recorded = step3Res.data;
    console.log(`[SETTLEMENT] Step 3 done`);

    // ── STEP 4: PS_TRANSFERS_RESERVED ─────────────────────────
    console.log(`[SETTLEMENT] Step 4: PS_TRANSFERS_RESERVED`);
    await new Promise(r => setTimeout(r, 500));
    const step4Res = await axios.put(
      `${SETTLEMENT_URL}/settlements/${settlementId}`,
      makeBody('PS_TRANSFERS_RESERVED', 'Reserving settlement transfers'),
      { headers: { 'Content-Type': 'application/json' } }
    );
    results.step4_reserved = step4Res.data;
    console.log(`[SETTLEMENT] Step 4 done`);

    // ── STEP 5: PS_TRANSFERS_COMMITTED ────────────────────────
    console.log(`[SETTLEMENT] Step 5: PS_TRANSFERS_COMMITTED`);
    await new Promise(r => setTimeout(r, 500));
    const step5Res = await axios.put(
      `${SETTLEMENT_URL}/settlements/${settlementId}`,
      makeBody('PS_TRANSFERS_COMMITTED', 'Committing settlement transfers'),
      { headers: { 'Content-Type': 'application/json' } }
    );
    results.step5_committed = step5Res.data;
    console.log(`[SETTLEMENT] Step 5 done`);

    // ── STEP 6: SETTLED ───────────────────────────────────────
    // DEFERREDNET model automatically resets ALL participant
    // POSITION values to 0 when state reaches SETTLED
    // No recordFundsIn needed — position resets are automatic
    // SETTLEMENT account balance is NOT touched here
    console.log(`[SETTLEMENT] Step 6: SETTLED`);
    await new Promise(r => setTimeout(r, 500));
    const step6Res = await axios.put(
      `${SETTLEMENT_URL}/settlements/${settlementId}`,
      makeBody('SETTLED', 'Settlement completed by Central Bank'),
      { headers: { 'Content-Type': 'application/json' } }
    );
    results.step6_settled = step6Res.data;
    console.log(`[SETTLEMENT] Step 6 done — Settlement COMPLETE ✅`);
    console.log(`[SETTLEMENT] DEFERREDNET: all participant positions auto-reset to 0`);

    // ── DB Cleanup ────────────────────────────────────────────
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Mark reconciliation records as MATCHED
      await conn.execute(
        `UPDATE reconciliation r1
         JOIN reconciliation r2
           ON r1.transfer_id = r2.transfer_id
           AND r1.transfer_type = 'SEND'
           AND r2.transfer_type = 'RECEIVE'
         SET r1.recon_status = 'MATCHED', r2.recon_status = 'MATCHED',
             r1.settlement_id = ?,        r2.settlement_id = ?
         WHERE r1.recon_status = 'PENDING' AND r2.recon_status = 'PENDING'`,
        [String(settlementId), String(settlementId)]
      );

      // Reset local dfsp_positions to 0 — matches Mojaloop after SETTLED
      await conn.execute(
        `UPDATE dfsp_positions
         SET current_position = 0, reserved_amount = 0, updated_at = NOW()`
      );

      // Mark settlement window as SETTLED
      await conn.execute(
        `UPDATE settlement_windows
         SET status = 'SETTLED', settled_at = NOW(), updated_at = NOW()
         WHERE window_id = ?`,
        [String(closingWindowId)]
      );

      await conn.commit();
      console.log(`[SETTLEMENT] DB cleanup done`);
    } catch (dbErr) {
      await conn.rollback();
      console.error(`[SETTLEMENT] DB cleanup failed: ${dbErr.message}`);
    } finally {
      conn.release();
    }

    // ── Send settlement emails ────────────────────────────────
    await sendSettlementEmailsToAll({
      pool,
      settlementId,
      windowId:    closingWindowId,
      participants,
    }).catch(e => {
      console.error(`[SETTLEMENT] Email failed: ${e.message}`);
    });

    return res.json({
      success:       true,
      message:       'Settlement completed successfully through all 6 steps',
      settlement_id: settlementId,
      window_id:     closingWindowId,
      results,
    });

  } catch (err) {
    const failedStep = Object.entries(results).find(([, v]) => v === null)?.[0] || 'unknown';
    console.error(`[SETTLEMENT] Failed at ${failedStep}: ${err.message}`);
    return res.status(err.response?.status || 500).json({
      error:   `Failed at ${failedStep}`,
      details: err.response?.data || err.message,
      results,
    });
  }
};
exports.closeWindow = async (req, res) => {
  try {
    const { windowId } = req.params;
    const { reason = 'Manual close' } = req.body;

    // Settlement Service এ close করো
    try {
      await axios.post(
        `${SETTLEMENT_URL}/settlementWindows/${windowId}`,
        { state: 'CLOSED', reason },
        { headers: { 'Content-Type': 'application/json' } },
      );
      console.log(`[SETTLEMENT] Window closed in service: ${windowId}`);
    } catch (e) {
      console.warn(`Settlement Service close failed: ${e.message}`);
    }

    // DB update
    await pool.execute(
      `
      UPDATE settlement_windows
      SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW()
      WHERE window_id = ? AND status = 'OPEN'`,
      [windowId],
    );

    res.json({ message: 'Settlement window closed', window_id: windowId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.finalizeSettlement = async (req, res) => {
  const { settlementId } = req.params;
  const { reason = 'Post-settlement physical transfer confirmed by Central Bank' } = req.body;

  if (!settlementId)
    return res.status(400).json({ error: 'settlementId required' });

  const results = {
    settlement_id:   settlementId,
    funds_movements: [],
    db_update:       null,
  };

  try {
    // ── Step 1: Fetch settlement details from Mojaloop ─────────
    // Get net amounts per participant from Central Ledger
    let settlementData = null;
    try {
      const settRes = await axios.get(
        `${SETTLEMENT_URL}/settlements/${settlementId}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      settlementData = settRes.data;
    } catch (e) {
      return res.status(404).json({
        error:   `Settlement ${settlementId} not found in Mojaloop`,
        details: e.response?.data || e.message,
      });
    }

    // Verify settlement is in SETTLED state
    if (settlementData?.state !== 'SETTLED') {
      return res.status(400).json({
        error:   `Settlement ${settlementId} is not SETTLED yet`,
        details: `Current state: ${settlementData.state}. Complete settlement first.`,
      });
    }

    const participants = settlementData?.participants || [];
    if (participants?.length === 0) {
      return res.status(400).json({ error: 'No participants found in settlement' });
    }

    console.log(`[FINALIZE] Settlement ${settlementId} | ${participants.length} participants`);

    // ── Step 2: Get all participant names from Central Ledger ──
    // Settlement response has participant IDs — we need names
    const clParticipantsRes = await axios.get(
      `${CENTRAL_LEDGER}/participants`,
      { headers: { 'fspiop-source': 'switch' } }
    );
    const allParticipants = (clParticipantsRes.data || [])
      .filter(p => !['Hub', 'hub', 'HUB'].includes(p.name));

    // ── Step 3: For each participant — apply recordFundsOut/In ──
    for (const participant of participants) {
      const netAmount  = parseFloat(participant.accounts?.[0]?.netSettlementAmount?.amount || '0');
      const currency   = participant.accounts?.[0]?.netSettlementAmount?.currency || 'BDT';
      const absAmount  = Math.abs(netAmount);
      const participantId = participant.id;

      if (absAmount === 0) {
        results.funds_movements.push({
          participantId,
          status: 'skipped',
          reason: 'zero net amount',
        });
        continue;
      }

      // Find participant name by matching account ID
      let participantName = null;
      for (const p of allParticipants) {
        try {
          const accRes = await axios.get(
            `${CENTRAL_LEDGER}/participants/${p.name}/accounts`,
            { headers: { 'fspiop-source': 'switch' } }
          );
          const match = (accRes.data || []).some(
            a => a.id === participant.accounts?.[0]?.id
          );
          if (match) { participantName = p.name; break; }
        } catch (_) {}
      }

      if (!participantName) {
        console.warn(`[FINALIZE] Could not find name for participant ${participantId}`);
        results.funds_movements.push({
          participantId,
          status: 'failed',
          reason: 'participant name not found in Central Ledger',
        });
        continue;
      }

      // Get SETTLEMENT account for this participant
      let settlementAccount = null;
      try {
        const accRes = await axios.get(
          `${CENTRAL_LEDGER}/participants/${participantName}/accounts`,
          { headers: { 'fspiop-source': 'switch' } }
        );
        settlementAccount = (accRes.data || []).find(
          a => a.ledgerAccountType === 'SETTLEMENT' && a.currency === currency
        );
      } catch (e) {
        results.funds_movements.push({
          participantName,
          participantId,
          status: 'failed',
          reason: `Could not fetch accounts: ${e.message}`,
        });
        continue;
      }

      if (!settlementAccount) {
        results.funds_movements.push({
          participantName,
          participantId,
          status: 'failed',
          reason: 'No SETTLEMENT account found',
        });
        continue;
      }

      // ── Decide action based on net amount ──────────────────────
      // Negative = owes money → recordFundsOut (SETTLEMENT decreases)
      // Positive = receives   → recordFundsIn  (SETTLEMENT increases)
      const action      = netAmount < 0 ? 'recordFundsOut' : 'recordFundsIn';
      const actionLabel = netAmount < 0 ? '↓ recordFundsOut' : '↑ recordFundsIn';

      try {
        await axios.post(
          `${CENTRAL_LEDGER}/participants/${participantName}/accounts/${settlementAccount.id}`,
          {
            transferId:        require('crypto').randomUUID(),
            externalReference: `settlement-${settlementId}-finalize`,
            action,
            reason:            `${reason} — settlement ${settlementId}`,
            amount: {
              amount:   absAmount.toFixed(4),
              currency,
            },
          },
          {
            headers: {
              'Content-Type':  'application/vnd.interoperability.participants+json;version=1.1',
              'fspiop-source': 'switch',
              'Date':          new Date().toUTCString(),
            },
          }
        );

        console.log(`[FINALIZE] ✅ ${actionLabel}: ${participantName} ${netAmount < 0 ? '-' : '+'}${absAmount} ${currency}`);

        results.funds_movements.push({
          participantName,
          participantId,
          action,
          netAmount,
          absAmount,
          currency,
          status: 'ok',
          effect: netAmount < 0
            ? `SETTLEMENT decreased by ${absAmount} ${currency}`
            : `SETTLEMENT increased by ${absAmount} ${currency}`,
        });

      } catch (fundErr) {
        console.error(`[FINALIZE] ❌ ${action} failed for ${participantName}: ${fundErr.message}`);
        results.funds_movements.push({
          participantName,
          participantId,
          action,
          netAmount,
          absAmount,
          currency,
          status: 'failed',
          error:  fundErr.response?.data || fundErr.message,
        });
      }
    }

    // ── Step 4: Update R Switch DB ─────────────────────────────
    try {
      await pool.execute(
        `UPDATE settlement_windows
         SET finalized_at = NOW(), updated_at = NOW()
         WHERE window_id = (
           SELECT sw.window_id FROM settlement_windows sw
           WHERE sw.status = 'SETTLED'
           ORDER BY sw.settled_at DESC LIMIT 1
         )`
      );
      results.db_update = 'ok';
    } catch (dbErr) {
      console.warn(`[FINALIZE] DB update failed: ${dbErr.message}`);
      results.db_update = 'failed';
    }

    // ── Summary ───────────────────────────────────────────────
    const succeeded = results.funds_movements.filter(r => r.status === 'ok').length;
    const failed    = results.funds_movements.filter(r => r.status === 'failed').length;

    console.log(`[FINALIZE] Done — ${succeeded} succeeded, ${failed} failed`);

    return res.json({
      success:      failed === 0,
      message:      failed === 0
        ? `Settlement ${settlementId} finalized — all ${succeeded} SETTLEMENT accounts updated`
        : `Settlement ${settlementId} partially finalized — ${succeeded} ok, ${failed} failed`,
      settlement_id: settlementId,
      summary: {
        total:     results.funds_movements.length,
        succeeded,
        failed,
        skipped:   results.funds_movements.filter(r => r.status === 'skipped').length,
      },
      results,
    });

  } catch (err) {
    console.error(`[FINALIZE] Error: ${err.message}`);
    return res.status(500).json({ error: err.message, results });
  }
};

