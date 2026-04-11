const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  gpuClusterListingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GpuClusterListing',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED'],
    default: 'AVAILABLE',
  },
  totalUnits: {
    type: Number,
    required: true,
    min: 1,
  },
  bookedUnits: {
    type: Number,
    default: 0,
    min: 0,
  },
  availableUnits: {
    type: Number,
    default: 0,
    min: 0,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
}, { timestamps: true });

// Pre-save hook to ensure availableUnits = totalUnits - bookedUnits
inventorySchema.pre('save', function (next) {
  this.availableUnits = Math.max(0, this.totalUnits - this.bookedUnits);
  next();
});

// Index for efficient queries
inventorySchema.index({ organizationId: 1, status: 1 });
inventorySchema.index({ gpuClusterListingId: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
