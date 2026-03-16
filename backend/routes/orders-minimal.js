const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

console.log('🔧 Minimal orders routes file loaded');

// Test GET route
router.get('/test-route', (req, res) => {
  console.log('🧪 Test GET route hit');
  res.json({ message: 'Test GET route works!' });
});

// Test PUT route
router.put('/test-put', (req, res) => {
  console.log('🧪 Test PUT route hit');
  res.json({ message: 'Test PUT route works!' });
});

// Test POST route
router.post('/test-post', (req, res) => {
  console.log('🧪 Test POST route hit');
  res.json({ message: 'Test POST route works!' });
});

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
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

console.log('🔧 Minimal orders routes module exporting router');
module.exports = router;