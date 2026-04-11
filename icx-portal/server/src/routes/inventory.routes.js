const express = require('express');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const inventoryController = require('../controllers/inventory.controller');

const router = express.Router();

router.use(authenticate);

// Inventory CRUD — available to admin, superadmin, supplier, broker
router.get('/', authorize('admin', 'superadmin', 'supplier', 'broker'), inventoryController.listInventory);
router.post('/', authorize('admin', 'superadmin', 'supplier', 'broker'), inventoryController.createInventory);
router.get('/:id', authorize('admin', 'superadmin', 'supplier', 'broker'), inventoryController.getInventory);
router.put('/:id', authorize('admin', 'superadmin', 'supplier', 'broker'), inventoryController.updateInventory);
router.delete('/:id', authorize('admin', 'superadmin', 'supplier', 'broker'), inventoryController.deleteInventory);

// Status change — admin/superadmin only
router.put('/:id/status', authorize('admin', 'superadmin'), inventoryController.updateInventoryStatus);

// Reservations
router.get('/:id/reservations', authorize('admin', 'superadmin', 'supplier', 'broker'), inventoryController.listReservations);
router.post('/:id/reservations', authorize('admin', 'superadmin'), inventoryController.createReservation);
router.put('/:id/reservations/:resId/cancel', authorize('admin', 'superadmin'), inventoryController.cancelReservation);

module.exports = router;
