const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const reportController = require('../controllers/report.controller');

router.use(authenticate);

// ======================= DYNAMIC REPORTS =======================

// GET /api/reports/templates
router.get('/templates', reportController.getTemplates);

// POST /api/reports/templates
router.post('/templates', reportController.createTemplate);

// PUT /api/reports/templates/:id
router.put('/templates/:id', reportController.updateTemplate);

// DELETE /api/reports/templates/:id
router.delete('/templates/:id', reportController.deleteTemplate);

// POST /api/reports/generate
router.post('/generate', reportController.generateReport);

// POST /api/reports/preview
router.post('/preview', reportController.previewReport);

// ======================= LEGACY SINGLE LISTING REPORTS =======================

// Helper: flatten object to CSV-friendly format
const flattenObj = (obj, prefix = '') =>
  Object.keys(obj).reduce((acc, key) => {
    const val = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
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
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { sites: true }
    });
    if (!listing) return res.status(404).json({ error: 'DC listing not found' });

    // Simple HTML-based PDF response (client can print to PDF)
    const html = `<html><body><h1>DC Listing Report</h1><pre>${JSON.stringify(listing, null, 2)}</pre></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="dc-listing-${req.params.id}.html"`);
    res.send(html);
  } catch (err) { next(err); }
});

// GET /api/reports/dc-listing/:id/csv
router.get('/dc-listing/:id/csv', authorize('supplier', 'broker', 'admin'), async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { sites: true }
    });
    if (!listing) return res.status(404).json({ error: 'DC listing not found' });

    const rows = listing.sites.map((s) => flattenObj({ ...listing, ...s }));
    const csv = toCsv(rows.length ? rows : [flattenObj(listing)]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dc-listing-${req.params.id}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /api/reports/gpu-cluster/:id/pdf
router.get('/gpu-cluster/:id/pdf', authorize('supplier', 'broker', 'admin'), async (req, res, next) => {
  try {
    const cluster = await prisma.listing.findUnique({
      where: { id: req.params.id }
    });
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
    const cluster = await prisma.listing.findUnique({
      where: { id: req.params.id }
    });
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
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        listings: true
      }
    });
    if (!org) return res.status(404).json({ error: 'Supplier not found' });

    const dcApps = org.listings.filter(l => l.type === 'DC_SITE');
    const gpuClusters = org.listings.filter(l => l.type === 'GPU_CLUSTER');

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
      prisma.organization.count({ where: { type: { in: ['SUPPLIER', 'BROKER'] }, status: 'APPROVED' } }),
      prisma.organization.count({ where: { type: 'CUSTOMER', status: 'APPROVED' } }),
      prisma.listing.count({ where: { type: 'DC_SITE', status: 'APPROVED' } }),
      prisma.listing.count({ where: { type: 'GPU_CLUSTER', status: 'APPROVED' } }),
    ]);

    const csv = toCsv([{ totalSuppliers, totalCustomers, totalDcListings, totalGpuClusters, exportedAt: new Date() }]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

module.exports = router;
