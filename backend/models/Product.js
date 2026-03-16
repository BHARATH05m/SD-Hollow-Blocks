const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  units: {
    type: Number,
    required: true,
    min: 0
  },
  imageThumbnail: {
    type: String,
    default: '/m-sand.jpg'
  },
  imageBackView: {
    type: String,
    default: '/m-sand.jpg'
  },
  backViewType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  // Keep old image field for backward compatibility
  image: {
    type: String,
    default: '/m-sand.jpg'
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
