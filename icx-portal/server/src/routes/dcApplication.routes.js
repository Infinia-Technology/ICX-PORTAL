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
} = require('../controllers/dcApplication.controller');

router.use(authenticate);

// DC Applications
router.get('/', authorize('supplier', 'broker', 'subordinate'), listApplications);
router.post('/', authorize('supplier', 'broker'), createApplication);
router.get('/:id', authorize('supplier', 'broker', 'subordinate'), getApplication);
router.put('/:id', authorize('supplier', 'broker'), updateApplication);
router.post('/:id/submit', authorize('supplier', 'broker'), submitApplication);
router.post('/:id/resubmit', authorize('supplier', 'broker'), resubmitApplication);

// Sites
router.post('/:id/sites', authorize('supplier', 'broker', 'subordinate'), addSite);
router.get('/:id/sites/:siteId', authorize('supplier', 'broker', 'subordinate'), getSite);
router.put('/:id/sites/:siteId', authorize('supplier', 'broker', 'subordinate'), updateSite);
router.delete('/:id/sites/:siteId', authorize('supplier', 'broker'), deleteSite);

module.exports = router;
