import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../utils/api.js';

// Add CSS animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes modalSlideIn {
    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('order-messages-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'order-messages-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

function OrderMessages({ orderId, userId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMessages, setShowMessages] = useState(false);

  // Don't render if no orderId
  if (!orderId) {
    return null;
  }

  useEffect(() => {
    if (orderId && showMessages) {
      loadMessages();
      // Refresh messages every 5 seconds when modal is open
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId, showMessages]);

  const loadMessages = async () => {
    try {
      if (!orderId) {
        console.log('No orderId provided to loadMessages');
        return;
      }
      
      const response = await ordersAPI.getMessages(orderId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Don't show error to user for 404s, just keep messages empty
      if (error.response?.status !== 404) {
        console.error('Non-404 error loading messages:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await ordersAPI.addMessage(orderId, newMessage, 'customer');
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const unreadCount = messages.filter(msg => !msg.read && msg.sender === 'admin').length;

  return (
    <>
      <button
        onClick={() => setShowMessages(true)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        💬 Messages
        {unreadCount > 0 && (
          <span style={{
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showMessages && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          paddingTop: '5vh'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#1f2937',
                fontSize: '18px',
                fontWeight: '600'
              }}>💬 Order Messages</h3>
              <button
                onClick={() => setShowMessages(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>

            {/* Messages Container - Scrollable */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minHeight: '200px',
              maxHeight: 'calc(85vh - 140px)' // Reserve space for header and input
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  padding: '60px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '48px', opacity: 0.5 }}>💬</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No messages yet</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Start a conversation with the owner</div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      animation: 'fadeIn 0.3s ease-in'
                    }}
                  >
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: msg.sender === 'customer' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: msg.sender === 'customer' ? '#3b82f6' : '#f1f5f9',
                      color: msg.sender === 'customer' ? 'white' : '#1f2937',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        marginBottom: '6px',
                        lineHeight: '1.4',
                        wordWrap: 'break-word'
                      }}>
                        {msg.message}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        opacity: msg.sender === 'customer' ? 0.8 : 0.6,
                        textAlign: 'right',
                        marginTop: '4px'
                      }}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      textAlign: msg.sender === 'customer' ? 'right' : 'left',
                      marginTop: '4px',
                      marginLeft: msg.sender === 'customer' ? '0' : '8px',
                      marginRight: msg.sender === 'customer' ? '8px' : '0',
                      fontWeight: '500'
                    }}>
                      {msg.sender === 'customer' ? 'You' : 'Owner'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input - Always Visible at Bottom */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f8fafc',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',
              position: 'sticky',
              bottom: 0
            }}>
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '25px',
                      outline: 'none',
                      fontSize: '14px',
                      transition: 'border-color 0.2s',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: newMessage.trim() ? '#3b82f6' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    minWidth: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (newMessage.trim()) {
                      e.target.style.backgroundColor = '#2563eb';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newMessage.trim()) {
                      e.target.style.backgroundColor = '#3b82f6';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span>Send</span>
                  <span style={{ fontSize: '16px' }}>📤</span>
                </button>
              </div>
              
              {/* Helpful tip */}
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Press Enter to send • Messages are delivered instantly
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrderMessages;