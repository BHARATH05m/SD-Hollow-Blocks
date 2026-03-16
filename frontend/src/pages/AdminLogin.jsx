import React from 'react';
import LoginForm from '../components/LoginForm.jsx';

function AdminLogin({ onLoginSuccess }) {
  return <LoginForm roleForUI="Admin" onLoginSuccess={onLoginSuccess} />;
}

export default AdminLogin;


