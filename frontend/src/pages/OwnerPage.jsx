import React, { useEffect, useState } from 'react';
import OwnerNavbar from '../components/OwnerNavbar.jsx';
import { Link } from 'react-router-dom';

function OwnerPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sdhb_users');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setUsers(parsed);
        }
      }
    } catch (e) {
      setUsers([]);
    }
  }, []);

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
          maxWidth: '800px',
        }}>
          <h1 style={{
            marginBottom: '20px',
            fontSize: '36px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Owner Dashboard - SD HOLLOW BLOCKS</h1>
          <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.8', marginBottom: '12px' }}>
            Welcome to the Owner page. Use the navigation bar above to access different sections.
          </p>
          <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.8' }}>
            This page is only for owner login (owner1 / owner123).
          </p>

          <div style={{ marginTop: '24px' }}>
            <Link
              to="/owner/users"
              style={{
                display: 'inline-block',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.35)',
              }}
            >
              View Registered Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerPage;

