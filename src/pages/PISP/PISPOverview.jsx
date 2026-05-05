import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPispById, updatePisp, registerPispEndpoints } from '../../services/api';
import { fmt } from '../../utils/format';

export default function PISPOverview() {
  const { pispId } = useParams();
  const navigate   = useNavigate();

  const [pisp,     setPisp]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editForm,  setEditForm]  = useState({});

  // Re-register endpoints modal
  const [epModal,   setEpModal]   = useState(false);
  const [epUrl,     setEpUrl]     = useState('');
  const [epResult,  setEpResult]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPispById(pispId);
      setPisp(res.data.data);
      setEpUrl(res.data.data?.callback_url || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pispId]);

  useEffect(() => { load(); }, [load]);

  // Edit submit
  const openEdit = () => {
    setEditForm({
      name:         pisp?.name         || '',
      short_name:   pisp?.short_name   || '',
      callback_url: pisp?.callback_url || '',
      currency:     pisp?.currency     || 'BDT',
      note:         pisp?.note         || '',
      status:       pisp?.status       || 'ACTIVE',
    });
    setEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePisp(pispId, editForm);
      setEditModal(false);
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  //  Re-register endpoints
  const handleReRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEpResult(null);
    try {
      const res = await registerPispEndpoints(pispId, { callback_url: epUrl });
      setEpResult(res.data);
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => (e) => setEditForm(prev => ({ ...prev, [k]: e.target.value }));

  if (loading) return <div className="loading-screen">Loading PISP details...</div>;
  if (!pisp)   return <div style={{ padding: 24, color: 'var(--red)' }}>PISP not found</div>;

  const statusColor = pisp.status === 'ACTIVE' ? 'COMMITTED' : pisp.status === 'SUSPENDED' ? 'FAILED' : 'TIMEOUT';

  return (
    <div>
      {/*  Header  */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={() => navigate('/pisps')}>← Back</button>
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {pisp.name}
              <span className={`badge ${statusColor}`}>{pisp.status}</span>
            </div>
            <div className="page-subtitle">PISP ID: {pisp.pisp_id} · {pisp.currency}</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={load}>↺ Refresh</button>
          <button className="btn btn-secondary" onClick={() => setEpModal(true)}>⚡ Re-register Endpoints</button>
          <button className="btn btn-primary"   onClick={openEdit}>✎ Edit</button>
        </div>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/*  PISP Info  */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">PISP Information</div>
          </div>
          <div className="card-body">
            {[
              { label: 'PISP ID',      value: pisp.pisp_id,      mono: true },
              { label: 'Full Name',    value: pisp.name },
              { label: 'Short Name',   value: pisp.short_name },
              { label: 'Currency',     value: pisp.currency,     mono: true },
              { label: 'Status',       value: pisp.status,       badge: statusColor },
              { label: 'Note',         value: pisp.note || '—' },
              { label: 'Created',      value: fmt.date(pisp.created_at) },
              { label: 'Updated',      value: fmt.date(pisp.updated_at) },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                {row.badge
                  ? <span className={`badge ${row.badge}`}>{row.value}</span>
                  : <span style={{ color: 'var(--text-primary)', fontFamily: row.mono ? 'var(--font-mono)' : 'inherit', fontWeight: row.mono ? 600 : 400 }}>{row.value || '—'}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/*  Callback URL  */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Callback URL</div>
            <div className="card-subtitle">Hub sends all callbacks to this URL</div>
          </div>
          <div className="card-body">
            <div style={{ padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', wordBreak: 'break-all', marginBottom: 16 }}>
              {pisp.callback_url || '—'}
            </div>

            {/* What callbacks Hub sends */}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1 }}>REGISTERED CALLBACK PATHS</div>
            {[
              { path: '/parties/:idType/:idValue',                          label: 'ALS Lookup Result' },
              { path: '/participants/:idType/:idValue',                     label: 'ALS Registration' },
              { path: '/consents',                                          label: 'Consent Object (Phase 3)' },
              { path: '/consents/:id',                                      label: 'Consent Verified' },
              { path: '/consentRequests/:id',                               label: 'Consent Request Approved (Phase 2)' },
              { path: '/thirdPartyRequests/transactions',                   label: 'Incoming Txn Request' },
              { path: '/thirdPartyRequests/transactions/:id',               label: 'Transaction Final Status' },
              { path: '/thirdPartyRequests/transactions/:id/authorizations',label: 'Authorization Challenge' },
            ].map(ep => (
              <div key={ep.path} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: 10 }}>{ep.path}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{ep.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Central Ledger Endpoints */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">Central Ledger Endpoints</div>
            <div className="card-subtitle">Registered in Mojaloop Hub</div>
          </div>
          <div className="card-body">
            {!pisp.cl_endpoints || pisp.cl_endpoints.length === 0
              ? <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                  No endpoints found in Central Ledger
                </div>
              : <div className="table-wrap" style={{ margin: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Endpoint Type</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pisp.cl_endpoints.map((ep, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                            {ep.type}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                            {ep.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        </div>

      </div>

      {/*  Edit Modal  */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-title">Edit — {pisp.pisp_id}</div>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input className="input w-full" value={editForm.name} onChange={f('name')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Short Name</label>
                  <input className="input w-full" value={editForm.short_name} onChange={f('short_name')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Currency</label>
                  <input className="input w-full" value={editForm.currency} onChange={f('currency')} maxLength={3} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Callback URL</label>
                <input className="input w-full" value={editForm.callback_url} onChange={f('callback_url')} />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                  Changing this will re-register all endpoints automatically
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Note</label>
                <input className="input w-full" value={editForm.note} onChange={f('note')} />
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select className="select w-full" value={editForm.status} onChange={f('status')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  Re-register Endpoints Modal  */}
      {epModal && (
        <div className="modal-overlay" onClick={() => { setEpModal(false); setEpResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-title"> Re-register Endpoints</div>
            <form onSubmit={handleReRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Callback URL</label>
                <input className="input w-full" required value={epUrl}
                  onChange={e => setEpUrl(e.target.value)}
                  placeholder="https://pisp-backend.domain.com" />
              </div>

              {epResult && (
                <div style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '12px 14px', maxHeight: 200, overflowY: 'auto' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>{epResult.message}</div>
                  {epResult.results?.map(r => (
                    <div key={r.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{r.type}</span>
                      <span style={{ color: r.status === 'ok' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        {r.status === 'ok' ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setEpModal(false); setEpResult(null); }}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? ' Registering...' : 'Register Endpoints'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
