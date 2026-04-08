const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'supplier', 'broker', 'customer', 'reader', 'viewer', 'subordinate'],
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
