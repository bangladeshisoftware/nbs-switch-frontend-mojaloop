import { useState, useEffect } from 'react';
import api from '../../services/api';
import { fmt } from '../../utils/format';

export default function DepositsRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allDFSP, setAllDFSP] = useState([]);
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
      const res = await api.get('/settlement/deposits-records', { params });
      setRecords(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const load_dfsp = async () => {
    try {
      const res = await api.get('/dfsps-mini');
      setAllDFSP(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    load_dfsp();
  }, []);

  const f = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Deposits Records</div>
          <div className='page-subtitle'>
            History of Deposit funds in settlement accounts
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div className='input-group'>
            <label className='input-label'>DFSP</label>
            <select
              className='input w-full'
              value={filters.dfsp_name}
              onChange={f('dfsp_name')}
              placeholder='e.g. ABank'
            >
              <option value={''}>All DFSP</option>
              {Array.isArray(allDFSP) &&
                allDFSP?.map((v, k) => (
                  <option key={k} value={v?.value}>
                    {v?.label}
                  </option>
                ))}
            </select>
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
      </div>

      {/*  Full table  */}
      <div className='page-content'>
        <div className='table-wrap'>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>DFSP ID</th>
                <th>Account ID</th>
                <th>Currency</th>
                <th>Amount</th>
                <th>Reason</th>
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
                  const net = parseFloat(r.amount || 0);
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
                          {r.dfsp_id}
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {r.account_id || '—'}
                      </td>
                      <td
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      >
                        {r.currency}
                      </td>

                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}
                      >
                        {r?.amount && net?.toFixed(2)}
                      </td>

                      <td
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      >
                        {r?.reason || '-'}
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
