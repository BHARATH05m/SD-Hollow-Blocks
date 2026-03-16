const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Test PUT route
router.put('/test-put', (req, res) => {
  console.log('🧪 Products PUT test route hit');
  res.json({ message: 'Products PUT test works!' });
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, amount, units, imageThumbnail, imageBackView } = req.body;
    const product = new Product({
      name,
      amount: parseFloat(amount),
      units: parseInt(units),
      imageThumbnail: imageThumbnail || '/m-sand.jpg',
      imageBackView: imageBackView || '/m-sand.jpg',
      image: imageThumbnail || '/m-sand.jpg' // For backward compatibility
    });
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    console.log('🔄 Product update request for ID:', req.params.id);
    console.log('📝 Update data:', req.body);
    
    const { amount, units, imageThumbnail, imageBackView, backViewType } = req.body;
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (units !== undefined) updateData.units = parseInt(units);
    if (imageThumbnail !== undefined) {
      updateData.imageThumbnail = imageThumbnail;
      updateData.image = imageThumbnail; // For backward compatibility
    }
    if (imageBackView !== undefined) updateData.imageBackView = imageBackView;
    if (backViewType !== undefined) updateData.backViewType = backViewType;
    
    console.log('📝 Processed update data:', updateData);
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!product) {
      console.log('❌ Product not found');
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log('✅ Product updated successfully:', product);
    res.json(product);
  } catch (error) {
    console.error('❌ Product update error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
