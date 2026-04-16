# ICX Portal — Mongoose Data Models

All models use `{ timestamps: true }` for automatic `createdAt` and `updatedAt`.

---

## User

```javascript
{
  email:            { type: String, required: true, unique: true, lowercase: true },
  role:             { type: String, enum: ['superadmin','admin','supplier','broker','customer','reader','viewer','subordinate'], required: true },
  organizationId:   { type: ObjectId, ref: 'Organization' },
  isActive:         { type: Boolean, default: true },
  lastLoginAt:      Date
}
```

**No password field.** Auth is purely OTP → JWT.

---

## Otp

```javascript
{
  email:       { type: String, required: true, index: true },
  code:        { type: String, required: true },          // 6-digit, hashed
  purpose:     { type: String, enum: ['login','register'], required: true },
  expiresAt:   { type: Date, required: true },            // now + 5 minutes
  attempts:    { type: Number, default: 0 },              // max 3
  verified:    { type: Boolean, default: false }
}
// TTL index on expiresAt for auto-cleanup
```

---

## Organization

```javascript
{
  type:                { type: String, enum: ['SUPPLIER','BROKER','CUSTOMER'], required: true },
  status:              { type: String, enum: ['PENDING','KYC_SUBMITTED','APPROVED','REJECTED','REVISION_REQUESTED'], default: 'PENDING' },

  // --- Supplier/Broker KYC fields (6) ---
  vendorType:          { type: String, enum: ['Operator','Developer','Landlord','Broker','Advisor','Other Intermediary'] },
  mandateStatus:       { type: String, enum: ['Exclusive','Non-exclusive','Direct','Unknown'] },
  ndaRequired:         Boolean,
  ndaSigned:           Boolean,
  contactEmail:        { type: String, required: true },
  contactNumber:       String,

  // --- Customer registration fields ---
  companyName:         String,
  companyType:         String,
  jurisdiction:        { type: String, enum: ['UAE','KSA','Qatar','Bahrain','Oman','Kuwait','Other'] },
  industrySector:      String,
  taxVatNumber:        String,
  companyAddress:      String,
  website:             String,
  authSignatoryName:   String,
  authSignatoryTitle:  String,
  billingContactName:  String,
  billingContactEmail: String,
  primaryUseCases:     [String],
  locationPreferences: [String],
  sovereigntyReqs:     [String],
  complianceReqs:      [String],
  budgetRange:         String,
  urgency:             String,

  // --- Admin review ---
  flaggedFields:       [String],
  fieldComments:       { type: Map, of: String },
  reviewedBy:          ObjectId,
  approvedAt:          Date
}
```

---

## BrokerDcCompany

```javascript
{
  brokerId:        { type: ObjectId, ref: 'Organization', required: true },
  legalEntity:     { type: String, required: true },
  officeAddress:   { type: String, required: true },
  countryOfIncorp: { type: String, required: true },
  contactName:     String,
  contactEmail:    String,
  contactMobile:   String
}
```

---

## DcApplication

```javascript
{
  organizationId:      { type: ObjectId, ref: 'Organization', required: true },
  brokerDcCompanyId:   { type: ObjectId, ref: 'BrokerDcCompany' },
  status:              { type: String, enum: ['DRAFT','SUBMITTED','IN_REVIEW','REVISION_REQUESTED','RESUBMITTED','APPROVED','REJECTED'], default: 'DRAFT' },
  assignedTo:          [{ type: ObjectId, ref: 'User' }],
  submittedAt:         Date,
  reviewedAt:          Date,

  // Step 1: Company Details
  companyLegalEntity:  String,    // mandatory
  companyOfficeAddress:String,    // mandatory
  companyCountry:      String,    // mandatory
  contactName:         String,    // mandatory
  contactEmail:        { type: String, maxlength: 500 },  // mandatory
  contactMobile:       String,    // mandatory
  otherDetails:        String
}
```

---

## DcSite

The largest model — contains all fields from the DC questionnaire (Steps 2-8).

