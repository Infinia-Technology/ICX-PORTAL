const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const upload = require('../middleware/upload');
const {
  listApplications, createApplication, getApplication, updateApplication,
  submitApplication, resubmitApplication,
  addSite, getSite, updateSite, deleteSite,
  getPhasing, updatePhasing,
  uploadDocument, deleteDocument,
  refreshApplication,
} = require('../controllers/dcApplication.controller');

router.use(authenticate);

// DC Applications
router.get('/', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), listApplications);
router.post('/', authorize('supplier', 'broker', 'admin', 'superadmin'), createApplication);
router.get('/:id', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), getApplication);
router.put('/:id', authorize('supplier', 'broker', 'admin', 'superadmin'), updateApplication);
router.post('/:id/submit', authorize('supplier', 'broker', 'admin', 'superadmin'), submitApplication);
router.post('/:id/resubmit', authorize('supplier', 'broker', 'admin', 'superadmin'), resubmitApplication);
router.post('/:id/refresh', authorize('supplier', 'broker', 'admin', 'superadmin'), refreshApplication);

// Sites
router.post('/:id/sites', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), addSite);
router.get('/:id/sites/:siteId', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), getSite);
router.put('/:id/sites/:siteId', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), updateSite);
router.delete('/:id/sites/:siteId', authorize('supplier', 'broker', 'admin', 'superadmin'), deleteSite);

router.get('/:id/sites/:siteId/phasing', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), getPhasing);
router.put('/:id/sites/:siteId/phasing', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), updatePhasing);

router.post('/:id/sites/:siteId/documents', authorize('supplier', 'broker', 'subordinate', 'admin', 'superadmin'), upload.single('file'), uploadDocument);
router.delete('/:id/sites/:siteId/documents/:docId', authorize('supplier', 'broker', 'admin', 'superadmin'), deleteDocument);

module.exports = router;
