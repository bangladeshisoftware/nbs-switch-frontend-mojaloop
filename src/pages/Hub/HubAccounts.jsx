import { useState, useEffect } from 'react';
import api from '../../services/api';
import { fmt } from '../../utils/format';

const CURRENCIES   = ['BDT', 'USD', 'EUR', 'INR', 'TZS'];
const ACCOUNT_TYPES = [
  { value: 'HUB_MULTILATERAL_SETTLEMENT', label: 'Hub Multilateral Settlement' },
  { value: 'HUB_RECONCILIATION',          label: 'Hub Reconciliation' },
];

const EMPTY_FORM = { currency: 'BDT', type: 'HUB_MULTILATERAL_SETTLEMENT' };

export default function HubAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hub/accounts');
      setAccounts(Array.isArray(res.data) ? res.data : res.data?.data || []);
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
      await api.post('/hub/accounts', form);
      setModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.errorInformation?.errorDescription || err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Hub Accounts</div>
          <div className="page-subtitle">{accounts.length} accounts registered in Mojaloop Hub</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={load}>↺ Refresh</button>
          <button className="btn btn-primary" onClick={() => { setModal(true); setError(null); setForm(EMPTY_FORM); }}>
            Create Hub Account
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Currency</th>
                <th>Account Type</th>
                <th>Status</th>
                <th>Value</th>
                <th>Reserved Value</th>
                <th>Changed Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-screen">Loading...</div></td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-title">No Hub accounts found</div>
                    <div className="empty-desc">Click "+ Create Hub Account" to add one</div>
                  </div>
                </td></tr>
              ) : accounts.map((row, i) => (
                <tr key={row.id ?? i}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                  <td>
                    <span style={{ background: 'var(--accent)22', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                      {row.currency}
                    </span>
                  </td>
                  <td className="td-primary" style={{ fontSize: 12 }}>{row.ledgerAccountType}</td>
                  <td>
                    <span className={`badge ${row.isActive ? 'COMMITTED' : 'FAILED'}`}>
                      {row.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{row.value ?? '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{row.reservedValue ?? '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {row.changedDate ? fmt.date(row.changedDate) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal  */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-title">+ Create Hub Account</div>

            {error && (
              <div style={{ margin: '0 0 12px', padding: '10px 14px', background: 'var(--red)11', border: '1px solid var(--red)44', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
               {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Currency *</label>
                <select className="select w-full" required value={form.currency} onChange={f('currency')}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Account Type *</label>
                <select className="select w-full" required value={form.type} onChange={f('type')}>
                  {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                 Hub accounts are used for multilateral settlement and reconciliation between DFSPs.
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? ' Creating...' : ' Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
