import React from 'react';
import LoginForm from '../components/LoginForm.jsx';

function DualLogin({ onLoginSuccess }) {
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Choose Login</h1>

      <div
        style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 280, border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <h2 style={{ textAlign: 'center' }}>Customer Login</h2>
          <LoginForm roleForUI="Customer" onLoginSuccess={onLoginSuccess} />
        </div>

        <div style={{ minWidth: 280, border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <h2 style={{ textAlign: 'center' }}>Owner Login</h2>
          <LoginForm roleForUI="Owner" onLoginSuccess={onLoginSuccess} />
        </div>
      </div>
    </div>
  );
}

export default DualLogin;

