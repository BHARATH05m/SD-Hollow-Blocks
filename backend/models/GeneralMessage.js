const mongoose = require('mongoose');

const generalMessageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  participants: {
    owner: {
      type: String,
      required: true
    },
    customer: {
      type: String,
      required: true
    }
  },
  messages: [{
    message: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      enum: ['owner', 'customer'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  initiatedBy: {
    type: String,
    enum: ['owner'],
    default: 'owner'
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for efficient queries
generalMessageSchema.index({ 'participants.owner': 1, 'participants.customer': 1 });
generalMessageSchema.index({ lastMessageTime: -1 });

module.exports = mongoose.model('GeneralMessage', generalMessageSchema);