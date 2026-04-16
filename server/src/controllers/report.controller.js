const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const XLSX = require('xlsx');

// ======================= FIELD LABELS =======================
const FIELD_LABELS = {
  // Identity & Status
  listingId: 'Listing ID',
  status: 'Status',
  isArchived: 'Archived',
  siteCount: 'Site Count',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
  // Supplier / Organisation
  supplierName: 'Supplier Name',
  supplierEmail: 'Supplier Email',
  kycStatus: 'KYC Status',
  // Step 1: Company Details
  companyLegalEntity: 'Company Legal Entity',
  companyOfficeAddress: 'Company Office Address',
  companyCountry: 'Company Country',
  contactName: 'Contact Name',
  contactMobile: 'Contact Mobile',
  // Step 2: Site Details
  dataCenterName: 'Data Center Name',
  siteName: 'Site Name',
  projectType: 'Project Type',
  currentProjectStatus: 'Current Project Status',
  businessModel: 'Business Model',
  sovereigntyRestrictions: 'Sovereignty Restrictions',
  regulatoryCompliance: 'Regulatory Compliance',
  airGapped: 'Air Gapped',
  landSizeSqm: 'Land Size (sqm)',
  buildingCount: 'Building Count',
  dataHallCount: 'Data Hall Count',
  siteAddress: 'Site Address',
  country: 'Country',
  state: 'State / Region',
  city: 'City',
  location: 'Location',
  coordinates: 'GPS Coordinates',
  // Step 3: Capacity
  currentEnergizedMw: 'Current Energized MW',
  totalItLoadMw: 'Total IT Load (MW)',
  totalMW: 'Total MW',
  availableMW: 'Available MW',
  totalUtilityMva: 'Total Utility (MVA)',
  totalWhiteSpaceSqm: 'Total White Space (sqm)',
  expansionPossible: 'Expansion Possible',
  expansionMw: 'Expansion MW',
  // Step 4: DC Specifications
  maxRackDensityKw: 'Max Rack Density (kW)',
  typicalRackDensityKw: 'Typical Rack Density (kW)',
  rackCoolingEffectiveTempC: 'Rack Cooling Temp (°C)',
  facilityCoolingEffectiveTempC: 'Facility Cooling Temp (°C)',
  coolingMethodology: 'Cooling Methodology',
  liquidCoolingStatus: 'Liquid Cooling Status',
  waterCoolingSource: 'Water Cooling Source',
  designPue: 'Design PUE',
  designWue: 'Design WUE',
  designWueType: 'WUE Type',
  floorMaxWeight: 'Floor Max Weight',
  landOwner: 'Land Owner',
  landOwnershipType: 'Land Ownership Type',
  leaseYears: 'Lease Years',
  physicalSecurity: 'Physical Security',
  physicalSecurityZones: 'Security Zones',
  dcTiering: 'DC Tiering',
  dcTieringCertified: 'Tiering Certified',
  iso27001: 'ISO 27001',
  iso50001: 'ISO 50001',
  soc2: 'SOC 2',
  otherCertifications: 'Other Certifications',
  powerPermitStatus: 'Power Permit Status',
  buildingPermitStatus: 'Building Permit Status',
  envPermitStatus: 'Environmental Permit Status',
  fireSuppressionType: 'Fire Suppression Type',
  waterFloodRisk: 'Water / Flood Risk',
  seismicRisk: 'Seismic Risk',
  dcSiteDeveloper: 'DC Site Developer',
  dcSiteOperator: 'DC Site Operator',
  // Step 5: Power Infrastructure
  powerSource: 'Power Source',
  gridVoltageKv: 'Grid Voltage (kV)',
  powerRedundancy: 'Power Redundancy',
  backupPower: 'Backup Power',
  backupPowerBessType: 'BESS Type',
  substationStatus: 'Substation Status',
  transformerRedundancy: 'Transformer Redundancy',
  maintenanceConcurrency: 'Maintenance Concurrency',
  upsAutonomyMin: 'UPS Autonomy (min)',
  upsTopology: 'UPS Topology',
  renewableEnergyPct: 'Renewable Energy (%)',
  renewableTypes: 'Renewable Types',
  numberOfFeeds: 'Number of Feeds',
  abFeedsSeparated: 'A/B Feeds Separated',
  futureReservedPower: 'Future Reserved Power',
  curtailmentRisk: 'Curtailment Risk',
  // Step 6: Connectivity
  carrierNeutral: 'Carrier Neutral',
  carriersOnNet: 'Carriers On-Net',
  carriersAvailable: 'Carriers Available',
  darkFibreAvailable: 'Dark Fibre Available',
  fiberEntryPoints: 'Fiber Entry Points',
  mmrDescription: 'MMR Description',
  mmrRedundancy: 'MMR Redundancy',
  connectivityMapping: 'Connectivity Mapping',
  distanceToIxKm: 'Distance to IX (km)',
  crossConnectAvail: 'Cross Connect Availability',
  latencyMs: 'Latency (ms)',
  latencyDestination: 'Latency Destination',
  // Step 7: Commercial Terms
  leaseTermOptions: 'Lease Term Options',
  breakExtensionRights: 'Break / Extension Rights',
  paymentFrequency: 'Payment Frequency',
  depositRequirement: 'Deposit Requirement',
  remoteHandsPricing: 'Remote Hands Pricing',
  fitOutContribution: 'Fit-Out Contribution',
  makeGoodObligations: 'Make-Good Obligations',
  taxVatTreatment: 'Tax / VAT Treatment',
  indexationBasis: 'Indexation Basis',
  annualEscalationPct: 'Annual Escalation (%)',
  insuranceByDc: 'Insurance by DC',
  prepaidRequired: 'Prepaid Required',
  powerPriceStructure: 'Power Price Structure',
  powerPriceCurrentUsd: 'Power Price (USD/kWh)',
  crossConnectPricing: 'Cross Connect Pricing',
  currency: 'Currency',
  // Common
  bookedMW: 'Booked MW',
  price: 'Price',
  contractDuration: 'Contract Duration',
  // GPU Listings — Basic Info (Step 1)
  gpuTechnology: 'GPU Technology',
  googleMapsLink: 'Google Maps Link',
  dcLandlord: 'DC Landlord',
  singleClusterSize: 'Cluster Size (GPUs)',
  totalGpuCount: 'Total GPU Count',
  availabilityDate: 'Availability Date',
  restrictedUse: 'Restricted Use',
  notes: 'Notes',
  // GPU Listings — Compute Node (Step 2)
  gpu: 'GPU Model',
  gpuServerModel: 'GPU Server Model',
  cpu: 'CPU',
  ram: 'RAM',
  localStorage: 'Local Storage',
  nics: 'NICs',
  // GPU Listings — Compute Network (Step 3)
  computeNetTopology: 'Compute Net Topology',
  computeNetTechnology: 'Compute Net Technology',
  computeNetSwitchVendor: 'Compute Net Switch Vendor',
  computeNetLayers: 'Compute Net Layers',
  computeNetOversubscription: 'Compute Net Oversubscription',
  computeNetScalability: 'Compute Net Scalability',
  computeNetQos: 'Compute Net QoS',
  // GPU Listings — Management Network (Step 4)
  mgmtNetTopology: 'Mgmt Net Topology',
  mgmtNetTechnology: 'Mgmt Net Technology',
  mgmtNetLayers: 'Mgmt Net Layers',
  mgmtNetSwitchVendor: 'Mgmt Net Switch Vendor',
  mgmtNetOversubscription: 'Mgmt Net Oversubscription',
  mgmtNetScalability: 'Mgmt Net Scalability',
  // GPU Listings — Other (Step 5)
  oobNetTechnology: 'OOB Net Technology',
  storageOptions: 'Storage Options',
  connectivityDetails: 'Connectivity Details',
  // GPU Listings — Cluster Description (Step 6)
  clusterDescription: 'Cluster Description',
  // GPU Listings — Cluster Configuration (Step 7)
  clusterName: 'Cluster Name',
  clusterIdentifier: 'Cluster Identifier',
  redundancy: 'Redundancy',
  failover: 'Failover',
  // GPU Listings — Extended Information (Step 8)
  powerSupplyStatus: 'Power Supply Status',
  rackPowerCapacityKw: 'Rack Power Capacity (kW)',
  modularDataHalls: 'Modular Data Halls',
  totalPowerCapacityMw: 'Total Power Capacity (MW)',
  powerCapacityPerFloor: 'Power Capacity Per Floor',
  modularDataHallLayoutPerFloor: 'Data Hall Layout Per Floor',
  futureExpansionCapability: 'Future Expansion',
  dualFeedRedundant: 'Dual Feed Redundant',
  upsConfiguration: 'UPS Configuration',
  backupGenerators: 'Backup Generators',
  coolingDesign: 'Cooling Design',
  numberOfCoolingUnits: 'No. of Cooling Units',
  coolingCapacityKw: 'Cooling Capacity (kW)',
  rackModuleLayout: 'Rack Module Layout',
  // Inventory / GPU Requests
  totalUnits: 'Total Units',
  bookedUnits: 'Booked Units',
  availableUnits: 'Available Units',
  unitType: 'Unit Type',
  pricingPeriod: 'Pricing Period',
  description: 'Description',
  // Suppliers
  organizationId: 'Organization ID',
  companyName: 'Company Name',
  contactEmail: 'Contact Email',
  vendorType: 'Vendor Type',
  mandateStatus: 'Mandate Status',
  dcListingCount: 'DC Listings',
  gpuListingCount: 'GPU Listings',
  listingCount: 'Total Listings',
  approvedAt: 'Approved At',
  // Analytics
  totalSuppliers: 'Total Suppliers',
  totalCustomers: 'Total Customers',
  totalListings: 'Total Listings',
  exportedAt: 'Exported At',
};

