/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPisps, createPisp, updatePisp } from '../../services/api';
import { fmt } from '../../utils/format';

const EMPTY_FORM = {
  pisp_id: '',
  name: '',
  short_name: '',
  callback_url: '',
  currency: 'BDT',
  note: '',
  status: 'ACTIVE',
};

export default function PISPManagement() {
  const [pisps, setPisps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getPisps()
      .then((r) => setPisps(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setResult(null);
    setModal('create');
  };

  const openEdit = (p) => {
    setForm({
      pisp_id: p.pisp_id,
      name: p.name || '',
      short_name: p.short_name || '',
      callback_url: p.callback_url || '',
      currency: p.currency || 'BDT',
      note: p.note || '',
      status: p.status || 'ACTIVE',
    });
    setModal(p);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        const res = await createPisp(form);
        setModal(null);
        setResult(res.data);
        load();
      } else {
        await updatePisp(modal.pisp_id, form);
        setModal(null);
        load();
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handlePispIdChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      pisp_id: val,
      short_name: prev.short_name || val,
    }));
  };

  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>PISP Management</div>
          <div className='page-subtitle'>
            {pisps.length} registered PISPs — Payment Initiation Service
            Providers
          </div>
        </div>
        <div className='header-actions'>
          <button className='btn btn-secondary' onClick={load}>
            ↺ Refresh
          </button>
          <button className='btn btn-primary' onClick={openCreate}>
            + Add PISP
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div
        style={{
          margin: '0 0 16px',
          padding: '12px 16px',
          background: '#001a33',
          border: '1px solid #003366',
          borderRadius: 8,
          fontSize: 12,
          color: '#6699cc',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 16 }}>ℹ️</span>
        <div>
          <strong style={{ color: '#99ccff' }}>What is a PISP?</strong> — A
          Payment Initiation Service Provider (e.g. e-commerce site, payment
          app) that initiates transfers on behalf of customers. PISP never holds
          funds — it just triggers payments from customer's DFSP account via
          Mojaloop Hub.
        </div>
      </div>

      <div className='page-content'>
        <div className='table-wrap'>
          <table>
            <thead>
              <tr>
                <th>PISP ID</th>
                <th>Name</th>
                <th>Currency</th>
                <th>Callback URL</th>
                <th>Note</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className='loading-screen'>Loading...</div>
                  </td>
                </tr>
              ) : pisps.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className='empty-state'>
                      <div className='empty-title'>No PISPs registered</div>
                      <div className='empty-desc'>
                        Click "+ Add PISP" to register a Payment Initiation
                        Service Provider
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                pisps.map((p) => (
                  <tr
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/pisps/${p.pisp_id}`)}
                  >
                    <td className='td-accent'>{p.pisp_id}</td>
                    <td className='td-primary'>{p.name}</td>
                    <td>
                      <span
                        style={{
                          background: 'var(--accent)22',
                          color: 'var(--accent)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {p.currency || '—'}
                      </span>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <span
                        style={{
                          display: 'block',
                          maxWidth: 210,
                          fontSize: 11,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: p.callback_url
                            ? 'var(--text-secondary)'
                            : 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {p.callback_url || '—'}
                      </span>
                    </td>
                    <td
                      style={{
                        maxWidth: 160,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {p.note || '—'}
                    </td>
                    <td>
                      <span
                        className={`badge ${p.status === 'ACTIVE' ? 'COMMITTED' : p.status === 'SUSPENDED' ? 'FAILED' : 'TIMEOUT'}`}
                      >
                        {p.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>{fmt.date(p.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className='btn btn-secondary'
                          style={{ padding: '4px 10px', fontSize: 10 }}
                          onClick={() => navigate(`/pisps/${p.pisp_id}`)}
                        >
                          View
                        </button>
                        <button
                          className='btn btn-secondary'
                          style={{ padding: '4px 10px', fontSize: 10 }}
                          onClick={() => openEdit(p)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal  */}
      {modal && (
        <div className='modal-overlay' onClick={() => setModal(null)}>
          <div
            className='modal'
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            <div className='modal-title'>
              {modal === 'create'
                ? '+ Register New PISP'
                : `Edit — ${modal.pisp_id}`}
            </div>

            <form
              onSubmit={handleSave}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/*  PISP Info  */}
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1,
                  marginBottom: -4,
                }}
              >
                PISP INFORMATION
              </div>

              {modal === 'create' && (
                <div className='input-group'>
                  <label className='input-label'>PISP ID *</label>
                  <input
                    className='input w-full'
                    required
                    value={form.pisp_id}
                    onChange={handlePispIdChange}
                    placeholder='e.g. pisp or daraz-pay'
                  />
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      marginTop: 3,
                    }}
                  >
                    Must match the FSP ID registered in Mojaloop Hub
                  </div>
                </div>
              )}

              <div className='input-group'>
                <label className='input-label'>Full Name *</label>
                <input
                  className='input w-full'
                  required
                  value={form.name}
                  onChange={f('name')}
                  placeholder='e.g. Daraz Payment Service'
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <div className='input-group'>
                  <label className='input-label'>Short Name</label>
                  <input
                    className='input w-full'
                    value={form.short_name}
                    onChange={f('short_name')}
                    placeholder='e.g. Daraz'
                  />
                </div>
                <div className='input-group'>
                  <label className='input-label'>Currency</label>
                  <input
                    className='input w-full'
                    value={form.currency}
                    onChange={f('currency')}
                    placeholder='BDT'
                    maxLength={3}
                  />
                </div>
              </div>

              <div className='input-group'>
                <label className='input-label'>Callback URL *</label>
                <input
                  className='input w-full'
                  required
                  value={form.callback_url}
                  onChange={f('callback_url')}
                  placeholder='https://pisp-backend.mojaloop.xyz'
                />
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginTop: 3,
                  }}
                >
                  Hub will send consent + transaction callbacks to this URL
                </div>
              </div>

              <div className='input-group'>
                <label className='input-label'>Note</label>
                <input
                  className='input w-full'
                  value={form.note}
                  onChange={f('note')}
                  placeholder='e.g. E-commerce payment initiator'
                />
              </div>

              {/* What gets registered info box */}
              {modal === 'create' && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: '#001a33',
                    border: '1px solid #003366',
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: '#6699cc',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: 8,
                      letterSpacing: 1,
                    }}
                  >
                    ENDPOINTS THAT WILL BE REGISTERED
                  </div>
                  <div
                    style={{ fontSize: 11, color: '#6699cc', lineHeight: 1.8 }}
                  >
                    Parties GET/PUT — ALS lookup callbacks
                    <br />
                    Participants PUT — ALS registration
                    <br />
                    Consent POST/PUT — consent lifecycle
                    <br />
                    ConsentRequests POST/PUT — consent requests
                    <br />
                    ThirdPartyRequests — transaction initiation
                    <br />
                    Authorizations — user approval callbacks
                    <br />
                    <span
                      style={{
                        color: '#445566',
                        marginTop: 4,
                        display: 'block',
                      }}
                    >
                      Quotes — not needed (PISP never quotes)
                      <br />
                      Transfers — not needed (PISP never transfers)
                      <br />
                      Net Debit Cap — not needed (PISP holds no funds)
                    </span>
                  </div>
                </div>
              )}

              {/* Status (edit only) */}
              {modal !== 'create' && (
                <div className='input-group'>
                  <label className='input-label'>Status</label>
                  <select
                    className='select w-full'
                    value={form.status}
                    onChange={f('status')}
                  >
                    <option value='ACTIVE'>ACTIVE</option>
                    <option value='INACTIVE'>INACTIVE</option>
                    <option value='SUSPENDED'>SUSPENDED</option>
                  </select>
                </div>
              )}

              <div className='modal-actions'>
                <button
                  type='button'
                  className='btn btn-secondary'
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn btn-primary'
                  disabled={saving}
                >
                  {saving
                    ? modal === 'create'
                      ? '⏳ Registering...'
                      : '⏳ Saving...'
                    : modal === 'create'
                      ? '+ Register PISP'
                      : '✓ Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  Success Result Popup  */}
      {result && (
        <div className='modal-overlay' onClick={() => setResult(null)}>
          <div
            className='modal'
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>✅</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                PISP Registered Successfully
              </span>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {/* PISP ID */}
              <div
                style={{
                  marginBottom: 14,
                  padding: '10px 14px',
                  background: 'var(--bg-hover)',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>PISP ID</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                  }}
                >
                  {result.pisp_id}
                </span>
              </div>

              {/* Steps */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                    letterSpacing: 1,
                  }}
                >
                  SETUP STEPS
                </div>
                {result.steps &&
                  Object.entries(result.steps).map(([step, val]) => (
                    <div
                      key={step}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 0',
                        borderBottom: '1px solid var(--border)',
                        fontSize: 11,
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {step}
                      </span>
                      <span
                        style={{
                          color: !val
                            ? 'var(--text-muted)'
                            : val?.error
                              ? 'var(--red)'
                              : val === 'ok'
                                ? 'var(--green)'
                                : val?.skipped
                                  ? 'var(--yellow)'
                                  : 'var(--green)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {!val
                          ? '—'
                          : val?.error
                            ? 'failed'
                            : val === 'ok'
                              ? 'done'
                              : val?.skipped
                                ? 'skipped'
                                : Array.isArray(val)
                                  ? ` ${val.filter((v) => v.status === 'ok').length}/${val.length}`
                                  : ' done'}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Endpoint summary */}
              {result.steps?.cl_endpoints &&
                Array.isArray(result.steps.cl_endpoints) && (
                  <div
                    style={{
                      background: '#001a33',
                      border: '1px solid #003366',
                      borderRadius: 8,
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: '#6699cc',
                        marginBottom: 8,
                        letterSpacing: 1,
                      }}
                    >
                      ENDPOINTS REGISTERED
                    </div>
                    <div style={{ fontSize: 11, color: '#6699cc' }}>
                      {
                        result.steps.cl_endpoints.filter(
                          (e) => e.status === 'ok',
                        ).length
                      }{' '}
                      / {result.steps.cl_endpoints.length} endpoints registered
                      successfully
                    </div>
                    {result.steps.cl_endpoints.filter(
                      (e) => e.status === 'failed',
                    ).length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {result.steps.cl_endpoints
                          .filter((e) => e.status === 'failed')
                          .map((e) => (
                            <div
                              key={e.type}
                              style={{
                                fontSize: 10,
                                color: 'var(--red)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {e.type}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                className='btn btn-secondary'
                onClick={() => {
                  setResult(null);
                  navigate(`/pisps/${result.pisp_id}`);
                }}
              >
                View Details
              </button>
              <button
                className='btn btn-primary'
                onClick={() => setResult(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
