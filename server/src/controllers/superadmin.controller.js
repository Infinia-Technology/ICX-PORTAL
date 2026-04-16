const { z } = require('zod');
const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');

// Helper to map Prisma pagination
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

// GET /api/superadmin/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where.email = { contains: search, mode: 'insensitive' };

    const result = await paginatePrisma(prisma.user, where, page, limit, {
      organization: { select: { type: true, status: true, company_name: true } }
    });
    
    // Compatibility mapping
    result.data = result.data.map(u => ({ ...u, _id: u.id, organizationId: u.organization }));
    
    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/superadmin/users
const createUser = async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email().trim().toLowerCase(),
      role: z.string(),
    });
    const { email, role } = schema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const user = await prisma.user.create({
      data: { email, role: role }
    });
    
    await logAction({ userId: req.user.userId, action: 'CREATE_USER', targetModel: 'User', targetId: user.id, changes: { email, role }, ipAddress: req.ip });
    res.status(201).json({ ...user, _id: user.id });
  } catch (err) { next(err); }
};

// PUT /api/superadmin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const schema = z.object({
      role: z.string().optional(),
      isActive: z.boolean().optional(),
    });
    const changes = schema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: changes
    });

    await logAction({ userId: req.user.userId, action: 'UPDATE_USER', targetModel: 'User', targetId: user.id, changes, ipAddress: req.ip });
    res.json({ ...user, _id: user.id });
  } catch (err) { next(err); }
};

// DELETE /api/superadmin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const userId = req.params.id;

    await prisma.$transaction(async (tx) => {
      // Disconnect user from QueueItem many-to-many (assigned admins)
      await tx.user.update({
        where: { id: userId },
        data: { assigned_queue: { set: [] } }
      });

      // Delete direct FK dependents (non-nullable)
      await tx.notification.deleteMany({ where: { user_id: userId } });
      await tx.reportTemplate.deleteMany({ where: { user_id: userId } });
      await tx.inquiry.deleteMany({ where: { user_id: userId } });
      await tx.reservation.deleteMany({ where: { customer_id: userId } });
      await tx.teamInvite.deleteMany({ where: { inviter_id: userId } });

      // Nullify nullable FK references
      await tx.auditLog.updateMany({ where: { user_id: userId }, data: { user_id: null } });
      await tx.archive.updateMany({ where: { archived_by: userId }, data: { archived_by: null } });
      await tx.archive.updateMany({ where: { restored_by: userId }, data: { restored_by: null } });

      // Delete user's listings and their dependents
      const listings = await tx.listing.findMany({ where: { supplier_id: userId }, select: { id: true } });
      const listingIds = listings.map(l => l.id);

      if (listingIds.length > 0) {
        await tx.queueItem.deleteMany({ where: { reference_id: { in: listingIds } } });
        // DcSite → DcDocument, DcPhasingSchedule cascade; ListingDocument cascades
        await tx.listing.deleteMany({ where: { id: { in: listingIds } } });
      }

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    await logAction({ userId: req.user.userId, action: 'DELETE_USER', changes: { userId }, ipAddress: req.ip });
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
};

// GET /api/superadmin/audit-log
const getAuditLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, user_id, action } = req.query;
    const where = {};
    if (user_id) where.user_id = user_id;
    if (action) where.action = { contains: action, mode: 'insensitive' };

    const result = await paginatePrisma(prisma.auditLog, where, page, limit, {
      user: { select: { email: true, role: true } }
    }, { timestamp: 'desc' });

    // Compatibility mapping
    result.data = result.data.map(log => ({ ...log, _id: log.id, userId: log.user }));

    res.json(result);
  } catch (err) { next(err); }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, getAuditLog };
