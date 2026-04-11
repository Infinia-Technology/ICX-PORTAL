const { findDuplicateDcListings, findDuplicateGpuListings } = require('../services/duplicate.service');
const { logAction } = require('../services/audit.service');

// POST /api/duplicates/check-dc-listings
const checkDcDuplicates = async (req, res, next) => {
  try {
    const { location, googleMapsLink, companyLegalEntity, organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const duplicates = await findDuplicateDcListings({
      organizationId,
      location,
      googleMapsLink,
      companyLegalEntity,
    });

    await logAction({
      userId: req.user.userId,
      action: 'CHECK_DC_DUPLICATES',
      targetModel: 'DcApplication',
      targetId: null,
      changes: { duplicateCount: duplicates.length },
      ipAddress: req.ip,
    });

    res.json({ duplicates, count: duplicates.length });
  } catch (err) {
    next(err);
  }
};

// POST /api/duplicates/check-gpu-listings
const checkGpuDuplicates = async (req, res, next) => {
  try {
    const { location, googleMapsLink, vendorName, gpu, organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const duplicates = await findDuplicateGpuListings({
      organizationId,
      location,
      googleMapsLink,
      vendorName,
      gpu,
    });

    await logAction({
      userId: req.user.userId,
      action: 'CHECK_GPU_DUPLICATES',
      targetModel: 'GpuClusterListing',
      targetId: null,
      changes: { duplicateCount: duplicates.length },
      ipAddress: req.ip,
    });

    res.json({ duplicates, count: duplicates.length });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkDcDuplicates,
  checkGpuDuplicates,
};
