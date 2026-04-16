const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['SUPPLIER', 'BROKER', 'CUSTOMER'],
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'KYC_SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'],
    default: 'PENDING',
  },

  // Supplier/Broker KYC fields (6)
  vendorType: {
    type: String,
    enum: ['Operator', 'Developer', 'Landlord', 'Broker', 'Advisor', 'Other Intermediary'],
  },
  mandateStatus: {
    type: String,
    enum: ['Exclusive', 'Non-exclusive', 'Direct', 'Unknown'],
  },
  ndaRequired: Boolean,
  ndaSigned: Boolean,
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  contactNumber: String,

  // Customer registration fields
  companyName: String,
  companyType: String,
  jurisdiction: {
    type: String,
    enum: ['UAE', 'KSA', 'Qatar', 'Bahrain', 'Oman', 'Kuwait', 'Other'],
  },
  industrySector: String,
  taxVatNumber: String,
  companyAddress: String,
  website: String,
  authSignatoryName: String,
  authSignatoryTitle: String,
  billingContactName: String,
  billingContactEmail: String,
  primaryUseCases: [String],
  locationPreferences: [String],
  sovereigntyReqs: [String],
  complianceReqs: [String],
  budgetRange: String,
  urgency: String,

  // Admin review
  flaggedFields: [String],
  fieldComments: {
    type: Map,
    of: String,
  },
  reviewedBy: mongoose.Schema.Types.ObjectId,
  approvedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
