const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const { uploadFile, deleteFile } = require('../services/s3.service');

// GET /api/gpu-clusters
const listClusters = async (req, res, next) => {
  try {
    const { status, includeArchived = false } = req.query;
    
    const where = {
      supplier_id: req.user.userId,
      type: 'GPU_CLUSTER'
    };

    if (status) {
      where.status = status.toUpperCase();
    }
    
    if (includeArchived !== 'true') {
      where.archived_at = null;
    }

    const clusters = await prisma.listing.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    // Map to the format frontend expects
    const formatted = clusters.map(c => ({
      ...c,
      _id: c.id,
      vendorName: c.data_center_name,
      gpu: (c.specifications && typeof c.specifications === 'object') ? c.specifications.gpuTechnology : 'N/A',
      location: {
        city: c.city,
        state: c.state,
        country: c.country
      },
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));

    res.json({ data: formatted });
  } catch (err) { next(err); }
};

// POST /api/gpu-clusters
const createCluster = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user?.kyc_status !== 'approved') {
      return res.status(403).json({ error: 'User must be KYC approved before creating listings' });
    }

    const { vendorName, ...rest } = req.body;
    
    const cluster = await prisma.listing.create({
      data: {
        supplier_id: req.user.userId,
        type: 'GPU_CLUSTER',
        data_center_name: vendorName || 'New Cluster',
        status: 'DRAFT',
        specifications: rest || {},
        city: req.body.location?.city || req.body.location,
        country: req.body.location?.country,
      }
    });

    await logAction({ userId: req.user.userId, action: 'CREATE_GPU_CLUSTER', targetModel: 'Listing', targetId: cluster.id, ipAddress: req.ip });
    res.status(201).json(cluster);
  } catch (err) { next(err); }
};

// GET /api/gpu-clusters/:id
const getCluster = async (req, res, next) => {
  try {
    const cluster = await prisma.listing.findFirst({
      where: { id: req.params.id, supplier_id: req.user.userId }
    });
    
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    // Map for frontend
    const formatted = {
      ...cluster,
      _id: cluster.id,
      vendorName: cluster.data_center_name,
      createdAt: cluster.created_at,
      updatedAt: cluster.updated_at,
      ...((cluster.specifications && typeof cluster.specifications === 'object') ? cluster.specifications : {})
    };

    res.json(formatted);
  } catch (err) { next(err); }
};

// PUT /api/gpu-clusters/:id
const updateCluster = async (req, res, next) => {
  try {
    const cluster = await prisma.listing.findFirst({
      where: { id: req.params.id, supplier_id: req.user.userId }
    });
    
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    if (!['DRAFT', 'REVISION_REQUESTED'].includes(cluster.status)) {
      return res.status(400).json({ error: 'Cluster cannot be edited in current status' });
    }

    const { vendorName, location, ...rest } = req.body;

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: {
        data_center_name: vendorName,
        city: location?.city || location,
        country: location?.country,
        specifications: rest || {},
        updated_at: new Date()
      }
    });

    await logAction({ userId: req.user.userId, action: 'UPDATE_GPU_CLUSTER', targetModel: 'Listing', targetId: updated.id, ipAddress: req.ip });
    res.json({
      ...updated,
      _id: updated.id,
      vendorName: updated.data_center_name,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (err) { next(err); }
};

// POST /api/gpu-clusters/:id/submit
const submitCluster = async (req, res, next) => {
  try {
    const cluster = await prisma.listing.findFirst({
      where: { id: req.params.id, supplier_id: req.user.userId }
    });
    
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    if (cluster.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft clusters can be submitted' });
    }

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: {
        status: 'SUBMITTED',
        updated_at: new Date()
      }
    });

    await logAction({ userId: req.user.userId, action: 'SUBMIT_GPU_CLUSTER', targetModel: 'Listing', targetId: updated.id, ipAddress: req.ip });
    res.json({ message: 'GPU cluster submitted for review', status: updated.status, hasDuplicates: false });
  } catch (err) { next(err); }
};

// POST /api/gpu-clusters/:id/resubmit
const resubmitCluster = async (req, res, next) => {
  try {
    const cluster = await prisma.listing.findFirst({
      where: { id: req.params.id, supplier_id: req.user.userId }
    });
    
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    if (cluster.status !== 'REVISION_REQUESTED') {
      return res.status(400).json({ error: 'Only clusters with revision requested can be resubmitted' });
    }

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: {
        status: 'RESUBMITTED',
        updated_at: new Date()
      }
    });

    await logAction({ userId: req.user.userId, action: 'RESUBMIT_GPU_CLUSTER', targetModel: 'Listing', targetId: updated.id, ipAddress: req.ip });
    res.json({ message: 'GPU cluster resubmitted', status: updated.status });
  } catch (err) { next(err); }
};

// POST /api/gpu-clusters/:id/refresh
const refreshCluster = async (req, res, next) => {
  try {
    const cluster = await prisma.listing.findFirst({
      where: { id: req.params.id, supplier_id: req.user.userId }
    });
    
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { updated_at: new Date() }
    });

    await logAction({
      userId: req.user.userId,
      action: 'REFRESH_GPU_CLUSTER',
      targetModel: 'Listing',
      targetId: updated.id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Listing refreshed', lastActivityAt: updated.updated_at });
  } catch (err) { next(err); }
};

module.exports = {
  listClusters, createCluster, getCluster, updateCluster,
  submitCluster, resubmitCluster,
  refreshCluster,
  
  uploadDocument: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const cluster = await prisma.listing.findFirst({
        where: { id: id, organization_id: req.user.organization_id, type: 'GPU_CLUSTER' }
      });
      if (!cluster) return res.status(404).json({ error: 'GPU cluster not found or access denied' });

      const documentType = req.body.documentType || 'Other';
      const { key, fileName } = await uploadFile(req.user.organization_id, 'gpucluster', id, req.file);

      const document = await prisma.listingDocument.create({
        data: {
          listing_id: id,
          document_type: documentType,
          file_name: fileName,
          file_url: key,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          uploaded_by: req.user.userId
        }
      });

      res.status(201).json({ ...document, _id: document.id });
    } catch (err) { next(err); }
  },

  deleteDocument: async (req, res, next) => {
    try {
      const { id, docId } = req.params;

      const document = await prisma.listingDocument.findFirst({
        where: { 
          id: docId, 
          listing_id: id, 
          listing: { organization_id: req.user.organization_id } 
        }
      });

      if (!document) return res.status(404).json({ error: 'Document not found or access denied' });

      await deleteFile(document.file_url);
      await prisma.listingDocument.delete({ where: { id: docId } });

      res.json({ message: 'Document deleted successfully' });
    } catch (err) { next(err); }
  }
};
