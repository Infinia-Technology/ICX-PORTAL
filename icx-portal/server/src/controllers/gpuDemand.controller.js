const GpuDemandRequest = require('../models/GpuDemandRequest');
const { logAction } = require('../services/audit.service');
const { createQueueItem } = require('../services/queue.service');
const { paginate } = require('../utils/pagination');

// GET /api/gpu-demands
const listDemands = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;

    const result = await paginate(GpuDemandRequest, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: { createdAt: -1 },
    });
    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/gpu-demands
const createDemand = async (req, res, next) => {
  try {
    const demand = await GpuDemandRequest.create({
      organizationId: req.user.organizationId,
      submittedBy: req.user.userId,
      ...req.body,
    });

    await logAction({ userId: req.user.userId, action: 'CREATE_GPU_DEMAND', targetModel: 'GpuDemandRequest', targetId: demand._id, ipAddress: req.ip });
    res.status(201).json(demand);
  } catch (err) { next(err); }
};

// GET /api/gpu-demands/:id
const getDemand = async (req, res, next) => {
  try {
    const demand = await GpuDemandRequest.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!demand) return res.status(404).json({ error: 'GPU demand not found' });
    res.json(demand);
  } catch (err) { next(err); }
};

// PUT /api/gpu-demands/:id
const updateDemand = async (req, res, next) => {
  try {
    const demand = await GpuDemandRequest.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!demand) return res.status(404).json({ error: 'GPU demand not found' });

    if (demand.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft demands can be updated' });
    }

    Object.assign(demand, req.body);
    await demand.save();
    res.json(demand);
  } catch (err) { next(err); }
};

// POST /api/gpu-demands/:id/submit
const submitDemand = async (req, res, next) => {
  try {
    const demand = await GpuDemandRequest.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!demand) return res.status(404).json({ error: 'GPU demand not found' });

    if (demand.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft demands can be submitted' });
    }

    demand.status = 'SUBMITTED';
    await demand.save();

    await createQueueItem({ type: 'GPU_DEMAND', referenceId: demand._id, referenceModel: 'GpuDemandRequest' });
    await logAction({ userId: req.user.userId, action: 'SUBMIT_GPU_DEMAND', targetModel: 'GpuDemandRequest', targetId: demand._id, ipAddress: req.ip });
    res.json({ message: 'GPU demand submitted', status: demand.status });
  } catch (err) { next(err); }
};

module.exports = { listDemands, createDemand, getDemand, updateDemand, submitDemand };
