/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransfers } from '../../services/api';
import { fmt } from '../../utils/format';
import './t.css';

const STATUSES = [
  '',
  'RECEIVED',
  'RESERVED',
  'COMMITTED',
  'FAILED',
  'TIMEOUT',
  'ABORTED',
  'CANCELLED',
];

export default function Transactions() {
  const [transfers, setTransfers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    from: '',
    to: '',
    page: 1,
    limit: 20,
  });
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== ''),
    );
    getTransfers(params)
      .then((r) => {
        setTransfers(r.data.data);
        setMeta({
          total: r.data.total,
          page: r.data.page,
          pages: r.data.pages,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key, val) =>
    setFilters((f) => ({ ...f, [key]: val, page: 1 }));
  const setPage = (p) => setFilters((f) => ({ ...f, page: p }));

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Transactions</div>
          <div className='page-subtitle'>
            {fmt.number(meta.total)} total records
          </div>
        </div>
        <div className='header-actions'>
          <button className='btn btn-secondary' onClick={load}>
            <RefreshIcon /> Refresh
          </button>
        </div>
      </div>

      <div className='page-content'>
        {/* Filters */}
        <div className='filter-bar'>
          <div className='input-group'>
            <label className='input-label'>Status</label>
            <select
              className='select'
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || 'All Statuses'}
                </option>
              ))}
            </select>
          </div>
          <div className='input-group'>
            <label className='input-label'>Transfer ID</label>
            <input
              className='input'
              placeholder='Search transfer ID...'
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              style={{ width: 220 }}
            />
          </div>
          <div className='input-group'>
            <label className='input-label'>From</label>
            <input
              className='input'
              type='date'
              value={filters.from}
              onChange={(e) => setFilter('from', e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label className='input-label'>To</label>
            <input
              className='input'
              type='date'
              value={filters.to}
              onChange={(e) => setFilter('to', e.target.value)}
            />
          </div>
          <button
            className='btn btn-secondary'
            onClick={() =>
              setFilters({
                status: '',
                search: '',
                from: '',
                to: '',
                page: 1,
                limit: 20,
              })
            }
          >
            Clear
          </button>
        </div>

        {/* Table */}
        <div className='table-wrap'>
          <table>
            <thead>
              <tr>
                <th>Transfer ID</th>
                <th>Payer FSP</th>
                <th>Payee FSP</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Created</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className='loading-screen'>Loading...</div>
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className='empty-state'>
                      <div className='empty-title'>No transfers found</div>
                      <div className='empty-desc'>
                        Try adjusting your filters
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/transactions/${t.transfer_id}`)}
                  >
                    <td className='td-accent mono'>
                      {fmt.truncate(t.transfer_id, 24)}
                    </td>
                    <td className='td-primary'>{t.payer_fsp || '—'}</td>
                    <td>{t.payee_fsp || '—'}</td>
                    <td className='td-primary'>
                      {t.amount
                        ? parseFloat(t.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })
                        : '—'}
                    </td>
                    <td>{t.currency || '—'}</td>
                    <td>
                      <span className={`badge ${t.status}`}>{t.status}</span>
                    </td>
                    <td>{fmt.datetime(t.created_at)}</td>
                    <td>{fmt.datetime(t.completed_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className='pagination'>
            <div className='pagination-info'>
              Showing {(meta.page - 1) * filters.limit + 1}–
              {Math.min(meta.page * filters.limit, meta.total)} of{' '}
              {fmt.number(meta.total)}
            </div>
            <div className='pagination-controls'>
              <button
                className='page-btn'
                disabled={meta.page <= 1}
                onClick={() => setPage(meta.page - 1)}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, meta.pages) }, (_, i) => {
                const p = Math.max(1, meta.page - 2) + i;
                if (p > meta.pages) return null;
                return (
                  <button
                    key={p}
                    className={`page-btn${p === meta.page ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className='page-btn'
                disabled={meta.page >= meta.pages}
                onClick={() => setPage(meta.page + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <polyline points='23 4 23 10 17 10' />
      <path d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10' />
    </svg>
  );
}