const getLabel = (key) => FIELD_LABELS[key] || key;

// ======================= EXPORT HELPERS =======================

// Detect ISO date strings that came through JSON serialization
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

// Coerce any date-like value to a JS Date (or return null)
const toDate = (val) => {
  if (val instanceof Date) return val;
  if (typeof val === 'string' && ISO_RE.test(val)) return new Date(val);
  return null;
};

// Human-readable date string used by CSV, PDF, DOCX
const fmtDateStr = (d) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Text formatter: always returns a printable string
const fmtDisplay = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const d = toDate(val);
  if (d) return fmtDateStr(d);
  if (Array.isArray(val)) return val.join('; ');
  return String(val);
};

// XLSX formatter: keeps numbers as numbers, Dates as Dates, arrays → string
const fmtXlsx = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const d = toDate(val);
  if (d) return d;                          // xlsx-js writes as Excel date cell
  if (Array.isArray(val)) return val.join('; ');
  return val;                               // numbers stay numbers
};

// Resolve field keys — use selectedFields if provided, else all keys from first row
const resolveKeys = (data, fields) =>
  fields && fields.length > 0
    ? fields
    : data.length > 0
      ? Object.keys(data[0]).filter((k) => k !== 'id' && k !== '_id')
      : [];

const toXlsx = (data, fields) => {
  const keys = resolveKeys(data, fields);
  if (keys.length === 0) return Buffer.alloc(0);

  const labels = keys.map(getLabel);

  const rows = data.map((row) =>
    keys.reduce((acc, k, i) => {
      acc[labels[i]] = fmtXlsx(row[k]);
      return acc;
    }, {}),
  );

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}], {
    header: labels,
    cellDates: true,   // write Date objects as Excel date serials
  });

  // Auto-column widths — cap at 40, treat Date cells as ~14 chars wide
  ws['!cols'] = labels.map((l) => {
    const maxData = rows.slice(0, 100).reduce((m, r) => {
      const v = r[l];
      const len = v instanceof Date ? 14 : String(v ?? '').length;
      return Math.max(m, len);
    }, 0);
    return { wch: Math.min(40, Math.max(l.length, maxData) + 2) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellDates: true });
};

