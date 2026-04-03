import { useState, useEffect } from 'react';
import api from '../../services/api';
import { fmt } from '../../utils/format';

const EMPTY_FORM = {
  name:                  '',
  settlementGranularity: 'NET',
  settlementInterchange: 'BILATERAL',
  settlementDelay:       'DEFERRED',
  currency:              'BDT',
  requireLiquidityCheck: true,
  ledgerAccountType:     'HUB_MULTILATERAL_SETTLEMENT',
  settlementAccountType: 'SETTLEMENT',
  autoPositionReset:     false,
};

const OPTIONS = {
  granularity:  ['NET', 'GROSS'],
  interchange:  ['BILATERAL', 'MULTILATERAL'],
  delay:        ['IMMEDIATE', 'DEFERRED'],
  currencies:   ['BDT', 'USD', 'EUR', 'INR'],
  ledgerAccountTypes: [
    { value: 'HUB_MULTILATERAL_SETTLEMENT', label: 'Hub Multilateral Settlement' },
    { value: 'HUB_RECONCILIATION',          label: 'Hub Reconciliation' },
  ],
  settlementAccountTypes: [
    { value: 'SETTLEMENT',  label: 'SETTLEMENT'  },
    { value: 'POOL',        label: 'POOL'        },
    { value: 'INTERCHANGE', label: 'INTERCHANGE' },
  ],
};

export default function SettlementModels() {
  const [models,  setModels]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hub/settlement-models');
      setModels(Array.isArray(res.data) ? res.data : res.data?.data || []);
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
      await api.post('/hub/settlement-models', {
        ...form,
        requireLiquidityCheck: form.requireLiquidityCheck === true || form.requireLiquidityCheck === 'true',
        autoPositionReset:     form.autoPositionReset     === true || form.autoPositionReset     === 'true',
      });
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
  const fBool = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value === 'true' }));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Settlement Models</div>
          <div className="page-subtitle">{models.length} models configured in Mojaloop Hub</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={load}>↺ Refresh</button>
          <button className="btn btn-primary" onClick={() => { setModal(true); setError(null); setForm(EMPTY_FORM); }}>
            + Create Model
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Granularity</th>
                <th>Interchange</th>
                <th>Delay</th>
                <th>Currency</th>
                <th>Ledger Account</th>
                <th>Settlement Account</th>
                <th>Liquidity Check</th>
                <th>Auto Reset</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11}><div className="loading-screen">Loading...</div></td></tr>
              ) : models.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="empty-state">
                    <div className="empty-title">No settlement models found</div>
                    <div className="empty-desc">Click "+ Create Model" to add one</div>
                  </div>
                </td></tr>
              ) : models.map((m, i) => (
                <tr key={m.settlementModelId ?? i}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                  <td className="td-accent">{m.name}</td>
                  <td style={{ fontSize: 12 }}>{m.settlementGranularity}</td>
                  <td style={{ fontSize: 12 }}>{m.settlementInterchange}</td>
                  <td style={{ fontSize: 12 }}>{m.settlementDelay}</td>
                  <td>
                    <span style={{ background: 'var(--accent)22', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                      {m.currency || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.ledgerAccountType || '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.settlementAccountType || '—'}</td>
                  <td>
                    <span className={`badge ${m.requireLiquidityCheck ? 'COMMITTED' : 'TIMEOUT'}`}>
                      {m.requireLiquidityCheck ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${m.autoPositionReset ? 'COMMITTED' : 'TIMEOUT'}`}>
                      {m.autoPositionReset ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${m.isActive ? 'COMMITTED' : 'FAILED'}`}>
                      {m.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-title">+ Create Settlement Model</div>

            {error && (
              <div style={{ margin: '0 0 12px', padding: '10px 14px', background: 'var(--red)11', border: '1px solid var(--red)44', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div className="input-group">
                <label className="input-label">Model Name *</label>
                <input className="input w-full" required value={form.name}
                  onChange={f('name')} placeholder="e.g. DEFERREDNET" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Granularity</label>
                  <select className="select w-full" value={form.settlementGranularity} onChange={f('settlementGranularity')}>
                    {OPTIONS.granularity.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Interchange</label>
                  <select className="select w-full" value={form.settlementInterchange} onChange={f('settlementInterchange')}>
                    {OPTIONS.interchange.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Delay</label>
                  <select className="select w-full" value={form.settlementDelay} onChange={f('settlementDelay')}>
                    {OPTIONS.delay.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Currency</label>
                  <select className="select w-full" value={form.currency} onChange={f('currency')}>
                    {OPTIONS.currencies.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Ledger Account Type</label>
                <select className="select w-full" value={form.ledgerAccountType} onChange={f('ledgerAccountType')}>
                  {OPTIONS.ledgerAccountTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Settlement Account Type</label>
                <select className="select w-full" value={form.settlementAccountType} onChange={f('settlementAccountType')}>
                  {OPTIONS.settlementAccountTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Require Liquidity Check</label>
                  <select className="select w-full" value={String(form.requireLiquidityCheck)} onChange={fBool('requireLiquidityCheck')}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Auto Position Reset</label>
                  <select className="select w-full" value={String(form.autoPositionReset)} onChange={fBool('autoPositionReset')}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setModal(false); setForm(EMPTY_FORM); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Creating...' : '+ Create Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