```javascript
{
  dcApplicationId: { type: ObjectId, ref: 'DcApplication', required: true },

  // === Step 2: Site Details (14 fields) ===
  siteName:                { type: String, required: true },
  projectType:             { type: String, enum: ['Brownfield (Retrofit/Conversion)','Greenfield','Expansion'] },
  currentProjectStatus:    { type: String, enum: ['Planned','Permitted','Under Construction','Live','Partially Live'] },
  businessModel:           { type: String, enum: ['Colocation (Wholesale/Retail)','Powered Shell','Build-to-Suit'] },
  sovereigntyRestrictions: { type: String, enum: ['None','Domestic Only','Sovereign Cloud Capable','Restricted','Government-Sensitive'] },
  regulatoryCompliance:    { type: String, enum: ['GDPR','Local Law','GDPR + Local Law'] },
  airGapped:               Boolean,
  landSizeSqm:             Number,
  buildingCount:           Number,
  dataHallCount:           Number,
  address:                 { type: String, required: true },
  stateRegion:             { type: String, required: true },
  country:                 { type: String, required: true },
  coordinates:             String,

  // === Step 2b: Master Plan Capacity (6 fields) ===
  currentEnergizedMw:      Number,
  totalItLoadMw:           Number,
  totalUtilityMva:         Number,
  totalWhiteSpaceSqm:      Number,
  expansionPossible:       Boolean,
  expansionMw:             Number,

  // === Step 3: DC Specifications (28 fields) ===
  maxRackDensityKw:        Number,
  typicalRackDensityKw:    Number,
  coolingMethodology:      [String],    // checkboxes: Air Cooled, Liquid Cooling Ready (Rear Door/DLC), Hybrid
  liquidCoolingStatus:     { type: String, enum: ['Installed','Ready for Retrofit','Design-ready only','No'] },
  designPue:               Number,      // fractional
  designWue:               Number,
  floorMaxWeight:          Number,
  landOwner:               String,
  landOwnershipType:       { type: String, enum: ['Freehold','Leasehold'] },
  leaseYears:              Number,      // conditional: only if Leasehold
  physicalSecurity:        { type: String, maxlength: 500 },
  dcTiering:               { type: String, enum: ['Tier I','Tier II','Tier III','Tier IV','Not Certified'] },
  dcTieringCertified:      Boolean,
  iso27001:                Boolean,
  iso50001:                Boolean,
  soc2:                    Boolean,
  otherCertifications:     String,
  powerPermitStatus:       { type: String, enum: ['Not Required','Not Applied','In Preparation','Submitted Under Review','Approved','Approved with Conditions','Rejected','Expired','Unknown'] },
  buildingPermitStatus:    String,      // same enum
  envPermitStatus:         String,      // same enum
  currentStatusDetail:     String,
  otherSpecDetails:        String,
  fireSuppressionType:     { type: String, enum: ['Inert Gas','Water Mist','Pre-Action Sprinkler','Hybrid','Unknown'] },
  waterFloodRisk:          { type: String, enum: ['Low','Medium','High','Unknown'] },
  seismicRisk:             { type: String, enum: ['Low','Medium','High','Unknown'] },
  siteDevGC:               String,
  siteOperator:            String,

  // === Step 4: Power Infrastructure (16 fields) ===
  powerSource:             { type: String, enum: ['Grid','Power Behind Meter','Hybrid'] },
  gridVoltageKv:           Number,
  powerRedundancy:         { type: String, enum: ['N','N+1','2N','2N+1','2(N+1)','Shared Redundant'] },
  backupPower:             { type: String, enum: ['Batteries (BESS)','Diesel Generators','Dual Source','Other'] },
  backupPowerOther:        String,      // free text when "Other"
  substationStatus:        { type: String, enum: ['Existing','Under Construction','Planned','Off-site Only'] },
  transformerRedundancy:   { type: String, enum: ['N','N+1','2N','Unknown'] },
  maintenanceConcurrency:  { type: String, enum: ['Yes','No','Partial'] },
  upsAutonomyMin:          Number,
  upsTopology:             { type: String, enum: ['Centralized','Distributed','Block Redundant','Modular'] },
  renewableEnergyPct:      Number,
  renewableTypes:          [String],    // checkboxes: Hydro, Wind, Solar
  numberOfFeeds:           Number,
  abFeedsSeparated:        { type: String, enum: ['Yes','No','Unknown'] },
  futureReservedPower:     { type: String, enum: ['Yes','No','Partially'] },
  curtailmentRisk:         { type: String, enum: ['None Known','Low','Medium','High'] },
  powerOtherDetails:       String,

  // === Step 5: Connectivity (13 fields) ===
  carrierNeutral:          Boolean,
  carriersOnNet:           Number,
  carriersAvailable:       String,
  darkFibreAvailable:      Boolean,
  fiberEntryPoints:        String,
  mmrDescription:          { type: String, maxlength: 2000 },
  mmrRedundancy:           { type: String, enum: ['Single','Redundant','Unknown'] },
  connectivityMapping:     { type: String, maxlength: 2000 },
  distanceToIxKm:          Number,
  crossConnectAvail:       { type: String, enum: ['Yes','No','Planned'] },
  latencyMs:               Number,
  latencyDestination:      String,      // mandatory if latencyMs filled
  connectivityOther:       String,

  // === Step 6: Commercial Terms (10 fields) ===
  leaseTermOptions:        String,
  breakExtensionRights:    String,
  paymentFrequency:        { type: String, enum: ['Monthly','Yearly'] },
  depositRequirement:      String,      // placeholder: "USD amount or x months of rent"
  remoteHandsPricing:      String,
  otherOpex:               String,
  fitOutContribution:      String,
  makeGoodObligations:     String,
  taxVatTreatment:         String,
  indexationBasis:         String,

  // === Step 8: Site Financials (10 fields) ===
  storageRentUsd:          Number,
  taxIncentives:           Boolean,
  annualEscalationPct:     Number,
  additionalOpex:          String,
  insuranceByDc:           Boolean,
  depositRequired:         Boolean,
  powerPriceStructure:     { type: String, enum: ['Fixed','Indexed','Pass-through','Blended'] },
  ppa:                     String,
  avgPowerPriceCents:      Number,
  crossConnectPricing:     String,

  // === Step 9: Remarks ===
  remarks:                 String,

  // === Review tracking ===
  flaggedFields:           [String],
  fieldComments:           { type: Map, of: String },
  history:                 [mongoose.Schema.Types.Mixed]    // Array of snapshots: { data: {...}, changedAt: Date, changedBy: ObjectId }
}
```

