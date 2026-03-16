import React, { useState, useEffect } from 'react';
import OwnerNavbar from '../components/OwnerNavbar.jsx';
import ImageModal from '../components/ImageModal.jsx';
import EditImageModal from '../components/EditImageModal.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import MediaUpload from '../components/MediaUpload.jsx';
import { productsAPI, uploadAPI } from '../utils/api.js';
import { getImageUrl } from '../utils/imageUtils.js';

function HollowBlocksPage() {
  const [items, setItems] = useState([]);
  const [tempAmounts, setTempAmounts] = useState({});
  const [tempUnits, setTempUnits] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    units: '',
  });
  const [selectedImages, setSelectedImages] = useState({
    thumbnail: null,
    thumbnailPreview: null,
    backview: null,
    backviewPreview: null,
    backviewType: 'image',
  });
  const [editImages, setEditImages] = useState({
    thumbnail: null,
    thumbnailPreview: null,
    backview: null,
    backviewPreview: null,
    backviewType: 'image',
  });

  // Load items from MongoDB
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      const loadedItems = response.data.map(item => ({
        id: item._id,
        name: item.name,
        amount: item.amount,
        units: item.units,
        imageThumbnail: item.imageThumbnail || item.image,
        imageBackView: item.imageBackView || item.image,
        backViewType: item.backViewType || 'image',
        image: item.image,
        dateAdded: item.dateAdded || item.createdAt,
      }));
      setItems(loadedItems);
      // Initialize temp amounts/units with current values
      const initialTempAmounts = {};
      const initialTempUnits = {};
      loadedItems.forEach((item) => {
        initialTempAmounts[item.id] = item.amount;
        initialTempUnits[item.id] = item.units;
      });
      setTempAmounts(initialTempAmounts);
      setTempUnits(initialTempUnits);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.units) {
      alert('Please fill in all product details.');
      return;
    }

    if (!selectedImages.thumbnail || !selectedImages.backview) {
      alert('Please select both thumbnail and back view media.');
      return;
    }

    setUploading(true);

    try {
      // Upload images first
      const uploadResponse = await uploadAPI.multiple(
        selectedImages.thumbnail,
        selectedImages.backview
      );

      // Create product with uploaded image URLs
      const response = await productsAPI.create({
        name: formData.name,
        amount: parseFloat(formData.amount),
        units: parseInt(formData.units),
        imageThumbnail: uploadResponse.data.thumbnailUrl,
        imageBackView: uploadResponse.data.backviewUrl,
        backViewType: uploadResponse.data.backViewType || selectedImages.backviewType,
      });
      
      const newItem = {
        id: response.data._id,
        name: response.data.name,
        amount: response.data.amount,
        units: response.data.units,
        imageThumbnail: response.data.imageThumbnail,
        imageBackView: response.data.imageBackView,
        backViewType: response.data.backViewType,
        image: response.data.image,
        dateAdded: response.data.dateAdded || response.data.createdAt,
      };
      
      setItems([...items, newItem]);
      // Initialize temp amount for new item
      setTempAmounts({
        ...tempAmounts,
        [newItem.id]: newItem.amount,
      });
      setTempUnits({
        ...tempUnits,
        [newItem.id]: newItem.units,
      });
      
      // Reset form
      setFormData({ 
        name: '', 
        amount: '', 
        units: '', 
      });
      setSelectedImages({
        thumbnail: null,
        thumbnailPreview: null,
        backview: null,
        backviewPreview: null,
        backviewType: 'image',
      });
      
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openImageModal = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const closeImageModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleThumbnailSelect = (file, previewUrl) => {
    setSelectedImages({
      ...selectedImages,
      thumbnail: file,
      thumbnailPreview: previewUrl,
    });
  };

  const handleBackviewSelect = (file, previewUrl, mediaType) => {
    setSelectedImages({
      ...selectedImages,
      backview: file,
      backviewPreview: previewUrl,
      backviewType: mediaType,
    });
  };

  const handleEditThumbnailSelect = (file, previewUrl) => {
    setEditImages({
      ...editImages,
      thumbnail: file,
      thumbnailPreview: previewUrl,
    });
  };

  const handleEditBackviewSelect = (file, previewUrl, mediaType) => {
    setEditImages({
      ...editImages,
      backview: file,
      backviewPreview: previewUrl,
      backviewType: mediaType,
    });
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditImages({
      thumbnail: null,
      thumbnailPreview: product.imageThumbnail,
      backview: null,
      backviewPreview: product.imageBackView,
      backviewType: product.backViewType || 'image',
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingProduct(null);
    setEditImages({
      thumbnail: null,
      thumbnailPreview: null,
      backview: null,
      backviewPreview: null,
      backviewType: 'image',
    });
  };

  const handleUpdateImages = async () => {
    if (!editingProduct) return;

    if (!editImages.thumbnail && !editImages.backview) {
      alert('Please select at least one media file to update.');
      return;
    }

    setUploading(true);
    try {
      // Upload new images if selected
      const uploadResponse = await uploadAPI.multiple(
        editImages.thumbnail,
        editImages.backview
      );

      const updateData = {};
      if (uploadResponse.data.thumbnailUrl) {
        updateData.imageThumbnail = uploadResponse.data.thumbnailUrl;
      }
      if (uploadResponse.data.backviewUrl) {
        updateData.imageBackView = uploadResponse.data.backviewUrl;
        updateData.backViewType = uploadResponse.data.backViewType || editImages.backviewType;
      }

      // Update product with new image URLs
      await productsAPI.update(editingProduct.id, updateData);

      // Update local state
      setItems(items.map(item => {
        if (item.id === editingProduct.id) {
          return {
            ...item,
            imageThumbnail: updateData.imageThumbnail || item.imageThumbnail,
            imageBackView: updateData.imageBackView || item.imageBackView,
            backViewType: updateData.backViewType || item.backViewType,
            image: updateData.imageThumbnail || item.image,
          };
        }
        return item;
      }));

      alert('Product media updated successfully!');
      closeEditModal();
    } catch (error) {
      console.error('Error updating product images:', error);
      alert('Failed to update product media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateAmount = (id, newAmount) => {
    // Only update temporary amount, don't save yet
    setTempAmounts({
      ...tempAmounts,
      [id]: parseFloat(newAmount) || 0,
    });
  };

  const handleUpdateUnits = (id, newUnits) => {
    setTempUnits({
      ...tempUnits,
      [id]: parseInt(newUnits) || 0,
    });
  };

  const handleSaveAmount = async (id) => {
    const newAmount = tempAmounts[id];
    const newUnits = tempUnits[id];

    try {
      const updateData = {};
      if (newAmount !== undefined && newAmount >= 0) updateData.amount = newAmount;
      if (newUnits !== undefined && newUnits >= 0) updateData.units = newUnits;

      await productsAPI.update(id, updateData);
      
      // Update local state
      setItems(
        items.map((item) => {
          if (item.id !== id) return item;

          const updatedAmount = newAmount !== undefined && newAmount >= 0 ? newAmount : item.amount;
          const updatedUnits = newUnits !== undefined && newUnits >= 0 ? newUnits : item.units;

          return { ...item, amount: updatedAmount, units: updatedUnits };
        })
      );
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await productsAPI.delete(id);
      setItems(items.filter((item) => item.id !== id));
      // Remove from temp states
      const newTempAmounts = { ...tempAmounts };
      const newTempUnits = { ...tempUnits };
      delete newTempAmounts[id];
      delete newTempUnits[id];
      setTempAmounts(newTempAmounts);
      setTempUnits(newTempUnits);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const formStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '32px',
    borderRadius: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    marginBottom: '32px',
    maxWidth: '600px',
    width: '100%',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '16px',
    border: '1px solid #d0d7de',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: '#ffffff',
    color: '#1f2937',
  };

  const buttonStyle = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    marginBottom: '20px',
    maxWidth: '300px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
  };

  const imageStyle = {
    width: '100%',
    height: '250px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '12px',
    background: '#f9fafb',
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', width: '100%' }}>
      <OwnerNavbar />
      <div style={{ padding: '32px', flex: 1, width: '100%', background: 'transparent' }}>
        <h1 style={{ 
          marginBottom: '32px', 
          color: '#1e293b', 
          fontSize: '36px', 
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>PRODUCT MANAGEMENT</h1>

        {/* Add Item Form */}
        <div style={formStyle}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937' }}>Add New Product</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name (e.g., M-Sand, Hollow Blocks, Cement)"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Price per Unit (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter price per unit"
                required
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Stock Available *
              </label>
              <input
                type="number"
                name="units"
                value={formData.units}
                onChange={handleChange}
                placeholder="Enter number of units in stock"
                required
                min="1"
                style={inputStyle}
              />
            </div>
            
            {/* Media Upload Components */}
            <ImageUpload
              label="Thumbnail Image (Front View)"
              onImageSelect={handleThumbnailSelect}
              currentImage={selectedImages.thumbnailPreview}
              required={true}
            />
            
            <MediaUpload
              label="Back View (Image or Video)"
              onMediaSelect={handleBackviewSelect}
              currentMedia={selectedImages.backviewPreview}
              currentMediaType={selectedImages.backviewType}
              acceptImages={true}
              acceptVideos={true}
              required={true}
            />
            
            <button 
              type="submit" 
              style={{
                ...buttonStyle,
                opacity: uploading ? 0.7 : 1,
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
              disabled={uploading}
            >
              {uploading ? 'Adding Product...' : 'Add Product'}
            </button>
          </form>
        </div>

        {/* Image Modal */}
        {selectedProduct && (
          <ImageModal
            isOpen={modalOpen}
            onClose={closeImageModal}
            productName={selectedProduct.name}
            imageThumbnail={selectedProduct.imageThumbnail}
            imageBackView={selectedProduct.imageBackView}
            backViewType={selectedProduct.backViewType}
          />
        )}

        {/* Edit Image Modal */}
        {editingProduct && (
          <EditImageModal
            isOpen={editModalOpen}
            onClose={closeEditModal}
            product={editingProduct}
            onThumbnailSelect={handleEditThumbnailSelect}
            onBackviewSelect={handleEditBackviewSelect}
            onUpdate={handleUpdateImages}
            currentThumbnail={editImages.thumbnailPreview}
            currentBackview={editImages.backviewPreview}
            currentBackviewType={editImages.backviewType}
            uploading={uploading}
          />
        )}

        {/* Items List */}
        {items.length > 0 && (
          <div>
            <h2 style={{ marginBottom: '16px', color: '#1f2937' }}>Items List</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {items.map((item) => (
                <div 
                  key={item.id} 
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  {/* Product Image - Clickable */}
                  <div 
                    style={{ 
                      position: 'relative', 
                      cursor: 'pointer',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                    }}
                    onClick={() => openImageModal(item)}
                  >
                    <img 
                      src={getImageUrl(item.imageThumbnail)} 
                      alt={item.name} 
                      style={imageStyle} 
                    />
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      📷 View Images
                    </div>
                  </div>
                  
                  {/* Product Title */}
                  <h3 style={{ 
                    marginTop: 0, 
                    marginBottom: '8px', 
                    color: '#007185', 
                    fontSize: '16px',
                    fontWeight: '400',
                    lineHeight: '1.4',
                    cursor: 'pointer',
                  }}>
                    {item.name}
                  </h3>

                  {/* Price */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '22px', color: '#B12704', fontWeight: '400', marginBottom: '4px' }}>
                      ₹{(tempAmounts[item.id] !== undefined ? tempAmounts[item.id] : item.amount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#565959' }}>
                      M.R.P: <span style={{ textDecoration: 'line-through' }}>₹{((tempAmounts[item.id] !== undefined ? tempAmounts[item.id] : item.amount) * 1.2).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Amount (Editable by owner) */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                      Update Price (₹)
                    </label>
                    <input
                      type="number"
                      value={tempAmounts[item.id] !== undefined ? tempAmounts[item.id] : item.amount}
                      onChange={(e) => handleUpdateAmount(item.id, e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ 
                        ...inputStyle, 
                        marginBottom: 0,
                        fontSize: '13px',
                        padding: '6px 8px',
                      }}
                    />
                  </div>

                  {/* Units / Stocks (Editable by owner) */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                      Update Units / Stocks
                    </label>
                    <input
                      type="number"
                      value={tempUnits[item.id] !== undefined ? tempUnits[item.id] : item.units}
                      onChange={(e) => handleUpdateUnits(item.id, e.target.value)}
                      min="0"
                      step="1"
                      style={{ 
                        ...inputStyle, 
                        marginBottom: 0,
                        fontSize: '13px',
                        padding: '6px 8px',
                      }}
                    />
                  </div>

                  {/* Units / Stocks */}
                  <div style={{ marginBottom: '12px', color: '#565959', fontSize: '13px' }}>
                    <strong>
                      {(() => {
                        const itemNameLower = item.name.toLowerCase();
                        if (itemNameLower.includes('m-sand') || itemNameLower.includes('msand') || 
                            itemNameLower.includes('p-sand') || itemNameLower.includes('psand')) {
                          return 'Units Available:';
                        }
                        return 'Stocks Available:';
                      })()}
                    </strong> {item.units}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Price and Stock Update */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleSaveAmount(item.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          flex: 1,
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          flex: 1,
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    
                    {/* Edit Images Button */}
                    <button
                      onClick={() => openEditModal(item)}
                      style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        width: '100%',
                        boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      📷 Edit Images
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: '#ffffff', borderRadius: '12px', marginTop: '20px' }}>
            <p style={{ fontSize: '16px', margin: 0 }}>No items added yet. Add your first item above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HollowBlocksPage;
