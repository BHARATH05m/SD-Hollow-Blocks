import React, { useState } from 'react';

function MediaUpload({ 
  label, 
  onMediaSelect, 
  currentMedia, 
  currentMediaType = 'image',
  required = false,
  acceptImages = true,
  acceptVideos = false,
  maxSizeMB = 5
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const getAcceptString = () => {
    let accept = [];
    if (acceptImages) accept.push('image/*');
    if (acceptVideos) accept.push('video/*');
    return accept.join(',');
  };

  const getMaxSizeForFileType = (file) => {
    if (file.type.startsWith('video/')) {
      return 50; // 50MB for videos
    }
    return maxSizeMB; // Default for images
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Validate file type
    if (!acceptImages && isImage) {
      alert('Images are not allowed for this field');
      return;
    }
    if (!acceptVideos && isVideo) {
      alert('Videos are not allowed for this field');
      return;
    }
    if (!isImage && !isVideo) {
      alert('Please select a valid image or video file');
      return;
    }

    // Validate file size
    const maxSize = getMaxSizeForFileType(file);
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`File size must be under ${maxSize}MB`);
      return;
    }

    setUploading(true);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    const mediaType = isVideo ? 'video' : 'image';
    
    // Call parent callback with file, preview, and type
    onMediaSelect(file, previewUrl, mediaType);
    setUploading(false);
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
    textAlign: 'center',
  };

  const getAcceptedTypesText = () => {
    let types = [];
    if (acceptImages) types.push('Images');
    if (acceptVideos) types.push('Videos');
    return types.join(' or ');
  };

  const renderPreview = () => {
    if (!currentMedia) return null;

    if (currentMediaType === 'video') {
      return (
        <video 
          src={currentMedia} 
          style={previewStyle}
          controls
          muted
        />
      );
    } else {
      return (
        <img 
          src={currentMedia} 
          alt="Preview" 
          style={previewStyle} 
        />
      );
    }
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
          accept={getAcceptString()}
          onChange={handleInputChange}
          style={hiddenInputStyle}
          required={required}
        />
        
        {uploading ? (
          <div style={{ color: '#667eea' }}>
            <div style={uploadIconStyle}>⏳</div>
            <div style={textStyle}>Processing...</div>
          </div>
        ) : currentMedia ? (
          <div>
            {renderPreview()}
            <div style={{ ...textStyle, color: '#10b981' }}>
              ✓ {currentMediaType === 'video' ? 'Video' : 'Image'} selected. Click to change.
            </div>
          </div>
        ) : (
          <div>
            <div style={uploadIconStyle}>
              {acceptVideos ? '🎬' : '📷'}
            </div>
            <div style={textStyle}>
              <strong>Click to select</strong> or drag and drop<br />
              {getAcceptedTypesText()} up to {acceptVideos ? '50MB' : `${maxSizeMB}MB`}
            </div>
          </div>
        )}
      </div>
      
      {currentMedia && (
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          marginTop: '4px',
          textAlign: 'center' 
        }}>
          {currentMediaType === 'video' ? 'Video' : 'Image'} ready for upload
        </div>
      )}
    </div>
  );
}

export default MediaUpload;