const DcApplication = require('../models/DcApplication');
const DcSite = require('../models/DcSite');
const GpuClusterListing = require('../models/GpuClusterListing');
const Organization = require('../models/Organization');
const ReportTemplate = require('../models/ReportTemplate');
const { logAction } = require('../services/audit.service');
const { paginate } = require('../utils/pagination');

// Convert data to CSV
const toCsv = (data, selectedFields = null) => {
  if (!data.length) return '';

  let headers = selectedFields && selectedFields.length > 0
    ? selectedFields
    : Object.keys(data[0]).filter(k => k !== '_id' && k !== '__v');

  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const formatted = Array.isArray(val) ? val.join('; ') : (val ?? '');
      return JSON.stringify(formatted);
    }).join(','),
  );

  return [headers.join(','), ...rows].join('\n');
};

// Convert data to JSON
const toJson = (data) => JSON.stringify(data, null, 2);

// GET /api/reports/templates
const getTemplates = async (req, res, next) => {
  try {
    const templates = await ReportTemplate.find({ userId: req.user.userId })
      .sort('-isFavorite -lastUsedAt')
      .limit(100);

    res.json(templates);
  } catch (err) { next(err); }
};

// POST /api/reports/templates
const createTemplate = async (req, res, next) => {
  try {
    const { name, description, reportType, selectedFields, filters, sortBy, sortDirection, groupBy, pageSize, exportFormat } = req.body;

    if (!name || !reportType) {
      return res.status(400).json({ error: 'name and reportType are required' });
    }

    const template = new ReportTemplate({
      name,
      description,
      reportType,
      userId: req.user.userId,
      selectedFields: selectedFields || [],
      filters: filters || {},
      sortBy,
      sortDirection: sortDirection || 'desc',
      groupBy,
      pageSize: pageSize || 100,
      exportFormat: exportFormat || ['csv'],
    });

    await template.save();

    await logAction({
      userId: req.user.userId,
      action: 'CREATE_REPORT_TEMPLATE',
      targetModel: 'ReportTemplate',
      targetId: template._id,
      changes: { name, reportType },
      ipAddress: req.ip,
    });

    res.status(201).json(template);
  } catch (err) { next(err); }
};

// PUT /api/reports/templates/:id
const updateTemplate = async (req, res, next) => {
  try {
    const template = await ReportTemplate.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const allowedFields = ['name', 'description', 'selectedFields', 'filters', 'sortBy', 'sortDirection', 'groupBy', 'pageSize', 'exportFormat', 'isFavorite'];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) template[f] = req.body[f];
    });

    await template.save();

    await logAction({
      userId: req.user.userId,
      action: 'UPDATE_REPORT_TEMPLATE',
      targetModel: 'ReportTemplate',
      targetId: template._id,
      changes: req.body,
      ipAddress: req.ip,
    });

    res.json(template);
  } catch (err) { next(err); }
};

// DELETE /api/reports/templates/:id
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await ReportTemplate.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    await logAction({
      userId: req.user.userId,
      action: 'DELETE_REPORT_TEMPLATE',
      targetModel: 'ReportTemplate',
      targetId: req.params.id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Template deleted' });
  } catch (err) { next(err); }
};

