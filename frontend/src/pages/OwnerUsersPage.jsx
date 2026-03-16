import React, { useEffect, useState } from 'react';
import OwnerNavbar from '../components/OwnerNavbar.jsx';
import { usersAPI, ordersAPI } from '../utils/api.js';

function OwnerUsersPage() {
  const [users, setUsers] = useState([]);
  const [historyByUser, setHistoryByUser] = useState({});
  const [openUser, setOpenUser] = useState(null);

  useEffect(() => {
    loadUsers();
    loadPurchaseHistory();
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadUsers();
      loadPurchaseHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      const userList = response.data.map(user => ({
        email: user.email,
        registeredAt: user.registeredAt || user.createdAt,
      }));
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      // Get all orders except pending and rejected
      const response = await ordersAPI.getAll();
      const processedOrders = response.data.filter(order => 
        !['pending', 'rejected'].includes(order.status)
      );
      
      const grouped = {};
      processedOrders.forEach((order) => {
        const key = order.userId || 'Unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          id: order._id,
          status: order.status,
          items: order.items.map(item => ({
            id: item._id || item.name,
            name: item.name,
            units: item.units,
            pricePerUnit: item.pricePerUnit,
            subtotal: item.subtotal,
          })),
          total: order.total,
          baseTotal: order.baseTotal,
          deliveryCharge: order.deliveryCharge,
          withDelivery: order.withDelivery,
          purchasedAt: order.approvedAt || order.createdAt,
          deliveredAt: order.deliveredAt,
          collectedAt: order.collectedAt,
        });
      });
      
      // Sort each user's orders by most recent first
      Object.keys(grouped).forEach(userId => {
        grouped[userId].sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
      });
      
      setHistoryByUser(grouped);
    } catch (error) {
      console.error('Error loading purchase history:', error);
      setHistoryByUser({});
    }
  };

  const containerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '32px',
    borderRadius: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  };

  const cardStyle = {
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  const badgeStyle = {
    padding: '6px 10px',
    borderRadius: '999px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <OwnerNavbar />
      <div style={{ padding: '32px', flex: 1 }}>
        <div style={containerStyle}>
          <h1 style={{
            marginBottom: '20px',
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Registered Users
          </h1>
          <p style={{ marginTop: 0, marginBottom: '16px', color: '#6b7280' }}>
            Total registered: {users.length}
          </p>

          {users.length === 0 ? (
            <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280' }}>
              No users registered yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {users.map((u, idx) => {
                const userId = u.email;
                const purchases = historyByUser[userId] || [];
                const isOpen = openUser === userId;
                return (
                  <div
                    key={`${u.email}-${idx}`}
                    style={{
                      ...cardStyle,
                      boxShadow: isOpen ? '0 8px 18px -6px rgba(0,0,0,0.2)' : cardStyle.boxShadow,
                      transform: isOpen ? 'translateY(-2px)' : 'none',
                    }}
                    onClick={() => setOpenUser(isOpen ? null : userId)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{u.email}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          Registered user
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          Orders: {purchases.length}
                        </div>
                        {purchases.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            Total Spent: ₹{purchases.reduce((sum, p) => sum + (p.total || 0), 0).toFixed(0)}
                          </div>
                        )}
                      </div>
                      <span style={badgeStyle}>User</span>
                    </div>

                    {isOpen && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                        {purchases.length === 0 ? (
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>No purchases yet.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {purchases.map((entry, i) => {
                              const getStatusColor = (status) => {
                                const colors = {
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
                                  approved: '✅',
                                  dispatched: '🚚',
                                  delayed: '⚠️',
                                  delivered: '📦',
                                  ready: '📋',
                                  collected: '✅'
                                };
                                return icons[status] || '❓';
                              };

                              const getStatusText = (status) => {
                                const texts = {
                                  approved: 'Approved',
                                  dispatched: 'Dispatched',
                                  delayed: 'Delayed',
                                  delivered: 'Delivered',
                                  ready: 'Ready for Pickup',
                                  collected: 'Collected'
                                };
                                return texts[status] || status;
                              };

                              return (
                                <div key={`${entry.id}-${i}`} style={{ 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: '10px', 
                                  padding: '12px', 
                                  background: '#f9fafb' 
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                    <div>
                                      <div style={{ fontWeight: 700, color: '#111827', fontSize: '14px', marginBottom: '2px' }}>
                                        Order #{entry.id.slice(-6)}
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                        {entry.purchasedAt ? new Date(entry.purchasedAt).toLocaleDateString() : 'N/A'}
                                      </div>
                                    </div>
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      backgroundColor: getStatusColor(entry.status),
                                      color: 'white',
                                      fontSize: '10px',
                                      fontWeight: 'bold'
                                    }}>
                                      <span>{getStatusIcon(entry.status)}</span>
                                      <span>{getStatusText(entry.status)}</span>
                                    </div>
                                  </div>
                                  
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                                    Type: {entry.withDelivery ? '🚚 Delivery' : '📋 Pickup'}
                                    {entry.withDelivery && entry.deliveryCharge > 0 && (
                                      <span> • Delivery: ₹{entry.deliveryCharge.toFixed(2)}</span>
                                    )}
                                  </div>
                                  
                                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px', fontWeight: 600 }}>
                                    Total: ₹{entry.total?.toFixed(2)}
                                  </div>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {entry.items.map((it, j) => (
                                      <div key={`${it.id}-${j}`} style={{ fontSize: '12px', color: '#111827' }}>
                                        • {it.name} — {it.units} × ₹{it.pricePerUnit?.toFixed(2)} = ₹{it.subtotal?.toFixed(2)}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Completion info */}
                                  {(entry.deliveredAt || entry.collectedAt) && (
                                    <div style={{ 
                                      marginTop: '6px', 
                                      padding: '4px 8px', 
                                      background: '#d1fae5', 
                                      borderRadius: '6px', 
                                      fontSize: '11px', 
                                      color: '#065f46' 
                                    }}>
                                      {entry.deliveredAt && `✅ Delivered: ${new Date(entry.deliveredAt).toLocaleDateString()}`}
                                      {entry.collectedAt && `✅ Collected: ${new Date(entry.collectedAt).toLocaleDateString()}`}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerUsersPage;
