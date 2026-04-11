const DcApplication = require('../models/DcApplication');
const DcSite = require('../models/DcSite');
const DcPhasingSchedule = require('../models/DcPhasingSchedule');
const DcDocument = require('../models/DcDocument');
const { logAction } = require('../services/audit.service');
const { createQueueItem, updateQueueStatus } = require('../services/queue.service');
const { getPresignedPutUrl, getPresignedGetUrl } = require('../services/s3.service');
const { paginate } = require('../utils/pagination');
const Notification = require('../models/Notification');
const { findDuplicateDcListings } = require('../services/duplicate.service');

const SUPPLIER_ROLES = ['supplier', 'broker', 'subordinate'];

// GET /api/dc-applications
const listApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, includeArchived = false } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (includeArchived !== 'true') filter.isArchived = false;

    const result = await paginate(DcApplication, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: { createdAt: -1 },
    });
    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/dc-applications
const createApplication = async (req, res, next) => {
  try {
    const org = require('../models/Organization');
    const orgDoc = await org.findById(req.user.organizationId);
    if (orgDoc?.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Organization must be KYC approved before creating listings' });
    }

    const app = await DcApplication.create({
      organizationId: req.user.organizationId,
      brokerDcCompanyId: req.body.brokerDcCompanyId || undefined,
      companyLegalEntity: req.body.companyLegalEntity,
      companyOfficeAddress: req.body.companyOfficeAddress,
      companyCountry: req.body.companyCountry,
      contactName: req.body.contactName,
      contactEmail: req.body.contactEmail,
      contactMobile: req.body.contactMobile,
      otherDetails: req.body.otherDetails,
    });

    await logAction({ userId: req.user.userId, action: 'CREATE_DC_APPLICATION', targetModel: 'DcApplication', targetId: app._id, ipAddress: req.ip });
    res.status(201).json(app);
  } catch (err) { next(err); }
};

// GET /api/dc-applications/:id
const getApplication = async (req, res, next) => {
  try {
    const app = await DcApplication.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const sites = await DcSite.find({ dcApplicationId: app._id });
    res.json({ ...app.toObject(), sites });
  } catch (err) { next(err); }
};

// PUT /api/dc-applications/:id
const updateApplication = async (req, res, next) => {
  try {
    const app = await DcApplication.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (!['DRAFT', 'REVISION_REQUESTED'].includes(app.status)) {
      return res.status(400).json({ error: 'Application cannot be edited in current status' });
    }

    const allowed = ['companyLegalEntity', 'companyOfficeAddress', 'companyCountry', 'contactName', 'contactEmail', 'contactMobile', 'otherDetails', 'brokerDcCompanyId'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) app[f] = req.body[f]; });
    app.lastActivityAt = new Date();
    await app.save();
    await logAction({ userId: req.user.userId, action: 'UPDATE_DC_APPLICATION', targetModel: 'DcApplication', targetId: app._id, ipAddress: req.ip });
    res.json(app);
  } catch (err) { next(err); }
};

