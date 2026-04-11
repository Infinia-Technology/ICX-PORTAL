const Archive = require('../models/Archive');
const DcApplication = require('../models/DcApplication');
const GpuClusterListing = require('../models/GpuClusterListing');
const { logAction } = require('./audit.service');

// Archive a listing
const archiveListing = async ({
  targetModel, targetId, organizationId, archivedBy, reason, reasonText,
}) => {
  const modelMap = {
    DcApplication,
    GpuClusterListing,
  };

  const Model = modelMap[targetModel];
  if (!Model) throw new Error(`Invalid target model: ${targetModel}`);

  // Create archive record
  const archive = new Archive({
    targetModel,
    targetId,
    organizationId,
    archivedBy,
    reason,
    reasonText,
  });
  await archive.save();

  // Update listing
  await Model.findByIdAndUpdate(targetId, {
    isArchived: true,
    archivedAt: new Date(),
    archivedBy,
    archivedReason: reason,
  });

  return archive;
};

// Restore a listing (unarchive)
const restoreListing = async ({ targetModel, targetId, restoredBy }) => {
  const modelMap = {
    DcApplication,
    GpuClusterListing,
  };

  const Model = modelMap[targetModel];
  if (!Model) throw new Error(`Invalid target model: ${targetModel}`);

  // Update archive record
  const archive = await Archive.findOneAndUpdate(
    { targetModel, targetId, isActive: true },
    { isActive: false, restoredAt: new Date(), restoredBy },
    { new: true },
  );

  if (!archive) throw new Error('Active archive record not found');

  // Update listing
  await Model.findByIdAndUpdate(targetId, {
    isArchived: false,
    archivedAt: null,
    archivedBy: null,
    archivedReason: null,
    lastActivityAt: new Date(),
  });

  return archive;
};

// Auto-archive inactive listings (3 months with no updates)
const autoArchiveInactive = async () => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const inactiveListings = await Promise.all([
    DcApplication.find({
      isArchived: false,
      updatedAt: { $lt: threeMonthsAgo },
      status: 'APPROVED',
    }),
    GpuClusterListing.find({
      isArchived: false,
      updatedAt: { $lt: threeMonthsAgo },
      status: 'APPROVED',
    }),
  ]);

  const results = { archived: 0, failed: 0 };

  // Archive DcApplications
  for (const listing of inactiveListings[0]) {
    try {
      await archiveListing({
        targetModel: 'DcApplication',
        targetId: listing._id,
        organizationId: listing.organizationId,
        archivedBy: null, // System
        reason: 'INACTIVITY',
        reasonText: 'Auto-archived due to 3 months of inactivity',
      });
      results.archived += 1;
    } catch (err) {
      results.failed += 1;
      console.error(`Failed to auto-archive DcApplication ${listing._id}:`, err);
    }
  }

  // Archive GpuClusterListings
  for (const listing of inactiveListings[1]) {
    try {
      await archiveListing({
        targetModel: 'GpuClusterListing',
        targetId: listing._id,
        organizationId: listing.organizationId,
        archivedBy: null, // System
        reason: 'INACTIVITY',
        reasonText: 'Auto-archived due to 3 months of inactivity',
      });
      results.archived += 1;
    } catch (err) {
      results.failed += 1;
      console.error(`Failed to auto-archive GpuClusterListing ${listing._id}:`, err);
    }
  }

  return results;
};

// Get archive history for a listing
const getArchiveHistory = async (targetModel, targetId) => {
  return Archive.find({ targetModel, targetId })
    .populate('archivedBy', 'email')
    .populate('restoredBy', 'email')
    .sort('-archivedAt');
};

module.exports = {
  archiveListing,
  restoreListing,
  autoArchiveInactive,
  getArchiveHistory,
};
