const mongoose = require('mongoose');

const dcApplicationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  brokerDcCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrokerDcCompany' },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'DRAFT',
  },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  submittedAt: Date,
  reviewedAt: Date,

  // Step 1: Company Details
  companyLegalEntity: String,
  companyOfficeAddress: String,
  companyCountry: String,
  contactName: String,
  contactEmail: { type: String, maxlength: 500 },
  contactMobile: String,
  otherDetails: String,
}, { timestamps: true });

module.exports = mongoose.model('DcApplication', dcApplicationSchema);
