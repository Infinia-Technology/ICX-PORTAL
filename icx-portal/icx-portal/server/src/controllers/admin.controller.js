const Organization = require('../models/Organization');
const User = require('../models/User');
const QueueItem = require('../models/QueueItem');
const DcApplication = require('../models/DcApplication');
const DcSite = require('../models/DcSite');
const DcDocument = require('../models/DcDocument');
const GpuClusterListing = require('../models/GpuClusterListing');
const GpuClusterDocument = require('../models/GpuClusterDocument');
const GpuDemandRequest = require('../models/GpuDemandRequest');
const DcCapacityRequest = require('../models/DcCapacityRequest');
const Notification = require('../models/Notification');
const { logAction } = require('../services/audit.service');
const { sendKycApproved, sendKycRejected, sendRevisionRequested, sendEmail } = require('../services/email.service');
const { paginate } = require('../utils/pagination');

// ======================= QUEUE =======================

// GET /api/admin/queue
const getQueue = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status, sort = '-createdAt' } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const result = await paginate(QueueItem, filter, {
      page: parseInt(page), limit: parseInt(limit), sort,
      populate: [{ path: 'assignedTo', select: 'email role' }],
    });
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/queue/:id
const getQueueItem = async (req, res, next) => {
  try {
    const item = await QueueItem.findById(req.params.id).populate('assignedTo', 'email role');
    if (!item) return res.status(404).json({ error: 'Queue item not found' });

    // Fetch the referenced entity
    let entity = null;
    if (item.referenceModel === 'Organization') {
      entity = await Organization.findById(item.referenceId);
    } else if (item.referenceModel === 'DcApplication') {
      entity = await DcApplication.findById(item.referenceId);
      if (entity) {
        const sites = await DcSite.find({ dcApplicationId: entity._id });
        entity = { ...entity.toObject(), sites };
      }
    } else if (item.referenceModel === 'GpuClusterListing') {
      entity = await GpuClusterListing.findById(item.referenceId);
    } else if (item.referenceModel === 'GpuDemandRequest') {
      entity = await GpuDemandRequest.findById(item.referenceId);
    } else if (item.referenceModel === 'DcCapacityRequest') {
      entity = await DcCapacityRequest.findById(item.referenceId);
    }

    res.json({ ...item.toObject(), entity });
  } catch (err) { next(err); }
};

// ======================= SUPPLIERS =======================

// GET /api/admin/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const filter = { type: { $in: ['SUPPLIER', 'BROKER'] } };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const result = await paginate(Organization, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: '-createdAt',
    });
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/suppliers/:id
const getSupplier = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org || !['SUPPLIER', 'BROKER'].includes(org.type)) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    const users = await User.find({ organizationId: org._id }).select('email role isActive lastLoginAt');
    res.json({ ...org.toObject(), users });
  } catch (err) { next(err); }
};

// PUT /api/admin/suppliers/:id/kyc
const reviewSupplierKyc = async (req, res, next) => {
  try {
    const { action, flaggedFields = [], fieldComments = {}, reason } = req.body;
    if (!['APPROVE', 'REJECT', 'REQUEST_REVISION'].includes(action)) {
      return res.status(400).json({ error: 'action must be APPROVE, REJECT, or REQUEST_REVISION' });
    }

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Supplier not found' });

    const user = await User.findOne({ organizationId: org._id });

    if (action === 'APPROVE') {
      org.status = 'APPROVED';
      org.reviewedBy = req.user.userId;
      org.approvedAt = new Date();
      org.flaggedFields = [];
      org.fieldComments = new Map();
      await org.save();

      if (user) {
        await sendKycApproved(user.email).catch(console.error);
        await Notification.create({
          userId: user._id, type: 'KYC_APPROVED', title: 'Account Approved',
          message: 'Your KYC has been approved. You can now create listings.',
          link: '/supplier/dashboard',
        });
      }
    } else if (action === 'REJECT') {
      org.status = 'REJECTED';
      org.reviewedBy = req.user.userId;
      await org.save();

      if (user) {
        await sendKycRejected(user.email, reason).catch(console.error);
        await Notification.create({
          userId: user._id, type: 'KYC_REJECTED', title: 'Application Rejected',
          message: reason || 'Your KYC application has been rejected.',
          link: '/supplier/dashboard',
        });
      }
    } else {
      org.status = 'REVISION_REQUESTED';
      org.flaggedFields = flaggedFields;
      org.fieldComments = fieldComments;
      org.reviewedBy = req.user.userId;
      await org.save();

      if (user) {
        await sendRevisionRequested(user.email, flaggedFields).catch(console.error);
        await Notification.create({
          userId: user._id, type: 'KYC_REVISION_REQUESTED', title: 'Revision Requested',
          message: 'Please update your KYC information and resubmit.',
          link: '/supplier/dashboard',
        });
      }
    }

    await logAction({ userId: req.user.userId, action: `KYC_${action}`, targetModel: 'Organization', targetId: org._id, ipAddress: req.ip });
    res.json({ message: `KYC ${action.toLowerCase().replace('_', ' ')} successfully`, status: org.status });
  } catch (err) { next(err); }
};

