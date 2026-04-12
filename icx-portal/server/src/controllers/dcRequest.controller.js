const DcCapacityRequest = require('../models/DcCapacityRequest');
const { logAction } = require('../services/audit.service');
const { createQueueItem } = require('../services/queue.service');
const { paginate } = require('../utils/pagination');

// GET /api/dc-requests
const listRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;

    const result = await paginate(DcCapacityRequest, filter, {
      page: parseInt(page), limit: parseInt(limit), sort: { createdAt: -1 },
    });
    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/dc-requests
const createRequest = async (req, res, next) => {
  try {
    const request = await DcCapacityRequest.create({
      organizationId: req.user.organizationId,
      submittedBy: req.user.userId,
      ...req.body,
    });

    await logAction({ userId: req.user.userId, action: 'CREATE_DC_REQUEST', targetModel: 'DcCapacityRequest', targetId: request._id, ipAddress: req.ip });
    res.status(201).json(request);
  } catch (err) { next(err); }
};

// GET /api/dc-requests/:id
const getRequest = async (req, res, next) => {
  try {
    const request = await DcCapacityRequest.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!request) return res.status(404).json({ error: 'DC request not found' });
    res.json(request);
  } catch (err) { next(err); }
};

// PUT /api/dc-requests/:id
const updateRequest = async (req, res, next) => {
  try {
    const request = await DcCapacityRequest.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!request) return res.status(404).json({ error: 'DC request not found' });

    if (request.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft requests can be updated' });
    }

    Object.assign(request, req.body);
    await request.save();
    res.json(request);
  } catch (err) { next(err); }
};

// POST /api/dc-requests/:id/submit
const submitRequest = async (req, res, next) => {
  try {
    const request = await DcCapacityRequest.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!request) return res.status(404).json({ error: 'DC request not found' });

    if (request.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft requests can be submitted' });
    }

    request.status = 'SUBMITTED';
    await request.save();

    await createQueueItem({ type: 'DC_REQUEST', referenceId: request._id, referenceModel: 'DcCapacityRequest' });
    await logAction({ userId: req.user.userId, action: 'SUBMIT_DC_REQUEST', targetModel: 'DcCapacityRequest', targetId: request._id, ipAddress: req.ip });
    res.json({ message: 'DC request submitted', status: request.status });
  } catch (err) { next(err); }
};

module.exports = { listRequests, createRequest, getRequest, updateRequest, submitRequest };
