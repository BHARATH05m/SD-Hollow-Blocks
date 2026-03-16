const express = require('express');
const router = express.Router();
const GeneralMessage = require('../models/GeneralMessage');
const UserLogin = require('../models/UserLogin');

// Get all conversations for a user (owner sees all, customer sees only theirs)
router.get('/', async (req, res) => {
  try {
    const { userId, role } = req.query;
    
    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and role are required' });
    }

    let query = {};
    
    if (role === 'owner' || role === 'admin') {
      // Owner sees all conversations they're part of
      query['participants.owner'] = userId;
    } else {
      // Customer sees only conversations where they're the customer
      query['participants.customer'] = userId;
    }

    const conversations = await GeneralMessage.find(query)
      .sort({ lastMessageTime: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (for owner to select who to message)
router.get('/users', async (req, res) => {
  try {
    const users = await UserLogin.find({ role: 'user' })
      .select('email role createdAt')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start a new conversation (owner only)
router.post('/start', async (req, res) => {
  try {
    const { ownerId, customerId, initialMessage } = req.body;
    
    if (!ownerId || !customerId || !initialMessage) {
      return res.status(400).json({ message: 'Owner ID, customer ID, and initial message are required' });
    }

    // Check if conversation already exists
    const existingConversation = await GeneralMessage.findOne({
      'participants.owner': ownerId,
      'participants.customer': customerId
    });

    if (existingConversation) {
      // Add message to existing conversation
      existingConversation.messages.push({
        message: initialMessage,
        sender: 'owner',
        timestamp: new Date()
      });
      existingConversation.lastMessageTime = new Date();
      await existingConversation.save();
      
      return res.json(existingConversation);
    }

    // Create new conversation
    const conversationId = `${ownerId}_${customerId}_${Date.now()}`;
    
    const newConversation = new GeneralMessage({
      conversationId,
      participants: {
        owner: ownerId,
        customer: customerId
      },
      messages: [{
        message: initialMessage,
        sender: 'owner',
        timestamp: new Date()
      }],
      lastMessageTime: new Date(),
      initiatedBy: 'owner'
    });

    await newConversation.save();
    res.status(201).json(newConversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add message to existing conversation
router.post('/:conversationId/message', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, sender, userId } = req.body;
    
    if (!message || !sender || !userId) {
      return res.status(400).json({ message: 'Message, sender, and user ID are required' });
    }

    const conversation = await GeneralMessage.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is part of this conversation
    const isOwner = conversation.participants.owner === userId;
    const isCustomer = conversation.participants.customer === userId;
    
    if (!isOwner && !isCustomer) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    // Verify sender matches user role
    if ((sender === 'owner' && !isOwner) || (sender === 'customer' && !isCustomer)) {
      return res.status(403).json({ message: 'Sender role does not match user' });
    }

    conversation.messages.push({
      message,
      sender,
      timestamp: new Date()
    });
    conversation.lastMessageTime = new Date();

    await conversation.save();
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get messages for a specific conversation
router.get('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const conversation = await GeneralMessage.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is part of this conversation
    const isOwner = conversation.participants.owner === userId;
    const isCustomer = conversation.participants.customer === userId;
    
    if (!isOwner && !isCustomer) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    // Mark messages as read for the requesting user
    const userRole = isOwner ? 'owner' : 'customer';
    const otherRole = isOwner ? 'customer' : 'owner';
    
    conversation.messages.forEach(msg => {
      if (msg.sender === otherRole && !msg.read) {
        msg.read = true;
      }
    });
    
    await conversation.save();

    res.json(conversation.messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Archive conversation (owner only)
router.put('/:conversationId/archive', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    const conversation = await GeneralMessage.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Only owner can archive
    if (conversation.participants.owner !== userId) {
      return res.status(403).json({ message: 'Only the owner can archive conversations' });
    }

    conversation.status = 'archived';
    await conversation.save();
    
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;