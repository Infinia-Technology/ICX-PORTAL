const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { listDemands, createDemand, getDemand, updateDemand, submitDemand } = require('../controllers/gpuDemand.controller');

router.use(authenticate);

router.get('/', authorize('customer', 'supplier', 'broker'), listDemands);
router.post('/', authorize('customer', 'supplier', 'broker'), createDemand);
router.get('/:id', authorize('customer', 'supplier', 'broker'), getDemand);
router.put('/:id', authorize('customer', 'supplier', 'broker'), updateDemand);
router.post('/:id/submit', authorize('customer', 'supplier', 'broker'), submitDemand);

module.exports = router;
