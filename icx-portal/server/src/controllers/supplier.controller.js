const { z } = require('zod');
const Organization = require('../models/Organization');
const User = require('../models/User');
const TeamInvite = require('../models/TeamInvite');
const BrokerDcCompany = require('../models/BrokerDcCompany');
const { logAction } = require('../services/audit.service');
const { sendEmail } = require('../services/email.service');
const { signToken } = require('../services/jwt.service');
const { paginate } = require('../utils/pagination');

// GET /api/supplier/profile
const getProfile = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org);
  } catch (err) { next(err); }
};

// PUT /api/supplier/profile
const updateProfile = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    if (!['REVISION_REQUESTED', 'PENDING', 'REJECTED'].includes(org.status)) {
      return res.status(400).json({ error: 'Profile can only be updated when revision is requested or pending' });
    }

    const allowed = ['vendorType', 'mandateStatus', 'ndaRequired', 'ndaSigned', 'contactEmail', 'contactNumber'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) org[f] = req.body[f]; });
    await org.save();

    await logAction({ userId: req.user.userId, action: 'UPDATE_SUPPLIER_PROFILE', targetModel: 'Organization', targetId: org._id, ipAddress: req.ip });
    res.json(org);
  } catch (err) { next(err); }
};

// POST /api/supplier/profile/submit
const submitKyc = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    if (!['PENDING', 'REVISION_REQUESTED'].includes(org.status)) {
      return res.status(400).json({ error: 'KYC already submitted or approved' });
    }

    org.status = 'KYC_SUBMITTED';
    await org.save();

    // Create queue item
    const { createQueueItem } = require('../services/queue.service');
    await createQueueItem({ type: 'SUPPLIER_KYC', referenceId: org._id, referenceModel: 'Organization' });

    await logAction({ userId: req.user.userId, action: 'SUBMIT_KYC', targetModel: 'Organization', targetId: org._id, ipAddress: req.ip });
    res.json({ message: 'KYC submitted for review', status: org.status });
  } catch (err) { next(err); }
};

// GET /api/supplier/team
const getTeam = async (req, res, next) => {
  try {
    const invites = await TeamInvite.find({ organizationId: req.user.organizationId })
      .populate('invitedBy', 'email');
    res.json(invites);
  } catch (err) { next(err); }
};

// POST /api/supplier/team/invite
const inviteTeamMember = async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email().trim().toLowerCase(),
      permissions: z.array(z.enum(['documents', 'site_details', 'technical', 'commercial', 'phasing', 'financials'])).optional(),
    });
    const { email, permissions = [] } = schema.parse(req.body);

    // Check org is approved
    const org = await Organization.findById(req.user.organizationId);
    if (org?.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Organization must be approved to invite team members' });
    }

    const existing = await TeamInvite.findOne({ organizationId: req.user.organizationId, email, status: 'PENDING' });
    if (existing) return res.status(409).json({ error: 'Invite already sent to this email' });

    const invite = await TeamInvite.create({
      organizationId: req.user.organizationId,
      invitedBy: req.user.userId,
      email,
      permissions,
    });

    // Check if user exists — if yes, create account linkage; if no, send invite
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      // Send invitation email
      await sendEmail(email, 'ICX Portal — Team Invitation', `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1a1a2e;">ICX Portal</h2>
          <p>You have been invited to join an organization on ICX Portal as a team member.</p>
          <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; padding: 12px 24px; background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">Accept Invitation</a>
        </div>
      `).catch(console.error);
    } else {
      // Update existing user's org and role
      existingUser.organizationId = req.user.organizationId;
      existingUser.role = 'subordinate';
      await existingUser.save();
      invite.status = 'ACCEPTED';
      invite.acceptedAt = new Date();
      await invite.save();
    }

    await logAction({ userId: req.user.userId, action: 'INVITE_TEAM_MEMBER', changes: { email }, ipAddress: req.ip });
    res.status(201).json(invite);
  } catch (err) { next(err); }
};

// DELETE /api/supplier/team/:id
const revokeTeamMember = async (req, res, next) => {
  try {
    const invite = await TeamInvite.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!invite) return res.status(404).json({ error: 'Invite not found' });

    invite.status = 'REVOKED';
    await invite.save();

    // Delink user if accepted
    if (invite.status === 'ACCEPTED') {
      await User.updateOne({ email: invite.email, organizationId: req.user.organizationId }, { $unset: { organizationId: 1 } });
    }

    await logAction({ userId: req.user.userId, action: 'REVOKE_TEAM_MEMBER', changes: { email: invite.email }, ipAddress: req.ip });
    res.json({ message: 'Team member access revoked' });
  } catch (err) { next(err); }
};

// GET /api/supplier/broker-companies
const getBrokerCompanies = async (req, res, next) => {
  try {
    const companies = await BrokerDcCompany.find({ brokerId: req.user.organizationId });
    res.json(companies);
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
    const data = schema.parse(req.body);

    const company = await BrokerDcCompany.create({ ...data, brokerId: req.user.organizationId });
    await logAction({ userId: req.user.userId, action: 'ADD_BROKER_COMPANY', targetModel: 'BrokerDcCompany', targetId: company._id, ipAddress: req.ip });
    res.status(201).json(company);
  } catch (err) { next(err); }
};

// PUT /api/supplier/broker-companies/:id
const updateBrokerCompany = async (req, res, next) => {
  try {
    const company = await BrokerDcCompany.findOne({ _id: req.params.id, brokerId: req.user.organizationId });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const allowed = ['legalEntity', 'officeAddress', 'countryOfIncorp', 'contactName', 'contactEmail', 'contactMobile'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) company[f] = req.body[f]; });
    await company.save();

    await logAction({ userId: req.user.userId, action: 'UPDATE_BROKER_COMPANY', targetModel: 'BrokerDcCompany', targetId: company._id, ipAddress: req.ip });
    res.json(company);
  } catch (err) { next(err); }
};

module.exports = {
  getProfile, updateProfile, submitKyc,
  getTeam, inviteTeamMember, revokeTeamMember,
  getBrokerCompanies, addBrokerCompany, updateBrokerCompany,
};
