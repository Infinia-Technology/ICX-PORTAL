const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const { sendEmail } = require('../services/email.service');

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

// ======================= QUEUE =======================

// GET /api/admin/queue
const getQueue = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const result = await paginatePrisma(prisma.queueItem, where, page, limit, {
      assigned_to: { select: { email: true, role: true } },
      listing: true
    });
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/queue/:id
const getQueueItem = async (req, res, next) => {
  try {
    const item = await prisma.queueItem.findUnique({
      where: { id: req.params.id },
      include: { assigned_to: { select: { email: true, role: true } } }
    });
    if (!item) return res.status(404).json({ error: 'Queue item not found' });

    let entity = null;
    if (item.reference_model === 'Organization') {
      entity = await prisma.organization.findUnique({ where: { id: item.reference_id } });
    } else if (item.reference_model === 'Listing' || item.reference_model === 'DcApplication') {
      entity = await prisma.listing.findUnique({
        where: { id: item.reference_id },
        include: { sites: { include: { documents: true, phasing: true } } }
      });
    } else if (item.reference_model === 'Inquiry') {
      entity = await prisma.inquiry.findUnique({ where: { id: item.reference_id } });
    }

    res.json({ ...item, entity });
  } catch (err) { next(err); }
};

// ======================= SUPPLIERS =======================

// GET /api/admin/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const where = { type: { in: ['SUPPLIER', 'BROKER'] } };
    if (status) where.status = status.toUpperCase();
    if (type) where.type = type.toUpperCase();

    const result = await paginatePrisma(prisma.organization, where, page, limit);

    // Map database fields to frontend camelCase
    result.data = result.data.map(org => ({
      ...org,
      _id: org.id,
      contactEmail: org.contact_email,
      vendorType: org.vendor_type,
      mandateStatus: org.mandate_status,
      createdAt: org.created_at,
      updatedAt: org.updated_at
    }));

    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/suppliers/:id
const getSupplier = async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, email: true, role: true, isActive: true } },
        _count: { select: { listings: true } }
      }
    });
    if (!org) return res.status(404).json({ error: 'Supplier not found' });

    const listings = await prisma.listing.findMany({ where: { organization_id: org.id } });
    
    const stats = (type) => ({
      total: listings.filter(l => l.type === type).length,
      approved: listings.filter(l => l.type === type && l.status === 'APPROVED').length,
      pending: listings.filter(l => l.type === type && ['SUBMITTED', 'IN_REVIEW'].includes(l.status)).length,
      archived: listings.filter(l => l.type === type && l.status === 'ARCHIVED').length
    });

    res.json({
      ...org,
      _id: org.id,
      contactEmail: org.contact_email,
      vendorType: org.vendor_type,
      mandateStatus: org.mandate_status,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      listingStats: { dc: stats('DC_SITE'), gpu: stats('GPU_CLUSTER') }
    });
  } catch (err) { next(err); }
};

// PUT /api/admin/suppliers/:id/kyc
const reviewSupplierKyc = async (req, res, next) => {
  try {
    const { action, flaggedFields = [], fieldComments = {}, reason } = req.body;
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (!org) return res.status(404).json({ error: 'Supplier not found' });

    let status = 'PENDING';
    if (action === 'APPROVE') status = 'APPROVED';
    else if (action === 'REJECT') status = 'REJECTED';
    else if (action === 'REQUEST_REVISION') status = 'REVISION_REQUESTED';

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        status,
        flagged_fields: flaggedFields,
        field_comments: fieldComments,
        reviewed_by: req.user.userId,
        approved_at: action === 'APPROVE' ? new Date() : undefined
      }
    });

    // Notify users in the organization
    const users = await prisma.user.findMany({ where: { organization_id: org.id } });
    for (const user of users) {
      await prisma.notification.create({
        data: {
          user_id: user.id,
          type: `KYC_${action}`,
          title: `KYC ${status.replace('_', ' ')}`,
          message: reason || `Your KYC application has been ${status.toLowerCase().replace('_', ' ')}.`,
          link: '/supplier/dashboard'
        }
      });
    }

    await logAction({ userId: req.user.userId, action: `KYC_${action}`, targetModel: 'Organization', targetId: org.id });
    res.json({ message: `KYC ${action.toLowerCase()} successfully`, status: updated.status });
  } catch (err) { next(err); }
};

