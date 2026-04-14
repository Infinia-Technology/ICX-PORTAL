const { z } = require('zod');
const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');

// Helper to map Prisma pagination
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

// GET /api/inventory
const listInventory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, country, city, search } = req.query;

    const where = ['admin', 'superadmin'].includes(req.user.role)
      ? {}
      : { supplier_id: req.user.userId };

    // Apply extra filters
    if (status) where.status = status;
    if (country) where.country = country;
    if (city) where.city = city;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { data_center_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const result = await paginatePrisma(prisma.listing, where, page, limit, { supplier: { select: { name: true, email: true } } });

    // Mapping for frontend compatibility
    result.data = result.data.map(item => ({
      ...item,
      _id: item.id,
      totalUnits: item.total_units,
      bookedUnits: item.booked_units,
      availableUnits: item.available_units,
      pricePerUnit: item.price,
      pricingPeriod: item.contract_duration,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      gpuClusterListingId: { _id: item.metadata?.gpuClusterListingId, vendorName: item.data_center_name }
    }));

    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/inventory
const createInventory = async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1, 'Name is required').optional(),
      data_center_name: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      totalUnits: z.number().min(1, 'Total units must be at least 1'),
      pricePerUnit: z.number().min(0).optional(),
      currency: z.string().optional(),
      contract_duration: z.string().optional(),
    });

    const validated = schema.parse(req.body);

    const listing = await prisma.listing.create({
      data: {
        supplier_id: req.user.userId,
        name: validated.name,
        data_center_name: validated.data_center_name,
        country: validated.country,
        city: validated.city,
        total_units: validated.totalUnits,
        booked_units: 0,
        available_units: validated.totalUnits,
        price: validated.pricePerUnit,
        currency: validated.currency || 'USD',
        status: 'AVAILABLE',
        contract_duration: validated.contract_duration,
        type: 'GPU_CLUSTER' // Default for inventory page context
      },
      include: { supplier: { select: { name: true, email: true } } }
    });

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'CREATE_INVENTORY',
      targetModel: 'Listing',
      targetId: listing.id,
      changes: { total_units: validated.totalUnits },
      ipAddress: req.ip,
    });

    res.status(201).json(listing);
  } catch (err) { next(err); }
};

// GET /api/inventory/:id
const getInventory = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: { select: { name: true, email: true } },
        reservations: {
          include: {
            customer: { select: { name: true, email: true } }
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    const formatted = {
      ...listing,
      _id: listing.id,
      totalUnits: listing.total_units,
      bookedUnits: listing.booked_units,
      availableUnits: listing.available_units,
      pricePerUnit: listing.price,
      pricingPeriod: listing.contract_duration,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      gpuClusterListingId: { _id: listing.metadata?.gpuClusterListingId, vendorName: listing.data_center_name }
    };

    res.json(formatted);
  } catch (err) { next(err); }
};

// PUT /api/inventory/:id
const updateInventory = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    // Guard: cannot edit if RESERVED or SOLD
    if (['RESERVED', 'SOLD'].includes(listing.status)) {
      return res.status(400).json({
        error: `Cannot edit inventory with status ${listing.status}. Only AVAILABLE inventory can be modified.`,
      });
    }

    const schema = z.object({
      name: z.string().min(1).optional(),
      data_center_name: z.string().optional(),
      totalUnits: z.number().min(1).optional(),
      pricePerUnit: z.number().min(0).optional(),
      currency: z.string().optional(),
    });

    const validated = schema.parse(req.body);

    const updateData = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.data_center_name !== undefined) updateData.data_center_name = validated.data_center_name;
    if (validated.pricePerUnit !== undefined) updateData.price = validated.pricePerUnit;
    if (validated.currency !== undefined) updateData.currency = validated.currency;

    if (validated.totalUnits !== undefined) {
      if (validated.totalUnits < listing.booked_units) {
        return res.status(400).json({ error: `Cannot reduce total units below booked units (${listing.booked_units})` });
      }
      updateData.total_units = validated.totalUnits;
      updateData.available_units = validated.totalUnits - listing.booked_units;
    }

    const updatedListing = await prisma.listing.update({
      where: { id: req.params.id },
      data: updateData,
      include: { supplier: true }
    });

    res.json({
      ...updatedListing,
      _id: updatedListing.id,
      totalUnits: updatedListing.total_units,
      bookedUnits: updatedListing.booked_units,
      availableUnits: updatedListing.available_units,
      pricePerUnit: updatedListing.price,
      pricingPeriod: updatedListing.contract_duration,
      createdAt: updatedListing.created_at,
      updatedAt: updatedListing.updated_at,
    });
  } catch (err) { next(err); }
};

