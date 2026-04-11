const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const upload = require('../middleware/upload');
const {
  listClusters, createCluster, getCluster, updateCluster,
  submitCluster, resubmitCluster, uploadDocument, deleteDocument,
} = require('../controllers/gpuCluster.controller');

router.use(authenticate);

router.get('/', authorize('supplier', 'broker'), listClusters);
router.post('/', authorize('supplier', 'broker'), createCluster);
router.get('/:id', authorize('supplier', 'broker', 'subordinate'), getCluster);
router.put('/:id', authorize('supplier', 'broker', 'subordinate'), updateCluster);
router.post('/:id/submit', authorize('supplier', 'broker'), submitCluster);
router.post('/:id/resubmit', authorize('supplier', 'broker'), resubmitCluster);
router.post('/:id/documents', authorize('supplier', 'broker', 'subordinate'), upload.single('file'), uploadDocument);
router.delete('/:id/documents/:docId', authorize('supplier', 'broker'), deleteDocument);

module.exports = router;
