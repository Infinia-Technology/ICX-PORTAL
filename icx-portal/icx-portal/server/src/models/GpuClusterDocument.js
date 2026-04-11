const mongoose = require('mongoose');

const gpuClusterDocumentSchema = new mongoose.Schema({
  gpuClusterListingId: { type: mongoose.Schema.Types.ObjectId, ref: 'GpuClusterListing', required: true },
  documentType: {
    type: String,
    enum: ['SECURITY_COMPLIANCE', 'ARCHITECTURE_DIAGRAM', 'SPEC_SHEET', 'OTHER'],
  },
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  received: { type: String, enum: ['Yes', 'No', 'Pending'], default: 'Pending' },
  reviewed: { type: String, enum: ['Yes', 'No', 'In Progress'], default: 'No' },
  reviewComment: String,
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GpuClusterDocument', gpuClusterDocumentSchema);
