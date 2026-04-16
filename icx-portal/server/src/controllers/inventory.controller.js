const { z } = require('zod');
const Inventory = require('../models/Inventory');
const InventoryReservation = require('../models/InventoryReservation');
const GpuClusterListing = require('../models/GpuClusterListing');
const Organization = require('../models/Organization');
const { paginate } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');

// GET /api/inventory
const listInventory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Admin sees all inventory; supplier/broker sees only their own
    const filter = ['admin', 'superadmin'].includes(req.user.role)
      ? {}
      : { organizationId: req.user.organizationId };

    const result = await paginate(Inventory, filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: '-createdAt',
      populate: {
        path: 'gpuClusterListingId',
        select: 'vendorName gpu location',
      },
    });

    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/inventory
const createInventory = async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      gpuClusterListingId: z.string().min(1, 'GPU Cluster is required'),
      unitType: z.enum(['GPU', 'NODE', 'RACK', 'CLUSTER']).optional(),
      totalUnits: z.number().min(1, 'Total units must be at least 1'),
      pricePerUnit: z.number().min(0).optional(),
      pricingPeriod: z.enum(['HOUR', 'DAY', 'MONTH', 'YEAR']).optional(),
      currency: z.enum(['USD', 'EUR', 'GBP', 'AED', 'SAR']).optional(),
      minOrderQuantity: z.number().min(1).optional(),
      availabilityStartDate: z.string().optional(),
      availabilityEndDate: z.string().optional(),
      location: z.string().optional(),
      description: z.string().max(2000).optional(),
      notes: z.string().max(500).optional(),
    });

    const validated = schema.parse(req.body);

    // Verify cluster exists and is APPROVED
    const cluster = await GpuClusterListing.findById(validated.gpuClusterListingId);
    if (!cluster) {
      return res.status(404).json({ error: 'GPU Cluster not found' });
    }
    if (cluster.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only approved GPU clusters can have inventory' });
    }

    // For supplier/broker, verify cluster belongs to their org
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      if (cluster.organizationId.toString() !== req.user.organizationId) {
        return res.status(403).json({ error: 'Cannot create inventory for another organization\'s cluster' });
      }
    }

    // Validate date range if both provided
    if (validated.availabilityStartDate && validated.availabilityEndDate) {
      const startDate = new Date(validated.availabilityStartDate);
      const endDate = new Date(validated.availabilityEndDate);
      if (endDate <= startDate) {
        return res.status(400).json({ error: 'Availability end date must be after start date' });
      }
    }

    const inventory = new Inventory({
      organizationId: cluster.organizationId,
      gpuClusterListingId: validated.gpuClusterListingId,
      name: validated.name,
      unitType: validated.unitType || 'GPU',
      totalUnits: validated.totalUnits,
      pricePerUnit: validated.pricePerUnit,
      pricingPeriod: validated.pricingPeriod,
      currency: validated.currency || 'USD',
      minOrderQuantity: validated.minOrderQuantity || 1,
      availabilityStartDate: validated.availabilityStartDate ? new Date(validated.availabilityStartDate) : undefined,
      availabilityEndDate: validated.availabilityEndDate ? new Date(validated.availabilityEndDate) : undefined,
      location: validated.location || cluster.location,
      description: validated.description,
      notes: validated.notes,
      status: 'AVAILABLE',
      bookedUnits: 0,
    });

    await inventory.save();

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'CREATE_INVENTORY',
      targetModel: 'Inventory',
      targetId: inventory._id,
      changes: { name: validated.name, totalUnits: validated.totalUnits },
      ipAddress: req.ip,
    });

    res.status(201).json(await inventory.populate('gpuClusterListingId', 'vendorName gpu location'));
  } catch (err) { next(err); }
};

// GET /api/inventory/:id
const getInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('gpuClusterListingId', 'vendorName gpu location')
      .populate('organizationId', 'companyName');

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    // Populate reservations
    const reservations = await InventoryReservation.find({ inventoryId: inventory._id })
      .populate('customerOrgId', 'companyName')
      .populate('bookedBy', 'email');

    res.json({ ...inventory.toObject(), reservations });
  } catch (err) { next(err); }
};

