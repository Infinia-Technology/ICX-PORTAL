const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const Organization = require('../models/Organization');
const DcApplication = require('../models/DcApplication');
const GpuClusterListing = require('../models/GpuClusterListing');
const GpuDemandRequest = require('../models/GpuDemandRequest');
const DcCapacityRequest = require('../models/DcCapacityRequest');
const { logAction } = require('../services/audit.service');

router.use(authenticate);

// GET /api/account/export — GDPR data portability
router.get('/export', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    const org = req.user.organizationId ? await Organization.findById(req.user.organizationId).lean() : null;
    const dcApps = await DcApplication.find({ organizationId: req.user.organizationId }).lean();
    const gpuClusters = await GpuClusterListing.find({ organizationId: req.user.organizationId }).lean();
    const gpuDemands = await GpuDemandRequest.find({ organizationId: req.user.organizationId }).lean();
    const dcRequests = await DcCapacityRequest.find({ organizationId: req.user.organizationId }).lean();

    const exportData = { user, organization: org, dcApplications: dcApps, gpuClusters, gpuDemands, dcRequests, exportedAt: new Date() };

    await logAction({ userId: req.user.userId, action: 'GDPR_EXPORT', ipAddress: req.ip });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="icx-data-export-${Date.now()}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) { next(err); }
});

// POST /api/account/deactivate — Self-service deactivation
router.post('/deactivate', async (req, res, next) => {
  try {
    await User.updateOne({ _id: req.user.userId }, { isActive: false });
    await logAction({ userId: req.user.userId, action: 'SELF_DEACTIVATE', ipAddress: req.ip });
    res.json({ message: 'Your account has been deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
