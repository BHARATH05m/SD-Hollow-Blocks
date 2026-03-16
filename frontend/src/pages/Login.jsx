import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { usersAPI } from '../utils/api.js';

function Login() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const info = params.get('info');
    if (info) {
      setMessage(info);
      setIsSuccess(true);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    try {
      const trimmedId = id.trim();
      const response = await usersAPI.login({ email: trimmedId, password });
      const { role, email: userEmail } = response.data;
      
      // Remember who is logged in for later (e.g., purchase history)
      localStorage.setItem(
        'currentUser',
        JSON.stringify({ id: userEmail || trimmedId, role, loginTime: Date.now() })
      );

      if (role === 'owner') {
        navigate('/owner');
      } else {
        navigate('/user/product');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.08)', padding: 32, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,.25)', color: '#fff' }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Login</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13 }}>ID or Email</label>
            <input
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.25)', color: '#fff' }}
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              placeholder="owner1 or your email"
            />
          </div>
          <div>
            <label style={{ fontSize: 13 }}>Password</label>
            <input
              type="password"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.25)', color: '#fff' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            style={{ padding: '10px 14px', borderRadius: 10, border: 0, background: 'linear-gradient(135deg,#6a5acd,#00c6ff)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            Login
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>New user?</span>
            <Link to="/register" style={{ color: '#c9e8ff' }}>Register</Link>
          </div>
          {message && (
            <div style={{ fontSize: 13, color: isSuccess ? '#8ef0a2' : '#ffb4b4' }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;

