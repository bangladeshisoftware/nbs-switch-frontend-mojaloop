import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getDfspById,
  getDfspPositions,
  getDfspLimits,
  setDfspLimit,
  updateDfspLimit,
} from '../../services/api';
import { fmt } from '../../utils/format';
import api from '../../services/api';

export default function DFSPOverview() {
  const { dfspId } = useParams();
  const navigate = useNavigate();
  const [dfsp, setDfsp] = useState(null);
  const [position, setPosition] = useState(null);
  const [limits, setLimits] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [depositModal, setDepositModal] = useState(false);
  const [limitModal, setLimitModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Deposit form
  const [depositForm, setDepositForm] = useState({
    account_id: '',
    currency: '',
    amount: '',
    reason: '',
  });

  // Limit form
  const [limitForm, setLimitForm] = useState({
    limit_type: 'NET_DEBIT_CAP',
    currency: '',
    value: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dfspRes, posRes, limRes, accRes] = await Promise.allSettled([
        getDfspById(dfspId),
        getDfspPositions({ dfsp_id: dfspId }),
        getDfspLimits({ dfsp_id: dfspId }),
        api.get(`/positions/${dfspId}/accounts`),
      ]);

      if (dfspRes.status === 'fulfilled') setDfsp(dfspRes.value.data.data);
      if (posRes.status === 'fulfilled')
        setPosition(posRes.value.data.data?.[0] || null);
      if (limRes.status === 'fulfilled')
        setLimits(limRes.value.data.data || []);
      if (accRes.status === 'fulfilled')
        setAccounts(accRes.value.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dfspId]);

  useEffect(() => {
    load();
  }, [load]);

  // Pre-fill forms when data loads
  useEffect(() => {
    if (dfsp) {
      setDepositForm((f) => ({ ...f, currency: dfsp.currency || '' }));
      setLimitForm((f) => ({ ...f, currency: dfsp.currency || '' }));
    }
    if (accounts.length) {
      setDepositForm((f) => ({ ...f, account_id: accounts[0]?.id || '' }));
    }
  }, [dfsp, accounts]);

  // ── Deposit submit ───────────────────────────────────────
  const handleDeposit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/positions/deposit', {
        dfsp_id: dfspId,
        account_id: depositForm.account_id,
        currency: depositForm.currency,
        amount: depositForm.amount,
        reason: depositForm.reason,
      });
      setDepositModal(false);
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  // ── Limit submit ─────────────────────────────────────────
  const handleSetLimit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (latestLimit.value > 0) {
      try {
        await updateDfspLimit({ dfsp_id: dfspId, ...limitForm });
        setLimitModal(false);
        load();
        console.log({ dfsp_id: dfspId, ...limitForm });
      } catch (err) {
        alert('Error: ' + (err.response?.data?.error || err.message));
      } finally {
        setSaving(false);
      }
    } else {
      try {
        await setDfspLimit({ dfsp_id: dfspId, ...limitForm });
        setLimitModal(false);
        load();
      } catch (err) {
        alert('Error: ' + (err.response?.data?.error || err.message));
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading)
    return (
      <div className='loading-screen'>
        <div className='spinner' />
        Loading DFSP...
      </div>
    );
  if (!dfsp) return <div className='loading-screen'>DFSP not found</div>;

  const cap = parseFloat(position?.net_debit_cap || 0);
  const current = parseFloat(position?.current_position || 0);
  const reserved = parseFloat(position?.reserved_amount || 0);
  const available = cap - current - reserved;
  const usagePct =
    cap > 0 ? Math.min(((current + reserved) / cap) * 100, 100) : 0;
  const usageColor =
    usagePct > 80
      ? 'var(--red)'
      : usagePct > 60
        ? 'var(--yellow)'
        : 'var(--green)';

  const latestLimit = limits[0];

  return (
    <div>
      {/* ── Header ── */}
      <div className='page-header' style={{ padding: '13px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className='btn btn-secondary'
            onClick={() => navigate('/dfsps')}
            style={{ padding: '6px 10px' }}
          >
            ← Back
          </button>
          <div>
            <div className='page-subtitle'>
              {dfsp.dfsp_id} · {dfsp.currency}
            </div>
          </div>
        </div>
        <div className='header-actions'>
          <button
            className='btn btn-secondary'
            onClick={() => setLimitModal(true)}
          >
            ⚙ Set Limit
          </button>
          <button
            className='btn btn-primary'
            onClick={() => setDepositModal(true)}
            style={{
              background: 'var(--green)',
              borderColor: 'var(--green)',
              color: '#000',
            }}
          >
            ＋ Deposit Funds
          </button>
          <button className='btn btn-secondary' onClick={load}>
            ↺ Refresh
          </button>
        </div>
      </div>

      <div className='page-content'>
        <div className='grid-2' style={{ marginBottom: 16 }}>
          {/* DFSP Details */}
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>DFSP Information</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['DFSP ID', dfsp.dfsp_id],
                  ['Full Name', dfsp.name],
                  ['Short Name', dfsp.short_name],
                  ['Currency', dfsp.currency],
                  ['Email', dfsp?.email || 'N/A'],
                  ['Status', dfsp.status || 'ACTIVE'],
                  ['Created', fmt.datetime(dfsp.created_at)],
                ].map(([label, value]) => (
                  <tr
                    key={label}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td
                      style={{
                        padding: '8px 0',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        width: 120,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        padding: '8px 0',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                      }}
                    >
                      {value || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Liquidity Position */}
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Liquidity Position</span>
            </div>

            {!position ? (
              <div className='empty-state'>
                <div className='empty-desc'>No position data yet</div>
              </div>
            ) : (
              <>
                {/* Usage Bar */}
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Capacity Usage
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: usageColor,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                      }}
                    >
                      {usagePct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: 'var(--border)',
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        width: `${usagePct}%`,
                        height: '100%',
                        background: usageColor,
                        borderRadius: 4,
                        transition: 'width 0.5s',
                      }}
                    />
                  </div>
                </div>

                {/* Position Values */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  {[
                    {
                      label: 'Net Debit Cap',
                      value: cap,
                      color: 'var(--accent)',
                      icon: '⬡',
                    },
                    {
                      label: 'Current Position',
                      value: current,
                      color: 'var(--red)',
                      icon: '↓',
                    },
                    {
                      label: 'Reserved',
                      value: reserved,
                      color: 'var(--yellow)',
                      icon: '⏳',
                    },
                    {
                      label: 'Available',
                      value: available,
                      color: 'var(--green)',
                      icon: '✓',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-hover)',
                        borderRadius: 8,
                        border: `1px solid ${item.color}22`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                          marginBottom: 4,
                        }}
                      >
                        {item.icon} {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: item.color,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {item.value.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {position.currency}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Callback URL + Stats ── */}
        <div className='grid-2' style={{ marginBottom: 16 }}>
          {/* Callback URLs */}
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Callback Configuration</span>
            </div>
            {[
              { label: 'Endpoint URL', value: dfsp.endpoint_url },
              { label: 'Callback URL', value: dfsp.callback_url },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    background: 'var(--bg-hover)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: value ? 'var(--accent)' : 'var(--text-muted)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {value || 'Not configured'}
                  </span>
                  {value && (
                    <button
                      className='btn btn-secondary'
                      style={{
                        padding: '2px 8px',
                        fontSize: 10,
                        flexShrink: 0,
                      }}
                      onClick={() => navigator.clipboard.writeText(value)}
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Transfer Stats */}
            {dfsp.stats && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 8,
                  }}
                >
                  TRANSFER STATS
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                  }}
                >
                  {[
                    {
                      label: 'Total',
                      value: dfsp.stats.total_transfers,
                      color: 'var(--accent)',
                    },
                    {
                      label: 'Success',
                      value: dfsp.stats.committed,
                      color: 'var(--green)',
                    },
                    {
                      label: 'Failed',
                      value: dfsp.stats.failed,
                      color: 'var(--red)',
                    },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: s.color,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {fmt.number(s.value || 0)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ledger Accounts */}
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Ledger Accounts</span>
            </div>
            {accounts.length === 0 ? (
              <div className='empty-state'>
                <div className='empty-desc'>
                  No accounts found in Central Ledger
                </div>
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background:
                        acc.ledgerAccountType === 'POSITION'
                          ? 'var(--accent)22'
                          : 'var(--purple)22',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color:
                        acc.ledgerAccountType === 'POSITION'
                          ? 'var(--accent)'
                          : 'var(--purple)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {acc.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                      }}
                    >
                      {acc.ledgerAccountType || acc.accountType || 'ACCOUNT'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {acc.currency} · ID: {acc.id}
                      {acc.isActive !== undefined && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: acc.isActive ? 'var(--green)' : 'var(--red)',
                          }}
                        >
                          · {acc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {parseFloat(acc.value || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {acc.currency}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Limit History ── */}
        {limits.length > 0 && (
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Limit History</span>
              {latestLimit && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Current NDC: {parseFloat(latestLimit.value).toLocaleString()}{' '}
                  {latestLimit.currency}
                </span>
              )}
            </div>
            <div className='table-wrap' style={{ marginTop: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Currency</th>
                    <th>Previous</th>
                    <th>New Value</th>
                    <th>Changed By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {limits.slice(0, 10).map((l) => (
                    <tr key={l.id}>
                      <td>
                        <span className='badge ACTIVE'>{l.limit_type}</span>
                      </td>
                      <td>{l.currency}</td>
                      <td
                        style={{
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {parseFloat(l.previous_value || 0).toLocaleString(
                          'en-US',
                          { minimumFractionDigits: 2 },
                        )}
                      </td>
                      <td
                        style={{
                          color: 'var(--accent)',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {parseFloat(l.value || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td>{l.changed_by}</td>
                      <td>{fmt.datetime(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div style={{ marginBottom: 50 }}></div>
      </div>

      {/* ════════════════════════════════════════════════════
          DEPOSIT FUNDS MODAL
      ════════════════════════════════════════════════════ */}
      {depositModal && (
        <div className='modal-overlay' onClick={() => setDepositModal(false)}>
          <div
            className='modal'
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div className='modal-title'>
              <span style={{ color: 'var(--green)' }}>＋</span> Deposit Funds
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 16,
                fontFamily: 'var(--font-mono)',
              }}
            >
              DFSP: <span style={{ color: 'var(--accent)' }}>{dfspId}</span>
            </div>
            <form
              onSubmit={handleDeposit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* Account Selection */}
              <div className='input-group'>
                <label className='input-label'>Ledger Account *</label>
                {accounts.length > 0 ? (
                  <select
                    className='select w-full'
                    required
                    value={depositForm.account_id}
                    onChange={(e) =>
                      setDepositForm((f) => ({
                        ...f,
                        account_id: e.target.value,
                      }))
                    }
                  >
                    <option value=''>Select account...</option>
                    {accounts
                      ?.filter((v) => v?.ledgerAccountType !== 'POSITION')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          [{acc.id}] {acc.ledgerAccountType || acc.accountType}{' '}
                          — {acc.currency}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    className='input w-full'
                    required
                    type='number'
                    placeholder='Account ID (e.g. 3)'
                    value={depositForm.account_id}
                    onChange={(e) =>
                      setDepositForm((f) => ({
                        ...f,
                        account_id: e.target.value,
                      }))
                    }
                  />
                )}
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginTop: 4,
                  }}
                >
                  SETTLEMENT or POSITION account
                </div>
              </div>

              {/* Currency */}
              <div className='input-group'>
                <label className='input-label'>Currency *</label>
                <input
                  className='input w-full'
                  required
                  value={depositForm.currency}
                  onChange={(e) =>
                    setDepositForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  placeholder='e.g. BDT'
                  maxLength={3}
                />
              </div>

              {/* Amount */}
              <div className='input-group'>
                <label className='input-label'>Amount *</label>
                <input
                  className='input w-full'
                  required
                  type='number'
                  step='0.01'
                  min='1'
                  value={depositForm.amount}
                  onChange={(e) =>
                    setDepositForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder='e.g. 5000.00'
                />
                {position && depositForm.amount && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--green)',
                      marginTop: 4,
                    }}
                  >
                    After deposit available:{' '}
                    {(
                      available + parseFloat(depositForm.amount || 0)
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    {depositForm.currency}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className='input-group'>
                <label className='input-label'>Reason</label>
                <input
                  className='input w-full'
                  value={depositForm.reason}
                  onChange={(e) =>
                    setDepositForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder='e.g. Initial funding, Top-up'
                />
              </div>

              <div className='modal-actions'>
                <button
                  type='button'
                  className='btn btn-secondary'
                  onClick={() => setDepositModal(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn btn-primary'
                  disabled={saving}
                  style={{
                    background: 'var(--green)',
                    borderColor: 'var(--green)',
                    color: '#000',
                  }}
                >
                  {saving
                    ? 'Processing...'
                    : `Deposit ${depositForm.amount || ''} ${depositForm.currency}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          SET LIMIT MODAL
      ════════════════════════════════════════════════════ */}
      {limitModal && (
        <div className='modal-overlay' onClick={() => setLimitModal(false)}>
          <div
            className='modal'
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 400 }}
          >
            <div className='modal-title'>⚙ Set Net Debit Cap</div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 16,
                fontFamily: 'var(--font-mono)',
              }}
            >
              DFSP: <span style={{ color: 'var(--accent)' }}>{dfspId}</span>
              {latestLimit && (
                <span style={{ marginLeft: 8 }}>
                  · Current:{' '}
                  <span style={{ color: 'var(--yellow)' }}>
                    {parseFloat(latestLimit.value).toLocaleString()}{' '}
                    {latestLimit.currency}
                  </span>
                </span>
              )}
            </div>
            <form
              onSubmit={handleSetLimit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div className='input-group'>
                <label className='input-label'>Limit Type</label>
                <select
                  className='select w-full'
                  value={limitForm.limit_type}
                  onChange={(e) =>
                    setLimitForm((f) => ({ ...f, limit_type: e.target.value }))
                  }
                >
                  <option value='NET_DEBIT_CAP'>NET_DEBIT_CAP</option>
                </select>
              </div>
              <div className='input-group'>
                <label className='input-label'>Currency *</label>
                <input
                  className='input w-full'
                  required
                  value={limitForm.currency}
                  onChange={(e) =>
                    setLimitForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  placeholder='e.g. BDT'
                  maxLength={3}
                />
              </div>
              <div className='input-group'>
                <label className='input-label'>New Limit Value *</label>
                <input
                  className='input w-full'
                  required
                  type='number'
                  step='0.01'
                  value={limitForm.value}
                  onChange={(e) =>
                    setLimitForm((f) => ({ ...f, value: e.target.value }))
                  }
                  placeholder='e.g. 10000.00'
                />
              </div>
              <div className='modal-actions'>
                <button
                  type='button'
                  className='btn btn-secondary'
                  onClick={() => setLimitModal(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn btn-primary'
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Set Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
