const mongoose = require('mongoose');

const gpuClusterListingSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'DRAFT',
  },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  submittedAt: Date,
  reviewedAt: Date,

  // Step 1: Basic Info
  vendorName: { type: String, required: true },
  location: String,
  country: String,
  gpuTechnology: String,
  googleMapsLink: String,
  dcLandlord: String,
  totalGpuCount: Number,
  singleClusterSize: Number,
  availabilityDate: Date,
  notes: { type: String, maxlength: 500 },
  restrictedUse: String,

  // Step 2: Compute Node
  gpuServerModel: String,
  cpu: String,
  gpu: String,
  ram: String,
  localStorage: String,
  nics: String,

  // Step 3: Compute Network East-West
  computeNetTopology: String,
  computeNetTechnology: String,
  computeNetSwitchVendor: String,
  computeNetLayers: String,
  computeNetOversubscription: String,
  computeNetScalability: String,
  computeNetQos: String,

  // Step 4: Management Network North-South
  mgmtNetTopology: String,
  mgmtNetTechnology: String,
  mgmtNetLayers: Number,
  mgmtNetSwitchVendor: String,
  mgmtNetOversubscription: String,
  mgmtNetScalability: String,

  // Step 5: OOB + Storage + Connectivity
  oobNetTechnology: String,
  storageOptions: { type: String, maxlength: 2000 },
  connectivityDetails: { type: String, maxlength: 2000 },

  // Step 6: Cluster Description
  clusterDescription: { type: String, maxlength: 2000 },

  // Step 7: Power & Facility (all optional)
  powerSupplyStatus: String,
  rackPowerCapacityKw: Number,
  modularDataHalls: Number,
  totalPowerCapacityMw: Number,
  powerCapacityPerFloor: Number,
  dataHallLayoutPerFloor: String,
  futureExpansion: String,
  dualFeedPower: String,
  upsConfiguration: String,
  backupGenerators: String,
  coolingDesign: String,
  coolingUnits: String,
  coolingCapacity: String,
  floorPlans: String,

  // Review tracking
  flaggedFields: [String],
  fieldComments: { type: Map, of: String },
  history: [mongoose.Schema.Types.Mixed],
}, { timestamps: true });

module.exports = mongoose.model('GpuClusterListing', gpuClusterListingSchema);
