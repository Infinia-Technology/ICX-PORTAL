// Fields hidden from customers (pricing/contact info is visible to customers)
const READER_HIDDEN_FIELDS = [
  'contactEmail', 'contactMobile', 'contactName', 'contactNumber',
  'storageRentUsd', 'avgPowerPriceCents', 'crossConnectPricing',
  'remoteHandsPricing', 'otherOpex', 'fitOutContribution',
  'depositRequirement', 'taxVatTreatment', 'annualEscalationPct',
  'additionalOpex', 'ppa', 'targetPriceGpuHr', 'budgetRange',
];

// Documents are never shown to readers
const READER_HIDDEN_SECTIONS = ['documents', 'financials'];

const filterFieldsForRole = (data, role) => {
  if (!data || typeof data !== 'object') return data;

  if (role === 'reader') {
    const filtered = { ...data };
    for (const field of READER_HIDDEN_FIELDS) {
      delete filtered[field];
    }
    return filtered;
  }

  return data;
};

module.exports = { filterFieldsForRole, READER_HIDDEN_FIELDS, READER_HIDDEN_SECTIONS };
