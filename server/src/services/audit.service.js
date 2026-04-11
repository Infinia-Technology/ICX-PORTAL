const AuditLog = require('../models/AuditLog');

const logAction = async ({ userId, action, targetModel, targetId, changes, ipAddress }) => {
  await AuditLog.create({
    userId,
    action,
    targetModel,
    targetId,
    changes,
    ipAddress,
  });
};

module.exports = { logAction };
