/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import { useState, useEffect } from 'react';
import api from '../../services/api';
import { fmt } from '../../utils/format';

const STATUS_COLORS = {
  ok: 'COMMITTED',
  commit: 'COMMITTED',
  prepare: 'TIMEOUT',
  abort: 'FAILED',
  failed: 'FAILED',
};

export default function SettlementFinalizeRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    window_id: '',
    settlement_id: '',
    dfsp_name: '',
    date_from: '',
    date_to: '',
    status: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await api.get('/settlement/finalize-records', { params });
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

  const totalCredit = records
    .filter((r) => r.type === 'credit' && r.status !== 'failed')
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const totalDebit = records
    .filter(
      (r) => r.type === 'debit' && (r.status === 'commit' || r.status === 'ok'),
    )
    .reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>Settlement Finalize Records</div>
          <div className='page-subtitle'>
            Liquidity management — debit / credit history per window
          </div>
        </div>
        <div className='header-actions'>
          <button className='btn btn-secondary' onClick={load}>
            ↺ Refresh
          </button>
          <button className='btn btn-primary' onClick={load}>
            Search
          </button>
        </div>
      </div>

      <div style={{ padding: 28 }}>
        {/* Filters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div className='input-group'>
            <label className='input-label'>Type</label>
            <select
              className='select w-full'
              value={filters.type}
              onChange={f('type')}
            >
              <option value=''>All</option>
              <option value='credit'>Credit</option>
              <option value='debit'>Debit</option>
            </select>
          </div>
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
            <label className='input-label'>Status</label>
            <select
              className='select w-full'
              value={filters.status}
              onChange={f('status')}
            >
              <option value=''>All</option>
              <option value='ok'>OK</option>
              <option value='prepare'>Prepare</option>
              <option value='commit'>Commit</option>
              <option value='abort'>Abort</option>
              <option value='failed'>Failed</option>
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

        {/*  Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            {
              label: 'Total Records',
              value: records.length,
              color: 'var(--accent)',
            },
            {
              label: 'Total Credit',
              value: `+${totalCredit.toFixed(2)} BDT`,
              color: 'var(--green)',
            },
            {
              label: 'Total Debit',
              value: `-${totalDebit.toFixed(2)} BDT`,
              color: 'var(--red)',
            },
          ].map((s) => (
            <div key={s.label} className='card'>
              <div className='card-body' style={{ padding: '12px 16px' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
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
                <th>Type</th>
                <th>Action</th>
                <th>Amount</th>
                <th>Before</th>
                <th>After</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11}>
                    <div className='loading-screen'>Loading...</div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className='empty-state'>
                      <div className='empty-title'>
                        No finalize records found
                      </div>
                      <div className='empty-desc'>
                        Run settlement finalization to see records here
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
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
                    <td>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            r.type === 'credit'
                              ? 'var(--green)22'
                              : 'var(--red)22',
                          color:
                            r.type === 'credit' ? 'var(--green)' : 'var(--red)',
                        }}
                      >
                        {r.type === 'credit' ? '↑ Credit' : '↓ Debit'}
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {r.action}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        fontWeight: 700,
                        color:
                          r.type === 'credit' ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {r.type === 'credit' ? '+' : '-'}
                      {parseFloat(r.amount || 0).toFixed(2)} {r.currency}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {r.before_amount != null
                        ? parseFloat(r.before_amount).toFixed(2)
                        : '—'}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {r.after_amount != null
                        ? parseFloat(r.after_amount).toFixed(2)
                        : '—'}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_COLORS[r.status] || 'TIMEOUT'}`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
