import { useState, useEffect } from 'react';
import { ordersAPI } from '../utils/api.js';

export function useUnreadMessages(currentUser) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const checkUnreadMessages = async () => {
      try {
        let response;
        
        if (currentUser.role === 'owner' || currentUser.role === 'admin') {
          // Owner sees all orders
          response = await ordersAPI.getAll();
        } else {
          // Customer sees only their orders
          response = await ordersAPI.getAll({ userId: currentUser.id });
        }

        const orders = response.data;
        
        // Count unread messages
        let totalUnread = 0;
        orders.forEach(order => {
          if (order.inAppMessages) {
            const unreadForOrder = order.inAppMessages.filter(msg => 
              !msg.read && 
              ((currentUser.role === 'owner' || currentUser.role === 'admin') 
                ? msg.sender === 'customer' 
                : msg.sender === 'admin')
            ).length;
            totalUnread += unreadForOrder;
          }
        });

        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error checking unread messages:', error);
        setUnreadCount(0);
      }
    };

    // Check immediately
    checkUnreadMessages();
    
    // Check every 10 seconds
    const interval = setInterval(checkUnreadMessages, 10000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  return unreadCount;
}