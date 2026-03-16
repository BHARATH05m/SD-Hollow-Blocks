import React, { useState } from 'react';
import { ordersAPI } from '../utils/api.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';

function OrderWorkflowManager({ order, onStatusUpdate }) {
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReportResponseModal, setShowReportResponseModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [delayReason, setDelayReason] = useState('');
  const [apologizeMessage, setApologizeMessage] = useState('');
  const [newDeliveryTime, setNewDeliveryTime] = useState('');
  const [message, setMessage] = useState('');
  const [reportResponse, setReportResponse] = useState('');

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      dispatched: '#3b82f6',
      delayed: '#ef4444',
      delivered: '#059669',
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
      ready: '📋',
      collected: '✅'
    };
    return icons[status] || '❓';
  };

  const handleDispatch = async () => {
    try {
      const response = await ordersAPI.dispatch(order.id);
      onStatusUpdate(response.data);
    } catch (error) {
      console.error('Error dispatching order:', error);
      alert('Failed to dispatch order');
    }
  };

  const handleDelay = async () => {
    if (!delayReason || !apologizeMessage || !newDeliveryTime) {
      alert('Please fill all delay fields');
      return;
    }

    try {
      const response = await ordersAPI.delay(order.id, {
        delayReason,
        apologizeMessage,
        newDeliveryTime
      });
      
      onStatusUpdate(response.data);
      setShowDelayModal(false);
      setDelayReason('');
      setApologizeMessage('');
      setNewDeliveryTime('');
    } catch (error) {
      console.error('Error marking order as delayed:', error);
      alert('Failed to mark order as delayed');
    }
  };

  const handleDeliver = async () => {
    try {
      const response = await ordersAPI.deliver(order.id);
      onStatusUpdate(response.data);
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      alert('Failed to mark order as delivered');
    }
  };

  const handleMarkReady = async () => {
    try {
      const response = await ordersAPI.markReady(order.id);
      onStatusUpdate(response.data);
    } catch (error) {
      console.error('Error marking order as ready:', error);
      alert('Failed to mark order as ready');
    }
  };

  const handleMarkCollected = async () => {
    try {
      const response = await ordersAPI.markCollected(order.id);
      onStatusUpdate(response.data);
    } catch (error) {
      console.error('Error marking order as collected:', error);
      alert('Failed to mark order as collected');
    }
  };

  const openWhatsApp = () => {
    // Support both userPhone and customerPhone field names
    const phone = order.userPhone || order.customerPhone;
    if (!phone) {
      alert('Customer phone number not available.');
      return;
    }
    
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    const message = `Hello! This is regarding your order #${order.id}. `;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendMessage = async () => {
    if (!message) {
      alert('Please enter a message');
      return;
    }

    try {
      const response = await ordersAPI.addMessage(order.id, message, 'admin');
      onStatusUpdate(response.data);
      setShowMessageModal(false);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleRespondToReport = async () => {
    if (!reportResponse.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      const response = await ordersAPI.respondToReport(order.id, selectedReport._id, reportResponse.trim());
      onStatusUpdate(response.data);
      setShowReportResponseModal(false);
      setSelectedReport(null);
      setReportResponse('');
    } catch (error) {
      console.error('Error responding to report:', error);
      alert('Failed to respond to report');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      const response = await ordersAPI.resolveReport(order.id, reportId);
      onStatusUpdate(response.data);
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to resolve report');
    }
  };

  const getReportTypeText = (type) => {
    const types = {
      'not_delivered': 'Product Not Delivered',
      'partial_delivery': 'Partial Delivery',
      'damaged_goods': 'Damaged Goods',
      'wrong_items': 'Wrong Items',
      'delivery_delay': 'Excessive Delivery Delay',
      'product_quality': 'Product Not Good/Poor Quality',
      'incomplete_order': 'Incomplete Order',
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

  // Only show delivery workflow for orders with delivery
  const hasDelivery = order.withDelivery;
  const canDispatch = order.status === 'approved' && hasDelivery;
  const canDelay = ['approved', 'dispatched'].includes(order.status) && hasDelivery;
  const canDeliver = ['approved', 'dispatched', 'delayed'].includes(order.status) && hasDelivery;
  
  // For self-pickup orders, only show "Mark as Ready" and "Mark as Collected"
  const canMarkReady = order.status === 'approved' && !hasDelivery;
  const canMarkCollected = ['approved', 'ready'].includes(order.status) && !hasDelivery;

  return (
    <div style={{ marginTop: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '24px', marginRight: '8px' }}>
          {getStatusIcon(order.status)}
        </span>
        <span style={{ 
          fontWeight: 'bold', 
          color: getStatusColor(order.status),
          textTransform: 'capitalize'
        }}>
          {order.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {/* Delivery Orders - Full workflow */}
        {hasDelivery && (
          <>
            {canDispatch && (
              <button
                onClick={handleDispatch}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🚚 Dispatch
              </button>
            )}

            {canDelay && (
              <button
                onClick={() => setShowDelayModal(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ⚠️ Mark Delayed
              </button>
            )}

            {canDeliver && (
              <button
                onClick={handleDeliver}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📦 Mark Delivered
              </button>
            )}
          </>
        )}

        {/* Self-Pickup Orders - Simplified workflow */}
        {!hasDelivery && (
          <>
            {canMarkReady && (
              <button
                onClick={handleMarkReady}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📋 Mark Ready for Pickup
              </button>
            )}

            {canMarkCollected && (
              <button
                onClick={handleMarkCollected}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ✅ Mark Collected
              </button>
            )}
          </>
        )}

        <button
          onClick={() => setShowMessageModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          💬 Send Message
        </button>

        {(order.userPhone || order.customerPhone) && (
          <button
            onClick={openWhatsApp}
            style={{
              padding: '8px 16px',
              backgroundColor: '#25d366',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <WhatsAppIcon size={18} color="#fff" /> WhatsApp
          </button>
        )}
      </div>

      {(order.userPhone || order.customerPhone) && (
        <div style={{ marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
          📞 Customer Phone: {order.userPhone || order.customerPhone}
        </div>
      )}

      {order.delayReason && (
        <div style={{ 
          marginBottom: '8px', 
          padding: '12px', 
          backgroundColor: '#fef2f2', 
          borderRadius: '6px',
          border: '2px solid #fecaca'
        }}>
          <div style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
            ⚠️ Delivery Delayed
          </div>
          
          {order.newDeliveryTime && (
            <div style={{ 
              backgroundColor: '#fee2e2',
              padding: '8px',
              borderRadius: '4px',
              marginBottom: '8px',
              border: '1px solid #fca5a5'
            }}>
              <div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '14px' }}>
                🕒 New Delivery Time: {order.newDeliveryTime}
              </div>
            </div>
          )}
          
          <div style={{ color: '#7f1d1d', marginBottom: '4px' }}>
            <strong>Reason:</strong> {order.delayReason}
          </div>
          
          {order.apologizeMessage && (
            <div style={{ color: '#7f1d1d' }}>
              <strong>Apology:</strong> {order.apologizeMessage}
            </div>
          )}
        </div>
      )}

      {/* Delivery Reports Section */}
      {order.deliveryReports && order.deliveryReports.length > 0 && (
        <div style={{ 
          marginTop: '16px',
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
            🚨 Customer Delivery Reports ({order.deliveryReports.length})
          </div>
          
          {order.deliveryReports.map((report, idx) => (
            <div key={report._id || idx} style={{ 
              backgroundColor: '#fef9e7',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: idx < order.deliveryReports.length - 1 ? '12px' : '0',
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
                <strong>Customer Report:</strong> {report.reportMessage}
              </div>
              
              <div style={{ color: '#78350f', fontSize: '12px', marginBottom: '8px' }}>
                <strong>Reported:</strong> {new Date(report.reportedAt).toLocaleString()}
              </div>
              
              {report.ownerResponse && (
                <div style={{ 
                  backgroundColor: '#e0f2fe',
                  padding: '8px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  border: '1px solid #b3e5fc'
                }}>
                  <div style={{ color: '#01579b', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Your Response:
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
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {report.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowReportResponseModal(true);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📝 Respond
                  </button>
                )}
                
                {report.status === 'acknowledged' && (
                  <button
                    onClick={() => handleResolveReport(report._id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✅ Mark Resolved
                  </button>
                )}
                
                {report.status === 'resolved' && (
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ✅ Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delay Modal */}
      {showDelayModal && (
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
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Mark Order as Delayed</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Delay Reason:
              </label>
              <textarea
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="e.g., Traffic delay, Vehicle breakdown, Weather conditions..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Apology Message:
              </label>
              <textarea
                value={apologizeMessage}
                onChange={(e) => setApologizeMessage(e.target.value)}
                placeholder="We sincerely apologize for the delay..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                New Delivery Time:
              </label>
              <input
                type="text"
                value={newDeliveryTime}
                onChange={(e) => setNewDeliveryTime(e.target.value)}
                placeholder="e.g., Tomorrow 2:00 PM"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDelayModal(false)}
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
                onClick={handleDelay}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Mark as Delayed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
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
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Send In-App Message</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message to the customer..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  minHeight: '100px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowMessageModal(false)}
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
                onClick={handleSendMessage}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Response Modal */}
      {showReportResponseModal && selectedReport && (
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
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#dc2626' }}>
              📝 Respond to Delivery Report
            </h3>
            
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '16px',
              border: '1px solid #fbbf24'
            }}>
              <div style={{ color: '#92400e', fontSize: '14px', marginBottom: '8px' }}>
                <strong>Report Type:</strong> {getReportTypeText(selectedReport.reportType)}
              </div>
              <div style={{ color: '#92400e', fontSize: '14px' }}>
                <strong>Customer Issue:</strong> {selectedReport.reportMessage}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Your Response:
              </label>
              <textarea
                value={reportResponse}
                onChange={(e) => setReportResponse(e.target.value)}
                placeholder="Provide your response to address the customer's concern..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  minHeight: '100px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowReportResponseModal(false);
                  setSelectedReport(null);
                  setReportResponse('');
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
                onClick={handleRespondToReport}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderWorkflowManager;