const { z } = require('zod');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const { sendEmail } = require('../services/email.service');
const { createQueueItem } = require('../services/queue.service');

// GET /api/supplier/profile
const getProfile = async (req, res, next) => {
  try {
    if (!req.user.organization_id) return res.status(404).json({ error: 'No organization linked to user' });
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organization_id }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json({ ...org, _id: org.id });
  } catch (err) { next(err); }
};

// PUT /api/supplier/profile
const updateProfile = async (req, res, next) => {
  try {
    if (!req.user.organization_id) return res.status(404).json({ error: 'No organization linked to user' });
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organization_id }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    if (!['REVISION_REQUESTED', 'SUBMITTED', 'REJECTED'].includes(org.status)) {
      return res.status(400).json({ error: 'Profile can only be updated when revision is requested or submitted' });
    }

    const data = {};
    const allowed = {
      vendorType: 'vendor_type',
      mandateStatus: 'mandate_status',
      ndaRequired: 'nda_required',
      ndaSigned: 'nda_signed',
      contactEmail: 'contact_email',
      contactNumber: 'contact_number'
    };
    
    Object.keys(allowed).forEach((f) => {
      if (req.body[f] !== undefined) data[allowed[f]] = req.body[f];
    });

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data
    });

    await logAction({ userId: req.user.userId, action: 'UPDATE_SUPPLIER_PROFILE', targetModel: 'Organization', targetId: updated.id, ipAddress: req.ip });
    res.json({ ...updated, _id: updated.id });
  } catch (err) { next(err); }
};

// POST /api/supplier/profile/submit
const submitKyc = async (req, res, next) => {
  try {
    if (!req.user.organization_id) return res.status(404).json({ error: 'No organization linked to user' });
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organization_id }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    if (org.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Organization is already submitted or approved' });
    }

    // Organization is already in SUBMITTED status, no further action needed
    await logAction({ userId: req.user.userId, action: 'SUBMIT_KYC', targetModel: 'Organization', targetId: org.id, ipAddress: req.ip });
    res.json({ message: 'Your organization is ready. You can now submit listings.', status: org.status, _id: org.id });
  } catch (err) { next(err); }
};

// GET /api/supplier/team
const getTeam = async (req, res, next) => {
  try {
    if (!req.user.organization_id) return res.json([]);
    const invites = await prisma.teamInvite.findMany({
      where: { organization_id: req.user.organization_id },
      include: { inviter: { select: { email: true } } }
    });
    res.json(invites.map(i => ({ ...i, _id: i.id, invitedBy: i.inviter })));
  } catch (err) { next(err); }
};

// POST /api/supplier/team/invite
const inviteTeamMember = async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email().trim().toLowerCase(),
      role: z.string().default('subordinate'),
    });
    const { email, role } = schema.parse(req.body);

    if (!req.user.organization_id) return res.status(403).json({ error: 'User not linked to an organization' });
    
    const org = await prisma.organization.findUnique({ where: { id: req.user.organization_id } });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const existingInvite = await prisma.teamInvite.findFirst({
      where: { organization_id: req.user.organization_id, email, status: 'PENDING' }
    });
    if (existingInvite) return res.status(409).json({ error: 'Invite already sent to this email' });

    // Generate a secure random token (expires in 48h)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invite = await prisma.teamInvite.create({
      data: {
        organization_id: req.user.organization_id,
        inviter_id: req.user.userId,
        email,
        role,
        token,
        expires_at: expiresAt,
      }
    });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      // New user — send invite link so they can create their account
      const inviteLink = `${process.env.CLIENT_URL}/invite/${token}`;
      await sendEmail(email, 'Compute Exchange — Team Invitation', `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1a1a2e;">Compute Exchange</h2>
          <p>You have been invited to join an organization on Compute Exchange as a <strong>${role}</strong>.</p>
          <p>Click the button below to accept the invitation. This link expires in 48 hours.</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">Accept Invitation</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">If the button doesn't work, copy this link: ${inviteLink}</p>
        </div>
      `).catch(console.error);
    } else {
      // Existing user — link them directly and mark accepted
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { organization_id: req.user.organization_id, role: role }
      });
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', accepted_at: new Date() }
      });
    }

    await logAction({ userId: req.user.userId, action: 'INVITE_TEAM_MEMBER', changes: { email }, ipAddress: req.ip });
    res.status(201).json({ ...invite, _id: invite.id });
  } catch (err) { next(err); }
};

// DELETE /api/supplier/team/:inviteId
const revokeTeamMember = async (req, res, next) => {
  try {
    const invite = await prisma.teamInvite.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id }
    });
    if (!invite) return res.status(404).json({ error: 'Invite not found' });

    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: 'REVOKED' }
    });

    if (invite.status === 'ACCEPTED') {
      await prisma.user.updateMany({
        where: { email: invite.email, organization_id: req.user.organization_id },
        data: { organization_id: null }
      });
    }

    await logAction({ userId: req.user.userId, action: 'REVOKE_TEAM_MEMBER', changes: { email: invite.email }, ipAddress: req.ip });
    res.json({ message: 'Team member access revoked' });
  } catch (err) { next(err); }
};

