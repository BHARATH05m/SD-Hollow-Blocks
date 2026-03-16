import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUnreadMessages } from '../hooks/useUnreadMessages.js';

function CustomerNavbar() {
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
        to="/user/product"
        style={isActive('/user/product') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/user/product')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/user/product')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        PRODUCT
      </Link>
      <Link
        to="/user/cart"
        style={isActive('/user/cart') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/user/cart')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/user/cart')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        CART
      </Link>
      <Link
        to="/user/history"
        style={isActive('/user/history') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/user/history')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/user/history')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        HISTORY
      </Link>
      <Link
        to="/user/messages"
        style={isActive('/user/messages') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/user/messages')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/user/messages')) {
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
      <Link
        to="/user/contact"
        style={isActive('/user/contact') ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!isActive('/user/contact')) {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive('/user/contact')) {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        📍 CONTACT
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

export default CustomerNavbar;
