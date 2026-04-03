import { useState, useEffect } from 'react';
import api from '../../services/api';
import { fmt } from '../../utils/format';

export default function SettlementCompletedRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    window_id: '',
    settlement_id: '',
    dfsp_name: '',
    date_from: '',
    date_to: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await api.get('/settlement/completed-records', { params });
      setRecords(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const f = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  // Group by window_id for summary view
  const windows = [...new Set(records.map((r) => r.window_id))];

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Settlement Completed Records</div>
          <div className='page-subtitle'>
            Position before/after reset per settlement cycle
          </div>
        </div>
        <div className='header-actions'>
          <button className='btn btn-secondary' onClick={load}>
            ↺ Refresh
          </button>
          <button className='btn btn-primary' onClick={load}>
            {' '}
            Search
          </button>
        </div>
      </div>

      <div style={{ padding: '18px 28px' }}>
        {/* ── Filters ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div className='input-group'>
            <label className='input-label'>Window ID</label>
            <input
              className='input w-full'
              value={filters.window_id}
              onChange={f('window_id')}
              placeholder='e.g. 17'
            />
          </div>
          <div className='input-group'>
            <label className='input-label'>Settlement ID</label>
            <input
              className='input w-full'
              value={filters.settlement_id}
              onChange={f('settlement_id')}
              placeholder='e.g. 6'
            />
          </div>
          <div className='input-group'>
            <label className='input-label'>DFSP</label>
            <input
              className='input w-full'
              value={filters.dfsp_name}
              onChange={f('dfsp_name')}
              placeholder='e.g. ABank'
            />
          </div>
          <div className='input-group'>
            <label className='input-label'>Date From</label>
            <input
              className='input w-full'
              type='date'
              value={filters.date_from}
              onChange={f('date_from')}
            />
          </div>
          <div className='input-group'>
            <label className='input-label'>Date To</label>
            <input
              className='input w-full'
              type='date'
              value={filters.date_to}
              onChange={f('date_to')}
            />
          </div>
        </div>

        {/* ── Summary cards by window ── */}
        {windows.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {windows.map((wid) => {
              const wRecords = records.filter((r) => r.window_id === wid);
              const settId = wRecords[0]?.settlement_id || '—';
              const date = wRecords[0]?.created_at;
              const totalNet = wRecords.reduce(
                (s, r) => s + parseFloat(r.net_amount || 0),
                0,
              );
              return (
                <div className='card' key={wid}>
                  <div
                    className='card-header'
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div className='card-title'>Window {wid}</div>
                      <div className='card-subtitle'>
                        Settlement {settId} · {wRecords.length} DFSPs
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {fmt.date(date)}
                    </div>
                  </div>
                  <div className='card-body' style={{ padding: '10px 16px' }}>
                    {wRecords.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '5px 0',
                          borderBottom: '1px solid var(--border)',
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{r.dfsp_name}</span>
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color:
                                parseFloat(r.before_position) < 0
                                  ? 'var(--red)'
                                  : 'var(--green)',
                            }}
                          >
                            {parseFloat(r.before_position || 0).toFixed(2)}
                          </span>
                          <span
                            style={{ color: 'var(--text-muted)', fontSize: 10 }}
                          >
                            →
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: 'var(--accent)',
                              fontWeight: 700,
                            }}
                          >
                            0.00
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Full table ── */}
      <div className='page-content'>
        <div className='table-wrap'>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Window ID</th>
                <th>Settlement ID</th>
                <th>DFSP</th>
                <th>Before Position</th>
                <th>After Position</th>
                <th>Net Amount</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>
                    <div className='loading-screen'>Loading...</div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className='empty-state'>
                      <div className='empty-title'>
                        No settlement records found
                      </div>
                      <div className='empty-desc'>
                        Run completeSettlement to see records here
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r, i) => {
                  const before = parseFloat(r.before_position || 0);
                  const net = parseFloat(r.net_amount || 0);
                  return (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {i + 1}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {fmt.date(r.created_at)}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            color: 'var(--accent)',
                          }}
                        >
                          {r.window_id}
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {r.settlement_id || '—'}
                      </td>
                      <td className='td-primary'>{r.dfsp_name}</td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            before < 0
                              ? 'var(--red)'
                              : before > 0
                                ? 'var(--green)'
                                : 'var(--text-muted)',
                        }}
                      >
                        {before >= 0 ? '+' : ''}
                        {before.toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}
                      >
                        0.00
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: net < 0 ? 'var(--red)' : 'var(--green)',
                        }}
                      >
                        {net >= 0 ? '+' : ''}
                        {net.toFixed(2)}
                      </td>
                      <td
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      >
                        {r.currency}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