---

## DcPhasingSchedule

```javascript
{
  dcSiteId:            { type: ObjectId, ref: 'DcSite', required: true },
  month:               { type: Date, required: true },
  itLoadMw:            Number,
  cumulativeItLoadMw:  Number,      // auto-calculated
  scopeOfWorks:        String,      // dropdown: Shell & Core + Fitout
  estimatedCapexMusd:  Number,
  phase:               { type: String, enum: ['Original Phase','Expansion 1','Expansion 2'] },
  minLeaseDurationYrs: Number,
  nrcRequestMusd:      Number,      // fractional
  initialDepositMusd:  Number,      // fractional
  mrcRequestPerKw:     Number,
  mrcInclusions:       String
}
```

---

## DcDocument

```javascript
{
  dcSiteId:       { type: ObjectId, ref: 'DcSite', required: true },
  documentType:   { type: String, enum: ['COMPLIANCE_SHEET','SPACE_DOCS','AGREEMENTS','FLOOR_PLAN'], required: true },
  fileName:       { type: String, required: true },
  fileUrl:        { type: String, required: true },
  fileSize:       Number,
  mimeType:       String,
  uploadedBy:     { type: ObjectId, ref: 'User', required: true },
  received:       { type: String, enum: ['Yes','No','Pending'], default: 'Pending' },
  reviewed:       { type: String, enum: ['Yes','No','In Progress'], default: 'No' },
  reviewComment:  String,
  uploadedAt:     { type: Date, default: Date.now }
}
```

---

## GpuClusterListing

