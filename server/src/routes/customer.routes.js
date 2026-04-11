const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { getProfile, updateProfile } = require('../controllers/customer.controller');

router.use(authenticate);

router.get('/profile', authorize('customer'), getProfile);
router.put('/profile', authorize('customer'), updateProfile);

module.exports = router;
