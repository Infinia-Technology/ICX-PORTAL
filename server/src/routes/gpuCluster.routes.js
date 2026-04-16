const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const upload = require('../middleware/upload');
const {
  listClusters, createCluster, getCluster, updateCluster,
  submitCluster, resubmitCluster, uploadDocument, deleteDocument,
  refreshCluster,
} = require('../controllers/gpuCluster.controller');

router.use(authenticate);

router.get('/', authorize('supplier', 'broker', 'admin', 'superadmin'), listClusters);
router.post('/', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), createCluster);
router.get('/:id', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), getCluster);
router.put('/:id', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), updateCluster);
router.post('/:id/submit', authorize('supplier', 'broker', 'admin', 'superadmin'), submitCluster);
router.post('/:id/resubmit', authorize('supplier', 'broker', 'admin', 'superadmin'), resubmitCluster);
router.post('/:id/documents', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), upload.single('file'), uploadDocument);
router.delete('/:id/documents/:docId', authorize('supplier', 'broker', 'admin', 'superadmin'), deleteDocument);
router.post('/:id/refresh', authorize('supplier', 'broker', 'admin', 'superadmin'), refreshCluster);

module.exports = router;
