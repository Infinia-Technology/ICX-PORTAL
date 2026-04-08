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

  // Create orgs
  const supplierOrg = await Organization.create({
    type: 'SUPPLIER', status: 'APPROVED',
    vendorType: 'Operator', mandateStatus: 'Direct',
    ndaRequired: false, ndaSigned: false,
    contactEmail: 'supplier@test.com', contactNumber: '+971501234567',
  });

  const brokerOrg = await Organization.create({
    type: 'BROKER', status: 'APPROVED',
    vendorType: 'Broker', mandateStatus: 'Non-exclusive',
    ndaRequired: true, ndaSigned: true,
    contactEmail: 'broker@test.com', contactNumber: '+971502345678',
  });

  const customerOrg = await Organization.create({
    type: 'CUSTOMER', status: 'APPROVED',
    companyName: 'Acme Data Corp', companyType: 'Enterprise',
    jurisdiction: 'UAE', industrySector: 'Technology',
    taxVatNumber: 'UAE123456789', companyAddress: 'Dubai, UAE',
    authSignatoryName: 'John Smith', authSignatoryTitle: 'CEO',
    billingContactName: 'Jane Smith', billingContactEmail: 'billing@acme.com',
    contactEmail: 'Support@iamsaif.ai',
    primaryUseCases: ['AI/ML Training', 'HPC'],
  });

  const pendingSupplierOrg = await Organization.create({
    type: 'SUPPLIER', status: 'KYC_SUBMITTED',
    vendorType: 'Developer', mandateStatus: 'Exclusive',
    ndaRequired: false, ndaSigned: false,
    contactEmail: 'pending@test.com',
  });

  // Create users
  const users = await User.insertMany([
    { email: 'deepanshu.gupta@netgroup.ai', role: 'superadmin' },
    { email: 'Aastha.Pradhan@apeiro.digital', role: 'admin' },
    { email: 'supplier@test.com', role: 'supplier', organizationId: supplierOrg._id },
    { email: 'broker@test.com', role: 'broker', organizationId: brokerOrg._id },
    { email: 'Support@iamsaif.ai', role: 'customer', organizationId: customerOrg._id },
    { email: 'reader@test.com', role: 'reader' },
    { email: 'viewer@test.com', role: 'viewer' },
    { email: 'subordinate@test.com', role: 'subordinate', organizationId: supplierOrg._id },
    { email: 'pending@test.com', role: 'supplier', organizationId: pendingSupplierOrg._id },
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
  console.log('  deepanshu.gupta@netgroup.ai  — Superadmin');
  console.log('  Aastha.Pradhan@apeiro.digital — Admin');
  console.log('  supplier@test.com    — Approved Supplier');
  console.log('  broker@test.com      — Approved Broker');
  console.log('  Support@iamsaif.ai    — Approved Customer');
  console.log('  reader@test.com      — Reader');
  console.log('  viewer@test.com      — Viewer');
  console.log('  subordinate@test.com — Subordinate (under supplier)');
  console.log('  pending@test.com     — Pending Supplier (KYC submitted)');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
