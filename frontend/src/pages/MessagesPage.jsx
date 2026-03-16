import React, { useState, useEffect } from 'react';
import CustomerNavbar from '../components/CustomerNavbar.jsx';
import OwnerNavbar from '../components/OwnerNavbar.jsx';
import { ordersAPI, generalMessagesAPI } from '../utils/api.js';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';

function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conversationType, setConversationType] = useState('all'); // 'all', 'orders', 'general'
  
  // New message modal states
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  useEffect(() => {
    // Get current user
    const userRaw = localStorage.getItem('currentUser');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setCurrentUser(user);
        loadConversations(user);
        
        // Load available users if owner (for new general messages)
        if (user.role === 'owner' || user.role === 'admin') {
          loadAvailableUsers();
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      // Refresh messages every 3 seconds for selected conversation
      const interval = setInterval(() => loadMessages(selectedConversation.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async (user) => {
    try {
      setLoading(true);
      let response;
      
      if (user.role === 'owner' || user.role === 'admin') {
        // Owner sees all orders with messages
        response = await ordersAPI.getAll();
      } else {
        // Customer sees only their orders
        response = await ordersAPI.getAll({ userId: user.id });
      }

      const orders = response.data;
      
      // Filter orders that have messages or are not rejected
      const conversationList = orders
        .filter(order => order.status !== 'rejected')
        .map(order => ({
          id: order._id,
          userId: order.userId,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          lastMessageTime: order.inAppMessages && order.inAppMessages.length > 0 
            ? new Date(order.inAppMessages[order.inAppMessages.length - 1].timestamp)
            : new Date(order.createdAt),
          unreadCount: order.inAppMessages 
            ? order.inAppMessages.filter(msg => 
                !msg.read && 
                ((user.role === 'owner' || user.role === 'admin') ? msg.sender === 'customer' : msg.sender === 'admin')
              ).length 
            : 0,
          lastMessage: order.inAppMessages && order.inAppMessages.length > 0
            ? order.inAppMessages[order.inAppMessages.length - 1].message
            : 'No messages yet',
          customerPhone: order.customerPhone || '',
          items: order.items || []
        }))
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      setConversations(conversationList);
      
      // Auto-select first conversation if none selected
      if (!selectedConversation && conversationList.length > 0) {
        setSelectedConversation(conversationList[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (orderId) => {
    try {
      const response = await ordersAPI.getMessages(orderId);
      setMessages(response.data || []);
      
      // Mark messages as read for current user
      const unreadMessages = response.data.filter(msg => 
        !msg.read && 
        ((currentUser.role === 'owner' || currentUser.role === 'admin') ? msg.sender === 'customer' : msg.sender === 'admin')
      );
      
      if (unreadMessages.length > 0) {
        // Update unread count in conversations
        setConversations(prev => prev.map(conv => 
          conv.id === orderId ? { ...conv, unreadCount: 0 } : conv
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const senderRole = (currentUser.role === 'owner' || currentUser.role === 'admin') ? 'admin' : 'customer';
      
      await ordersAPI.addMessage(selectedConversation.id, newMessage.trim(), senderRole);
      setNewMessage('');
      
      // Reload messages and conversations
      loadMessages(selectedConversation.id);
      loadConversations(currentUser);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const openWhatsApp = (conversation) => {
    if (!conversation.customerPhone) {
      alert('Customer phone number not available.');
      return;
    }
    
    const phoneNumber = conversation.customerPhone.replace(/[^0-9]/g, '');
    const message = `Hello! This is regarding your order #${conversation.id}. `;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      dispatched: '#3b82f6',
      delayed: '#ef4444',
      delivered: '#059669'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      approved: '✅',
      dispatched: '🚚',
      delayed: '⚠️',
      delivered: '📦'
    };
    return icons[status] || '❓';
  };

  const filteredConversations = conversations.filter(conv => 
    conv.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isOwner = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {isOwner ? <OwnerNavbar /> : <CustomerNavbar />}
      
      <div style={{ flex: 1, display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* Conversations Sidebar */}
        <div style={{
          width: '350px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px'
            }}>
              Messages
            </h2>
            
            {/* Search */}
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    backgroundColor: selectedConversation?.id === conv.id ? '#eff6ff' : 'white',
                    borderLeft: selectedConversation?.id === conv.id ? '4px solid #3b82f6' : '4px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {isOwner ? `Customer: ${conv.userId}` : `Order #${conv.id.slice(-8)}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ 
                          color: getStatusColor(conv.status),
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getStatusIcon(conv.status)} {conv.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          ₹{conv.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {formatTime(conv.lastMessageTime)}
                      </span>
                      {conv.unreadCount > 0 && (
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
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {conv.lastMessage}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111827', marginBottom: '4px' }}>
                    {isOwner ? `Customer: ${selectedConversation.userId}` : `Order #${selectedConversation.id.slice(-8)}`}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      color: getStatusColor(selectedConversation.status),
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {getStatusIcon(selectedConversation.status)} {selectedConversation.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Total: ₹{selectedConversation.total.toFixed(2)}
                    </span>
                    {selectedConversation.items.length > 0 && (
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {selectedConversation.items.length} item{selectedConversation.items.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isOwner && selectedConversation.customerPhone && (
                    <button
                      onClick={() => openWhatsApp(selectedConversation)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#25d366',
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
                      <WhatsAppIcon size={18} color="#fff" /> WhatsApp
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundColor: '#f9fafb'
              }}>
                {messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#6b7280',
                    padding: '40px',
                    fontSize: '16px'
                  }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isCurrentUser = (isOwner && msg.sender === 'admin') || (!isOwner && msg.sender === 'customer');
                    
                    return (
                      <div
                        key={index}
                        style={{
                          alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                          maxWidth: '70%'
                        }}
                      >
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: '18px',
                          backgroundColor: isCurrentUser ? '#3b82f6' : 'white',
                          color: isCurrentUser ? 'white' : '#1f2937',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                          border: isCurrentUser ? 'none' : '1px solid #e5e7eb'
                        }}>
                          <div style={{ marginBottom: '4px', lineHeight: '1.5' }}>
                            {msg.message}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            opacity: 0.7,
                            textAlign: 'right'
                          }}>
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          textAlign: isCurrentUser ? 'right' : 'left',
                          marginTop: '4px',
                          marginLeft: isCurrentUser ? '0' : '8px',
                          marginRight: isCurrentUser ? '8px' : '0'
                        }}>
                          {isCurrentUser ? 'You' : (msg.sender === 'admin' ? 'Admin' : 'Customer')}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div style={{
                padding: '20px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '12px',
                      outline: 'none',
                      resize: 'none',
                      minHeight: '44px',
                      maxHeight: '120px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                    rows={1}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: newMessage.trim() ? '#3b82f6' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '600',
                      minWidth: '80px'
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '18px'
            }}>
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;