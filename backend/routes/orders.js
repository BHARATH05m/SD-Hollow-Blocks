const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const UserLogin = require('../models/UserLogin');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { status, userId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    
    const orders = await Order.find(query)
      .populate('items.productId')
      .sort({ createdAt: -1 });
    
    // Add user phone information to each order
    const ordersWithUserInfo = await Promise.all(orders.map(async (order) => {
      const user = await UserLogin.findOne({ email: order.userId }).select('phone');
      return {
        ...order.toObject(),
        userPhone: user?.phone || null
      };
    }));
    
    res.json(ordersWithUserInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create order (request)
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      items,
      baseTotal,
      total,
      distanceKm,
      deliveryCharge,
      withDelivery
    } = req.body;

    const order = new Order({
      userId,
      status: 'pending',
      items: items.map(item => ({
        name: item.name,
        units: item.units,
        pricePerUnit: item.pricePerUnit,
        subtotal: item.subtotal
      })),
      baseTotal: parseFloat(baseTotal),
      total: parseFloat(total),
      distanceKm: distanceKm || 'not requested',
      deliveryCharge: parseFloat(deliveryCharge) || 0,
      withDelivery: withDelivery || false
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ALL SPECIFIC ROUTES MUST COME BEFORE THE GENERIC /:id ROUTE

// Report delivery issue
router.post('/report/:id', async (req, res) => {
  try {
    const { reportType, reportMessage, reportedBy } = req.body;
    
    if (!reportType || !reportMessage || !reportedBy) {
      return res.status(400).json({ message: 'Report type, message, and reporter are required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId !== reportedBy) {
      return res.status(403).json({ message: 'Only the order owner can report delivery issues' });
    }

    const report = {
      reportType,
      reportMessage,
      reportedBy,
      reportedAt: new Date(),
      status: 'pending'
    };

    order.deliveryReports.push(report);

    const reportTypeText = {
      'not_delivered': 'Product Not Delivered',
      'partial_delivery': 'Partial Delivery',
      'damaged_goods': 'Damaged Goods',
      'wrong_items': 'Wrong Items',
      'delivery_delay': 'Excessive Delivery Delay',
      'product_quality': 'Product Not Good/Poor Quality',
      'incomplete_order': 'Incomplete Order',
      'other': 'Other Issue'
    };

    const reportMessageText = `🚨 DELIVERY REPORT: ${reportTypeText[reportType]} - ${reportMessage}`;
    
    order.inAppMessages.push({
      message: reportMessageText,
      sender: 'customer',
      timestamp: new Date()
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Respond to delivery report (owner only)
router.put('/report/:id/:reportId/respond', async (req, res) => {
  try {
    const { ownerResponse } = req.body;
    
    if (!ownerResponse) {
      return res.status(400).json({ message: 'Owner response is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const report = order.deliveryReports.id(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.ownerResponse = ownerResponse;
    report.respondedAt = new Date();
    report.status = 'acknowledged';

    order.inAppMessages.push({
      message: `📋 OWNER RESPONSE TO REPORT: ${ownerResponse}`,
      sender: 'admin',
      timestamp: new Date()
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark report as resolved
router.put('/report/:id/:reportId/resolve', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const report = order.deliveryReports.id(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = 'resolved';

    order.inAppMessages.push({
      message: `✅ DELIVERY REPORT RESOLVED: Issue has been marked as resolved.`,
      sender: 'admin',
      timestamp: new Date()
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Approve order
router.put('/:id/approve', async (req, res) => {
  try {
    const { deliveryTime } = req.body;
    
    if (!deliveryTime) {
      return res.status(400).json({ message: 'Delivery time is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is not pending' });
    }

    order.status = 'approved';
    order.deliveryTime = deliveryTime;
    order.approvedAt = new Date();

    for (const item of order.items) {
      const product = await Product.findOne({ name: item.name });
      if (product) {
        product.units = Math.max(0, product.units - item.units);
        await product.save();
      }
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reject order
router.put('/:id/reject', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is not pending' });
    }

    order.status = 'rejected';
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Dispatch order (delivery orders only)
router.put('/:id/dispatch', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'approved') {
      return res.status(400).json({ message: 'Order must be approved before dispatch' });
    }

    if (!order.withDelivery) {
      return res.status(400).json({ message: 'This endpoint is only for delivery orders' });
    }

    order.status = 'dispatched';
    order.dispatchedAt = new Date();
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark order as delayed (delivery orders only)
router.put('/:id/delay', async (req, res) => {
  try {
    const { delayReason, apologizeMessage, newDeliveryTime } = req.body;
    
    if (!delayReason || !apologizeMessage || !newDeliveryTime) {
      return res.status(400).json({ message: 'Delay reason, apology message, and new delivery time are required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['approved', 'dispatched'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be approved or dispatched to mark as delayed' });
    }

    if (!order.withDelivery) {
      return res.status(400).json({ message: 'This endpoint is only for delivery orders' });
    }

    order.status = 'delayed';
    order.delayedAt = new Date();
    order.delayReason = delayReason;
    order.apologizeMessage = apologizeMessage;
    order.newDeliveryTime = newDeliveryTime;
    
    order.inAppMessages.push({
      message: `Delivery Delayed: ${delayReason}. ${apologizeMessage} New delivery time: ${newDeliveryTime}`,
      sender: 'admin',
      timestamp: new Date()
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark order as delivered (delivery orders only)
router.put('/:id/deliver', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['approved', 'dispatched', 'delayed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be approved, dispatched, or delayed to mark as delivered' });
    }

    if (!order.withDelivery) {
      return res.status(400).json({ message: 'This endpoint is only for delivery orders' });
    }

    order.status = 'delivered';
    order.deliveredAt = new Date();
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark order as ready for pickup (self-pickup orders)
router.put('/:id/ready', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'approved') {
      return res.status(400).json({ message: 'Order must be approved to mark as ready' });
    }

    if (order.withDelivery) {
      return res.status(400).json({ message: 'This endpoint is only for self-pickup orders' });
    }

    order.status = 'ready';
    order.readyAt = new Date();
    
    order.inAppMessages.push({
      message: `Your order is ready for pickup! Please come to collect your items.`,
      sender: 'admin',
      timestamp: new Date()
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark order as collected (self-pickup orders)
router.put('/:id/collected', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['approved', 'ready'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be approved or ready to mark as collected' });
    }

    if (order.withDelivery) {
      return res.status(400).json({ message: 'This endpoint is only for self-pickup orders' });
    }

    order.status = 'collected';
    order.collectedAt = new Date();
    
    order.inAppMessages.push({
      message: `Thank you! Your order has been collected successfully.`,
      sender: 'admin',
      timestamp: new Date()
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add customer phone number
router.put('/:id/phone', async (req, res) => {
  try {
    const { customerPhone } = req.body;
    
    if (!customerPhone) {
      return res.status(400).json({ message: 'Customer phone number is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.customerPhone = customerPhone;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add in-app message
router.post('/:id/message', async (req, res) => {
  try {
    const { message, sender } = req.body;
    
    if (!message || !sender) {
      return res.status(400).json({ message: 'Message and sender are required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.inAppMessages.push({
      message,
      sender,
      timestamp: new Date()
    });

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get messages for an order
router.get('/:id/messages', async (req, res) => {
  try {
    const { userId, role } = req.query;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (userId && role) {
      const userRole = (role === 'owner' || role === 'admin') ? 'admin' : 'customer';
      const otherRole = (role === 'owner' || role === 'admin') ? 'customer' : 'admin';
      
      order.inAppMessages.forEach(msg => {
        if (msg.sender === otherRole && !msg.read) {
          msg.read = true;
        }
      });
      
      await order.save();
    }

    res.json(order.inAppMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order - MUST be LAST among /:id routes
router.get('/:id', async (req, res) => {
  console.log('🔧 Generic /:id route hit for:', req.params.id);
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Add user phone information
    const user = await UserLogin.findOne({ email: order.userId }).select('phone');
    const orderWithUserInfo = {
      ...order.toObject(),
      userPhone: user?.phone || null
    };
    
    res.json(orderWithUserInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;