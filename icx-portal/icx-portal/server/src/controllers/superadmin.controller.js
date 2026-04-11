const { z } = require('zod');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { logAction } = require('../services/audit.service');
const { paginate } = require('../utils/pagination');

// GET /api/superadmin/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.email = { $regex: search, $options: 'i' };

    const result = await paginate(User, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: '-createdAt',
      populate: [{ path: 'organizationId', select: 'type status' }],
    });
    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/superadmin/users
const createUser = async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email().trim().toLowerCase(),
      role: z.enum(['superadmin', 'admin', 'supplier', 'broker', 'customer', 'reader', 'viewer', 'subordinate']),
    });
    const { email, role } = schema.parse(req.body);

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const user = await User.create({ email, role });
    await logAction({ userId: req.user.userId, action: 'CREATE_USER', targetModel: 'User', targetId: user._id, changes: { email, role }, ipAddress: req.ip });
    res.status(201).json(user);
  } catch (err) { next(err); }
};

// PUT /api/superadmin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const schema = z.object({
      role: z.enum(['superadmin', 'admin', 'supplier', 'broker', 'customer', 'reader', 'viewer', 'subordinate']).optional(),
      isActive: z.boolean().optional(),
    });
    const changes = schema.parse(req.body);

    const user = await User.findByIdAndUpdate(req.params.id, { $set: changes }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await logAction({ userId: req.user.userId, action: 'UPDATE_USER', targetModel: 'User', targetId: user._id, changes, ipAddress: req.ip });
    res.json(user);
  } catch (err) { next(err); }
};

// DELETE /api/superadmin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.userId.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await User.deleteOne({ _id: req.params.id });
    await logAction({ userId: req.user.userId, action: 'DELETE_USER', changes: { userId: req.params.id }, ipAddress: req.ip });
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
};

// GET /api/superadmin/audit-log
const getAuditLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, action } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = { $regex: action, $options: 'i' };

    const result = await paginate(AuditLog, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: '-createdAt',
      populate: [{ path: 'userId', select: 'email role' }],
    });
    res.json(result);
  } catch (err) { next(err); }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, getAuditLog };
