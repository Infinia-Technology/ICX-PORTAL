const express = require('express');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const Archive = require('../models/Archive');
const { archiveListing, restoreListing, getArchiveHistory } = require('../services/archive.service');
const { logAction } = require('../services/audit.service');

const router = express.Router();

router.use(authenticate);

// POST /api/archive/:model/:id
// Archive a listing
router.post('/:model/:id', authorize('admin', 'superadmin', 'supplier', 'broker'), async (req, res, next) => {
  try {
    const { model, id } = req.params;
    const { reason, reasonText } = req.body;

    if (!['DcApplication', 'GpuClusterListing'].includes(model)) {
      return res.status(400).json({ error: 'Invalid model' });
    }

    const archive = await archiveListing({
      targetModel: model,
      targetId: id,
      organizationId: req.user.organizationId,
      archivedBy: req.user.userId,
      reason: reason || 'MANUAL',
      reasonText,
    });

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'ARCHIVE_LISTING',
      targetModel: `Archive`,
      targetId: archive._id,
      changes: { model, listingId: id, reason },
      ipAddress: req.ip,
    });

    res.json(archive);
  } catch (err) { next(err); }
});

// PUT /api/archive/:model/:id/restore
// Restore an archived listing
router.put('/:model/:id/restore', authorize('admin', 'superadmin', 'supplier', 'broker'), async (req, res, next) => {
  try {
    const { model, id } = req.params;

    if (!['DcApplication', 'GpuClusterListing'].includes(model)) {
      return res.status(400).json({ error: 'Invalid model' });
    }

    const archive = await restoreListing({
      targetModel: model,
      targetId: id,
      restoredBy: req.user.userId,
    });

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'RESTORE_LISTING',
      targetModel: 'Archive',
      targetId: archive._id,
      changes: { model, listingId: id },
      ipAddress: req.ip,
    });

    res.json({ message: 'Listing restored', archive });
  } catch (err) { next(err); }
});

// GET /api/archive/:model/:id/history
// Get archive history for a listing
router.get('/:model/:id/history', async (req, res, next) => {
  try {
    const { model, id } = req.params;

    if (!['DcApplication', 'GpuClusterListing'].includes(model)) {
      return res.status(400).json({ error: 'Invalid model' });
    }

    const history = await Archive.find({ targetModel: model, targetId: id })
      .populate('archivedBy', 'email')
      .populate('restoredBy', 'email')
      .sort('-archivedAt');

    res.json(history);
  } catch (err) { next(err); }
});

// GET /api/archive
// List all archives (admin only)
router.get('/', authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const { model, organizationId, isActive } = req.query;
    const filter = {};

    if (model) filter.targetModel = model;
    if (organizationId) filter.organizationId = organizationId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const archives = await Archive.find(filter)
      .populate('organizationId', 'companyName')
      .populate('archivedBy', 'email')
      .populate('restoredBy', 'email')
      .sort('-archivedAt')
      .limit(1000);

    res.json(archives);
  } catch (err) { next(err); }
});

module.exports = router;