const toCsv = (data, fields) => {
  const keys = resolveKeys(data, fields);
  if (keys.length === 0) return '';

  const labels = keys.map(getLabel);

  const rows = data.map((row) =>
    keys.map((k) => {
      // Wrap in double-quotes and escape internal quotes per RFC 4180
      const s = fmtDisplay(row[k]);
      return '"' + s.replace(/"/g, '""') + '"';
    }).join(','),
  );
  return [labels.map((l) => '"' + l.replace(/"/g, '""') + '"').join(','), ...rows].join('\r\n');
};

// ======================= QUERY BUILDER =======================

const buildFilter = (filters, reportType) => {
  const where = {};
  if (!filters) return where;

  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters.country) {
    where.country = { contains: filters.country, mode: 'insensitive' };
  }

  if (filters.state) {
    where.state = { contains: filters.state, mode: 'insensitive' };
  }

  if (filters.city) {
    where.city = { contains: filters.city, mode: 'insensitive' };
  }

  // Legacy location filter (searches city/state/country in one field)
  if (filters.location) {
    where.OR = [
      { city: { contains: filters.location, mode: 'insensitive' } },
      { state: { contains: filters.location, mode: 'insensitive' } },
      { country: { contains: filters.location, mode: 'insensitive' } }
    ];
  }

  // Supplier name — filter via organization relation
  if (filters.supplierName) {
    where.organization = {
      company_name: { contains: filters.supplierName, mode: 'insensitive' }
    };
  }

  // MW range filters
  if (filters.minMw !== undefined && filters.minMw !== null && filters.minMw !== '') {
    where.total_mw = { ...where.total_mw, gte: Number(filters.minMw) };
  }
  if (filters.maxMw !== undefined && filters.maxMw !== null && filters.maxMw !== '') {
    where.total_mw = { ...where.total_mw, lte: Number(filters.maxMw) };
  }

  if (filters.dateRange) {
    const field = filters.dateRange.field === 'updatedAt' ? 'updated_at' : 'created_at';
    where[field] = {};
    if (filters.dateRange.startDate) where[field].gte = new Date(filters.dateRange.startDate);
    if (filters.dateRange.endDate) where[field].lte = new Date(filters.dateRange.endDate);
  }

  return where;
};

// ======================= DATA FETCHERS =======================

// Normalize camelCase sort fields to Prisma snake_case column names for the Listing model
const SORT_FIELD_MAP = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  dataCenterName: 'data_center_name',
  totalMw: 'total_mw',
  totalMW: 'total_mw',
  availableMw: 'available_mw',
  availableMW: 'available_mw',
  totalUnits: 'total_units',
  availableUnits: 'available_units',
  status: 'status',
  country: 'country',
  state: 'state',
  city: 'city',
  price: 'price',
};

// Valid Prisma Listing column names — anything NOT in this set falls back to created_at
const VALID_LISTING_SORT_COLS = new Set([
  'created_at', 'updated_at', 'data_center_name', 'country', 'state', 'city',
  'total_mw', 'available_mw', 'total_units', 'available_units', 'status',
  'price', 'currency', 'contract_duration',
]);

const normalizeSortField = (field) => {
  const mapped = SORT_FIELD_MAP[field] || field || 'created_at';
  return VALID_LISTING_SORT_COLS.has(mapped) ? mapped : 'created_at';
};

const boolStr = (v) => v == null ? '' : (v ? 'Yes' : 'No');

const fetchDcListings = async (where, { sortBy, sortDirection, page, limit }) => {
  const orderBy = { [normalizeSortField(sortBy)]: sortDirection || 'desc' };
  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = page && limit ? limit : undefined;

  where.type = 'DC_SITE';

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({ where, orderBy, skip, take, include: { organization: true, sites: true } }),
    prisma.listing.count({ where })
  ]);

  const data = listings.map((l) => {
    const listingSpecs = (l.specifications && typeof l.specifications === 'object') ? l.specifications : {};
    const site = l.sites?.[0];
    const siteSpecs = (site?.specifications && typeof site.specifications === 'object') ? site.specifications : {};
    const s = { ...listingSpecs, ...siteSpecs };

    const country = l.country || s.country || s.companyCountry || '';
    const state = l.state || s.stateRegion || '';
    const city = l.city || s.address || '';

    return {
      listingId: l.id,
      status: l.status,
      isArchived: boolStr(!!l.archived_at),
      createdAt: l.created_at,
      updatedAt: l.updated_at,
      siteCount: l.sites.length,
      supplierName: l.organization?.company_name || s.companyLegalEntity || l.data_center_name || '',
      supplierEmail: l.organization?.contact_email || '',
      kycStatus: l.organization?.status || '',
      companyLegalEntity: s.companyLegalEntity || '',
      companyOfficeAddress: s.companyOfficeAddress || '',
      companyCountry: s.companyCountry || '',
      contactName: s.contactName || '',
      contactMobile: s.contactMobile || '',
      dataCenterName: l.data_center_name || s.siteName || '',
      siteName: s.siteName || '',
      projectType: s.projectType || '',
      currentProjectStatus: s.currentProjectStatus || '',
      businessModel: s.businessModel || '',
      sovereigntyRestrictions: s.sovereigntyRestrictions || '',
      regulatoryCompliance: s.regulatoryCompliance || '',
      airGapped: boolStr(s.airGapped),
      landSizeSqm: s.landSizeSqm ?? '',
      buildingCount: s.buildingCount ?? '',
      dataHallCount: s.dataHallCount ?? '',
      siteAddress: s.address || '',
      country,
      state,
      city,
      location: [country, state].filter(Boolean).join(', '),
      coordinates: s.coordinates || '',
      currentEnergizedMw: s.currentEnergizedMw ?? '',
      totalItLoadMw: s.totalItLoadMw ?? l.total_mw ?? '',
      totalMW: s.totalItLoadMw ?? l.total_mw ?? '',
      availableMW: l.available_mw ?? '',
      totalUtilityMva: s.totalUtilityMva ?? '',
      totalWhiteSpaceSqm: s.totalWhiteSpaceSqm ?? '',
      expansionPossible: boolStr(s.expansionPossible),
      expansionMw: s.expansionMw ?? '',
      maxRackDensityKw: s.maxRackDensityKw ?? '',
      typicalRackDensityKw: s.typicalRackDensityKw ?? '',
      rackCoolingEffectiveTempC: s.rackCoolingEffectiveTempC ?? '',
      facilityCoolingEffectiveTempC: s.facilityCoolingEffectiveTempC ?? '',
      coolingMethodology: Array.isArray(s.coolingMethodology) ? s.coolingMethodology.join('; ') : (s.coolingMethodology || ''),
      liquidCoolingStatus: s.liquidCoolingStatus || '',
      waterCoolingSource: s.waterCoolingSource || '',
      designPue: s.designPue ?? '',
      designWue: s.designWue ?? '',
      designWueType: s.designWueType || '',
      floorMaxWeight: s.floorMaxWeight ?? '',
      landOwner: s.landOwner || '',
      landOwnershipType: s.landOwnershipType || '',
      leaseYears: s.leaseYears ?? '',
      physicalSecurity: s.physicalSecurity || '',
      physicalSecurityZones: s.physicalSecurityZones ?? '',
      dcTiering: s.dcTiering || '',
      dcTieringCertified: boolStr(s.dcTieringCertified),
      iso27001: boolStr(s.iso27001),
      iso50001: boolStr(s.iso50001),
      soc2: boolStr(s.soc2),
      otherCertifications: s.otherCertifications || '',
      powerPermitStatus: s.powerPermitStatus || '',
      buildingPermitStatus: s.buildingPermitStatus || '',
      envPermitStatus: s.envPermitStatus || '',
      fireSuppressionType: s.fireSuppressionType || '',
      waterFloodRisk: s.waterFloodRisk || '',
      seismicRisk: s.seismicRisk || '',
      dcSiteDeveloper: s.dcSiteDeveloper || '',
      dcSiteOperator: s.dcSiteOperator || '',
      powerSource: s.powerSource || '',
      gridVoltageKv: s.gridVoltageKv ?? '',
      powerRedundancy: s.powerRedundancy || '',
      backupPower: s.backupPower || '',
      backupPowerBessType: s.backupPowerBessType || '',
      substationStatus: s.substationStatus || '',
      transformerRedundancy: s.transformerRedundancy || '',
      maintenanceConcurrency: s.maintenanceConcurrency || '',
      upsAutonomyMin: s.upsAutonomyMin ?? '',
      upsTopology: s.upsTopology || '',
      renewableEnergyPct: s.renewableEnergyPct ?? '',
      renewableTypes: Array.isArray(s.renewableTypes) ? s.renewableTypes.join('; ') : (s.renewableTypes || ''),
      numberOfFeeds: s.numberOfFeeds ?? '',
      abFeedsSeparated: s.abFeedsSeparated || '',
      futureReservedPower: s.futureReservedPower || '',
      curtailmentRisk: s.curtailmentRisk || '',
      carrierNeutral: boolStr(s.carrierNeutral),
      carriersOnNet: s.carriersOnNet ?? '',
      carriersAvailable: s.carriersAvailable || '',
      darkFibreAvailable: boolStr(s.darkFibreAvailable),
      fiberEntryPoints: s.fiberEntryPoints || '',
      mmrDescription: s.mmrDescription || '',
      mmrRedundancy: s.mmrRedundancy || '',
      connectivityMapping: s.connectivityMapping || '',
      distanceToIxKm: s.distanceToIxKm ?? '',
      crossConnectAvail: s.crossConnectAvail || '',
      latencyMs: s.latencyMs ?? '',
      latencyDestination: s.latencyDestination || '',
      leaseTermOptions: s.leaseTermOptions || '',
      breakExtensionRights: s.breakExtensionRights || '',
      paymentFrequency: s.paymentFrequency || '',
      depositRequirement: s.depositRequirement || '',
      remoteHandsPricing: s.remoteHandsPricing || '',
      fitOutContribution: s.fitOutContribution || '',
      makeGoodObligations: s.makeGoodObligations || '',
      taxVatTreatment: s.taxVatTreatment || '',
      indexationBasis: s.indexationBasis || '',
      annualEscalationPct: s.annualEscalationPct ?? '',
      insuranceByDc: boolStr(s.insuranceByDc),
      prepaidRequired: boolStr(s.prepaidRequired),
      powerPriceStructure: s.powerPriceStructure || '',
      powerPriceCurrentUsd: s.powerPriceCurrentUsd ?? l.price ?? '',
      crossConnectPricing: s.crossConnectPricing || '',
      currency: l.currency || 'USD',
    };
  });

  return { data, total };
};

const fetchGpuClusters = async (where, { sortBy, sortDirection, page, limit }) => {
  where.type = 'GPU_CLUSTER';
  // GPU cluster listings have total_units = 0 (default); inventory has total_units > 0
  where.total_units = { lte: 0 };

  const orderBy = { [normalizeSortField(sortBy)]: sortDirection || 'desc' };
  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = page && limit ? limit : undefined;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        organization: true,
        supplier: { select: { name: true, email: true } }
      }
    }),
    prisma.listing.count({ where })
  ]);

  const data = listings.map((l) => {
    const specs = (l.specifications && typeof l.specifications === 'object') ? l.specifications : {};
    const cityVal = l.city || (typeof specs.location === 'string' ? specs.location : specs.location?.city) || '';
    const countryVal = l.country || specs.country || '';

    return {
      // Identity
      listingId: l.id,
      status: l.status,
      isArchived: l.archived_at ? 'Yes' : 'No',
      createdAt: l.created_at,
      updatedAt: l.updated_at,
      // Supplier
      supplierName: l.organization?.company_name || l.supplier?.name || l.data_center_name || '',
      supplierEmail: l.organization?.contact_email || l.supplier?.email || '',
      kycStatus: l.organization?.status || '',
      // Step 1: Basic Info
      dataCenterName: l.data_center_name || specs.vendorName || '',
      country: countryVal,
      city: cityVal,
      location: [cityVal, countryVal].filter(Boolean).join(', '),
      gpuTechnology: specs.gpuTechnology || '',
      googleMapsLink: specs.googleMapsLink || '',
      dcLandlord: specs.dcLandlord || '',
      totalGpuCount: specs.totalGpuCount ?? '',
      singleClusterSize: specs.singleClusterSize ?? '',
      availabilityDate: specs.availabilityDate || '',
      notes: specs.notes || '',
      restrictedUse: specs.restrictedUse || '',
      // Step 2: Compute Node
      gpuServerModel: specs.gpuServerModel || '',
      gpu: specs.gpu || specs.gpuServerModel || '',
      cpu: specs.cpu || '',
      ram: specs.ram || '',
      localStorage: specs.localStorage || '',
      nics: specs.nics || '',
      // Step 3: Compute Network
      computeNetTopology: specs.computeNetTopology || '',
      computeNetTechnology: specs.computeNetTechnology || '',
      computeNetSwitchVendor: specs.computeNetSwitchVendor || '',
      computeNetLayers: specs.computeNetLayers ?? '',
      computeNetOversubscription: specs.computeNetOversubscription || '',
      computeNetScalability: specs.computeNetScalability || '',
      computeNetQos: specs.computeNetQos || '',
      // Step 4: Management Network
      mgmtNetTopology: specs.mgmtNetTopology || '',
      mgmtNetTechnology: specs.mgmtNetTechnology || '',
      mgmtNetLayers: specs.mgmtNetLayers ?? '',
      mgmtNetSwitchVendor: specs.mgmtNetSwitchVendor || '',
      mgmtNetOversubscription: specs.mgmtNetOversubscription || '',
      mgmtNetScalability: specs.mgmtNetScalability || '',
      // Step 5: Other
      oobNetTechnology: specs.oobNetTechnology || '',
      storageOptions: specs.storageOptions || '',
      connectivityDetails: specs.connectivityDetails || '',
      // Step 6: Cluster Description
      clusterDescription: specs.clusterDescription || '',
      // Step 7: Cluster Configuration
      clusterName: specs.clusterName || '',
      clusterIdentifier: specs.clusterIdentifier || '',
      redundancy: specs.redundancy || '',
      failover: specs.failover || '',
      // Step 8: Extended Information
      powerSupplyStatus: specs.powerSupplyStatus || '',
      rackPowerCapacityKw: specs.rackPowerCapacityKw ?? '',
      modularDataHalls: specs.modularDataHalls ?? '',
      totalMW: specs.totalPowerCapacityMw ?? l.total_mw ?? '',
      powerCapacityPerFloor: specs.powerCapacityPerFloor ?? '',
      modularDataHallLayoutPerFloor: specs.modularDataHallLayoutPerFloor || '',
      futureExpansionCapability: specs.futureExpansionCapability || '',
      dualFeedRedundant: specs.dualFeedRedundant || '',
      upsConfiguration: specs.upsConfiguration || '',
      backupGenerators: specs.backupGenerators || '',
      coolingDesign: specs.coolingDesign || '',
      numberOfCoolingUnits: specs.numberOfCoolingUnits ?? '',
      coolingCapacityKw: specs.coolingCapacityKw ?? '',
      rackModuleLayout: specs.rackModuleLayout || '',
      // Commercial
      contractDuration: l.contract_duration || '',
    };
  });

  return { data, total };
};