```javascript
{
  organizationId:   { type: ObjectId, ref: 'Organization', required: true },
  status:           { type: String, enum: ['DRAFT','SUBMITTED','IN_REVIEW','REVISION_REQUESTED','RESUBMITTED','APPROVED','REJECTED'], default: 'DRAFT' },
  assignedTo:       [{ type: ObjectId, ref: 'User' }],
  submittedAt:      Date,
  reviewedAt:       Date,

  // Step 1: Basic Info
  vendorName:       { type: String, required: true },
  location:         { type: String, required: true },
  country:          { type: String, required: true },
  gpuTechnology:    { type: String, required: true },
  googleMapsLink:   { type: String, required: true },
  dcLandlord:       String,
  totalGpuCount:    Number,
  singleClusterSize:{ type: Number, required: true },
  availabilityDate: { type: Date, required: true },
  notes:            { type: String, required: true, maxlength: 500 },
  restrictedUse:    String,

  // Step 2: Compute Node
  gpuServerModel:   { type: String, required: true },
  cpu:              String,
  gpu:              String,
  ram:              String,
  localStorage:     { type: String, required: true },
  nics:             String,

  // Step 3: Compute Network East-West
  computeNetTopology:         String,
  computeNetTechnology:       { type: String, required: true },
  computeNetSwitchVendor:     String,
  computeNetLayers:           String,
  computeNetOversubscription: String,
  computeNetScalability:      String,
  computeNetQos:              String,

  // Step 4: Management Network North-South
  mgmtNetTopology:            String,
  mgmtNetTechnology:          String,
  mgmtNetLayers:              Number,
  mgmtNetSwitchVendor:        String,
  mgmtNetOversubscription:    String,
  mgmtNetScalability:         String,

  // Step 5: OOB + Storage + Connectivity
  oobNetTechnology:           String,
  storageOptions:             { type: String, maxlength: 2000 },
  connectivityDetails:        { type: String, maxlength: 2000 },

  // Step 6: Cluster Description
  clusterDescription:         { type: String, maxlength: 2000 },

  // Step 7: Power & Facility (Extended — all optional)
  powerSupplyStatus:          String,
  rackPowerCapacityKw:        Number,
  modularDataHalls:           Number,
  totalPowerCapacityMw:       Number,
  powerCapacityPerFloor:      Number,
  dataHallLayoutPerFloor:     String,
  futureExpansion:            String,
  dualFeedPower:              String,
  upsConfiguration:           String,
  backupGenerators:           String,
  coolingDesign:              String,
  coolingUnits:               String,
  coolingCapacity:            String,
  floorPlans:                 String,

  // Review tracking
  flaggedFields:              [String],
  fieldComments:              { type: Map, of: String },
  history:                    [mongoose.Schema.Types.Mixed]
}
```

---

## GpuClusterDocument

```javascript
{
  gpuClusterListingId: { type: ObjectId, ref: 'GpuClusterListing', required: true },
  documentType:        { type: String, enum: ['SECURITY_COMPLIANCE','ARCHITECTURE_DIAGRAM','SPEC_SHEET','OTHER'] },
  fileName:            String,
  fileUrl:             String,
  fileSize:            Number,
  uploadedBy:          { type: ObjectId, ref: 'User' },
  received:            { type: String, enum: ['Yes','No','Pending'], default: 'Pending' },
  reviewed:            { type: String, enum: ['Yes','No','In Progress'], default: 'No' },
  reviewComment:       String,
  uploadedAt:          { type: Date, default: Date.now }
}
```

---

## GpuDemandRequest

