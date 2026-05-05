import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDfsps,
  createDfsp,
  updateDfsp,
  getDFSPToken,
} from '../../services/api';
import { fmt } from '../../utils/format';
import { LogIn } from 'lucide-react';
import { ImSpinner4 } from 'react-icons/im';

const EMPTY_FORM = {
  dfsp_id: '',
  name: '',
  short_name: '',
  currency: '',
  email: '',
  endpoint_url: '',
  callback_url: '',
  initial_position: '0',
  net_debit_cap: '10000',
  status: 'ACTIVE',
  admin_full_name: '',
  admin_username: '',
  admin_email: '',
  admin_password: '',
};

export default function DFSPManagement() {
  const [dfsps, setDfsps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getDfsps()
      .then((r) => setDfsps(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal('create');
  };

  const openEdit = (d) => {
    setForm({
      dfsp_id: d.dfsp_id,
      name: d.name || '',
      short_name: d.short_name || '',
      email: d?.email || '',
      currency: d.currency || '',
      endpoint_url: d.endpoint_url || '',
      callback_url: d.callback_url || '',
      initial_position: '0',
      net_debit_cap: '10000',
      status: d.status || 'ACTIVE',
      admin_full_name: d?.admin_full_name || '',
      admin_username: d?.admin_username || '',
      admin_email: d?.admin_email || '',
      admin_password: '',
    });
    setModal(d);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (modal === 'create') {
        await createDfsp(form);
      } else {
        res = await updateDfsp(modal?.dfsp_id, form);
      }
      setModal(null);
      setResult(res.data);
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleDfspIdChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      dfsp_id: val,
      short_name: prev.short_name || val,
      admin_username: prev.admin_username || val.toLowerCase() + '_admin',
    }));
  };
  const [authLoading, setAuthLoading] = useState('');
  const handleLogin = async (dfsp_id) => {
    if (!dfsp_id) return alert('DFSP id is Required!');
    setAuthLoading(dfsp_id);
    try {
      const res = await getDFSPToken({ dfsp_id: dfsp_id });
      const url = null;
      // redirect.
      console.log(res?.data?.token, 'res is');
      window.open(
        `${process.env.REACT_APP_DFSP_URL}/login/${res?.data?.token}`,
        '_blank',
        'noopener,noreferrer',
      );
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setAuthLoading('');
    }
  };
  return (
    <div>
      <div className='page-header'>
        <div>
          <div className='page-title'>DFSP Management</div>
          <div className='page-subtitle'>{dfsps.length} registered DFSPs</div>
        </div>
        <div className='header-actions'>
          <button className='btn btn-secondary' onClick={load}>
            ↺ Refresh
          </button>
          <button className='btn btn-primary' onClick={openCreate}>
            + Add DFSP
          </button>
        </div>
      </div>

      <div className='page-content'>
        <div className='table-wrap'>
          <table>
            <thead>
              <tr>
                <th>DFSP ID</th>
                <th>Name</th>
                <th>Currency</th>
                <th>Callback URL</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className='loading-screen'>Loading...</div>
                  </td>
                </tr>
              ) : dfsps.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className='empty-state'>
                      <div className='empty-title'>No DFSPs registered</div>
                      <div className='empty-desc'>
                        Click "+ Add DFSP" to register a new participant
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                dfsps.map((d) => (
                  <tr
                    key={d.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/dfsps/${d.dfsp_id}`)}
                  >
                    <td className='td-accent'>{d.dfsp_id}</td>
                    <td className='td-primary'>{d.name}</td>
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
                        {d.currency || '—'}
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
                          color: d.callback_url
                            ? 'var(--text-secondary)'
                            : 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {d.callback_url || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${d.status === 'ACTIVE' ? 'COMMITTED' : d.status === 'SUSPENDED' ? 'FAILED' : 'TIMEOUT'}`}
                      >
                        {d.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>{fmt.date(d.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className='btn btn-secondary'
                          style={{ padding: '4px 10px', fontSize: 10 }}
                          onClick={() => navigate(`/dfsps/${d.dfsp_id}`)}
                        >
                          View
                        </button>
                        <button
                          className='btn btn-secondary'
                          style={{ padding: '4px 10px', fontSize: 10 }}
                          onClick={() => openEdit(d)}
                        >
                          Edit
                        </button>
                        <button
                          title='Login DFSP Portal Account'
                          disabled={authLoading ? true : false}
                          className='btn btn-secondary'
                          style={{ padding: '4px 10px', fontSize: 10 }}
                          onClick={() => handleLogin(d?.dfsp_id)}
                        >
                          {authLoading == d?.dfsp_id ? (
                            <>
                              {' '}
                              <ImSpinner4 className='animate-spin' /> Please
                              waite...
                            </>
                          ) : (
                            <>
                              Login <LogIn />
                            </>
                          )}
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

      {/*  Create / Edit Modal  */}
      {modal && (
        <div className='modal-overlay' onClick={() => setModal(null)}>
          <div
            className='modal'
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div className='modal-title'>
              {modal === 'create'
                ? '+ Register New DFSP'
                : `Edit — ${modal.dfsp_id}`}
            </div>

            <form
              onSubmit={handleSave}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* DFSP ID - only on create */}
              {modal === 'create' && (
                <div className='input-group'>
                  <label className='input-label'>DFSP ID *</label>
                  <input
                    className='input w-full'
                    required
                    value={form.dfsp_id}
                    onChange={handleDfspIdChange}
                    placeholder='e.g. ABank'
                  />
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      marginTop: 3,
                    }}
                  >
                    Must match Mojaloop participant name exactly
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
                  placeholder='e.g. A Bank Limited'
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
                    placeholder='e.g. ABank'
                  />
                </div>
                <div className='input-group'>
                  <label className='input-label'>Currency *</label>
                  <input
                    className='input w-full'
                    required
                    value={form.currency}
                    onChange={f('currency')}
                    placeholder='e.g. BDT'
                    maxLength={3}
                  />
                </div>
              </div>

              <div className='input-group'>
                <label className='input-label'>Email</label>
                <input
                  className='input w-full'
                  value={form.email}
                  onChange={f('email')}
                  placeholder='Enter DFSP email'
                />
              </div>
              <div className='input-group'>
                <label className='input-label'>Endpoint URL</label>
                <input
                  className='input w-full'
                  value={form.endpoint_url}
                  onChange={f('endpoint_url')}
                  placeholder='https://abank.example.com'
                />
              </div>

              <div className='input-group'>
                <label className='input-label'>Callback URL</label>
                <input
                  className='input w-full'
                  value={form.callback_url}
                  onChange={f('callback_url')}
                  placeholder='https://abank.example.com'
                />
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginTop: 3,
                  }}
                >
                  Mojaloop will send callbacks to this URL
                </div>
              </div>

              {/* Initial config — only on create */}
              {modal === 'create' && (
                <div
                  style={{
                    padding: '12px',
                    background: 'var(--bg-hover)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: 10,
                    }}
                  >
                    Central Ledger Initial Configuration
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                    }}
                  >
                    <div className='input-group'>
                      <label className='input-label'>Initial Position</label>
                      <input
                        className='input w-full'
                        type='number'
                        value={form.initial_position}
                        onChange={f('initial_position')}
                        placeholder='0'
                      />
                    </div>
                    <div className='input-group'>
                      <label className='input-label'>Net Debit Cap</label>
                      <input
                        className='input w-full'
                        type='number'
                        value={form.net_debit_cap}
                        onChange={f('net_debit_cap')}
                        placeholder='10000'
                      />
                    </div>
                  </div>
                </div>
              )}

              {modal === 'create' && (
                <div
                  style={{
                    padding: '14px',
                    background: '#001a00',
                    borderRadius: 8,
                    border: '1px solid #003300',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: '#00ff00',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: 12,
                      letterSpacing: 1,
                    }}
                  >
                     DFSP PORTAL ADMIN ACCOUNT
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                    }}
                  >
                    <div className='input-group'>
                      <label className='input-label'>Admin Full Name *</label>
                      <input
                        className='input w-full'
                        required
                        value={form.admin_full_name}
                        onChange={f('admin_full_name')}
                        placeholder='e.g. John Doe'
                      />
                    </div>
                    <div className='input-group'>
                      <label className='input-label'>Admin Username *</label>
                      <input
                        className='input w-full'
                        required
                        value={form.admin_username}
                        onChange={f('admin_username')}
                        placeholder='e.g. abank_admin'
                      />
                    </div>
                    <div className='input-group'>
                      <label className='input-label'>Admin Email *</label>
                      <input
                        className='input w-full'
                        type='email'
                        required
                        value={form.admin_email}
                        onChange={f('admin_email')}
                        placeholder='admin@abank.com'
                      />
                    </div>
                    <div className='input-group'>
                      <label className='input-label'>Initial Password *</label>
                      <input
                        className='input w-full'
                        type='text'
                        required
                        value={form.admin_password}
                        onChange={f('admin_password')}
                        placeholder='Set a strong password'
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status — only on edit */}
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
                      ? 'Registering...'
                      : 'Saving...'
                    : modal === 'create'
                      ? 'Register DFSP'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                DFSP Registered Successfully
              </span>
            </div>
            <div style={{ padding: '20px 24px' }}>
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
                              : val === 'ok' ||
                                  val === 'created' ||
                                  val === 'sent'
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
                            : val === 'ok' || val === 'created'
                              ? 'done'
                              : val === 'sent'
                                ? 'sent'
                                : val?.skipped
                                  ? 'skipped'
                                  : Array.isArray(val)
                                    ? `${val.filter((v) => !v.error).length}/${val.length}`
                                    : 'done'}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Admin credentials */}
              {result.admin_user && (
                <div
                  style={{
                    background: '#001a00',
                    border: '1px solid #003300',
                    borderRadius: 8,
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: '#00ff00',
                      marginBottom: 8,
                      letterSpacing: 1,
                    }}
                  >
                    ◎ ADMIN CREDENTIALS CREATED
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: '#666' }}>Username</span>
                    <span
                      style={{ color: '#ccc', fontFamily: 'var(--font-mono)' }}
                    >
                      {result.admin_user.username}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: '#666' }}>Email sent to</span>
                    <span
                      style={{
                        color: '#00ff00',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {result.admin_user.email}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 8 }}>
                    Login credentials sended by email
                  </div>
                </div>
              )}
            </div>
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
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
