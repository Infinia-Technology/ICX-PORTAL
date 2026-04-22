const { z } = require('zod');
const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const { sendEmail, sendKycApproved, sendKycRejected, sendRevisionRequested, sendAdminAlert } = require('../services/email.service');

/** Fetch emails of all active admins and superadmins */
const getAdminEmails = async () => {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'superadmin'] }, isActive: true },
    select: { email: true },
  });
  return admins.map(a => a.email);
};

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
    });

    // Separate items by reference_model
    const listingIds = result.data
      .filter(item => item.reference_model === 'Listing')
      .map(item => item.reference_id);
    const orgIds = result.data
      .filter(item => item.reference_model === 'Organization')
      .map(item => item.reference_id);
    const inquiryIds = result.data
      .filter(item => item.reference_model === 'Inquiry')
      .map(item => item.reference_id);

    let listingsMap = {};
    if (listingIds.length > 0) {
      const listings = await prisma.listing.findMany({
        where: { id: { in: listingIds } },
        include: {
          supplier: { select: { email: true, role: true, name: true } },
          organization: { select: { company_name: true, type: true } }
        }
      });
      listingsMap = Object.fromEntries(listings.map(l => [l.id, l]));
    }

    let orgsMap = {};
    if (orgIds.length > 0) {
      const orgs = await prisma.organization.findMany({
        where: { id: { in: orgIds } },
        include: { users: { select: { email: true, role: true }, take: 1 } }
      });
      orgsMap = Object.fromEntries(orgs.map(o => [o.id, o]));
    }

    let inquiriesMap = {};
    if (inquiryIds.length > 0) {
      const inquiries = await prisma.inquiry.findMany({
        where: { id: { in: inquiryIds } },
        include: {
          user: { select: { email: true, role: true } },
          organization: { select: { company_name: true } }
        }
      });
      inquiriesMap = Object.fromEntries(inquiries.map(i => [i.id, i]));
    }

    result.data = result.data.map(item => {
      let submitterEmail = '', submitterRole = '', organizationName = '';
      if (item.reference_model === 'Listing' && listingsMap[item.reference_id]) {
        const listing = listingsMap[item.reference_id];
        submitterEmail = listing.supplier?.email || '';
        submitterRole = listing.supplier?.role || '';
        organizationName = listing.organization?.company_name || listing.data_center_name || '';
      } else if (item.reference_model === 'Organization' && orgsMap[item.reference_id]) {
        const org = orgsMap[item.reference_id];
        submitterEmail = org.users[0]?.email || '';
        submitterRole = org.users[0]?.role || '';
        organizationName = org.company_name || '';
      } else if (item.reference_model === 'Inquiry' && inquiriesMap[item.reference_id]) {
        const inquiry = inquiriesMap[item.reference_id];
        submitterEmail = inquiry.user?.email || '';
        submitterRole = inquiry.user?.role || '';
        organizationName = inquiry.organization?.company_name || '';
      }
      return { ...item, _id: item.id, createdAt: item.created_at, updatedAt: item.updated_at, submitterEmail, submitterRole, organizationName };
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

      // Send email to the user
      if (action === 'APPROVE') {
        sendKycApproved(user.email).catch(console.error);
      } else if (action === 'REJECT') {
        sendKycRejected(user.email, reason).catch(console.error);
      } else if (action === 'REQUEST_REVISION' && flaggedFields.length > 0) {
        sendRevisionRequested(user.email, flaggedFields).catch(console.error);
      }
    }

    // Notify admins
    getAdminEmails().then(adminEmails => {
      sendAdminAlert(
        adminEmails,
        `KYC ${action}`,
        `KYC ${action.replace('_', ' ')}`,
        `KYC for organization <strong>${org.company_name || org.id}</strong> has been ${action.toLowerCase().replace('_', ' ')}.`,
        `${process.env.CLIENT_URL || ''}/admin/suppliers/${org.id}`
      ).catch(console.error);
    }).catch(console.error);

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
    result.data = result.data.map(listing => {
      const baseMapping = {
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
      };

      // Flatten specifications for GPU listings
      if (listing.type === 'GPU_CLUSTER' && listing.specifications) {
        return {
          ...baseMapping,
          vendorName: listing.specifications.gpuServerModel || listing.data_center_name || '—',
          gpuTechnology: listing.specifications.gpuTechnology || '—',
          singleClusterSize: listing.specifications.singleClusterSize || null,
          country: listing.country || '—'
        };
      }

      // For DC listings
      if (listing.type === 'DC_SITE') {
        return {
          ...baseMapping,
          country: listing.country || '—'
        };
      }

      return baseMapping;
    });

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

    result.data = result.data.map(org => ({
      ...org,
      _id: org.id,
      companyName: org.company_name,
      contactEmail: org.contact_email,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    }));

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
    res.json({
      ...org,
      _id: org.id,
      companyName: org.company_name,
      companyType: org.company_type,
      contactEmail: org.contact_email,
      contactNumber: org.contact_number,
      industrySector: org.industry_sector,
      taxVatNumber: org.tax_vat_number,
      companyAddress: org.company_address,
      authSignatoryName: org.auth_signatory_name,
      authSignatoryTitle: org.auth_signatory_title,
      billingContactName: org.billing_contact_name,
      billingContactEmail: org.billing_contact_email,
      primaryUseCases: org.primary_use_cases,
      locationPreferences: org.location_preferences,
      sovereigntyReqs: org.sovereignty_reqs,
      complianceReqs: org.compliance_reqs,
      budgetRange: org.budget_range,
      vendorType: org.vendor_type,
      mandateStatus: org.mandate_status,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    });
  } catch (err) { next(err); }
};

// POST /api/admin/customers
const createCustomer = async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email('Invalid email address').trim().toLowerCase(),
      companyName: z.string().trim().min(1, 'Company name is required'),
      companyType: z.string().optional(),
      jurisdiction: z.string().optional(),
      industrySector: z.string().optional(),
      companyAddress: z.string().optional(),
      authSignatoryName: z.string().optional(),
      authSignatoryTitle: z.string().optional(),
      taxVatNumber: z.string().optional(),
      primaryUseCases: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);

    // Check if user with email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

    // Create org + user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          type: 'CUSTOMER',
          status: 'APPROVED',
          company_name: data.companyName,
          company_type: data.companyType || null,
          jurisdiction: data.jurisdiction || null,
          industry_sector: data.industrySector || null,
          company_address: data.companyAddress || null,
          auth_signatory_name: data.authSignatoryName || null,
          auth_signatory_title: data.authSignatoryTitle || null,
          tax_vat_number: data.taxVatNumber || null,
          contact_email: data.email,
          primary_use_cases: data.primaryUseCases || [],
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          role: 'customer',
          organization_id: org.id,
          name: data.authSignatoryName || null,
        },
      });

      return { org, user };
    });

    await logAction({ userId: req.user.userId, action: 'CREATE_CUSTOMER', targetModel: 'Organization', targetId: result.org.id, ipAddress: req.ip });

    res.status(201).json({
      _id: result.org.id,
      companyName: result.org.company_name,
      contactEmail: result.org.contact_email,
      status: result.org.status,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
};

// PUT /api/admin/customers/:id/verify
const verifyCustomer = async (req, res, next) => {
  try {
    const { action, status } = req.body;
    const ACTION_TO_STATUS = {
      APPROVE: 'APPROVED',
      REJECT: 'REJECTED',
      REQUEST_REVISION: 'REVISION_REQUESTED',
    };
    const newStatus = action ? (ACTION_TO_STATUS[action] || action) : status?.toUpperCase();
    if (!newStatus) return res.status(400).json({ error: 'action or status is required' });
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: { status: newStatus }
    });
    res.json(org);
  } catch (err) { next(err); }
};

// ======================= INQUIRIES (Demands/Requests) =======================

const createAdminGpuDemand = async (req, res, next) => {
  try {
    const demand = await prisma.inquiry.create({
      data: {
        user_id: req.user.userId,
        type: 'GPU_DEMAND',
        status: 'SUBMITTED',
        specifications: req.body,
      }
    });
    await logAction({ userId: req.user.userId, action: 'ADMIN_CREATE_GPU_DEMAND', targetModel: 'Inquiry', targetId: demand.id, ipAddress: req.ip });
    res.status(201).json({ ...demand, _id: demand.id });
  } catch (err) { next(err); }
};

const getAdminInquiries = (type) => async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = { type };
    if (status) where.status = status;

    const result = await paginatePrisma(prisma.inquiry, where, page, limit, { organization: true });

    result.data = result.data.map(item => ({
      ...item,
      ...(item.specifications || {}),
      _id: item.id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      organizationName: item.organization?.company_name || null,
    }));

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
      approvedDcListings, pendingDcListings,
      approvedGpuClusters,
      pendingQueue,
      totalMw,
      totalGpuDemands,
      submittedGpuDemands,
      matchedGpuDemands,
    ] = await Promise.all([
      prisma.organization.count({ where: { type: 'SUPPLIER', status: 'APPROVED' } }),
      prisma.organization.count({ where: { type: 'CUSTOMER', status: 'APPROVED' } }),
      prisma.listing.count({ where: { type: 'DC_SITE', status: 'APPROVED', archived_at: null } }),
      prisma.listing.count({ where: { type: 'DC_SITE', status: { in: ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED', 'REVISION_REQUESTED'] }, archived_at: null } }),
      prisma.listing.count({ where: { type: 'GPU_CLUSTER', status: 'APPROVED', archived_at: null } }),
      prisma.queueItem.count({ where: { status: { in: ['NEW', 'IN_REVIEW', 'RESUBMITTED'] } } }),
      prisma.listing.aggregate({
        where: { type: 'DC_SITE', status: 'APPROVED' },
        _sum: { total_mw: true }
      }),
      prisma.inquiry.count({ where: { type: 'GPU_DEMAND' } }),
      prisma.inquiry.count({ where: { type: 'GPU_DEMAND', status: 'SUBMITTED' } }),
      prisma.inquiry.count({ where: { type: 'GPU_DEMAND', status: 'MATCHED' } }),
    ]);

    res.json({
      totalSuppliers: suppliers,
      totalCustomers: customers,
      approvedDcListings,
      pendingDcListings,
      approvedGpuClusters,
      pendingQueue,
      totalApprovedMw: totalMw._sum.total_mw || 0,
      totalGpuDemands,
      submittedGpuDemands,
      matchedGpuDemands,
    });
  } catch (err) { next(err); }
};

// ======================= ADMIN USER MANAGEMENT =======================

// Roles admin is allowed to create/manage (not superadmin, not admin)
const ADMIN_MANAGEABLE_ROLES = ['supplier', 'broker', 'customer', 'reader', 'viewer', 'subordinate'];

// GET /admin/manage-users
const getAdminUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const where = { role: { in: ADMIN_MANAGEABLE_ROLES } };
    if (role && ADMIN_MANAGEABLE_ROLES.includes(role)) where.role = role;
    if (search) where.email = { contains: search, mode: 'insensitive' };

    const result = await paginatePrisma(prisma.user, where, page, limit, {
      organization: { select: { company_name: true, type: true, status: true } }
    });

    result.data = result.data.map(u => ({
      ...u,
      _id: u.id,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
    }));

    res.json(result);
  } catch (err) { next(err); }
};

