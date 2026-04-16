const mongoose = require('mongoose');

const dcCapacityRequestSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'MATCHED', 'CLOSED'],
    default: 'DRAFT',
  },
  companyName: { type: String, required: true },
  country: { type: String, required: true },
  requiredPowerMw: { type: String, required: true },
  preferredLocation: String,
  dcTierRequirement: { type: String, enum: ['Tier I', 'Tier II', 'Tier III', 'Tier IV'] },
  businessModel: { type: String, enum: ['Colocation (Wholesale/Retail)', 'Powered Shell', 'Build-to-Suit'] },
  sovereigntyReqs: String,
  complianceReqs: String,
  timelineGoLive: { type: String, required: true },
  contractLength: String,
  budgetRange: String,
  coolingRequirements: String,
  connectivityReqs: String,
  otherComments: String,
  matchedListingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DcApplication' }],
}, { timestamps: true });

module.exports = mongoose.model('DcCapacityRequest', dcCapacityRequestSchema);