// PUT /api/inventory/:id/status
const updateInventoryStatus = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
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

    if (!allowedTransitions[listing.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${listing.status} to ${status}`,
      });
    }

    const updateData = { status };
    if (status === 'ARCHIVED') {
      updateData.archived_at = new Date();
    }

    const updatedListing = await prisma.listing.update({
      where: { id: req.params.id },
      data: updateData,
      include: { supplier: true }
    });

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'UPDATE_INVENTORY_STATUS',
      targetModel: 'Listing',
      targetId: updatedListing.id,
      changes: { status },
      ipAddress: req.ip,
    });

    res.json(updatedListing);
  } catch (err) { next(err); }
};

// DELETE /api/inventory/:id
const deleteInventory = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    if (['RESERVED', 'SOLD'].includes(listing.status)) {
      return res.status(400).json({ error: `Cannot delete inventory with status ${listing.status}.` });
    }

    // Prisma handles cascading dynamically if set, but we manually delete reservations first
    await prisma.reservation.deleteMany({ where: { listing_id: listing.id } });
    await prisma.listing.delete({ where: { id: listing.id } });

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'DELETE_INVENTORY',
      targetModel: 'Listing',
      targetId: listing.id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Inventory deleted' });
  } catch (err) { next(err); }
};

// GET /api/inventory/:id/reservations
const listReservations = async (req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { listing_id: req.params.id },
      include: { customer: { select: { name: true, email: true } } },
      orderBy: { created_at: 'desc' },
    });

    res.json(reservations);
  } catch (err) { next(err); }
};

// POST /api/inventory/:id/reservations
const createReservation = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Inventory not found' });

    if (listing.status !== 'AVAILABLE') {
      return res.status(400).json({ error: `Cannot reserve from ${listing.status} inventory.` });
    }

    const schema = z.object({
      customer_id: z.string().min(1, 'Customer user is required'),
      units: z.number().min(1, 'Units must be at least 1'),
      contractStartDate: z.string().datetime(),
      contractEndDate: z.string().datetime(),
    });

    const validated = schema.parse(req.body);

    if (validated.units > listing.available_units) {
      return res.status(400).json({ error: `Not enough available units. Available: ${listing.available_units}` });
    }

    const startDate = new Date(validated.contractStartDate);
    const endDate = new Date(validated.contractEndDate);

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'Contract end date must be after start date' });
    }

    // Transaction to ensure data integrity
    const [reservation, updatedListing] = await prisma.$transaction([
      prisma.reservation.create({
        data: {
          listing_id: listing.id,
          customer_id: validated.customer_id,
          reserved_units: validated.units,
          start_date: startDate,
          end_date: endDate,
          status: 'ACTIVE',
        },
        include: { customer: { select: { name: true, email: true } } }
      }),
      prisma.listing.update({
        where: { id: listing.id },
        data: {
          booked_units: { increment: validated.units },
          available_units: { decrement: validated.units },
          status: (listing.available_units - validated.units === 0) ? 'RESERVED' : listing.status
        }
      })
    ]);

    // Audit
    await logAction({
      userId: req.user.userId,
      action: 'CREATE_INVENTORY_RESERVATION',
      targetModel: 'Reservation',
      targetId: reservation.id,
      changes: { units: validated.units, customer_id: validated.customer_id },
      ipAddress: req.ip,
    });

    res.status(201).json(reservation);
  } catch (err) { next(err); }
};

// PUT /api/inventory/:id/reservations/:resId/cancel
const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.resId } });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'CANCELLED' }
      }),
      prisma.listing.update({
        where: { id: reservation.listing_id },
        data: {
          booked_units: { decrement: reservation.reserved_units },
          available_units: { increment: reservation.reserved_units },
          status: 'AVAILABLE' // Assuming cancellation frees it up
        }
      })
    ]);

    res.json({ message: 'Reservation cancelled successfully', id: reservation.id });
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
