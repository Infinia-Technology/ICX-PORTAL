export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPPLIER: 'supplier',
  BROKER: 'broker',
  SUBORDINATE: 'subordinate',
  CUSTOMER: 'customer',
  READER: 'reader',
  VIEWER: 'viewer',
};

export const ORG_STATUS = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
};

export const LISTING_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  RESUBMITTED: 'RESUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const INVENTORY_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
  ARCHIVED: 'ARCHIVED',
};

export const RESERVATION_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

export const INVENTORY_UNIT_TYPES = ['GPU', 'NODE', 'RACK', 'CLUSTER'];
export const INVENTORY_PRICING_PERIODS = ['HOUR'];
export const INVENTORY_CURRENCIES = ['USD'];

export const VENDOR_TYPES = ['Operator', 'Developer', 'Landlord', 'Broker', 'Advisor', 'Other Intermediary'];
export const MANDATE_STATUSES = ['Exclusive', 'Non-exclusive', 'Direct', 'Unknown'];
export const JURISDICTIONS = ['UAE', 'KSA', 'Qatar', 'Bahrain', 'Oman', 'Kuwait', 'Other'];

export const COMPANY_TYPES = [
  'Enterprise', 'Government', 'Cloud Provider', 'MSP',
  'Financial Institution', 'Telco', 'Other',
];

export const PRIMARY_USE_CASES = [
  'AI/ML Training', 'AI Inference', 'HPC', 'Enterprise IT',
  'Disaster Recovery', 'Edge Compute', 'Sovereign Cloud', 'Other',
];

export const LOCATION_PREFERENCES = [
  'Middle East', 'Europe', 'Asia Pacific', 'North America', 'Africa', 'No Preference',
];

export const SOVEREIGNTY_REQS = ['None', 'Domestic Only', 'Sovereign Cloud', 'Government-Sensitive'];

export const COMPLIANCE_REQS = [
  'GDPR', 'SOC 2', 'ISO 27001', 'PCI DSS', 'HIPAA', 'Local Data Residency', 'None',
];

export const BUDGET_RANGES = [
  '< $50K/month', '$50K-$200K/month', '$200K-$1M/month',
  '$1M-$5M/month', '> $5M/month', 'Undisclosed',
];

export const URGENCY_OPTIONS = [
  'Immediate (< 1 month)', 'Short-term (1-3 months)', 'Medium-term (3-6 months)',
  'Long-term (6+ months)', 'Exploratory',
];

// Feature flags
export const FEATURE_FLAGS = {
  MARKETPLACE_LIVE: false, // Set to true to enable marketplace for customers
};

// Role-based dashboard redirect paths
export const ROLE_DASHBOARDS = {
  superadmin: '/admin/dashboard',
  admin: '/admin/dashboard',
  supplier: '/supplier/dashboard',
  broker: '/supplier/dashboard',
  subordinate: '/supplier/dashboard',
  customer: '/customer/dashboard',
  reader: '/reader/marketplace',
  viewer: '/admin/dashboard',
};
