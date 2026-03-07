import { useState, useEffect } from 'react';
import {
  getSettlementWindows,
  getSettlementPositions,
  openSettlementWindow,
  closeSettlementWindow,
} from '../../services/api';
import { fmt } from '../../utils/format';

export default function Settlement() {
  const [windows, setWindows] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('positions');

  const load = () => {
    setLoading(true);
    Promise.all([getSettlementWindows(), getSettlementPositions()])
      .then(([w, p]) => {
        setWindows(w.data.data);
        setPositions(p.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenWindow = async () => {
    try {
      await openSettlementWindow();
      alert('✅ Settlement window opened');
      load();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCloseWindow = async (id) => {
    if (!window.confirm('Close this settlement window?')) return;
    try {
      await closeSettlementWindow(id);
      load();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Settlement</div>
          <div className='page-subtitle'>
            Net positions and settlement windows
          </div>
        </div>
        <div className='header-actions'>
          <button className='btn btn-primary' onClick={handleOpenWindow}>
            + Open Window
          </button>
        </div>
      </div>

      <div className='page-content'>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {['positions', 'windows'].map((t) => (
            <button
              key={t}
              className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t)}
            >
              {t === 'positions' ? 'Net Positions' : 'Settlement Windows'}
            </button>
          ))}
        </div>

        {tab === 'positions' && (
          <div className='table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>DFSP</th>
                  <th>Currency</th>
                  <th>Total Sent</th>
                  <th>Total Received</th>
                  <th>Net Position</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className='loading-screen'>Loading...</div>
                    </td>
                  </tr>
                ) : positions.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className='empty-state'>
                        <div className='empty-title'>No position data</div>
                        <div className='empty-desc'>
                          Transactions will appear here once committed
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  positions.map((p, i) => {
                    const net = parseFloat(p.net_position || 0);
                    return (
                      <tr key={i}>
                        <td className='td-primary'>{p.dfsp}</td>
                        <td>{p.currency}</td>
                        <td>
                          {parseFloat(p.total_sent || 0).toLocaleString(
                            'en-US',
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td>
                          {parseFloat(p.total_received || 0).toLocaleString(
                            'en-US',
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td
                          style={{
                            color: net >= 0 ? 'var(--green)' : 'var(--red)',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {net.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            signDisplay: 'always',
                          })}
                        </td>
                        <td>
                          <span
                            className='badge'
                            style={{
                              background:
                                net >= 0
                                  ? 'var(--green-dim)'
                                  : 'var(--red-dim)',
                              color: net >= 0 ? 'var(--green)' : 'var(--red)',
                            }}
                          >
                            {net >= 0 ? 'CREDIT' : 'DEBIT'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'windows' && (
          <div className='table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>Window ID</th>
                  <th>Status</th>
                  <th>Opened At</th>
                  <th>Closed At</th>
                  <th>Settled At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className='loading-screen'>Loading...</div>
                    </td>
                  </tr>
                ) : windows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className='empty-state'>
                        <div className='empty-title'>No windows yet</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  windows.map((w) => (
                    <tr key={w.id}>
                      <td className='td-accent'>
                        {fmt.truncate(w.window_id, 20)}
                      </td>
                      <td>
                        <span className={`badge ${w.status}`}>{w.status}</span>
                      </td>
                      <td>{fmt.datetime(w.opened_at)}</td>
                      <td>{fmt.datetime(w.closed_at)}</td>
                      <td>{fmt.datetime(w.settled_at)}</td>
                      <td>
                        {w.status === 'OPEN' && (
                          <button
                            className='btn btn-danger'
                            style={{ padding: '4px 10px', fontSize: 10 }}
                            onClick={() => handleCloseWindow(w.window_id)}
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
