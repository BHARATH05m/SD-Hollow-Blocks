const mongoose = require('mongoose');
const Product = require('../models/Product');

const MONGODB_URI = 'mongodb://localhost:27017/sd-bookings';

const sampleProducts = [
  {
    name: 'M-Sand (Manufacturing Sand)',
    amount: 45.00,
    units: 100,
    imageThumbnail: '/m-sand.jpg',
    imageBackView: '/m-sand-back.jpg'
  },
  {
    name: 'P-Sand (Plastering Sand)',
    amount: 40.00,
    units: 80,
    imageThumbnail: '/p-sand.jpg',
    imageBackView: '/p-sand-back.jpg'
  },
  {
    name: 'Hollow Blocks',
    amount: 25.00,
    units: 500,
    imageThumbnail: '/hollow-blocks.jpg',
    imageBackView: '/hollow-blocks-back.jpg'
  },
  {
    name: 'Cement Bags',
    amount: 350.00,
    units: 200,
    imageThumbnail: '/cement.jpg',
    imageBackView: '/cement-back.jpg'
  },
  {
    name: 'Red Bricks',
    amount: 8.50,
    units: 1000,
    imageThumbnail: '/bricks.jpg',
    imageBackView: '/bricks-back.jpg'
  },
  {
    name: 'Concrete Posts',
    amount: 120.00,
    units: 50,
    imageThumbnail: '/post.jpg',
    imageBackView: '/post-back.jpg'
  },
  {
    name: 'Concrete Rings',
    amount: 180.00,
    units: 30,
    imageThumbnail: '/ring.jpg',
    imageBackView: '/ring-back.jpg'
  }
];

async function addSampleProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing products');

    // Add sample products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Added ${createdProducts.length} sample products with dual images:`);
    
    createdProducts.forEach(product => {
      console.log(`   - ${product.name} (₹${product.amount}) - Thumbnail: ${product.imageThumbnail}, Back: ${product.imageBackView}`);
    });

    console.log('\n🎉 Sample products added successfully!');
    console.log('👀 You can now test the dual image functionality in both owner and customer pages.');
    
  } catch (error) {
    console.error('❌ Error adding sample products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

addSampleProducts();