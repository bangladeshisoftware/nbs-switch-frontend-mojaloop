/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.username, form.password);
      if (res?.otp_status) {
        // otp screen.
        navigate(`/verify-otp/${form?.username}`);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Login failed. Check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <div className='login-box'>
        <div className='login-logo'>
          {/* <div
            className='logo-icon'
            style={{
              width: 44,
              height: 44,
              fontSize: 18,
              margin: '0 auto 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
            }}
          >
            RS
          </div>
          <h1>NB Switch Portal</h1>
          <p>Mojaloop Hub Management</p> */}
          <NavLink to={'/'}>
            <img
              className='logo-animated-border'
              alt='NB Switch Logo'
              style={{ width: '70%', margin: 'auto' }}
              src='/l2.png'
            />
          </NavLink>
        </div>

        {error && (
          <div className='login-error' style={{ marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form className='login-form' onSubmit={handleSubmit}>
          <div className='input-group'>
            <label className='input-label'>Username or Email</label>
            <input
              className='input'
              type='text'
              placeholder='username'
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              required
            />
          </div>
          <div className='input-group'>
            <label className='input-label'>Password</label>
            <input
              className='input'
              type='password'
              placeholder='••••••••'
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />
          </div>
          <button type='submit' className='btn btn-primary' disabled={loading}>
            {loading ? (
              <>
                <div className='spinner' style={{ width: 12, height: 12 }} />{' '}
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          If you are forgot access information, then contact NB Switch support.
          Thank You.
        </div>
      </div>
    </div>
  );
}
