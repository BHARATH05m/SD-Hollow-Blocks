import React from 'react';
import LoginForm from '../components/LoginForm.jsx';

function OwnerLogin({ onLoginSuccess }) {
  return <LoginForm roleForUI="Owner" onLoginSuccess={onLoginSuccess} />;
}

export default OwnerLogin;


