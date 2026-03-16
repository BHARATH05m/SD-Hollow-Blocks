import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../utils/api.js';

function LoginForm({ roleForUI, onLoginSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await usersAPI.login({ email: form.email, password: form.password });
      const { role, email: userEmail, token } = response.data;
      
      // Store user info in localStorage
      localStorage.setItem(
        'currentUser',
        JSON.stringify({ id: userEmail || form.email, role, loginTime: Date.now() })
      );
      
      onLoginSuccess(token, role);
      setMessage('Login successful. Redirecting...');
      navigate('/home');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed. Check email or password.');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{roleForUI} Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            type="email"
          />
        </div>
        <div>
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>{message}</p>
      {roleForUI === 'Owner' && (
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Owner login: owner1 / owner123
        </p>
      )}
    </div>
  );
}

export default LoginForm;


