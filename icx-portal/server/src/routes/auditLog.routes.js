const express = require('express');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const auditLogController = require('../controllers/auditLog.controller');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'superadmin'));

// GET /api/audit-logs
router.get('/', auditLogController.getAuditLogs);

// GET /api/audit-logs/:id
router.get('/:id', auditLogController.getAuditLog);

// GET /api/audit-logs/stats/actions
router.get('/stats/actions', auditLogController.getActionStats);

// GET /api/audit-logs/stats/users
router.get('/stats/users', auditLogController.getUserActivityStats);

module.exports = router;
