const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { getDcListings, getDcListing, getGpuClusters, getGpuCluster } = require('../controllers/marketplace.controller');

router.use(authenticate);

router.get('/dc-listings', authorize('customer', 'reader', 'viewer', 'admin'), getDcListings);
router.get('/dc-listings/:id', authorize('customer', 'reader', 'viewer', 'admin'), getDcListing);
router.get('/gpu-clusters', authorize('customer', 'reader', 'viewer', 'admin'), getGpuClusters);
router.get('/gpu-clusters/:id', authorize('customer', 'reader', 'viewer', 'admin'), getGpuCluster);

module.exports = router;
