const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: {
    type: String,
    required: true
  },
  units: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'dispatched', 'delayed', 'delivered', 'ready', 'collected'],
    default: 'pending'
  },
  items: [orderItemSchema],
  baseTotal: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  distanceKm: {
    type: String,
    default: 'not requested'
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: 0
  },
  withDelivery: {
    type: Boolean,
    default: false
  },
  deliveryTime: {
    type: String,
    default: null
  },
  dispatchedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  readyAt: {
    type: Date
  },
  collectedAt: {
    type: Date
  },
  delayedAt: {
    type: Date
  },
  delayReason: {
    type: String,
    default: ''
  },
  apologizeMessage: {
    type: String,
    default: ''
  },
  newDeliveryTime: {
    type: String,
    default: ''
  },
  customerPhone: {
    type: String,
    default: ''
  },
  inAppMessages: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    sender: { type: String, enum: ['admin', 'customer'], default: 'admin' },
    read: { type: Boolean, default: false }
  }],
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  },
  deliveryReports: [{
    reportType: {
      type: String,
      enum: [
        'not_delivered', 'partial_delivery', 'damaged_goods', 'wrong_items', 'delivery_delay',
        'product_quality', 'incomplete_order', 'other'
      ],
      required: true
    },
    reportMessage: {
      type: String,
      required: true
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    reportedBy: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'resolved'],
      default: 'pending'
    },
    ownerResponse: {
      type: String,
      default: ''
    },
    respondedAt: {
      type: Date
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
