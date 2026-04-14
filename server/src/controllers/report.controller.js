const prisma = require('../config/prisma');
const { logAction } = require('../services/audit.service');
const XLSX = require('xlsx');

// ======================= EXPORT HELPERS =======================

const toXlsx = (data, fields) => {
  const headers = fields && fields.length > 0
    ? fields
    : data.length > 0
      ? Object.keys(data[0]).filter((k) => k !== 'id' && k !== '_id')
      : [];

  if (headers.length === 0) return Buffer.alloc(0);

  const rows = data.map((row) =>
    headers.reduce((acc, h) => {
      const val = row[h];
      acc[h] = val instanceof Date ? val.toISOString() : Array.isArray(val) ? val.join('; ') : (val ?? '');
      return acc;
    }, {}),
  );

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}], { header: headers });
  ws['!cols'] = headers.map((h) => ({
    wch: Math.max(h.length, ...rows.slice(0, 100).map((r) => String(r[h] ?? '').length)) + 2,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const toCsv = (data, fields) => {
  const headers = fields && fields.length > 0
    ? fields
    : data.length > 0
      ? Object.keys(data[0]).filter((k) => k !== 'id' && k !== '_id')
      : [];

  if (headers.length === 0) return '';

  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const formatted = val instanceof Date ? val.toISOString()
        : Array.isArray(val) ? val.join('; ')
          : (val ?? '');
      return JSON.stringify(String(formatted));
    }).join(','),
  );
  return [headers.join(','), ...rows].join('\n');
};

// ======================= QUERY BUILDER =======================

const buildFilter = (filters, reportType) => {
  const where = {};
  if (!filters) return where;

  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters.country) {
    where.country = { contains: filters.country, mode: 'insensitive' };
  }

  if (filters.location) {
    where.OR = [
      { city: { contains: filters.location, mode: 'insensitive' } },
      { state: { contains: filters.location, mode: 'insensitive' } },
      { country: { contains: filters.location, mode: 'insensitive' } }
    ];
  }

  if (filters.dateRange) {
    const field = filters.dateRange.field === 'updatedAt' ? 'updated_at' : 'created_at';
    where[field] = {};
    if (filters.dateRange.startDate) where[field].gte = new Date(filters.dateRange.startDate);
    if (filters.dateRange.endDate) where[field].lte = new Date(filters.dateRange.endDate);
  }

  return where;
};

// ======================= DATA FETCHERS =======================

const fetchDcListings = async (where, { sortBy, sortDirection, page, limit }) => {
  const orderBy = { [sortBy || 'created_at']: sortDirection || 'desc' };
  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = page && limit ? limit : undefined;

  where.type = 'DC_SITE';

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({ 
      where, 
      orderBy, 
      skip, 
      take,
      include: { organization: true, sites: true }
    }),
    prisma.listing.count({ where })
  ]);

  const data = listings.map((l) => ({
    listingId: l.id,
    supplierName: l.organization?.company_name || l.data_center_name || '',
    supplierEmail: l.organization?.contact_email || '',
    dataCenterName: l.data_center_name || '',
    country: l.country || '',
    city: l.city || '',
    status: l.status,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    siteCount: l.sites.length,
    totalMW: l.total_mw || 0,
    availableMW: l.available_mw || 0
  }));

  return { data, total };
};

const fetchGpuClusters = async (where, { sortBy, sortDirection, page, limit }) => {
  where.type = 'GPU_CLUSTER';
  const orderBy = { [sortBy || 'created_at']: sortDirection || 'desc' };
  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = page && limit ? limit : undefined;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({ where, orderBy, skip, take, include: { organization: true } }),
    prisma.listing.count({ where })
  ]);

  const data = listings.map((l) => ({
    listingId: l.id,
    supplierName: l.organization?.company_name || l.name || '',
    gpu: l.specifications?.gpuModel || '',
    totalUnits: l.total_units,
    availableUnits: l.available_units,
    status: l.status,
    createdAt: l.created_at
  }));

  return { data, total };
};

const fetchSuppliers = async (where, { sortBy, sortDirection, page, limit }) => {
  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = page && limit ? limit : undefined;
  
  const orgWhere = { type: { in: ['SUPPLIER', 'BROKER'] } };
  if (where.country) orgWhere.jurisdiction = { contains: where.country.contains, mode: 'insensitive' };
  if (where.status) orgWhere.status = where.status;

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({ 
      where: orgWhere, 
      orderBy: { created_at: sortDirection || 'desc' },
      skip, take,
      include: { _count: { select: { listings: true } } }
    }),
    prisma.organization.count({ where: orgWhere })
  ]);

  const data = orgs.map((o) => ({
    organizationId: o.id,
    companyName: o.company_name,
    type: o.type,
    status: o.status,
    contactEmail: o.contact_email,
    listingCount: o._count.listings,
    createdAt: o.created_at
  }));

  return { data, total };
};