// GET /api/supplier/broker-companies
const getBrokerCompanies = async (req, res, next) => {
  try {
    if (!req.user.organization_id) return res.json([]);
    const companies = await prisma.brokerDcCompany.findMany({
      where: { organization_id: req.user.organization_id }
    });
    res.json(companies.map(c => ({ ...c, _id: c.id })));
  } catch (err) { next(err); }
};

// POST /api/supplier/broker-companies
const addBrokerCompany = async (req, res, next) => {
  try {
    const schema = z.object({
      legalEntity: z.string().min(1),
      officeAddress: z.string().min(1),
      countryOfIncorp: z.string().min(1),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional().or(z.literal('')),
      contactMobile: z.string().optional(),
    });
    const body = schema.parse(req.body);

    if (!req.user.organization_id) return res.status(403).json({ error: 'User not linked to an organization' });

    const company = await prisma.brokerDcCompany.create({
      data: {
        organization_id: req.user.organization_id,
        legal_entity: body.legalEntity,
        office_address: body.officeAddress,
        country_of_incorp: body.countryOfIncorp,
        contact_name: body.contactName,
        contact_email: body.contactEmail,
        contact_mobile: body.contactMobile
      }
    });
    
    await logAction({ userId: req.user.userId, action: 'ADD_BROKER_COMPANY', targetModel: 'BrokerDcCompany', targetId: company.id, ipAddress: req.ip });
    res.status(201).json({ ...company, _id: company.id });
  } catch (err) { next(err); }
};

// UPDATE /api/supplier/broker-companies/:id
const updateBrokerCompany = async (req, res, next) => {
  try {
    const company = await prisma.brokerDcCompany.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id }
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const data = {};
    const allowed = {
      legalEntity: 'legal_entity',
      officeAddress: 'office_address',
      countryOfIncorp: 'country_of_incorp',
      contactName: 'contact_name',
      contactEmail: 'contact_email',
      contactMobile: 'contact_mobile'
    };
    
    Object.keys(allowed).forEach((f) => {
      if (req.body[f] !== undefined) data[allowed[f]] = req.body[f];
    });

    const updated = await prisma.brokerDcCompany.update({
      where: { id: company.id },
      data
    });

    await logAction({ userId: req.user.userId, action: 'UPDATE_BROKER_COMPANY', targetModel: 'BrokerDcCompany', targetId: updated.id, ipAddress: req.ip });
    res.json({ ...updated, _id: updated.id });
  } catch (err) { next(err); }
};

// GET /api/supplier/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [
      totalDcListings, approvedDcListings, pendingDcListings, draftDcListings, rejectedDcListings,
      totalGpuListings, approvedGpuListings, pendingGpuListings, draftGpuListings,
      totalInventory, availableInventory, reservedInventory, soldInventory,
    ] = await Promise.all([
      prisma.listing.count({ where: { supplier_id: userId, type: 'DC_SITE', archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'DC_SITE', status: 'APPROVED', archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'DC_SITE', status: { in: ['SUBMITTED', 'IN_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED'] }, archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'DC_SITE', status: 'DRAFT', archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'DC_SITE', status: 'REJECTED', archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'GPU_CLUSTER', total_units: { lte: 0 }, archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'GPU_CLUSTER', status: 'APPROVED', total_units: { lte: 0 }, archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'GPU_CLUSTER', status: { in: ['SUBMITTED', 'IN_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED'] }, total_units: { lte: 0 }, archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'GPU_CLUSTER', status: 'DRAFT', total_units: { lte: 0 }, archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'GPU_CLUSTER', total_units: { gt: 0 }, archived_at: null } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'GPU_CLUSTER', status: 'AVAILABLE', total_units: { gt: 0 } } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'GPU_CLUSTER', status: 'RESERVED', total_units: { gt: 0 } } }),
      prisma.listing.count({ where: { supplier_id: userId, type: 'GPU_CLUSTER', status: 'SOLD', total_units: { gt: 0 } } }),
    ]);
    res.json({
      totalDcListings, approvedDcListings, pendingDcListings, draftDcListings, rejectedDcListings,
      totalGpuListings, approvedGpuListings, pendingGpuListings, draftGpuListings,
      totalInventory, availableInventory, reservedInventory, soldInventory,
    });
  } catch (err) { next(err); }
};

module.exports = {
  getProfile, updateProfile, submitKyc,
  getTeam, inviteTeamMember, revokeTeamMember,
  getBrokerCompanies, addBrokerCompany, updateBrokerCompany,
  getAnalytics,
};
