const mongoose = require('mongoose');
const Order = require('./models/Order');
const connectDB = require('./config/database');

async function createTestOrder() {
  try {
    await connectDB();
    
    // Create a test order with approved status and no delivery
    const testOrder = new Order({
      userId: 'test-user-ready',
      status: 'approved',
      items: [{
        name: 'Test Item for Ready',
        units: 1,
        pricePerUnit: 10,
        subtotal: 10
      }],
      baseTotal: 10,
      total: 10,
      withDelivery: false,
      deliveryTime: 'Test delivery time',
      approvedAt: new Date()
    });
    
    const savedOrder = await testOrder.save();
    console.log('✅ Test order created:', {
      id: savedOrder._id,
      status: savedOrder.status,
      withDelivery: savedOrder.withDelivery,
      userId: savedOrder.userId
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test order:', error);
    process.exit(1);
  }
}

createTestOrder();