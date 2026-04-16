const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { getProfile, updateProfile, getAnalytics } = require('../controllers/customer.controller');

router.use(authenticate);

router.get('/profile', authorize('customer'), getProfile);
router.put('/profile', authorize('customer'), updateProfile);
router.get('/analytics', authorize('customer'), getAnalytics);

module.exports = router;
