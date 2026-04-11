const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const DcApplication = require('../models/DcApplication');
const DcSite = require('../models/DcSite');
const GpuClusterListing = require('../models/GpuClusterListing');
const Organization = require('../models/Organization');
const { logAction } = require('../services/audit.service');

router.use(authenticate);

// Helper: flatten object to CSV-friendly format
const flattenObj = (obj, prefix = '') =>
  Object.keys(obj).reduce((acc, key) => {
    const val = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof Object.getPrototypeOf(val).constructor)) {
      Object.assign(acc, flattenObj(val, newKey));
    } else {
      acc[newKey] = Array.isArray(val) ? val.join('; ') : val;
    }
    return acc;
  }, {});

const toCsv = (data) => {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
};

// GET /api/reports/dc-listing/:id/pdf
router.get('/dc-listing/:id/pdf', authorize('supplier', 'broker', 'admin'), async (req, res, next) => {
  try {
    const app = await DcApplication.findById(req.params.id).lean();
    if (!app) return res.status(404).json({ error: 'DC listing not found' });

    const sites = await DcSite.find({ dcApplicationId: app._id }).lean();

    // Simple HTML-based PDF response (client can print to PDF)
    const html = `<html><body><h1>DC Listing Report</h1><pre>${JSON.stringify({ ...app, sites }, null, 2)}</pre></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="dc-listing-${req.params.id}.html"`);
    res.send(html);
  } catch (err) { next(err); }
});

// GET /api/reports/dc-listing/:id/csv
router.get('/dc-listing/:id/csv', authorize('supplier', 'broker', 'admin'), async (req, res, next) => {
  try {
    const app = await DcApplication.findById(req.params.id).lean();
    if (!app) return res.status(404).json({ error: 'DC listing not found' });

    const sites = await DcSite.find({ dcApplicationId: app._id }).lean();
    const rows = sites.map((s) => flattenObj({ ...app, ...s }));
    const csv = toCsv(rows.length ? rows : [flattenObj(app)]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dc-listing-${req.params.id}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /api/reports/gpu-cluster/:id/pdf
router.get('/gpu-cluster/:id/pdf', authorize('supplier', 'broker', 'admin'), async (req, res, next) => {
  try {
    const cluster = await GpuClusterListing.findById(req.params.id).lean();
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    const html = `<html><body><h1>GPU Cluster Report</h1><pre>${JSON.stringify(cluster, null, 2)}</pre></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="gpu-cluster-${req.params.id}.html"`);
    res.send(html);
  } catch (err) { next(err); }
});

// GET /api/reports/gpu-cluster/:id/csv
router.get('/gpu-cluster/:id/csv', authorize('supplier', 'broker', 'admin'), async (req, res, next) => {
  try {
    const cluster = await GpuClusterListing.findById(req.params.id).lean();
    if (!cluster) return res.status(404).json({ error: 'GPU cluster not found' });

    const csv = toCsv([flattenObj(cluster)]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gpu-cluster-${req.params.id}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /api/reports/supplier/:id/pdf
router.get('/supplier/:id/pdf', authorize('admin'), async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id).lean();
    if (!org) return res.status(404).json({ error: 'Supplier not found' });

    const dcApps = await DcApplication.find({ organizationId: org._id }).lean();
    const gpuClusters = await GpuClusterListing.find({ organizationId: org._id }).lean();

    const html = `<html><body><h1>Supplier Report</h1><pre>${JSON.stringify({ org, dcApps, gpuClusters }, null, 2)}</pre></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="supplier-${req.params.id}.html"`);
    res.send(html);
  } catch (err) { next(err); }
});

// GET /api/reports/analytics/csv
router.get('/analytics/csv', authorize('admin'), async (req, res, next) => {
  try {
    const [totalSuppliers, totalCustomers, totalDcListings, totalGpuClusters] = await Promise.all([
      Organization.countDocuments({ type: { $in: ['SUPPLIER', 'BROKER'] }, status: 'APPROVED' }),
      Organization.countDocuments({ type: 'CUSTOMER', status: 'APPROVED' }),
      DcApplication.countDocuments({ status: 'APPROVED' }),
      GpuClusterListing.countDocuments({ status: 'APPROVED' }),
    ]);

    const csv = toCsv([{ totalSuppliers, totalCustomers, totalDcListings, totalGpuClusters, exportedAt: new Date() }]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

module.exports = router;
