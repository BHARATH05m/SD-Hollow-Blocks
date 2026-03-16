const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const UserLogin = require('../models/UserLogin');

const MONGODB_URI = 'mongodb://localhost:27017/sd-bookings';

async function initDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create collections by inserting and immediately deleting a dummy document
    console.log('🔄 Creating collections...');
    
    // Create products collection
    try {
      const dummyProduct = new Product({
        name: '__INIT__',
        amount: 0,
        units: 0
      });
      await dummyProduct.save();
      await Product.deleteOne({ name: '__INIT__' });
      console.log('✅ Products collection created');
    } catch (e) {
      console.log('ℹ️  Products collection already exists');
    }

    // Create orders collection
    try {
      const dummyOrder = new Order({
        userId: '__INIT__',
        status: 'pending',
        items: [],
        baseTotal: 0,
        total: 0
      });
      await dummyOrder.save();
      await Order.deleteOne({ userId: '__INIT__' });
      console.log('✅ Orders collection created');
    } catch (e) {
      console.log('ℹ️  Orders collection already exists');
    }

    // Create userlogins collection
    try {
      const dummyUser = new UserLogin({
        email: '__init__@temp.com',
        password: 'temp',
        role: 'user'
      });
      await dummyUser.save();
      await UserLogin.deleteOne({ email: '__init__@temp.com' });
      console.log('✅ UserLogins collection created');
    } catch (e) {
      console.log('ℹ️  UserLogins collection already exists');
    }

    // List all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    console.log('\n✅ Database initialization complete!');
    console.log('📦 Database: sd-bookings');
    console.log('📚 Collections: products, orders, userlogins');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

initDatabase();
