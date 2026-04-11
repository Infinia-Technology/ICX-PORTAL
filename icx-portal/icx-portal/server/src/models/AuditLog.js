const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  targetModel: String,
  targetId: mongoose.Schema.Types.ObjectId,
  changes: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
