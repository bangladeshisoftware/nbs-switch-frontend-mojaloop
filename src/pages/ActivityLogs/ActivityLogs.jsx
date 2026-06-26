/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const TYPE_COLOR = { switch: '#00ff88', dfsp: '#0099ff' };
const TYPE_BG = { switch: '#001a0a', dfsp: '#00091a' };

function StatCard({ label, value, color = 'var(--accent)' }) {
  return (
    <div className='stat-card'>
      <div className='stat-value' style={{ color }}>
        {value ?? '—'}
      </div>
      <div className='stat-label'>{label}</div>
    </div>
  );
}

function Badge({ type }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1,
        background: TYPE_BG[type] || '#1a1a1a',
        color: TYPE_COLOR[type] || '#888',
        border: `1px solid ${TYPE_COLOR[type] || '#333'}`,
        textTransform: 'uppercase',
      }}
    >
      {type}
    </span>
  );
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const LIMIT = 30;

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/activity-logs/stats');
      setStats(res.data.stats);
      setDaily(res.data.daily || []);
    } catch (_) {}
  }, []);

  const fetchLogs = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: p, limit: LIMIT });
        if (filterType) params.append('type', filterType);
        if (filterUsername) params.append('username', filterUsername);
        if (filterFrom) params.append('from', filterFrom);
        if (filterTo) params.append('to', filterTo);
        const res = await api.get(`/activity-logs?${params}`);
        setLogs(res.data.data || []);
        setTotal(res.data.total || 0);
        setPage(p);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    },
    [filterType, filterUsername, filterFrom, filterTo],
  );

  useEffect(() => {
    fetchStats();
    fetchLogs(1);
  }, []);

  const handleSearch = () => fetchLogs(1);
  const handleReset = () => {
    setFilterType('');
    setFilterUsername('');
    setFilterFrom('');
    setFilterTo('');
    setTimeout(() => fetchLogs(1), 50);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className='page'>
      {/* Header */}
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Activity Logs</h1>
          <p style={{ fontSize: 10, color: '#606060' }}>
            LOGIN · SESSIONS · TRACKING
          </p>
        </div>
        <button
          className='btn btn-secondary btn-sm'
          onClick={() => {
            fetchStats();
            fetchLogs(page);
          }}
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className='stats-grid' style={{ marginBottom: 0, padding: 12 }}>
          <StatCard
            label='Total Logins'
            value={Number(stats.total).toLocaleString()}
          />
          <StatCard
            label='Today'
            value={Number(stats.today).toLocaleString()}
            color='#ffcc00'
          />
          <StatCard
            label='Switch Logins'
            value={Number(stats.switch_logins).toLocaleString()}
            color='#00ff88'
          />
          <StatCard
            label='DFSP Logins'
            value={Number(stats.dfsp_logins).toLocaleString()}
            color='#0099ff'
          />
          <StatCard
            label='Unique Users'
            value={Number(stats.unique_users).toLocaleString()}
            color='#aa55ff'
          />
          <StatCard
            label='Unique IPs'
            value={Number(stats.unique_ips).toLocaleString()}
            color='#ff8800'
          />
        </div>
      )}

      <div style={{ padding: 12 }}>
        {/* Filters */}
        <div
          className='card'
          style={{ marginBottom: 16, padding: '12px 16px' }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: '1 1 120px' }}>
              <label className='field-label'>TYPE</label>&nbsp;&nbsp;&nbsp;
              <select
                className='select'
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value=''>All</option>
                <option value='switch'>Switch</option>
                <option value='dfsp'>DFSP</option>
              </select>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label className='field-label'>USERNAME</label>&nbsp;&nbsp;&nbsp;
              <input
                className='input'
                value={filterUsername}
                onChange={(e) => setFilterUsername(e.target.value)}
                placeholder='Search...'
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className='field-label'>FROM</label>&nbsp;&nbsp;&nbsp;
              <input
                className='input'
                type='datetime-local'
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className='field-label'>TO</label>&nbsp;&nbsp;&nbsp;
              <input
                className='input'
                type='datetime-local'
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className='btn btn-primary btn-sm' onClick={handleSearch}>
                Search
              </button>
              <button
                className='btn btn-secondary btn-sm'
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className='card' style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span className='section-title'>
              {loading ? 'Loading...' : `${total.toLocaleString()} records`}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  className='btn btn-secondary btn-sm'
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  ←
                </button>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  className='btn btn-secondary btn-sm'
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  →
                </button>
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className='table'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>IP Address</th>
                  <th>Location</th>
                  <th>Login Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: 'center',
                        padding: 40,
                        color: 'var(--text4)',
                      }}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: 'center',
                        padding: 40,
                        color: 'var(--text4)',
                      }}
                    >
                      No logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => (
                    <tr key={log.id || i}>
                      <td style={{ color: 'var(--text4)', fontSize: 10 }}>
                        {(page - 1) * LIMIT + i + 1}
                      </td>
                      <td>
                        <Badge type={log.type} />
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--mono)',
                          fontWeight: 600,
                          color: TYPE_COLOR[log.type] || 'var(--text2)',
                        }}
                      >
                        {log.username}
                      </td>
                      <td style={{ color: 'var(--text3)', fontSize: 11 }}>
                        {log.email}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                        {log.ip_address}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {log.location || '—'}
                      </td>
                      <td
                        style={{
                          fontSize: 11,
                          color: 'var(--text4)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(log.login_time).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