// POST /api/dc-applications/:id/submit
const submitApplication = async (req, res, next) => {
  try {
    const { force = false } = req.body;
    const app = await DcApplication.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (!['DRAFT'].includes(app.status)) {
      return res.status(400).json({ error: 'Only draft applications can be submitted' });
    }

    // Check for duplicates (skip if force=true)
    if (!force) {
      const duplicates = await findDuplicateDcListings({
        organizationId: app.organizationId,
        location: app.location,
        googleMapsLink: app.googleMapsLink,
        companyLegalEntity: app.companyLegalEntity,
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

    app.status = 'SUBMITTED';
    app.submittedAt = new Date();
    await app.save();

    await createQueueItem({ type: 'DC_LISTING', referenceId: app._id, referenceModel: 'DcApplication' });
    await logAction({ userId: req.user.userId, action: 'SUBMIT_DC_APPLICATION', targetModel: 'DcApplication', targetId: app._id, ipAddress: req.ip });
    res.json({ message: 'Application submitted for review', status: app.status, hasDuplicates: false });
  } catch (err) { next(err); }
};

// POST /api/dc-applications/:id/resubmit
const resubmitApplication = async (req, res, next) => {
  try {
    const app = await DcApplication.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (app.status !== 'REVISION_REQUESTED') {
      return res.status(400).json({ error: 'Only applications with revision requested can be resubmitted' });
    }

    app.status = 'RESUBMITTED';
    app.submittedAt = new Date();
    await app.save();

    await updateQueueStatus(app._id, 'DcApplication', 'RESUBMITTED');
    await logAction({ userId: req.user.userId, action: 'RESUBMIT_DC_APPLICATION', targetModel: 'DcApplication', targetId: app._id, ipAddress: req.ip });
    res.json({ message: 'Application resubmitted', status: app.status });
  } catch (err) { next(err); }
};

// POST /api/dc-applications/:id/sites
const addSite = async (req, res, next) => {
  try {
    const app = await DcApplication.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const body = {};
    for (const [key, val] of Object.entries(req.body)) {
      if (val !== '') body[key] = val;
    }
    const site = await DcSite.create({ dcApplicationId: app._id, ...body });
    await logAction({ userId: req.user.userId, action: 'ADD_DC_SITE', targetModel: 'DcSite', targetId: site._id, ipAddress: req.ip });
    res.status(201).json(site);
  } catch (err) { next(err); }
};

// GET /api/dc-applications/:id/sites/:siteId
const getSite = async (req, res, next) => {
  try {
    const app = await DcApplication.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const site = await DcSite.findOne({ _id: req.params.siteId, dcApplicationId: app._id });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const phasing = await DcPhasingSchedule.find({ dcSiteId: site._id }).sort({ month: 1 });
    const documents = await DcDocument.find({ dcSiteId: site._id });

    res.json({ ...site.toObject(), phasing, documents });
  } catch (err) { next(err); }
};

// PUT /api/dc-applications/:id/sites/:siteId
const updateSite = async (req, res, next) => {
  try {
    const app = await DcApplication.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const site = await DcSite.findOne({ _id: req.params.siteId, dcApplicationId: app._id });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const body = { ...req.body };
    for (const key of Object.keys(body)) {
      if (body[key] === '') body[key] = undefined;
    }
    delete body.history; // never overwrite history from client
    Object.assign(site, body);
    await site.save();
    res.json(site);
  } catch (err) { next(err); }
};

// DELETE /api/dc-applications/:id/sites/:siteId
const deleteSite = async (req, res, next) => {
  try {
    const app = await DcApplication.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    await DcSite.deleteOne({ _id: req.params.siteId, dcApplicationId: app._id });
    await DcPhasingSchedule.deleteMany({ dcSiteId: req.params.siteId });
    await DcDocument.deleteMany({ dcSiteId: req.params.siteId });

    await logAction({ userId: req.user.userId, action: 'DELETE_DC_SITE', changes: { siteId: req.params.siteId }, ipAddress: req.ip });
    res.json({ message: 'Site deleted' });
  } catch (err) { next(err); }
};

// GET /api/dc-sites/:siteId/phasing
const getPhasing = async (req, res, next) => {
  try {
    const rows = await DcPhasingSchedule.find({ dcSiteId: req.params.siteId }).sort({ month: 1 });
    res.json(rows);
  } catch (err) { next(err); }
};

// PUT /api/dc-sites/:siteId/phasing  (bulk upsert)
const updatePhasing = async (req, res, next) => {
  try {
    const { rows } = req.body; // array of phasing rows
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' });

    // Delete existing and replace
    await DcPhasingSchedule.deleteMany({ dcSiteId: req.params.siteId });

    if (rows.length > 0) {
      const toInsert = rows.map((r) => ({ ...r, dcSiteId: req.params.siteId }));
      await DcPhasingSchedule.insertMany(toInsert);
    }

    const updated = await DcPhasingSchedule.find({ dcSiteId: req.params.siteId }).sort({ month: 1 });
    res.json(updated);
  } catch (err) { next(err); }
};

// POST /api/dc-sites/:siteId/documents
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { documentType } = req.body;
    if (!documentType) return res.status(400).json({ error: 'documentType is required' });

    const doc = await DcDocument.create({
      dcSiteId: req.params.siteId,
      documentType,
      fileName: req.file.originalname,
      fileUrl: req.file.location || req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.userId,
    });

    res.status(201).json(doc);
  } catch (err) { next(err); }
};

// DELETE /api/dc-sites/:siteId/documents/:docId
const deleteDocument = async (req, res, next) => {
  try {
    await DcDocument.deleteOne({ _id: req.params.docId, dcSiteId: req.params.siteId });
    res.json({ message: 'Document deleted' });
  } catch (err) { next(err); }
};

module.exports = {
  listApplications, createApplication, getApplication, updateApplication,
  submitApplication, resubmitApplication,
  addSite, getSite, updateSite, deleteSite,
  getPhasing, updatePhasing,
  uploadDocument, deleteDocument,
};
