const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { listRequests, createRequest, getRequest, updateRequest, submitRequest } = require('../controllers/dcRequest.controller');

router.use(authenticate);

router.get('/', authorize('customer', 'supplier', 'broker'), listRequests);
router.post('/', authorize('customer', 'supplier', 'broker'), createRequest);
router.get('/:id', authorize('customer', 'supplier', 'broker'), getRequest);
router.put('/:id', authorize('customer', 'supplier', 'broker'), updateRequest);
router.post('/:id/submit', authorize('customer', 'supplier', 'broker'), submitRequest);

module.exports = router;
