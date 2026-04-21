const { z } = require('zod');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const { sendEmail } = require('../services/email.service');

const MEMBER_ROLES = ['viewer', 'collaborator'];

// ── helpers ────────────────────────────────────────────────────────────────

async function getListing(id) {
  return prisma.listing.findUnique({ where: { id } });
}

// ── GET /admin/listings/:id/members ────────────────────────────────────────
const getMembers = async (req, res, next) => {
  try {
    const listing = await getListing(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const members = await prisma.listingMember.findMany({
      where: { listing_id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    res.json(members.map(m => ({ ...m, _id: m.id })));
  } catch (err) { next(err); }
};

// ── POST /admin/listings/:id/members  (assign existing user) ───────────────
const addMember = async (req, res, next) => {
  try {
    const schema = z.object({
      userId: z.string().uuid('Invalid user ID'),
      role: z.enum(MEMBER_ROLES).default('viewer'),
    });
    const { userId, role } = schema.parse(req.body);

    const listing = await getListing(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Duplicate check — Prisma unique constraint will also catch this, but give a clear message
    const existing = await prisma.listingMember.findUnique({
      where: { listing_id_user_id: { listing_id: req.params.id, user_id: userId } },
    });
    if (existing) return res.status(409).json({ error: 'User is already a member of this listing' });

    const member = await prisma.listingMember.create({
      data: {
        listing_id: req.params.id,
        user_id: userId,
        role,
        added_by: req.user.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await logAction({
      userId: req.user.userId,
      action: 'ADD_LISTING_MEMBER',
      targetModel: 'Listing',
      targetId: req.params.id,
      changes: { userId, role },
      ipAddress: req.ip,
    });

    res.status(201).json({ ...member, _id: member.id });
  } catch (err) { next(err); }
};

// ── POST /admin/listings/:id/invite  (invite by email — creates user if needed) ──
const inviteMember = async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email('Invalid email address').trim().toLowerCase(),
      role: z.enum(MEMBER_ROLES).default('viewer'),
      name: z.string().trim().optional(),
    });
    const { email, role, name } = schema.parse(req.body);

    const listing = await getListing(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Find or create the user
    let user = await prisma.user.findUnique({ where: { email } });
    let userCreated = false;

    if (!user) {
      user = await prisma.user.create({
        data: { email, name: name || null, role: 'viewer', isActive: true },
      });
      userCreated = true;
    }

    // Duplicate check
    const existing = await prisma.listingMember.findUnique({
      where: { listing_id_user_id: { listing_id: req.params.id, user_id: user.id } },
    });
    if (existing) {
      return res.status(409).json({ error: 'This user is already assigned to the listing' });
    }

    const member = await prisma.listingMember.create({
      data: {
        listing_id: req.params.id,
        user_id: user.id,
        role,
        added_by: req.user.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Send notification email
    const listingName = listing.data_center_name || `Listing ${listing.id.slice(0, 8)}`;
    await sendEmail(
      email,
      `Compute Exchange — You've been added to ${listingName}`,
      `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a2e;">Compute Exchange</h2>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>You have been added as a <strong>${role}</strong> to the listing <strong>${listingName}</strong>.</p>
        ${userCreated ? '<p>Your account has been created. You can log in with your email address.</p>' : ''}
        <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;margin-top:16px;">Go to Portal</a>
      </div>`
    ).catch(console.error);

    await logAction({
      userId: req.user.userId,
      action: userCreated ? 'INVITE_NEW_LISTING_MEMBER' : 'INVITE_EXISTING_LISTING_MEMBER',
      targetModel: 'Listing',
      targetId: req.params.id,
      changes: { email, role, userCreated },
      ipAddress: req.ip,
    });

    res.status(201).json({
      ...member,
      _id: member.id,
      userCreated,
      message: userCreated
        ? 'New user created and added to listing'
        : 'Existing user added to listing',
    });
  } catch (err) { next(err); }
};

// ── DELETE /admin/listings/:id/members/:userId ──────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    const existing = await prisma.listingMember.findUnique({
      where: {
        listing_id_user_id: { listing_id: req.params.id, user_id: req.params.userId },
      },
    });
    if (!existing) return res.status(404).json({ error: 'Member not found on this listing' });

    await prisma.listingMember.delete({
      where: {
        listing_id_user_id: { listing_id: req.params.id, user_id: req.params.userId },
      },
    });

    await logAction({
      userId: req.user.userId,
      action: 'REMOVE_LISTING_MEMBER',
      targetModel: 'Listing',
      targetId: req.params.id,
      changes: { userId: req.params.userId },
      ipAddress: req.ip,
    });

    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
};

// ── GET /admin/users/assignable  (users admin can assign to a listing) ──────
const getAssignableUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {
      isActive: true,
      role: { in: ['supplier', 'broker', 'customer', 'reader', 'viewer', 'subordinate'] },
    };
    if (search) where.email = { contains: search, mode: 'insensitive' };

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
      take: 50,
      orderBy: { email: 'asc' },
    });

    res.json(users.map(u => ({ ...u, _id: u.id })));
  } catch (err) { next(err); }
};

module.exports = { getMembers, addMember, inviteMember, removeMember, getAssignableUsers };
