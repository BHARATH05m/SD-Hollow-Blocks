import React, { useState, useEffect } from 'react';
import CustomerNavbar from '../components/CustomerNavbar.jsx';
import OwnerNavbar from '../components/OwnerNavbar.jsx';
import { ordersAPI, generalMessagesAPI, usersAPI } from '../utils/api.js';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';

function UnifiedMessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conversationType, setConversationType] = useState('all'); // 'all', 'orders', 'general'
  const [groupedConversations, setGroupedConversations] = useState([]);
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());
  
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
        
        // Load available users for messaging
        if (user.role === 'owner' || user.role === 'admin') {
          loadAvailableUsers();
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedConversation && currentUser) {
      loadMessages(selectedConversation);
      // Refresh messages every 3 seconds for selected conversation
      const interval = setInterval(() => {
        if (selectedConversation && currentUser) {
          loadMessages(selectedConversation);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation?.id, currentUser?.id]);

  const loadConversations = async (user) => {
    try {
      setLoading(true);
      
      // Load order-based conversations
      let orderResponse;
      if (user.role === 'owner' || user.role === 'admin') {
        orderResponse = await ordersAPI.getAll();
      } else {
        orderResponse = await ordersAPI.getAll({ userId: user.id });
      }

      const orderConversations = orderResponse.data
        .filter(order => order.status !== 'rejected')
        .map(order => ({
          id: order._id,
          type: 'order',
          userId: order.userId,
          status: order.status,
          items: order.items || [],
          total: order.total,
          baseTotal: order.baseTotal,
          distanceKm: order.distanceKm,
          deliveryCharge: order.deliveryCharge,
          deliveryTime: order.deliveryTime,
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
          inAppMessages: order.inAppMessages || []
        }));

      // Load general conversations
      let generalConversations = [];
      try {
        const generalResponse = await generalMessagesAPI.getConversations(user.id, user.role);
        generalConversations = generalResponse.data.map(conv => ({
          id: conv.conversationId,
          type: 'general',
          userId: (user.role === 'owner' || user.role === 'admin') ? conv.participants.customer : conv.participants.owner,
          status: conv.status,
          createdAt: conv.createdAt,
          lastMessageTime: new Date(conv.lastMessageTime),
          unreadCount: conv.messages ? conv.messages.filter(msg => 
            !msg.read && 
            ((user.role === 'owner' || user.role === 'admin') ? msg.sender === 'customer' : msg.sender === 'owner')
          ).length : 0,
          lastMessage: conv.messages && conv.messages.length > 0
            ? conv.messages[conv.messages.length - 1].message
            : 'No messages yet',
          inAppMessages: conv.messages || []
        }));
      } catch (error) {
        console.log('No general conversations found:', error.message);
      }

      // Combine and sort all conversations
      const allConversations = [...orderConversations, ...generalConversations]
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      setConversations(allConversations);
      
      // Group conversations by customer for owners
      if (user.role === 'owner' || user.role === 'admin') {
        const grouped = groupConversationsByCustomer(allConversations);
        setGroupedConversations(grouped);
      } else {
        // For customers, use regular conversations
        setGroupedConversations([]);
      }
      
      // Auto-select first conversation if none selected
      if (!selectedConversation && allConversations.length > 0) {
        setSelectedConversation(allConversations[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const groupConversationsByCustomer = (conversations) => {
    const groups = {};
    
    conversations.forEach(conv => {
      const customerId = conv.userId;
      
      if (!groups[customerId]) {
        groups[customerId] = {
          customerId,
          customerEmail: customerId,
          orderConversations: [],
          generalConversation: null,
          totalUnread: 0,
          lastMessageTime: null,
          allConversations: []
        };
      }
      
      groups[customerId].allConversations.push(conv);
      
      if (conv.type === 'order') {
        groups[customerId].orderConversations.push(conv);
      } else {
        groups[customerId].generalConversation = conv;
      }
      
      groups[customerId].totalUnread += conv.unreadCount || 0;
      
      if (!groups[customerId].lastMessageTime || 
          new Date(conv.lastMessageTime) > new Date(groups[customerId].lastMessageTime)) {
        groups[customerId].lastMessageTime = conv.lastMessageTime;
      }
    });
    
    // Convert to array and sort by last message time
    return Object.values(groups).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  };

  const toggleCustomerExpansion = (customerId) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const selectConversation = (conversation, customerGroup = null) => {
    setSelectedConversation(conversation);
    setSelectedCustomerGroup(customerGroup);
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await generalMessagesAPI.getUsers();
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (conversation) => {
    try {
      let response;
      if (conversation.type === 'order') {
        response = await ordersAPI.getMessages(conversation.id, currentUser.id, currentUser.role);
      } else {
        response = await generalMessagesAPI.getMessages(conversation.id, currentUser.id);
      }
      
      setMessages(response.data || []);
      
      // Update unread count in conversations
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      if (selectedConversation.type === 'order') {
        const senderRole = (currentUser.role === 'owner' || currentUser.role === 'admin') ? 'admin' : 'customer';
        await ordersAPI.addMessage(selectedConversation.id, newMessage.trim(), senderRole);
      } else {
        const senderRole = (currentUser.role === 'owner' || currentUser.role === 'admin') ? 'owner' : 'customer';
        await generalMessagesAPI.addMessage(
          selectedConversation.id, 
          newMessage.trim(), 
          senderRole, 
          currentUser.id
        );
      }
      
      setNewMessage('');
      
      // Reload messages and conversations
      loadMessages(selectedConversation);
      loadConversations(currentUser);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const startNewConversation = async () => {
    if (!selectedUser || !initialMessage.trim()) {
      alert('Please select a user and enter a message');
      return;
    }

    try {
      if (currentUser.role === 'owner' || currentUser.role === 'admin') {
        // Owner can message any user
        const response = await generalMessagesAPI.startConversation(
          currentUser.id,
          selectedUser,
          initialMessage.trim()
        );
        
        setShowNewMessageModal(false);
        setSelectedUser('');
        setInitialMessage('');
        
        // Reload conversations and select the new one
        await loadConversations(currentUser);
      } else {
        // Customer can only message the owner
        const response = await generalMessagesAPI.startConversation(
          'owner1', // Default owner ID
          currentUser.id,
          initialMessage.trim()
        );
        
        setShowNewMessageModal(false);
        setInitialMessage('');
        
        // Reload conversations
        await loadConversations(currentUser);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
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
      delivered: '#059669',
      active: '#10b981',
      archived: '#6b7280'
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
      active: '💬',
      archived: '📁'
    };
    return icons[status] || '❓';
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = conversationType === 'all' || 
      (conversationType === 'orders' && conv.type === 'order') ||
      (conversationType === 'general' && conv.type === 'general');
    
    return matchesSearch && matchesType;
  });

  const filteredGroupedConversations = groupedConversations.filter(group => {
    const matchesSearch = group.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.allConversations.some(conv => 
        conv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesType = conversationType === 'all' || 
      (conversationType === 'orders' && group.orderConversations.length > 0) ||
      (conversationType === 'general' && group.generalConversation);
    
    return matchesSearch && matchesType;
  });

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Messages
              </h2>
              
              {/* New Message Button */}
              <button
                onClick={() => setShowNewMessageModal(true)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                + New
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
              {['all', 'orders', 'general'].map(type => (
                <button
                  key={type}
                  onClick={() => setConversationType(type)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: conversationType === type ? '#3b82f6' : '#f3f4f6',
                    color: conversationType === type ? 'white' : '#6b7280'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            
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
            ) : (isOwner && groupedConversations.length > 0) ? (
              // Grouped view for owners
              <div>
                {filteredGroupedConversations.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    {searchTerm ? 'No conversations found' : 'No conversations yet. Click "New" to start messaging.'}
                  </div>
                ) : (
                  filteredGroupedConversations.map((customerGroup) => (
                    <div key={customerGroup.customerId}>
                      {/* Customer Header */}
                      <div
                        onClick={() => toggleCustomerExpansion(customerGroup.customerId)}
                        style={{
                          padding: '16px',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          backgroundColor: '#f9fafb',
                          borderLeft: '4px solid #3b82f6',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', color: '#111827', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{expandedCustomers.has(customerGroup.customerId) ? '📂' : '📁'}</span>
                            <span>👤 {customerGroup.customerEmail}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {customerGroup.orderConversations.length} order{customerGroup.orderConversations.length !== 1 ? 's' : ''}
                            {customerGroup.generalConversation && ', 1 general chat'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {formatTime(customerGroup.lastMessageTime)}
                          </span>
                          {customerGroup.totalUnread > 0 && (
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
                              {customerGroup.totalUnread}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Conversations */}
                      {expandedCustomers.has(customerGroup.customerId) && (
                        <div style={{ backgroundColor: '#fefefe' }}>
                          {/* General Conversation */}
                          {customerGroup.generalConversation && (
                            <div
                              onClick={() => selectConversation(customerGroup.generalConversation, customerGroup)}
                              style={{
                                padding: '12px 32px',
                                borderBottom: '1px solid #f3f4f6',
                                cursor: 'pointer',
                                backgroundColor: selectedConversation?.id === customerGroup.generalConversation.id ? '#eff6ff' : 'white',
                                borderLeft: selectedConversation?.id === customerGroup.generalConversation.id ? '4px solid #3b82f6' : '4px solid transparent',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                                <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>
                                  💬 General Chat
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                    {formatTime(customerGroup.generalConversation.lastMessageTime)}
                                  </span>
                                  {customerGroup.generalConversation.unreadCount > 0 && (
                                    <span style={{
                                      backgroundColor: '#ef4444',
                                      color: 'white',
                                      borderRadius: '50%',
                                      width: '16px',
                                      height: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px',
                                      fontWeight: 'bold'
                                    }}>
                                      {customerGroup.generalConversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {customerGroup.generalConversation.lastMessage}
                              </div>
                            </div>
                          )}

                          {/* Order Conversations */}
                          {customerGroup.orderConversations.map((conv) => (
                            <div
                              key={conv.id}
                              onClick={() => selectConversation(conv, customerGroup)}
                              style={{
                                padding: '12px 32px',
                                borderBottom: '1px solid #f3f4f6',
                                cursor: 'pointer',
                                backgroundColor: selectedConversation?.id === conv.id ? '#eff6ff' : 'white',
                                borderLeft: selectedConversation?.id === conv.id ? '4px solid #3b82f6' : '4px solid transparent',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px', marginBottom: '2px' }}>
                                    📦 Order #{conv.id.slice(-8)}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <span style={{ 
                                      color: getStatusColor(conv.status),
                                      fontSize: '11px',
                                      fontWeight: '600'
                                    }}>
                                      {getStatusIcon(conv.status)} {conv.status.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                      ₹{conv.total?.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                    {formatTime(conv.lastMessageTime)}
                                  </span>
                                  {conv.unreadCount > 0 && (
                                    <span style={{
                                      backgroundColor: '#ef4444',
                                      color: 'white',
                                      borderRadius: '50%',
                                      width: '16px',
                                      height: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px',
                                      fontWeight: 'bold'
                                    }}>
                                      {conv.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {conv.lastMessage}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Regular view for customers or when no grouping
              <div>
                {filteredConversations.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    {searchTerm ? 'No conversations found' : 'No conversations yet. Click "New" to start messaging.'}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
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
                            {conv.type === 'order' 
                              ? (isOwner ? `Customer: ${conv.userId}` : `Order #${conv.id.slice(-8)}`)
                              : (isOwner ? `Customer: ${conv.userId}` : 'Owner')
                            }
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ 
                              color: getStatusColor(conv.status),
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {getStatusIcon(conv.status)} {conv.type === 'order' ? conv.status.toUpperCase() : 'CHAT'}
                            </span>
                            {conv.type === 'order' && (
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                ₹{conv.total?.toFixed(2)}
                              </span>
                            )}
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
                    {selectedCustomerGroup ? (
                      // Show customer context when grouped
                      <>
                        👤 {selectedCustomerGroup.customerEmail}
                        {selectedConversation.type === 'order' && (
                          <span style={{ fontSize: '16px', color: '#6b7280', marginLeft: '8px' }}>
                            → 📦 Order #{selectedConversation.id.slice(-8)}
                          </span>
                        )}
                        {selectedConversation.type === 'general' && (
                          <span style={{ fontSize: '16px', color: '#6b7280', marginLeft: '8px' }}>
                            → 💬 General Chat
                          </span>
                        )}
                      </>
                    ) : (
                      // Regular display
                      selectedConversation.type === 'order' 
                        ? (isOwner ? `Customer: ${selectedConversation.userId}` : `Order #${selectedConversation.id.slice(-8)}`)
                        : (isOwner ? `Customer: ${selectedConversation.userId}` : 'Owner')
                    )}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      color: getStatusColor(selectedConversation.status),
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {getStatusIcon(selectedConversation.status)} {selectedConversation.type === 'order' ? selectedConversation.status.toUpperCase() : 'CHAT'}
                    </span>
                    {selectedConversation.type === 'order' && (
                      <>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          Total: ₹{selectedConversation.total?.toFixed(2)}
                        </span>
                        {selectedConversation.items && selectedConversation.items.length > 0 && (
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>
                            {selectedConversation.items.length} item{selectedConversation.items.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Owner's WhatsApp button for customers */}
                  {!isOwner && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await usersAPI.getOwnerContact();
                          const ownerPhone = response.data.phone;
                          const message = `Hello! I would like to discuss ${selectedConversation.type === 'order' ? `my order #${selectedConversation.id}` : 'my inquiry'}. `;
                          const whatsappUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                        } catch (error) {
                          console.error('Error getting owner contact:', error);
                          alert('Unable to get owner contact. Please try again.');
                        }
                      }}
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
                      <WhatsAppIcon size={18} color="#fff" /> Contact Owner
                    </button>
                  )}
                  
                  {/* Customer's WhatsApp button for owner */}
                  {isOwner && selectedConversation.customerPhone && (
                    <button
                      onClick={() => {
                        const phoneNumber = selectedConversation.customerPhone.replace(/[^0-9]/g, '');
                        const message = `Hello! This is regarding ${selectedConversation.type === 'order' ? `your order #${selectedConversation.id}` : 'our conversation'}. `;
                        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
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
                      <WhatsAppIcon size={18} color="#fff" /> WhatsApp Customer
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
                    const isCurrentUser = selectedConversation.type === 'order' 
                      ? (isOwner && msg.sender === 'admin') || (!isOwner && msg.sender === 'customer')
                      : (isOwner && msg.sender === 'owner') || (!isOwner && msg.sender === 'customer');
                    
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
                          {isCurrentUser ? 'You' : (selectedConversation.type === 'order' 
                            ? (msg.sender === 'admin' ? 'Admin' : 'Customer')
                            : (msg.sender === 'owner' ? 'Owner' : 'Customer')
                          )}
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

      {/* New Message Modal */}
      {showNewMessageModal && (
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
            <h3 style={{ marginBottom: '16px' }}>
              {isOwner ? 'Start New Conversation' : 'Message Owner'}
            </h3>
            
            {isOwner && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Select Customer:
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <option value="">Choose a customer...</option>
                  {availableUsers.map(user => (
                    <option key={user._id} value={user.email}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Message:
              </label>
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setSelectedUser('');
                  setInitialMessage('');
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
                onClick={startNewConversation}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
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
    </div>
  );
}

export default UnifiedMessagesPage;