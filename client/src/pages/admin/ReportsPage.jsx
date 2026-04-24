import { useState, useEffect, useRef } from 'react';
import {
  Download, Save, Star, Trash2, Eye, FileSpreadsheet,
  ChevronLeft, ChevronRight, ChevronDown, Filter, X,
} from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import DatePicker from '../../components/ui/DatePicker';
import { useToast } from '../../components/ui/Toast';

// ======================= CONSTANTS =======================

const REPORT_TYPES = [
  { value: 'GPU_DEMANDS', label: 'GPU Requests' },
  { value: 'SUPPLIERS', label: 'Suppliers' },
  { value: 'DC_LISTINGS', label: 'DC Listings' },
  { value: 'GPU_CLUSTERS', label: 'GPU Capacity Listings' },
];

const EXPORT_FORMATS = [
  { value: 'csv',  label: 'CSV',         desc: 'Comma-separated values',  color: 'text-green-600'  },
  { value: 'xlsx', label: 'Excel (XLSX)', desc: 'Microsoft Excel workbook', color: 'text-emerald-700' },
  { value: 'json', label: 'JSON',         desc: 'Raw structured data',      color: 'text-blue-600'   },
  { value: 'pdf',  label: 'PDF',          desc: 'Printable document',       color: 'text-red-600'    },
  { value: 'docx', label: 'Word (DOCX)',  desc: 'Microsoft Word document',  color: 'text-blue-700'   },
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
  GPU_DEMANDS: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'MATCHED', 'CLOSED'],
  DC_LISTINGS: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'APPROVED', 'REJECTED'],
  GPU_CLUSTERS: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'APPROVED', 'REJECTED'],
  SUPPLIERS: ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'],
  ANALYTICS: [],
};