const fetchAnalytics = async () => {
  const [suppliers, customers, listings] = await Promise.all([
    prisma.organization.count({ where: { type: 'SUPPLIER', status: 'APPROVED' } }),
    prisma.organization.count({ where: { type: 'CUSTOMER', status: 'APPROVED' } }),
    prisma.listing.count({ where: { status: 'APPROVED' } })
  ]);
  return {
    data: [{ totalSuppliers: suppliers, totalCustomers: customers, totalListings: listings, exportedAt: new Date() }],
    total: 1
  };
};

// ======================= TEMPLATE CRUD =======================

const getTemplates = async (req, res, next) => {
  try {
    const templates = await prisma.reportTemplate.findMany({
      where: { user_id: req.user.userId },
      orderBy: { created_at: 'desc' }
    });
    res.json(templates.map(t => ({ ...t, _id: t.id })));
  } catch (err) { next(err); }
};

const createTemplate = async (req, res, next) => {
  try {
    const { name, reportType, selectedFields, filters } = req.body;
    const template = await prisma.reportTemplate.create({
      data: {
        user_id: req.user.userId,
        name,
        selected_fields: selectedFields || [],
        filters: filters || {}
      }
    });
    await logAction({ userId: req.user.userId, action: 'CREATE_REPORT_TEMPLATE', targetModel: 'ReportTemplate', targetId: template.id });
    res.status(201).json({ ...template, _id: template.id });
  } catch (err) { next(err); }
};

const deleteTemplate = async (req, res, next) => {
  try {
    await prisma.reportTemplate.delete({ where: { id: req.params.id, user_id: req.user.userId } });
    await logAction({ userId: req.user.userId, action: 'DELETE_REPORT_TEMPLATE', targetModel: 'ReportTemplate', targetId: req.params.id });
    res.json({ message: 'Template deleted' });
  } catch (err) { next(err); }
};

// ======================= GENERATE & PREVIEW =======================

const VALID_TYPES = ['DC_LISTINGS', 'GPU_CLUSTERS', 'SUPPLIERS', 'INVENTORY', 'ANALYTICS'];

const generateReport = async (req, res, next) => {
  try {
    const { reportType, selectedFields, filters, sortBy, sortDirection, exportFormat } = req.body;

    if (!VALID_TYPES.includes(reportType)) return res.status(400).json({ error: 'Invalid reportType' });

    const where = buildFilter(filters, reportType);
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      where.supplier_id = req.user.organization_id;
    }

    let result;
    const opts = { sortBy, sortDirection };

    if (reportType === 'DC_LISTINGS') result = await fetchDcListings(where, opts);
    else if (reportType === 'GPU_CLUSTERS' || reportType === 'INVENTORY') result = await fetchGpuClusters(where, opts);
    else if (reportType === 'SUPPLIERS') result = await fetchSuppliers(where, opts);
    else result = await fetchAnalytics();

    let responseData;
    let contentType;
    let filename = `${reportType}-${Date.now()}`;

    const data = result.data;

    if (exportFormat === 'json') {
      responseData = JSON.stringify(data, null, 2);
      contentType = 'application/json';
      filename += '.json';
    } else if (exportFormat === 'xlsx') {
      responseData = toXlsx(data, selectedFields);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename += '.xlsx';
    } else {
      responseData = toCsv(data, selectedFields);
      contentType = 'text/csv';
      filename += '.csv';
    }

    await logAction({ userId: req.user.userId, action: 'GENERATE_REPORT', targetModel: 'Report', changes: { reportType, rowCount: data.length, format: exportFormat } });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(responseData);
  } catch (err) { next(err); }
};

const previewReport = async (req, res, next) => {
  try {
    const { reportType, filters, sortBy, sortDirection, page = 1, limit = 20 } = req.body;
    const where = buildFilter(filters, reportType);
    if (!['admin', 'superadmin'].includes(req.user.role)) where.supplier_id = req.user.organization_id;

    let result;
    const opts = { sortBy, sortDirection, page: parseInt(page), limit: parseInt(limit) };

    if (reportType === 'DC_LISTINGS') result = await fetchDcListings(where, opts);
    else if (reportType === 'GPU_CLUSTERS' || reportType === 'INVENTORY') result = await fetchGpuClusters(where, opts);
    else if (reportType === 'SUPPLIERS') result = await fetchSuppliers(where, opts);
    else result = await fetchAnalytics();

    res.json({
      preview: result.data,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.total / parseInt(limit))
    });
  } catch (err) { next(err); }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { name, selectedFields, filters } = req.body;
    const updated = await prisma.reportTemplate.update({
      where: { id: req.params.id, user_id: req.user.userId },
      data: {
        name,
        selected_fields: selectedFields,
        filters: filters
      }
    });
    res.json({ ...updated, _id: updated.id });
  } catch (err) { next(err); }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateReport,
  previewReport,
};