```javascript
{
  organizationId:       { type: ObjectId, ref: 'Organization', required: true },
  submittedBy:          { type: ObjectId, ref: 'User', required: true },
  status:               { type: String, enum: ['DRAFT','SUBMITTED','IN_REVIEW','MATCHED','CLOSED'], default: 'DRAFT' },
  customerName:         { type: String, required: true },
  customerCountry:      { type: String, required: true },
  technologyType:       { type: String, required: true },
  contractLengthYears:  { type: String, required: true },
  clusterSizeGpus:      { type: String, required: true },
  idealClusterLocation: String,
  exportConstraints:    String,
  timelineGoLive:       { type: String, required: true },
  connectivityMbps:     Number,
  latencyMs:            Number,
  interconnectivity:    String,
  dcTierMinimum:        { type: String, enum: ['Tier I','Tier II','Tier III','Tier IV'] },
  redundancyRequirements: String,
  targetPriceGpuHr:     String,
  decisionMaker:        String,
  procurementStage:     String,
  otherComments:        { type: String, maxlength: 500 },
  matchedClusterIds:    [{ type: ObjectId, ref: 'GpuClusterListing' }]
}
```

---

## DcCapacityRequest

```javascript
{
  organizationId:       { type: ObjectId, ref: 'Organization', required: true },
  submittedBy:          { type: ObjectId, ref: 'User', required: true },
  status:               { type: String, enum: ['DRAFT','SUBMITTED','IN_REVIEW','MATCHED','CLOSED'], default: 'DRAFT' },
  companyName:          { type: String, required: true },
  country:              { type: String, required: true },
  requiredPowerMw:      { type: String, required: true },
  preferredLocation:    String,
  dcTierRequirement:    { type: String, enum: ['Tier I','Tier II','Tier III','Tier IV'] },
  businessModel:        { type: String, enum: ['Colocation (Wholesale/Retail)','Powered Shell','Build-to-Suit'] },
  sovereigntyReqs:      String,
  complianceReqs:       String,
  timelineGoLive:       { type: String, required: true },
  contractLength:       String,
  budgetRange:          String,
  coolingRequirements:  String,
  connectivityReqs:     String,
  otherComments:        String,
  matchedListingIds:    [{ type: ObjectId, ref: 'DcApplication' }]
}
```

---

## TeamInvite

```javascript
{
  organizationId: { type: ObjectId, ref: 'Organization', required: true },
  invitedBy:      { type: ObjectId, ref: 'User', required: true },
  email:          { type: String, required: true },
  role:           { type: String, default: 'subordinate' },
  permissions:    [{ type: String, enum: ['documents','site_details','technical','commercial','phasing','financials'] }],
  status:         { type: String, enum: ['PENDING','ACCEPTED','REVOKED'], default: 'PENDING' },
  acceptedAt:     Date
}
```

---

## QueueItem

```javascript
{
  type:           { type: String, enum: ['SUPPLIER_KYC','DC_LISTING','GPU_CLUSTER','CUSTOMER_APPLICATION','GPU_DEMAND','DC_REQUEST','RESUBMISSION'], required: true },
  referenceId:    { type: ObjectId, required: true },
  referenceModel: { type: String, required: true },
  status:         { type: String, enum: ['NEW','IN_REVIEW','RESUBMITTED','APPROVED','REJECTED'], default: 'NEW' },
  assignedTo:     [{ type: ObjectId, ref: 'User' }],
  priority:       { type: Number, default: 0 }
}
```

---

## AuditLog

```javascript
{
  userId:      { type: ObjectId, ref: 'User' },
  action:      { type: String, required: true },
  targetModel: String,
  targetId:    ObjectId,
  changes:     mongoose.Schema.Types.Mixed,
  ipAddress:   String,
  createdAt:   { type: Date, default: Date.now }
}
```

---

## Notification

```javascript
{
  userId:    { type: ObjectId, ref: 'User', required: true },
  type:      String,
  title:     String,
  message:   String,
  read:      { type: Boolean, default: false },
  link:      String,
  createdAt: { type: Date, default: Date.now }
}
```

---

---

## Notification

```javascript
{
  userId:    { type: ObjectId, ref: 'User', required: true, index: true },
  type:      String,    // e.g. 'KYC_APPROVED', 'LISTING_SUBMITTED', 'REVISION_REQUESTED'
  title:     String,
  message:   String,
  read:      { type: Boolean, default: false },
  link:      String,    // in-app deep link e.g. '/supplier/dc-listings/abc123'
  createdAt: { type: Date, default: Date.now }
}
```

---

## Total: 16 models
