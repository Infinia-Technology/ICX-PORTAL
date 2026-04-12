const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getUsers, createUser, updateUser, deleteUser, getAuditLog } = require('../controllers/superadmin.controller');

// Custom middleware: superadmin only
const superadminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
};

router.use(authenticate, superadminOnly);

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/audit-log', getAuditLog);

module.exports = router;
