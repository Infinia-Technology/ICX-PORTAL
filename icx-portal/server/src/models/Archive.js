const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
  targetModel: {
    type: String,
    enum: ['DcApplication', 'GpuClusterListing', 'DcCapacityRequest', 'GpuDemandRequest'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    enum: ['MANUAL', 'INACTIVITY', 'BUSINESS_CLOSURE', 'DUPLICATE', 'OUTDATED', 'OTHER'],
    default: 'MANUAL',
  },
  reasonText: {
    type: String,
    maxlength: 500,
  },
  archivedAt: {
    type: Date,
    default: Date.now,
  },
  restoredAt: Date,
  restoredBy: mongoose.Schema.Types.ObjectId,
  isActive: {
    type: Boolean,
    default: true, // false when restored
  },
}, { timestamps: true });

// Index for efficient queries
archiveSchema.index({ targetModel: 1, targetId: 1 });
archiveSchema.index({ organizationId: 1, isActive: 1 });
archiveSchema.index({ archivedAt: 1 });

module.exports = mongoose.model('Archive', archiveSchema);
