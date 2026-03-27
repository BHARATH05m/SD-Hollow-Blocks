import React, { useState, useEffect } from 'react';
import CustomerNavbar from '../components/CustomerNavbar.jsx';
import ImageModal from '../components/ImageModal.jsx';
import WhatsAppFloat from '../components/WhatsAppFloat.jsx';
import { productsAPI } from '../utils/api.js';
import { getImageUrl } from '../utils/imageUtils.js';

function ProductPage() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load items from MongoDB
  const loadItems = async () => {
    try {
      const response = await productsAPI.getAll();
      const loadedItems = response.data.map(item => ({
        id: item._id,
        name: item.name,
        amount: item.amount,
        units: item.units,
        imageThumbnail: item.imageThumbnail || item.image, // Fallback to old image field
        imageBackView: item.imageBackView || item.image,
        backViewType: item.backViewType || 'image',
        image: item.image, // Keep for backward compatibility
        dateAdded: item.dateAdded || item.createdAt,
      }));
      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  useEffect(() => {
    loadItems();
    // Reload items when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadItems();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load cart
  useEffect(() => {
    const savedCart = localStorage.getItem('userCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    localStorage.setItem('userCart', JSON.stringify(cart));
  }, [cart]);

  // Load and check for notifications
  useEffect(() => {
    const checkNotifications = () => {
      const currentUserRaw = localStorage.getItem('currentUser');
      if (!currentUserRaw) return;

      try {
        const currentUser = JSON.parse(currentUserRaw);
        const notificationsRaw = localStorage.getItem('userNotifications');
        if (notificationsRaw) {
          const allNotifications = JSON.parse(notificationsRaw);
          const userNotifications = allNotifications.filter(
            (n) => n.userId === currentUser.id && !n.read
          );
          if (userNotifications.length > 0) {
            setNotifications(userNotifications);
            setShowNotification(true);
          }
        }
      } catch (e) {
        // ignore errors
      }
    };

    checkNotifications();
    // Check every 3 seconds for new notifications
    const interval = setInterval(checkNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  const markNotificationAsRead = (notificationId) => {
    const notificationsRaw = localStorage.getItem('userNotifications');
    if (notificationsRaw) {
      const allNotifications = JSON.parse(notificationsRaw);
      const updated = allNotifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem('userNotifications', JSON.stringify(updated));
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notifications.length === 1) {
        setShowNotification(false);
      }
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  const handleQuantityChange = (itemId, quantity) => {
    setSelectedQuantities({
      ...selectedQuantities,
      [itemId]: parseInt(quantity) || 0,
    });
  };

  const openImageModal = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const closeImageModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const addToCart = (item) => {
    const quantity = selectedQuantities[item.id] || 1;

    if (quantity <= 0) {
      setMessage('Please select at least 1 unit');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (quantity > item.units) {
      setMessage(`Only ${item.units} units available`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, selectedUnits: cartItem.selectedUnits + quantity }
            : cartItem
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...item,
          selectedUnits: quantity,
        },
      ]);
    }

    setMessage(`${item.name} (${quantity} units) added to cart!`);
    setTimeout(() => setMessage(''), 3000);
    setSelectedQuantities({ ...selectedQuantities, [item.id]: 0 });
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    marginBottom: '20px',
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

  const buttonStyle = {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #ffd814 0%, #fbbf24 100%)',
    color: '#0f1111',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    marginTop: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const inputStyle = {
    width: '60px',
    padding: '6px 8px',
    border: '1px solid #d0d7de',
    borderRadius: '4px',
    fontSize: '13px',
    textAlign: 'center',
  };


  // Filter items based on search term
  const filteredItems = items.filter(item => 
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Search bar style
  const searchBarStyle = {
    padding: '12px 20px',
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto 24px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    outline: 'none',
    transition: 'all 0.3s ease',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '24px',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <CustomerNavbar />
      
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
      
      {/* Order Notification */}
      {showNotification && notifications.length > 0 && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 3000, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
          {notifications.map((notif, index) => {
            const isApproved = notif.type === 'approved';
            return (
              <div
                key={notif.id}
                style={{
                  background: isApproved 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  padding: '20px',
                  borderRadius: '16px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '20px', marginRight: '8px' }}>
                    {isApproved ? '✓' : '✗'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
                      {isApproved ? 'Order Approved!' : 'Order Rejected'}
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' }}>
                      {notif.message}
                    </div>
                    {isApproved && (
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>
                        Total: ₹{notif.total?.toFixed(2) || '0.00'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      markNotificationAsRead(notif.id);
                      if (notifications.length === 1) closeNotification();
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginLeft: '8px',
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: '32px', flex: 1 }}>
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
        }}>PRODUCTS</h1>

        {/* Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchBarStyle}
          />
        </div>

        {message && (
          <div
            style={{
              padding: '12px 16px',
              background: '#10b981',
              color: '#fff',
              borderRadius: '8px',
              marginBottom: '20px',
              fontWeight: '600',
            }}
          >
            {message}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>{searchTerm ? 'No products match your search.' : 'No products available. Owner needs to add items first.'}</p>
          </div>
        ) : (
          <div style={gridStyle}>
            {filteredItems.map((item) => (
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
                    ₹{item.amount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#565959' }}>
                    M.R.P: <span style={{ textDecoration: 'line-through' }}>₹{(item.amount * 1.2).toFixed(2)}</span>
                  </div>
                </div>

                {/* Units / Stocks Available */}
                <div style={{ marginBottom: '12px', color: '#565959', fontSize: '13px' }}>
                  <strong>
                    {(() => {
                      const itemNameLower = (item.name || '').toLowerCase();
                      if (itemNameLower.includes('m-sand') || itemNameLower.includes('msand') || 
                          itemNameLower.includes('p-sand') || itemNameLower.includes('psand')) {
                        return 'Units Available:';
                      }
                      return 'Stocks Available:';
                    })()}
                  </strong> {item.units}
                </div>

                {/* Delivery Message for Various Products - Always Visible */}
                {(() => {
                  const itemNameLower = (item.name || '').toLowerCase();
                  const isSandProduct = itemNameLower.includes('m-sand') || itemNameLower.includes('msand') || 
                                       itemNameLower.includes('p-sand') || itemNameLower.includes('psand');
                  const isHollowBlocks = itemNameLower.includes('hollow block') || itemNameLower.includes('hollowblock') ||
                                        itemNameLower.includes('hollow blocks') || itemNameLower.includes('hollowblocks');
                  const isPost = itemNameLower.includes('post');
                  const isCement = itemNameLower.includes('cement');
                  const isRing = itemNameLower.includes('ring');
                  const isBricks = itemNameLower.includes('brick');
                  
                  let deliveryMessage = null;
                  
                  if (isSandProduct) {
                    deliveryMessage = '✓ Delivery Available for 3+ Units';
                  } else if (isHollowBlocks) {
                    deliveryMessage = '✓ Delivery Available for 200+ Units';
                  } else if (isPost) {
                    deliveryMessage = '✓ Delivery Available for 10+ Units';
                  } else if (isCement) {
                    deliveryMessage = '✓ Delivery Available for 50+ Units';
                  } else if (isRing) {
                    deliveryMessage = '✓ Delivery Available for 10+ Units';
                  } else if (isBricks) {
                    deliveryMessage = '✓ Delivery Available for 500+ Units';
                  }
                  
                  if (deliveryMessage) {
                    return (
                      <div style={{
                        marginBottom: '12px',
                        padding: '10px 12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'center',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}>
                        {deliveryMessage}
                      </div>
                    );
                  }
                  
                  return null;
                })()}

                {/* Quantity Selection */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                    Select Units:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={item.units}
                    value={selectedQuantities[item.id] || ''}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    placeholder="1"
                    style={inputStyle}
                  />
                </div>

                <button onClick={() => addToCart(item)} style={buttonStyle}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Floating WhatsApp Button */}
      <WhatsAppFloat />
    </div>
  );
}

export default ProductPage;
