import React, { useState, useEffect } from 'react';
import OwnerNavbar from '../components/OwnerNavbar.jsx';
import OrderWorkflowManager from '../components/OrderWorkflowManager.jsx';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';
import { ordersAPI } from '../utils/api.js';

function RequestPage() {
  const [orders, setOrders] = useState([]);
  const [groupedOrders, setGroupedOrders] = useState({});
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Set default date/time (tomorrow at 10:00 AM)
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
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
        dispatchedAt: order.dispatchedAt,
        deliveredAt: order.deliveredAt,
        readyAt: order.readyAt,
        collectedAt: order.collectedAt,
        delayedAt: order.delayedAt,
        delayReason: order.delayReason,
        apologizeMessage: order.apologizeMessage,
        newDeliveryTime: order.newDeliveryTime,
        userPhone: order.userPhone,
        customerPhone: order.customerPhone,
        inAppMessages: order.inAppMessages || [],
        deliveryReports: order.deliveryReports || []
      }));
      
      setOrders(ordersData);
      groupOrdersByCustomer(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
      setGroupedOrders({});
    }
  };

  const groupOrdersByCustomer = (ordersData) => {
    const grouped = {};
    
    ordersData.forEach(order => {
      if (!grouped[order.userId]) {
        grouped[order.userId] = {
          userId: order.userId,
          orders: [],
          totalOrders: 0,
          pendingCount: 0,
          inProgressCount: 0,
          completedCount: 0,
          totalValue: 0,
          lastOrderDate: null
        };
      }
      
      grouped[order.userId].orders.push(order);
      grouped[order.userId].totalOrders++;
      grouped[order.userId].totalValue += order.total;
      
      // Count by status
      if (order.status === 'pending') {
        grouped[order.userId].pendingCount++;
      } else if (['approved', 'dispatched', 'delayed', 'ready'].includes(order.status)) {
        grouped[order.userId].inProgressCount++;
      } else if (['delivered', 'collected'].includes(order.status)) {
        grouped[order.userId].completedCount++;
      }
      
      // Track latest order date
      const orderDate = new Date(order.requestedAt);
      if (!grouped[order.userId].lastOrderDate || orderDate > grouped[order.userId].lastOrderDate) {
        grouped[order.userId].lastOrderDate = orderDate;
      }
    });
    
    // Sort orders within each customer group (newest first, pending first)
    Object.values(grouped).forEach(customerGroup => {
      customerGroup.orders.sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'pending') return -1;
          if (b.status === 'pending') return 1;
        }
        return new Date(b.requestedAt) - new Date(a.requestedAt);
      });
    });
    
    setGroupedOrders(grouped);
  };

  // Enhanced search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchTerm = query.trim();
    const searchTermLower = searchTerm.toLowerCase();
    
    // Search by multiple criteria
    const results = orders.filter(order => {
      const orderId = order.id;
      const orderIdLower = orderId.toLowerCase();
      const customerEmail = order.userId.toLowerCase();
      const orderStatus = order.status.toLowerCase();
      
      // Search criteria - prioritize exact order ID match
      const matchesExactOrderId = orderId === searchTerm || orderIdLower === searchTermLower;
      const matchesPartialOrderId = orderIdLower.includes(searchTermLower) || 
                                   orderId.includes(searchTerm) ||
                                   orderIdLower.slice(-6).includes(searchTermLower) ||
                                   orderIdLower.slice(-8).includes(searchTermLower) ||
                                   orderId.slice(-6).includes(searchTerm) ||
                                   orderId.slice(-8).includes(searchTerm);
      
      const matchesOrderId = matchesExactOrderId || matchesPartialOrderId;
      
      const matchesCustomer = customerEmail.includes(searchTermLower);
      
      const matchesStatus = orderStatus.includes(searchTermLower);
      
      const matchesOrderType = (searchTermLower.includes('delivery') && order.withDelivery) ||
                              (searchTermLower.includes('pickup') && !order.withDelivery) ||
                              (searchTermLower.includes('self') && !order.withDelivery);
      
      // Search in order items
      const matchesItems = order.items.some(item => 
        item.name.toLowerCase().includes(searchTermLower)
      );
      
      // Search by total amount (if query is a number)
      const matchesAmount = !isNaN(searchTermLower) && 
                           order.total.toString().includes(searchTermLower);
      
      return matchesOrderId || matchesCustomer || matchesStatus || 
             matchesOrderType || matchesItems || matchesAmount;
    });

    // Sort results by relevance (exact order ID match first, then pending orders, then by date)
    results.sort((a, b) => {
      // Prioritize exact order ID matches
      const aExactMatch = a.id === searchTerm || a.id.toLowerCase() === searchTermLower;
      const bExactMatch = b.id === searchTerm || b.id.toLowerCase() === searchTermLower;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then by status (pending first)
      if (a.status !== b.status) {
        if (a.status === 'pending') return -1;
        if (b.status === 'pending') return 1;
      }
      
      // Finally by date (newest first)
      return new Date(b.requestedAt) - new Date(a.requestedAt);
    });

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const toggleCustomerExpansion = (userId) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedCustomers(newExpanded);
  };

  const handleApprove = async (requestId, timeInput) => {
    let time = '';
    if (timeInput) {
      time = timeInput.trim();
    } else if (deliveryDateTime) {
      const dt = new Date(deliveryDateTime);
      time = dt.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (deliveryTime) {
      time = deliveryTime.trim();
    }
    
    if (!time) {
      alert('Please select delivery time');
      return;
    }
    
    setSelectedRequest(null);
    setDeliveryTime('');
    setDeliveryDateTime('');

    try {
      await ordersAPI.approve(requestId, time);
      
      // Create notification
      const approvedOrder = orders.find((o) => o.id === requestId);
      if (approvedOrder) {
        const notificationsRaw = localStorage.getItem('userNotifications');
        const notifications = notificationsRaw ? JSON.parse(notificationsRaw) : [];
        notifications.push({
          id: Date.now(),
          userId: approvedOrder.userId,
          type: 'approved',
          message: `Your order request has been approved! Delivery time: ${time}`,
          requestId: requestId,
          total: approvedOrder.total,
          deliveryTime: time,
          createdAt: new Date().toLocaleString(),
          read: false,
        });
        localStorage.setItem('userNotifications', JSON.stringify(notifications));
      }

      await loadOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order. Please try again.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await ordersAPI.reject(requestId);
      
      const rejectedOrder = orders.find((o) => o.id === requestId);
      if (rejectedOrder) {
        const notificationsRaw = localStorage.getItem('userNotifications');
        const notifications = notificationsRaw ? JSON.parse(notificationsRaw) : [];
        notifications.push({
          id: Date.now(),
          userId: rejectedOrder.userId,
          type: 'rejected',
          message: 'Your order request has been rejected.',
          requestId: requestId,
          total: rejectedOrder.total,
          createdAt: new Date().toLocaleString(),
          read: false,
        });
        localStorage.setItem('userNotifications', JSON.stringify(notifications));
      }

      await loadOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order. Please try again.');
    }
  };

  const handleBulkApprove = async (userId) => {
    const customerOrders = groupedOrders[userId]?.orders.filter(order => order.status === 'pending') || [];
    if (customerOrders.length === 0) {
      alert('No pending orders to approve for this customer');
      return;
    }

    const defaultTime = new Date();
    defaultTime.setDate(defaultTime.getDate() + 1);
    defaultTime.setHours(10, 0, 0, 0);
    const timeString = defaultTime.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    try {
      for (const order of customerOrders) {
        await ordersAPI.approve(order.id, timeString);
      }
      await loadOrders();
      alert(`Approved ${customerOrders.length} orders for ${userId}`);
    } catch (error) {
      console.error('Error bulk approving orders:', error);
      alert('Failed to approve some orders. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      dispatched: '#3b82f6',
      delayed: '#ef4444',
      delivered: '#059669',
      ready: '#8b5cf6',
      collected: '#059669',
      rejected: '#ef4444'
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
      ready: '📋',
      collected: '✅',
      rejected: '❌'
    };
    return icons[status] || '❓';
  };

  const cardStyle = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  };

  const customerHeaderStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  };

  const orderCardStyle = {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    marginLeft: '16px',
  };

  // Sort customers by priority: those with pending orders first, then by last order date
  const sortedCustomers = Object.values(groupedOrders).sort((a, b) => {
    if (a.pendingCount !== b.pendingCount) {
      return b.pendingCount - a.pendingCount; // More pending orders first
    }
    return b.lastOrderDate - a.lastOrderDate; // More recent orders first
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <OwnerNavbar />
      <div style={{ padding: '32px', flex: 1 }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}>
          <h1 style={{
            marginBottom: '20px',
            fontSize: '36px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>ORDER REQUESTS</h1>

          {/* Enhanced Order Search Bar */}
          <div style={{ 
            marginBottom: '24px',
            padding: '20px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '8px'
            }}>
              <span style={{ 
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151'
              }}>🔍 Smart Search</span>
              {showSearchResults && (
                <span style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  background: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '12px'
                }}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by Order ID, Customer Email, Status, Product, Amount..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    padding: '12px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              marginTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                💡 <strong>Search Examples:</strong>
              </div>
              <div style={{ marginLeft: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <span>• Order ID: "67a1b2" or "345678"</span>
                <span>• Customer: "john@email.com"</span>
                <span>• Status: "pending", "approved"</span>
                <span>• Product: "cement", "sand"</span>
                <span>• Type: "delivery", "pickup"</span>
                <span>• Amount: "500", "1000"</span>
              </div>
            </div>
            
            {/* Quick Filter Buttons */}
            <div style={{ 
              marginTop: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginRight: '8px', alignSelf: 'center' }}>
                Quick Filters:
              </div>
              {[
                { label: 'Pending', value: 'pending', color: '#f59e0b' },
                { label: 'Approved', value: 'approved', color: '#10b981' },
                { label: 'Delivery', value: 'delivery', color: '#3b82f6' },
                { label: 'Pickup', value: 'pickup', color: '#8b5cf6' },
                { label: 'Today', value: new Date().toISOString().split('T')[0], color: '#ef4444' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => handleSearch(filter.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'white',
                    background: filter.color,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'transform 0.1s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px', fontSize: '14px', color: '#64748b' }}>
            Total Customers: {Object.keys(groupedOrders).length} | 
            Total Orders: {orders.length} | 
            Pending: {orders.filter(o => o.status === 'pending').length}
          </div>

          {/* Enhanced Search Results Section */}
          {showSearchResults && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎯 Search Results for "{searchQuery}"
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  background: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '12px'
                }}>
                  {searchResults.length} found
                </span>
              </h2>
              
              {searchResults.length === 0 ? (
                <div style={{
                  padding: '20px',
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  color: '#92400e'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>No orders found</div>
                  <div>Try searching with:</div>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Full or partial Order ID</li>
                    <li>Customer email address</li>
                    <li>Order status (pending, approved, etc.)</li>
                    <li>Product names (cement, sand, etc.)</li>
                    <li>Order type (delivery, pickup)</li>
                    <li>Amount values</li>
                  </ul>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {searchResults.map((order) => {
                    const highlightText = (text, query) => {
                      if (!query || !text) return text;
                      const regex = new RegExp(`(${query})`, 'gi');
                      const parts = text.split(regex);
                      return parts.map((part, index) => 
                        regex.test(part) ? 
                          <span key={index} style={{ background: '#fef08a', fontWeight: 'bold' }}>{part}</span> : 
                          part
                      );
                    };

                    return (
                      <div key={order.id} style={{
                        background: '#f0fdf4',
                        border: '2px solid #bbf7d0',
                        borderRadius: '12px',
                        padding: '20px',
                        position: 'relative'
                      }}>
                        {/* Priority Badge */}
                        {order.status === 'pending' && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: '#ef4444',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            URGENT
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '16px', color: '#065f46', marginBottom: '4px' }}>
                              📋 Order ID: {highlightText(order.id, searchQuery)}
                            </div>
                            <div style={{ fontSize: '14px', color: '#047857', marginBottom: '4px' }}>
                              👤 Customer: {highlightText(order.userId, searchQuery)}
                            </div>
                            <div style={{ fontSize: '14px', color: '#047857', marginBottom: '4px' }}>
                              📅 Ordered: {new Date(order.requestedAt).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '14px', color: '#047857', marginBottom: '4px' }}>
                              🚚 Type: {order.withDelivery ? 
                                highlightText('Delivery', searchQuery) : 
                                highlightText('Self-Pickup', searchQuery)
                              }
                            </div>
                            {order.deliveryTime && (
                              <div style={{ fontSize: '14px', color: '#047857' }}>
                                ⏰ Scheduled: {order.deliveryTime}
                              </div>
                            )}
                          </div>
                          <div style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: order.status === 'pending' ? '#fbbf24' : 
                                       order.status === 'approved' ? '#10b981' : 
                                       order.status === 'dispatched' ? '#3b82f6' :
                                       order.status === 'delayed' ? '#ef4444' :
                                       order.status === 'delivered' ? '#059669' : 
                                       order.status === 'ready' ? '#8b5cf6' :
                                       order.status === 'collected' ? '#059669' : '#6b7280',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {highlightText(order.status, searchQuery)}
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>📦 Order Items:</div>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              padding: '4px 0',
                              borderBottom: idx === order.items.length - 1 ? 'none' : '1px solid #bbf7d0'
                            }}>
                              <span style={{ color: '#047857' }}>
                                {highlightText(item.name, searchQuery)}
                              </span>
                              <span style={{ color: '#047857', fontWeight: '600' }}>
                                {item.units} × ₹{item.pricePerUnit} = ₹{highlightText(item.subtotal.toString(), searchQuery)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingTop: '12px',
                          borderTop: '2px solid #bbf7d0'
                        }}>
                          <div style={{ fontWeight: '700', fontSize: '16px', color: '#065f46' }}>
                            💰 Total: ₹{highlightText(order.total.toFixed(2), searchQuery)}
                          </div>
                          <button
                            onClick={() => {
                              // Scroll to the customer section
                              clearSearch();
                              setTimeout(() => {
                                const customerElement = document.getElementById(`customer-${order.userId}`);
                                if (customerElement) {
                                  customerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  // Expand the customer section
                                  setExpandedCustomers(prev => new Set([...prev, order.userId]));
                                }
                              }, 100);
                            }}
                            style={{
                              padding: '8px 16px',
                              background: '#059669',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            📍 Go to Customer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Customer Groups Display */}

          {sortedCustomers.length === 0 ? (
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.8' }}>
              No requests yet. When users proceed to checkout, their requests will appear here grouped by customer.
            </p>
          ) : (
            sortedCustomers.map((customerGroup) => (
              <div key={customerGroup.userId} id={`customer-${customerGroup.userId}`} style={{ marginBottom: '20px' }}>
                {/* Customer Header */}
                <div 
                  style={customerHeaderStyle}
                  onClick={() => toggleCustomerExpansion(customerGroup.userId)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>
                        {expandedCustomers.has(customerGroup.userId) ? '📂' : '📁'}
                      </span>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {customerGroup.userId}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>
                          Last order: {customerGroup.lastOrderDate?.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                          {customerGroup.pendingCount}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>PENDING</div>
                      </div>
                      
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                          {customerGroup.inProgressCount}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>IN PROGRESS</div>
                      </div>
                      
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                          {customerGroup.completedCount}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>COMPLETED</div>
                      </div>
                      
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          ₹{customerGroup.totalValue.toFixed(0)}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>TOTAL VALUE</div>
                      </div>

                      {customerGroup.pendingCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBulkApprove(customerGroup.userId);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          Approve All ({customerGroup.pendingCount})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Orders */}
                {expandedCustomers.has(customerGroup.userId) && (
                  <div style={{ marginLeft: '0px' }}>
                    {customerGroup.orders.map((order) => (
                      <div key={order.id} style={orderCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                              Order ID: {order.id}
                            </div>
                            <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                              {new Date(order.requestedAt).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{getStatusIcon(order.status)}</span>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              color: 'white',
                              backgroundColor: getStatusColor(order.status)
                            }}>
                              {order.status.toUpperCase()}
                            </span>
                            {(order.userPhone || order.customerPhone) && (
                              <button
                                onClick={() => {
                                  const phone = order.userPhone || order.customerPhone;
                                  const phoneNumber = phone.replace(/[^0-9]/g, '');
                                  const message = `Hello! This is regarding your order #${order.id}. `;
                                  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
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
                                title="Contact customer via WhatsApp"
                              >
                                <WhatsAppIcon size={16} color="#fff" /> WhatsApp
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div style={{ marginBottom: '12px' }}>
                          {order.items.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              padding: '6px 0', 
                              borderBottom: idx === order.items.length - 1 ? 'none' : '1px solid #e5e7eb',
                              fontSize: '13px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img src={item.image} alt={item.name} style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                                <div>
                                  <div style={{ fontWeight: 600, color: '#111827' }}>{item.name}</div>
                                  <div style={{ fontSize: '11px', color: '#374151' }}>{item.units} × ₹{item.pricePerUnit}</div>
                                </div>
                              </div>
                              <div style={{ fontWeight: 600, color: '#111827' }}>₹{item.subtotal.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>

                        {/* Order Total */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontWeight: 700, 
                          fontSize: '14px', 
                          color: '#111827',
                          marginBottom: '12px',
                          paddingTop: '8px',
                          borderTop: '1px solid #e5e7eb'
                        }}>
                          <span>Total ({order.withDelivery ? 'with delivery' : 'pickup'}):</span>
                          <span>₹{order.total.toFixed(2)}</span>
                        </div>

                        {/* Actions for Pending Orders */}
                        {order.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <input
                              type="datetime-local"
                              data-request-id={order.id}
                              value={selectedRequest === order.id ? deliveryDateTime : getDefaultDateTime()}
                              min={new Date().toISOString().slice(0, 16)}
                              onChange={(e) => {
                                setSelectedRequest(order.id);
                                setDeliveryDateTime(e.target.value);
                              }}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '12px',
                                flex: '1',
                                minWidth: '200px',
                                background: '#fff',
                              }}
                            />
                            <button
                              onClick={() => {
                                const input = document.querySelector(`input[data-request-id="${order.id}"]`);
                                const dtValue = input ? input.value : (selectedRequest === order.id ? deliveryDateTime : getDefaultDateTime());
                                handleApprove(order.id, dtValue);
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(order.id)}
                              style={{
                                padding: '6px 12px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* Delivery Time Display */}
                        {order.status === 'approved' && order.deliveryTime && (
                          <div style={{ 
                            padding: '6px 10px', 
                            background: '#d1fae5', 
                            borderRadius: '6px', 
                            fontSize: '12px', 
                            color: '#065f46', 
                            fontWeight: 600,
                            marginBottom: '12px'
                          }}>
                            ✓ Delivery Time: {order.deliveryTime}
                          </div>
                        )}

                        {/* Order Workflow Manager */}
                        {order.status !== 'pending' && order.status !== 'rejected' && (
                          <OrderWorkflowManager 
                            order={order} 
                            onStatusUpdate={(updatedOrder) => {
                              setOrders(prev => prev.map(o => o.id === updatedOrder._id ? {
                                ...o,
                                status: updatedOrder.status,
                                dispatchedAt: updatedOrder.dispatchedAt,
                                deliveredAt: updatedOrder.deliveredAt,
                                readyAt: updatedOrder.readyAt,
                                collectedAt: updatedOrder.collectedAt,
                                delayedAt: updatedOrder.delayedAt,
                                delayReason: updatedOrder.delayReason,
                                apologizeMessage: updatedOrder.apologizeMessage,
                                newDeliveryTime: updatedOrder.newDeliveryTime,
                                customerPhone: updatedOrder.customerPhone,
                                inAppMessages: updatedOrder.inAppMessages,
                                deliveryReports: updatedOrder.deliveryReports
                              } : o));
                              // Refresh grouping
                              loadOrders();
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestPage;