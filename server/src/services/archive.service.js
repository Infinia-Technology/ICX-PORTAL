const prisma = require('../config/prisma');
const { logAction } = require('./audit.service');

// Archive a listing
const archiveListing = async ({
  targetModel, targetId, organizationId, archivedBy, reason, reasonText,
}) => {
  // Since DC and GPU are now both in the 'listing' table in Prisma:
  const targetType = 'Listing'; 

  // Atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create archive record
    const archive = await tx.archive.create({
      data: {
        target_model: targetType,
        target_id: targetId,
        organization_id: organizationId,
        archived_by: archivedBy,
        reason,
        reason_text: reasonText,
        isActive: true
      }
    });

    // Update listing
    await tx.listing.update({
      where: { id: targetId },
      data: {
        status: 'ARCHIVED',
        archived_at: new Date(),
        archive_reason: reason
      }
    });

    return archive;
  });

  return result;
};

// Restore a listing (unarchive)
const restoreListing = async ({ targetId, restoredBy }) => {
  // Atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update archive record
    const archive = await tx.archive.findFirst({
      where: { target_id: targetId, isActive: true },
      orderBy: { archived_at: 'desc' }
    });

    if (!archive) throw new Error('Active archive record not found');

    const updatedArchive = await tx.archive.update({
      where: { id: archive.id },
      data: { 
        isActive: false, 
        restored_at: new Date(), 
        restored_by: restoredBy 
      }
    });

    // Update listing back to DRAFT or APPROVED? 
    // Legacy restored it but didn't explicitly set a status other than unarchiving.
    // We'll set it to DRAFT for safety unless specific logic dictates otherwise.
    await tx.listing.update({
      where: { id: targetId },
      data: {
        status: 'DRAFT',
        archived_at: null,
        archive_reason: null
      }
    });

    return updatedArchive;
  });

  return result;
};

// Auto-archive inactive listings (3 months with no updates)
const autoArchiveInactive = async () => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const inactiveListings = await prisma.listing.findMany({
    where: {
      archived_at: null,
      updated_at: { lt: threeMonthsAgo },
      status: { in: ['APPROVED', 'SUBMITTED', 'IN_REVIEW', 'RESUBMITTED', 'REVISION_REQUESTED'] }
    }
  });

  const results = { archived: 0, failed: 0 };

  for (const listing of inactiveListings) {
    try {
      await archiveListing({
        targetModel: 'Listing',
        targetId: listing.id,
        organizationId: listing.organization_id,
        archivedBy: null, // System
        reason: 'INACTIVITY',
        reasonText: 'Auto-archived due to 3 months of inactivity',
      });
      results.archived += 1;
    } catch (err) {
      results.failed += 1;
      console.error(`Failed to auto-archive Listing ${listing.id}:`, err);
    }
  }

  return results;
};

// Get archive history for a listing
const getArchiveHistory = async (targetId) => {
  return prisma.archive.findMany({
    where: { target_id: targetId },
    include: {
      user_archived: { select: { email: true } },
      user_restored: { select: { email: true } }
    },
    orderBy: { archived_at: 'desc' }
  });
};

module.exports = {
  archiveListing,
  restoreListing,
  autoArchiveInactive,
  getArchiveHistory,
};
