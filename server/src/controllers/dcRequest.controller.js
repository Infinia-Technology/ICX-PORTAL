const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const { createQueueItem } = require('../services/queue.service');

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

// GET /api/dc-requests
const listRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = { 
      organization_id: req.user.organization_id,
      type: 'DC_REQUEST'
    };
    if (status) where.status = status;

    const result = await paginatePrisma(prisma.inquiry, where, page, limit);
    
    // Map to frontend expectation
    result.data = result.data.map(d => ({ ...d, _id: d.id, organizationId: d.organization_id, submittedBy: d.user_id }));
    
    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/dc-requests
const createRequest = async (req, res, next) => {
  try {
    const request = await prisma.inquiry.create({
      data: {
        organization_id: req.user.organization_id,
        user_id: req.user.userId,
        type: 'DC_REQUEST',
        status: 'DRAFT',
        details: req.body
      }
    });

    await logAction({ userId: req.user.userId, action: 'CREATE_DC_REQUEST', targetModel: 'Inquiry', targetId: request.id, ipAddress: req.ip });
    res.status(201).json({ ...request, _id: request.id });
  } catch (err) { next(err); }
};

// GET /api/dc-requests/:id
const getRequest = async (req, res, next) => {
  try {
    const request = await prisma.inquiry.findFirst({ 
      where: { 
        id: req.params.id, 
        organization_id: req.user.organization_id,
        type: 'DC_REQUEST'
      }
    });
    if (!request) return res.status(404).json({ error: 'DC request not found' });
    res.json({ ...request, _id: request.id });
  } catch (err) { next(err); }
};

// PUT /api/dc-requests/:id
const updateRequest = async (req, res, next) => {
  try {
    const request = await prisma.inquiry.findFirst({ 
      where: { 
        id: req.params.id, 
        organization_id: req.user.organization_id,
        type: 'DC_REQUEST'
      }
    });
    if (!request) return res.status(404).json({ error: 'DC request not found' });

    if (request.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft requests can be updated' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: request.id },
      data: { details: req.body }
    });
    res.json({ ...updated, _id: updated.id });
  } catch (err) { next(err); }
};

// POST /api/dc-requests/:id/submit
const submitRequest = async (req, res, next) => {
  try {
    const request = await prisma.inquiry.findFirst({ 
      where: { 
        id: req.params.id, 
        organization_id: req.user.organization_id,
        type: 'DC_REQUEST'
      }
    });
    if (!request) return res.status(404).json({ error: 'DC request not found' });

    if (request.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft requests can be submitted' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: request.id },
      data: { status: 'SUBMITTED' }
    });

    await createQueueItem({ type: 'DC_REQUEST', referenceId: request.id, referenceModel: 'Inquiry' });
    await logAction({ userId: req.user.userId, action: 'SUBMIT_DC_REQUEST', targetModel: 'Inquiry', targetId: request.id, ipAddress: req.ip });
    res.json({ message: 'DC request submitted', status: updated.status });
  } catch (err) { next(err); }
};

module.exports = { listRequests, createRequest, getRequest, updateRequest, submitRequest };
