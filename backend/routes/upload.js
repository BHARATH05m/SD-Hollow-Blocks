const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// Upload thumbnail + backview (image or video) to Cloudinary
router.post('/multiple', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'backview', maxCount: 1 }
]), (req, res) => {
  try {
    if (!req.files || (!req.files.thumbnail && !req.files.backview)) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const result = {};

    if (req.files.thumbnail?.[0]) {
      result.thumbnailUrl = req.files.thumbnail[0].path; // Cloudinary URL
    }

    if (req.files.backview?.[0]) {
      const backviewFile = req.files.backview[0];
      result.backviewUrl = backviewFile.path; // Cloudinary URL
      const isVideo = backviewFile.mimetype.startsWith('video/') ||
                      /\.(mp4|mov|avi|mkv|webm)$/i.test(backviewFile.originalname);
      result.backViewType = isVideo ? 'video' : 'image';
    }

    res.json({ message: 'Files uploaded successfully', ...result });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Single image upload
router.post('/single', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ message: 'Image uploaded successfully', imageUrl: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
