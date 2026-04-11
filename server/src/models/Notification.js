const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  type: {
    type: String,
    enum: [
      'LISTING_APPROVED',
      'LISTING_REJECTED',
      'LISTING_ARCHIVED',
      'LISTING_RESTORED',
      'REVISION_REQUESTED',
      'INVENTORY_BOOKED',
      'INVENTORY_CANCELLED',
      'NEW_SUBMISSION',
      'REFRESH_REMINDER',
      'OUTDATED_LISTING',
      'KYC_APPROVED',
      'KYC_REJECTED',
      'GENERAL',
    ],
    default: 'GENERAL',
  },
  title: {
    type: String,
    required: true,
  },
  message: String,
  actionData: {
    targetModel: String, // 'DcApplication', 'GpuClusterListing', etc.
    targetId: mongoose.Schema.Types.ObjectId,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  link: String,
  sentAt: Date,
  sentVia: {
    type: [String], // ['in-app', 'email']
    default: ['in-app'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: true });

// Indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
