const mongoose = require('mongoose');

const gpuDemandRequestSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'MATCHED', 'CLOSED'],
    default: 'DRAFT',
  },
  customerName: { type: String, required: true },
  customerCountry: { type: String, required: true },
  technologyType: { type: String, required: true },
  contractLengthYears: { type: String, required: true },
  clusterSizeGpus: { type: String, required: true },
  idealClusterLocation: String,
  exportConstraints: String,
  timelineGoLive: { type: String, required: true },
  connectivityMbps: Number,
  latencyMs: Number,
  interconnectivity: String,
  dcTierMinimum: { type: String, enum: ['Tier I', 'Tier II', 'Tier III', 'Tier IV'] },
  redundancyRequirements: String,
  targetPriceGpuHr: String,
  decisionMaker: String,
  procurementStage: String,
  otherComments: { type: String, maxlength: 500 },
  matchedClusterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GpuClusterListing' }],
}, { timestamps: true });

module.exports = mongoose.model('GpuDemandRequest', gpuDemandRequestSchema);
