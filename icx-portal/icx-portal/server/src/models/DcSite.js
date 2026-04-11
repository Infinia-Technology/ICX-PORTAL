const mongoose = require('mongoose');

const PERMIT_STATUS_ENUM = [
  'Not Required', 'Not Applied', 'In Preparation', 'Submitted Under Review',
  'Approved', 'Approved with Conditions', 'Rejected', 'Expired', 'Unknown',
];

const dcSiteSchema = new mongoose.Schema({
  dcApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'DcApplication', required: true },

  // Step 2: Site Details
  siteName: String,
  projectType: { type: String, enum: ['Brownfield (Retrofit/Conversion)', 'Greenfield', 'Expansion'] },
  currentProjectStatus: { type: String, enum: ['Planned', 'Permitted', 'Under Construction', 'Live', 'Partially Live'] },
  businessModel: { type: String, enum: ['Colocation (Wholesale/Retail)', 'Powered Shell', 'Build-to-Suit'] },
  sovereigntyRestrictions: { type: String, enum: ['None', 'Domestic Only', 'Sovereign Cloud Capable', 'Restricted', 'Government-Sensitive'] },
  regulatoryCompliance: { type: String, enum: ['GDPR', 'Local Law', 'GDPR + Local Law'] },
  airGapped: Boolean,
  landSizeSqm: Number,
  buildingCount: Number,
  dataHallCount: Number,
  address: String,
  stateRegion: String,
  country: String,
  coordinates: String,

  // Step 2b: Master Plan Capacity
  currentEnergizedMw: Number,
  totalItLoadMw: Number,
  totalUtilityMva: Number,
  totalWhiteSpaceSqm: Number,
  expansionPossible: Boolean,
  expansionMw: Number,

  // Step 3: DC Specifications
  maxRackDensityKw: Number,
  typicalRackDensityKw: Number,
  coolingMethodology: [String],
  liquidCoolingStatus: { type: String, enum: ['Installed', 'Ready for Retrofit', 'Design-ready only', 'No'] },
  designPue: Number,
  designWue: Number,
  floorMaxWeight: Number,
  landOwner: String,
  landOwnershipType: { type: String, enum: ['Freehold', 'Leasehold'] },
  leaseYears: Number,
  physicalSecurity: { type: String, maxlength: 500 },
  dcTiering: { type: String, enum: ['Tier I', 'Tier II', 'Tier III', 'Tier IV', 'Not Certified'] },
  dcTieringCertified: Boolean,
  iso27001: Boolean,
  iso50001: Boolean,
  soc2: Boolean,
  otherCertifications: String,
  powerPermitStatus: { type: String, enum: PERMIT_STATUS_ENUM },
  buildingPermitStatus: { type: String, enum: PERMIT_STATUS_ENUM },
  envPermitStatus: { type: String, enum: PERMIT_STATUS_ENUM },
  currentStatusDetail: String,
  otherSpecDetails: String,
  fireSuppressionType: { type: String, enum: ['Inert Gas', 'Water Mist', 'Pre-Action Sprinkler', 'Hybrid', 'Unknown'] },
  waterFloodRisk: { type: String, enum: ['Low', 'Medium', 'High', 'Unknown'] },
  seismicRisk: { type: String, enum: ['Low', 'Medium', 'High', 'Unknown'] },
  siteDevGC: String,
  siteOperator: String,

  // Step 4: Power Infrastructure
  powerSource: { type: String, enum: ['Grid', 'Power Behind Meter', 'Hybrid'] },
  gridVoltageKv: Number,
  powerRedundancy: { type: String, enum: ['N', 'N+1', '2N', '2N+1', '2(N+1)', 'Shared Redundant'] },
  backupPower: { type: String, enum: ['Batteries (BESS)', 'Diesel Generators', 'Dual Source', 'Other'] },
  backupPowerOther: String,
  substationStatus: { type: String, enum: ['Existing', 'Under Construction', 'Planned', 'Off-site Only'] },
  transformerRedundancy: { type: String, enum: ['N', 'N+1', '2N', 'Unknown'] },
  maintenanceConcurrency: { type: String, enum: ['Yes', 'No', 'Partial'] },
  upsAutonomyMin: Number,
  upsTopology: { type: String, enum: ['Centralized', 'Distributed', 'Block Redundant', 'Modular'] },
  renewableEnergyPct: Number,
  renewableTypes: [String],
  numberOfFeeds: Number,
  abFeedsSeparated: { type: String, enum: ['Yes', 'No', 'Unknown'] },
  futureReservedPower: { type: String, enum: ['Yes', 'No', 'Partially'] },
  curtailmentRisk: { type: String, enum: ['None Known', 'Low', 'Medium', 'High'] },
  powerOtherDetails: String,

  // Step 5: Connectivity
  carrierNeutral: Boolean,
  carriersOnNet: Number,
  carriersAvailable: String,
  darkFibreAvailable: Boolean,
  fiberEntryPoints: String,
  mmrDescription: { type: String, maxlength: 2000 },
  mmrRedundancy: { type: String, enum: ['Single', 'Redundant', 'Unknown'] },
  connectivityMapping: { type: String, maxlength: 2000 },
  distanceToIxKm: Number,
  crossConnectAvail: { type: String, enum: ['Yes', 'No', 'Planned'] },
  latencyMs: Number,
  latencyDestination: String,
  connectivityOther: String,

  // Step 6: Commercial Terms
  leaseTermOptions: String,
  breakExtensionRights: String,
  paymentFrequency: { type: String, enum: ['Monthly', 'Yearly'] },
  depositRequirement: String,
  remoteHandsPricing: String,
  otherOpex: String,
  fitOutContribution: String,
  makeGoodObligations: String,
  taxVatTreatment: String,
  indexationBasis: String,

  // Step 8: Site Financials
  storageRentUsd: Number,
  taxIncentives: Boolean,
  annualEscalationPct: Number,
  additionalOpex: String,
  insuranceByDc: Boolean,
  depositRequired: Boolean,
  powerPriceStructure: { type: String, enum: ['Fixed', 'Indexed', 'Pass-through', 'Blended'] },
  ppa: String,
  avgPowerPriceCents: Number,
  crossConnectPricing: String,

  // Step 9: Remarks
  remarks: String,

  // Review tracking
  flaggedFields: [String],
  fieldComments: { type: Map, of: String },
  history: [mongoose.Schema.Types.Mixed],
}, { timestamps: true });

module.exports = mongoose.model('DcSite', dcSiteSchema);
