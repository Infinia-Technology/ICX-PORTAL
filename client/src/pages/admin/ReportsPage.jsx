import { useState, useEffect } from 'react';
import {
  Download, Save, Star, Trash2, Eye, FileSpreadsheet,
  ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import DatePicker from '../../components/ui/DatePicker';
import { useToast } from '../../components/ui/Toast';

// ======================= CONSTANTS =======================

const REPORT_TYPES = [
  { value: 'DC_LISTINGS', label: 'DC Listings' },
  { value: 'GPU_CLUSTERS', label: 'GPU Clusters' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'SUPPLIERS', label: 'Suppliers' },
  { value: 'ANALYTICS', label: 'Analytics Summary' },
];

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'json', label: 'JSON' },
];

const SORT_DIRS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

const DATE_FIELDS = [
  { value: 'createdAt', label: 'Created At' },
  { value: 'updatedAt', label: 'Updated At' },
];

const STATUS_MAP = {
  DC_LISTINGS: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'APPROVED', 'REJECTED'],
  GPU_CLUSTERS: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'APPROVED', 'REJECTED'],
  SUPPLIERS: ['PENDING', 'KYC_SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'],
  INVENTORY: ['AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED'],
  ANALYTICS: [],
};

// Field definitions with friendly labels — all selectable fields per report type
const FIELD_DEFS = {
  DC_LISTINGS: [
    { key: 'listingId', label: 'Listing ID' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'supplierEmail', label: 'Supplier Email' },
    { key: 'dataCenterName', label: 'Data Center Name' },
    { key: 'country', label: 'Country' },
    { key: 'state', label: 'State' },
    { key: 'city', label: 'City' },
    { key: 'location', label: 'Location' },
    { key: 'totalMW', label: 'Total MW' },
    { key: 'availableMW', label: 'Available MW' },
    { key: 'bookedMW', label: 'Booked MW' },
    { key: 'price', label: 'Price' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    { key: 'contractDuration', label: 'Contract Duration' },
    { key: 'kycStatus', label: 'KYC Status' },
    { key: 'siteCount', label: 'Site Count' },
    { key: 'isArchived', label: 'Archived' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
  ],
  GPU_CLUSTERS: [
    { key: 'listingId', label: 'Listing ID' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'supplierEmail', label: 'Supplier Email' },
    { key: 'dataCenterName', label: 'Vendor Name' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City/Location' },
    { key: 'location', label: 'Full Location' },
    { key: 'totalMW', label: 'Total Power (MW)' },
    { key: 'gpuTechnology', label: 'GPU Technology' },
    { key: 'gpu', label: 'GPU Model' },
    { key: 'singleClusterSize', label: 'Cluster Size (GPUs)' },
    { key: 'totalGpuCount', label: 'Total GPU Count' },
    { key: 'status', label: 'Status' },
    { key: 'availabilityDate', label: 'Availability Date' },
    { key: 'contractDuration', label: 'Contract Notes' },
    { key: 'kycStatus', label: 'KYC Status' },
    { key: 'isArchived', label: 'Archived' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
  ],
  INVENTORY: [
    { key: 'listingId', label: 'Inventory ID' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'supplierEmail', label: 'Supplier Email' },
    { key: 'dataCenterName', label: 'Inventory Name' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City/Location' },
    { key: 'location', label: 'Full Location' },
    { key: 'totalUnits', label: 'Total Units' },
    { key: 'bookedUnits', label: 'Booked Units' },
    { key: 'availableUnits', label: 'Available Units' },
    { key: 'unitType', label: 'Unit Type' },
    { key: 'price', label: 'Price Per Unit' },
    { key: 'pricingPeriod', label: 'Pricing Period' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    { key: 'contractDuration', label: 'Contract Duration' },
    { key: 'kycStatus', label: 'KYC Status' },
    { key: 'gpuTechnology', label: 'GPU Technology' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
  ],
  SUPPLIERS: [
    { key: 'listingId', label: 'Organization ID' },
    { key: 'supplierName', label: 'Company Name' },
    { key: 'supplierEmail', label: 'Contact Email' },
    { key: 'country', label: 'Jurisdiction' },
    { key: 'location', label: 'Address' },
    { key: 'status', label: 'Status' },
    { key: 'kycStatus', label: 'KYC Status' },
    { key: 'vendorType', label: 'Vendor Type' },
    { key: 'mandateStatus', label: 'Mandate Status' },
    { key: 'dcListingCount', label: 'DC Listings' },
    { key: 'gpuListingCount', label: 'GPU Listings' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'approvedAt', label: 'Approved At' },
  ],
  ANALYTICS: [
    { key: 'totalSuppliers', label: 'Total Suppliers' },
    { key: 'totalCustomers', label: 'Total Customers' },
    { key: 'totalDcListings', label: 'Total DC Listings' },
    { key: 'totalGpuClusters', label: 'Total GPU Clusters' },
    { key: 'totalInventory', label: 'Total Inventory' },
    { key: 'totalArchived', label: 'Total Archived' },
    { key: 'exportedAt', label: 'Exported At' },
  ],
};

const GROUPABLE_FIELDS = {
  DC_LISTINGS: ['country', 'status', 'kycStatus', 'supplierName'],
  GPU_CLUSTERS: ['country', 'status', 'kycStatus', 'supplierName', 'gpuTechnology'],
  INVENTORY: ['status', 'unitType', 'currency', 'supplierName', 'country'],
  SUPPLIERS: ['status', 'vendorType', 'country', 'mandateStatus'],
  ANALYTICS: [],
};

// ======================= COMPONENT =======================

export default function ReportsPage() {
  const { addToast } = useToast();

  // Templates
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Report config
  const [reportType, setReportType] = useState('DC_LISTINGS');
  const [selectedFields, setSelectedFields] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [groupBy, setGroupBy] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSupplierName, setFilterSupplierName] = useState('');
  const [filterMinMw, setFilterMinMw] = useState('');
  const [filterMaxMw, setFilterMaxMw] = useState('');
  const [filterDateField, setFilterDateField] = useState('createdAt');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Preview
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewError, setPreviewError] = useState(null);
  const PREVIEW_LIMIT = 20;

  // Template modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  // Export
  const [exporting, setExporting] = useState(false);

  // ---- Init ----
  useEffect(() => {
    api.get('/reports/templates')
      .then((r) => setTemplates(r.data))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, []);

  // Reset fields when type changes
  useEffect(() => {
    const defs = FIELD_DEFS[reportType] || [];
    setSelectedFields(defs.map((d) => d.key));
    setPreview(null);
    setPreviewPage(1);
    setGroupBy('');
    setSortBy('createdAt');
  }, [reportType]);

  // ---- Helpers ----
  const fieldDefs = FIELD_DEFS[reportType] || [];
  const fieldKeys = fieldDefs.map((d) => d.key);
  const fieldLabel = (key) => fieldDefs.find((d) => d.key === key)?.label || key;
  const statusOptions = STATUS_MAP[reportType] || [];
  const groupableFields = GROUPABLE_FIELDS[reportType] || [];

  const toggleField = (key) => {
    setSelectedFields((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);
  };

  const toggleStatus = (s) => {
    setFilterStatus((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterCountry('');
    setFilterState('');
    setFilterCity('');
    setFilterSupplierName('');
    setFilterMinMw('');
    setFilterMaxMw('');
    setFilterDateField('createdAt');
    setFilterDateStart('');
    setFilterDateEnd('');
  };

  const hasActiveFilters = filterStatus.length > 0 || filterCountry || filterState || filterCity ||
    filterSupplierName || filterMinMw || filterMaxMw || filterDateStart || filterDateEnd;

  const buildFilters = () => {
    const f = {};
    if (filterStatus.length > 0) f.status = filterStatus;
    if (filterCountry) f.country = filterCountry;
    if (filterState) f.state = filterState;
    if (filterCity) f.city = filterCity;
    if (filterSupplierName) f.supplierName = filterSupplierName;
    if (filterMinMw) f.minMw = Number(filterMinMw);
    if (filterMaxMw) f.maxMw = Number(filterMaxMw);
    if (filterDateStart || filterDateEnd) {
      f.dateRange = { field: filterDateField };
      if (filterDateStart) f.dateRange.startDate = filterDateStart;
      if (filterDateEnd) f.dateRange.endDate = filterDateEnd;
    }
    return f;
  };

  // ---- Preview ----
  const fetchPreview = async (page = 1) => {
    setPreviewLoading(true);
    try {
      const payload = {
        reportType,
        selectedFields,
        filters: buildFilters(),
        sortBy,
        sortDirection,
        groupBy: groupBy || undefined,
        page,
        limit: PREVIEW_LIMIT,
      };
      const res = await api.post('/reports/preview', payload);
      setPreview(res.data);
      setPreviewPage(page);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Preview failed' });
    } finally {
      setPreviewLoading(false);
    }
  };

  // ---- Export ----
  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = {
        reportType,
        selectedFields,
        filters: buildFilters(),
        sortBy,
        sortDirection,
        groupBy: groupBy || undefined,
        exportFormat,
      };
      const res = await api.post('/reports/generate', payload, { responseType: 'blob' });
      const ext = exportFormat === 'xlsx' ? 'xlsx' : exportFormat === 'json' ? 'json' : 'csv';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Report downloaded' });
    } catch {
      addToast({ type: 'error', message: 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  // ---- Templates ----
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      addToast({ type: 'error', message: 'Template name is required' });
      return;
    }
    try {
      const res = await api.post('/reports/templates', {
        name: templateName,
        description: templateDesc,
        reportType,
        selectedFields,
        filters: buildFilters(),
        sortBy,
        sortDirection,
        groupBy: groupBy || undefined,
        exportFormat: [exportFormat],
      });
      setTemplates((prev) => [res.data, ...prev]);
      setShowSaveModal(false);
      setTemplateName('');
      setTemplateDesc('');
      addToast({ type: 'success', message: 'Template saved' });
    } catch {
      addToast({ type: 'error', message: 'Failed to save template' });
    }
  };

  const loadTemplate = (t) => {
    setReportType(t.reportType);
    // Delay field setting to after reportType effect runs
    setTimeout(() => {
      setSelectedFields(t.selectedFields || []);
      setSortBy(t.sortBy || 'createdAt');
      setSortDirection(t.sortDirection || 'desc');
      setGroupBy(t.groupBy || '');
      setExportFormat(t.exportFormat?.[0] || 'csv');
      // Restore filters
      const f = t.filters || {};
      setFilterStatus(f.status || []);
      setFilterCountry(f.country || '');
      setFilterState(f.state || '');
      setFilterCity(f.city || '');
      setFilterSupplierName(f.supplierName || '');
      setFilterMinMw(f.minMw ?? '');
      setFilterMaxMw(f.maxMw ?? '');
      setFilterDateField(f.dateRange?.field || 'createdAt');
      setFilterDateStart(f.dateRange?.startDate ? f.dateRange.startDate.slice(0, 10) : '');
      setFilterDateEnd(f.dateRange?.endDate ? f.dateRange.endDate.slice(0, 10) : '');
      setPreview(null);
      setPreviewPage(1);
    }, 50);
    addToast({ type: 'success', message: `Loaded: ${t.name}` });
  };

  const toggleFavorite = async (t) => {
    try {
      await api.put(`/reports/templates/${t._id}`, { isFavorite: !t.isFavorite });
      setTemplates((prev) => prev.map((x) => x._id === t._id ? { ...x, isFavorite: !x.isFavorite } : x));
    } catch { /* ignore */ }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/reports/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
      addToast({ type: 'success', message: 'Template deleted' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete' });
    }
  };

  // ---- Preview columns ----
  const previewColumns = (preview?.selectedFields || []).map((f) => ({
    key: f,
    label: fieldLabel(f),
    render: (v) => {
      if (v === null || v === undefined) return <span className="text-gray-400">—</span>;
      if (typeof v === 'boolean') return v ? 'Yes' : 'No';
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString();
      if (v instanceof Object) return JSON.stringify(v);
      return String(v);
    },
  }));

  // ======================= RENDER =======================

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Report Configurator</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Build custom reports with dynamic fields, filters, and export options
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* ========== LEFT PANEL (3 cols) ========== */}
        <div className="lg:col-span-3 space-y-6">

          {/* ---- Report Type & Sort Config ---- */}
          <Card>
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Configuration</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Select label="Report Type" value={reportType} onChange={(e) => setReportType(e.target.value)} options={REPORT_TYPES} />
              <Select label="Export Format" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} options={EXPORT_FORMATS} />
              <Select label="Sort Direction" value={sortDirection} onChange={(e) => setSortDirection(e.target.value)} options={SORT_DIRS} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={fieldDefs.map((d) => ({ value: d.key, label: d.label }))}
              />
              <Select
                label="Group By"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                options={[{ value: '', label: 'None' }, ...groupableFields.map((f) => ({ value: f, label: fieldLabel(f) }))]}
              />
              <div /> {/* spacer */}
            </div>
          </Card>

          {/* ---- Field Selector (multi-select) ---- */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Select Fields ({selectedFields.length}/{fieldDefs.length})
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSelectedFields(fieldKeys)}>All</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedFields([])}>None</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
              {fieldDefs.map((def) => (
                <label
                  key={def.key}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius-md)] border cursor-pointer text-sm transition-all ${
                    selectedFields.includes(def.key)
                      ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)] font-medium'
                      : 'border-[var(--color-border)] hover:bg-gray-50 text-[var(--color-text-secondary)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(def.key)}
                    onChange={() => toggleField(def.key)}
                    className="accent-[var(--color-primary)] shrink-0"
                  />
                  <span className="truncate">{def.label}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* ---- Filters ---- */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                <Filter className="w-4 h-4 inline mr-1.5" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 text-xs bg-[var(--color-primary)] text-white rounded-full px-2 py-0.5 font-normal normal-case">Active</span>
                )}
              </h2>
              {hasActiveFilters && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Row 1: Location filters */}
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <Input label="Country" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} placeholder="e.g. UAE" />
              <Input label="State / Region" value={filterState} onChange={(e) => setFilterState(e.target.value)} placeholder="e.g. Abu Dhabi" />
              <Input label="City" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder="e.g. Dubai" />
            </div>

            {/* Row 2: Supplier + MW */}
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <Input label="Supplier Name" value={filterSupplierName} onChange={(e) => setFilterSupplierName(e.target.value)} placeholder="Search supplier..." />
              <Input label="Min MW" type="number" min="0" step="0.1" value={filterMinMw} onChange={(e) => setFilterMinMw(e.target.value)} placeholder="0" />
              <Input label="Max MW" type="number" min="0" step="0.1" value={filterMaxMw} onChange={(e) => setFilterMaxMw(e.target.value)} placeholder="1000" />
            </div>

            {/* Row 3: Date range */}
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <Select label="Date Field" value={filterDateField} onChange={(e) => setFilterDateField(e.target.value)} options={DATE_FIELDS} />
              <DatePicker label="Start Date" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} />
              <DatePicker label="End Date" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} />
            </div>

            {/* Row 4: Status pills */}
            {statusOptions.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        filterStatus.includes(s)
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-100'
                      }`}
                    >
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ---- Actions ---- */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => fetchPreview(1)} loading={previewLoading}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleExport} loading={exporting} disabled={selectedFields.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export {exportFormat.toUpperCase()}
            </Button>
            <Button variant="secondary" onClick={() => setShowSaveModal(true)}>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>

          {/* ---- Preview Table ---- */}
          {preview && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Preview
                  <span className="ml-2 text-xs font-normal normal-case text-gray-500">
                    {preview.total} total rows
                    {preview.total > 0 && ` — page ${preview.page} of ${preview.totalPages}`}
                  </span>
                </h2>
              </div>

              {previewLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : (
                <>
                  <div className="overflow-x-auto border border-[var(--color-border)] rounded-[var(--radius-md)]">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-[var(--color-border)]">
                        <tr>
                          {previewColumns.map((col) => (
                            <th key={col.key} className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {preview.preview.length > 0 ? (
                          preview.preview.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              {previewColumns.map((col) => (
                                <td key={col.key} className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate">
                                  {col.render(row[col.key])}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={previewColumns.length} className="px-3 py-8 text-center text-sm text-gray-500">
                              No {reportType.replace(/_/g, ' ').toLowerCase()} data found.
                              {hasActiveFilters ? ' Try adjusting your filters.' : ' This report type may have no data yet.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {preview.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-gray-500">
                        Showing {(preview.page - 1) * PREVIEW_LIMIT + 1}–{Math.min(preview.page * PREVIEW_LIMIT, preview.total)} of {preview.total}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!preview.hasPrev}
                          onClick={() => fetchPreview(previewPage - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Prev
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!preview.hasNext}
                          onClick={() => fetchPreview(previewPage + 1)}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </div>

        {/* ========== RIGHT PANEL (1 col) — Templates ========== */}
        <div>
          <Card>
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
              <FileSpreadsheet className="w-4 h-4 inline mr-1.5" />
              Saved Templates
            </h2>
            {loadingTemplates ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No saved templates</p>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t._id}
                    className="p-3 border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button onClick={() => loadTemplate(t)} className="text-left flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.reportType.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {t.selectedFields?.length || 0} fields
                          {t.usageCount > 0 && ` · Used ${t.usageCount}x`}
                        </p>
                      </button>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => toggleFavorite(t)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title={t.isFavorite ? 'Unfavorite' : 'Favorite'}
                        >
                          <Star className={`w-3.5 h-3.5 ${t.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => deleteTemplate(t._id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ========== Save Template Modal ========== */}
      <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)} title="Save Report Template">
        <div className="space-y-4">
          <Input
            label="Template Name"
            required
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Monthly DC Capacity Report"
          />
          <Input
            label="Description"
            value={templateDesc}
            onChange={(e) => setTemplateDesc(e.target.value)}
            placeholder="Optional description"
          />
          <div className="p-3 bg-gray-50 rounded-[var(--radius-md)] text-sm text-gray-600 space-y-1">
            <p><strong>Type:</strong> {reportType.replace(/_/g, ' ')}</p>
            <p><strong>Fields:</strong> {selectedFields.length} selected</p>
            <p><strong>Format:</strong> {exportFormat.toUpperCase()}</p>
            <p><strong>Sort:</strong> {fieldLabel(sortBy)} ({sortDirection})</p>
            {groupBy && <p><strong>Group:</strong> {fieldLabel(groupBy)}</p>}
            {hasActiveFilters && <p><strong>Filters:</strong> Active</p>}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSaveModal(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
