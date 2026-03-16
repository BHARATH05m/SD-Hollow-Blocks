import React, { useState, useEffect } from 'react';
import CustomerNavbar from '../components/CustomerNavbar.jsx';
import tractorImg from '../PHOTOS/WhatsApp Image 2025-12-23 at 10.19.10 AM (2).jpeg';
import { ordersAPI } from '../utils/api.js';

function CartPage() {
  const [cart, setCart] = useState([]);
  const [items, setItems] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeliveryPrompt, setShowDeliveryPrompt] = useState(false);
  const [qualifyingItems, setQualifyingItems] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [geoWarning, setGeoWarning] = useState('');
  const [manualCharge, setManualCharge] = useState(false);
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  // Load cart and items
  useEffect(() => {
    const savedCart = localStorage.getItem('userCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const savedItems = localStorage.getItem('hollowBlocksItems');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
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

  // Owner's location: 6X44+CP4, Kunjampalayam, Tamil Nadu
  // Coordinates for Kunjampalayam, Tamil Nadu
  // Plus Code: 6X44+CP4 translates to approximately 11.2061°N, 78.1561°E
  const STORE_LAT = 11.2061;  // Latitude for Kunjampalayam, Tamil Nadu
  const STORE_LNG = 78.1561;  // Longitude for Kunjampalayam, Tamil Nadu
  const EARTH_RADIUS_KM = 6371;
  const RATE_PER_KM = 5; // ₹5 per km

  const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoWarning('Geolocation not supported by this browser.');
      setManualCharge(true);
      setDeliveryReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = haversineDistanceKm(latitude, longitude, STORE_LAT, STORE_LNG);
        const roundedKm = Math.round(dist * 100) / 100;
        const charge = Math.ceil(roundedKm) * RATE_PER_KM;
        setDistanceKm(roundedKm);
        setDeliveryCharge(charge);
        setGeoWarning('');
        setManualCharge(false);
        setDeliveryReady(true);
      },
      (err) => {
        setGeoWarning(`Location denied or unavailable: ${err.message}`);
        setManualCharge(true);
        setDistanceKm(null);
        setDeliveryCharge(0);
        setDeliveryReady(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const getDeliveryThreshold = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('m-sand') || lower.includes('msand')) return 3;
    if (lower.includes('p-sand') || lower.includes('psand')) return 3;
    if (lower.includes('hollow block') || lower.includes('hollowblock')) return 200;
    if (lower.includes('post')) return 10;
    if (lower.includes('ring')) return 10;
    if (lower.includes('cement')) return 50;
    if (lower.includes('brick')) return 500;
    return null;
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    const item = items.find((i) => i.id === id);
    if (item && newQuantity > item.units) {
      alert(`Only ${item.units} units available`);
      return;
    }

    setCart(
      cart.map((cartItem) =>
        cartItem.id === id ? { ...cartItem, selectedUnits: parseInt(newQuantity) } : cartItem
      )
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.amount * item.selectedUnits, 0);
  };

  const totalPayable = getTotal() + (deliveryReady ? deliveryCharge : 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Check delivery eligibility per product
    const qualifying = cart
      .map((ci) => {
        const threshold = getDeliveryThreshold(ci.name);
        const qualifies = threshold !== null && ci.selectedUnits >= threshold;
        return { ...ci, threshold, qualifies };
      })
      .filter((ci) => ci.qualifies);

    if (qualifying.length > 0) {
      setQualifyingItems(qualifying);
      setShowDeliveryPrompt(true);
      setDeliveryReady(false);
      setDistanceKm(null);
      setDeliveryCharge(0);
      setGeoWarning('');
      setManualCharge(false);
      return;
    }

    finalizeCheckout(false);
  };

  const finalizeCheckout = async (withDelivery) => {
    // Get current user
    const currentUserRaw = localStorage.getItem('currentUser');
    let currentUser = { id: 'User', role: 'user' };
    if (currentUserRaw) {
      try {
        const parsed = JSON.parse(currentUserRaw);
        if (parsed && parsed.id) {
          currentUser = parsed;
        }
      } catch (e) {
        // ignore malformed data
      }
    }

    // Create request in MongoDB
    const baseTotal = getTotal();
    const appliedDelivery = withDelivery ? deliveryCharge : 0;
    const totalAmount = baseTotal + appliedDelivery;

    try {
      await ordersAPI.create({
        userId: currentUser.id,
        items: cart.map((ci) => ({
          name: ci.name,
          units: ci.selectedUnits,
          pricePerUnit: ci.amount,
          subtotal: ci.amount * ci.selectedUnits,
        })),
        baseTotal: baseTotal,
        total: totalAmount,
        distanceKm: withDelivery ? (distanceKm ?? 'manual') : 'not requested',
        deliveryCharge: withDelivery ? (deliveryCharge ?? 0) : 0,
        withDelivery: withDelivery,
      });

      // Clear cart
      setCart([]);
      localStorage.removeItem('userCart');

      // Show success message
      setShowSuccess(true);
      setShowDeliveryPrompt(false);
      setQualifyingItems([]);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    marginBottom: '24px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  };

  const thStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '16px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '14px',
    letterSpacing: '0.5px',
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
  };

  const quantityInputStyle = {
    width: '60px',
    padding: '6px',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    textAlign: 'center',
  };

  const buttonStyle = {
    padding: '6px 12px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    marginLeft: '8px',
  };

  const checkoutButtonStyle = {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '300px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const imageStyle = {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px',
  };

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '16px',
  };

  const promptCardStyle = {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '720px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  };

  const promptButton = {
    padding: '12px 16px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <CustomerNavbar />
      
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
        }}>CART</h1>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>Your cart is empty. Add products from the Product page.</p>
          </div>
        ) : (
          <>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Image</th>
                  <th style={thStyle}>Product Name</th>
                  <th style={thStyle}>Price per Unit (₹)</th>
                  <th style={thStyle}>Units</th>
                  <th style={thStyle}>Subtotal (₹)</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>
                      <img src={item.image} alt={item.name} style={imageStyle} />
                    </td>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={tdStyle}>₹{item.amount.toFixed(2)}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min="1"
                        max={items.find((i) => i.id === item.id)?.units || item.selectedUnits}
                        value={item.selectedUnits}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        style={quantityInputStyle}
                      />
                    </td>
                    <td style={tdStyle}>₹{(item.amount * item.selectedUnits).toFixed(2)}</td>
                    <td style={tdStyle}>
                      <button onClick={() => removeFromCart(item.id)} style={buttonStyle}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                maxWidth: '420px',
                marginLeft: 'auto',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '600' }}>
                <span>Cart Total:</span>
                <span style={{ color: '#059669' }}>₹{getTotal().toFixed(2)}</span>
              </div>

              <div>
                <button
                  onClick={requestLocation}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    cursor: 'pointer',
                    fontWeight: 600,
                    width: '100%',
                    marginBottom: '6px',
                  }}
                >
                  Get Delivery Charge (use my location)
                </button>
                {geoWarning && (
                  <div style={{ color: '#b45309', fontSize: '13px', marginTop: '4px' }}>
                    {geoWarning}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', fontSize: '14px', color: '#374151' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Distance:</span>
                  <span>
                    {distanceKm != null ? `${distanceKm} km` : manualCharge ? 'manual/unknown' : 'not calculated'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Delivery Charge:</span>
                  <span>₹{deliveryCharge}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}>
                  <span>Total Payable:</span>
                  <span style={{ color: '#059669' }}>₹{totalPayable.toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handleCheckout} style={checkoutButtonStyle}>Proceed to Checkout</button>
            </div>
          </>
        )}

        {/* Delivery prompt overlay */}
        {showDeliveryPrompt && (
          <div style={overlayStyle}>
            <div style={promptCardStyle}>
              <div>
                <img src={tractorImg} alt="Delivery vehicle" style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '320px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '22px', color: '#111827' }}>Delivery Available</h3>
                <p style={{ margin: 0, color: '#374151', lineHeight: '1.5' }}>
                  The following items qualify for delivery based on your quantities. Calculate delivery and proceed.
                </p>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  {qualifyingItems.map((qi, idx) => (
                    <div key={`${qi.id}-${idx}`} style={{ fontSize: '14px', color: '#111827', padding: '6px 0', borderBottom: idx === qualifyingItems.length - 1 ? 'none' : '1px solid #e5e7eb' }}>
                      <strong>{qi.name}</strong> — {qi.selectedUnits} units (Threshold: {qi.threshold}+)
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', fontSize: '13px', color: '#374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Distance:</span>
                    <span>{distanceKm != null ? `${distanceKm} km` : manualCharge ? 'manual/unknown' : 'not calculated'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery Charge:</span>
                    <span>₹{deliveryCharge}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Products Total:</span>
                    <span>₹{getTotal().toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
                    <span>Total Payable:</span>
                    <span>₹{(getTotal() + (deliveryReady ? deliveryCharge : 0)).toFixed(2)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button
                    style={{ ...promptButton, background: '#f9fafb', color: '#111827', border: '1px solid #d1d5db' }}
                    onClick={requestLocation}
                  >
                    Calculate Delivery Charge
                  </button>
                  <button
                    style={{ ...promptButton, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', opacity: deliveryReady ? 1 : 0.6, cursor: deliveryReady ? 'pointer' : 'not-allowed' }}
                    onClick={() => {
                      if (!deliveryReady) return;
                      const payable = getTotal() + deliveryCharge;
                      const ok = window.confirm(`Pay ₹${payable.toFixed(2)} with delivery?`);
                      if (ok) finalizeCheckout(true);
                    }}
                  >
                    Proceed with Delivery
                  </button>
                  <button
                    style={{ ...promptButton, background: '#e5e7eb', color: '#111827' }}
                    onClick={() => {
                      const payable = getTotal();
                      const ok = window.confirm(`Pay ₹${payable.toFixed(2)} without delivery?`);
                      if (ok) finalizeCheckout(false);
                    }}
                  >
                    Proceed without Delivery
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(255, 255, 255, 0.98)',
              padding: '40px',
              borderRadius: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 2000,
              textAlign: 'center',
              minWidth: '400px',
              border: '2px solid #10b981',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              color: '#10b981',
              fontSize: '28px',
              fontWeight: '700',
            }}>
              Request Submitted
            </h2>
            <p style={{ 
              margin: '0 0 24px 0', 
              color: '#64748b',
              fontSize: '18px',
            }}>
              Your order request has been sent to the owner for approval. You will be notified once it's approved.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              OK
            </button>
          </div>
        )}

        {/* Overlay when success message is shown */}
        {showSuccess && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1999,
            }}
            onClick={() => setShowSuccess(false)}
          />
        )}
      </div>
    </div>
  );
}

export default CartPage;
