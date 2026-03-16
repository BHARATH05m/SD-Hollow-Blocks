import React from 'react';
import ImageUpload from './ImageUpload.jsx';
import MediaUpload from './MediaUpload.jsx';
import { getImageUrl } from '../utils/imageUtils.js';

function EditImageModal({ 
  isOpen, 
  onClose, 
  product, 
  onThumbnailSelect, 
  onBackviewSelect, 
  onUpdate,
  currentThumbnail,
  currentBackview,
  currentBackviewType = 'image',
  uploading 
}) {
  if (!isOpen || !product) return null;

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
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
    paddingRight: '40px',
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  };

  const buttonStyle = (variant = 'primary') => ({
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: uploading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    flex: 1,
    opacity: uploading ? 0.7 : 1,
    background: variant === 'primary' 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : '#f3f4f6',
    color: variant === 'primary' ? '#fff' : '#374151',
    boxShadow: variant === 'primary' 
      ? '0 4px 6px -1px rgba(102, 126, 234, 0.3)' 
      : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  });

  const currentImagesStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
  };

  const currentImageStyle = {
    textAlign: 'center',
  };

  const imagePreviewStyle = {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '8px',
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
        
        <h2 style={titleStyle}>Update Product Media</h2>
        <p style={subtitleStyle}>
          Update images and videos for: <strong>{product.name}</strong>
        </p>

        {/* Current Images */}
        <div style={currentImagesStyle}>
          <div style={currentImageStyle}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
              Current Thumbnail
            </h4>
            <img 
              src={getImageUrl(product.imageThumbnail)} 
              alt="Current thumbnail" 
              style={imagePreviewStyle}
            />
          </div>
          <div style={currentImageStyle}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
              Current Back View ({product.backViewType || 'image'})
            </h4>
            {(product.backViewType === 'video') ? (
              <video 
                src={getImageUrl(product.imageBackView)} 
                style={imagePreviewStyle}
                controls
                playsInline
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img 
                src={getImageUrl(product.imageBackView)} 
                alt="Current back view" 
                style={imagePreviewStyle}
              />
            )}
          </div>
        </div>

        {/* New Image Uploads */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '16px' 
          }}>
            Upload New Media
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '16px' 
          }}>
            Select new media to replace the current ones. Leave empty to keep current media.
          </p>
          
          <ImageUpload
            label="New Thumbnail Image (Front View)"
            onImageSelect={onThumbnailSelect}
            currentImage={currentThumbnail}
            required={false}
          />
          
          <MediaUpload
            label="New Back View (Image or Video)"
            onMediaSelect={onBackviewSelect}
            currentMedia={currentBackview}
            currentMediaType={currentBackviewType}
            acceptImages={true}
            acceptVideos={true}
            required={false}
          />
        </div>

        {/* Action Buttons */}
        <div style={buttonGroupStyle}>
          <button
            style={buttonStyle('secondary')}
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            style={buttonStyle('primary')}
            onClick={onUpdate}
            disabled={uploading}
          >
            {uploading ? 'Updating Media...' : 'Update Media'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditImageModal;