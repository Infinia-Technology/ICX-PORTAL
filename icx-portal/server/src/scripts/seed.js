/**
 * ICX Portal — Seed Script
 * Creates test users for all 8 roles + sample data.
 * Usage: node src/scripts/seed.js
 */

try { require('dotenv').config({ path: require('path').join(__dirname, '../../.env') }); } catch (_) {}
const mongoose = require('mongoose');

const User = require('../models/User');
const Organization = require('../models/Organization');
const DcApplication = require('../models/DcApplication');
const DcSite = require('../models/DcSite');
const GpuClusterListing = require('../models/GpuClusterListing');

// --- Dynamic role resolution (same logic as auth.controller.js) ---
const BROKER_VENDOR_TYPES = ['Broker', 'Advisor', 'Other Intermediary'];
function resolveRole(vendorType) {
  return BROKER_VENDOR_TYPES.includes(vendorType) ? 'broker' : 'supplier';
}
function resolveOrgType(vendorType) {
  return BROKER_VENDOR_TYPES.includes(vendorType) ? 'BROKER' : 'SUPPLIER';
}

// --- Configurable seed emails (override via env vars or CLI) ---
const SEED_EMAILS = {
  superadmin: process.env.SEED_SUPERADMIN_EMAIL || 'deepanshu.gupta@netgroup.ai',
  admin:      process.env.SEED_ADMIN_EMAIL      || 'Aastha.Pradhan@apeiro.digital',
  supplier:   process.env.SEED_SUPPLIER_EMAIL    || 'aastharani07@gmail.com',
  broker:     process.env.SEED_BROKER_EMAIL      || 'broker@test.com',
  customer:   process.env.SEED_CUSTOMER_EMAIL    || 'Support@iamsaif.ai',
  reader:     process.env.SEED_READER_EMAIL      || 'reader@test.com',
  viewer:     process.env.SEED_VIEWER_EMAIL      || 'viewer@test.com',
  subordinate:process.env.SEED_SUBORDINATE_EMAIL || 'subordinate@test.com',
  pending:    process.env.SEED_PENDING_EMAIL     || 'pending@test.com',
};

