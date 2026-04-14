const { z } = require('zod');
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

    const invite = await prisma.teamInvite.create({
      data: {
        organization_id: req.user.organization_id,
        inviter_id: req.user.userId,
        email,
        role
      }
    });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      await sendEmail(email, 'ICX Portal — Team Invitation', `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1a1a2e;">ICX Portal</h2>
          <p>You have been invited to join an organization on ICX Portal as a team member.</p>
          <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; padding: 12px 24px; background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">Accept Invitation</a>
        </div>
      `).catch(console.error);
    } else {
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
      where: { id: req.params.inviteId, organization_id: req.user.organization_id }
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

module.exports = {
  getProfile, updateProfile, submitKyc,
  getTeam, inviteTeamMember, revokeTeamMember,
  getBrokerCompanies, addBrokerCompany, updateBrokerCompany,
};
