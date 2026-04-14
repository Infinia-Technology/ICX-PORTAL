const prisma = require('../config/prisma');

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

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly = false } = req.query;
    const where = { user_id: req.user.userId };
    if (type) where.type = type;
    if (unreadOnly === 'true') where.is_read = false;

    const result = await paginatePrisma(prisma.notification, where, page, limit);
    
    // Map id to _id for frontend
    result.data = result.data.map(n => ({
      ...n,
      _id: n.id,
      read: n.is_read,
      createdAt: n.created_at
    }));

    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { user_id: req.user.userId, is_read: false }
    });
    res.json({ count });
  } catch (err) { next(err); }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id, user_id: req.user.userId },
      data: { is_read: true }
    });

    res.json({
      ...notification,
      _id: notification.id,
      read: notification.is_read
    });
  } catch (err) { next(err); }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.userId, is_read: false },
      data: { is_read: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
