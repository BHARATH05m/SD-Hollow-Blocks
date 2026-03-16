import React, { useEffect, useState } from 'react';
import OwnerNavbar from '../components/OwnerNavbar.jsx';
import { ordersAPI } from '../utils/api.js';

function OverallProcessPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
    // Refresh every 3 seconds
    const interval = setInterval(loadHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      // Get all orders except pending and rejected
      const response = await ordersAPI.getAll();
      const processedOrders = response.data.filter(order => 
        !['pending', 'rejected'].includes(order.status)
      );
      
      const orders = processedOrders.map(order => ({
        id: order._id,
        userId: order.userId,
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
        distanceKm: order.distanceKm,
        deliveryCharge: order.deliveryCharge,
        withDelivery: order.withDelivery,
        deliveryTime: order.deliveryTime,
        purchasedAt: order.approvedAt || order.createdAt,
        dispatchedAt: order.dispatchedAt,
        deliveredAt: order.deliveredAt,
        readyAt: order.readyAt,
        collectedAt: order.collectedAt,
        delayedAt: order.delayedAt,
        delayReason: order.delayReason,
        newDeliveryTime: order.newDeliveryTime,
      }));
      
      // Sort by most recent first
      orders.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
      
      setHistory(orders);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    }
  };

  const containerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  };

  const cardStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    background: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  };

  const pillStyle = {
    display: 'inline-block',
    padding: '4px 10px',
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
            fontSize: '36px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>OVERALL PROCESS</h1>

          {/* Summary Statistics */}
          {history.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px', 
              marginBottom: '24px' 
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {history.filter(h => ['delivered', 'collected'].includes(h.status)).length}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Completed Orders</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {history.filter(h => ['approved', 'dispatched', 'ready'].includes(h.status)).length}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>In Progress</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {history.filter(h => h.status === 'delayed').length}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Delayed Orders</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  ₹{history.reduce((sum, h) => sum + h.total, 0).toFixed(0)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Revenue</div>
              </div>
            </div>
          )}

          {history.length === 0 ? (
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.8' }}>
              No processed orders yet. When orders are approved, they will appear here with their progress status.
            </p>
          ) : (
            <div>
              <div style={{ marginBottom: '20px', fontSize: '14px', color: '#64748b' }}>
                Showing {history.length} processed orders (approved, in progress, and completed)
              </div>
              
              {history.map((entry, idx) => {
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
                  <div key={`${entry.id}-${idx}`} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827', marginBottom: '4px' }}>
                          Order from: {entry.userId}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                          Approved: {entry.purchasedAt ? new Date(entry.purchasedAt).toLocaleString() : 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Order Type: {entry.withDelivery ? '🚚 Delivery' : '📋 Self-Pickup'}
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          backgroundColor: getStatusColor(entry.status),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginBottom: '8px'
                        }}>
                          <span>{getStatusIcon(entry.status)}</span>
                          <span>{getStatusText(entry.status)}</span>
                        </div>
                        <div style={{
                          ...pillStyle,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}>
                          Total: ₹{entry.total.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    {entry.deliveryTime && (
                      <div style={{ 
                        padding: '8px 12px', 
                        background: '#f0f9ff', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        fontSize: '13px',
                        color: '#0369a1'
                      }}>
                        <strong>Delivery Time:</strong> {entry.deliveryTime}
                      </div>
                    )}

                    {/* Delay Information */}
                    {entry.status === 'delayed' && entry.delayReason && (
                      <div style={{ 
                        padding: '8px 12px', 
                        background: '#fef2f2', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        fontSize: '13px',
                        color: '#dc2626'
                      }}>
                        <div><strong>Delay Reason:</strong> {entry.delayReason}</div>
                        {entry.newDeliveryTime && (
                          <div><strong>New Delivery Time:</strong> {entry.newDeliveryTime}</div>
                        )}
                      </div>
                    )}

                    {/* Progress Timeline */}
                    <div style={{ 
                      padding: '8px 12px', 
                      background: '#f8fafc', 
                      borderRadius: '8px', 
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Progress Timeline:</div>
                      <div>✅ Approved: {entry.purchasedAt ? new Date(entry.purchasedAt).toLocaleDateString() : 'N/A'}</div>
                      {entry.dispatchedAt && (
                        <div>🚚 Dispatched: {new Date(entry.dispatchedAt).toLocaleDateString()}</div>
                      )}
                      {entry.readyAt && (
                        <div>📋 Ready: {new Date(entry.readyAt).toLocaleDateString()}</div>
                      )}
                      {entry.deliveredAt && (
                        <div>📦 Delivered: {new Date(entry.deliveredAt).toLocaleDateString()}</div>
                      )}
                      {entry.collectedAt && (
                        <div>✅ Collected: {new Date(entry.collectedAt).toLocaleDateString()}</div>
                      )}
                      {entry.delayedAt && (
                        <div>⚠️ Delayed: {new Date(entry.delayedAt).toLocaleDateString()}</div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827', marginBottom: '8px' }}>
                        Order Items:
                      </div>
                      {entry.items.map((it, i) => (
                        <div key={`${it.id}-${i}`} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          padding: '6px 0', 
                          borderBottom: i === entry.items.length - 1 ? 'none' : '1px solid #e5e7eb' 
                        }}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{it.name}</div>
                          <div style={{ fontSize: '13px', color: '#374151' }}>
                            {it.units} units × ₹{it.pricePerUnit.toFixed(2)} = ₹{it.subtotal.toFixed(2)}
                          </div>
                        </div>
                      ))}
                      
                      {/* Order Summary */}
                      <div style={{ 
                        marginTop: '8px', 
                        paddingTop: '8px', 
                        borderTop: '2px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '14px'
                      }}>
                        <div>
                          <div style={{ color: '#6b7280' }}>Base Total: ₹{entry.baseTotal.toFixed(2)}</div>
                          {entry.withDelivery && entry.deliveryCharge > 0 && (
                            <div style={{ color: '#6b7280' }}>
                              Delivery ({entry.distanceKm !== 'not requested' ? entry.distanceKm + ' km' : 'N/A'}): ₹{entry.deliveryCharge.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#111827' }}>
                          Final Total: ₹{entry.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
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

export default OverallProcessPage;
