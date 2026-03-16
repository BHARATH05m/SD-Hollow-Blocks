import React, { useEffect, useState } from 'react';
import CustomerNavbar from '../components/CustomerNavbar.jsx';
import OrderMessages from '../components/OrderMessages.jsx';
import { ordersAPI, usersAPI } from '../utils/api.js';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';

function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reportType, setReportType] = useState('not_delivered');
  const [reportMessage, setReportMessage] = useState('');
  const [ownerContact, setOwnerContact] = useState(null);

  useEffect(() => {
    loadOwnerContact();
    loadOrders();
    // Refresh every 5 seconds to check for status updates
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOwnerContact = async () => {
    try {
      const response = await usersAPI.getOwnerContact();
      setOwnerContact(response.data);
    } catch (error) {
      console.error('Error loading owner contact:', error);
    }
  };

  const loadOrders = async () => {
    try {
      // Get current user
      const userRaw = localStorage.getItem('currentUser');
      if (!userRaw) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const currentUser = JSON.parse(userRaw);
      if (!currentUser?.id) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch orders from MongoDB for this user
      const response = await ordersAPI.getAll({ userId: currentUser.id });
      const ordersData = response.data.map(order => ({
        id: order._id,
        userId: order.userId,
        status: order.status,
        items: order.items.map(item => ({
          id: item._id || item.productId?._id || item.name,
          name: item.name,
          units: item.units,
          pricePerUnit: item.pricePerUnit,
          subtotal: item.subtotal,
          image: item.image || '/m-sand.jpg',
        })),
        total: order.total,
        baseTotal: order.baseTotal,
        distanceKm: order.distanceKm,
        deliveryCharge: order.deliveryCharge,
        withDelivery: order.withDelivery,
        deliveryTime: order.deliveryTime,
        requestedAt: order.requestedAt || order.createdAt,
        // Add delay-related fields
        delayReason: order.delayReason,
        apologizeMessage: order.apologizeMessage,
        newDeliveryTime: order.newDeliveryTime,
        delayedAt: order.delayedAt,
        dispatchedAt: order.dispatchedAt,
        deliveredAt: order.deliveredAt,
        readyAt: order.readyAt,
        collectedAt: order.collectedAt,
        customerPhone: order.customerPhone,
        deliveryReports: order.deliveryReports || []
      }));

      // Sort by newest first
      const sorted = ordersData.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      setOrders(sorted);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerContact();
    loadOrders();
    // Refresh every 5 seconds to check for status updates
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReportDelivery = (order) => {
    setSelectedOrder(order);
    setShowReportModal(true);
    // Set default report type based on delivery method
    setReportType(order.withDelivery ? 'not_delivered' : 'product_quality');
    setReportMessage('');
  };

  const submitReport = async () => {
    if (!reportMessage.trim()) {
      alert('Please enter a report message');
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser?.id) {
        alert('User not found. Please login again.');
        return;
      }

      await ordersAPI.reportDeliveryIssue(
        selectedOrder.id,
        reportType,
        reportMessage.trim(),
        currentUser.id
      );

      alert('Report submitted successfully! The owner has been notified.');
      setShowReportModal(false);
      setSelectedOrder(null);
      setReportMessage('');
      
      // Reload orders to show the updated data
      const loadOrders = async () => {
        try {
          const userRaw = localStorage.getItem('currentUser');
          if (!userRaw) {
            setOrders([]);
            setLoading(false);
            return;
          }

          const currentUser = JSON.parse(userRaw);
          if (!currentUser?.id) {
            setOrders([]);
            setLoading(false);
            return;
          }

          const response = await ordersAPI.getAll({ userId: currentUser.id });
          const ordersData = response.data.map(order => ({
            id: order._id,
            userId: order.userId,
            status: order.status,
            items: order.items.map(item => ({
              id: item._id || item.productId?._id || item.name,
              name: item.name,
              units: item.units,
              pricePerUnit: item.pricePerUnit,
              subtotal: item.subtotal,
              image: item.image || '/m-sand.jpg',
            })),
            total: order.total,
            baseTotal: order.baseTotal,
            distanceKm: order.distanceKm,
            deliveryCharge: order.deliveryCharge,
            withDelivery: order.withDelivery,
            deliveryTime: order.deliveryTime,
            requestedAt: order.requestedAt || order.createdAt,
            delayReason: order.delayReason,
            apologizeMessage: order.apologizeMessage,
            newDeliveryTime: order.newDeliveryTime,
            delayedAt: order.delayedAt,
            dispatchedAt: order.dispatchedAt,
            deliveredAt: order.deliveredAt,
            readyAt: order.readyAt,
            collectedAt: order.collectedAt,
            customerPhone: order.customerPhone,
            deliveryReports: order.deliveryReports || []
          }));

          const sorted = ordersData.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
          setOrders(sorted);
        } catch (error) {
          console.error('Error loading orders:', error);
          setOrders([]);
        } finally {
          setLoading(false);
        }
      };
      
      loadOrders();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const getReportTypeText = (type) => {
    const types = {
      'not_delivered': 'Product Not Delivered',
      'partial_delivery': 'Partial Delivery',
      'damaged_goods': 'Damaged Goods',
      'wrong_items': 'Wrong Items',
      'other': 'Other Issue'
    };
    return types[type] || type;
  };

  const getReportStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'acknowledged': '#3b82f6',
      'resolved': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const containerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  };

  const cardStyleBase = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  };

  const pendingCard = { ...cardStyleBase, border: '2px solid #f59e0b', background: '#fffbeb' };
  const approvedCard = { ...cardStyleBase, border: '2px solid #10b981', background: '#f0fdf4' };
  const rejectedCard = { ...cardStyleBase, border: '2px solid #ef4444', background: '#fef2f2' };

  const getCardStyle = (status) => {
    const baseStyle = { ...cardStyleBase };
    switch (status) {
      case 'pending': return { ...baseStyle, border: '2px solid #f59e0b', background: '#fffbeb' };
      case 'approved': return { ...baseStyle, border: '2px solid #10b981', background: '#f0fdf4' };
      case 'dispatched': return { ...baseStyle, border: '2px solid #3b82f6', background: '#eff6ff' };
      case 'delayed': return { ...baseStyle, border: '2px solid #ef4444', background: '#fef2f2' };
      case 'delivered': return { ...baseStyle, border: '2px solid #059669', background: '#ecfdf5' };
      case 'rejected': return { ...baseStyle, border: '2px solid #ef4444', background: '#fef2f2' };
      case 'ready': return { ...baseStyle, border: '2px solid #8b5cf6', background: '#f3e8ff' };
      case 'collected': return { ...baseStyle, border: '2px solid #059669', background: '#ecfdf5' };
      default: return baseStyle;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      dispatched: '#3b82f6',
      delayed: '#ef4444',
      delivered: '#059669',
      rejected: '#ef4444',
      ready: '#8b5cf6',
      collected: '#059669'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      approved: '✅',
      dispatched: '🚚',
      delayed: '⚠️',
      delivered: '📦',
      rejected: '❌',
      ready: '📋',
      collected: '✅'
    };
    return icons[status] || '❓';
  };

  const badgeStyle = (status) => {
    const base = {
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      color: '#fff'
    };
    return { ...base, background: getStatusColor(status) };
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <CustomerNavbar />
      <div style={{ padding: '32px', flex: 1 }}>
        <div style={containerStyle}>
          <h1
            style={{
              marginBottom: '20px',
              fontSize: '36px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            HISTORY
          </h1>

          {loading ? (
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.8' }}>
              Loading your order history...
            </p>
          ) : orders.length === 0 ? (
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.8' }}>
              No order history yet. Orders you place will appear here. Pending orders will show their status once approved or rejected by the owner.
            </p>
          ) : (
            <div>
              {orders.map((order, index) => (
                <div key={order.id} style={getCardStyle(order.status)}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '16px',
                          color: '#111827',
                          marginBottom: '4px',
                        }}
                      >
                        Order #{orders.length - index}
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                        Requested: {new Date(order.requestedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                      {order.status === 'approved' && order.deliveryTime && (
                        <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                          ✓ Delivery Scheduled: {order.deliveryTime}
                        </div>
                      )}
                      {order.status === 'dispatched' && order.dispatchedAt && (
                        <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 600, marginTop: '4px' }}>
                          🚚 Dispatched: {new Date(order.dispatchedAt).toLocaleString()}
                        </div>
                      )}
                      {order.status === 'delayed' && (
                        <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>
                          ⚠️ Delayed: {order.newDeliveryTime ? `New delivery time: ${order.newDeliveryTime}` : 'New time pending'}
                        </div>
                      )}
                      {order.status === 'delivered' && order.deliveredAt && (
                        <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                          📦 Delivered: {new Date(order.deliveredAt).toLocaleString()}
                        </div>
                      )}
                      {order.status === 'ready' && order.readyAt && (
                        <div style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: 600, marginTop: '4px' }}>
                          📋 Ready for Pickup: {new Date(order.readyAt).toLocaleString()}
                        </div>
                      )}
                      {order.status === 'collected' && order.collectedAt && (
                        <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                          ✅ Collected: {new Date(order.collectedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={badgeStyle(order.status)}>
                        {getStatusIcon(order.status)} {order.status.toUpperCase()}
                      </span>
                      {ownerContact && (
                        <button
                          onClick={() => {
                            const message = `Hello! I need assistance with my order #${order.id}. `;
                            const whatsappUrl = `https://wa.me/${ownerContact.phone}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#25d366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          title="Contact owner via WhatsApp"
                        >
                          <WhatsAppIcon size={16} color="#fff" /> WhatsApp
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    {order.items.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderBottom:
                            idx === order.items.length - 1 ? 'none' : '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                              {item.units} units × ₹{item.pricePerUnit.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, color: '#111827' }}>₹{item.subtotal.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: '#f9fafb',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#374151',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#111827' }}>
                      <span style={{ color: '#374151', fontWeight: 500 }}>Products Total:</span>
                      <span style={{ color: '#111827', fontWeight: 600 }}>₹{order.baseTotal.toFixed(2)}</span>
                    </div>
                    {order.withDelivery && (
                      <>
                        {order.distanceKm && order.distanceKm !== 'not requested' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#111827' }}>
                            <span style={{ color: '#374151', fontWeight: 500 }}>Distance:</span>
                            <span style={{ color: '#111827', fontWeight: 600 }}>{order.distanceKm} km</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#111827' }}>
                          <span style={{ color: '#374151', fontWeight: 500 }}>Delivery Charge:</span>
                          <span style={{ color: '#111827', fontWeight: 600 }}>₹{order.deliveryCharge}</span>
                        </div>
                      </>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        fontSize: '14px',
                        marginTop: '6px',
                        paddingTop: '6px',
                        borderTop: '1px solid #e5e7eb',
                        color: '#111827',
                      }}
                    >
                      <span style={{ color: '#111827' }}>Total:</span>
                      <span style={{ color: '#111827', fontSize: '15px' }}>₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Delay Information */}
                  {order.status === 'delayed' && (
                    <div style={{ 
                      marginTop: '12px',
                      padding: '16px', 
                      backgroundColor: '#fef2f2', 
                      borderRadius: '8px',
                      border: '2px solid #fecaca'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#dc2626', 
                        marginBottom: '12px',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        ⚠️ Delivery Delayed
                      </div>
                      
                      {/* New Delivery Time - Most Important */}
                      {order.newDeliveryTime && (
                        <div style={{ 
                          backgroundColor: '#fee2e2',
                          padding: '12px',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          border: '1px solid #fca5a5'
                        }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            color: '#991b1b', 
                            fontSize: '15px',
                            marginBottom: '4px'
                          }}>
                            🕒 New Delivery Time:
                          </div>
                          <div style={{ 
                            color: '#7f1d1d', 
                            fontSize: '16px',
                            fontWeight: '600'
                          }}>
                            {order.newDeliveryTime}
                          </div>
                        </div>
                      )}
                      
                      {order.delayReason && (
                        <div style={{ color: '#7f1d1d', marginBottom: '8px' }}>
                          <strong>Reason:</strong> {order.delayReason}
                        </div>
                      )}
                      
                      {order.apologizeMessage && (
                        <div style={{ color: '#7f1d1d', marginBottom: '8px' }}>
                          <strong>Message:</strong> {order.apologizeMessage}
                        </div>
                      )}
                      
                      {order.delayedAt && (
                        <div style={{ color: '#7f1d1d', fontSize: '12px', marginTop: '8px' }}>
                          <strong>Delayed on:</strong> {new Date(order.delayedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Reports */}
                  {order.deliveryReports && order.deliveryReports.length > 0 && (
                    <div style={{ 
                      marginTop: '12px',
                      padding: '16px', 
                      backgroundColor: '#fef3c7', 
                      borderRadius: '8px',
                      border: '2px solid #fbbf24'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#92400e', 
                        marginBottom: '12px',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🚨 Delivery Reports
                      </div>
                      
                      {order.deliveryReports.map((report, idx) => (
                        <div key={idx} style={{ 
                          backgroundColor: '#fef9e7',
                          padding: '12px',
                          borderRadius: '6px',
                          marginBottom: idx < order.deliveryReports.length - 1 ? '8px' : '0',
                          border: '1px solid #f3e8ff'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: '#78350f',
                              fontSize: '14px'
                            }}>
                              {getReportTypeText(report.reportType)}
                            </div>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              color: 'white',
                              backgroundColor: getReportStatusColor(report.status)
                            }}>
                              {report.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div style={{ color: '#78350f', marginBottom: '8px', fontSize: '14px' }}>
                            <strong>Issue:</strong> {report.reportMessage}
                          </div>
                          
                          <div style={{ color: '#78350f', fontSize: '12px', marginBottom: '8px' }}>
                            <strong>Reported:</strong> {new Date(report.reportedAt).toLocaleString()}
                          </div>
                          
                          {report.ownerResponse && (
                            <div style={{ 
                              backgroundColor: '#e0f2fe',
                              padding: '8px',
                              borderRadius: '4px',
                              marginTop: '8px',
                              border: '1px solid #b3e5fc'
                            }}>
                              <div style={{ color: '#01579b', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                                Owner Response:
                              </div>
                              <div style={{ color: '#01579b', fontSize: '13px' }}>
                                {report.ownerResponse}
                              </div>
                              {report.respondedAt && (
                                <div style={{ color: '#01579b', fontSize: '11px', marginTop: '4px' }}>
                                  Responded: {new Date(report.respondedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order Messages and Actions */}
                  {order.status !== 'rejected' && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <OrderMessages orderId={order.id} userId={order.userId} />
                      
                      {/* Report Button - Show for dispatched, delayed, delivered (delivery) or ready, collected (pickup) orders */}
                      {['dispatched', 'delayed', 'delivered', 'ready', 'collected'].includes(order.status) && (
                        <button
                          onClick={() => handleReportDelivery(order)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                          }}
                        >
                          🚨 Report Issue
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#dc2626' }}>
              🚨 Report {selectedOrder.withDelivery ? 'Delivery' : 'Product'} Issue - Order #{orders.findIndex(o => o.id === selectedOrder.id) + 1}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Issue Type:
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                {selectedOrder.withDelivery ? (
                  // Delivery orders - full delivery issues
                  <>
                    <option value="not_delivered">Product Not Delivered</option>
                    <option value="partial_delivery">Partial Delivery</option>
                    <option value="damaged_goods">Damaged Goods</option>
                    <option value="wrong_items">Wrong Items Delivered</option>
                    <option value="delivery_delay">Excessive Delivery Delay</option>
                    <option value="other">Other Delivery Issue</option>
                  </>
                ) : (
                  // Self-pickup orders - only product quality issues
                  <>
                    <option value="product_quality">Product Not Good/Poor Quality</option>
                    <option value="damaged_goods">Damaged Products</option>
                    <option value="wrong_items">Wrong Items Given</option>
                    <option value="incomplete_order">Incomplete Order</option>
                    <option value="other">Other Product Issue</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Describe the Issue:
              </label>
              <textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder={selectedOrder.withDelivery 
                  ? "Please provide details about the delivery issue..." 
                  : "Please describe the product quality issue..."
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  minHeight: '100px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '16px',
              border: '1px solid #fbbf24'
            }}>
              <div style={{ color: '#92400e', fontSize: '14px' }}>
                <strong>📋 What happens next:</strong><br/>
                • Your report will be sent to the owner immediately<br/>
                • The owner will be notified through the messaging system<br/>
                • You'll receive a response within 24 hours<br/>
                • You can track the status of your report here
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedOrder(null);
                  setReportMessage('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!reportMessage.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: reportMessage.trim() ? '#ef4444' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: reportMessage.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
