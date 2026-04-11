const GpuClusterListing = require('../models/GpuClusterListing');
const GpuClusterDocument = require('../models/GpuClusterDocument');
const { logAction } = require('../services/audit.service');
const { createQueueItem, updateQueueStatus } = require('../services/queue.service');
const { paginate } = require('../utils/pagination');
const { findDuplicateGpuListings } = require('../services/duplicate.service');

// GET /api/gpu-clusters
const listClusters = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, includeArchived = false } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (includeArchived !== 'true') filter.isArchived = false;

    const result = await paginate(GpuClusterListing, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: { createdAt: -1 },
    });
    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/gpu-clusters
const createCluster = async (req, res, next) => {
  try {
    const Organization = require('../models/Organization');
    const org = await Organization.findById(req.user.organizationId);
    if (org?.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Organization must be KYC approved before creating listings' });
    }

    const body = {};
    for (const [key, val] of Object.entries(req.body)) {
      if (val !== '') body[key] = val;
    }
    const cluster = await GpuClusterListing.create({
      organizationId: req.user.organizationId,
      ...body,
    });

    await logAction({ userId: req.user.userId, action: 'CREATE_GPU_CLUSTER', targetModel: 'GpuClusterListing', targetId: cluster._id, ipAddress: req.ip });
    res.status(201).json(cluster);
  } catch (err) { next(err); }
};

// GET /api/gpu-clusters/:id
const getCluster = async (req, res, next) => {
  try {
    const cluster = await GpuClusterListing.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    const documents = await GpuClusterDocument.find({ gpuClusterListingId: cluster._id });
    res.json({ ...cluster.toObject(), documents });
  } catch (err) { next(err); }
};

// PUT /api/gpu-clusters/:id
const updateCluster = async (req, res, next) => {
  try {
    const cluster = await GpuClusterListing.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    if (!['DRAFT', 'REVISION_REQUESTED'].includes(cluster.status)) {
      return res.status(400).json({ error: 'Cluster cannot be edited in current status' });
    }

    const body = { ...req.body };
    for (const key of Object.keys(body)) {
      if (body[key] === '') body[key] = undefined;
    }
    delete body.history;
    Object.assign(cluster, body);
    cluster.lastActivityAt = new Date();
    await cluster.save();
    await logAction({ userId: req.user.userId, action: 'UPDATE_GPU_CLUSTER', targetModel: 'GpuClusterListing', targetId: cluster._id, ipAddress: req.ip });
    res.json(cluster);
  } catch (err) { next(err); }
};

// POST /api/gpu-clusters/:id/submit
const submitCluster = async (req, res, next) => {
  try {
    const { force = false } = req.body;
    const cluster = await GpuClusterListing.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    if (cluster.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft clusters can be submitted' });
    }

    // Check for duplicates (skip if force=true)
    if (!force) {
      const duplicates = await findDuplicateGpuListings({
        organizationId: cluster.organizationId,
        location: cluster.location,
        googleMapsLink: cluster.googleMapsLink,
        vendorName: cluster.vendorName,
        gpu: cluster.gpu,
      });

      // If duplicates found, return warning without blocking submission
      if (duplicates.length > 0) {
        return res.status(200).json({
          hasDuplicates: true,
          duplicates,
          message: `Found ${duplicates.length} potential duplicate(s). Review before confirming.`,
        });
      }
    }

    cluster.status = 'SUBMITTED';
    cluster.submittedAt = new Date();
    await cluster.save();

    await createQueueItem({ type: 'GPU_CLUSTER', referenceId: cluster._id, referenceModel: 'GpuClusterListing' });
    await logAction({ userId: req.user.userId, action: 'SUBMIT_GPU_CLUSTER', targetModel: 'GpuClusterListing', targetId: cluster._id, ipAddress: req.ip });
    res.json({ message: 'GPU cluster submitted for review', status: cluster.status, hasDuplicates: false });
  } catch (err) { next(err); }
};

// POST /api/gpu-clusters/:id/resubmit
const resubmitCluster = async (req, res, next) => {
  try {
    const cluster = await GpuClusterListing.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    if (cluster.status !== 'REVISION_REQUESTED') {
      return res.status(400).json({ error: 'Only clusters with revision requested can be resubmitted' });
    }

    cluster.status = 'RESUBMITTED';
    cluster.submittedAt = new Date();
    await cluster.save();

    await updateQueueStatus(cluster._id, 'GpuClusterListing', 'RESUBMITTED');
    await logAction({ userId: req.user.userId, action: 'RESUBMIT_GPU_CLUSTER', targetModel: 'GpuClusterListing', targetId: cluster._id, ipAddress: req.ip });
    res.json({ message: 'GPU cluster resubmitted', status: cluster.status });
  } catch (err) { next(err); }
};

// POST /api/gpu-clusters/:id/documents
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const doc = await GpuClusterDocument.create({
      gpuClusterListingId: req.params.id,
      documentType: req.body.documentType,
      fileName: req.file.originalname,
      fileUrl: req.file.location || req.file.path,
      fileSize: req.file.size,
      uploadedBy: req.user.userId,
    });

    res.status(201).json(doc);
  } catch (err) { next(err); }
};

// DELETE /api/gpu-clusters/:id/documents/:docId
const deleteDocument = async (req, res, next) => {
  try {
    await GpuClusterDocument.deleteOne({ _id: req.params.docId, gpuClusterListingId: req.params.id });
    res.json({ message: 'Document deleted' });
  } catch (err) { next(err); }
};

module.exports = {
  listClusters, createCluster, getCluster, updateCluster,
  submitCluster, resubmitCluster,
  uploadDocument, deleteDocument,
};
