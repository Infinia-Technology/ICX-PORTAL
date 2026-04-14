const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const { createQueueItem } = require('../services/queue.service');
const { uploadFile, deleteFile } = require('../services/s3.service');

// Helper for Prisma pagination
const paginatePrisma = async (model, where, page, limit, include = null, orderBy = { created_at: 'desc' }) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const count = await model.count({ where });
  const docs = await model.findMany({
    where,
    take: limitNum,
    skip: (pageNum - 1) * limitNum,
    orderBy,
    include
  });
  return {
    data: docs,
    total: count,
    limit: limitNum,
    page: pageNum,
    totalPages: Math.ceil(count / limitNum),
    hasNext: pageNum < Math.ceil(count / limitNum),
    hasPrev: pageNum > 1,
  };
};

// GET /api/dc-applications
const listApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, includeArchived = false } = req.query;
    const where = { organization_id: req.user.organization_id, type: 'DC_SITE' };
    if (status) where.status = status.toUpperCase();
    if (includeArchived !== 'true') where.archived_at = null;

    const result = await paginatePrisma(prisma.listing, where, page, limit, { sites: true });
    
    result.data = result.data.map(item => ({
      ...item,
      _id: item.id,
      createdAt: item.created_at,
      sites: item.sites.map(s => ({ ...s, _id: s.id }))
    }));

    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/dc-applications
const createApplication = async (req, res, next) => {
  try {
    const { dataCenterName, ...rest } = req.body;
    const listing = await prisma.listing.create({
      data: {
        type: 'DC_SITE',
        data_center_name: dataCenterName || 'New DC Application',
        supplier_id: req.user.userId,
        organization_id: req.user.organization_id,
        status: 'DRAFT',
        specifications: rest,
      }
    });

    await logAction({ userId: req.user.userId, action: 'CREATE_DC_APPLICATION', targetModel: 'Listing', targetId: listing.id, ipAddress: req.ip });
    res.status(201).json({ ...listing, _id: listing.id });
  } catch (err) { next(err); }
};

// GET /api/dc-applications/:id
const getApplication = async (req, res, next) => {
  try {
    const app = await prisma.listing.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id },
      include: { sites: { include: { documents: true } } }
    });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const formatted = {
      ...app,
      _id: app.id,
      ...(typeof app.specifications === 'object' ? app.specifications : {}),
      sites: app.sites.map(s => ({
        ...s,
        _id: s.id,
        ...(typeof s.specifications === 'object' ? s.specifications : {}),
        documents: s.documents.map(d => ({ ...d, _id: d.id }))
      }))
    };

    res.json(formatted);
  } catch (err) { next(err); }
};

// PUT /api/dc-applications/:id
const updateApplication = async (req, res, next) => {
  try {
    const app = await prisma.listing.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id }
    });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (!['DRAFT', 'REVISION_REQUESTED'].includes(app.status)) {
      return res.status(400).json({ error: 'Application cannot be edited in current status' });
    }

    const { dataCenterName, ...rest } = req.body;
    const updated = await prisma.listing.update({
      where: { id: app.id },
      data: { 
        data_center_name: dataCenterName || app.data_center_name,
        specifications: rest,
        updated_at: new Date()
      }
    });

    await logAction({ userId: req.user.userId, action: 'UPDATE_DC_APPLICATION', targetModel: 'Listing', targetId: updated.id, ipAddress: req.ip });
    res.json({ ...updated, _id: updated.id });
  } catch (err) { next(err); }
};

// POST /api/dc-applications/:id/submit
const submitApplication = async (req, res, next) => {
  try {
    console.log(`[SUBMIT] Attempting to submit DC app ${req.params.id} for user ${req.user.userId} (org: ${req.user.organization_id})`);

    const app = await prisma.listing.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id }
    });
    if (!app) {
      console.log(`[SUBMIT] App not found or access denied for ${req.params.id}`);
      return res.status(404).json({ error: 'Application not found' });
    }

    console.log(`[SUBMIT] Found app with status: ${app.status}`);
    if (!['DRAFT', 'REVISION_REQUESTED'].includes(app.status)) {
      return res.status(400).json({ error: 'Only draft or revision-requested applications can be submitted' });
    }

    const updated = await prisma.listing.update({
      where: { id: app.id },
      data: {
        status: 'SUBMITTED',
        updated_at: new Date()
      }
    });

    await logAction({ userId: req.user.userId, action: 'SUBMIT_DC_APPLICATION', targetModel: 'Listing', targetId: updated.id, ipAddress: req.ip });

    console.log(`[SUBMIT] Creating queue item for listing ${updated.id}`);
    await createQueueItem({
      type: 'DC_LISTING',
      referenceId: updated.id,
      referenceModel: 'Listing'
    });

    console.log(`[SUBMIT] Successfully submitted application ${updated.id}`);
    res.json({ message: 'Application submitted for review', status: updated.status, _id: updated.id });
  } catch (err) {
    console.error('[SUBMIT] Error:', err);
    next(err);
  }
};

// POST /api/dc-applications/:id/resubmit
const resubmitApplication = async (req, res, next) => {
  try {
    const app = await prisma.listing.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id }
    });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (app.status !== 'REVISION_REQUESTED') {
      return res.status(400).json({ error: 'Only applications with revision requested can be resubmitted' });
    }

    const updated = await prisma.listing.update({
      where: { id: app.id },
      data: { status: 'RESUBMITTED', updated_at: new Date() }
    });

    await logAction({ userId: req.user.userId, action: 'RESUBMIT_DC_APPLICATION', targetModel: 'Listing', targetId: updated.id, ipAddress: req.ip });
    res.json({ message: 'Application resubmitted', status: updated.status });
  } catch (err) { next(err); }
};

