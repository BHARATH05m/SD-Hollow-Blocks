import React from 'react';
import LoginForm from '../components/LoginForm.jsx';

function CustomerLogin({ onLoginSuccess }) {
  return <LoginForm roleForUI="Customer" onLoginSuccess={onLoginSuccess} />;
}

export default CustomerLogin;


