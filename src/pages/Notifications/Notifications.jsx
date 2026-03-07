import { useState, useEffect, useCallback } from 'react';
import { getNotifications } from '../../services/api';
import { fmt } from '../../utils/format';

export default function Notifications() {
  const [data, setData]     = useState([]);
  const [meta, setMeta]     = useState({ total: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ to_fsp: '', transfer_state: '', page: 1, limit: 20 });

  const load = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    getNotifications(params)
      .then(r => { setData(r.data.data); setMeta({ total: r.data.total, page: r.data.page }); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const STATES = ['', 'COMMITTED', 'FAILED', 'ABORTED', 'TIMEOUT'];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-subtitle">{fmt.number(meta.total)} notification events logged</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={load}>↺ Refresh</button>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="filter-bar">
          <div className="input-group">
            <label className="input-label">Transfer State</label>
            <select className="select" value={filters.transfer_state}
              onChange={e => setFilters(f => ({ ...f, transfer_state: e.target.value, page: 1 }))}>
              {STATES.map(s => <option key={s} value={s}>{s || 'All States'}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">To FSP</label>
            <input className="input" placeholder="DFSP ID..." value={filters.to_fsp}
              onChange={e => setFilters(f => ({ ...f, to_fsp: e.target.value, page: 1 }))}
              style={{ width: 160 }} />
          </div>
          <button className="btn btn-secondary"
            onClick={() => setFilters({ to_fsp: '', transfer_state: '', page: 1, limit: 20 })}>
            Clear
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {/* Table */}
          <div style={{ flex: 1 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>To FSP</th>
                    <th>From</th>
                    <th>Event Type</th>
                    <th>State</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? <tr><td colSpan={6}><div className="loading-screen">Loading...</div></td></tr>
                    : data.length === 0
                    ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-title">No notifications yet</div><div className="empty-desc">Notifications appear after transfers complete</div></div></td></tr>
                    : data.map(n => (
                      <tr key={n.id} onClick={() => setSelected(n)}
                        style={{ background: selected?.id === n.id ? 'var(--bg-hover)' : '' }}>
                        <td className="td-accent">{fmt.truncate(n.transfer_id, 20)}</td>
                        <td className="td-primary">{n.to_fsp || '—'}</td>
                        <td>{n.from_fsp || 'hub'}</td>
                        <td><span className="badge ACTIVE" style={{ fontSize: 9 }}>{n.event_type}</span></td>
                        <td><span className={`badge ${n.transfer_state}`}>{n.transfer_state || '—'}</span></td>
                        <td>{fmt.datetime(n.created_at)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Payload Detail Panel */}
          {selected && (
            <div className="card" style={{ width: 340, flexShrink: 0, alignSelf: 'flex-start' }}>
              <div className="card-header">
                <span className="card-title">Payload</span>
                <button className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 10 }}
                  onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', maxHeight: 400, overflowY: 'auto', lineHeight: 1.6 }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(
                    typeof selected.payload === 'string'
                      ? JSON.parse(selected.payload)
                      : selected.payload,
                    null, 2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
