const Organization = require('../models/Organization');
const { logAction } = require('../services/audit.service');

// GET /api/customer/profile
const getProfile = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org);
  } catch (err) { next(err); }
};

// PUT /api/customer/profile
const updateProfile = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    if (!['REVISION_REQUESTED', 'PENDING'].includes(org.status)) {
      return res.status(400).json({ error: 'Profile can only be updated when revision is requested or pending' });
    }

    const allowed = [
      'companyName', 'companyType', 'jurisdiction', 'industrySector', 'taxVatNumber',
      'companyAddress', 'website', 'authSignatoryName', 'authSignatoryTitle',
      'billingContactName', 'billingContactEmail', 'primaryUseCases',
      'locationPreferences', 'sovereigntyReqs', 'complianceReqs', 'budgetRange', 'urgency',
    ];
    allowed.forEach((f) => { if (req.body[f] !== undefined) org[f] = req.body[f]; });
    await org.save();

    await logAction({ userId: req.user.userId, action: 'UPDATE_CUSTOMER_PROFILE', targetModel: 'Organization', targetId: org._id, ipAddress: req.ip });
    res.json(org);
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile };
