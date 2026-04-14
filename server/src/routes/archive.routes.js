const express = require('express');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const prisma = require('../config/prisma');
const { archiveListing, restoreListing } = require('../services/archive.service');
const { logAction } = require('../services/audit.service');

const router = express.Router();

router.use(authenticate);

// POST /api/archive/:model/:id
// Archive a listing
router.post('/:model/:id', authorize('admin', 'superadmin', 'supplier', 'broker'), async (req, res, next) => {
  try {
    const { model, id } = req.params;
    const { reason, reasonText } = req.body;

    // In Prisma, we use 'Listing' for both DC and GPU
    if (!['DcApplication', 'GpuClusterListing', 'Listing'].includes(model)) {
      return res.status(400).json({ error: 'Invalid model' });
    }

    const archive = await archiveListing({
      targetModel: 'Listing',
      targetId: id,
      organizationId: req.user.organization_id,
      archivedBy: req.user.userId,
      reason: reason || 'MANUAL',
      reasonText,
    });

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'ARCHIVE_LISTING',
      targetModel: 'Archive',
      targetId: archive.id,
      changes: { model, listingId: id, reason },
      ipAddress: req.ip,
    });

    res.json({ ...archive, _id: archive.id });
  } catch (err) { next(err); }
});

// PUT /api/archive/:model/:id/restore
// Restore an archived listing
router.put('/:model/:id/restore', authorize('admin', 'superadmin', 'supplier', 'broker'), async (req, res, next) => {
  try {
    const { model, id } = req.params;

    if (!['DcApplication', 'GpuClusterListing', 'Listing'].includes(model)) {
      return res.status(400).json({ error: 'Invalid model' });
    }

    const archive = await restoreListing({
      targetId: id,
      restoredBy: req.user.userId,
    });

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'RESTORE_LISTING',
      targetModel: 'Archive',
      targetId: archive.id,
      changes: { model, listingId: id },
      ipAddress: req.ip,
    });

    res.json({ message: 'Listing restored', archive: { ...archive, _id: archive.id } });
  } catch (err) { next(err); }
});

// GET /api/archive/:model/:id/history
// Get archive history for a listing
router.get('/:model/:id/history', async (req, res, next) => {
  try {
    const { id } = req.params;

    const history = await prisma.archive.findMany({
      where: { target_id: id },
      include: {
        user_archived: { select: { email: true } },
        user_restored: { select: { email: true } }
      },
      orderBy: { archived_at: 'desc' }
    });

    res.json(history.map(h => ({ ...h, _id: h.id, archivedBy: h.user_archived, restoredBy: h.user_restored })));
  } catch (err) { next(err); }
});

// GET /api/archive
// List all archives (admin only)
router.get('/', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const { model, organizationId, isActive } = req.query;
    const where = {};

    if (model) where.target_model = 'Listing';
    if (organizationId) where.organization_id = organizationId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const archives = await prisma.archive.findMany({
      where,
      include: {
        user_archived: { select: { email: true } },
        user_restored: { select: { email: true } }
      },
      orderBy: { archived_at: 'desc' },
      take: 1000
    });

    res.json(archives.map(h => ({ ...h, _id: h.id, archivedBy: h.user_archived, restoredBy: h.user_restored })));
  } catch (err) { next(err); }
});

module.exports = router;
