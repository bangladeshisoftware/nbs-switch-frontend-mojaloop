import { useState, useEffect } from 'react';
import {
  getDfspPositions,
  getPositionChanges,
  getDfspLimits,
  setDfspLimit,
} from '../../services/api';
import { fmt } from '../../utils/format';

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [changes, setChanges] = useState([]);
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('changes');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    dfsp_id: '',
    limit_type: 'NET_DEBIT_CAP',
    currency: '',
    value: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      getDfspPositions(),
      getPositionChanges({ limit: 50 }),
      getDfspLimits(),
    ])
      .then(([p, c, l]) => {
        setPositions(p.data.data || []);
        setChanges(c.data.data || []);
        setLimits(l.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSetLimit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDfspLimit(form);
      setModal(false);
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const CHANGE_COLOR = {
    RESERVE: 'var(--yellow)',
    COMMIT: 'var(--green)',
    ROLLBACK: 'var(--red)',
    DEPOSIT: 'var(--accent)',
    SETTLEMENT: 'var(--purple)',
  };

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Positions Change History</div>
          <div className='page-subtitle'>
            Real-time liquidity & position tracking
          </div>
        </div>
        <div className='header-actions'>
          <button className='btn btn-secondary' onClick={load}>
            Refresh
          </button>
          <button className='btn btn-primary' onClick={() => setModal(true)}>
            Set Limit
          </button>
        </div>
      </div>

      <div className='page-content'>
        {/* Tabs */}
        {/* <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {[
            { key: 'positions', label: 'Current Positions' },
            { key: 'changes',   label: 'Position Changes' },
            { key: 'limits',    label: 'Limit History' },
          ].map(t => (
            <button key={t.key}
              className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div> */}

        {/*  CURRENT POSITIONS  */}
        {tab === 'positions' && (
          <>
            {/* Summary Cards */}
            <div className='stat-grid' style={{ marginBottom: 16 }}>
              <div className='stat-card blue'>
                <div className='stat-label'>Total DFSPs</div>
                <div className='stat-value blue'>{positions.length}</div>
              </div>
              <div className='stat-card yellow'>
                <div className='stat-label'>Total Reserved</div>
                <div className='stat-value yellow'>
                  {positions
                    .reduce((s, p) => s + parseFloat(p.reserved_amount || 0), 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className='stat-card green'>
                <div className='stat-label'>Total Available</div>
                <div className='stat-value green'>
                  {positions
                    .reduce((s, p) => s + parseFloat(p.available || 0), 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className='stat-card red'>
                <div className='stat-label'>Total Committed</div>
                <div className='stat-value red'>
                  {positions
                    .reduce(
                      (s, p) => s + parseFloat(p.current_position || 0),
                      0,
                    )
                    .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className='table-wrap'>
              <table>
                <thead>
                  <tr>
                    <th>DFSP</th>
                    <th>Currency</th>
                    <th>Net Debit Cap</th>
                    <th>Current Position</th>
                    <th>Reserved</th>
                    <th>Available</th>
                    <th>Usage %</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7}>
                        <div className='loading-screen'>Loading...</div>
                      </td>
                    </tr>
                  ) : positions.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className='empty-state'>
                          <div className='empty-title'>
                            No position data yet
                          </div>
                          <div className='empty-desc'>
                            Data will appear after first transfer
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    positions.map((p, i) => {
                      const cap = parseFloat(p.net_debit_cap || 0);
                      const current = parseFloat(p.current_position || 0);
                      const reserved = parseFloat(p.reserved_amount || 0);
                      const available = parseFloat(
                        p.available || cap - current - reserved,
                      );
                      const usagePct =
                        cap > 0
                          ? (((current + reserved) / cap) * 100).toFixed(1)
                          : 0;
                      const usageColor =
                        usagePct > 80
                          ? 'var(--red)'
                          : usagePct > 60
                            ? 'var(--yellow)'
                            : 'var(--green)';

                      return (
                        <tr key={i}>
                          <td className='td-primary'>
                            {p.dfsp_name || p.dfsp_id}
                          </td>
                          <td>{p.currency}</td>
                          <td style={{ color: 'var(--accent)' }}>
                            {cap.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td style={{ color: 'var(--red)' }}>
                            {current.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td style={{ color: 'var(--yellow)' }}>
                            {reserved.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            style={{ color: 'var(--green)', fontWeight: 700 }}
                          >
                            {available.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: 6,
                                  background: 'var(--border)',
                                  borderRadius: 3,
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(usagePct, 100)}%`,
                                    height: '100%',
                                    background: usageColor,
                                    borderRadius: 3,
                                    transition: 'width 0.3s',
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: usageColor,
                                  fontFamily: 'var(--font-mono)',
                                  width: 38,
                                }}
                              >
                                {usagePct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/*  POSITION CHANGES  */}
        {tab === 'changes' && (
          <div className='table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>Transfer ID</th>
                  <th>DFSP</th>
                  <th>Currency</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className='loading-screen'>Loading...</div>
                    </td>
                  </tr>
                ) : changes.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className='empty-state'>
                        <div className='empty-title'>No changes yet</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  changes.map((c) => (
                    <tr key={c.id}>
                      <td className='td-accent'>
                        {fmt.truncate(c.transfer_id, 20)}
                      </td>
                      <td className='td-primary'>{c.dfsp_id}</td>
                      <td>{c.currency}</td>
                      <td>
                        <span
                          className='badge'
                          style={{
                            background: `${CHANGE_COLOR[c.change_type]}22`,
                            color: CHANGE_COLOR[c.change_type],
                          }}
                        >
                          {c.change_type}
                        </span>
                      </td>
                      <td
                        style={{
                          color: CHANGE_COLOR[c.change_type],
                          fontWeight: 700,
                        }}
                      >
                        {parseFloat(c.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {parseFloat(c.position_before || 0).toLocaleString(
                          'en-US',
                          { minimumFractionDigits: 2 },
                        )}
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>
                        {parseFloat(c.position_after || 0).toLocaleString(
                          'en-US',
                          { minimumFractionDigits: 2 },
                        )}
                      </td>
                      <td>{fmt.datetime(c.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/*  LIMIT HISTORY */}
        {tab === 'limits' && (
          <div className='table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>DFSP</th>
                  <th>Type</th>
                  <th>Currency</th>
                  <th>Previous Value</th>
                  <th>New Value</th>
                  <th>Changed By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className='loading-screen'>Loading...</div>
                    </td>
                  </tr>
                ) : limits.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className='empty-state'>
                        <div className='empty-title'>No limit changes</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  limits.map((l) => (
                    <tr key={l.id}>
                      <td className='td-primary'>{l.dfsp_id}</td>
                      <td>
                        <span className='badge ACTIVE'>{l.limit_type}</span>
                      </td>
                      <td>{l.currency}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {parseFloat(l.previous_value || 0).toLocaleString(
                          'en-US',
                          { minimumFractionDigits: 2 },
                        )}
                      </td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        {parseFloat(l.value || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td>{l.changed_by}</td>
                      <td>{fmt.datetime(l.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Set Limit Modal */}
      {modal && (
        <div className='modal-overlay' onClick={() => setModal(false)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-title'>Set DFSP Limit</div>
            <form
              onSubmit={handleSetLimit}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div className='input-group'>
                <label className='input-label'>DFSP ID *</label>
                <input
                  className='input w-full'
                  required
                  value={form.dfsp_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dfsp_id: e.target.value }))
                  }
                  placeholder='e.g. payerfsp'
                />
              </div>
              <div className='input-group'>
                <label className='input-label'>Limit Type</label>
                <select
                  className='select w-full'
                  value={form.limit_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, limit_type: e.target.value }))
                  }
                >
                  <option value='NET_DEBIT_CAP'>NET_DEBIT_CAP</option>
                  <option value='DEPOSIT'>DEPOSIT</option>
                </select>
              </div>
              <div className='input-group'>
                <label className='input-label'>Currency *</label>
                <input
                  className='input w-full'
                  required
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  placeholder='e.g. USD'
                  maxLength={3}
                />
              </div>
              <div className='input-group'>
                <label className='input-label'>Value *</label>
                <input
                  className='input w-full'
                  required
                  type='number'
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  placeholder='e.g. 10000.00'
                />
              </div>
              <div className='modal-actions'>
                <button
                  type='button'
                  className='btn btn-secondary'
                  onClick={() => setModal(false)}
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