// ======================= DC LISTINGS =======================

// GET /api/admin/dc-listings
const getDcListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const result = await paginate(DcApplication, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: '-createdAt',
      populate: [{ path: 'organizationId', select: 'type status contactEmail' }],
    });
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/dc-listings/:id
const getDcListing = async (req, res, next) => {
  try {
    const app = await DcApplication.findById(req.params.id)
      .populate('organizationId', 'type status contactEmail vendorType')
      .populate('assignedTo', 'email role');
    if (!app) return res.status(404).json({ error: 'DC listing not found' });

    const sites = await DcSite.find({ dcApplicationId: app._id });
    const sitesWithDocs = await Promise.all(sites.map(async (site) => {
      const documents = await DcDocument.find({ dcSiteId: site._id });
      return { ...site.toObject(), documents };
    }));

    res.json({ ...app.toObject(), sites: sitesWithDocs });
  } catch (err) { next(err); }
};

// PUT /api/admin/dc-listings/:id/review
const reviewDcListing = async (req, res, next) => {
  try {
    const { action, flaggedFields = [], fieldComments = {}, reason } = req.body;
    if (!['APPROVE', 'REJECT', 'REQUEST_REVISION'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const app = await DcApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'DC listing not found' });

    const supplierUser = await User.findOne({ organizationId: app.organizationId });

    if (action === 'APPROVE') {
      app.status = 'APPROVED';
      app.reviewedAt = new Date();
      await app.save();
      await DcSite.updateMany({ dcApplicationId: app._id }, { $set: { flaggedFields: [], fieldComments: new Map() } });

      if (supplierUser) {
        await sendEmail(supplierUser.email, 'ICX Portal — DC Listing Approved', `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2>ICX Portal</h2><p>Your DC listing has been <strong>approved</strong> and is now live on the marketplace.</p>
          </div>`).catch(console.error);
        await Notification.create({
          userId: supplierUser._id, type: 'DC_LISTING_APPROVED', title: 'DC Listing Approved',
          message: 'Your DC listing is now live on the marketplace.',
          link: `/supplier/dc-listings/${app._id}`,
        });
      }
    } else if (action === 'REJECT') {
      app.status = 'REJECTED';
      app.reviewedAt = new Date();
      await app.save();

      if (supplierUser) {
        await Notification.create({
          userId: supplierUser._id, type: 'DC_LISTING_REJECTED', title: 'DC Listing Rejected',
          message: reason || 'Your DC listing has been rejected.',
          link: `/supplier/dc-listings/${app._id}`,
        });
      }
    } else {
      app.status = 'REVISION_REQUESTED';
      app.reviewedAt = new Date();
      await app.save();

      // Store flagged fields on the first site (or the specific site specified)
      if (flaggedFields.length > 0) {
        await DcSite.updateMany({ dcApplicationId: app._id }, { $set: { flaggedFields, fieldComments } });
      }

      if (supplierUser) {
        await sendRevisionRequested(supplierUser.email, flaggedFields).catch(console.error);
        await Notification.create({
          userId: supplierUser._id, type: 'DC_LISTING_REVISION', title: 'Revision Requested',
          message: 'Your DC listing requires revisions.',
          link: `/supplier/dc-listings/${app._id}/edit`,
        });
      }
    }

    await logAction({ userId: req.user.userId, action: `DC_LISTING_${action}`, targetModel: 'DcApplication', targetId: app._id, ipAddress: req.ip });
    res.json({ message: `DC listing ${action.toLowerCase().replace('_', ' ')}`, status: app.status });
  } catch (err) { next(err); }
};

// ======================= GPU CLUSTERS =======================

// GET /api/admin/gpu-clusters
const getGpuClusters = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const result = await paginate(GpuClusterListing, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: '-createdAt',
      populate: [{ path: 'organizationId', select: 'type status contactEmail' }],
    });
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/gpu-clusters/:id
const getGpuCluster = async (req, res, next) => {
  try {
    const cluster = await GpuClusterListing.findById(req.params.id)
      .populate('organizationId', 'type status contactEmail')
      .populate('assignedTo', 'email role');
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    const documents = await GpuClusterDocument.find({ gpuClusterListingId: cluster._id });
    res.json({ ...cluster.toObject(), documents });
  } catch (err) { next(err); }
};

