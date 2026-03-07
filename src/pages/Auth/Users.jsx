import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser } from '../../services/api';
import { fmt } from '../../utils/format';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'VIEWER' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getUsers().then(r => setUsers(r.data.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ username: '', email: '', password: '', role: 'VIEWER' });
    setModal('create');
  };

  const openEdit = (u) => {
    setForm({ username: u.username, email: u.email, password: '', role: u.role, is_active: u.is_active });
    setModal(u);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await createUser(form);
      } else {
        await updateUser(modal.id, { role: form.role, is_active: form.is_active });
      }
      setModal(null);
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-subtitle">{users.length} users</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
        </div>
      </div>

      <div className="page-content">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7}><div className="loading-screen">Loading...</div></td></tr>
                : users.map(u => (
                  <tr key={u.id}>
                    <td className="td-primary">{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.is_active ? 'ACTIVE' : 'INACTIVE'}`}>{u.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td>{fmt.datetime(u.last_login)}</td>
                    <td>{fmt.date(u.created_at)}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => openEdit(u)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{modal === 'create' ? 'Add User' : `Edit — ${modal.username}`}</div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {modal === 'create' && (
                <>
                  <div className="input-group">
                    <label className="input-label">Username *</label>
                    <input className="input w-full" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email *</label>
                    <input className="input w-full" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Password *</label>
                    <input className="input w-full" type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                </>
              )}
              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="select w-full" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
              {modal !== 'create' && (
                <div className="input-group">
                  <label className="input-label">Active</label>
                  <select className="select w-full" value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: parseInt(e.target.value) }))}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
