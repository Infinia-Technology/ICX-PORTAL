const DcApplication = require('../models/DcApplication');
const DcSite = require('../models/DcSite');
const DcDocument = require('../models/DcDocument');
const GpuClusterListing = require('../models/GpuClusterListing');
const GpuClusterDocument = require('../models/GpuClusterDocument');
const { paginate } = require('../utils/pagination');

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

const filterDcFields = (data, role) => {
  const obj = typeof data.toObject === 'function' ? data.toObject() : { ...data };
  if (role === 'reader') {
    DC_READER_HIDDEN.forEach((f) => delete obj[f]);
    DC_CUSTOMER_HIDDEN_CONTACT.forEach((f) => delete obj[f]);
  } else if (role === 'customer') {
    DC_CUSTOMER_HIDDEN_CONTACT.forEach((f) => delete obj[f]);
  }
  return obj;
};

const filterGpuFields = (data, role) => {
  const obj = typeof data.toObject === 'function' ? data.toObject() : { ...data };
  if (role === 'reader') {
    GPU_READER_HIDDEN.forEach((f) => delete obj[f]);
  }
  return obj;
};

// GET /api/marketplace/dc-listings
const getDcListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, country, minMw, maxMw } = req.query;
    const filter = { status: 'APPROVED' };

    const apps = await DcApplication.find(filter).sort('-updatedAt').limit(parseInt(limit) * parseInt(page));

    // Attach first site info for listing cards
    const results = await Promise.all(apps.map(async (app) => {
      const site = await DcSite.findOne({ dcApplicationId: app._id });
      const filteredSite = site ? filterDcFields(site, req.user.role) : null;
      const filteredApp = filterDcFields(app, req.user.role);
      return { ...filteredApp, site: filteredSite };
    }));

    res.json({ data: results, total: results.length });
  } catch (err) { next(err); }
};

// GET /api/marketplace/dc-listings/:id
const getDcListing = async (req, res, next) => {
  try {
    const app = await DcApplication.findOne({ _id: req.params.id, status: 'APPROVED' });
    if (!app) return res.status(404).json({ error: 'DC listing not found' });

    const sites = await DcSite.find({ dcApplicationId: app._id });
    const filteredApp = filterDcFields(app, req.user.role);
    const filteredSites = sites.map((s) => {
      const filteredSite = filterDcFields(s, req.user.role);
      // Readers and customers don't see documents
      return filteredSite;
    });

    // Only show documents for admins/suppliers, not customers/readers
    let documents = [];
    if (['admin', 'superadmin', 'supplier', 'broker'].includes(req.user.role)) {
      for (const site of sites) {
        const docs = await DcDocument.find({ dcSiteId: site._id });
        documents.push(...docs);
      }
    }

    res.json({ ...filteredApp, sites: filteredSites, documents });
  } catch (err) { next(err); }
};

// GET /api/marketplace/gpu-clusters
const getGpuClusters = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await paginate(GpuClusterListing, { status: 'APPROVED' }, {
      page: parseInt(page), limit: parseInt(limit), sort: '-updatedAt',
    });

    result.data = result.data.map((c) => filterGpuFields(c, req.user.role));
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/marketplace/gpu-clusters/:id
const getGpuCluster = async (req, res, next) => {
  try {
    const cluster = await GpuClusterListing.findOne({ _id: req.params.id, status: 'APPROVED' });
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    const filtered = filterGpuFields(cluster, req.user.role);

    let documents = [];
    if (['admin', 'superadmin', 'supplier', 'broker'].includes(req.user.role)) {
      documents = await GpuClusterDocument.find({ gpuClusterListingId: cluster._id });
    }

    res.json({ ...filtered, documents });
  } catch (err) { next(err); }
};

module.exports = { getDcListings, getDcListing, getGpuClusters, getGpuCluster };
