const express = require('express');
const router = express.Router();
const UserLogin = require('../models/UserLogin');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'change_this_secret_key';
const OWNER_EMAIL = 'owner1';
const OWNER_PASSWORD = 'owner123';
const OWNER_PHONE = '9791925779'; // Owner's WhatsApp number

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    
    if (!email || !password || !phone) {
      return res.status(400).json({ message: 'Email, password, and phone number are required' });
    }

    if (email.toLowerCase() === OWNER_EMAIL) {
      return res.status(400).json({ message: 'This email is reserved for owner' });
    }

    // Check if user already exists
    const existingUser = await UserLogin.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already registered' });
    }

    const user = new UserLogin({
      email: email.toLowerCase(),
      password,
      phone: phone.trim(),
      role: 'user'
    });

    await user.save();
    res.status(201).json({ 
      message: 'User registered successfully', 
      email: user.email,
      phone: user.phone 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check for owner
    if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
      const token = jwt.sign(
        { email: OWNER_EMAIL, role: 'owner', phone: OWNER_PHONE },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ token, role: 'owner', email: OWNER_EMAIL, phone: OWNER_PHONE });
    }

    // Check in database
    const user = await UserLogin.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'User not found. Please register first.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: user.role, email: user.email, phone: user.phone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (for owner)
router.get('/', async (req, res) => {
  try {
    const users = await UserLogin.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get owner contact info
router.get('/owner-contact', (req, res) => {
  res.json({
    phone: OWNER_PHONE,
    whatsappUrl: `https://wa.me/${OWNER_PHONE}?text=Hello! I need assistance with my order.`
  });
});

module.exports = router;
