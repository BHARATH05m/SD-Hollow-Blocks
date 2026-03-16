import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersAPI } from '../utils/api.js';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!phone.trim()) {
      setMessage('Phone number is required');
      return;
    }
    if (password.length < 4) {
      setMessage('Password must be at least 4 characters');
      return;
    }
    if (password !== confirm) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      await usersAPI.register({ email: email.trim(), password, phone: phone.trim() });
      const info = encodeURIComponent('Registration successful. Please log in.');
      navigate(`/?info=${info}`);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'rgba(255,255,255,0.08)', padding: 32, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,.25)', color: '#fff', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: '28px', fontWeight: 700, background: 'linear-gradient(135deg,#fff,#c9e8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Create Account</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '14px', transition: 'all 0.3s ease' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(0,0,0,0.35)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(0,0,0,0.25)'; }}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>WhatsApp Number</label>
            <input
              type="tel"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '14px', transition: 'all 0.3s ease' }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(0,0,0,0.35)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(0,0,0,0.25)'; }}
              placeholder="Enter your WhatsApp number"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '14px', transition: 'all 0.3s ease' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(0,0,0,0.35)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(0,0,0,0.25)'; }}
              placeholder="Create a password"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Confirm Password</label>
            <input
              type="password"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '14px', transition: 'all 0.3s ease' }}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(0,0,0,0.35)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(0,0,0,0.25)'; }}
              placeholder="Confirm your password"
              required
            />
          </div>
          <button
            type="submit"
            style={{ 
              padding: '12px 16px', 
              borderRadius: 10, 
              border: 0, 
              background: 'linear-gradient(135deg,#6a5acd,#00c6ff)', 
              color: '#fff', 
              fontWeight: 700, 
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(106, 90, 205, 0.4)',
              marginTop: 8
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(106, 90, 205, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(106, 90, 205, 0.4)';
            }}
          >
            Create Account
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginTop: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Already have an account?</span>
            <Link to="/" style={{ color: '#c9e8ff', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.target.style.color = '#fff'; e.target.style.textDecoration = 'underline'; }} onMouseLeave={(e) => { e.target.style.color = '#c9e8ff'; e.target.style.textDecoration = 'none'; }}>Back to Login</Link>
          </div>
          {message && (
            <div style={{ 
              fontSize: 13, 
              color: message.includes('successful') ? '#8ef0a2' : '#ffb4b4',
              padding: '10px 12px',
              borderRadius: 8,
              background: message.includes('successful') ? 'rgba(142, 240, 162, 0.15)' : 'rgba(255, 180, 180, 0.15)',
              border: `1px solid ${message.includes('successful') ? 'rgba(142, 240, 162, 0.3)' : 'rgba(255, 180, 180, 0.3)'}`,
              marginTop: 8
            }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Register;

