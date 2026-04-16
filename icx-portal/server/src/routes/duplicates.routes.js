const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const duplicatesController = require('../controllers/duplicates.controller');

router.use(authenticate);

// POST /api/duplicates/check-dc-listings
router.post('/check-dc-listings', duplicatesController.checkDcDuplicates);

// POST /api/duplicates/check-gpu-listings
router.post('/check-gpu-listings', duplicatesController.checkGpuDuplicates);

module.exports = router;