// PUT /api/admin/gpu-clusters/:id/review
const reviewGpuCluster = async (req, res, next) => {
  try {
    const { action, flaggedFields = [], fieldComments = {}, reason } = req.body;
    if (!['APPROVE', 'REJECT', 'REQUEST_REVISION'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const cluster = await GpuClusterListing.findById(req.params.id);
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    const supplierUser = await User.findOne({ organizationId: cluster.organizationId });

    if (action === 'APPROVE') {
      cluster.status = 'APPROVED';
      cluster.reviewedAt = new Date();
      cluster.flaggedFields = [];
      cluster.fieldComments = new Map();
    } else if (action === 'REJECT') {
      cluster.status = 'REJECTED';
      cluster.reviewedAt = new Date();
    } else {
      cluster.status = 'REVISION_REQUESTED';
      cluster.reviewedAt = new Date();
      cluster.flaggedFields = flaggedFields;
      cluster.fieldComments = fieldComments;
    }
    await cluster.save();

    if (supplierUser) {
      const notifTypes = { APPROVE: 'GPU_CLUSTER_APPROVED', REJECT: 'GPU_CLUSTER_REJECTED', REQUEST_REVISION: 'GPU_CLUSTER_REVISION' };
      const titles = { APPROVE: 'GPU Cluster Approved', REJECT: 'GPU Cluster Rejected', REQUEST_REVISION: 'Revision Requested' };
      await Notification.create({
        userId: supplierUser._id, type: notifTypes[action], title: titles[action],
        message: action === 'APPROVE' ? 'Your GPU cluster is live on the marketplace.' : (reason || `GPU cluster ${action.toLowerCase()}`),
        link: `/supplier/gpu-clusters/${cluster._id}`,
      });
    }

    await logAction({ userId: req.user.userId, action: `GPU_CLUSTER_${action}`, targetModel: 'GpuClusterListing', targetId: cluster._id, ipAddress: req.ip });
    res.json({ message: `GPU cluster ${action.toLowerCase()}`, status: cluster.status });
  } catch (err) { next(err); }
};

// ======================= CUSTOMERS =======================

// GET /api/admin/customers
const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { type: 'CUSTOMER' };
    if (status) filter.status = status;

    const result = await paginate(Organization, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: '-createdAt',
    });
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/customers/:id
const getCustomer = async (req, res, next) => {
  try {
    const org = await Organization.findOne({ _id: req.params.id, type: 'CUSTOMER' });
    if (!org) return res.status(404).json({ error: 'Customer not found' });
    const users = await User.find({ organizationId: org._id }).select('email role isActive lastLoginAt');
    res.json({ ...org.toObject(), users });
  } catch (err) { next(err); }
};

// PUT /api/admin/customers/:id/verify
const verifyCustomer = async (req, res, next) => {
  try {
    const { action, reason, flaggedFields = [], fieldComments = {} } = req.body;
    if (!['APPROVE', 'REJECT', 'REQUEST_REVISION'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const org = await Organization.findOne({ _id: req.params.id, type: 'CUSTOMER' });
    if (!org) return res.status(404).json({ error: 'Customer not found' });

    const user = await User.findOne({ organizationId: org._id });

    if (action === 'APPROVE') {
      org.status = 'APPROVED'; org.reviewedBy = req.user.userId; org.approvedAt = new Date();
      await org.save();
      if (user) {
        await sendKycApproved(user.email).catch(console.error);
        await Notification.create({ userId: user._id, type: 'KYC_APPROVED', title: 'Account Approved', message: 'Your account is approved. You can now browse the marketplace.', link: '/customer/marketplace' });
      }
    } else if (action === 'REJECT') {
      org.status = 'REJECTED'; org.reviewedBy = req.user.userId; await org.save();
      if (user) {
        await sendKycRejected(user.email, reason).catch(console.error);
        await Notification.create({ userId: user._id, type: 'KYC_REJECTED', title: 'Application Rejected', message: reason || 'Application rejected.', link: '/customer/dashboard' });
      }
    } else {
      org.status = 'REVISION_REQUESTED'; org.flaggedFields = flaggedFields; org.fieldComments = fieldComments; await org.save();
      if (user) {
        await sendRevisionRequested(user.email, flaggedFields).catch(console.error);
        await Notification.create({ userId: user._id, type: 'KYC_REVISION_REQUESTED', title: 'Revision Requested', message: 'Please update your profile and resubmit.', link: '/customer/dashboard' });
      }
    }

    await logAction({ userId: req.user.userId, action: `CUSTOMER_${action}`, targetModel: 'Organization', targetId: org._id, ipAddress: req.ip });
    res.json({ message: `Customer ${action.toLowerCase()}`, status: org.status });
  } catch (err) { next(err); }
};

// ======================= DEMANDS & MATCHING =======================

// GET /api/admin/gpu-demands
const getAdminGpuDemands = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const result = await paginate(GpuDemandRequest, filter, { page: parseInt(page), limit: parseInt(limit), sort: '-createdAt', populate: [{ path: 'organizationId', select: 'type status' }, { path: 'submittedBy', select: 'email' }] });
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/gpu-demands/:id
const getAdminGpuDemand = async (req, res, next) => {
  try {
    const demand = await GpuDemandRequest.findById(req.params.id).populate('organizationId').populate('submittedBy', 'email').populate('matchedClusterIds');
    if (!demand) return res.status(404).json({ error: 'GPU demand not found' });
    res.json(demand);
  } catch (err) { next(err); }
};

// PUT /api/admin/gpu-demands/:id/match
const matchGpuDemand = async (req, res, next) => {
  try {
    const { clusterIds } = req.body;
    const demand = await GpuDemandRequest.findByIdAndUpdate(req.params.id, { $set: { matchedClusterIds: clusterIds, status: 'MATCHED' } }, { new: true });
    if (!demand) return res.status(404).json({ error: 'GPU demand not found' });

    await logAction({ userId: req.user.userId, action: 'MATCH_GPU_DEMAND', targetModel: 'GpuDemandRequest', targetId: demand._id, changes: { clusterIds }, ipAddress: req.ip });
    res.json(demand);
  } catch (err) { next(err); }
};

// GET /api/admin/dc-requests
const getAdminDcRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const result = await paginate(DcCapacityRequest, filter, { page: parseInt(page), limit: parseInt(limit), sort: '-createdAt', populate: [{ path: 'organizationId', select: 'type status' }, { path: 'submittedBy', select: 'email' }] });
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/dc-requests/:id
const getAdminDcRequest = async (req, res, next) => {
  try {
    const request = await DcCapacityRequest.findById(req.params.id).populate('organizationId').populate('submittedBy', 'email').populate('matchedListingIds');
    if (!request) return res.status(404).json({ error: 'DC request not found' });
    res.json(request);
  } catch (err) { next(err); }
};

// PUT /api/admin/dc-requests/:id/match
const matchDcRequest = async (req, res, next) => {
  try {
    const { listingIds } = req.body;
    const request = await DcCapacityRequest.findByIdAndUpdate(req.params.id, { $set: { matchedListingIds: listingIds, status: 'MATCHED' } }, { new: true });
    if (!request) return res.status(404).json({ error: 'DC request not found' });

    await logAction({ userId: req.user.userId, action: 'MATCH_DC_REQUEST', targetModel: 'DcCapacityRequest', targetId: request._id, changes: { listingIds }, ipAddress: req.ip });
    res.json(request);
  } catch (err) { next(err); }
};

// ======================= DOCUMENTS =======================

// PUT /api/admin/documents/:docId/status
const updateDocumentStatus = async (req, res, next) => {
  try {
    const { received, reviewed, reviewComment } = req.body;

    // Try DcDocument first, then GpuClusterDocument
    let doc = await DcDocument.findByIdAndUpdate(req.params.docId, { $set: { received, reviewed, reviewComment } }, { new: true });
    if (!doc) {
      doc = await GpuClusterDocument.findByIdAndUpdate(req.params.docId, { $set: { received, reviewed, reviewComment } }, { new: true });
    }
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) { next(err); }
};

// ======================= ANALYTICS =======================

// GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalSuppliers, totalCustomers,
      totalDcListings, approvedDcListings, pendingDcListings,
      totalGpuClusters, approvedGpuClusters,
      totalGpuDemands, totalDcRequests,
      pendingQueue,
    ] = await Promise.all([
      Organization.countDocuments({ type: { $in: ['SUPPLIER', 'BROKER'] }, status: 'APPROVED' }),
      Organization.countDocuments({ type: 'CUSTOMER', status: 'APPROVED' }),
      DcApplication.countDocuments(),
      DcApplication.countDocuments({ status: 'APPROVED' }),
      DcApplication.countDocuments({ status: { $in: ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'] } }),
      GpuClusterListing.countDocuments(),
      GpuClusterListing.countDocuments({ status: 'APPROVED' }),
      GpuDemandRequest.countDocuments(),
      DcCapacityRequest.countDocuments(),
      QueueItem.countDocuments({ status: { $in: ['NEW', 'IN_REVIEW', 'RESUBMITTED'] } }),
    ]);

    // MW totals from approved DC sites
    const DcSiteModel = require('../models/DcSite');
    const mwAgg = await DcSiteModel.aggregate([
      { $lookup: { from: 'dcapplications', localField: 'dcApplicationId', foreignField: '_id', as: 'app' } },
      { $match: { 'app.status': 'APPROVED' } },
      { $group: { _id: null, totalMw: { $sum: '$totalItLoadMw' } } },
    ]);
    const totalApprovedMw = mwAgg[0]?.totalMw || 0;

    res.json({
      totalSuppliers, totalCustomers,
      totalDcListings, approvedDcListings, pendingDcListings,
      totalGpuClusters, approvedGpuClusters,
      totalGpuDemands, totalDcRequests,
      pendingQueue, totalApprovedMw,
    });
  } catch (err) { next(err); }
};

// ======================= READERS =======================

// GET /api/admin/readers
const getReaders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await paginate(User, { role: 'reader' }, {
      page: parseInt(page), limit: parseInt(limit), sort: '-createdAt',
    });
    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/admin/readers
const createReader = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'User with this email already exists' });

    const reader = await User.create({ email, role: 'reader' });

    await sendEmail(email, 'ICX Portal — Reader Access', `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2>ICX Portal</h2>
        <p>You have been granted reader access to the ICX Portal marketplace.</p>
        <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; padding: 12px 24px; background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">Log In</a>
      </div>`).catch(console.error);

    await logAction({ userId: req.user.userId, action: 'CREATE_READER', targetModel: 'User', targetId: reader._id, ipAddress: req.ip });
    res.status(201).json(reader);
  } catch (err) { next(err); }
};

