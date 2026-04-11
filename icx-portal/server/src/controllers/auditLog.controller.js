const AuditLog = require('../models/AuditLog');
const { paginate } = require('../utils/pagination');

// GET /api/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 50, userId, action, targetModel, startDate, endDate,
    } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (targetModel) filter.targetModel = targetModel;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const result = await paginate(AuditLog, filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: '-createdAt',
      populate: [{ path: 'userId', select: 'email' }],
    });

    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/audit-logs/:id
const getAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('userId', 'email name');

    if (!log) return res.status(404).json({ error: 'Audit log not found' });
    res.json(log);
  } catch (err) { next(err); }
};

// GET /api/audit-logs/stats/actions
const getActionStats = async (req, res, next) => {
  try {
    const stats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(stats);
  } catch (err) { next(err); }
};

// GET /api/audit-logs/stats/users
const getUserActivityStats = async (req, res, next) => {
  try {
    const stats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          lastAction: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          count: 1,
          lastAction: 1,
          email: '$user.email',
        },
      },
    ]);

    res.json(stats);
  } catch (err) { next(err); }
};

module.exports = {
  getAuditLogs,
  getAuditLog,
  getActionStats,
  getUserActivityStats,
};