// ======================= LISTINGS =======================

// GET /api/admin/listings
const getListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status.toUpperCase();

    const result = await paginatePrisma(prisma.listing, where, page, limit, { organization: true });

    // Map database fields to frontend camelCase
    result.data = result.data.map(listing => ({
      ...listing,
      _id: listing.id,
      companyLegalEntity: listing.organization?.company_name || listing.data_center_name || '—',
      contactEmail: listing.organization?.contact_email || '—',
      submittedAt: listing.created_at,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      dataCenterName: listing.data_center_name,
      totalUnits: listing.total_units,
      availableUnits: listing.available_units,
      isArchived: listing.archived_at ? true : false,
      lastActivityAt: listing.updated_at
    }));

    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/listings/:id
const getListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { organization: true, sites: { include: { documents: true, phasing: true } } }
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
};

// PUT /api/admin/listings/:id/review
const reviewListing = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    let status = 'IN_REVIEW';
    if (action === 'APPROVE') status = 'APPROVED';
    else if (action === 'REJECT') status = 'REJECTED';
    else if (action === 'REQUEST_REVISION') status = 'REVISION_REQUESTED';

    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: { status }
    });

    await prisma.notification.create({
      data: {
        user_id: listing.supplier_id,
        type: `LISTING_${action}`,
        title: `Listing ${status}`,
        message: reason || `Your listing ${listing.data_center_name || listing.id} has been ${status.toLowerCase()}.`,
        link: `/marketplace/listing/${listing.id}`
      }
    });

    await logAction({ userId: req.user.userId, action: `LISTING_${action}`, targetModel: 'Listing', targetId: listing.id });
    res.json({ message: `Listing ${action.toLowerCase()}`, status: updated.status });
  } catch (err) { next(err); }
};

// ======================= CUSTOMERS =======================

// GET /api/admin/customers
const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = { type: 'CUSTOMER' };
    if (status) where.status = status.toUpperCase();

    const result = await paginatePrisma(prisma.organization, where, page, limit);
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/admin/customers/:id
const getCustomer = async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, email: true, role: true, isActive: true } }
      }
    });
    if (!org) return res.status(404).json({ error: 'Customer not found' });
    res.json(org);
  } catch (err) { next(err); }
};

// PUT /api/admin/customers/:id/verify
const verifyCustomer = async (req, res, next) => {
  try {
    const { status } = req.body;
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: { status: status.toUpperCase() }
    });
    res.json(org);
  } catch (err) { next(err); }
};

// ======================= INQUIRIES (Demands/Requests) =======================

const getAdminInquiries = (type) => async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = { type };
    if (status) where.status = status;

    const result = await paginatePrisma(prisma.inquiry, where, page, limit, { organization: true });
    res.json(result);
  } catch (err) { next(err); }
};

const getAdminInquiry = async (req, res, next) => {
  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: req.params.id },
      include: { organization: true }
    });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    res.json(inquiry);
  } catch (err) { next(err); }
};

const matchInquiry = async (req, res, next) => {
  try {
    const { listingId } = req.body;
    // Logic for matching could go here, for now just update status or log
    const updated = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: { status: 'MATCHED' }
    });
    res.json(updated);
  } catch (err) { next(err); }
};

// ======================= DOCUMENTATION =======================

const updateDocumentStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    const updated = await prisma.dcDocument.update({
      where: { id: req.params.docId },
      data: { status, admin_comment: comment }
    });
    res.json(updated);
  } catch (err) { next(err); }
};

// ======================= ANALYTICS =======================

const getAnalytics = async (req, res, next) => {
  try {
    const [
      suppliers, customers,
      dcListings, gpuClusters,
      pendingQueue,
      totalMw
    ] = await Promise.all([
      prisma.organization.count({ where: { type: 'SUPPLIER', status: 'APPROVED' } }),
      prisma.organization.count({ where: { type: 'CUSTOMER', status: 'APPROVED' } }),
      prisma.listing.count({ where: { type: 'DC_SITE', status: 'APPROVED' } }),
      prisma.listing.count({ where: { type: 'GPU_CLUSTER', status: 'APPROVED' } }),
      prisma.queueItem.count({ where: { status: { in: ['NEW', 'IN_REVIEW'] } } }),
      prisma.listing.aggregate({
        where: { type: 'DC_SITE', status: 'APPROVED' },
        _sum: { total_mw: true }
      })
    ]);

    res.json({
      totalSuppliers: suppliers,
      totalCustomers: customers,
      approvedDcListings: dcListings,
      approvedGpuClusters: gpuClusters,
      pendingQueue,
      totalApprovedMw: totalMw._sum.total_mw || 0
    });
  } catch (err) { next(err); }
};

