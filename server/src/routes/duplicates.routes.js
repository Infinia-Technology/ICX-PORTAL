const express = require('express');
const { checkDcDuplicates, checkGpuDuplicates } = require('../controllers/duplicates.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(authenticate);

// POST /api/duplicates/check-dc-listings
router.post('/check-dc-listings', authorize('admin', 'superadmin'), checkDcDuplicates);

// POST /api/duplicates/check-gpu-listings
router.post('/check-gpu-listings', authorize('admin', 'superadmin'), checkGpuDuplicates);

module.exports = router;
