import { useState, useEffect } from 'react';
import api from '../../services/api';
import { fmt } from '../../utils/format';

const EMPTY_FORM = {
  oracleIdType:  'MSISDN',
  endpoint:      { value: '', endpointType: 'URL' },
  currency:      'BDT',
  isDefault:     true,
};

const ID_TYPES = ['MSISDN', 'ACCOUNT_ID', 'EMAIL', 'PERSONAL_ID', 'BUSINESS', 'DEVICE', 'IBAN', 'ALIAS'];

export default function Oracles() {
  const [oracles,  setOracles]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hub/oracles');
      setOracles(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/hub/oracles', form);
      setModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.errorInformation?.errorDescription || err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this oracle?')) return;
    setDeleting(id);
    try {
      await api.delete(`/hub/oracles/${id}`);
      load();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(null);
    }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fEndpoint = (k) => (e) => setForm(p => ({ ...p, endpoint: { ...p.endpoint, [k]: e.target.value } }));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Oracle Configuration</div>
          <div className="page-subtitle">{oracles.length} oracles registered in ALS</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={load}>↺ Refresh</button>
          <button className="btn btn-primary" onClick={() => { setModal(true); setError(null); setForm(EMPTY_FORM); }}>
            Add Oracle
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Oracle ID</th>
                <th>ID Type</th>
                <th>Currency</th>
                <th>Endpoint URL</th>
                <th>Endpoint Type</th>
                <th>Default</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-screen">Loading...</div></td></tr>
              ) : oracles.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-title">No oracles configured</div>
                    <div className="empty-desc">Click "+ Add Oracle" to register an oracle in ALS</div>
                  </div>
                </td></tr>
              ) : oracles.map((o, i) => (
                <tr key={o.oracleId ?? i}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{o.oracleId}</td>
                  <td>
                    <span style={{ background: 'var(--accent)22', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                      {o.oracleIdType}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.currency || '—'}</td>
                  <td style={{ maxWidth: 220 }}>
                    <span style={{ display: 'block', maxWidth: 210, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {o.endpoint?.value || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{o.endpoint?.endpointType || '—'}</td>
                  <td>
                    <span className={`badge ${o.isDefault ? 'COMMITTED' : 'TIMEOUT'}`}>
                      {o.isDefault ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 10, color: 'var(--red)' }}
                      disabled={deleting === o.oracleId}
                      onClick={() => handleDelete(o.oracleId)}
                    >
                      {deleting === o.oracleId ? 'Deleting...' : ' Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-title">+ Add Oracle</div>

            {error && (
              <div style={{ margin: '0 0 12px', padding: '10px 14px', background: 'var(--red)11', border: '1px solid var(--red)44', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">ID Type *</label>
                  <select className="select w-full" value={form.oracleIdType} onChange={f('oracleIdType')}>
                    {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Currency</label>
                  <input className="input w-full" value={form.currency} onChange={f('currency')} placeholder="BDT" maxLength={3} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Endpoint URL *</label>
                <input className="input w-full" required value={form.endpoint.value}
                  onChange={fEndpoint('value')} placeholder="http://als-oracle.mojaloop.xyz" />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                  ALS will query this URL to look up participants by {form.oracleIdType}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Endpoint Type</label>
                  <select className="select w-full" value={form.endpoint.endpointType} onChange={fEndpoint('endpointType')}>
                    <option value="URL">URL</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Set as Default</label>
                  <select className="select w-full" value={String(form.isDefault)} onChange={(e) => setForm(p => ({ ...p, isDefault: e.target.value === 'true' }))}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? ' Adding...' : 'Add Oracle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