const fetchInventory = async (where, { sortBy, sortDirection, page, limit }) => {
  where.type = 'GPU_CLUSTER';
  // Inventory listings have total_units > 0 and status AVAILABLE/RESERVED/SOLD/ARCHIVED
  where.total_units = { gt: 0 };

  const orderBy = { [normalizeSortField(sortBy)]: sortDirection || 'desc' };
  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = page && limit ? limit : undefined;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        organization: true,
        supplier: {
          select: {
            name: true,
            email: true,
            organization: { select: { status: true } }
          }
        }
      }
    }),
    prisma.listing.count({ where })
  ]);

  const data = listings.map((l) => {
    const specs = (l.specifications && typeof l.specifications === 'object') ? l.specifications : {};
    // kycStatus from org (if set on listing) or from supplier's org
    const kycStatus = l.organization?.status || l.supplier?.organization?.status || '';
    const cityVal = l.city || '';
    const countryVal = l.country || '';

    return {
      listingId: l.id,
      supplierName: l.organization?.company_name || l.supplier?.name || l.data_center_name || '',
      supplierEmail: l.organization?.contact_email || l.supplier?.email || '',
      dataCenterName: l.data_center_name || '',
      country: countryVal,
      city: cityVal,
      location: [cityVal, countryVal].filter(Boolean).join(', '),
      totalUnits: l.total_units,
      bookedUnits: l.booked_units,
      availableUnits: l.available_units,
      unitType: specs.unitType || '',
      price: l.price ?? '',
      currency: l.currency || 'USD',
      pricingPeriod: l.contract_duration || '',
      contractDuration: l.contract_duration || '',
      gpuTechnology: specs.gpuTechnology || '',
      description: specs.description || '',
      notes: specs.notes || '',
      kycStatus,
      status: l.status,
      isArchived: l.archived_at ? 'Yes' : 'No',
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    };
  });

  return { data, total };
};

