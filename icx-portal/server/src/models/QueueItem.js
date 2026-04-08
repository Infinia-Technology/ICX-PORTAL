const mongoose = require('mongoose');

const queueItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['SUPPLIER_KYC', 'DC_LISTING', 'GPU_CLUSTER', 'CUSTOMER_APPLICATION', 'GPU_DEMAND', 'DC_REQUEST', 'RESUBMISSION'],
    required: true,
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  referenceModel: { type: String, required: true },
  status: {
    type: String,
    enum: ['NEW', 'IN_REVIEW', 'RESUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'NEW',
  },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  priority: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('QueueItem', queueItemSchema);
