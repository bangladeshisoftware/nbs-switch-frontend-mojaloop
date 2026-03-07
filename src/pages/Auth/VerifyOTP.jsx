import { useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function VerifyOTP() {
  const [otp, seOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verify_otp } = useAuth();
  const navigate = useNavigate();
  const { ref } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ref || !otp) return alert(ref);
    setError('');
    setLoading(true);
    try {
      const res = await verify_otp(ref, otp);
      console.log('res: ', res);
      if (res?.token) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <div className='login-box'>
        <div className='login-logo'>
          <NavLink to={'/'}>
            <img
              className='logo-animated-border'
              alt='NB Logo'
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
            <label className='input-label'>OTP</label>
            <input
              className='input'
              type='number'
              placeholder='••••••••'
              value={otp}
              onChange={(e) => seOtp(e?.target?.value)}
              required
            />
          </div>
          <button type='submit' className='btn btn-primary' disabled={loading}>
            {loading ? (
              <>
                <div className='spinner' style={{ width: 12, height: 12 }} />{' '}
                Sign in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <Link
          to={'/login'}
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            display: 'block',
            textDecoration: 'underline',
          }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
