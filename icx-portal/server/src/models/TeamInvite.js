const mongoose = require('mongoose');

const teamInviteSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  role: { type: String, default: 'subordinate' },
  permissions: [{
    type: String,
    enum: ['documents', 'site_details', 'technical', 'commercial', 'phasing', 'financials'],
  }],
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REVOKED'],
    default: 'PENDING',
  },
  acceptedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('TeamInvite', teamInviteSchema);
