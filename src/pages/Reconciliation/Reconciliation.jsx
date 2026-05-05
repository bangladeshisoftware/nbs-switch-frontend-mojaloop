import { useState, useEffect, useCallback } from 'react';
import {
  getReconciliation,
  runReconciliation,
  getReconciliationReport,
} from '../../services/api';
import { fmt } from '../../utils/format';

export default function Reconciliation() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, summary: {} });
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState('list');
  const [filters, setFilters] = useState({
    recon_status: '',
    page: 1,
    limit: 20,
  });

  const load = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== ''),
    );
    Promise.all([getReconciliation(params), getReconciliationReport()])
      .then(([r, rep]) => {
        setData(r.data.data);
        setMeta({ total: r.data.total, summary: r.data.summary || {} });
        setReport(rep.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await runReconciliation({});
      alert(
        `Reconciliation done! ${res.data.transfers_processed} transfers processed.`,
      );
      load();
    } catch (err) {
      alert(' Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setRunning(false);
    }
  };

  const summary = meta.summary;

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Reconciliation</div>
          <div className='page-subtitle'>
            {fmt.number(meta.total)} total records
          </div>
        </div>
        <div className='header-actions'>
          <button
            className='btn btn-primary'
            onClick={handleRun}
            disabled={running}
          >
            {running ? (
              <>
                <div className='spinner' style={{ width: 12, height: 12 }} />{' '}
                Running...
              </>
            ) : (
              ' Run Reconciliation'
            )}
          </button>
        </div>
      </div>

      <div className='page-content'>
        {/* Summary Cards */}
        <div className='stat-grid' style={{ marginBottom: 16 }}>
          <div className='stat-card green'>
            <div className='stat-label'>Matched</div>
            <div className='stat-value green'>
              {fmt.number(summary.matched)}
            </div>
          </div>
          <div className='stat-card yellow'>
            <div className='stat-label'>Pending</div>
            <div className='stat-value yellow'>
              {fmt.number(summary.pending)}
            </div>
          </div>
          <div className='stat-card red'>
            <div className='stat-label'>Unmatched</div>
            <div className='stat-value red'>
              {fmt.number(summary.unmatched)}
            </div>
          </div>
          <div className='stat-card purple'>
            <div className='stat-label'>Disputed</div>
            <div className='stat-value purple'>
              {fmt.number(summary.disputed)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {['list', 'report'].map((t) => (
            <button
              key={t}
              className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t)}
            >
              {t === 'list' ? 'Records' : 'Net Position Report'}
            </button>
          ))}
        </div>

        {tab === 'list' && (
          <>
            <div className='filter-bar'>
              <div className='input-group'>
                <label className='input-label'>Status</label>
                <select
                  className='select'
                  value={filters.recon_status}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      recon_status: e.target.value,
                      page: 1,
                    }))
                  }
                >
                  <option value=''>All</option>
                  <option value='PENDING'>Pending</option>
                  <option value='MATCHED'>Matched</option>
                  <option value='UNMATCHED'>Unmatched</option>
                  <option value='DISPUTED'>Disputed</option>
                </select>
              </div>
            </div>

            <div className='table-wrap'>
              <table>
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>DFSP</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Settlement Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7}>
                        <div className='loading-screen'>Loading...</div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className='empty-state'>
                          <div className='empty-title'>No records</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.map((r) => (
                      <tr key={r.id}>
                        <td className='td-accent'>
                          {fmt.truncate(r.transfer_id, 24)}
                        </td>
                        <td className='td-primary'>{r.dfsp_id}</td>
                        <td>
                          <span
                            className='badge'
                            style={{
                              background:
                                r.transfer_type === 'SEND'
                                  ? 'var(--accent-dim)'
                                  : 'var(--green-dim)',
                              color:
                                r.transfer_type === 'SEND'
                                  ? 'var(--accent)'
                                  : 'var(--green)',
                            }}
                          >
                            {r.transfer_type}
                          </span>
                        </td>
                        <td className='td-primary'>
                          {parseFloat(r.amount || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td>{r.currency}</td>
                        <td>
                          <span className={`badge ${r.recon_status}`}>
                            {r.recon_status}
                          </span>
                        </td>
                        <td>{fmt.date(r.settlement_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'report' && (
          <div className='table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>DFSP</th>
                  <th>Currency</th>
                  <th>Total Sent</th>
                  <th>Total Received</th>
                  <th>Net Position</th>
                  <th>Matched</th>
                  <th>Unmatched</th>
                </tr>
              </thead>
              <tbody>
                {report.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className='empty-state'>
                        <div className='empty-title'>No report data</div>
                        <div className='empty-desc'>
                          Run reconciliation first
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  report.map((r, i) => (
                    <tr key={i}>
                      <td className='td-primary'>{r.dfsp_id}</td>
                      <td>{r.currency}</td>
                      <td>
                        {parseFloat(r.total_sent || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        {parseFloat(r.total_received || 0).toLocaleString(
                          'en-US',
                          { minimumFractionDigits: 2 },
                        )}
                      </td>
                      <td
                        style={{
                          color:
                            parseFloat(r.net_position) >= 0
                              ? 'var(--green)'
                              : 'var(--red)',
                          fontWeight: 700,
                        }}
                      >
                        {parseFloat(r.net_position || 0).toLocaleString(
                          'en-US',
                          { minimumFractionDigits: 2, signDisplay: 'always' },
                        )}
                      </td>
                      <td style={{ color: 'var(--green)' }}>
                        {fmt.number(r.matched)}
                      </td>
                      <td
                        style={{
                          color:
                            r.unmatched > 0
                              ? 'var(--red)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {fmt.number(r.unmatched)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ height: '3.5rem' }}></div>
      </div>
    </div>
  );
}
