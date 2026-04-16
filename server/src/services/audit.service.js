const prisma = require('../config/prisma');

const logAction = async ({ userId, action, targetModel, targetId, changes, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId || null,
        action,
        target_model: targetModel || null,
        target_id: targetId?.toString() || null,
        changes: changes || null,
        ip_address: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('[AUDIT] Failed to log action:', err.message);
  }
};

module.exports = { logAction };
