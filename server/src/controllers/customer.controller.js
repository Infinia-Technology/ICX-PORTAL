const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');

// GET /api/customer/profile
const getProfile = async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organization_id }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json({ ...org, _id: org.id });
  } catch (err) { next(err); }
};

// PUT /api/customer/profile
const updateProfile = async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organization_id }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    if (!['REVISION_REQUESTED', 'PENDING'].includes(org.status)) {
      return res.status(400).json({ error: 'Profile can only be updated when revision is requested or pending' });
    }

    const mapping = {
      companyName: 'company_name', companyType: 'company_type', jurisdiction: 'jurisdiction',
      industrySector: 'industry_sector', taxVatNumber: 'tax_vat_number', companyAddress: 'company_address',
      website: 'website', authSignatoryName: 'auth_signatory_name', authSignatoryTitle: 'auth_signatory_title',
      billingContactName: 'billing_contact_name', billingContactEmail: 'billing_contact_email',
      primaryUseCases: 'primary_use_cases', locationPreferences: 'location_preferences',
      sovereigntyReqs: 'sovereignty_reqs', complianceReqs: 'compliance_reqs',
      budgetRange: 'budget_range', urgency: 'urgency'
    };

    const data = {};
    Object.entries(mapping).forEach(([camel, snake]) => {
      if (req.body[camel] !== undefined) data[snake] = req.body[camel];
    });

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data
    });

    await logAction({ userId: req.user.userId, action: 'UPDATE_CUSTOMER_PROFILE', targetModel: 'Organization', targetId: updated.id, ipAddress: req.ip });
    res.json({ ...updated, _id: updated.id });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile };
