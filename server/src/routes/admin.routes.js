const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { getMembers, addMember, inviteMember, removeMember, getAssignableUsers } = require('../controllers/listingMember.controller');

const {
  getQueue, getQueueItem,
  getSuppliers, getSupplier, reviewSupplierKyc,
  getDcListings, getDcListing, reviewDcListing,
  getGpuClusters, getGpuCluster, reviewGpuCluster,
  getCustomers, getCustomer, verifyCustomer,
  createAdminGpuDemand,
  getAdminGpuDemands, getAdminGpuDemand, matchGpuDemand,
  getAdminDcRequests, getAdminDcRequest, matchDcRequest,
  updateDocumentStatus,
  getAnalytics,
  getReaders, createReader, getReader, updateReader, deleteReader, resendReaderWelcome,
  getAdminUsers, createAdminUser, toggleAdminUser, deleteAdminUser,
} = require('../controllers/admin.controller');

router.use(authenticate);
router.use(authorize('admin'));

// Queue
router.get('/queue', getQueue);
router.get('/queue/:id', getQueueItem);

// Suppliers
router.get('/suppliers', getSuppliers);
router.get('/suppliers/:id', getSupplier);
router.put('/suppliers/:id/kyc', reviewSupplierKyc);

// DC Listings
router.get('/dc-listings', getDcListings);
router.get('/dc-listings/:id', getDcListing);
router.put('/dc-listings/:id/review', reviewDcListing);

// GPU Clusters
router.get('/gpu-clusters', getGpuClusters);
router.get('/gpu-clusters/:id', getGpuCluster);
router.put('/gpu-clusters/:id/review', reviewGpuCluster);

// Customers
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomer);
router.put('/customers/:id/verify', verifyCustomer);

// Demands & Matching
router.post('/gpu-demands', createAdminGpuDemand);
router.get('/gpu-demands', getAdminGpuDemands);
router.get('/gpu-demands/:id', getAdminGpuDemand);
router.put('/gpu-demands/:id/match', matchGpuDemand);
router.get('/dc-requests', getAdminDcRequests);
router.get('/dc-requests/:id', getAdminDcRequest);
router.put('/dc-requests/:id/match', matchDcRequest);

// Document tracking
router.put('/documents/:docId/status', updateDocumentStatus);

// Analytics
router.get('/analytics', getAnalytics);

// Listing member management
router.get('/users/assignable', getAssignableUsers);
router.get('/listings/:id/members', getMembers);
router.post('/listings/:id/members', addMember);
router.post('/listings/:id/invite', inviteMember);
router.delete('/listings/:id/members/:userId', removeMember);

// Admin user management (supplier, broker, customer, reader, viewer, subordinate only)
router.get('/manage-users', getAdminUsers);
router.post('/manage-users', createAdminUser);
router.put('/manage-users/:id', toggleAdminUser);
router.delete('/manage-users/:id', deleteAdminUser);

// Readers
router.get('/readers', getReaders);
router.post('/readers', createReader);
router.get('/readers/:id', getReader);
router.put('/readers/:id', updateReader);
router.delete('/readers/:id', deleteReader);
router.post('/readers/:id/resend', resendReaderWelcome);

module.exports = router;