const VALID_ORG_STATUSES = ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'];

const fetchSuppliers = async (where, { sortBy, sortDirection, page, limit }) => {
  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = page && limit ? limit : undefined;

  const orgWhere = { type: { in: ['SUPPLIER', 'BROKER'] } };
  if (where.organization?.company_name) orgWhere.company_name = where.organization.company_name;
  if (where.status?.in?.length > 0) {
    const valid = where.status.in.filter((s) => VALID_ORG_STATUSES.includes(s));
    if (valid.length > 0) orgWhere.status = { in: valid };
  }
  // Date range filters on organization
  if (where.created_at) orgWhere.created_at = where.created_at;
  if (where.updated_at) orgWhere.updated_at = where.updated_at;

  // Normalize sort for org model
  const ORG_SORT_MAP = {
    createdAt: 'created_at', updatedAt: 'updated_at',
    supplierName: 'company_name', country: 'jurisdiction',
    status: 'status', kycStatus: 'status',
  };
  const orgSortField = ORG_SORT_MAP[sortBy] || 'created_at';

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where: orgWhere,
      orderBy: { [orgSortField]: sortDirection || 'desc' },
      skip,
      take,
      include: {
        listings: { select: { type: true, status: true } }
      }
    }),
    prisma.organization.count({ where: orgWhere })
  ]);

  const data = orgs.map((o) => ({
    listingId: o.id,
    supplierName: o.company_name || '',
    supplierEmail: o.contact_email || '',
    country: o.jurisdiction || '',
    location: o.company_address || '',
    status: o.status,
    kycStatus: o.status,
    vendorType: o.vendor_type || '',
    mandateStatus: o.mandate_status || '',
    dcListingCount: o.listings.filter(l => l.type === 'DC_SITE').length,
    gpuListingCount: o.listings.filter(l => l.type === 'GPU_CLUSTER').length,
    approvedAt: o.approved_at ? new Date(o.approved_at) : null,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  }));

  return { data, total };
};

const fetchAnalytics = async () => {
  const [suppliers, customers, listings] = await Promise.all([
    prisma.organization.count({ where: { type: 'SUPPLIER', status: 'APPROVED' } }),
    prisma.organization.count({ where: { type: 'CUSTOMER', status: 'APPROVED' } }),
    prisma.listing.count({ where: { status: 'APPROVED' } })
  ]);
  return {
    data: [{ totalSuppliers: suppliers, totalCustomers: customers, totalListings: listings, exportedAt: new Date() }],
    total: 1
  };
};

// ======================= TEMPLATE CRUD =======================

const mapTemplate = (t) => ({
  _id: t.id,
  id: t.id,
  name: t.name,
  description: t.description || '',
  reportType: t.report_type || 'DC_LISTINGS',
  selectedFields: t.selected_fields || [],
  filters: t.filters || {},
  sortBy: t.sort_by || 'createdAt',
  sortDirection: t.sort_direction || 'desc',
  groupBy: t.group_by || '',
  exportFormat: t.export_format ? [t.export_format] : ['csv'],
  isFavorite: t.is_favorite || false,
  usageCount: t.usage_count || 0,
  createdAt: t.created_at,
  updatedAt: t.updated_at,
});

const getTemplates = async (req, res, next) => {
  try {
    const templates = await prisma.reportTemplate.findMany({
      where: { user_id: req.user.userId },
      orderBy: [{ is_favorite: 'desc' }, { created_at: 'desc' }]
    });
    res.json(templates.map(mapTemplate));
  } catch (err) { next(err); }
};

