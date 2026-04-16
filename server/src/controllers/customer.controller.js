const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');

// GET /api/customer/profile
const getProfile = async (req, res, next) => {
  try {
    if (!req.user.organization_id) return res.status(404).json({ error: 'No organization linked to user' });
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organization_id }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json({
      ...org,
      _id: org.id,
      companyName: org.company_name,
      companyType: org.company_type,
      contactEmail: org.contact_email,
      contactNumber: org.contact_number,
      industrySector: org.industry_sector,
      taxVatNumber: org.tax_vat_number,
      companyAddress: org.company_address,
      authSignatoryName: org.auth_signatory_name,
      authSignatoryTitle: org.auth_signatory_title,
      billingContactName: org.billing_contact_name,
      billingContactEmail: org.billing_contact_email,
      primaryUseCases: org.primary_use_cases,
      locationPreferences: org.location_preferences,
      sovereigntyReqs: org.sovereignty_reqs,
      complianceReqs: org.compliance_reqs,
      budgetRange: org.budget_range,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    });
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
    res.json({
      ...updated,
      _id: updated.id,
      companyName: updated.company_name,
      companyType: updated.company_type,
      contactEmail: updated.contact_email,
      industrySector: updated.industry_sector,
      taxVatNumber: updated.tax_vat_number,
      companyAddress: updated.company_address,
      authSignatoryName: updated.auth_signatory_name,
      authSignatoryTitle: updated.auth_signatory_title,
      billingContactName: updated.billing_contact_name,
      billingContactEmail: updated.billing_contact_email,
      primaryUseCases: updated.primary_use_cases,
      locationPreferences: updated.location_preferences,
      sovereigntyReqs: updated.sovereignty_reqs,
      complianceReqs: updated.compliance_reqs,
      budgetRange: updated.budget_range,
    });
  } catch (err) { next(err); }
};

// GET /api/customer/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [
      totalGpuDemands, newGpuDemands, closedGpuDemands,
      totalDcRequests, newDcRequests, closedDcRequests,
    ] = await Promise.all([
      prisma.inquiry.count({ where: { user_id: userId, type: 'GPU_DEMAND' } }),
      prisma.inquiry.count({ where: { user_id: userId, type: 'GPU_DEMAND', status: 'NEW' } }),
      prisma.inquiry.count({ where: { user_id: userId, type: 'GPU_DEMAND', status: 'CLOSED' } }),
      prisma.inquiry.count({ where: { user_id: userId, type: 'DC_REQUEST' } }),
      prisma.inquiry.count({ where: { user_id: userId, type: 'DC_REQUEST', status: 'NEW' } }),
      prisma.inquiry.count({ where: { user_id: userId, type: 'DC_REQUEST', status: 'CLOSED' } }),
    ]);
    res.json({
      totalGpuDemands, newGpuDemands, closedGpuDemands,
      totalDcRequests, newDcRequests, closedDcRequests,
    });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, getAnalytics };