// POST /api/reports/generate
const generateReport = async (req, res, next) => {
  try {
    const { reportType, selectedFields, filters, sortBy, sortDirection, groupBy, exportFormat, templateId } = req.body;

    if (!reportType || !['DC_LISTINGS', 'GPU_CLUSTERS', 'SUPPLIERS', 'ANALYTICS'].includes(reportType)) {
      return res.status(400).json({ error: 'Invalid reportType' });
    }

    let query = {};
    let data = [];

    // Apply filters
    if (filters) {
      if (filters.status) query.status = { $in: filters.status };
      if (filters.country) query.country = filters.country;
      if (filters.location) query.location = new RegExp(filters.location, 'i');
    }

    // Generate data based on report type
    if (reportType === 'DC_LISTINGS') {
      if (!['admin', 'superadmin'].includes(req.user.role)) query.organizationId = req.user.organizationId;
      data = await DcApplication.find(query).lean();
    } else if (reportType === 'GPU_CLUSTERS') {
      if (!['admin', 'superadmin'].includes(req.user.role)) query.organizationId = req.user.organizationId;
      data = await GpuClusterListing.find(query).lean();
    } else if (reportType === 'SUPPLIERS') {
      if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only admins can generate supplier reports' });
      }
      query.type = { $in: ['SUPPLIER', 'BROKER'] };
      if (filters?.status) query.status = { $in: filters.status };
      data = await Organization.find(query).lean();
    } else if (reportType === 'ANALYTICS') {
      if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only admins can generate analytics reports' });
      }
      data = [{
        totalSuppliers: await Organization.countDocuments({ type: { $in: ['SUPPLIER', 'BROKER'] }, status: 'APPROVED' }),
        totalCustomers: await Organization.countDocuments({ type: 'CUSTOMER', status: 'APPROVED' }),
        totalDcListings: await DcApplication.countDocuments({ status: 'APPROVED' }),
        totalGpuClusters: await GpuClusterListing.countDocuments({ status: 'APPROVED' }),
        totalArchived: await DcApplication.countDocuments({ isArchived: true }) + await GpuClusterListing.countDocuments({ isArchived: true }),
        exportedAt: new Date(),
      }];
    }

    // Apply sorting
    if (sortBy && sortDirection) {
      const order = sortDirection === 'desc' ? -1 : 1;
      data.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (aVal < bVal) return -order;
        if (aVal > bVal) return order;
        return 0;
      });
    }

    // Apply grouping (basic: group by field and return grouped summary)
    if (groupBy) {
      const grouped = {};
      data.forEach((item) => {
        const key = item[groupBy];
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });
      data = Object.entries(grouped).map(([key, items]) => ({
        [groupBy]: key,
        count: items.length,
        items,
      }));
    }

    // Generate response based on format
    let responseData;
    let contentType;
    let filename;

    if (exportFormat === 'json') {
      responseData = toJson(data);
      contentType = 'application/json';
      filename = `${reportType}-${Date.now()}.json`;
    } else {
      responseData = toCsv(data, selectedFields);
      contentType = 'text/csv';
      filename = `${reportType}-${Date.now()}.csv`;
    }

    // Update template usage if templateId provided
    if (templateId) {
      await ReportTemplate.findByIdAndUpdate(templateId, {
        usageCount: { $inc: 1 },
        lastUsedAt: new Date(),
      });
    }

    // Log the report generation
    await logAction({
      userId: req.user.userId,
      action: 'GENERATE_REPORT',
      targetModel: 'Report',
      targetId: null,
      changes: { reportType, rowCount: data.length, format: exportFormat },
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(responseData);
  } catch (err) { next(err); }
};

// POST /api/reports/preview
const previewReport = async (req, res, next) => {
  try {
    const { reportType, selectedFields, filters, sortBy, sortDirection, groupBy, limit = 10 } = req.body;

    if (!reportType) {
      return res.status(400).json({ error: 'reportType is required' });
    }

    let query = {};
    let data = [];

    // Apply filters
    if (filters) {
      if (filters.status) query.status = { $in: filters.status };
      if (filters.country) query.country = filters.country;
      if (filters.location) query.location = new RegExp(filters.location, 'i');
    }

    // Generate preview data
    if (reportType === 'DC_LISTINGS') {
      if (!['admin', 'superadmin'].includes(req.user.role)) query.organizationId = req.user.organizationId;
      data = await DcApplication.find(query).limit(limit).lean();
    } else if (reportType === 'GPU_CLUSTERS') {
      if (!['admin', 'superadmin'].includes(req.user.role)) query.organizationId = req.user.organizationId;
      data = await GpuClusterListing.find(query).limit(limit).lean();
    } else if (reportType === 'SUPPLIERS') {
      if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only admins can preview supplier reports' });
      }
      query.type = { $in: ['SUPPLIER', 'BROKER'] };
      if (filters?.status) query.status = { $in: filters.status };
      data = await Organization.find(query).limit(limit).lean();
    }

    // Apply sorting
    if (sortBy && sortDirection) {
      const order = sortDirection === 'desc' ? -1 : 1;
      data.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (aVal < bVal) return -order;
        if (aVal > bVal) return order;
        return 0;
      });
    }

    // Select fields if specified
    if (selectedFields && selectedFields.length > 0) {
      data = data.map((item) => {
        const newItem = {};
        selectedFields.forEach((field) => {
          newItem[field] = item[field];
        });
        return newItem;
      });
    }

    res.json({
      preview: data,
      totalRows: data.length,
      selectedFields: selectedFields || Object.keys(data[0] || {}),
    });
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