const createTemplate = async (req, res, next) => {
  try {
    const { name, description, reportType, selectedFields, filters, sortBy, sortDirection, groupBy, exportFormat } = req.body;
    const template = await prisma.reportTemplate.create({
      data: {
        user_id: req.user.userId,
        name,
        description: description || null,
        report_type: reportType || 'DC_LISTINGS',
        selected_fields: selectedFields || [],
        filters: filters || {},
        sort_by: sortBy || 'createdAt',
        sort_direction: sortDirection || 'desc',
        group_by: groupBy || null,
        export_format: Array.isArray(exportFormat) ? exportFormat[0] : (exportFormat || 'csv'),
      }
    });
    await logAction({ userId: req.user.userId, action: 'CREATE_REPORT_TEMPLATE', targetModel: 'ReportTemplate', targetId: template.id });
    res.status(201).json(mapTemplate(template));
  } catch (err) { next(err); }
};

const deleteTemplate = async (req, res, next) => {
  try {
    await prisma.reportTemplate.delete({ where: { id: req.params.id, user_id: req.user.userId } });
    await logAction({ userId: req.user.userId, action: 'DELETE_REPORT_TEMPLATE', targetModel: 'ReportTemplate', targetId: req.params.id });
    res.json({ message: 'Template deleted' });
  } catch (err) { next(err); }
};

// ======================= EXPORT: PDF & DOCX =======================

const truncateStr = (val, maxChars) => {
  const s = fmtDisplay(val);
  return s.length > maxChars ? s.slice(0, maxChars - 1) + '…' : s;
};

const toPdf = (data, fields, reportType) => {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const keys = fields?.length > 0
        ? fields
        : data.length > 0 ? Object.keys(data[0]).filter((k) => !['id', '_id'].includes(k)) : [];
      const labels = keys.map(getLabel);

      if (keys.length === 0) {
        doc.fontSize(11).text('No fields selected or no data available.');
        doc.end();
        return;
      }

      // Page metrics (landscape A4 = 841.89 x 595.28 pt)
      const PAGE_W = doc.page.width - 60;
      const PAGE_H = doc.page.height;
      const MAX_COLS = Math.min(keys.length, 15);
      const COL_W = PAGE_W / MAX_COLS;
      const HEADER_H = 20;
      const ROW_H = 16;
      const MAX_CHARS = Math.max(6, Math.floor(COL_W / 4.2));

      const visKeys = keys.slice(0, MAX_COLS);
      const visLabels = labels.slice(0, MAX_COLS);

      // Title block
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e293b')
        .text(`${reportType.replace(/_/g, ' ')} Report`, 30, 30, { width: PAGE_W, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#64748b')
        .text(`Generated: ${new Date().toLocaleString()}  ·  ${data.length} records  ·  ${keys.length} fields selected`, 30, 46, { width: PAGE_W, align: 'center' });
      if (keys.length > MAX_COLS) {
        doc.fontSize(7).fillColor('#dc2626')
          .text(`Showing first ${MAX_COLS} of ${keys.length} fields. Use CSV or XLSX for the full export.`, 30, 58, { width: PAGE_W, align: 'center' });
      }

      let y = keys.length > MAX_COLS ? 74 : 62;

      const drawHeader = () => {
        doc.rect(30, y, PAGE_W, HEADER_H).fill('#1d4ed8');
        doc.fillColor('white').fontSize(7).font('Helvetica-Bold');
        visLabels.forEach((lbl, i) => {
          doc.text(truncateStr(lbl, MAX_CHARS), 33 + i * COL_W, y + 6, { width: COL_W - 4, lineBreak: false });
        });
        return y + HEADER_H;
      };

      y = drawHeader();

      let rowIdx = 0;
      for (const row of data) {
        if (y + ROW_H > PAGE_H - 30) {
          doc.addPage();
          y = 30;
          y = drawHeader();
        }

        doc.rect(30, y, PAGE_W, ROW_H).fill(rowIdx % 2 === 0 ? '#f8fafc' : '#ffffff');
        doc.rect(30, y, PAGE_W, ROW_H).stroke('#e2e8f0');
        doc.fillColor('#334155').fontSize(6.5).font('Helvetica');
        visKeys.forEach((key, i) => {
          doc.text(truncateStr(row[key], MAX_CHARS), 33 + i * COL_W, y + 4, { width: COL_W - 4, lineBreak: false });
        });

        y += ROW_H;
        rowIdx++;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const toDocx = async (data, fields, reportType) => {
  const {
    Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
    WidthType, HeadingLevel, ShadingType, BorderStyle,
  } = require('docx');

  const keys = fields?.length > 0
    ? fields
    : data.length > 0 ? Object.keys(data[0]).filter((k) => !['id', '_id'].includes(k)) : [];
  const labels = keys.map(getLabel);

  const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  const fmtVal = (val) => fmtDisplay(val);

  const headerRow = new TableRow({
    tableHeader: true,
    children: labels.map((lbl) => new TableCell({
      shading: { type: ShadingType.SOLID, fill: '1D4ED8', color: 'auto' },
      borders,
      children: [new Paragraph({
        children: [new TextRun({ text: lbl, bold: true, color: 'FFFFFF', size: 18 })],
      })],
    })),
  });

  const dataRows = data.map((row, ri) => new TableRow({
    children: keys.map((key) => new TableCell({
      shading: ri % 2 === 0
        ? { type: ShadingType.SOLID, fill: 'F8FAFC', color: 'auto' }
        : undefined,
      borders,
      children: [new Paragraph({
        children: [new TextRun({ text: fmtVal(row[key]), size: 18 })],
      })],
    })),
  }));

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: `${reportType.replace(/_/g, ' ')} Report`, bold: true, size: 32 })],
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [new TextRun({
            text: `Generated: ${new Date().toLocaleString()}  ·  ${data.length} records  ·  ${keys.length} fields`,
            color: '64748B',
            size: 18,
          })],
        }),
        new Paragraph({ children: [new TextRun({ text: '' })] }),
        table,
      ],
    }],
  });

  return Packer.toBuffer(doc);
};

