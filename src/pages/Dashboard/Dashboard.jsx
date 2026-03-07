import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboardSummary,
  getDfspPositions,
  getNotifications,
} from '../../services/api';
import { fmt } from '../../utils/format';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getDfspPositions(),
      getNotifications({ limit: 5 }),
    ])
      .then(([d, p, n]) => {
        setData(d.data);
        setPositions(p.data.data || []);
        setNotifs(n.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className='loading-screen'>
        <div className='spinner' /> Loading dashboard...
      </div>
    );

  const summary = data?.summary || {};
  const hourly = data?.hourly || [];
  const volumes = data?.volumes || [];
  const topDfsps = data?.topDfsps || [];

  const PIE_COLORS = ['#00e5a0', '#ff4757', '#ffd32a', '#00d4ff', '#9c88ff'];

  const pieData = [
    { name: 'Committed', value: parseInt(summary.committed) || 0 },
    { name: 'Failed', value: parseInt(summary.failed) || 0 },
    { name: 'Timeout', value: parseInt(summary.timeout) || 0 },
    { name: 'Received', value: parseInt(summary.received) || 0 },
  ].filter((d) => d.value > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
          {label}
        </div>
        {payload.map((p) => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Dashboard</div>
          <div className='page-subtitle'>Real-time Hub Overview</div>
        </div>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {new Date().toLocaleString()}
        </span>
      </div>

      <div className='page-content'>
        {/* ── Transfer Stats ── */}
        <div className='stat-grid'>
          <div className='stat-card blue'>
            <div className='stat-label'>Total Transfers</div>
            <div className='stat-value blue'>{fmt.number(summary.total)}</div>
            <div className='stat-meta'>All time</div>
          </div>
          <div className='stat-card green'>
            <div className='stat-label'>Committed</div>
            <div className='stat-value green'>
              {fmt.number(summary.committed)}
            </div>
            <div className='stat-meta'>
              Success rate: {fmt.percent(summary.success_rate)}
            </div>
          </div>
          <div className='stat-card red'>
            <div className='stat-label'>Failed</div>
            <div className='stat-value red'>{fmt.number(summary.failed)}</div>
            <div className='stat-meta'>Errors</div>
          </div>
          <div className='stat-card yellow'>
            <div className='stat-label'>Timeout</div>
            <div className='stat-value yellow'>
              {fmt.number(summary.timeout)}
            </div>
            <div className='stat-meta'>Expired</div>
          </div>
          <div className='stat-card purple'>
            <div className='stat-label'>Success Rate</div>
            <div className='stat-value purple'>
              {fmt.percent(summary.success_rate)}
            </div>
            <div className='stat-meta'>Committed / Total</div>
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className='grid-2' style={{ marginBottom: 16 }}>
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Transfer Volume (24h)</span>
            </div>
            <ResponsiveContainer width='100%' height={180}>
              <AreaChart
                data={hourly}
                margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id='gS' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#00e5a0' stopOpacity={0.3} />
                    <stop offset='100%' stopColor='#00e5a0' stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id='gF' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#ff4757' stopOpacity={0.3} />
                    <stop offset='100%' stopColor='#ff4757' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey='hour'
                  tick={{
                    fontSize: 9,
                    fill: '#445566',
                    fontFamily: 'var(--font-mono)',
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v ? v.split(' ')[1] : '')}
                />
                <YAxis
                  tick={{
                    fontSize: 9,
                    fill: '#445566',
                    fontFamily: 'var(--font-mono)',
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type='monotone'
                  dataKey='success'
                  stroke='#00e5a0'
                  fill='url(#gS)'
                  strokeWidth={2}
                  name='Success'
                />
                <Area
                  type='monotone'
                  dataKey='failed'
                  stroke='#ff4757'
                  fill='url(#gF)'
                  strokeWidth={2}
                  name='Failed'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Status Distribution</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width='50%' height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx='50%'
                    cy='50%'
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey='value'
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {pieData.map((d, i) => (
                  <div
                    key={d.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: PIE_COLORS[i],
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {d.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                      }}
                    >
                      {fmt.number(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DFSP Positions + Volume ── */}
        <div className='grid-2' style={{ marginBottom: 16 }}>
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>DFSP Liquidity</span>
              <button
                className='btn btn-secondary'
                style={{ padding: '3px 8px', fontSize: 10 }}
                onClick={() => navigate('/positions')}
              >
                View All
              </button>
            </div>
            {positions.length === 0 ? (
              <div className='empty-state' style={{ padding: 20 }}>
                <div className='empty-desc'>No position data yet</div>
              </div>
            ) : (
              positions.slice(0, 5).map((p, i) => {
                const cap = parseFloat(p.net_debit_cap || 0);
                const used =
                  parseFloat(p.current_position || 0) +
                  parseFloat(p.reserved_amount || 0);
                const usagePct =
                  cap > 0 ? Math.min((used / cap) * 100, 100) : 0;
                const color =
                  usagePct > 80
                    ? 'var(--red)'
                    : usagePct > 60
                      ? 'var(--yellow)'
                      : 'var(--green)';

                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {p.dfsp_id}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: color,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {parseFloat(p.available || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        {p.currency} avail
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: 'var(--border)',
                        borderRadius: 3,
                      }}
                    >
                      <div
                        style={{
                          width: `${usagePct}%`,
                          height: '100%',
                          background: color,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Volume by Currency</span>
            </div>
            <ResponsiveContainer width='100%' height={160}>
              <BarChart
                data={volumes}
                margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
              >
                <XAxis
                  dataKey='currency'
                  tick={{
                    fontSize: 10,
                    fill: '#8899aa',
                    fontFamily: 'var(--font-mono)',
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 9,
                    fill: '#445566',
                    fontFamily: 'var(--font-mono)',
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey='total_volume'
                  fill='#00d4ff'
                  radius={[3, 3, 0, 0]}
                  name='Volume'
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Recent Notifications + Top DFSPs ── */}
        <div className='grid-2'>
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Recent Notifications</span>
              <button
                className='btn btn-secondary'
                style={{ padding: '3px 8px', fontSize: 10 }}
                onClick={() => navigate('/notifications')}
              >
                View All
              </button>
            </div>
            {notifs.length === 0 ? (
              <div className='empty-state' style={{ padding: 20 }}>
                <div className='empty-desc'>No notifications yet</div>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span
                    className={`badge ${n.transfer_state}`}
                    style={{ flexShrink: 0 }}
                  >
                    {n.transfer_state || 'EVENT'}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    → {n.to_fsp}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0,
                    }}
                  >
                    {fmt.datetime(n.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Top DFSPs by Volume</span>
            </div>
            {topDfsps.length === 0 ? (
              <div className='empty-state' style={{ padding: 20 }}>
                <div className='empty-desc'>No data yet</div>
              </div>
            ) : (
              topDfsps.map((d, i) => (
                <div
                  key={d.dfsp}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      width: 16,
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {d.dfsp}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {fmt.number(d.sent)} tx
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: 18 }}></div>
        </div>
      </div>
    </div>
  );
}
