// Debug script to test upload functionality
const express = require('express');
const cors = require('cors');
const path = require('path');

// Test if the upload route is working
const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import upload router
const uploadRouter = require('./routes/upload');
app.use('/api/upload', uploadRouter);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Upload server is running!' });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`🧪 Debug upload server running on http://localhost:${PORT}`);
  console.log('📁 Upload endpoint: http://localhost:4001/api/upload/multiple');
  console.log('🧪 Test endpoint: http://localhost:4001/test');
});