// GET /api/admin/readers/:id
const getReader = async (req, res, next) => {
  try {
    const reader = await User.findOne({ _id: req.params.id, role: 'reader' });
    if (!reader) return res.status(404).json({ error: 'Reader not found' });
    res.json(reader);
  } catch (err) { next(err); }
};

// PUT /api/admin/readers/:id
const updateReader = async (req, res, next) => {
  try {
    const reader = await User.findOne({ _id: req.params.id, role: 'reader' });
    if (!reader) return res.status(404).json({ error: 'Reader not found' });

    if (req.body.isActive !== undefined) reader.isActive = req.body.isActive;
    await reader.save();

    await logAction({ userId: req.user.userId, action: 'UPDATE_READER', targetModel: 'User', targetId: reader._id, ipAddress: req.ip });
    res.json(reader);
  } catch (err) { next(err); }
};

// DELETE /api/admin/readers/:id
const deleteReader = async (req, res, next) => {
  try {
    await User.deleteOne({ _id: req.params.id, role: 'reader' });
    await logAction({ userId: req.user.userId, action: 'DELETE_READER', changes: { userId: req.params.id }, ipAddress: req.ip });
    res.json({ message: 'Reader removed' });
  } catch (err) { next(err); }
};

// POST /api/admin/readers/:id/resend
const resendReaderWelcome = async (req, res, next) => {
  try {
    const reader = await User.findOne({ _id: req.params.id, role: 'reader' });
    if (!reader) return res.status(404).json({ error: 'Reader not found' });

    await sendEmail(reader.email, 'ICX Portal — Reader Access (Resent)', `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2>ICX Portal</h2><p>Your reader access to ICX Portal has been confirmed.</p>
        <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; padding: 12px 24px; background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">Log In</a>
      </div>`).catch(console.error);

    res.json({ message: 'Welcome email resent' });
  } catch (err) { next(err); }
};

module.exports = {
  getQueue, getQueueItem,
  getSuppliers, getSupplier, reviewSupplierKyc,
  getDcListings, getDcListing, reviewDcListing,
  getGpuClusters, getGpuCluster, reviewGpuCluster,
  getCustomers, getCustomer, verifyCustomer,
  getAdminGpuDemands, getAdminGpuDemand, matchGpuDemand,
  getAdminDcRequests, getAdminDcRequest, matchDcRequest,
  updateDocumentStatus,
  getAnalytics,
  getReaders, createReader, getReader, updateReader, deleteReader, resendReaderWelcome,
};