// POST /api/dc-applications/:id/sites
const addSite = async (req, res, next) => {
  try {
    const app = await prisma.listing.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id }
    });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const { siteName, ...specs } = req.body;
    const site = await prisma.dcSite.create({
      data: {
        listing_id: app.id,
        site_name: siteName || 'New Site',
        specifications: specs
      }
    });

    await logAction({ userId: req.user.userId, action: 'ADD_DC_SITE', targetModel: 'DcSite', targetId: site.id, ipAddress: req.ip });
    res.status(201).json({ ...site, _id: site.id });
  } catch (err) { next(err); }
};

// GET /api/dc-applications/:id/sites/:siteId
const getSite = async (req, res, next) => {
  try {
    const site = await prisma.dcSite.findFirst({
      where: { id: req.params.siteId, listing_id: req.params.id },
      include: { documents: true, phasing: true }
    });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    res.json({
      ...site,
      _id: site.id,
      ...(typeof site.specifications === 'object' ? site.specifications : {}),
      phasing: site.phasing.map(p => ({ ...p, _id: p.id })),
      documents: site.documents.map(d => ({ ...d, _id: d.id }))
    });
  } catch (err) { next(err); }
};

// PUT /api/dc-applications/:id/sites/:siteId
const updateSite = async (req, res, next) => {
  try {
    const site = await prisma.dcSite.findFirst({
      where: { id: req.params.siteId, listing_id: req.params.id }
    });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const { siteName, ...specs } = req.body;
    const updated = await prisma.dcSite.update({
      where: { id: site.id },
      data: {
        site_name: siteName || site.site_name,
        specifications: specs
      }
    });

    res.json({ ...updated, _id: updated.id });
  } catch (err) { next(err); }
};

// DELETE /api/dc-applications/:id/sites/:siteId
const deleteSite = async (req, res, next) => {
  try {
    const site = await prisma.dcSite.findFirst({
      where: { id: req.params.siteId, listing_id: req.params.id }
    });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    await prisma.dcSite.delete({ where: { id: site.id } });
    await logAction({ userId: req.user.userId, action: 'DELETE_DC_SITE', targetModel: 'DcSite', targetId: site.id, ipAddress: req.ip });
    res.json({ message: 'Site deleted' });
  } catch (err) { next(err); }
};

// GET /api/sites/:siteId/phasing
const getPhasing = async (req, res, next) => {
  try {
    const rows = await prisma.dcPhasingSchedule.findMany({
      where: { site_id: req.params.siteId },
      orderBy: { month: 'asc' }
    });
    res.json(rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) { next(err); }
};

// PUT /api/sites/:siteId/phasing
const updatePhasing = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' });

    await prisma.dcPhasingSchedule.deleteMany({ where: { site_id: req.params.siteId } });

    if (rows.length > 0) {
      await prisma.dcPhasingSchedule.createMany({
        data: rows.map(r => ({
          site_id: req.params.siteId,
          month: new Date(r.month),
          it_load_mw: r.itLoadMw || 0,
          cumulative_it_load_mw: r.cumulativeItLoadMw || 0,
          scope_of_works: r.scopeOfWorks || '',
          phase: r.phase || 1,
          estimated_capex_musd: r.estimatedCapexMusd || 0,
          min_lease_duration_yrs: r.minLeaseDurationYrs || 0,
          nrc_request_musd: r.nrcRequestMusd || 0,
          initial_deposit_musd: r.initialDepositMusd || 0,
          mrc_request_per_kw: r.mrcRequestPerKw || 0,
          mrc_inclusions: r.mrcInclusions || ''
        }))
      });
    }

    const updated = await prisma.dcPhasingSchedule.findMany({
      where: { site_id: req.params.siteId },
      orderBy: { month: 'asc' }
    });
    res.json(updated.map(r => ({ ...r, _id: r.id })));
  } catch (err) { next(err); }
};

// POST /api/dc-applications/:id/refresh
const refreshApplication = async (req, res, next) => {
  try {
    const updated = await prisma.listing.update({
      where: { id: req.params.id, organization_id: req.user.organization_id },
      data: { updated_at: new Date() }
    });
    res.json({ message: 'Application refreshed', lastActivityAt: updated.updated_at });
  } catch (err) { next(err); }
};

// Documents
const uploadDocument = async (req, res, next) => {
  try {
    const { id, siteId } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Ensure the listing and site exist and belong to the org
    const site = await prisma.dcSite.findFirst({
      where: { id: siteId, listing_id: id, listing: { organization_id: req.user.organization_id } }
    });
    if (!site) return res.status(404).json({ error: 'Site not found or access denied' });

    const documentType = req.body.documentType || 'Other';

    const { key, fileName } = await uploadFile(req.user.organization_id, 'dcsite', siteId, req.file);

    const document = await prisma.dcDocument.create({
      data: {
        site_id: siteId,
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
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id, siteId, docId } = req.params;

    const document = await prisma.dcDocument.findFirst({
      where: { 
        id: docId, 
        site_id: siteId, 
        site: { listing_id: id, listing: { organization_id: req.user.organization_id } } 
      }
    });

    if (!document) return res.status(404).json({ error: 'Document not found or access denied' });

    await deleteFile(document.file_url);

    await prisma.dcDocument.delete({ where: { id: docId } });

    res.json({ message: 'Document deleted successfully' });
  } catch (err) { next(err); }
};

module.exports = {
  listApplications, createApplication, getApplication, updateApplication,
  submitApplication, resubmitApplication,
  addSite, getSite, updateSite, deleteSite,
  getPhasing, updatePhasing,
  uploadDocument, deleteDocument,
  refreshApplication,
  // Alias for backward compatibility
  getListingDetails: getApplication 
};
