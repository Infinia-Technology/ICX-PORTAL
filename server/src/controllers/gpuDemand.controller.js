const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const { createQueueItem } = require('../services/queue.service');
const { sendAdminAlert } = require('../services/email.service');

// Helper for Prisma pagination
const paginatePrisma = async (model, where, page, limit, include = null, orderBy = { created_at: 'desc' }) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const count = await model.count({ where });
  const docs = await model.findMany({
    where,
    take: limitNum,
    skip: (pageNum - 1) * limitNum,
    orderBy,
    include
  });
  return {
    data: docs,
    total: count,
    limit: limitNum,
    page: pageNum,
    totalPages: Math.ceil(count / limitNum),
    hasNext: pageNum < Math.ceil(count / limitNum),
    hasPrev: pageNum > 1,
  };
};

/** Fetch emails of all active admins and superadmins */
const getAdminEmails = async () => {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'superadmin'] }, isActive: true },
    select: { email: true },
  });
  return admins.map(a => a.email);
};

// GET /api/gpu-demands
const listDemands = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = {
      organization_id: req.user.organization_id,
      type: 'GPU_DEMAND'
    };
    if (status) where.status = status;

    const result = await paginatePrisma(prisma.inquiry, where, page, limit);

    result.data = result.data.map(d => ({
      ...d,
      ...(d.specifications || {}),
      _id: d.id,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      organizationId: d.organization_id,
    }));

    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/gpu-demands
const createDemand = async (req, res, next) => {
  try {
    const demand = await prisma.inquiry.create({
      data: {
        organization_id: req.user.organization_id,
        user_id: req.user.userId,
        type: 'GPU_DEMAND',
        status: 'DRAFT',
        specifications: req.body
      }
    });

    await logAction({ userId: req.user.userId, action: 'CREATE_GPU_DEMAND', targetModel: 'Inquiry', targetId: demand.id, ipAddress: req.ip });
    res.status(201).json({ ...demand, _id: demand.id });
  } catch (err) { next(err); }
};

// GET /api/gpu-demands/:id
const getDemand = async (req, res, next) => {
  try {
    const demand = await prisma.inquiry.findFirst({
      where: {
        id: req.params.id,
        organization_id: req.user.organization_id,
        type: 'GPU_DEMAND'
      }
    });
    if (!demand) return res.status(404).json({ error: 'GPU demand not found' });
    res.json({ ...demand, _id: demand.id });
  } catch (err) { next(err); }
};

// PUT /api/gpu-demands/:id
const updateDemand = async (req, res, next) => {
  try {
    const demand = await prisma.inquiry.findFirst({
      where: {
        id: req.params.id,
        organization_id: req.user.organization_id,
        type: 'GPU_DEMAND'
      }
    });
    if (!demand) return res.status(404).json({ error: 'GPU demand not found' });

    if (demand.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft demands can be updated' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: demand.id },
      data: { specifications: req.body }
    });
    res.json({ ...updated, _id: updated.id });
  } catch (err) { next(err); }
};

// POST /api/gpu-demands/:id/submit
const submitDemand = async (req, res, next) => {
  try {
    const demand = await prisma.inquiry.findFirst({
      where: {
        id: req.params.id,
        organization_id: req.user.organization_id,
        type: 'GPU_DEMAND'
      }
    });
    if (!demand) return res.status(404).json({ error: 'GPU demand not found' });

    if (demand.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft demands can be submitted' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: demand.id },
      data: { status: 'SUBMITTED' }
    });

    try { await createQueueItem({ type: 'GPU_DEMAND', referenceId: demand.id, referenceModel: 'Inquiry' }); } catch (qErr) { console.warn('[QUEUE] GPU_DEMAND queue item skipped:', qErr.message); }
    await logAction({ userId: req.user.userId, action: 'SUBMIT_GPU_DEMAND', targetModel: 'Inquiry', targetId: demand.id, ipAddress: req.ip });

    // Notify admins about new GPU demand submission
    const specs = demand.specifications || {};
    getAdminEmails().then(adminEmails => {
      sendAdminAlert(
        adminEmails,
        'New GPU Demand Submitted',
        'New GPU Demand Submitted',
        `A GPU demand has been submitted by <strong>${req.user.email}</strong>.<br>
        Customer: ${specs.customerName || 'N/A'}<br>
        Technology: ${specs.technologyType || 'N/A'}<br>
        Cluster Size: ${specs.clusterSizeGpus || 'N/A'} GPUs`,
        `${process.env.CLIENT_URL || ''}/admin/gpu-demands/${demand.id}`
      ).catch(console.error);
    }).catch(console.error);

    res.json({ message: 'GPU demand submitted', status: updated.status });
  } catch (err) { next(err); }
};

module.exports = { listDemands, createDemand, getDemand, updateDemand, submitDemand };
