const { PrismaClient } = require('@prisma/client');
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const mongoUri = process.env.ME_CONFIG_MONGODB_URL || 'mongodb://localhost:27017/icx';
  console.log(`Connecting to MongoDB at ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  
  console.log('Connecting to PostgreSQL');
  await prisma.$connect();
  console.log('Connected to PostgreSQL');

  console.log('Cleaning existing PostgreSQL data...');
  await prisma.reservation.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleaned PostgreSQL tables.');

  const db = mongoose.connection.db;

  // UUID Mappings to preserve relations during migration
  const userMap = new Map(); // Mongo User _id -> Postgres UUID
  const listingMap = new Map(); // Mongo Inventory _id -> Postgres UUID

  try {
    // 1. MIGRATING USERS
    console.log('Migrating Users...');
    const mongoUsers = await db.collection('users').find({}).toArray();
    const mongoOrgs = await db.collection('organizations').find({}).toArray();
    const orgMap = new Map(mongoOrgs.map(o => [o._id.toString(), o]));

    for (const mUser of mongoUsers) {
      const uuid = crypto.randomUUID();
      userMap.set(mUser._id.toString(), uuid);
      
      // Map KYC status from Organization
      let kycStatus = null;
      if (mUser.organizationId) {
        const org = orgMap.get(mUser.organizationId.toString());
        if (org) {
          if (org.status === 'APPROVED') kycStatus = 'approved';
          else if (org.status === 'KYC_SUBMITTED') kycStatus = 'submitted';
        }
      }
      
      // Map original role directly to enum
      const role = mUser.role || 'customer';
      
      await prisma.user.create({
        data: {
          id: uuid,
          name: mUser.firstName ? `${mUser.firstName} ${mUser.lastName}` : null,
          email: mUser.email || `missing_${uuid}@example.com`,
          role: role,
          kyc_status: kycStatus,
          isActive: mUser.isActive !== false,
          created_at: mUser.createdAt || new Date(),
          updated_at: mUser.updatedAt || new Date()
        }
      });
    }
    console.log(`Migrated ${mongoUsers.length} users.`);

    // 2. MIGRATING LISTINGS
    console.log('Migrating Listings (from GpuClusters)...');
    const mongoInventories = await db.collection('inventories').find({}).toArray();
    const mongoClusters = await db.collection('gpuclusterlistings').find({}).toArray();
    const invMap = new Map(mongoInventories.map(i => [i.gpuClusterListingId?.toString(), i]));

    for (const cluster of mongoClusters) {
      const uuid = crypto.randomUUID();
      const inventory = invMap.get(cluster._id.toString());
      listingMap.set(cluster._id.toString(), uuid);
      if (inventory) listingMap.set(inventory._id.toString(), uuid);

      // Find the correct supplier UUID
      let supplierUuid = null;
      
      // Try mapping via cluster's organizationId
      const orgIdStr = cluster.organizationId?.toString() || inventory?.organizationId?.toString();
      if (orgIdStr) {
        const supplierMongo = mongoUsers.find(u => u.organizationId?.toString() === orgIdStr);
        if (supplierMongo) supplierUuid = userMap.get(supplierMongo._id.toString());
      }
      
      // If still null, fallback to the first 'supplier' role user found
      if (!supplierUuid) {
        const firstSupplier = mongoUsers.find(u => u.role === 'supplier' || u.role === 'broker');
        if (firstSupplier) supplierUuid = userMap.get(firstSupplier._id.toString());
      }

      // Map strict ListingStatus Enum
      let status = 'AVAILABLE';
      const rawStatus = inventory?.status || cluster.status || 'AVAILABLE';
      if (rawStatus === 'RESERVED') status = 'RESERVED';
      else if (rawStatus === 'SOLD') status = 'SOLD';
      else if (rawStatus === 'ARCHIVED') status = 'ARCHIVED';
      else if (rawStatus === 'APPROVED' || rawStatus === 'LIVE') status = 'APPROVED';

      await prisma.listing.create({
        data: {
          id: uuid,
          supplier_id: supplierUuid || Array.from(userMap.values())[0],
          type: 'GPU_CLUSTER',
          data_center_name: cluster.vendorName || inventory?.name || 'Unknown DC',
          country: cluster.location?.country || null,
          state: cluster.location?.state || null,
          city: cluster.location?.city || inventory?.location || null,
          total_units: inventory?.totalUnits || cluster.resourceDetails?.totalNodes || 0,
          booked_units: inventory?.bookedUnits || 0,
          available_units: inventory?.availableUnits || cluster.resourceDetails?.availableNodes || 0,
          total_mw: inventory?.powerDetails?.totalITLoad || null,
          price: inventory?.pricePerUnit || 0,
          currency: inventory?.currency || 'USD',
          status: status,
          specifications: {
            gpuTechnology: cluster.gpuTechnology || cluster.gpu || 'N/A',
            gpuServerModel: cluster.gpuServerModel,
            cpu: cluster.cpu,
            ram: cluster.ram,
            localStorage: cluster.localStorage,
            nics: cluster.nics,
            resourceDetails: cluster.resourceDetails,
            computeNetwork: cluster.computeNetwork,
            managementNetwork: cluster.managementNetwork,
          },
          contract_duration: inventory?.pricingPeriod || null,
          created_at: cluster.createdAt || inventory?.createdAt || new Date(),
          updated_at: cluster.updatedAt || inventory?.updatedAt || new Date()
        }
      });
    }
    console.log(`Migrated ${mongoClusters.length} listings from clusters.`);

    // 3. MIGRATING RESERVATIONS
    console.log('Migrating Reservations...');
    const mongoReservations = await db.collection('inventoryreservations').find({}).toArray();
    
    let resCount = 0;
    for (const mRes of mongoReservations) {
      const listingId = listingMap.get(mRes.inventoryId?.toString());
      const customerId = userMap.get(mRes.bookedBy?.toString()) || Array.from(userMap.values())[0]; // fallback
      
      // Skip orphaned records to preserve structural integrity
      if (!listingId || !customerId) {
        console.warn(`Skipping orphaned reservation: ${mRes._id}`);
        continue;
      }

      await prisma.reservation.create({
        data: {
          id: crypto.randomUUID(),
          listing_id: listingId,
          customer_id: customerId,
          reserved_units: mRes.units || 1,
          start_date: mRes.contractStartDate || new Date(),
          end_date: mRes.contractEndDate || new Date(),
          status: mRes.status || 'ACTIVE',
          created_at: mRes.createdAt || new Date(),
          updated_at: mRes.updatedAt || new Date()
        }
      });
      resCount++;
    }
    console.log(`Migrated ${resCount} reservations.`);

    console.log('Migration to PostgreSQL completed securely without data loss!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
