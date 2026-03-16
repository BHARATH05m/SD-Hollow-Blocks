const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically with proper MIME types
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (path.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    } else if (path.endsWith('.mov')) {
      res.setHeader('Content-Type', 'video/quicktime');
    }
  }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('🔍 File filter check:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  // Allow all images
  if (file.mimetype.startsWith('image/')) {
    console.log('✅ Image file accepted');
    return cb(null, true);
  }
  
  // Allow videos only for backview field
  if (file.fieldname === 'backview' && file.mimetype.startsWith('video/')) {
    console.log('✅ Video file accepted for backview');
    return cb(null, true);
  }
  
  // Reject everything else
  console.log('❌ File rejected - invalid type or field');
  const errorMsg = `Invalid file type. Images allowed for all fields, videos only for back view. Got: ${file.mimetype} for field: ${file.fieldname}`;
  cb(new Error(errorMsg));
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  }, 
  fileFilter: fileFilter
});

// API Routes
const productsRouter = require('./routes/products');
const usersRouter = require('./routes/users');
const ordersRouter = require('./routes/orders');
const generalMessagesRouter = require('./routes/generalMessages');

app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/general-messages', generalMessagesRouter);

// Upload routes
app.post('/api/upload/multiple', (req, res) => {
  console.log('📤 Upload endpoint hit');
  console.log('📋 Request headers:', req.headers);
  console.log('📋 Content-Type:', req.headers['content-type']);
  
  const uploadHandler = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'backview', maxCount: 1 }
  ]);
  
  uploadHandler(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      console.error('❌ Error type:', err.constructor.name);
      console.error('❌ Error code:', err.code);
      return res.status(500).json({ message: `Upload error: ${err.message}` });
    }
    
    try {
      console.log('📤 Upload request processed by multer');
      console.log('📁 Files:', req.files);
      console.log('📝 Body:', req.body);
      console.log('📊 Files count:', req.files ? Object.keys(req.files).length : 0);
      
      if (!req.files || (!req.files.thumbnail && !req.files.backview)) {
        console.log('❌ No files uploaded');
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const result = {};

      if (req.files.thumbnail && req.files.thumbnail[0]) {
        result.thumbnailUrl = `/uploads/${req.files.thumbnail[0].filename}`;
        console.log('✅ Thumbnail processed:', result.thumbnailUrl);
      }

      if (req.files.backview && req.files.backview[0]) {
        result.backviewUrl = `/uploads/${req.files.backview[0].filename}`;
        
        // Determine if backview is image or video
        const backviewFile = req.files.backview[0];
        console.log('📹 Backview file details:', {
          mimetype: backviewFile.mimetype,
          originalname: backviewFile.originalname,
          size: backviewFile.size
        });
        
        const isVideo = backviewFile.mimetype.startsWith('video/') || 
                       /\.(mp4|mov|avi|mkv|webm)$/i.test(backviewFile.originalname);
        result.backViewType = isVideo ? 'video' : 'image';
        console.log('✅ Backview processed:', result.backviewUrl, 'Type:', result.backViewType);
      }

      console.log('✅ Upload successful, returning:', result);
      res.json({
        message: 'Files uploaded successfully',
        ...result
      });
    } catch (error) {
      console.error('❌ Upload processing error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: error.message });
    }
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log('Authentication system using database UserLogin model');
  console.log('Owner login: owner1 / owner123');
  console.log('Register customers at /api/users/register');
});