// PUT /api/inventory/:id
const updateInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    // Guard: cannot edit if RESERVED or SOLD
    if (['RESERVED', 'SOLD'].includes(inventory.status)) {
      return res.status(400).json({
        error: `Cannot edit inventory with status ${inventory.status}. Only AVAILABLE inventory can be modified.`,
      });
    }

    const schema = z.object({
      name: z.string().min(1).optional(),
      unitType: z.enum(['GPU', 'NODE', 'RACK', 'CLUSTER']).optional(),
      totalUnits: z.number().min(1).optional(),
      pricePerUnit: z.number().min(0).optional(),
      pricingPeriod: z.enum(['HOUR', 'DAY', 'MONTH', 'YEAR']).optional(),
      currency: z.enum(['USD', 'EUR', 'GBP', 'AED', 'SAR']).optional(),
      minOrderQuantity: z.number().min(1).optional(),
      availabilityStartDate: z.string().optional(),
      availabilityEndDate: z.string().optional(),
      location: z.string().optional(),
      description: z.string().max(2000).optional(),
      notes: z.string().max(500).optional(),
    });

    const validated = schema.parse(req.body);

    // Allowlist updates
    if (validated.name !== undefined) inventory.name = validated.name;
    if (validated.unitType !== undefined) inventory.unitType = validated.unitType;
    if (validated.totalUnits !== undefined) {
      // Cannot reduce totalUnits below bookedUnits
      if (validated.totalUnits < inventory.bookedUnits) {
        return res.status(400).json({
          error: `Cannot reduce total units below booked units (${inventory.bookedUnits})`,
        });
      }
      inventory.totalUnits = validated.totalUnits;
    }
    if (validated.pricePerUnit !== undefined) inventory.pricePerUnit = validated.pricePerUnit;
    if (validated.pricingPeriod !== undefined) inventory.pricingPeriod = validated.pricingPeriod;
    if (validated.currency !== undefined) inventory.currency = validated.currency;
    if (validated.minOrderQuantity !== undefined) inventory.minOrderQuantity = validated.minOrderQuantity;
    if (validated.availabilityStartDate !== undefined) inventory.availabilityStartDate = new Date(validated.availabilityStartDate);
    if (validated.availabilityEndDate !== undefined) inventory.availabilityEndDate = new Date(validated.availabilityEndDate);
    if (validated.location !== undefined) inventory.location = validated.location;
    if (validated.description !== undefined) inventory.description = validated.description;
    if (validated.notes !== undefined) inventory.notes = validated.notes;

    await inventory.save();

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'UPDATE_INVENTORY',
      targetModel: 'Inventory',
      targetId: inventory._id,
      changes: validated,
      ipAddress: req.ip,
    });

    res.json(await inventory.populate('gpuClusterListingId', 'vendorName gpu location'));
  } catch (err) { next(err); }
};

