const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword,
  exportData,
  deactivateAccount
} = require('../controllers/account.controller');

router.use(authenticate);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Account Actions
router.get('/export', exportData);
router.post('/deactivate', deactivateAccount);

module.exports = router;
