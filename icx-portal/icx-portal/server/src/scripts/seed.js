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

  // Sample GPU Cluster (approved)
  const gpuCluster = await GpuClusterListing.create({
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
    localStorage: '30TB NVMe per node',
    computeNetTechnology: 'InfiniBand HDR 200Gbps',
    submittedAt: new Date(),
    reviewedAt: new Date(),
  });

  console.log('Created sample DC Application, Site, and GPU Cluster');

  console.log('\n=== SEED COMPLETE ===');
  console.log('\nTest user credentials (use OTP login — any 6-digit code works in dev):');
  users.forEach((u) => console.log(`  ${u.email} — ${u.role}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
