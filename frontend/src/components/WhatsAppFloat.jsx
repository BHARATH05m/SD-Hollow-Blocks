import React, { useState, useEffect } from 'react';
import { usersAPI } from '../utils/api.js';

function WhatsAppFloat() {
  const [ownerContact, setOwnerContact] = useState(null);

  useEffect(() => {
    loadOwnerContact();
  }, []);

  const loadOwnerContact = async () => {
    try {
      const response = await usersAPI.getOwnerContact();
      setOwnerContact(response.data);
    } catch (error) {
      console.error('Error loading owner contact:', error);
    }
  };

  const handleWhatsAppClick = () => {
    if (ownerContact) {
      const message = 'Hello! I would like to inquire about your products.';
      const whatsappUrl = `https://wa.me/${ownerContact.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!ownerContact) return null;

  return (
    <a
      onClick={handleWhatsAppClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        backgroundColor: '#25d366',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
        cursor: 'pointer',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        textDecoration: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.4)';
      }}
      title="Chat with us on WhatsApp"
    >
      {/* WhatsApp SVG Icon */}
      <svg
        width="35"
        height="35"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 0C7.164 0 0 7.164 0 16c0 2.828.736 5.484 2.016 7.792L0 32l8.384-2.016A15.923 15.923 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0z"
          fill="#fff"
        />
        <path
          d="M25.36 22.36c-.448 1.264-2.224 2.32-3.632 2.624-.96.208-2.208.368-6.416-1.376-5.392-2.24-8.864-7.776-9.136-8.128-.256-.352-2.144-2.848-2.144-5.44 0-2.576 1.36-3.84 1.84-4.368.48-.512 1.056-.64 1.408-.64.352 0 .704.016 1.008.032.32.016.752-.128 1.184.896.448 1.056 1.536 3.744 1.664 4.016.144.272.24.592.048.944-.176.368-.272.592-.544.912-.272.304-.576.688-.816.928-.272.272-.56.56-.24 1.104.32.528 1.424 2.352 3.056 3.808 2.096 1.872 3.856 2.464 4.4 2.736.544.272.864.224 1.184-.144.32-.368 1.376-1.6 1.744-2.144.368-.544.736-.448 1.232-.272.496.176 3.152 1.488 3.696 1.76.544.272.896.4 1.024.624.128.224.128 1.296-.32 2.56z"
          fill="#25d366"
        />
      </svg>
    </a>
  );
}

export default WhatsAppFloat;
