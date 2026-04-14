const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const {
  getProfile, updateProfile, submitKyc,
  getTeam, inviteTeamMember, revokeTeamMember,
  getBrokerCompanies, addBrokerCompany, updateBrokerCompany,
} = require('../controllers/supplier.controller');
const { getSuppliers } = require('../controllers/admin.controller');

router.use(authenticate);

// Profile
router.get('/profile', authorize('supplier', 'broker'), getProfile);
router.put('/profile', authorize('supplier', 'broker'), updateProfile);
router.post('/profile/submit', authorize('supplier', 'broker'), submitKyc);

// Team
router.get('/team', authorize('supplier', 'broker'), getTeam);
router.post('/team/invite', authorize('supplier', 'broker'), inviteTeamMember);
router.delete('/team/:id', authorize('supplier', 'broker'), revokeTeamMember);

// Broker companies
router.get('/broker-companies', authorize('broker'), getBrokerCompanies);
router.post('/broker-companies', authorize('broker'), addBrokerCompany);
router.put('/broker-companies/:id', authorize('broker'), updateBrokerCompany);

module.exports = router;
