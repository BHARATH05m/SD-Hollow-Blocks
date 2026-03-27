import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUnreadMessages } from '../hooks/useUnreadMessages.js';

function OwnerNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const unreadCount = useUnreadMessages(currentUser);

  useEffect(() => {
    // Get current user for unread message tracking
    const userRaw = localStorage.getItem('currentUser');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setCurrentUser(user);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    navigate('/');
  };

  const navStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '16px 24px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
  };

  const linkStyle = {
    color: '#fff',
    textDecoration: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transform: 'scale(1.05)',
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={navStyle}>
      <div style={{ 
        fontSize: '22px', 
        fontWeight: '800', 
        marginRight: 'auto',
        letterSpacing: '1px',
        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
        background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        SD HOLLOW BLOCKS
      </div>
      <Link
        to="/owner/hen-management"
        style={isActive('/owner/hen-management') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/owner/hen-management')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/owner/hen-management')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        🐔 HEN MANAGEMENT
      </Link>
      <Link
        to="/owner/hollow-blocks"
        style={isActive('/owner/hollow-blocks') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/owner/hollow-blocks')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/owner/hollow-blocks')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        HOLLOW BLOCKS
      </Link>
      <Link
        to="/owner/overall-process"
        style={isActive('/owner/overall-process') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/owner/overall-process')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/owner/overall-process')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        OVERALL PROCESS
      </Link>
      <Link
        to="/owner/users"
        style={isActive('/owner/users') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/owner/users')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/owner/users')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        USERS
      </Link>
      <Link
        to="/owner/request"
        style={isActive('/owner/request') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/owner/request')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/owner/request')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        📋 REQUESTS
      </Link>
      <Link
        to="/owner/messages"
        style={isActive('/owner/messages') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/owner/messages')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/owner/messages')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          💬 MESSAGES
          {unreadCount > 0 && (
            <span style={{
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      </Link>
      <button
        onClick={handleLogout}
        style={{
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(239, 68, 68, 0.8)',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(239, 68, 68, 1)';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(239, 68, 68, 0.8)';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        LOGOUT
      </button>
    </nav>
  );
}

export default OwnerNavbar;