// ======================= GENERATE & PREVIEW =======================

const VALID_TYPES = ['DC_LISTINGS', 'GPU_CLUSTERS', 'SUPPLIERS', 'INVENTORY', 'ANALYTICS'];

// Roles that can see all data (no supplier_id filter applied)
const ADMIN_ROLES = ['admin', 'superadmin', 'viewer'];

const generateReport = async (req, res, next) => {
  try {
    const { reportType, selectedFields, filters, sortBy, sortDirection, exportFormat } = req.body;

    if (!VALID_TYPES.includes(reportType)) {
      return res.status(400).json({ error: `Invalid reportType: ${reportType}. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const where = buildFilter(filters, reportType);
    // Only apply supplier scoping for non-admin roles and non-supplier reports
    if (!ADMIN_ROLES.includes(req.user.role) && reportType !== 'SUPPLIERS' && reportType !== 'ANALYTICS') {
      where.supplier_id = req.user.userId;
    }

    let result;
    const opts = { sortBy, sortDirection };

    if (reportType === 'DC_LISTINGS') result = await fetchDcListings(where, opts);
    else if (reportType === 'GPU_CLUSTERS') result = await fetchGpuClusters(where, opts);
    else if (reportType === 'INVENTORY') result = await fetchInventory(where, opts);
    else if (reportType === 'SUPPLIERS') result = await fetchSuppliers(where, opts);
    else result = await fetchAnalytics();

    const data = result.data;

    let responseData;
    let contentType;
    let filename = `${reportType}-${Date.now()}`;

    if (exportFormat === 'json') {
      // Respect selectedFields + format all values for readability
      const jsonKeys = resolveKeys(data, selectedFields);
      const jsonData = data.map((row) => {
        const obj = {};
        jsonKeys.forEach((k) => {
          const val = row[k];
          const d = toDate(val);
          obj[getLabel(k)] = d ? fmtDateStr(d) : (Array.isArray(val) ? val.join('; ') : (val ?? null));
        });
        return obj;
      });
      responseData = JSON.stringify(jsonData, null, 2);
      contentType = 'application/json';
      filename += '.json';
    } else if (exportFormat === 'xlsx') {
      responseData = toXlsx(data, selectedFields);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename += '.xlsx';
    } else if (exportFormat === 'pdf') {
      responseData = await toPdf(data, selectedFields, reportType);
      contentType = 'application/pdf';
      filename += '.pdf';
    } else if (exportFormat === 'docx') {
      responseData = await toDocx(data, selectedFields, reportType);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename += '.docx';
    } else {
      // Default: CSV
      responseData = toCsv(data, selectedFields);
      contentType = 'text/csv';
      filename += '.csv';
    }

    await logAction({
      userId: req.user.userId,
      action: 'GENERATE_REPORT',
      targetModel: 'Report',
      changes: { reportType, rowCount: data.length, format: exportFormat || 'csv' }
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(responseData);
  } catch (err) {
    console.error('[Report] generateReport error:', err);
    next(err);
  }
};

const previewReport = async (req, res, next) => {
  try {
    const { reportType, selectedFields, filters, sortBy, sortDirection, page = 1, limit = 20 } = req.body;

    if (!VALID_TYPES.includes(reportType)) {
      return res.status(400).json({ error: `Invalid reportType: ${reportType}` });
    }

    const where = buildFilter(filters, reportType);
    if (!ADMIN_ROLES.includes(req.user.role) && reportType !== 'SUPPLIERS' && reportType !== 'ANALYTICS') {
      where.supplier_id = req.user.userId;
    }

    let result;
    const opts = { sortBy, sortDirection, page: parseInt(page), limit: parseInt(limit) };

    if (reportType === 'DC_LISTINGS') result = await fetchDcListings(where, opts);
    else if (reportType === 'GPU_CLUSTERS') result = await fetchGpuClusters(where, opts);
    else if (reportType === 'INVENTORY') result = await fetchInventory(where, opts);
    else if (reportType === 'SUPPLIERS') result = await fetchSuppliers(where, opts);
    else result = await fetchAnalytics();

    const fields = selectedFields && selectedFields.length > 0
      ? selectedFields
      : result.data.length > 0 ? Object.keys(result.data[0]) : [];

    res.json({
      preview: result.data,
      selectedFields: fields,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.total / parseInt(limit)),
      hasPrev: parseInt(page) > 1,
      hasNext: parseInt(page) < Math.ceil(result.total / parseInt(limit)),
    });
  } catch (err) {
    console.error('[Report] previewReport error:', err);
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { name, description, reportType, selectedFields, filters, sortBy, sortDirection, groupBy, exportFormat, isFavorite } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (reportType !== undefined) data.report_type = reportType;
    if (selectedFields !== undefined) data.selected_fields = selectedFields;
    if (filters !== undefined) data.filters = filters;
    if (sortBy !== undefined) data.sort_by = sortBy;
    if (sortDirection !== undefined) data.sort_direction = sortDirection;
    if (groupBy !== undefined) data.group_by = groupBy || null;
    if (exportFormat !== undefined) data.export_format = Array.isArray(exportFormat) ? exportFormat[0] : exportFormat;
    if (isFavorite !== undefined) data.is_favorite = isFavorite;
    const updated = await prisma.reportTemplate.update({
      where: { id: req.params.id, user_id: req.user.userId },
      data,
    });
    res.json(mapTemplate(updated));
  } catch (err) { next(err); }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateReport,
  previewReport,
};
