const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { logAction } = require('../services/audit.service');

// GET /api/account/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { organization: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Flatten and safe return
    const { password, ...safeUser } = user;
    res.json({ ...safeUser, _id: user.id });
  } catch (err) { next(err); }
};

// PUT /api/account/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, mobile } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, mobile }
    });
    const { password, ...safeUser } = updated;
    res.json({ ...safeUser, _id: updated.id });
  } catch (err) { next(err); }
};

// PUT /api/account/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid current password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });
    
    await logAction({ userId: req.user.userId, action: 'CHANGE_PASSWORD', ipAddress: req.ip });
    res.json({ message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

// GET /api/account/export
const exportData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organization_id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const org = organizationId ? await prisma.organization.findUnique({ where: { id: organizationId } }) : null;
    
    const dcApps = await prisma.listing.findMany({ 
      where: { organization_id: organizationId, type: 'DC_SITE' } 
    });
    
    const gpuClusters = await prisma.listing.findMany({ 
      where: { organization_id: organizationId, type: 'GPU_CLUSTER' } 
    });
    
    const gpuDemands = await prisma.inquiry.findMany({ 
      where: { organization_id: organizationId, type: 'GPU_DEMAND' } 
    });
    
    const dcRequests = await prisma.inquiry.findMany({ 
      where: { organization_id: organizationId, type: 'DC_REQUEST' } 
    });

    const exportData = { 
      user, 
      organization: org, 
      dcApplications: dcApps, 
      gpuClusters, 
      gpuDemands, 
      dcRequests, 
      exportedAt: new Date() 
    };

    await logAction({ userId: userId, action: 'GDPR_EXPORT', ipAddress: req.ip });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="icx-data-export-${Date.now()}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) { next(err); }
};

// POST /api/account/deactivate
const deactivateAccount = async (req, res, next) => {
  try {
    await prisma.user.update({ 
      where: { id: req.user.userId }, 
      data: { is_active: false } 
    });
    await logAction({ userId: req.user.userId, action: 'SELF_DEACTIVATE', ipAddress: req.ip });
    res.json({ message: 'Your account has been deactivated' });
  } catch (err) { next(err); }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  exportData,
  deactivateAccount
};
