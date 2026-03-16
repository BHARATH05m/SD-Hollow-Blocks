import React, { useState } from 'react';
import { getImageUrl } from '../utils/imageUtils.js';

function ImageModal({ isOpen, onClose, productName, imageThumbnail, imageBackView, backViewType = 'image' }) {
  const [currentImage, setCurrentImage] = useState('thumbnail');

  if (!isOpen) return null;

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px',
  };

  const modalContentStyle = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(0, 0, 0, 0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    transition: 'all 0.2s ease',
  };

  const imageStyle = {
    maxWidth: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
    borderRadius: '8px',
    marginBottom: '20px',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  };

  const tabButtonStyle = (isActive) => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    background: isActive 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      : '#f3f4f6',
    color: isActive ? '#fff' : '#374151',
    boxShadow: isActive 
      ? '0 4px 6px -1px rgba(102, 126, 234, 0.3)' 
      : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  });

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
    textAlign: 'center',
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.1)';
          }}
        >
          ×
        </button>
        
        <h2 style={titleStyle}>{productName}</h2>
        
        <div style={buttonGroupStyle}>
          <button
            style={tabButtonStyle(currentImage === 'thumbnail')}
            onClick={() => setCurrentImage('thumbnail')}
          >
            Front View
          </button>
          <button
            style={tabButtonStyle(currentImage === 'backview')}
            onClick={() => setCurrentImage('backview')}
          >
            Back View {backViewType === 'video' ? '(Video)' : '(Image)'}
          </button>
        </div>
        
        {currentImage === 'thumbnail' ? (
          <img
            src={getImageUrl(imageThumbnail)}
            alt={`${productName} - Front View`}
            style={imageStyle}
          />
        ) : backViewType === 'video' ? (
          <video
            src={getImageUrl(imageBackView)}
            style={imageStyle}
            controls
            playsInline
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={getImageUrl(imageBackView)}
            alt={`${productName} - Back View`}
            style={imageStyle}
          />
        )}
        
        <div style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          textAlign: 'center',
          marginTop: '8px' 
        }}>
          {currentImage === 'thumbnail' ? 'Front View' : `Back View ${backViewType === 'video' ? '(Video)' : '(Image)'}`}
        </div>
      </div>
    </div>
  );
}

export default ImageModal;