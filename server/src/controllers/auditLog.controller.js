const prisma = require('../config/prisma');

// Helper for Prisma pagination
const paginatePrisma = async (model, where, page, limit, include = null, orderBy = { timestamp: 'desc' }) => {
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

// GET /api/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 50, user_id, action, target_model, startDate, endDate,
    } = req.query;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (action) where.action = action;
    if (target_model) where.target_model = target_model;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    const result = await paginatePrisma(prisma.auditLog, where, page, limit, {
      user: { select: { email: true } }
    }, { timestamp: 'desc' });

    // Compatibility mapping
    result.data = result.data.map(log => ({ ...log, _id: log.id, userId: log.user }));

    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/audit-logs/:id
const getAuditLog = async (req, res, next) => {
  try {
    const log = await prisma.auditLog.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { email: true, name: true } } }
    });

    if (!log) return res.status(404).json({ error: 'Audit log not found' });
    res.json({ ...log, _id: log.id, userId: log.user });
  } catch (err) { next(err); }
};

// GET /api/audit-logs/stats/actions
const getActionStats = async (req, res, next) => {
  try {
    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    });

    res.json(stats.map(s => ({ _id: s.action, count: s._count._all })));
  } catch (err) { next(err); }
};

// GET /api/audit-logs/stats/users
const getUserActivityStats = async (req, res, next) => {
  try {
    const stats = await prisma.auditLog.groupBy({
      by: ['user_id'],
      _count: {
        _all: true
      },
      _max: {
        timestamp: true
      },
      orderBy: {
        _count: {
          user_id: 'desc'
        }
      }
    });

    // Populate user info manually since groupBy doesn't support relation includes
    const userIds = stats.map(s => s.user_id).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true }
    });
    const userMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

    const result = stats.map(s => ({
      _id: s.user_id,
      count: s._count._all,
      lastAction: s._max.timestamp,
      email: userMap[s.user_id]?.email || 'System'
    }));

    res.json(result);
  } catch (err) { next(err); }
};

module.exports = {
  getAuditLogs,
  getAuditLog,
  getActionStats,
  getUserActivityStats,
};
