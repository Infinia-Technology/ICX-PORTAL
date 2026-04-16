const mongoose = require('mongoose');

const inventoryReservationSchema = new mongoose.Schema({
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
  },
  customerOrgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  units: {
    type: Number,
    required: true,
    min: 1,
  },
  contractStartDate: {
    type: Date,
    required: true,
  },
  contractEndDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
    default: 'ACTIVE',
  },
  notes: {
    type: String,
    maxlength: 500,
  },
}, { timestamps: true });

// Index for efficient queries
inventoryReservationSchema.index({ inventoryId: 1, status: 1 });
inventoryReservationSchema.index({ customerOrgId: 1 });

module.exports = mongoose.model('InventoryReservation', inventoryReservationSchema);