// Field definitions with friendly labels — all selectable fields per report type
const FIELD_DEFS = {
  GPU_DEMANDS: [
    { key: 'demandId', label: 'Demand ID' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'organizationName', label: 'Organization' },
    // Client Identity
    { key: 'customer', label: 'Customer' },
    { key: 'dateOfEntry', label: 'Date of Entry' },
    { key: 'customerCountry', label: 'Customer Country' },
    // Technical Requirements
    { key: 'typeOfTechnology', label: 'Type of Technology' },
    { key: 'clusterSizeGpu', label: 'Cluster Size GPU #' },
    { key: 'dcTierMinimum', label: 'DC Tier (minimum)' },
    { key: 'connectivityMbps', label: 'Connectivity, Mbps' },
    { key: 'latencyMs', label: 'Latency, ms' },
    { key: 'interconnectivity', label: 'Interconnectivity' },
    { key: 'redundancyUptimeRequirements', label: 'Redundancy / Uptime Requirements' },
    // Deployment
    { key: 'contractLengthYears', label: 'Contract Length, Years' },
    { key: 'timelineForGoLive', label: 'Timeline for Go Live' },
    { key: 'idealClusterLocation', label: 'Ideal Cluster Location' },
    { key: 'exportConstraints', label: 'Export Constraints' },
    // Commercial & CRM
    { key: 'targetPriceGpuHUsd', label: 'Target Price, GPU/h, USD' },
    { key: 'decisionMaker', label: 'Decision Maker' },
    { key: 'procurementStage', label: 'Procurement Stage' },
    { key: 'otherComments', label: 'Other Comments' },
  ],
  DC_LISTINGS: [
    // Identity & Status
    { key: 'listingId', label: 'Listing ID' },
    { key: 'status', label: 'Status' },
    { key: 'isArchived', label: 'Archived' },
    { key: 'siteCount', label: 'Site Count' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    // Supplier / Organisation
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'supplierEmail', label: 'Supplier Email' },
    { key: 'kycStatus', label: 'KYC Status' },
    // Step 1: Company Details
    { key: 'companyLegalEntity', label: 'Company Legal Entity' },
    { key: 'companyOfficeAddress', label: 'Company Office Address' },
    { key: 'companyCountry', label: 'Company Country' },
    { key: 'contactName', label: 'Contact Name' },
    { key: 'contactMobile', label: 'Contact Mobile' },
    // Step 2: Site Details
    { key: 'dataCenterName', label: 'Data Center Name' },
    { key: 'siteName', label: 'Site Name' },
    { key: 'projectType', label: 'Project Type' },
    { key: 'currentProjectStatus', label: 'Current Project Status' },
    { key: 'businessModel', label: 'Business Model' },
    { key: 'sovereigntyRestrictions', label: 'Sovereignty Restrictions' },
    { key: 'regulatoryCompliance', label: 'Regulatory Compliance' },
    { key: 'airGapped', label: 'Air Gapped' },
    { key: 'landSizeSqm', label: 'Land Size (sqm)' },
    { key: 'buildingCount', label: 'Building Count' },
    { key: 'dataHallCount', label: 'Data Hall Count' },
    { key: 'siteAddress', label: 'Site Address' },
    { key: 'country', label: 'Country' },
    { key: 'state', label: 'State / Region' },
    { key: 'city', label: 'City' },
    { key: 'location', label: 'Location' },
    { key: 'coordinates', label: 'GPS Coordinates' },
    // Step 3: Capacity
    { key: 'currentEnergizedMw', label: 'Current Energized MW' },
    { key: 'totalItLoadMw', label: 'Total IT Load (MW)' },
    { key: 'totalMW', label: 'Total MW' },
    { key: 'availableMW', label: 'Available MW' },
    { key: 'totalUtilityMva', label: 'Total Utility (MVA)' },
    { key: 'totalWhiteSpaceSqm', label: 'Total White Space (sqm)' },
    { key: 'expansionPossible', label: 'Expansion Possible' },
    { key: 'expansionMw', label: 'Expansion MW' },
    // Step 4: DC Specifications
    { key: 'maxRackDensityKw', label: 'Max Rack Density (kW)' },
    { key: 'typicalRackDensityKw', label: 'Typical Rack Density (kW)' },
    { key: 'rackCoolingEffectiveTempC', label: 'Rack Cooling Temp (°C)' },
    { key: 'facilityCoolingEffectiveTempC', label: 'Facility Cooling Temp (°C)' },
    { key: 'coolingMethodology', label: 'Cooling Methodology' },
    { key: 'liquidCoolingStatus', label: 'Liquid Cooling Status' },
    { key: 'waterCoolingSource', label: 'Water Cooling Source' },
    { key: 'designPue', label: 'Design PUE' },
    { key: 'designWue', label: 'Design WUE' },
    { key: 'designWueType', label: 'WUE Type' },
    { key: 'floorMaxWeight', label: 'Floor Max Weight' },
    { key: 'landOwner', label: 'Land Owner' },
    { key: 'landOwnershipType', label: 'Land Ownership Type' },
    { key: 'leaseYears', label: 'Lease Years' },
    { key: 'physicalSecurity', label: 'Physical Security' },
    { key: 'physicalSecurityZones', label: 'Security Zones' },
    { key: 'dcTiering', label: 'DC Tiering' },
    { key: 'dcTieringCertified', label: 'Tiering Certified' },
    { key: 'iso27001', label: 'ISO 27001' },
    { key: 'iso50001', label: 'ISO 50001' },
    { key: 'soc2', label: 'SOC 2' },
    { key: 'otherCertifications', label: 'Other Certifications' },
    { key: 'powerPermitStatus', label: 'Power Permit Status' },
    { key: 'buildingPermitStatus', label: 'Building Permit Status' },
    { key: 'envPermitStatus', label: 'Environmental Permit Status' },
    { key: 'fireSuppressionType', label: 'Fire Suppression Type' },
    { key: 'waterFloodRisk', label: 'Water / Flood Risk' },
    { key: 'seismicRisk', label: 'Seismic Risk' },
    { key: 'dcSiteDeveloper', label: 'DC Site Developer' },
    { key: 'dcSiteOperator', label: 'DC Site Operator' },
    // Step 5: Power Infrastructure
    { key: 'powerSource', label: 'Power Source' },
    { key: 'gridVoltageKv', label: 'Grid Voltage (kV)' },
    { key: 'powerRedundancy', label: 'Power Redundancy' },
    { key: 'backupPower', label: 'Backup Power' },
    { key: 'backupPowerBessType', label: 'BESS Type' },
    { key: 'substationStatus', label: 'Substation Status' },
    { key: 'transformerRedundancy', label: 'Transformer Redundancy' },
    { key: 'maintenanceConcurrency', label: 'Maintenance Concurrency' },
    { key: 'upsAutonomyMin', label: 'UPS Autonomy (min)' },
    { key: 'upsTopology', label: 'UPS Topology' },
    { key: 'renewableEnergyPct', label: 'Renewable Energy (%)' },
    { key: 'renewableTypes', label: 'Renewable Types' },
    { key: 'numberOfFeeds', label: 'Number of Feeds' },
    { key: 'abFeedsSeparated', label: 'A/B Feeds Separated' },
    { key: 'futureReservedPower', label: 'Future Reserved Power' },
    { key: 'curtailmentRisk', label: 'Curtailment Risk' },
    // Step 6: Connectivity
    { key: 'carrierNeutral', label: 'Carrier Neutral' },
    { key: 'carriersOnNet', label: 'Carriers On-Net' },
    { key: 'carriersAvailable', label: 'Carriers Available' },
    { key: 'darkFibreAvailable', label: 'Dark Fibre Available' },
    { key: 'fiberEntryPoints', label: 'Fiber Entry Points' },
    { key: 'mmrDescription', label: 'MMR Description' },
    { key: 'mmrRedundancy', label: 'MMR Redundancy' },
    { key: 'connectivityMapping', label: 'Connectivity Mapping' },
    { key: 'distanceToIxKm', label: 'Distance to IX (km)' },
    { key: 'crossConnectAvail', label: 'Cross Connect Availability' },
    { key: 'latencyMs', label: 'Latency (ms)' },
    { key: 'latencyDestination', label: 'Latency Destination' },
    // Step 7: Commercial Terms
    { key: 'leaseTermOptions', label: 'Lease Term Options' },
    { key: 'breakExtensionRights', label: 'Break / Extension Rights' },
    { key: 'paymentFrequency', label: 'Payment Frequency' },
    { key: 'depositRequirement', label: 'Deposit Requirement' },
    { key: 'remoteHandsPricing', label: 'Remote Hands Pricing' },
    { key: 'fitOutContribution', label: 'Fit-Out Contribution' },
    { key: 'makeGoodObligations', label: 'Make-Good Obligations' },
    { key: 'taxVatTreatment', label: 'Tax / VAT Treatment' },
    { key: 'indexationBasis', label: 'Indexation Basis' },
    { key: 'annualEscalationPct', label: 'Annual Escalation (%)' },
    { key: 'insuranceByDc', label: 'Insurance by DC' },
    { key: 'prepaidRequired', label: 'Prepaid Required' },
    { key: 'powerPriceStructure', label: 'Power Price Structure' },
    { key: 'powerPriceCurrentUsd', label: 'Power Price (USD/kWh)' },
    { key: 'crossConnectPricing', label: 'Cross Connect Pricing' },
    { key: 'currency', label: 'Currency' },
  ],
  GPU_CLUSTERS: [
    // Identity & Status
    { key: 'listingId', label: 'Listing ID' },
    { key: 'status', label: 'Status' },
    { key: 'isArchived', label: 'Archived' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    // Supplier
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'supplierEmail', label: 'Supplier Email' },
    { key: 'kycStatus', label: 'KYC Status' },
    // Step 1: Basic Info
    { key: 'dataCenterName', label: 'Vendor Name' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City / Location' },
    { key: 'location', label: 'Full Location' },
    { key: 'gpuTechnology', label: 'GPU Technology' },
    { key: 'googleMapsLink', label: 'Google Maps Link' },
    { key: 'dcLandlord', label: 'DC Landlord' },
    { key: 'totalGpuCount', label: 'Total GPU Count' },
    { key: 'singleClusterSize', label: 'Cluster Size (GPUs)' },
    { key: 'availabilityDate', label: 'Availability Date' },
    { key: 'restrictedUse', label: 'Restricted Use' },
    { key: 'notes', label: 'Notes' },
    // Step 2: Compute Node
    { key: 'gpuServerModel', label: 'GPU Server Model' },
    { key: 'gpu', label: 'GPU Model' },
    { key: 'cpu', label: 'CPU' },
    { key: 'ram', label: 'RAM' },
    { key: 'localStorage', label: 'Local Storage' },
    { key: 'nics', label: 'NICs' },
    // Step 3: Compute Network
    { key: 'computeNetTopology', label: 'Compute Net Topology' },
    { key: 'computeNetTechnology', label: 'Compute Net Technology' },
    { key: 'computeNetSwitchVendor', label: 'Compute Net Switch Vendor' },
    { key: 'computeNetLayers', label: 'Compute Net Layers' },
    { key: 'computeNetOversubscription', label: 'Compute Net Oversubscription' },
    { key: 'computeNetScalability', label: 'Compute Net Scalability' },
    { key: 'computeNetQos', label: 'Compute Net QoS' },
    // Step 4: Management Network
    { key: 'mgmtNetTopology', label: 'Mgmt Net Topology' },
    { key: 'mgmtNetTechnology', label: 'Mgmt Net Technology' },
    { key: 'mgmtNetLayers', label: 'Mgmt Net Layers' },
    { key: 'mgmtNetSwitchVendor', label: 'Mgmt Net Switch Vendor' },
    { key: 'mgmtNetOversubscription', label: 'Mgmt Net Oversubscription' },
    { key: 'mgmtNetScalability', label: 'Mgmt Net Scalability' },
    // Step 5: Other
    { key: 'oobNetTechnology', label: 'OOB Net Technology' },
    { key: 'storageOptions', label: 'Storage Options' },
    { key: 'connectivityDetails', label: 'Connectivity Details' },
    // Step 6: Cluster Description
    { key: 'clusterDescription', label: 'Cluster Description' },
    // Step 7: Cluster Configuration
    { key: 'clusterName', label: 'Cluster Name' },
    { key: 'clusterIdentifier', label: 'Cluster Identifier' },
    { key: 'redundancy', label: 'Redundancy' },
    { key: 'failover', label: 'Failover' },
    // Step 8: Extended Information
    { key: 'powerSupplyStatus', label: 'Power Supply Status' },
    { key: 'rackPowerCapacityKw', label: 'Rack Power Capacity (kW)' },
    { key: 'modularDataHalls', label: 'Modular Data Halls' },
    { key: 'totalMW', label: 'Total Power Capacity (MW)' },
    { key: 'powerCapacityPerFloor', label: 'Power Capacity Per Floor' },
    { key: 'modularDataHallLayoutPerFloor', label: 'Data Hall Layout Per Floor' },
    { key: 'futureExpansionCapability', label: 'Future Expansion' },
    { key: 'dualFeedRedundant', label: 'Dual Feed Redundant' },
    { key: 'upsConfiguration', label: 'UPS Configuration' },
    { key: 'backupGenerators', label: 'Backup Generators' },
    { key: 'coolingDesign', label: 'Cooling Design' },
    { key: 'numberOfCoolingUnits', label: 'No. of Cooling Units' },
    { key: 'coolingCapacityKw', label: 'Cooling Capacity (kW)' },
    { key: 'rackModuleLayout', label: 'Rack Module Layout' },
    // Commercial
    { key: 'contractDuration', label: 'Contract Notes' },
  ],
  INVENTORY: [
    { key: 'listingId', label: 'Inventory ID' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'supplierEmail', label: 'Supplier Email' },
    { key: 'dataCenterName', label: 'Inventory Name' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City / Location' },
    { key: 'location', label: 'Full Location' },
    { key: 'totalUnits', label: 'Total Units' },
    { key: 'bookedUnits', label: 'Booked Units' },
    { key: 'availableUnits', label: 'Available Units' },
    { key: 'unitType', label: 'Unit Type' },
    { key: 'price', label: 'Price Per Unit' },
    { key: 'pricingPeriod', label: 'Pricing Period' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    { key: 'kycStatus', label: 'KYC Status' },
    { key: 'gpuTechnology', label: 'GPU Technology' },
    { key: 'description', label: 'Description' },
    { key: 'notes', label: 'Notes' },
    { key: 'isArchived', label: 'Archived' },
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
    { key: 'gpuListingCount', label: 'GPU Capacity Listings' },
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
  GPU_DEMANDS: ['status', 'customerCountry', 'typeOfTechnology', 'dcTierMinimum', 'procurementStage', 'organizationName'],
  DC_LISTINGS: ['country', 'state', 'status', 'kycStatus', 'supplierName', 'projectType', 'businessModel', 'dcTiering', 'powerSource', 'isArchived'],
  GPU_CLUSTERS: ['country', 'status', 'kycStatus', 'supplierName', 'gpuTechnology', 'restrictedUse', 'redundancy'],
  SUPPLIERS: ['status', 'kycStatus', 'vendorType', 'country', 'mandateStatus'],
  ANALYTICS: [],
};

// Key columns shown in the preview table (compact report snapshot)
const PREVIEW_KEY_FIELDS = {
  GPU_DEMANDS: [
    { key: 'customer', label: 'Customer' },
    { key: 'customerCountry', label: 'Country' },
    { key: 'typeOfTechnology', label: 'Technology' },
    { key: 'clusterSizeGpu', label: 'Cluster Size GPU #' },
    { key: 'timelineForGoLive', label: 'Timeline' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
  ],
  DC_LISTINGS: [
    { key: 'dataCenterName', label: 'Data Center Name' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'country', label: 'Country' },
    { key: 'totalMW', label: 'Total MW' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
  ],
  GPU_CLUSTERS: [
    { key: 'dataCenterName', label: 'Vendor Name' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'country', label: 'Country' },
    { key: 'gpuTechnology', label: 'GPU Technology' },
    { key: 'gpu', label: 'GPU Model' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
  ],
  INVENTORY: [
    { key: 'dataCenterName', label: 'Inventory Name' },
    { key: 'supplierName', label: 'Supplier Name' },
    { key: 'country', label: 'Country' },
    { key: 'totalUnits', label: 'Total Units' },
    { key: 'availableUnits', label: 'Available' },
    { key: 'status', label: 'Status' },
  ],
  SUPPLIERS: [
    { key: 'supplierName', label: 'Company Name' },
    { key: 'supplierEmail', label: 'Email' },
    { key: 'country', label: 'Country' },
    { key: 'status', label: 'Status' },
    { key: 'dcListingCount', label: 'DC Listings' },
    { key: 'createdAt', label: 'Joined' },
  ],
  ANALYTICS: [
    { key: 'totalSuppliers', label: 'Suppliers' },
    { key: 'totalCustomers', label: 'Customers' },
    { key: 'totalListings', label: 'Listings' },
    { key: 'exportedAt', label: 'Generated At' },
  ],
};

// ======================= COMPONENT =======================

export default function ReportsPage() {
  const { addToast } = useToast();

  // Templates
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Report config
  const [reportType, setReportType] = useState('GPU_DEMANDS');
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
  const PREVIEW_LIMIT = 5;

  // Template modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  // Export
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // ---- Export ----
  const handleExport = async (fmt) => {
    const format = fmt || exportFormat;
    setExporting(true);
    try {
      const payload = {
        reportType,
        selectedFields,
        filters: buildFilters(),
        sortBy,
        sortDirection,
        groupBy: groupBy || undefined,
        exportFormat: format,
      };
      const res = await api.post('/reports/generate', payload, { responseType: 'arraybuffer' });

      const MIME = {
        csv:  'text/csv;charset=utf-8;',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        json: 'application/json;charset=utf-8;',
        pdf:  'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      let blobData = res.data;
      if (format === 'csv') {
        // Prepend UTF-8 BOM so Excel opens it correctly on Windows
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        blobData = new Uint8Array([...bom, ...new Uint8Array(res.data)]);
      }

      const blob = new Blob([blobData], { type: MIME[format] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Report downloaded' });
    } catch (err) {
      // Try to extract error message from arraybuffer response
      let msg = 'Export failed';
      try {
        const text = new TextDecoder().decode(err.response?.data);
        const json = JSON.parse(text);
        if (json?.error) msg = json.error;
      } catch { /* ignore decode errors */ }
      addToast({ type: 'error', message: msg });
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

  // ---- Preview columns — fixed key fields per report type ----
  const previewKeyFields = PREVIEW_KEY_FIELDS[reportType] || [];

  const STATUS_COLORS = {
    APPROVED: 'bg-green-100 text-green-700',
    ACTIVE: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    RESUBMITTED: 'bg-blue-100 text-blue-700',
    IN_REVIEW: 'bg-yellow-100 text-yellow-700',
    REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    REJECTED: 'bg-red-100 text-red-700',
    PENDING: 'bg-gray-100 text-gray-600',
    KYC_SUBMITTED: 'bg-blue-100 text-blue-700',
    AVAILABLE: 'bg-green-100 text-green-700',
    RESERVED: 'bg-yellow-100 text-yellow-700',
    SOLD: 'bg-purple-100 text-purple-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
  };

  const renderCell = (key, v) => {
    if (v === null || v === undefined || v === '') return <span className="text-gray-300">—</span>;
    if (key === 'status' || key === 'kycStatus') {
      const cls = STATUS_COLORS[v] || 'bg-gray-100 text-gray-600';
      return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{String(v).replace(/_/g, ' ')}</span>;
    }
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (v instanceof Object) return JSON.stringify(v);
    return String(v);
  };

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
              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={fieldDefs.map((d) => ({ value: d.key, label: d.label }))}
              />
              <Select label="Sort Direction" value={sortDirection} onChange={(e) => setSortDirection(e.target.value)} options={SORT_DIRS} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <Select
                label="Group By"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                options={[{ value: '', label: 'None' }, ...groupableFields.map((f) => ({ value: f, label: fieldLabel(f) }))]}
              />
              <div /> {/* spacer */}
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
          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={() => fetchPreview(1)} loading={previewLoading}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>

            {/* Export dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportDropdown((v) => !v)}
                disabled={exporting || selectedFields.length === 0}
                className="inline-flex items-center gap-2 px-5 h-11 font-medium rounded-[var(--radius-md)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
              >
                {exporting
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" /><span>Exporting...</span></>
                  : <><Download className="w-4 h-4 shrink-0" /><span>Export</span><ChevronDown className="w-4 h-4 shrink-0" /></>
                }
              </button>

              {showExportDropdown && !exporting && (
                <div className="absolute left-0 top-full mt-1.5 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg z-20 min-w-[200px] py-1">
                  {EXPORT_FORMATS.map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => {
                        setExportFormat(fmt.value);
                        setShowExportDropdown(false);
                        handleExport(fmt.value);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${exportFormat === fmt.value ? 'bg-blue-50' : ''}`}
                    >
                      <div>
                        <span className={`font-medium ${fmt.color}`}>{fmt.label}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{fmt.desc}</p>
                      </div>
                      {exportFormat === fmt.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] ml-3 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="secondary" onClick={() => setShowSaveModal(true)}>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>

          {/* ---- Preview Table ---- */}
          {(preview || previewLoading) && (
            <Card>
              {/* Preview header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Report Preview
                  </h2>
                  {preview && !previewLoading && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {preview.total === 0
                        ? 'No records match the current filters'
                        : `Showing ${Math.min(PREVIEW_LIMIT, preview.preview.length)} of ${preview.total} total records · ${selectedFields.length} fields selected for export`}
                    </p>
                  )}
                </div>
                {preview && !previewLoading && preview.total > 0 && (
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 font-medium">
                    {preview.total} record{preview.total !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>

              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Spinner />
                  <p className="text-sm text-gray-400">Fetching preview...</p>
                </div>
              ) : preview && preview.preview.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 border border-dashed border-[var(--color-border)] rounded-[var(--radius-md)]">
                  <p className="text-sm font-medium text-gray-500">No records found</p>
                  <p className="text-xs text-gray-400">
                    {hasActiveFilters ? 'Try adjusting or clearing the active filters.' : 'No data exists for this report type yet.'}
                  </p>
                  {hasActiveFilters && (
                    <Button size="sm" variant="ghost" onClick={clearFilters} className="mt-1">
                      <X className="w-3.5 h-3.5 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : preview ? (
                <>
                  <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[var(--color-border)]">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 w-8">#</th>
                          {previewKeyFields.map((col) => (
                            <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] whitespace-nowrap uppercase tracking-wide">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {preview.preview.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-3 text-xs text-gray-400 font-mono">{(preview.page - 1) * PREVIEW_LIMIT + i + 1}</td>
                            {previewKeyFields.map((col) => (
                              <td key={col.key} className="px-4 py-3 whitespace-nowrap max-w-[220px] truncate text-sm text-[var(--color-text-primary)]">
                                {renderCell(col.key, row[col.key])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">
                      Preview shows key columns only. The full export includes all {selectedFields.length} selected fields.
                    </p>
                    {preview.totalPages > 1 && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" disabled={!preview.hasPrev} onClick={() => fetchPreview(previewPage - 1)}>
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </Button>
                        <span className="text-xs text-gray-500 self-center">
                          {preview.page} / {preview.totalPages}
                        </span>
                        <Button size="sm" variant="ghost" disabled={!preview.hasNext} onClick={() => fetchPreview(previewPage + 1)}>
                          Next <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
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
                        <p className="text-xs text-gray-500">{(t.reportType || 'Unknown').replace(/_/g, ' ')}</p>
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