// ======================= READERS =======================

const getReaders = async (req, res, next) => {
  try {
    const result = await paginatePrisma(prisma.user, { role: 'reader' }, req.query.page, req.query.limit);
    res.json(result);
  } catch (err) { next(err); }
};

const getReader = async (req, res, next) => {
  try {
    const reader = await prisma.user.findUnique({ where: { id: req.params.id, role: 'reader' } });
    if (!reader) return res.status(404).json({ error: 'Reader not found' });
    res.json(reader);
  } catch (err) { next(err); }
};

const createReader = async (req, res, next) => {
  try {
    const { email } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const reader = await prisma.user.create({ data: { email, role: 'reader' } });
    await sendEmail(email, 'Welcome to ICX Portal', 'You have been granted reader access.');
    
    await logAction({ userId: req.user.userId, action: 'CREATE_READER', targetModel: 'User', targetId: reader.id });
    res.status(201).json(reader);
  } catch (err) { next(err); }
};

const updateReader = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.id, role: 'reader' },
      data: { isActive }
    });
    res.json(updated);
  } catch (err) { next(err); }
};

const deleteReader = async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id, role: 'reader' } });
    res.status(204).end();
  } catch (err) { next(err); }
};

const resendReaderWelcome = async (req, res, next) => {
  try {
    const reader = await prisma.user.findUnique({ where: { id: req.params.id, role: 'reader' } });
    if (!reader) return res.status(404).json({ error: 'Reader not found' });
    await sendEmail(reader.email, 'ICX Portal — Access Reminder', 'You have reader access to the portal.');
    res.json({ message: 'Welcome email resent' });
  } catch (err) { next(err); }
};

const getDcListings = (req, res, next) => {
  req.query.type = 'DC_SITE';
  return getListings(req, res, next);
};

const getGpuClusters = (req, res, next) => {
  req.query.type = 'GPU_CLUSTER';
  return getListings(req, res, next);
};

const getDcListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id: req.params.id, type: 'DC_SITE' },
      include: { organization: true, sites: { include: { documents: true, phasing: true } } }
    });
    if (!listing) return res.status(404).json({ error: 'DC Listing not found' });
    res.json({
      ...listing,
      _id: listing.id,
      companyLegalEntity: listing.organization?.company_name || listing.data_center_name,
      contactEmail: listing.organization?.contact_email,
      dataCenterName: listing.data_center_name,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      isArchived: listing.archived_at ? true : false
    });
  } catch (err) { next(err); }
};

const getGpuCluster = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id: req.params.id, type: 'GPU_CLUSTER' },
      include: { organization: true }
    });
    if (!listing) return res.status(404).json({ error: 'GPU Cluster not found' });
    res.json({
      ...listing,
      _id: listing.id,
      companyLegalEntity: listing.organization?.company_name || listing.data_center_name,
      contactEmail: listing.organization?.contact_email,
      dataCenterName: listing.data_center_name,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      isArchived: listing.archived_at ? true : false
    });
  } catch (err) { next(err); }
};

const reviewDcListing = (req, res, next) => reviewListing(req, res, next);
const reviewGpuCluster = (req, res, next) => reviewListing(req, res, next);

module.exports = {
  getQueue, getQueueItem,
  getSuppliers, getSupplier, reviewSupplierKyc,
  getDcListings, getDcListing, reviewDcListing,
  getGpuClusters, getGpuCluster, reviewGpuCluster,
  getCustomers, getCustomer, verifyCustomer,
  getAdminGpuDemands: getAdminInquiries('GPU_DEMAND'), getAdminGpuDemand: getAdminInquiry, matchGpuDemand: matchInquiry,
  getAdminDcRequests: getAdminInquiries('DC_REQUEST'), getAdminDcRequest: getAdminInquiry, matchDcRequest: matchInquiry,
  updateDocumentStatus,
  getAnalytics,
  getReaders, createReader, getReader, updateReader, deleteReader, resendReaderWelcome
};

