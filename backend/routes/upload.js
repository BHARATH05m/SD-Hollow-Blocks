const express = require('express');
const router = express.Router();
const path = require('path');

// Test route to verify the router is working
router.get('/test', (req, res) => {
  console.log('🧪 Test route hit!');
  res.json({ message: 'Upload router is working!' });
});

// Simple test route without multer
router.post('/simple-test', (req, res) => {
  console.log('🧪 Simple test route hit!');
  res.json({ message: 'Simple upload test working!' });
});

// Load multer middleware
let upload;
try {
  upload = require('../middleware/upload');
  console.log('✅ Multer middleware loaded successfully');
} catch (error) {
  console.error('❌ Error loading multer middleware:', error);
}

// Upload single image (only if multer loaded successfully)
if (upload) {
  router.post('/single', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({
        message: 'Image uploaded successfully',
        imageUrl: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Upload multiple images (for thumbnail and back view)
  router.post('/multiple', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'backview', maxCount: 1 }
  ]), (req, res) => {
    try {
      console.log('📤 Multiple upload request received');
      console.log('📁 Files received:', req.files);
      
      if (!req.files || (!req.files.thumbnail && !req.files.backview)) {
        console.log('❌ No files uploaded');
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const result = {};

      if (req.files.thumbnail && req.files.thumbnail[0]) {
        result.thumbnailUrl = `/uploads/${req.files.thumbnail[0].filename}`;
        result.thumbnailFilename = req.files.thumbnail[0].filename;
        console.log('✅ Thumbnail uploaded:', result.thumbnailUrl);
      }

      if (req.files.backview && req.files.backview[0]) {
        result.backviewUrl = `/uploads/${req.files.backview[0].filename}`;
        result.backviewFilename = req.files.backview[0].filename;
        console.log('✅ Backview uploaded:', result.backviewUrl);
      }

      console.log('✅ Upload successful, returning:', result);
      res.json({
        message: 'Images uploaded successfully',
        ...result
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ message: error.message });
    }
  });
} else {
  console.log('❌ Multer not available, upload routes disabled');
}

module.exports = router;