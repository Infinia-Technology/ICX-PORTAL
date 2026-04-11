const mongoose = require('mongoose');

const dcDocumentSchema = new mongoose.Schema({
  dcSiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'DcSite', required: true },
  documentType: {
    type: String,
    enum: ['COMPLIANCE_SHEET', 'SPACE_DOCS', 'AGREEMENTS', 'FLOOR_PLAN'],
    required: true,
  },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: Number,
  mimeType: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  received: { type: String, enum: ['Yes', 'No', 'Pending'], default: 'Pending' },
  reviewed: { type: String, enum: ['Yes', 'No', 'In Progress'], default: 'No' },
  reviewComment: String,
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DcDocument', dcDocumentSchema);
