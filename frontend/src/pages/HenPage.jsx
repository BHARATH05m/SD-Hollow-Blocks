import React from 'react';
import OwnerNavbar from '../components/OwnerNavbar.jsx';

function HenPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <OwnerNavbar />
      <div style={{ padding: '32px', flex: 1 }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}>
          <h1 style={{
            marginBottom: '20px',
            fontSize: '36px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>HEN PAGE</h1>
          <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.8' }}>Content for Hen Page goes here.</p>
        </div>
      </div>
    </div>
  );
}

export default HenPage;
