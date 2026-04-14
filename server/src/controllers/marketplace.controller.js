const prisma = require('../config/prisma');

// Fields hidden for reader role on DC listings
const DC_READER_HIDDEN = [
  'storageRentUsd', 'annualEscalationPct', 'additionalOpex', 'insuranceByDc', 'depositRequired',
  'powerPriceStructure', 'ppa', 'avgPowerPriceCents', 'crossConnectPricing',
  'leaseTermOptions', 'breakExtensionRights', 'paymentFrequency', 'depositRequirement',
  'remoteHandsPricing', 'otherOpex', 'fitOutContribution', 'makeGoodObligations',
  'taxVatTreatment', 'indexationBasis',
];

// Fields hidden for customer role on DC listings
const DC_CUSTOMER_HIDDEN_CONTACT = ['contactName', 'contactMobile', 'otherDetails'];

// Fields hidden for reader on GPU clusters
const GPU_READER_HIDDEN = ['restrictedUse'];

const filterFields = (obj, role, type) => {
  if (!obj) return null;
  const filtered = { ...obj };
  
  // Flatten specifications for filtering if needed, but usually we just filter the top-level keys
  if (type === 'DC_SITE') {
    if (role === 'reader') {
      DC_READER_HIDDEN.forEach(f => delete filtered[f]);
      DC_CUSTOMER_HIDDEN_CONTACT.forEach(f => delete filtered[f]);
    } else if (role === 'customer') {
      DC_CUSTOMER_HIDDEN_CONTACT.forEach(f => delete filtered[f]);
    }
  } else if (type === 'GPU_CLUSTER') {
    if (role === 'reader') {
      GPU_READER_HIDDEN.forEach(f => delete filtered[f]);
    }
  }
  return filtered;
};

// Helper for Prisma pagination
const paginatePrisma = async (model, where, page, limit, include = null, orderBy = { updated_at: 'desc' }) => {
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

// GET /api/marketplace/dc-listings
const getDcListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const where = { type: 'DC_SITE', status: 'APPROVED' };

    const result = await paginatePrisma(prisma.listing, where, page, limit, {
      sites: { take: 1 }
    });

    result.data = result.data.map(l => {
      const filteredListing = filterFields(l, req.user.role, 'DC_SITE');
      const firstSite = l.sites[0] ? filterFields(l.sites[0], req.user.role, 'DC_SITE') : null;
      return { ...filteredListing, _id: l.id, site: firstSite };
    });

    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/marketplace/dc-listings/:id
const getDcListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id: req.params.id, type: 'DC_SITE', status: 'APPROVED' },
      include: { 
        sites: { include: { documents: true } }
      }
    });
    if (!listing) return res.status(404).json({ error: 'DC listing not found' });

    const filteredListing = filterFields(listing, req.user.role, 'DC_SITE');
    
    // Privacy logic for documents
    const canSeeDocs = ['admin', 'superadmin', 'supplier', 'broker'].includes(req.user.role);
    
    const sites = listing.sites.map(s => ({
      ...filterFields(s, req.user.role, 'DC_SITE'),
      documents: canSeeDocs ? s.documents : []
    }));

    res.json({ ...filteredListing, _id: listing.id, sites });
  } catch (err) { next(err); }
};

// GET /api/marketplace/gpu-clusters
const getGpuClusters = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const where = { type: 'GPU_CLUSTER', status: 'APPROVED' };

    const result = await paginatePrisma(prisma.listing, where, page, limit);

    result.data = result.data.map(l => ({
      ...filterFields(l, req.user.role, 'GPU_CLUSTER'),
      _id: l.id
    }));

    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/marketplace/gpu-clusters/:id
const getGpuCluster = async (req, res, next) => {
  try {
    const cluster = await prisma.listing.findFirst({
      where: { id: req.params.id, type: 'GPU_CLUSTER', status: 'APPROVED' }
    });
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    const filtered = filterFields(cluster, req.user.role, 'GPU_CLUSTER');

    // Note: documents for GPU clusters in the new schema would need a join if stored separately.
    // For now, assume they are part of metadata or we'll fetch them if we add a GpuDocument model.
    res.json({ ...filtered, _id: cluster.id, documents: [] });
  } catch (err) { next(err); }
};

module.exports = { getDcListings, getDcListing, getGpuClusters, getGpuCluster };
