import { useState, useEffect, useCallback } from 'react';
import { getDfsps } from '../../services/api';
import api from '../../services/api';
import { fmt } from '../../utils/format';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All States' },
  { value: 'COMMITTED', label: 'Committed' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'RECEIVED', label: 'Prepared' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'TIMEOUT', label: 'Timeout' },
];

const DIRECTION_OPTIONS = [
  { value: '', label: 'All Transactions' },
  { value: 'SEND', label: '↑ Send Only' },
  { value: 'RECEIVE', label: '↓ Receive Only' },
];

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'custom', label: 'Custom Range' },
];

const STATUS_BADGE = {
  COMMITTED: { bg: 'var(--green)', label: 'COMMITTED' },
  RESERVED: { bg: 'var(--yellow)', label: 'RESERVED' },
  RECEIVED: { bg: 'var(--accent)', label: 'PREPARED' },
  FAILED: { bg: 'var(--red)', label: 'FAILED' },
  TIMEOUT: { bg: '#888', label: 'TIMEOUT' },
};

export default function Reports() {
  const [dfsps, setDfsps] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generated, setGenerated] = useState(false);

  const [filters, setFilters] = useState({
    date_preset: 'today',
    from: '',
    to: '',
    dfsp: '',
    direction: '',
    status: 'ALL',
  });

  useEffect(() => {
    getDfsps()
      .then((r) => setDfsps(r.data.data || []))
      .catch(() => {});
  }, []);

  const f = (k) => (v) => setFilters((prev) => ({ ...prev, [k]: v }));
  const fE = (k) => (e) => f(k)(e.target.value);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (filters.date_preset !== 'custom') {
      p.set('date_preset', filters.date_preset);
    } else {
      if (filters.from) p.set('from', filters.from);
      if (filters.to) p.set('to', filters.to);
    }
    if (filters.dfsp) p.set('dfsp', filters.dfsp);
    if (filters.direction) p.set('direction', filters.direction);
    if (filters.status && filters.status !== 'ALL')
      p.set('status', filters.status);
    return p.toString();
  }, [filters]);

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      const res = await api.get(`/reports/data?${buildParams()}`);
      setData(res.data);
      setGenerated(true);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || '/api/v1'}/reports/export?${buildParams()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `r-switch-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export error: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const s = data?.summary;

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Reports</div>
          <div className='page-subtitle'>
            Generate and export transfer reports
          </div>
        </div>
        {generated && (
          <div className='header-actions'>
            <button
              className='btn btn-secondary'
              onClick={handleGenerate}
              disabled={loading}
            >
              ↺ Refresh
            </button>
            <button
              className='btn btn-primary'
              onClick={handleExport}
              disabled={exporting}
              style={{
                background: 'var(--green)',
                borderColor: 'var(--green)',
                color: '#000',
              }}
            >
              {exporting ? 'Exporting...' : '⬇ Export Excel'}
            </button>
          </div>
        )}
      </div>

      <div className='page-content'>
        <div className='card' style={{ marginBottom: 16 }}>
          <div className='card-header'>
            <span className='card-title'>Report Filters</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div className='input-group'>
              <label className='input-label'>Date Range</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => f('date_preset')(p.value)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      borderRadius: 5,
                      cursor: 'pointer',
                      border: `1px solid ${filters.date_preset === p.value ? 'var(--accent)' : 'var(--border)'}`,
                      background:
                        filters.date_preset === p.value
                          ? 'var(--accent)22'
                          : 'var(--bg-hover)',
                      color:
                        filters.date_preset === p.value
                          ? 'var(--accent)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {filters.date_preset === 'custom' && (
              <>
                <div className='input-group'>
                  <label className='input-label'>From Date</label>
                  <input
                    className='input w-full'
                    type='date'
                    value={filters.from}
                    onChange={fE('from')}
                  />
                </div>
                <div className='input-group'>
                  <label className='input-label'>To Date</label>
                  <input
                    className='input w-full'
                    type='date'
                    value={filters.to}
                    onChange={fE('to')}
                  />
                </div>
              </>
            )}

            {/* DFSP */}
            <div className='input-group'>
              <label className='input-label'>DFSP</label>
              <select
                className='select w-full'
                value={filters.dfsp}
                onChange={fE('dfsp')}
              >
                <option value=''>All DFSPs</option>
                {dfsps.map((d) => (
                  <option key={d.dfsp_id} value={d.dfsp_id}>
                    {d.name} ({d.dfsp_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Direction */}
            <div className='input-group'>
              <label className='input-label'>Direction</label>
              <select
                className='select w-full'
                value={filters.direction}
                onChange={fE('direction')}
              >
                {DIRECTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className='input-group'>
              <label className='input-label'>Status</label>
              <select
                className='select w-full'
                value={filters.status}
                onChange={fE('status')}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            className='btn btn-primary'
            onClick={handleGenerate}
            disabled={loading}
            style={{ width: 'fit-content', padding: '10px', fontSize: 13 }}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {s && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              {
                label: 'Total',
                value: fmt.number(s.total),
                color: 'var(--accent)',
              },
              {
                label: 'Committed',
                value: fmt.number(s.committed),
                color: 'var(--green)',
              },
              {
                label: 'Reserved',
                value: fmt.number(s.reserved),
                color: 'var(--yellow)',
              },
              {
                label: 'Prepared',
                value: fmt.number(s.prepared),
                color: '#0af',
              },
              {
                label: 'Failed',
                value: fmt.number(s.failed),
                color: 'var(--red)',
              },
              { label: 'Timeout', value: fmt.number(s.timeout), color: '#888' },
              {
                label: 'Total Amt',
                value: parseFloat(s.total_amount || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                }),
                color: 'var(--green)',
              },
            ].map((item) => (
              <div
                key={item.label}
                className='card'
                style={{ padding: '12px 14px', textAlign: 'center' }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: item.color,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginTop: 3,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Data Table ── */}
        {generated && data && (
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Transfer Records</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {data.count} records
                </span>
                <button
                  className='btn btn-primary'
                  onClick={handleExport}
                  disabled={exporting}
                  style={{
                    padding: '4px 12px',
                    fontSize: 11,
                    background: 'var(--green)',
                    borderColor: 'var(--green)',
                    color: '#000',
                  }}
                >
                  {exporting ? '...' : '⬇ Excel'}
                </button>
              </div>
            </div>

            {data.data.length === 0 ? (
              <div className='empty-state'>
                <div className='empty-title'>No transfers found</div>
                <div className='empty-desc'>Try different filters</div>
              </div>
            ) : (
              <div
                className='table-wrap'
                style={{ marginTop: 0, maxHeight: 520, overflowY: 'auto' }}
              >
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Transfer ID</th>
                      <th>Payer</th>
                      <th>Payee</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((t, idx) => {
                      const badge = STATUS_BADGE[t.status] || {
                        bg: '#444',
                        label: t.status,
                      };
                      return (
                        <tr key={t.transfer_id}>
                          <td
                            style={{ color: 'var(--text-muted)', fontSize: 10 }}
                          >
                            {idx + 1}
                          </td>
                          <td
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.transfer_id}
                          </td>
                          <td className='td-accent'>{t.payer_fsp}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {t.payee_fsp}
                          </td>
                          <td
                            style={{
                              fontFamily: 'var(--font-mono)',
                              textAlign: 'right',
                              fontWeight: 600,
                            }}
                          >
                            {parseFloat(t.amount || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                            <span
                              style={{
                                fontSize: 9,
                                color: 'var(--text-muted)',
                                marginLeft: 3,
                              }}
                            >
                              {t.currency}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                background: badge.bg + '22',
                                color: badge.bg,
                                padding: '2px 7px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                border: `1px solid ${badge.bg}44`,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ fontSize: 11 }}>
                            {fmt.datetime(t.created_at)}
                          </td>
                          <td
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {t.duration_sec != null
                              ? `${parseFloat(t.duration_sec).toFixed(1)}s`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!generated && !loading && (
          <div className='card'>
            <div className='empty-state' style={{ padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}></div>
              <div className='empty-title'>
                Select filters and generate report
              </div>
              <div className='empty-desc'>
                Reports can be viewed in browser or exported as Excel
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
