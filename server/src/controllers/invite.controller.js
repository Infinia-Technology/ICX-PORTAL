const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');

// GET /api/invites/:token
// Public — verify an invite token and return invite details (no auth required)
const getInvite = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: {
        organization: { select: { company_name: true, contact_email: true } },
        inviter: { select: { email: true, name: true } },
      },
    });

    if (!invite) return res.status(404).json({ error: 'Invite not found or link is invalid' });
    if (invite.status !== 'PENDING') return res.status(409).json({ error: `Invite has already been ${invite.status.toLowerCase()}` });
    if (invite.expires_at && new Date() > invite.expires_at) {
      return res.status(410).json({ error: 'Invite link has expired. Please ask for a new invite.' });
    }

    res.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      organizationName: invite.organization?.company_name || 'Unknown Organization',
      inviterEmail: invite.inviter?.email || '',
      expiresAt: invite.expires_at,
    });
  } catch (err) { next(err); }
};

// POST /api/invites/:token/accept
// Public — accept the invite, create or link user account
const acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { name } = req.body; // optional display name

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: { organization: { select: { id: true, company_name: true } } },
    });

    if (!invite) return res.status(404).json({ error: 'Invite not found or link is invalid' });
    if (invite.status !== 'PENDING') return res.status(409).json({ error: `Invite has already been ${invite.status.toLowerCase()}` });
    if (invite.expires_at && new Date() > invite.expires_at) {
      return res.status(410).json({ error: 'Invite link has expired' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });

    if (existingUser) {
      // Link existing user to the org with the assigned role
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          organization_id: invite.organization_id,
          role: invite.role,
          ...(name ? { name } : {}),
        },
      });
    } else {
      // Create a new user account for this email
      await prisma.user.create({
        data: {
          email: invite.email,
          role: invite.role,
          organization_id: invite.organization_id,
          name: name || null,
          isActive: true,
        },
      });
    }

    // Mark invite as accepted
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', accepted_at: new Date() },
    });

    await logAction({
      action: 'ACCEPT_TEAM_INVITE',
      targetModel: 'TeamInvite',
      targetId: invite.id,
      changes: { email: invite.email, role: invite.role, organizationId: invite.organization_id },
    });

    res.json({
      message: 'Invite accepted. You can now log in with your email.',
      email: invite.email,
      organizationName: invite.organization?.company_name,
    });
  } catch (err) { next(err); }
};

module.exports = { getInvite, acceptInvite };