// --- Configurable vendor types (override to change role assignment) ---
const SEED_VENDOR_TYPES = {
  supplier: process.env.SEED_SUPPLIER_VENDOR_TYPE || 'Operator',
  broker:   process.env.SEED_BROKER_VENDOR_TYPE   || 'Broker',
  pending:  process.env.SEED_PENDING_VENDOR_TYPE  || 'Developer',
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/icx');
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    DcApplication.deleteMany({}),
    DcSite.deleteMany({}),
    GpuClusterListing.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Create orgs — roles derived dynamically from vendorType
  const supplierOrg = await Organization.create({
    type: resolveOrgType(SEED_VENDOR_TYPES.supplier), status: 'APPROVED',
    vendorType: SEED_VENDOR_TYPES.supplier, mandateStatus: 'Direct',
    ndaRequired: false, ndaSigned: false,
    contactEmail: SEED_EMAILS.supplier, contactNumber: '+971501234567',
  });

  const brokerOrg = await Organization.create({
    type: resolveOrgType(SEED_VENDOR_TYPES.broker), status: 'APPROVED',
    vendorType: SEED_VENDOR_TYPES.broker, mandateStatus: 'Non-exclusive',
    ndaRequired: true, ndaSigned: true,
    contactEmail: SEED_EMAILS.broker, contactNumber: '+971502345678',
  });

  const customerOrg = await Organization.create({
    type: 'CUSTOMER', status: 'APPROVED',
    companyName: 'Acme Data Corp', companyType: 'Enterprise',
    jurisdiction: 'UAE', industrySector: 'Technology',
    taxVatNumber: 'UAE123456789', companyAddress: 'Dubai, UAE',
    authSignatoryName: 'John Smith', authSignatoryTitle: 'CEO',
    billingContactName: 'Jane Smith', billingContactEmail: 'billing@acme.com',
    contactEmail: SEED_EMAILS.customer,
    primaryUseCases: ['AI/ML Training', 'HPC'],
  });

  const pendingSupplierOrg = await Organization.create({
    type: resolveOrgType(SEED_VENDOR_TYPES.pending), status: 'KYC_SUBMITTED',
    vendorType: SEED_VENDOR_TYPES.pending, mandateStatus: 'Exclusive',
    ndaRequired: false, ndaSigned: false,
    contactEmail: SEED_EMAILS.pending,
  });

  // Create users — supplier/broker roles derived from org vendorType
  const users = await User.insertMany([
    { email: SEED_EMAILS.superadmin, role: 'superadmin' },
    { email: SEED_EMAILS.admin, role: 'admin' },
    { email: SEED_EMAILS.supplier, role: resolveRole(supplierOrg.vendorType), organizationId: supplierOrg._id },
    { email: SEED_EMAILS.broker, role: resolveRole(brokerOrg.vendorType), organizationId: brokerOrg._id },
    { email: SEED_EMAILS.customer, role: 'customer', organizationId: customerOrg._id },
    { email: SEED_EMAILS.reader, role: 'reader' },
    { email: SEED_EMAILS.viewer, role: 'viewer' },
    { email: SEED_EMAILS.subordinate, role: 'subordinate', organizationId: supplierOrg._id },
    { email: SEED_EMAILS.pending, role: resolveRole(pendingSupplierOrg.vendorType), organizationId: pendingSupplierOrg._id },


  ]);
  console.log(`Created ${users.length} users`);

  // Sample DC Application (approved)
  const dcApp = await DcApplication.create({
    organizationId: supplierOrg._id,
    status: 'APPROVED',
    companyLegalEntity: 'Desert Cloud FZ LLC',
    companyOfficeAddress: 'Dubai Internet City, Dubai, UAE',
    companyCountry: 'UAE',
    contactName: 'Ahmed Al-Rashid',
    contactEmail: 'ahmed@desertcloud.ae',
    contactMobile: '+971501234567',
    submittedAt: new Date(),
    reviewedAt: new Date(),
  });

  const dcSite = await DcSite.create({
    dcApplicationId: dcApp._id,
    siteName: 'Desert Cloud DC-1',
    projectType: 'Greenfield',
    currentProjectStatus: 'Live',
    businessModel: 'Colocation (Wholesale/Retail)',
    sovereigntyRestrictions: 'None',
    address: 'Al Quoz Industrial Area 1, Dubai',
    stateRegion: 'Dubai',
    country: 'UAE',
    totalItLoadMw: 20,
    totalUtilityMva: 30,
    totalWhiteSpaceSqm: 5000,
    dcTiering: 'Tier III',
    dcTieringCertified: true,
    iso27001: true,
    designPue: 1.4,
    powerSource: 'Grid',
    powerRedundancy: '2N',
    carrierNeutral: true,
    storageRentUsd: 150,
    avgPowerPriceCents: 8.5,
  });

  // Sample GPU Clusters (approved) — based on PRD GPU Cluster Inventory questionnaire
  const gpuClusters = await GpuClusterListing.insertMany([
    {
      organizationId: supplierOrg._id,
      status: 'APPROVED',
      vendorName: 'Desert Cloud GPU',
      location: 'Dubai Internet City',
      country: 'UAE',
      gpuTechnology: 'NVIDIA H100 SXM5',
      googleMapsLink: 'https://maps.google.com/?q=Dubai+Internet+City',
      totalGpuCount: 256,
      singleClusterSize: 64,
      availabilityDate: new Date('2025-06-01'),
      notes: 'Tier III data center, 24/7 support, low-latency connectivity to major internet exchanges.',
      gpuServerModel: 'NVIDIA DGX H100',
      gpu: 'NVIDIA H100 80GB SXM5',
      cpu: 'AMD EPYC 9004',
      ram: '2TB DDR5 per node',
      localStorage: '30TB NVMe per node',
      nics: '8x ConnectX-7 400GbE',
      computeNetTopology: 'Fat Tree',
      computeNetTechnology: 'InfiniBand HDR 200Gbps',
      computeNetSwitchVendor: 'NVIDIA Spectrum-X',
      computeNetOversubscription: '1:1 (non-blocking)',
      clusterDescription: 'Enterprise-grade H100 GPU cluster in Dubai with full InfiniBand interconnect, ideal for large-scale AI/ML training workloads.',
      submittedAt: new Date(),
      reviewedAt: new Date(),
    },
    {
      organizationId: supplierOrg._id,
      status: 'APPROVED',
      vendorName: 'Northern Data',
      location: 'Amsterdam',
      country: 'Netherlands',
      gpuTechnology: 'NV B300',
      googleMapsLink: 'https://maps.google.com/?q=Amsterdam',
      totalGpuCount: 512,
      singleClusterSize: 128,
      availabilityDate: new Date('2025-09-01'),
      notes: 'Minimum 12-month commitment. Direct peering with AMS-IX.',
      restrictedUse: 'No US export-controlled workloads',
      gpuServerModel: 'NVIDIA DGX B200',
      gpu: 'NVIDIA B300 80GB HBM3e',
      cpu: 'AMD EPYC 9004',
      ram: '2TB DDR5 per node',
      localStorage: '8x 3.84TB NVMe SSD per node',
      nics: '8x ConnectX-7 400GbE',
      computeNetTopology: 'Rail Optimized',
      computeNetTechnology: 'InfiniBand NDR',
      computeNetSwitchVendor: 'NVIDIA Spectrum-X',
      computeNetOversubscription: '1:1 (non-blocking)',
      mgmtNetTopology: 'Fat Tree',
      mgmtNetTechnology: 'Ethernet 400G',
      oobNetTechnology: 'Ethernet 1G',
      storageOptions: 'WEKA: 1PB parallel filesystem, 200GB/s aggregate throughput',
      connectivityDetails: '4x 100Gbps uplinks, dual redundant paths, AMS-IX peering',
      clusterDescription: 'Next-generation B300 cluster optimized for LLM training with rail-optimized InfiniBand topology. Full liquid cooling deployment.',
      powerSupplyStatus: 'Active',
      rackPowerCapacityKw: 50,
      totalPowerCapacityMw: 5,
      coolingDesign: 'Direct Liquid Cooling (DLC)',
      submittedAt: new Date(),
      reviewedAt: new Date(),
    },
    {
      organizationId: supplierOrg._id,
      status: 'APPROVED',
      vendorName: 'Gulf Compute',
      location: 'Riyadh',
      country: 'Saudi Arabia',
      gpuTechnology: 'NV GB300 NVL72',
      googleMapsLink: 'https://maps.google.com/?q=Riyadh',
      totalGpuCount: 1152,
      singleClusterSize: 72,
      availabilityDate: new Date('2025-12-01'),
      notes: 'Sovereign cloud compliant. Minimum 24-month commitment.',
      restrictedUse: 'Sovereign data residency — KSA only',
      gpuServerModel: 'NVIDIA GB300 NVL72 Rack',
      gpu: 'NVIDIA GB300 NVL72',
      cpu: 'Grace CPU (ARM)',
      ram: '960GB HBM3e per GPU',
      localStorage: '16x 7.68TB NVMe SSD per rack',
      nics: '16x ConnectX-8 800GbE',
      computeNetTopology: 'Fat Tree',
      computeNetTechnology: 'InfiniBand XDR',
      computeNetSwitchVendor: 'NVIDIA Quantum-X800',
      computeNetLayers: '3-tier spine-leaf',
      computeNetOversubscription: '1:1 (non-blocking)',
      mgmtNetTopology: 'Fat Tree',
      mgmtNetTechnology: 'Ethernet 800G',
      mgmtNetLayers: 2,
      oobNetTechnology: 'Ethernet 1G',
      storageOptions: 'VAST Data: 5PB NVMe all-flash, 500GB/s throughput',
      connectivityDetails: '8x 400Gbps uplinks, dual diverse fiber paths, Jeddah IX peering',
      clusterDescription: 'Flagship NVL72 rack-scale cluster for frontier model training. Full NVLink domain with 1.8TB/s bisection bandwidth. Sovereign cloud certified for KSA government workloads.',
      powerSupplyStatus: 'Active',
      rackPowerCapacityKw: 120,
      modularDataHalls: 4,
      totalPowerCapacityMw: 20,
      dualFeedPower: 'Yes — 2N redundant',
      upsConfiguration: 'Distributed UPS, 15-minute autonomy',
      backupGenerators: '4x 2.5MW diesel generators',
      coolingDesign: 'Direct Liquid Cooling (DLC) + rear-door heat exchangers',
      coolingCapacity: '25MW cooling capacity',
      submittedAt: new Date(),
      reviewedAt: new Date(),
    },
    {
      organizationId: supplierOrg._id,
      status: 'APPROVED',
      vendorName: 'EuroCloud HPC',
      location: 'Frankfurt',
      country: 'Germany',
      gpuTechnology: 'NVIDIA H200',
      googleMapsLink: 'https://maps.google.com/?q=Frankfurt',
      totalGpuCount: 384,
      singleClusterSize: 96,
      availabilityDate: new Date('2025-07-15'),
      notes: 'GDPR compliant. Minimum 6-month commitment. Flexible scaling available.',
      gpuServerModel: 'SuperMicro custom',
      gpu: 'NVIDIA H200 141GB HBM3e',
      cpu: 'Intel Xeon Sapphire Rapids',
      ram: '1TB DDR5 per node',
      localStorage: '4x 7.68TB NVMe SSD per node',
      nics: '4x ConnectX-7 400GbE',
      computeNetTopology: 'Rail Optimized',
      computeNetTechnology: 'InfiniBand NDR 400Gbps',
      computeNetSwitchVendor: 'NVIDIA Quantum-2',
      computeNetOversubscription: '2:1',
      mgmtNetTechnology: 'Ethernet 100G',
      storageOptions: 'DDN Lustre: 2PB, 300GB/s throughput',
      connectivityDetails: '2x 100Gbps uplinks, DE-CIX peering, <1ms to Frankfurt IX',
      clusterDescription: 'H200 inference and fine-tuning cluster in Frankfurt. GDPR compliant with dedicated security zone. Ideal for European enterprise AI deployments.',
      coolingDesign: 'Hybrid — air-cooled with liquid-cooling ready',
      submittedAt: new Date(),
      reviewedAt: new Date(),
    },
    {
      organizationId: supplierOrg._id,
      status: 'APPROVED',
      vendorName: 'Asia Pacific Compute',
      location: 'Singapore',
      country: 'Singapore',
      gpuTechnology: 'NVIDIA A100',
      googleMapsLink: 'https://maps.google.com/?q=Singapore',
      totalGpuCount: 512,
      singleClusterSize: 32,
      availabilityDate: new Date('2025-03-01'),
      notes: 'Available now. Short-term contracts accepted (minimum 3 months).',
      gpuServerModel: 'NVIDIA DGX A100',
      gpu: 'NVIDIA A100 80GB SXM4',
      cpu: 'AMD EPYC 7742',
      ram: '1TB DDR4 per node',
      localStorage: '15TB NVMe per node',
      nics: '8x ConnectX-6 200GbE',
      computeNetTopology: 'Fat Tree',
      computeNetTechnology: 'InfiniBand HDR 200Gbps',
      computeNetSwitchVendor: 'NVIDIA Quantum',
      computeNetOversubscription: '1:1 (non-blocking)',
      storageOptions: 'NetApp ONTAP: 500TB NVMe-oF, 100GB/s',
      connectivityDetails: '4x 100Gbps, Equinix SG1 cross-connects, SGIX peering',
      clusterDescription: 'Production-ready A100 cluster for inference and training. Available immediately with flexible short-term commitments. Low-latency access to APAC markets.',
      submittedAt: new Date(),
      reviewedAt: new Date(),
    },
  ]);

  console.log(`Created sample DC Application, Site, and ${gpuClusters.length} GPU Clusters`);

  console.log('\n=== SEED COMPLETE ===');
  console.log('\nTest user credentials (use OTP login — any 6-digit code works in dev):');
  users.forEach((u) => console.log(`  ${u.email} — ${u.role}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