// POST /admin/manage-users
const createAdminUser = async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().trim().optional(),
      email: z.string().email('Invalid email address').trim().toLowerCase(),
      role: z.enum(ADMIN_MANAGEABLE_ROLES, {
        errorMap: () => ({ message: `Admins can only assign: ${ADMIN_MANAGEABLE_ROLES.join(', ')}` }),
      }),
    });
    const { name, email, role } = schema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

    // Roles that need an Organization (so team invites, listings, demands all work)
    const ORG_ROLES = { supplier: 'SUPPLIER', broker: 'BROKER', customer: 'CUSTOMER' };
    const orgType = ORG_ROLES[role];

    const user = await prisma.$transaction(async (tx) => {
      let organization_id = null;
      if (orgType) {
        const org = await tx.organization.create({
          data: {
            type: orgType,
            status: 'PENDING',
            contact_email: email,
            company_name: name || null,
          }
        });
        organization_id = org.id;
      }
      return tx.user.create({
        data: { name: name || null, email, role, organization_id }
      });
    });

    // Notify the new user by email (fire-and-forget — don't fail the request if email fails)
    sendEmail(
      email,
      'Welcome to Compute Exchange',
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a2e;">Compute Exchange</h2>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>An account has been created for you with the role <strong>${role}</strong>.</p>
        <p>You can log in using your email address.</p>
        <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;margin-top:16px;">Log in to Portal</a>
      </div>`
    ).catch(console.error);

    await logAction({
      userId: req.user.userId,
      action: 'ADMIN_CREATE_USER',
      targetModel: 'User',
      targetId: user.id,
      changes: { email, role },
      ipAddress: req.ip,
    });

    res.status(201).json({ ...user, _id: user.id });
  } catch (err) { next(err); }
};

// PUT /admin/manage-users/:id  (toggle active only — admins cannot change roles)
const toggleAdminUser = async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (!ADMIN_MANAGEABLE_ROLES.includes(target.role)) {
      return res.status(403).json({ error: 'You cannot modify a superadmin or admin account' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive },
    });

    await logAction({ userId: req.user.userId, action: 'ADMIN_TOGGLE_USER', targetModel: 'User', targetId: user.id, changes: { isActive: req.body.isActive }, ipAddress: req.ip });
    res.json({ ...user, _id: user.id });
  } catch (err) { next(err); }
};

// DELETE /admin/manage-users/:id
const deleteAdminUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (!ADMIN_MANAGEABLE_ROLES.includes(target.role)) {
      return res.status(403).json({ error: 'You cannot delete a superadmin or admin account' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    await logAction({ userId: req.user.userId, action: 'ADMIN_DELETE_USER', changes: { userId: req.params.id, email: target.email }, ipAddress: req.ip });
    res.json({ message: 'User deleted' });
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
    await sendEmail(email, 'Welcome to Compute Exchange', 'You have been granted reader access.');
    
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
    await sendEmail(reader.email, 'Compute Exchange — Access Reminder', 'You have reader access to the portal.');
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
  getCustomers, getCustomer, createCustomer, verifyCustomer,
  createAdminGpuDemand,
  getAdminGpuDemands: getAdminInquiries('GPU_DEMAND'), getAdminGpuDemand: getAdminInquiry, matchGpuDemand: matchInquiry,
  updateDocumentStatus,
  getAnalytics,
  getReaders, createReader, getReader, updateReader, deleteReader, resendReaderWelcome,
  getAdminUsers, createAdminUser, toggleAdminUser, deleteAdminUser,
};

