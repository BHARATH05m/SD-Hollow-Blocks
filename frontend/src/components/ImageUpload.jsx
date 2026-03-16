import React, { useState } from 'react';

function ImageUpload({ 
  label, 
  onImageSelect, 
  currentImage, 
  required = false,
  accept = "image/*"
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setUploading(true);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Call parent callback with file and preview
      onImageSelect(file, previewUrl);
      setUploading(false);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const containerStyle = {
    marginBottom: '16px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
  };

  const dropZoneStyle = {
    border: `2px dashed ${dragOver ? '#667eea' : '#d1d5db'}`,
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: dragOver ? '#f0f4ff' : '#fafafa',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const previewStyle = {
    maxWidth: '100%',
    maxHeight: '100px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '8px',
  };

  const hiddenInputStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  };

  const uploadIconStyle = {
    fontSize: '24px',
    color: '#9ca3af',
    marginBottom: '8px',
  };

  const textStyle = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.4',
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      
      <div
        style={dropZoneStyle}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          style={hiddenInputStyle}
          required={required}
        />
        
        {uploading ? (
          <div style={{ color: '#667eea' }}>
            <div style={uploadIconStyle}>⏳</div>
            <div style={textStyle}>Processing...</div>
          </div>
        ) : currentImage ? (
          <div>
            <img src={currentImage} alt="Preview" style={previewStyle} />
            <div style={{ ...textStyle, color: '#10b981' }}>
              ✓ Image selected. Click to change.
            </div>
          </div>
        ) : (
          <div>
            <div style={uploadIconStyle}>📷</div>
            <div style={textStyle}>
              <strong>Click to select</strong> or drag and drop<br />
              PNG, JPG, GIF up to 5MB
            </div>
          </div>
        )}
      </div>
      
      {currentImage && (
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          marginTop: '4px',
          textAlign: 'center' 
        }}>
          Image ready for upload
        </div>
      )}
    </div>
  );
}

export default ImageUpload;