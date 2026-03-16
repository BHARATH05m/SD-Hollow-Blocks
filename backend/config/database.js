const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/sd-bookings';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: sd-bookings`);
    
    // Initialize collections by creating indexes (this ensures collections exist)
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const UserLogin = require('../models/UserLogin');
    
    // Create indexes to ensure collections are created
    await Product.createIndexes();
    await Order.createIndexes();
    await UserLogin.createIndexes();
    
    // Verify collections exist by checking if they have any documents or indexes
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`📚 Collections found: ${collectionNames.length > 0 ? collectionNames.join(', ') : 'none yet (will be created on first insert)'}`);
    console.log(`✅ Database and collections are ready!`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
