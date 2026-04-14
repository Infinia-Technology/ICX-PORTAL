/**
 * ICX Portal — Seed Script
 * Creates test users for all 8 roles + sample data.
 * Usage: node src/scripts/seed.js
 */

try { require('dotenv').config({ path: require('path').join(__dirname, '../../.env') }); } catch (_) {}
const prisma = require('../config/prisma');

// --- Dynamic role resolution ---
const BROKER_VENDOR_TYPES = ['Broker', 'Advisor', 'Other Intermediary'];
function resolveRole(vendorType) {
  return BROKER_VENDOR_TYPES.includes(vendorType) ? 'broker' : 'supplier';
}
function resolveOrgType(vendorType) {
  return BROKER_VENDOR_TYPES.includes(vendorType) ? 'BROKER' : 'SUPPLIER';
}

// --- Configurable seed emails ---
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

// --- Configurable vendor types ---
const SEED_VENDOR_TYPES = {
  supplier: process.env.SEED_SUPPLIER_VENDOR_TYPE || 'Operator',
  broker:   process.env.SEED_BROKER_VENDOR_TYPE   || 'Broker',
  pending:  process.env.SEED_PENDING_VENDOR_TYPE  || 'Developer',
};

async function seed() {
  console.log('Starting seed process...');

  // Clear existing data (order matters for foreign keys)
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.otp.deleteMany({});
  await prisma.dcDocument.deleteMany({});
  await prisma.dcPhasingSchedule.deleteMany({});
  await prisma.dcSite.deleteMany({});
  await prisma.queueItem.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.inquiry.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.teamInvite.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  
  console.log('Cleared existing data');

  // 1. Create Organizations
  const supplierOrg = await prisma.organization.create({
    data: {
      type: resolveOrgType(SEED_VENDOR_TYPES.supplier),
      status: 'APPROVED',
      vendor_type: SEED_VENDOR_TYPES.supplier,
      mandate_status: 'Direct',
      nda_required: false,
      nda_signed: false,
      contact_email: SEED_EMAILS.supplier,
      contact_number: '+971501234567',
    }
  });

  const brokerOrg = await prisma.organization.create({
    data: {
      type: resolveOrgType(SEED_VENDOR_TYPES.broker),
      status: 'APPROVED',
      vendor_type: SEED_VENDOR_TYPES.broker,
      mandate_status: 'Non-exclusive',
      nda_required: true,
      nda_signed: true,
      contact_email: SEED_EMAILS.broker,
      contact_number: '+971502345678',
    }
  });

  const customerOrg = await prisma.organization.create({
    data: {
      type: 'CUSTOMER',
      status: 'APPROVED',
      company_name: 'Acme Data Corp',
      company_type: 'Enterprise',
      jurisdiction: 'UAE',
      industry_sector: 'Technology',
      tax_vat_number: 'UAE123456789',
      company_address: 'Dubai, UAE',
      auth_signatory_name: 'John Smith',
      auth_signatory_title: 'CEO',
      billing_contact_name: 'Jane Smith',
      billing_contact_email: 'billing@acme.com',
      contact_email: SEED_EMAILS.customer,
      primary_use_cases: ['AI/ML Training', 'HPC'],
    }
  });

  const pendingSupplierOrg = await prisma.organization.create({
    data: {
      type: resolveOrgType(SEED_VENDOR_TYPES.pending),
      status: 'SUBMITTED',
      vendor_type: SEED_VENDOR_TYPES.pending,
      mandate_status: 'Exclusive',
      nda_required: false,
      nda_signed: false,
      contact_email: SEED_EMAILS.pending,
    }
  });

  // 2. Create Users
  const userList = [
    { email: SEED_EMAILS.superadmin, role: 'superadmin' },
    { email: SEED_EMAILS.admin, role: 'admin' },
    { email: SEED_EMAILS.supplier, role: resolveRole(SEED_VENDOR_TYPES.supplier), organization_id: supplierOrg.id, name: 'Main Supplier' },
    { email: SEED_EMAILS.broker, role: resolveRole(SEED_VENDOR_TYPES.broker), organization_id: brokerOrg.id, name: 'Main Broker' },
    { email: SEED_EMAILS.customer, role: 'customer', organization_id: customerOrg.id, name: 'Main Customer' },
    { email: SEED_EMAILS.reader, role: 'reader', name: 'Standard Reader' },
    { email: SEED_EMAILS.viewer, role: 'viewer', name: 'Standard Viewer' },
    { email: SEED_EMAILS.subordinate, role: 'subordinate', organization_id: supplierOrg.id, name: 'Team Member' },
    { email: SEED_EMAILS.pending, role: resolveRole(SEED_VENDOR_TYPES.pending), organization_id: pendingSupplierOrg.id, name: 'Pending Supplier' },
  ];

  const users = {};
  for (const u of userList) {
    users[u.email] = await prisma.user.create({ data: u });
  }

  console.log(`Created ${Object.keys(users).length} users`);

  // 3. Create Sample DC Listing (Approved)
  const dcListing = await prisma.listing.create({
    data: {
      organization_id: supplierOrg.id,
      supplier_id: users[SEED_EMAILS.supplier].id,
      type: 'DC_SITE',
      status: 'APPROVED',
      data_center_name: 'Desert Cloud DC-1',
      country: 'UAE',
      state: 'Dubai',
      city: 'Al Quoz',
      total_units: 100,
      total_mw: 20,
      available_mw: 15,
      price: 150,
      specifications: {
        projectType: 'Greenfield',
        currentProjectStatus: 'Live',
        businessModel: 'Colocation (Wholesale/Retail)',
        sovereigntyRestrictions: 'None',
        dcTiering: 'Tier III',
        dcTieringCertified: true,
        iso27001: true,
        designPue: 1.4,
        powerSource: 'Grid',
        powerRedundancy: '2N',
        carrierNeutral: true,
      }
    }
  });

  const dcSite = await prisma.dcSite.create({
    data: {
      listing_id: dcListing.id,
      site_name: 'Desert Cloud DC-1 Main Site',
      specifications: {
        totalWhiteSpaceSqm: 5000,
        rackPowerCapacityKw: 15,
      }
    }
  });

  // 4. Create Sample GPU Listings (Approved)
  const gpuListings = [
    {
      organization_id: supplierOrg.id,
      supplier_id: users[SEED_EMAILS.supplier].id,
      status: 'APPROVED',
      type: 'GPU_CLUSTER',
      data_center_name: 'Desert Cloud GPU Hub',
      country: 'UAE',
      state: 'Dubai',
      city: 'Internet City',
      total_units: 256,
      available_units: 128,
      price: 2.5,
      specifications: {
        gpuTechnology: 'NVIDIA H100 SXM5',
        totalGpuCount: 256,
        singleClusterSize: 64,
        gpuServerModel: 'NVIDIA DGX H100',
        gpu: 'NVIDIA H100 80GB SXM5',
        cpu: 'AMD EPYC 9004',
        ram: '2TB DDR5 per node',
        nics: '8x ConnectX-7 400GbE',
        computeNetTechnology: 'InfiniBand NDR 400Gbps',
        clusterDescription: 'Enterprise-grade H100 GPU cluster path in Dubai.',
      }
    },
    {
      organization_id: supplierOrg.id,
      supplier_id: users[SEED_EMAILS.supplier].id,
      status: 'APPROVED',
      type: 'GPU_CLUSTER',
      data_center_name: 'EuroCloud HPC Center',
      country: 'Germany',
      state: 'Hesse',
      city: 'Frankfurt',
      total_units: 512,
      available_units: 256,
      price: 3.2,
      specifications: {
        gpuTechnology: 'NVIDIA B300',
        totalGpuCount: 512,
        singleClusterSize: 128,
        gpuServerModel: 'NVIDIA DGX B200',
        gpu: 'NVIDIA B300 80GB HBM3e',
        cpu: 'AMD EPYC 9004',
        coolingDesign: 'Direct Liquid Cooling (DLC)',
        clusterDescription: 'Next-generation B300 cluster optimized for LLM training.',
      }
    }
  ];

  for (const g of gpuListings) {
    await prisma.listing.create({ data: g });
  }

  console.log(`Created sample DC Listing, Site, and ${gpuListings.length} GPU Clusters`);

  console.log('\n=== SEED COMPLETE ===');
  console.log('\nTest user credentials (use OTP login — any 6-digit code works in dev):');
  Object.values(users).forEach((u) => console.log(`  ${u.email} — ${u.role}`));

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