// PUT /api/inventory/:id/status
const updateInventoryStatus = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    const schema = z.object({
      status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED']),
    });

    const { status } = schema.parse(req.body);

    // Validate transitions
    const allowedTransitions = {
      AVAILABLE: ['RESERVED', 'ARCHIVED'],
      RESERVED: ['SOLD', 'AVAILABLE'],
      SOLD: ['ARCHIVED'],
      ARCHIVED: [],
    };

    if (!allowedTransitions[inventory.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${inventory.status} to ${status}`,
      });
    }

    inventory.status = status;
    await inventory.save();

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'UPDATE_INVENTORY_STATUS',
      targetModel: 'Inventory',
      targetId: inventory._id,
      changes: { status },
      ipAddress: req.ip,
    });

    res.json(await inventory.populate('gpuClusterListingId', 'vendorName gpu location'));
  } catch (err) { next(err); }
};

// DELETE /api/inventory/:id
const deleteInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    // Guard: cannot delete if RESERVED or SOLD
    if (['RESERVED', 'SOLD'].includes(inventory.status)) {
      return res.status(400).json({
        error: `Cannot delete inventory with status ${inventory.status}.`,
      });
    }

    // Delete all associated reservations
    await InventoryReservation.deleteMany({ inventoryId: inventory._id });

    await inventory.deleteOne();

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'DELETE_INVENTORY',
      targetModel: 'Inventory',
      targetId: inventory._id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Inventory deleted' });
  } catch (err) { next(err); }
};

// GET /api/inventory/:id/reservations
const listReservations = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    const reservations = await InventoryReservation.find({ inventoryId: req.params.id })
      .populate('customerOrgId', 'companyName')
      .populate('bookedBy', 'email')
      .sort('-createdAt');

    res.json(reservations);
  } catch (err) { next(err); }
};

// POST /api/inventory/:id/reservations
const createReservation = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    // Guard: inventory must be AVAILABLE
    if (inventory.status !== 'AVAILABLE') {
      return res.status(400).json({
        error: `Cannot reserve from ${inventory.status} inventory. Only AVAILABLE inventory can be reserved.`,
      });
    }

    const schema = z.object({
      customerOrgId: z.string().min(1, 'Customer organization is required'),
      units: z.number().min(1, 'Units must be at least 1'),
      contractStartDate: z.string().datetime(),
      contractEndDate: z.string().datetime(),
      notes: z.string().max(500).optional(),
    });

    const validated = schema.parse(req.body);

    // Verify customer org exists
    const customerOrg = await Organization.findById(validated.customerOrgId);
    if (!customerOrg) {
      return res.status(404).json({ error: 'Customer organization not found' });
    }

    // Guard: check sufficient available units
    if (validated.units > inventory.availableUnits) {
      return res.status(400).json({
        error: `Not enough available units. Requested: ${validated.units}, Available: ${inventory.availableUnits}`,
      });
    }

    const startDate = new Date(validated.contractStartDate);
    const endDate = new Date(validated.contractEndDate);

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'Contract end date must be after start date' });
    }

    // Create reservation
    const reservation = new InventoryReservation({
      inventoryId: inventory._id,
      customerOrgId: validated.customerOrgId,
      bookedBy: req.user.userId,
      units: validated.units,
      contractStartDate: startDate,
      contractEndDate: endDate,
      notes: validated.notes,
      status: 'ACTIVE',
    });

    await reservation.save();

    // Update inventory: increment bookedUnits
    inventory.bookedUnits += validated.units;

    // Auto-transition: if all units booked, change status to RESERVED
    if (inventory.availableUnits === 0) {
      inventory.status = 'RESERVED';
    }

    await inventory.save();

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'CREATE_INVENTORY_RESERVATION',
      targetModel: 'InventoryReservation',
      targetId: reservation._id,
      changes: { units: validated.units, customerOrgId: validated.customerOrgId },
      ipAddress: req.ip,
    });

    res.status(201).json(
      await reservation.populate('customerOrgId', 'companyName').populate('bookedBy', 'email'),
    );
  } catch (err) { next(err); }
};

// PUT /api/inventory/:id/reservations/:resId/cancel
const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await InventoryReservation.findById(req.params.resId);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    // Mark as cancelled
    reservation.status = 'CANCELLED';
    await reservation.save();

    // Update inventory: decrement bookedUnits
    inventory.bookedUnits -= reservation.units;
    inventory.bookedUnits = Math.max(0, inventory.bookedUnits);

    // Auto-transition: if no units booked, change status to AVAILABLE
    if (inventory.bookedUnits === 0) {
      inventory.status = 'AVAILABLE';
    }

    await inventory.save();

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'CANCEL_INVENTORY_RESERVATION',
      targetModel: 'InventoryReservation',
      targetId: reservation._id,
      changes: { status: 'CANCELLED' },
      ipAddress: req.ip,
    });

    res.json(await reservation.populate('customerOrgId', 'companyName').populate('bookedBy', 'email'));
  } catch (err) { next(err); }
};

module.exports = {
  listInventory,
  createInventory,
  getInventory,
  updateInventory,
  updateInventoryStatus,
  deleteInventory,
  listReservations,
  createReservation,
  cancelReservation,
};
