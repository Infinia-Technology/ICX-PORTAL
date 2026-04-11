const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportType: {
    type: String,
    enum: ['DC_LISTINGS', 'GPU_CLUSTERS', 'SUPPLIERS', 'ANALYTICS'],
    required: true,
  },
  // Selected fields to include
  selectedFields: [String],

  // Filters
  filters: {
    status: [String], // e.g., ['APPROVED', 'DRAFT']
    country: [String],
    minMw: Number,
    maxMw: Number,
    location: String,
    gpuType: String,
    vendor: String,
    dateRange: {
      startDate: Date,
      endDate: Date,
    },
  },

  // Sorting
  sortBy: String, // field name
  sortDirection: {
    type: String,
    enum: ['asc', 'desc'],
    default: 'desc',
  },

  // Grouping
  groupBy: String, // field name, e.g., 'country' or 'vendor'

  // Pagination
  pageSize: {
    type: Number,
    default: 100,
  },

  // Export options
  exportFormat: {
    type: [String], // ['csv', 'json', 'xlsx']
    default: ['csv'],
  },

  // Whether this is a favorite template
  isFavorite: {
    type: Boolean,
    default: false,
  },

  // Usage count
  usageCount: {
    type: Number,
    default: 0,
  },

  lastUsedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for efficient queries
reportTemplateSchema.index({ userId: 1, reportType: 1 });
reportTemplateSchema.index({ isFavorite: 1, createdAt: -1 });

module.exports = mongoose.model('ReportTemplate', reportTemplateSchema);
