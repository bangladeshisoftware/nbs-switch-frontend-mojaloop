import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const fmt = (v) => {
  const n = parseFloat(v || 0);
  return (
    (n >= 0 ? '+' : '') +
    n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};
const abs = (v) =>
  Math.abs(parseFloat(v || 0)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function LiquidityDashboard() {
  const [dfsps, setDfsps] = useState([]);
  const [data, setData] = useState({});
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // ── Step 1: Load DFSP list dynamically from Central Ledger ─
  const loadDfsps = useCallback(async () => {
    try {
      const res = await api.get('/positions/participants');
      // Returns all active participants excluding Hub
      const list = (res.data?.data || []).map((p) => p.name || p.dfsp_id || p);
      setDfsps(list);
      return list;
    } catch (e) {
      console.error('Failed to load DFSP list:', e.message);
      return [];
    }
  }, []);

  // ── Step 2: Load live positions for each DFSP ─────────────
  const loadPositions = useCallback(async (dfspList) => {
    if (!dfspList?.length) return;
    const results = await Promise.allSettled(
      dfspList.map((id) =>
        api.get(`/positions/${id}/live`).then((r) => ({ id, ...r.data })),
      ),
    );
    const newData = {};
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value?.id) {
        newData[r.value.id] = r.value;
      }
    });
    setData(newData);
    setLastUpdate(new Date());
  }, []);

  // ── Full refresh ───────────────────────────────────────────
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const list = await loadDfsps();
        await loadPositions(list);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadDfsps, loadPositions],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => load(true), 10000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  // ── Snapshot helpers ───────────────────────────────────────
  const takeSnapshot = () =>
    setSnapshot({ data: { ...data }, time: new Date() });
  const clearSnapshot = () => setSnapshot(null);

  const getDelta = (dfspId, field) => {
    if (!snapshot?.data[dfspId] || !data[dfspId]) return null;
    const diff =
      parseFloat(data[dfspId][field] || 0) -
      parseFloat(snapshot.data[dfspId][field] || 0);
    return diff === 0 ? null : diff;
  };

  if (loading)
    return (
      <div>
        <div className='page-header'>
          <div>
            <div className='page-title'>Liquidity Dashboard</div>
            <div className='page-subtitle'>
              Loading participants from Central Ledger...
            </div>
          </div>
        </div>
        <div className='loading-screen'>Loading...</div>
      </div>
    );

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Liquidity Dashboard</div>
          <div className='page-subtitle'>
            {dfsps.length} participants · Live from Mojaloop Central Ledger
            {lastUpdate && (
              <span
                style={{
                  marginLeft: 10,
                  color: 'var(--text-muted)',
                  fontSize: 11,
                }}
              >
                · {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className='header-actions'>
          <button
            className='btn btn-secondary'
            onClick={() => setAutoRefresh((p) => !p)}
            style={{ color: autoRefresh ? 'var(--green)' : undefined }}
          >
            {autoRefresh ? '⏸ Auto' : '▶ Auto'}
          </button>
          <button
            className='btn btn-secondary'
            onClick={() => load()}
            disabled={refreshing}
          >
            {refreshing ? '⏳' : '↺'} Refresh
          </button>
          {!snapshot ? (
            <button className='btn btn-primary' onClick={takeSnapshot}>
              Snapshot
            </button>
          ) : (
            <button className='btn btn-secondary' onClick={clearSnapshot}>
              Clear Snapshot
            </button>
          )}
        </div>
      </div>

      {snapshot && (
        <div
          style={{
            margin: '0 0 16px',
            padding: '10px 16px',
            background: '#001a33',
            border: '1px solid #003366',
            borderRadius: 8,
            fontSize: 12,
            color: '#6699cc',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>📸</span>
          <span>
            Snapshot at{' '}
            <strong style={{ color: '#99ccff' }}>
              {snapshot.time.toLocaleTimeString()}
            </strong>{' '}
            — refresh to see deltas
          </span>
        </div>
      )}

      {dfsps.length === 0 ? (
        <div className='empty-state'>
          <div className='empty-title'>No participants found</div>
          <div className='empty-desc'>
            No active DFSPs registered in Central Ledger
          </div>
        </div>
      ) : (
        <div className='page-content'>
          {/* ── DFSP Cards — one per participant ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            {dfsps.map((dfspId) => {
              const d = data[dfspId];
              if (!d)
                return (
                  <div className='card' key={dfspId}>
                    <div className='card-header'>
                      <div className='card-title'>{dfspId}</div>
                    </div>
                    <div
                      className='card-body'
                      style={{ color: 'var(--text-muted)', fontSize: 12 }}
                    >
                      Failed to load
                    </div>
                  </div>
                );

              const position = parseFloat(d.position || 0);
              const ndc = parseFloat(d.ndc || 0);
              const settlement = parseFloat(d.settlement || 0);
              const available = ndc - Math.abs(position);
              const usedPct = ndc > 0 ? (Math.abs(position) / ndc) * 100 : 0;
              const posDelta = getDelta(dfspId, 'position');
              const ndcDelta = getDelta(dfspId, 'ndc');
              const settDelta = getDelta(dfspId, 'settlement');
              const dotColor =
                available > ndc * 0.3
                  ? 'var(--green)'
                  : available > 0
                    ? 'var(--yellow)'
                    : 'var(--red)';

              return (
                <div className='card' key={dfspId}>
                  <div
                    className='card-header'
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div
                        className='card-title'
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {dfspId}
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: dotColor,
                            display: 'inline-block',
                          }}
                        />
                      </div>
                      <div className='card-subtitle'>BDT · {d.status}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: available >= 0 ? 'var(--green)' : 'var(--red)',
                        }}
                      >
                        {abs(available)} BDT
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        available
                      </div>
                    </div>
                  </div>

                  <div className='card-body'>
                    {/* NDC bar */}
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          marginBottom: 4,
                        }}
                      >
                        <span>NDC Used</span>
                        <span>{usedPct.toFixed(1)}%</span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: 'var(--bg-hover)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(usedPct, 100)}%`,
                            background:
                              usedPct > 80
                                ? 'var(--red)'
                                : usedPct > 50
                                  ? 'var(--yellow)'
                                  : 'var(--green)',
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Metrics */}
                    {[
                      {
                        label: 'Position',
                        value: position,
                        delta: posDelta,
                        isPos: true,
                      },
                      { label: 'Net Debit Cap', value: ndc, delta: ndcDelta },
                      {
                        label: 'Settlement Account',
                        value: settlement,
                        delta: settDelta,
                      },
                      {
                        label: 'Available',
                        value: available,
                        delta: null,
                        hl: true,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <span
                          style={{ fontSize: 11, color: 'var(--text-muted)' }}
                        >
                          {row.label}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                              color: row.hl
                                ? row.value >= 0
                                  ? 'var(--green)'
                                  : 'var(--red)'
                                : row.isPos
                                  ? row.value < 0
                                    ? 'var(--red)'
                                    : 'var(--green)'
                                  : 'var(--text-primary)',
                            }}
                          >
                            {row.isPos ? fmt(row.value) : abs(row.value)} BDT
                          </span>
                          {row.delta != null && (
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: 'var(--font-mono)',
                                color:
                                  row.delta > 0 ? 'var(--green)' : 'var(--red)',
                                background:
                                  row.delta > 0
                                    ? 'var(--green)11'
                                    : 'var(--red)11',
                                padding: '1px 5px',
                                borderRadius: 4,
                              }}
                            >
                              {row.delta > 0 ? '+' : ''}
                              {row.delta.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Summary table ── */}
          <div className='card'>
            <div className='card-header'>
              <div className='card-title'>All Participants Summary</div>
              <div className='card-subtitle'>
                {snapshot
                  ? `Δ vs snapshot at ${snapshot.time.toLocaleTimeString()}`
                  : 'Live from Central Ledger'}
              </div>
            </div>
            <div className='card-body' style={{ padding: 0 }}>
              <div className='table-wrap' style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>DFSP</th>
                      <th>Position</th>
                      {snapshot && <th>Pos Δ</th>}
                      <th>Net Debit Cap</th>
                      <th>Available</th>
                      <th>Settlement</th>
                      {snapshot && <th>Sett Δ</th>}
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dfsps.map((dfspId) => {
                      const d = data[dfspId];
                      if (!d)
                        return (
                          <tr key={dfspId}>
                            <td className='td-accent'>{dfspId}</td>
                            <td
                              colSpan={7}
                              style={{
                                color: 'var(--text-muted)',
                                fontSize: 11,
                              }}
                            >
                              unavailable
                            </td>
                          </tr>
                        );
                      const position = parseFloat(d.position || 0);
                      const ndc = parseFloat(d.ndc || 0);
                      const settlement = parseFloat(d.settlement || 0);
                      const available = ndc - Math.abs(position);
                      const posDelta = getDelta(dfspId, 'position');
                      const settDelta = getDelta(dfspId, 'settlement');
                      const sc =
                        available > ndc * 0.3
                          ? 'COMMITTED'
                          : available > 0
                            ? 'TIMEOUT'
                            : 'FAILED';
                      const sl =
                        available > ndc * 0.3
                          ? 'HEALTHY'
                          : available > 0
                            ? 'LOW'
                            : 'CRITICAL';

                      return (
                        <tr key={dfspId}>
                          <td className='td-accent'>{dfspId}</td>
                          <td
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              fontWeight: 600,
                              color:
                                position < 0 ? 'var(--red)' : 'var(--green)',
                            }}
                          >
                            {fmt(position)} BDT
                          </td>
                          {snapshot && (
                            <td>
                              {posDelta != null ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontFamily: 'var(--font-mono)',
                                    color:
                                      posDelta > 0
                                        ? 'var(--green)'
                                        : 'var(--red)',
                                  }}
                                >
                                  {posDelta > 0 ? '+' : ''}
                                  {posDelta.toFixed(2)}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          <td
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                            }}
                          >
                            {abs(ndc)} BDT
                          </td>
                          <td
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              fontWeight: 600,
                              color:
                                available >= 0 ? 'var(--green)' : 'var(--red)',
                            }}
                          >
                            {abs(available)} BDT
                          </td>
                          <td
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                            }}
                          >
                            {abs(settlement)} BDT
                          </td>
                          {snapshot && (
                            <td>
                              {settDelta != null ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontFamily: 'var(--font-mono)',
                                    color:
                                      settDelta > 0
                                        ? 'var(--green)'
                                        : 'var(--red)',
                                  }}
                                >
                                  {settDelta > 0 ? '+' : ''}
                                  {settDelta.toFixed(2)}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          <td>
                            <span className={`badge ${sc}`}>{sl}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className='h-14 py-14'>.</div>
          <div className='h-14 py-14'>.</div>
        </div>
      )}
    </div>
  );
}
