const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const upload = require('../middleware/upload');
const {
  getPhasing, updatePhasing, uploadDocument, deleteDocument,
} = require('../controllers/dcApplication.controller');

router.use(authenticate);

// Phasing
router.get('/:siteId/phasing', authorize('supplier', 'broker', 'subordinate'), getPhasing);
router.put('/:siteId/phasing', authorize('supplier', 'broker', 'subordinate'), updatePhasing);

// Documents
router.post('/:siteId/documents', authorize('supplier', 'broker', 'subordinate'), upload.single('file'), uploadDocument);
router.delete('/:siteId/documents/:docId', authorize('supplier', 'broker'), deleteDocument);

module.exports = router;
