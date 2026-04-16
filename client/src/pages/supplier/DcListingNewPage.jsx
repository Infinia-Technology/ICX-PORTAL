import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import Stepper from '../../components/ui/Stepper';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import TextArea from '../../components/ui/TextArea';
import Checkbox from '../../components/ui/Checkbox';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import PhoneInput from '../../components/ui/PhoneInput';
import LocationInput from '../../components/ui/LocationInput';
import { useAutoSave } from '../../hooks/useAutoSave';
import AutoSaveIndicator from '../../components/ui/AutoSaveIndicator';
import DuplicateWarningModal from '../../components/ui/DuplicateWarningModal';
import InfoIcon from '../../components/ui/InfoIcon';
import { Upload, Trash2, FileText, Plus } from 'lucide-react';

const STEPS = [
  'Company Details', 'Site Details', 'Master Plan',
  'DC Specifications', 'Power Infrastructure', 'Connectivity',
  'Commercial Terms', 'Phasing & Expansion', 'Site Financials',
  'Documents', 'Review & Submit',
];

const COOLING_OPTIONS = ['Air Cooled', 'Liquid Cooling Ready (Rear Door/DLC)', 'Immersion Cooling Supported', 'Hybrid'];
const RENEWABLE_OPTIONS = ['Hydro', 'Wind', 'Solar'];
const EMPTY_PHASE_ROW = {
  phase: 'Phase 1', month: '', itLoadMw: '', cumulativeItLoadMw: '',
  scopeOfWorks: 'Shell & Core + Fitout', estimatedCapexMusd: '',
  minLeaseDurationYrs: '', nrcRequestMusd: '', initialDepositMusd: '',
  mrcRequestPerKw: '', mrcInclusions: '',
};

const DOC_TYPES = [
  { type: 'floor_plan', label: 'Floor Plan' },
  { type: 'compliance_sheet', label: 'DC Compliance Sheet' },
  { type: 'space_docs', label: 'DC Space Docs' },
  { type: 'agreements', label: 'DC Agreements' },
];

export default function DcListingNewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [step, setStep] = useState(Number(searchParams.get('step')) || 0);
  const [appId, setAppId] = useState(searchParams.get('appId') || null);
  const [siteId, setSiteId] = useState(searchParams.get('siteId') || null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!searchParams.get('appId'));
  const [duplicateModal, setDuplicateModal] = useState({ open: false, duplicates: [], hasDuplicates: false });

  const [step1, setStep1] = useState({
    companyLegalEntity: '', companyOfficeAddress: '', companyCountry: '',
    contactName: '', contactEmail: '', contactMobile: '',
    vendorType: '', mandateStatus: '', ndaRequired: false, ndaSigned: false,
    otherDetails: '',
  });
  const [step2, setStep2] = useState({ siteName: '', projectType: '', currentProjectStatus: '', businessModel: '', sovereigntyRestrictions: '', regulatoryCompliance: '', airGapped: false, landSizeSqm: '', buildingCount: '', dataHallCount: '', address: '', stateRegion: '', country: '', coordinates: '' });
  const [step3, setStep3] = useState({ currentEnergizedMw: '', totalItLoadMw: '', totalUtilityMva: '', totalWhiteSpaceSqm: '', expansionPossible: false, expansionMw: '' });
  const [step4, setStep4] = useState({ maxRackDensityKw: '', typicalRackDensityKw: '', rackCoolingEffectiveTempC: '', facilityCoolingEffectiveTempC: '', coolingMethodology: [], liquidCoolingStatus: '', waterCoolingSource: '', designPue: '', designWueType: '', designWue: '', floorMaxWeight: '', landOwner: '', landOwnershipType: '', leaseYears: '', physicalSecurityZones: '', physicalSecurity: '', dcTiering: '', dcTieringCertified: false, iso27001: false, iso50001: false, soc2: false, otherCertifications: '', powerPermitStatus: '', buildingPermitStatus: '', envPermitStatus: '', currentStatusDescription: '', fireSuppressionType: '', waterFloodRisk: '', seismicRisk: '', dcSiteDeveloper: '', dcSiteOperator: '', otherDetails: '' });
  const [step5, setStep5] = useState({ powerSource: '', gridVoltageKv: '', powerRedundancy: '', backupPower: '', backupPowerBessType: '', backupPowerOther: '', substationStatus: '', transformerRedundancy: '', maintenanceConcurrency: '', upsAutonomyMin: '', upsTopology: '', renewableEnergyPct: '', renewableTypes: [], numberOfFeeds: '', abFeedsSeparated: '', futureReservedPower: '', curtailmentRisk: '', powerInfraOtherDetails: '' });
  const [step6, setStep6] = useState({ carrierNeutral: false, carriersOnNet: '', carriersAvailable: '', darkFibreAvailable: false, fiberEntryPoints: '', mmrDescription: '', mmrRedundancy: '', connectivityMapping: '', distanceToIxKm: '', crossConnectAvail: '', latencyMs: '', latencyDestination: '', connectivityOtherDetails: '' });
  const [step7, setStep7] = useState({ leaseTermOptions: '', breakExtensionRights: '', paymentFrequency: '', depositRequirement: '', remoteHandsPricing: '', otherOpexCharges: '', fitOutContribution: '', makeGoodObligations: '', taxVatTreatment: '', indexationBasis: '', storageAreaRent: '', taxIncentivesAvailable: false, annualEscalationPct: '', additionalOpexCharges: '', insuranceByDc: false, prepaidRequired: false, powerPriceStructure: '', powerPriceCurrentUsd: '', crossConnectPricing: '' });
  const [phasingRows, setPhasingRows] = useState([{ ...EMPTY_PHASE_ROW }]);
  const [step8, setStep8] = useState({ storageRentUsd: '', taxIncentives: false, annualEscalationPct: '', additionalOpex: '', insuranceByDc: false, depositRequired: false, powerPriceStructure: '', avgPowerPriceCents: '', crossConnectPricing: '', ppa: '', remarks: '' });
  const [docsState, setDocsState] = useState({ loiMou: false, msa: false });
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const fileInputRefs = useRef({});

  // Reload draft data on mount if appId exists in URL
  useEffect(() => {
    const draftAppId = searchParams.get('appId');
    if (!draftAppId) return;
    api.get(`/dc-applications/${draftAppId}`)
      .then((r) => {
        const app = r.data;
        setStep1({
          companyLegalEntity: app.companyLegalEntity || '', companyOfficeAddress: app.companyOfficeAddress || '',
          companyCountry: app.companyCountry || '', contactName: app.contactName || '',
          contactEmail: app.contactEmail || '', contactMobile: app.contactMobile || '',
          vendorType: app.vendorType || '', mandateStatus: app.mandateStatus || '',
          ndaRequired: app.ndaRequired || false, ndaSigned: app.ndaSigned || false,
          otherDetails: app.otherDetails || '',
        });
        const site = app.sites?.[0];
        if (site) {
          setSiteId(site._id);
          setStep2({ siteName: site.siteName || '', projectType: site.projectType || '', currentProjectStatus: site.currentProjectStatus || '', businessModel: site.businessModel || '', sovereigntyRestrictions: site.sovereigntyRestrictions || '', regulatoryCompliance: site.regulatoryCompliance || '', airGapped: site.airGapped || false, landSizeSqm: site.landSizeSqm ?? '', buildingCount: site.buildingCount ?? '', dataHallCount: site.dataHallCount ?? '', address: site.address || '', stateRegion: site.stateRegion || '', country: site.country || '', coordinates: site.coordinates || '' });
          setStep3({ currentEnergizedMw: site.currentEnergizedMw ?? '', totalItLoadMw: site.totalItLoadMw ?? '', totalUtilityMva: site.totalUtilityMva ?? '', totalWhiteSpaceSqm: site.totalWhiteSpaceSqm ?? '', expansionPossible: site.expansionPossible || false, expansionMw: site.expansionMw ?? '' });
          setStep4({ maxRackDensityKw: site.maxRackDensityKw ?? '', typicalRackDensityKw: site.typicalRackDensityKw ?? '', rackCoolingEffectiveTempC: site.rackCoolingEffectiveTempC ?? '', facilityCoolingEffectiveTempC: site.facilityCoolingEffectiveTempC ?? '', coolingMethodology: site.coolingMethodology || [], liquidCoolingStatus: site.liquidCoolingStatus || '', waterCoolingSource: site.waterCoolingSource || '', designPue: site.designPue ?? '', designWueType: site.designWueType || '', designWue: site.designWue ?? '', floorMaxWeight: site.floorMaxWeight ?? '', landOwner: site.landOwner || '', landOwnershipType: site.landOwnershipType || '', leaseYears: site.leaseYears ?? '', physicalSecurityZones: site.physicalSecurityZones ?? '', physicalSecurity: site.physicalSecurity || '', dcTiering: site.dcTiering || '', dcTieringCertified: site.dcTieringCertified || false, iso27001: site.iso27001 || false, iso50001: site.iso50001 || false, soc2: site.soc2 || false, otherCertifications: site.otherCertifications || '', powerPermitStatus: site.powerPermitStatus || '', buildingPermitStatus: site.buildingPermitStatus || '', envPermitStatus: site.envPermitStatus || '', currentStatusDescription: site.currentStatusDescription || '', fireSuppressionType: site.fireSuppressionType || '', waterFloodRisk: site.waterFloodRisk || '', seismicRisk: site.seismicRisk || '', dcSiteDeveloper: site.dcSiteDeveloper || '', dcSiteOperator: site.dcSiteOperator || '', otherDetails: site.otherDetails || '' });
          setStep5({ powerSource: site.powerSource || '', gridVoltageKv: site.gridVoltageKv ?? '', powerRedundancy: site.powerRedundancy || '', backupPower: site.backupPower || '', backupPowerBessType: site.backupPowerBessType || '', backupPowerOther: site.backupPowerOther || '', substationStatus: site.substationStatus || '', transformerRedundancy: site.transformerRedundancy || '', maintenanceConcurrency: site.maintenanceConcurrency || '', upsAutonomyMin: site.upsAutonomyMin ?? '', upsTopology: site.upsTopology || '', renewableEnergyPct: site.renewableEnergyPct ?? '', renewableTypes: site.renewableTypes || [], numberOfFeeds: site.numberOfFeeds ?? '', abFeedsSeparated: site.abFeedsSeparated || '', futureReservedPower: site.futureReservedPower || '', curtailmentRisk: site.curtailmentRisk || '', powerInfraOtherDetails: site.powerInfraOtherDetails || '' });
          setStep6({ carrierNeutral: site.carrierNeutral || false, carriersOnNet: site.carriersOnNet ?? '', carriersAvailable: site.carriersAvailable || '', darkFibreAvailable: site.darkFibreAvailable || false, fiberEntryPoints: site.fiberEntryPoints || '', mmrDescription: site.mmrDescription || '', mmrRedundancy: site.mmrRedundancy || '', connectivityMapping: site.connectivityMapping || '', distanceToIxKm: site.distanceToIxKm ?? '', crossConnectAvail: site.crossConnectAvail || '', latencyMs: site.latencyMs ?? '', latencyDestination: site.latencyDestination || '', connectivityOtherDetails: site.connectivityOtherDetails || '' });
          setStep7({ leaseTermOptions: site.leaseTermOptions || '', breakExtensionRights: site.breakExtensionRights || '', paymentFrequency: site.paymentFrequency || '', depositRequirement: site.depositRequirement || '', remoteHandsPricing: site.remoteHandsPricing || '', otherOpexCharges: site.otherOpexCharges || '', fitOutContribution: site.fitOutContribution || '', makeGoodObligations: site.makeGoodObligations || '', taxVatTreatment: site.taxVatTreatment || '', indexationBasis: site.indexationBasis || '', storageAreaRent: site.storageAreaRent || '', taxIncentivesAvailable: site.taxIncentivesAvailable || false, annualEscalationPct: site.annualEscalationPct ?? '', additionalOpexCharges: site.additionalOpexCharges || '', insuranceByDc: site.insuranceByDc || false, prepaidRequired: site.prepaidRequired || false, powerPriceStructure: site.powerPriceStructure || '', powerPriceCurrentUsd: site.powerPriceCurrentUsd ?? '', crossConnectPricing: site.crossConnectPricing || '' });
          setStep8({ storageRentUsd: site.storageRentUsd ?? '', taxIncentives: site.taxIncentives || false, annualEscalationPct: site.annualEscalationPct ?? '', additionalOpex: site.additionalOpex || '', insuranceByDc: site.insuranceByDc || false, depositRequired: site.depositRequired || false, powerPriceStructure: site.powerPriceStructure || '', avgPowerPriceCents: site.avgPowerPriceCents ?? '', crossConnectPricing: site.crossConnectPricing || '', ppa: site.ppa || '', remarks: site.remarks || '' });
          setDocsState({ loiMou: site.loiMou || false, msa: site.msa || false });
          if (site.documents?.length > 0) setDocuments(site.documents);
          // Load phasing rows
          api.get(`/dc-applications/${draftAppId}/sites/${site._id}/phasing`)
            .then((pr) => {
              if (pr.data.length > 0) {
                setPhasingRows(pr.data.map(row => ({
                  phase: String(row.phase || 'Phase 1'),
                  month: row.month ? String(row.month).slice(0, 7) : '',
                  itLoadMw: row.it_load_mw ?? '',
                  cumulativeItLoadMw: row.cumulative_it_load_mw ?? '',
                  scopeOfWorks: row.scope_of_works || '',
                  estimatedCapexMusd: row.estimated_capex_musd ?? '',
                  minLeaseDurationYrs: row.min_lease_duration_yrs ?? '',
                  nrcRequestMusd: row.nrc_request_musd ?? '',
                  initialDepositMusd: row.initial_deposit_musd ?? '',
                  mrcRequestPerKw: row.mrc_request_per_kw ?? '',
                  mrcInclusions: row.mrc_inclusions || '',
                })));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => addToast({ type: 'error', message: 'Failed to load draft' }))
      .finally(() => setLoadingDraft(false));
  }, []);

  const updateUrl = (newAppId, newSiteId, newStep) => {
    const params = {};
    if (newAppId || appId) params.appId = newAppId || appId;
    if (newSiteId || siteId) params.siteId = newSiteId || siteId;
    if (newStep !== undefined) params.step = newStep;
    setSearchParams(params, { replace: true });
  };

  // Auto-save: exclude step 7 (phasing - uses dedicated endpoint) and step 9 (documents)
  const stepDataMap = { 1: step2, 2: step3, 3: step4, 4: step5, 5: step6, 6: step7, 8: step8 };
  const currentStepData = stepDataMap[step] || null;
  const { status: autoSaveStatus } = useAutoSave(
    siteId ? `/dc-applications/${appId}/sites/${siteId}` : null,
    currentStepData,
    { enabled: !!siteId && !!appId && !!stepDataMap[step] }
  );

  const f = (setter) => (e) => {
    const { name, value, type, checked } = e.target;
    setter((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleArr = (setter, key, val) => {
    setter((prev) => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  };

  const validateRequired = (data, fields) => {
    for (const [key, label] of fields) {
      const val = data[key];
      if (Array.isArray(val)) {
        if (val.length === 0) return label;
      } else if (val === undefined || val === null || String(val).trim() === '') {
        return label;
      }
    }
    return null;
  };

  const extractCleanData = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        result[key] = value;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        result[key] = value;
      } else if (Array.isArray(value)) {
        result[key] = value.filter(v => typeof v === 'string');
      }
    }
    return result;
  };

  // Returns the appId (new or existing) on success, null on failure
  const saveStep1 = async () => {
    if (!step1.companyLegalEntity) {
      addToast({ type: 'error', message: 'Company name is required' });
      return null;
    }
    try {
      const cleanData = extractCleanData(step1);
      if (!appId) {
        const res = await api.post('/dc-applications', cleanData);
        setAppId(res.data._id);
        return res.data._id;
      } else {
        await api.put(`/dc-applications/${appId}`, cleanData);
        return appId;
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save company details' });
      return null;
    }
  };

  // Returns the siteId (new or existing) on success, null on failure
  const saveStep2 = async () => {
    if (!step2.siteName) {
      addToast({ type: 'error', message: 'Site name is required' });
      return null;
    }
    try {
      const cleanData = extractCleanData({ ...step2, ...step3 });
      if (!siteId) {
        const res = await api.post(`/dc-applications/${appId}/sites`, cleanData);
        setSiteId(res.data._id);
        return res.data._id;
      } else {
        await api.put(`/dc-applications/${appId}/sites/${siteId}`, cleanData);
        return siteId;
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save site details' });
      return null;
    }
  };

  // Returns the siteId (new or existing) on success, null on failure
  const saveSite = async (data) => {
    if (!appId) {
      addToast({ type: 'error', message: 'Please complete Company Details (Step 1) first' });
      return null;
    }
    try {
      const cleanData = extractCleanData(data);
      if (!siteId) {
        const merged = { siteName: step2.siteName || 'Site 1', ...step2, ...step3, ...data };
        const cleanMerged = extractCleanData(merged);
        const res = await api.post(`/dc-applications/${appId}/sites`, cleanMerged);
        setSiteId(res.data._id);
        return res.data._id;
      } else {
        await api.put(`/dc-applications/${appId}/sites/${siteId}`, cleanData);
        return siteId;
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save' });
      return null;
    }
  };

  const savePhasing = async () => {
    if (!siteId || !appId) return true; // nothing to save yet
    const validRows = phasingRows.filter(r => r.month);
    if (validRows.length === 0) return true;
    try {
      await api.put(`/dc-applications/${appId}/sites/${siteId}/phasing`, {
        rows: validRows.map(r => ({
          phase: r.phase || 'Phase 1',
          month: r.month,
          itLoadMw: Number(r.itLoadMw) || 0,
          cumulativeItLoadMw: Number(r.cumulativeItLoadMw) || 0,
          scopeOfWorks: r.scopeOfWorks || '',
          estimatedCapexMusd: Number(r.estimatedCapexMusd) || 0,
          minLeaseDurationYrs: Number(r.minLeaseDurationYrs) || 0,
          nrcRequestMusd: Number(r.nrcRequestMusd) || 0,
          initialDepositMusd: Number(r.initialDepositMusd) || 0,
          mrcRequestPerKw: Number(r.mrcRequestPerKw) || 0,
          mrcInclusions: r.mrcInclusions || '',
        }))
      });
      return true;
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save phasing' });
      return false;
    }
  };

  const next = async () => {
    if (saving) return;
    setSaving(true);

    try {
      let missing = null;
      let ok = false;
      // Track fresh IDs from this save (avoids stale-closure URL bug)
      let freshAppId = appId;
      let freshSiteId = siteId;

      if (step === 0) {
        missing = validateRequired(step1, [
          ['companyLegalEntity', 'Company Legal Entity'], ['companyOfficeAddress', 'Office Address'],
          ['companyCountry', 'Country'], ['contactName', 'Contact Name'],
          ['contactEmail', 'Contact Email'], ['contactMobile', 'Contact Number'],
          ['vendorType', 'Vendor Type'], ['mandateStatus', 'Mandate Status'],
          ['otherDetails', 'Other Details'],
        ]);
        if (missing) { addToast({ type: 'error', message: `${missing} is required` }); return; }
        const id = await saveStep1();
        ok = !!id;
        if (id) freshAppId = id;
      } else if (step === 1) {
        missing = validateRequired(step2, [
          ['siteName', 'Site Name'], ['projectType', 'Project Type'],
          ['currentProjectStatus', 'Current Status'], ['businessModel', 'Business Model'],
          ['sovereigntyRestrictions', 'Sovereignty Restrictions'], ['regulatoryCompliance', 'Regulatory Compliance'],
          ['address', 'Address'], ['stateRegion', 'State/Region'], ['country', 'Country'],
          ['coordinates', 'Google Maps Link'], ['landSizeSqm', 'Land Size (sqm)'],
          ['buildingCount', 'Building Count'], ['dataHallCount', 'Data Hall Count'],
        ]);
        if (missing) { addToast({ type: 'error', message: `${missing} is required` }); return; }
        const id = await saveStep2();
        ok = !!id;
        if (id) freshSiteId = id;
      } else if (step === 2) {
        missing = validateRequired(step3, [
          ['currentEnergizedMw', 'Current Energized MW'], ['totalItLoadMw', 'Total IT Load MW'],
          ['totalUtilityMva', 'Total Utility MVA'], ['totalWhiteSpaceSqm', 'Total White Space (sqm)'],
          ['expansionMw', 'Expansion MW'],
        ]);
        if (missing) { addToast({ type: 'error', message: `${missing} is required` }); return; }
        const id = await saveStep2();
        ok = !!id;
        if (id) freshSiteId = id;
      } else if (step === 3) {
        missing = validateRequired(step4, [
          ['maxRackDensityKw', 'Rack Density (max)'], ['typicalRackDensityKw', 'Design Rack Density (typical)'],
          ['rackCoolingEffectiveTempC', 'Rack Cooling Effective Temperature'],
          ['facilityCoolingEffectiveTempC', 'Facility Cooling Effective Temperature'],
          ['coolingMethodology', 'Cooling Methodology'], ['liquidCoolingStatus', 'Liquid Cooling Delivered'],
          ['waterCoolingSource', 'Water Cooling Source'], ['designPue', 'Design PUE'],
          ['designWueType', 'Design WUE Type'], ['designWue', 'Design WUE'],
          ['floorMaxWeight', 'Floor Max Weight'], ['landOwner', 'Land Owner'],
          ['landOwnershipType', 'Land Ownership Type'], ['physicalSecurityZones', 'Physical Security Zones'],
          ['physicalSecurity', 'Physical Security Details'], ['dcTiering', 'DC Tiering'],
          ['powerPermitStatus', 'Power Permit Status'], ['buildingPermitStatus', 'Building Permit Status'],
          ['envPermitStatus', 'Environmental Permit Status'], ['currentStatusDescription', 'Current Status Description'],
          ['fireSuppressionType', 'Fire Suppression Type'], ['waterFloodRisk', 'Water Flood Risk'],
          ['seismicRisk', 'Seismic Risk'], ['dcSiteDeveloper', 'DC Site Developer'],
          ['dcSiteOperator', 'DC Site Operator'], ['otherDetails', 'Other Details'],
        ]);
        if (missing) { addToast({ type: 'error', message: `${missing} is required` }); return; }
        const id = await saveSite(step4);
        ok = !!id;
        if (id) freshSiteId = id;
      } else if (step === 4) {
        const step5Required = [
          ['powerSource', 'Power Source'], ['gridVoltageKv', 'Grid Connection Voltage'],
          ['powerRedundancy', 'Power Redundancy Topology'], ['backupPower', 'Backup Power'],
          ['substationStatus', 'On-site Substation Status'], ['transformerRedundancy', 'Transformer Redundancy'],
          ['maintenanceConcurrency', 'Maintenance Concurrency'], ['upsAutonomyMin', 'UPS Autonomy'],
          ['upsTopology', 'UPS Topology'], ['renewableEnergyPct', 'Renewable Energy %'],
          ['numberOfFeeds', 'Number of Feeds'], ['abFeedsSeparated', 'A/B Feeds Physically Separated'],
          ['futureReservedPower', 'Future Reserved Power'], ['curtailmentRisk', 'Curtailment Risk'],
          ['powerInfraOtherDetails', 'Other Details'],
        ];
        if (step5.backupPower === 'Batteries (BESS)') step5Required.push(['backupPowerBessType', 'Battery System Type']);
        if (step5.backupPower === 'Other') step5Required.push(['backupPowerOther', 'Specify Other Backup Power']);
        missing = validateRequired(step5, step5Required);
        if (missing) { addToast({ type: 'error', message: `${missing} is required` }); return; }
        const id = await saveSite(step5);
        ok = !!id;
        if (id) freshSiteId = id;
      } else if (step === 5) {
        missing = validateRequired(step6, [
          ['carriersOnNet', 'Number of Carriers On-net'], ['carriersAvailable', 'Carriers Available on Site'],
          ['fiberEntryPoints', 'Fiber Entry Points'], ['mmrDescription', 'Meet-Me-Room Description'],
          ['mmrRedundancy', 'MMR Redundancy'], ['connectivityMapping', 'Connectivity Detailed Mapping'],
          ['distanceToIxKm', 'Distance to Nearest IX'], ['crossConnectAvail', 'Cross-Connect Availability'],
          ['latencyMs', 'Latency (ms)'], ['latencyDestination', 'Latency Destination'],
          ['connectivityOtherDetails', 'Other Details'],
        ]);
        if (missing) { addToast({ type: 'error', message: `${missing} is required` }); return; }
        const id = await saveSite(step6);
        ok = !!id;
        if (id) freshSiteId = id;
      } else if (step === 6) {
        missing = validateRequired(step7, [
          ['leaseTermOptions', 'Lease Term Options'], ['breakExtensionRights', 'Break/Extension Rights'],
          ['paymentFrequency', 'Payment Frequency'], ['depositRequirement', 'Deposit/Security Requirement'],
          ['remoteHandsPricing', 'Remote Hands Pricing'], ['otherOpexCharges', 'Other Opex Charges'],
          ['fitOutContribution', 'Fit-out Contribution'], ['makeGoodObligations', 'Make-good/Restoration Obligations'],
          ['taxVatTreatment', 'Tax/VAT Treatment'], ['indexationBasis', 'Indexation Basis'],
          ['storageAreaRent', 'Storage Area Rent'], ['annualEscalationPct', 'Annual Escalation %'],
          ['additionalOpexCharges', 'Additional Opex Charges'], ['powerPriceStructure', 'Power Price Structure'],
          ['powerPriceCurrentUsd', 'Avg Power Price'], ['crossConnectPricing', 'Cross-Connect Pricing'],
        ]);
        if (missing) { addToast({ type: 'error', message: `${missing} is required` }); return; }
        const id = await saveSite(step7);
        ok = !!id;
        if (id) freshSiteId = id;
      } else if (step === 7) {
        const hasValidRow = phasingRows.some(r => r.month);
        if (!hasValidRow) { addToast({ type: 'error', message: 'At least one phasing row with a month is required' }); return; }
        ok = await savePhasing();
      } else if (step === 8) {
        missing = validateRequired(step8, [
          ['storageRentUsd', 'Storage Rent (USD/sqm)'], ['annualEscalationPct', 'Annual Escalation %'],
          ['powerPriceStructure', 'Power Price Structure'], ['avgPowerPriceCents', 'Avg Power Price (cents/kWh)'],
          ['crossConnectPricing', 'Cross-Connect Pricing'], ['remarks', 'Remarks'],
        ]);
        if (missing) { addToast({ type: 'error', message: `${missing} is required` }); return; }
        const id = await saveSite({ ...step8 });
        ok = !!id;
        if (id) freshSiteId = id;
      } else if (step === 9) {
        if (siteId) {
          const id = await saveSite(docsState);
          ok = !!id;
        } else {
          ok = true;
        }
      }

      if (ok) {
        const nextStep = Math.min(step + 1, STEPS.length - 1);
        setStep(nextStep);
        // Build URL with fresh IDs — single setSearchParams call, no stale-closure race
        const params = { step: nextStep };
        if (freshAppId) params.appId = freshAppId;
        if (freshSiteId) params.siteId = freshSiteId;
        setSearchParams(params, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const back = () => {
    const prevStep = Math.max(step - 1, 0);
    setStep(prevStep);
    updateUrl(null, null, prevStep);
  };

  const uploadDocument = async (file, documentType) => {
    if (!siteId || !appId) {
      addToast({ type: 'error', message: 'Please save earlier steps before uploading documents' });
      return;
    }
    setUploadingDoc(documentType);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    try {
      const res = await api.post(`/dc-applications/${appId}/sites/${siteId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments(prev => [...prev, res.data]);
      addToast({ type: 'success', message: 'Document uploaded' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Upload failed' });
    } finally {
      setUploadingDoc(null);
    }
  };

  const removeDocument = async (docId) => {
    try {
      await api.delete(`/dc-applications/${appId}/sites/${siteId}/documents/${docId}`);
      setDocuments(prev => prev.filter(d => (d._id || d.id) !== docId));
      addToast({ type: 'success', message: 'Document removed' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to remove document' });
    }
  };

  const submit = async (force = false) => {
    setSubmitting(true);
    try {
      if (appId && step1.companyLegalEntity) {
        const company = extractCleanData(step1);
        await api.put(`/dc-applications/${appId}`, company);
      }
      if (siteId && appId) {
        const merged = { ...step2, ...step3, ...step4, ...step5, ...step6, ...step7, ...step8, ...docsState };
        const siteData = extractCleanData(merged);
        await api.put(`/dc-applications/${appId}/sites/${siteId}`, siteData);
        await savePhasing();
      }
      const res = await api.post(`/dc-applications/${appId}/submit`, { force });
      if (res.data.hasDuplicates) {
        setDuplicateModal({ open: true, duplicates: res.data.duplicates, hasDuplicates: true });
        setSubmitting(false);
        return;
      }
      addToast({ type: 'success', message: 'DC listing submitted successfully!' });
      navigate(isAdmin ? '/admin/dc-listings' : '/supplier/dc-listings');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || err.message || 'Failed to submit' });
      setSubmitting(false);
    }
  };

  const handleContinueWithDuplicates = async () => { await submit(true); };

  const updatePhasingRow = (index, field, value) => {
    setPhasingRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };
  const addPhasingRow = () => setPhasingRows(prev => [...prev, { ...EMPTY_PHASE_ROW }]);
  const removePhasingRow = (index) => {
    if (phasingRows.length === 1) return;
    setPhasingRows(prev => prev.filter((_, i) => i !== index));
  };

  if (loadingDraft) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Vendor Type *" name="vendorType" value={step1.vendorType} onChange={f(setStep1)}
              options={['', 'Operator', 'Developer', 'Landlord', 'Broker', 'Advisor', 'Other Intermediary'].map(o => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Mandate Status *" name="mandateStatus" value={step1.mandateStatus} onChange={f(setStep1)}
              options={['', 'Exclusive', 'Non-exclusive', 'Direct', 'Unknown'].map(o => ({ value: o, label: o || 'Select...' }))} />
            <div className="flex gap-6 sm:col-span-2">
              <Checkbox label="NDA Required" name="ndaRequired" checked={step1.ndaRequired} onChange={f(setStep1)} />
              <Checkbox label="NDA Signed" name="ndaSigned" checked={step1.ndaSigned} onChange={f(setStep1)} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">Company Legal Entity *</label>
                <InfoIcon text="Official company name. Used for duplicate detection via company name matching." placement="top" />
              </div>
              <Input name="companyLegalEntity" value={step1.companyLegalEntity} onChange={f(setStep1)} />
            </div>
            <Input label="Office Address *" name="companyOfficeAddress" value={step1.companyOfficeAddress} onChange={f(setStep1)} />
            <Input label="Country of Incorporation *" name="companyCountry" value={step1.companyCountry} onChange={f(setStep1)} />
            <Input label="Contact Name *" name="contactName" value={step1.contactName} onChange={f(setStep1)} />
            <Input label="Contact Email *" name="contactEmail" type="email" value={step1.contactEmail} onChange={f(setStep1)} />
            <PhoneInput label="Contact Number *" name="contactMobile" value={step1.contactMobile} onChange={f(setStep1)} />
            <TextArea label="Other Details *" name="otherDetails" value={step1.otherDetails} onChange={f(setStep1)} className="sm:col-span-2" />
          </div>
        );
      case 1:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Site Name *" name="siteName" value={step2.siteName} onChange={f(setStep2)} />
            <Select label="Project Type *" name="projectType" value={step2.projectType} onChange={f(setStep2)} options={[{ value: '', label: 'Select...' }, 'Brownfield (Retrofit/Conversion)', 'Greenfield', 'Expansion'].map((o) => typeof o === 'string' ? { value: o, label: o } : o)} />
            <Select label="Current Status *" name="currentProjectStatus" value={step2.currentProjectStatus} onChange={f(setStep2)} options={['', 'Planned', 'Permitted', 'Under Construction', 'Live', 'Partially Live'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Business Model *" name="businessModel" value={step2.businessModel} onChange={f(setStep2)} options={['', 'Colocation (Wholesale/Retail)', 'Powered Shell', 'Hyperscale/ Build-to-Suit', 'AI Factory/ Sovereign Cloud'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Sovereignty Restrictions *" name="sovereigntyRestrictions" value={step2.sovereigntyRestrictions} onChange={f(setStep2)} options={['', 'None', 'Domestic Only', 'Sovereign Cloud Capable', 'Restricted'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Regulatory Compliance *" name="regulatoryCompliance" value={step2.regulatoryCompliance} onChange={f(setStep2)} options={['', 'GDPR', 'Local Law', 'GDPR + Local Law'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">Address *</label>
                <InfoIcon text="Street address or location details. Used for duplicate detection." placement="top" />
              </div>
              <Input name="address" value={step2.address} onChange={f(setStep2)} />
            </div>
            <Input label="State/Region *" name="stateRegion" value={step2.stateRegion} onChange={f(setStep2)} />
            <Input label="Country *" name="country" value={step2.country} onChange={f(setStep2)} />
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">Google Maps Link *</label>
                <InfoIcon text="Precise location for GPS-based duplicate detection (50-100m radius)." placement="top" />
              </div>
              <LocationInput name="coordinates" value={step2.coordinates} onChange={f(setStep2)} />
            </div>
            <Input label="Land Size (sqm) *" name="landSizeSqm" type="number" value={step2.landSizeSqm} onChange={f(setStep2)} />
            <Input label="Building Count *" name="buildingCount" type="number" value={step2.buildingCount} onChange={f(setStep2)} />
            <Input label="Data Hall Count *" name="dataHallCount" type="number" value={step2.dataHallCount} onChange={f(setStep2)} />
            <Checkbox label="Air Gapped" name="airGapped" checked={step2.airGapped} onChange={f(setStep2)} />
          </div>
        );
      case 2:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Current Energized MW *" name="currentEnergizedMw" type="number" value={step3.currentEnergizedMw} onChange={f(setStep3)} />
            <Input label="Total IT Load MW *" name="totalItLoadMw" type="number" value={step3.totalItLoadMw} onChange={f(setStep3)} />
            <Input label="Total Utility MVA *" name="totalUtilityMva" type="number" value={step3.totalUtilityMva} onChange={f(setStep3)} />
            <Input label="Total White Space (sqm) *" name="totalWhiteSpaceSqm" type="number" value={step3.totalWhiteSpaceSqm} onChange={f(setStep3)} />
            <Input label="Expansion MW *" name="expansionMw" type="number" value={step3.expansionMw} onChange={f(setStep3)} />
            <Checkbox label="Expansion Possible" name="expansionPossible" checked={step3.expansionPossible} onChange={f(setStep3)} />
          </div>
        );
      case 3:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Rack Cooling Effective Temperature (°C) *" name="rackCoolingEffectiveTempC" type="number" value={step4.rackCoolingEffectiveTempC} onChange={f(setStep4)} placeholder="e.g., 27" />
            <Input label="Facility Cooling Effective Temperature (°C) *" name="facilityCoolingEffectiveTempC" type="number" value={step4.facilityCoolingEffectiveTempC} onChange={f(setStep4)} placeholder="e.g., 27" />
            <Input label="Rack Density, kW/Rack (maximum) *" name="maxRackDensityKw" type="number" value={step4.maxRackDensityKw} onChange={f(setStep4)} />
            <Input label="Design Rack Density, kW/Rack (typical) *" name="typicalRackDensityKw" type="number" value={step4.typicalRackDensityKw} onChange={f(setStep4)} />
            <div className="sm:col-span-2">
              <p className="text-sm font-medium mb-2">Cooling Methodology *</p>
              <div className="flex flex-wrap gap-3">
                {COOLING_OPTIONS.map((o) => (
                  <label key={o} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={step4.coolingMethodology.includes(o)} onChange={() => toggleArr(setStep4, 'coolingMethodology', o)} />
                    <span className="text-sm">{o}</span>
                  </label>
                ))}
              </div>
            </div>
            <Select label="Liquid Cooling Delivered *" name="liquidCoolingStatus" value={step4.liquidCoolingStatus} onChange={f(setStep4)} options={['', 'Installed', 'Ready for retrofit', 'Design-ready only', 'No'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Water Cooling Source *" name="waterCoolingSource" value={step4.waterCoolingSource} onChange={f(setStep4)} />
            <Input label="Design PUE (at full load) *" name="designPue" type="number" step="0.01" value={step4.designPue} onChange={f(setStep4)} />
            <Select label="Design WUE Type *" name="designWueType" value={step4.designWueType} onChange={f(setStep4)} options={['', 'Facility wide', 'Cooling only'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Design WUE, L/kWh *" name="designWue" type="number" value={step4.designWue} onChange={f(setStep4)} />
            <Input label="Floor Max Weight (tons/sqm) *" name="floorMaxWeight" type="number" value={step4.floorMaxWeight} onChange={f(setStep4)} />
            <Input label="Land Owner *" name="landOwner" value={step4.landOwner} onChange={f(setStep4)} />
            <Select label="Land Ownership Type *" name="landOwnershipType" value={step4.landOwnershipType} onChange={f(setStep4)} options={['', 'Freehold', 'Leasehold'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            {step4.landOwnershipType === 'Leasehold' && (
              <Input label="Lease Years" name="leaseYears" type="number" value={step4.leaseYears} onChange={f(setStep4)} />
            )}
            <Input label="Physical Security Zones *" name="physicalSecurityZones" type="number" value={step4.physicalSecurityZones} onChange={f(setStep4)} placeholder="Number of zones" />
            <TextArea label="Physical Security Details *" name="physicalSecurity" value={step4.physicalSecurity} onChange={f(setStep4)} className="sm:col-span-2" />
            <Select label="DC Tiering *" name="dcTiering" value={step4.dcTiering} onChange={f(setStep4)} options={['', 'Tier I', 'Tier II', 'Tier III', 'Tier IV', 'Not Certified'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <div className="flex gap-6">
              <Checkbox label="DC Tiering Certified" name="dcTieringCertified" checked={step4.dcTieringCertified} onChange={f(setStep4)} />
            </div>
            <div className="flex gap-6 sm:col-span-2">
              <Checkbox label="ISO 27001" name="iso27001" checked={step4.iso27001} onChange={f(setStep4)} />
              <Checkbox label="ISO 50001" name="iso50001" checked={step4.iso50001} onChange={f(setStep4)} />
              <Checkbox label="SOC 2" name="soc2" checked={step4.soc2} onChange={f(setStep4)} />
            </div>
            <TextArea label="Other Certifications" name="otherCertifications" value={step4.otherCertifications} onChange={f(setStep4)} className="sm:col-span-2" />
            <Select label="Power Permit Status *" name="powerPermitStatus" value={step4.powerPermitStatus} onChange={f(setStep4)} options={['', 'Not Required', 'Not Applied', 'In Preparation', 'Submitted / Under Review', 'Approved', 'Approved with Conditions', 'Rejected', 'Expired', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Building Permit Status *" name="buildingPermitStatus" value={step4.buildingPermitStatus} onChange={f(setStep4)} options={['', 'Not Required', 'Not Applied', 'In Preparation', 'Submitted / Under Review', 'Approved', 'Approved with Conditions', 'Rejected', 'Expired', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Environmental Permit Status *" name="envPermitStatus" value={step4.envPermitStatus} onChange={f(setStep4)} options={['', 'Not Required', 'Not Applied', 'In Preparation', 'Submitted / Under Review', 'Approved', 'Approved with Conditions', 'Rejected', 'Expired', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Current Status Description *" name="currentStatusDescription" value={step4.currentStatusDescription || ''} onChange={f(setStep4)} className="sm:col-span-2" />
            <Select label="Fire Suppression Type *" name="fireSuppressionType" value={step4.fireSuppressionType} onChange={f(setStep4)} options={['', 'Inert Gas', 'Water Mist', 'Pre-Action Sprinkler', 'Hybrid', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Water Risk / Flood Risk *" name="waterFloodRisk" value={step4.waterFloodRisk} onChange={f(setStep4)} options={['', 'Low', 'Medium', 'High', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Seismic Risk *" name="seismicRisk" value={step4.seismicRisk} onChange={f(setStep4)} options={['', 'Low', 'Medium', 'High', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="DC Site Developer (General Contractor) *" name="dcSiteDeveloper" value={step4.dcSiteDeveloper || ''} onChange={f(setStep4)} />
            <Input label="DC Site Operator (if different) *" name="dcSiteOperator" value={step4.dcSiteOperator || ''} onChange={f(setStep4)} />
            <TextArea label="Other Details (Ceiling Height, slab constraints, etc) *" name="otherDetails" value={step4.otherDetails || ''} onChange={f(setStep4)} className="sm:col-span-2" />
          </div>
        );
      case 4:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Power Source *" name="powerSource" value={step5.powerSource} onChange={f(setStep5)} options={['', 'Grid', 'Power Behind Meter', 'Hybrid'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Grid Connection Voltage, kV *" name="gridVoltageKv" type="number" value={step5.gridVoltageKv} onChange={f(setStep5)} />
            <Select label="Power Redundancy Topology *" name="powerRedundancy" value={step5.powerRedundancy} onChange={f(setStep5)} options={['', 'N', 'N+1', '2N', '2N+1', '2(N+1)', 'Shared Redundant'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Backup Power *" name="backupPower" value={step5.backupPower} onChange={f(setStep5)} options={['', 'Batteries (BESS)', 'Diesel Generators', 'Dual Source', 'Other'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            {step5.backupPower === 'Batteries (BESS)' && (
              <Select label="Battery System Type" name="backupPowerBessType" value={step5.backupPowerBessType} onChange={f(setStep5)} options={['', 'Generators', 'Batteries (BESS)', 'Gas'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            )}
            {step5.backupPower === 'Other' && (
              <Input label="Specify other backup power type" name="backupPowerOther" value={step5.backupPowerOther} onChange={f(setStep5)} />
            )}
            <Select label="On-site Substation Status *" name="substationStatus" value={step5.substationStatus} onChange={f(setStep5)} options={['', 'Existing', 'Under Construction', 'Planned', 'Off-site only'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Transformer Redundancy *" name="transformerRedundancy" value={step5.transformerRedundancy} onChange={f(setStep5)} options={['', 'N', 'N+1', '2N', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Maintenance Concurrency *" name="maintenanceConcurrency" value={step5.maintenanceConcurrency} onChange={f(setStep5)} options={['', 'Yes', 'No', 'Partial'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">UPS Autonomy, minutes *</label>
                <InfoIcon text="Time in minutes UPS can maintain power before backup generators activate." placement="top" />
              </div>
              <Input name="upsAutonomyMin" type="number" value={step5.upsAutonomyMin} onChange={f(setStep5)} />
            </div>
            <Select label="UPS Topology *" name="upsTopology" value={step5.upsTopology} onChange={f(setStep5)} options={['', 'Centralized', 'Distributed', 'Block Redundant', 'Modular'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Renewable Energy, % of Total *" name="renewableEnergyPct" type="number" value={step5.renewableEnergyPct} onChange={f(setStep5)} />
            <div className="sm:col-span-2">
              <p className="text-sm font-medium mb-2">Type of Renewable Energy</p>
              <div className="flex gap-4">
                {RENEWABLE_OPTIONS.map((o) => (
                  <label key={o} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={step5.renewableTypes.includes(o)} onChange={() => toggleArr(setStep5, 'renewableTypes', o)} />
                    <span className="text-sm">{o}</span>
                  </label>
                ))}
              </div>
            </div>
            <Input label="Number of Feeds *" name="numberOfFeeds" type="number" value={step5.numberOfFeeds} onChange={f(setStep5)} />
            <Select label="A/B Feeds Physically Separated? *" name="abFeedsSeparated" value={step5.abFeedsSeparated} onChange={f(setStep5)} options={['', 'Yes', 'No', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Future Reserved Power Secured? *" name="futureReservedPower" value={step5.futureReservedPower} onChange={f(setStep5)} className="sm:col-span-2" />
            <Select label="Curtailment Risk *" name="curtailmentRisk" value={step5.curtailmentRisk} onChange={f(setStep5)} options={['', 'None known', 'Low', 'Medium', 'High'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Other Details *" name="powerInfraOtherDetails" value={step5.powerInfraOtherDetails} onChange={f(setStep5)} className="sm:col-span-2" />
          </div>
        );
      case 5:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Checkbox label="Carrier Neutrality" name="carrierNeutral" checked={step6.carrierNeutral} onChange={f(setStep6)} />
            <Input label="Number of Carriers On-net *" name="carriersOnNet" type="number" value={step6.carriersOnNet} onChange={f(setStep6)} />
            <TextArea label="Carriers Available on Site *" name="carriersAvailable" value={step6.carriersAvailable} onChange={f(setStep6)} className="sm:col-span-2" />
            <Checkbox label="Dark Fibre Availability" name="darkFibreAvailable" checked={step6.darkFibreAvailable} onChange={f(setStep6)} />
            <TextArea label="Fiber Entry Points *" name="fiberEntryPoints" value={step6.fiberEntryPoints} onChange={f(setStep6)} className="sm:col-span-2" />
            <TextArea label="Meet-Me-Room Description *" name="mmrDescription" value={step6.mmrDescription} onChange={f(setStep6)} className="sm:col-span-2" maxLength="2000" />
            <Select label="MMR Redundancy *" name="mmrRedundancy" value={step6.mmrRedundancy} onChange={f(setStep6)} options={['', 'Single', 'Redundant', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Connectivity Detailed Mapping *" name="connectivityMapping" value={step6.connectivityMapping} onChange={f(setStep6)} className="sm:col-span-2" maxLength="2000" />
            <Input label="Distance to Nearest Major IX, km *" name="distanceToIxKm" type="number" value={step6.distanceToIxKm} onChange={f(setStep6)} />
            <Select label="Cross-Connect Availability *" name="crossConnectAvail" value={step6.crossConnectAvail} onChange={f(setStep6)} options={['', 'Yes', 'No', 'Planned'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Latency, ms, One Way *" name="latencyMs" type="number" value={step6.latencyMs} onChange={f(setStep6)} />
            <Input label="Latency Destination *" name="latencyDestination" value={step6.latencyDestination} onChange={f(setStep6)} />
            <TextArea label="Other Details *" name="connectivityOtherDetails" value={step6.connectivityOtherDetails} onChange={f(setStep6)} className="sm:col-span-2" />
          </div>
        );
      case 6:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Lease Term Options *" name="leaseTermOptions" value={step7.leaseTermOptions} onChange={f(setStep7)} />
            <Input label="Break / Extension Rights *" name="breakExtensionRights" value={step7.breakExtensionRights} onChange={f(setStep7)} />
            <Select label="Payment Frequency *" name="paymentFrequency" value={step7.paymentFrequency} onChange={f(setStep7)} options={['', 'Monthly', 'Yearly'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">Deposit / Security Requirement *</label>
                <InfoIcon text="USD amount or x months of rent" placement="top" />
              </div>
              <Input name="depositRequirement" value={step7.depositRequirement} onChange={f(setStep7)} />
            </div>
            <Input label="Remote Hands Pricing *" name="remoteHandsPricing" value={step7.remoteHandsPricing} onChange={f(setStep7)} />
            <Input label="Other Opex Charges *" name="otherOpexCharges" value={step7.otherOpexCharges} onChange={f(setStep7)} />
            <Input label="Fit-out Contribution / TI Allowance *" name="fitOutContribution" value={step7.fitOutContribution} onChange={f(setStep7)} />
            <Input label="Make-good / Restoration Obligations *" name="makeGoodObligations" value={step7.makeGoodObligations} onChange={f(setStep7)} />
            <Input label="Tax / VAT Treatment *" name="taxVatTreatment" value={step7.taxVatTreatment} onChange={f(setStep7)} />
            <Input label="Indexation Basis *" name="indexationBasis" value={step7.indexationBasis} onChange={f(setStep7)} />
            <Input label="Storage Area Rent (USD/sqm/month) *" name="storageAreaRent" value={step7.storageAreaRent} onChange={f(setStep7)} />
            <Input label="Annual Escalation, % *" name="annualEscalationPct" type="number" value={step7.annualEscalationPct} onChange={f(setStep7)} />
            <Input label="Additional Opex Charges (USD) *" name="additionalOpexCharges" value={step7.additionalOpexCharges} onChange={f(setStep7)} />
            <Select label="Power Price Structure *" name="powerPriceStructure" value={step7.powerPriceStructure} onChange={f(setStep7)} options={['', 'Fees', 'Indexed', 'Pass-through', 'Blended'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Avg Power Price, USD-cents/kWh *" name="powerPriceCurrentUsd" type="number" value={step7.powerPriceCurrentUsd} onChange={f(setStep7)} />
            <Input label="Cross-Connect Pricing *" name="crossConnectPricing" value={step7.crossConnectPricing} onChange={f(setStep7)} />
            <div className="flex gap-6 sm:col-span-2">
              <Checkbox label="Tax Incentives Available" name="taxIncentivesAvailable" checked={step7.taxIncentivesAvailable} onChange={f(setStep7)} />
              <Checkbox label="Insurance by DC" name="insuranceByDc" checked={step7.insuranceByDc} onChange={f(setStep7)} />
              <Checkbox label="Prepaid Required" name="prepaidRequired" checked={step7.prepaidRequired} onChange={f(setStep7)} />
            </div>
          </div>
        );
      case 7:
        return (
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">Add one row per phase or delivery milestone. At least one row is required.</p>
            <div className="space-y-4">
              {phasingRows.map((row, idx) => (
                <Card key={idx} className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Row {idx + 1}</span>
                    {phasingRows.length > 1 && (
                      <button onClick={() => removePhasingRow(idx)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Input label="Phase" value={row.phase} onChange={e => updatePhasingRow(idx, 'phase', e.target.value)} placeholder="e.g. Phase 1, Expansion 2" />
                    <Input label="Month *" type="month" value={row.month} onChange={e => updatePhasingRow(idx, 'month', e.target.value)} />
                    <Input label="IT Load (MW)" type="number" value={row.itLoadMw} onChange={e => updatePhasingRow(idx, 'itLoadMw', e.target.value)} />
                    <Input label="Cumulative IT Load (MW)" type="number" value={row.cumulativeItLoadMw} onChange={e => updatePhasingRow(idx, 'cumulativeItLoadMw', e.target.value)} />
                    <Input label="Estimated Capex (M$)" type="number" value={row.estimatedCapexMusd} onChange={e => updatePhasingRow(idx, 'estimatedCapexMusd', e.target.value)} />
                    <Input label="Min Lease Duration (yrs)" type="number" value={row.minLeaseDurationYrs} onChange={e => updatePhasingRow(idx, 'minLeaseDurationYrs', e.target.value)} />
                    <Input label="NRC Request (M$)" type="number" value={row.nrcRequestMusd} onChange={e => updatePhasingRow(idx, 'nrcRequestMusd', e.target.value)} />
                    <Input label="Initial Deposit (M$)" type="number" value={row.initialDepositMusd} onChange={e => updatePhasingRow(idx, 'initialDepositMusd', e.target.value)} />
                    <Input label="MRC Request ($/kW/month)" type="number" value={row.mrcRequestPerKw} onChange={e => updatePhasingRow(idx, 'mrcRequestPerKw', e.target.value)} />
                    <TextArea label="Scope of Works" value={row.scopeOfWorks} onChange={e => updatePhasingRow(idx, 'scopeOfWorks', e.target.value)} className="sm:col-span-2" />
                    <TextArea label="Key Inclusions in MRC" value={row.mrcInclusions} onChange={e => updatePhasingRow(idx, 'mrcInclusions', e.target.value)} className="sm:col-span-2 lg:col-span-3" />
                  </div>
                </Card>
              ))}
            </div>
            <button
              onClick={addPhasingRow}
              className="mt-4 flex items-center gap-2 text-sm text-[var(--color-primary)] hover:opacity-80 font-medium"
            >
              <Plus className="w-4 h-4" /> Add Phase Row
            </button>
          </div>
        );
      case 8:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Storage Rent (USD/sqm) *" name="storageRentUsd" type="number" value={step8.storageRentUsd} onChange={f(setStep8)} />
            <Input label="Annual Escalation % *" name="annualEscalationPct" type="number" value={step8.annualEscalationPct} onChange={f(setStep8)} />
            <Select label="Power Price Structure *" name="powerPriceStructure" value={step8.powerPriceStructure} onChange={f(setStep8)} options={['', 'Fixed', 'Indexed', 'Pass-through', 'Blended'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Avg Power Price (cents/kWh) *" name="avgPowerPriceCents" type="number" step="0.01" value={step8.avgPowerPriceCents} onChange={f(setStep8)} />
            <Input label="Cross-Connect Pricing *" name="crossConnectPricing" value={step8.crossConnectPricing} onChange={f(setStep8)} />
            <TextArea label="PPA (Power Purchase Agreement)" name="ppa" value={step8.ppa} onChange={f(setStep8)} className="sm:col-span-2" placeholder="Describe any PPA arrangements" />
            <div className="flex gap-4 sm:col-span-2">
              <Checkbox label="Tax Incentives" name="taxIncentives" checked={step8.taxIncentives} onChange={f(setStep8)} />
              <Checkbox label="Insurance by DC" name="insuranceByDc" checked={step8.insuranceByDc} onChange={f(setStep8)} />
              <Checkbox label="Deposit Required" name="depositRequired" checked={step8.depositRequired} onChange={f(setStep8)} />
            </div>
            <TextArea label="Remarks *" name="remarks" value={step8.remarks} onChange={f(setStep8)} className="sm:col-span-2" />
          </div>
        );
      case 9: {
        const docsByType = (type) => documents.filter(d => d.document_type === type || d.documentType === type);
        return (
          <div className="space-y-6">
            <p className="text-sm text-[var(--color-text-secondary)]">Upload supporting documents for this DC listing. All uploads are optional.</p>

            {/* Legal agreements */}
            <div className="flex gap-6">
              <Checkbox label="LoI / MoU Completed" name="loiMou" checked={docsState.loiMou} onChange={f(setDocsState)} />
              <Checkbox label="MSA Completed" name="msa" checked={docsState.msa} onChange={f(setDocsState)} />
            </div>

            {/* File uploads per document type */}
            <div className="grid sm:grid-cols-2 gap-4">
              {DOC_TYPES.map(({ type, label }) => (
                <Card key={type} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  {/* Existing uploads */}
                  {docsByType(type).map(doc => (
                    <div key={doc._id || doc.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2 mb-2">
                      <span className="truncate max-w-[180px]">{doc.file_name || doc.fileName}</span>
                      <button onClick={() => removeDocument(doc._id || doc.id)} className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* Upload button */}
                  <input
                    ref={el => fileInputRefs.current[type] = el}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) uploadDocument(file, type);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[type]?.click()}
                    disabled={uploadingDoc === type}
                    className="flex items-center gap-2 text-xs text-[var(--color-primary)] hover:opacity-80 font-medium disabled:opacity-50"
                  >
                    {uploadingDoc === type ? (
                      <Spinner size="xs" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    {uploadingDoc === type ? 'Uploading...' : 'Upload File'}
                  </button>
                </Card>
              ))}
            </div>
          </div>
        );
      }
      case 10:
        return (
          <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)] text-sm">Review all your entered information. You can edit any field directly below.</p>

            <Card>
              <h3 className="font-semibold mb-4">Company Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Legal Entity" value={step1.companyLegalEntity} onChange={(e) => setStep1({...step1, companyLegalEntity: e.target.value})} />
                <Input label="Office Address" value={step1.companyOfficeAddress} onChange={(e) => setStep1({...step1, companyOfficeAddress: e.target.value})} />
                <Input label="Country" value={step1.companyCountry} onChange={(e) => setStep1({...step1, companyCountry: e.target.value})} />
                <Input label="Contact Name" value={step1.contactName} onChange={(e) => setStep1({...step1, contactName: e.target.value})} />
                <Input label="Contact Email" value={step1.contactEmail} onChange={(e) => setStep1({...step1, contactEmail: e.target.value})} />
                <Input label="Contact Number" value={step1.contactMobile} onChange={(e) => setStep1({...step1, contactMobile: e.target.value})} />
                <Input label="Vendor Type" value={step1.vendorType} onChange={(e) => setStep1({...step1, vendorType: e.target.value})} />
                <Input label="Mandate Status" value={step1.mandateStatus} onChange={(e) => setStep1({...step1, mandateStatus: e.target.value})} />
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">Site Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Site Name" value={step2.siteName} onChange={(e) => setStep2({...step2, siteName: e.target.value})} />
                <Input label="Address" value={step2.address} onChange={(e) => setStep2({...step2, address: e.target.value})} />
                <Input label="Country" value={step2.country} onChange={(e) => setStep2({...step2, country: e.target.value})} />
                <Input label="State/Region" value={step2.stateRegion} onChange={(e) => setStep2({...step2, stateRegion: e.target.value})} />
                <Input label="Business Model" value={step2.businessModel} onChange={(e) => setStep2({...step2, businessModel: e.target.value})} />
                <Input label="Project Type" value={step2.projectType} onChange={(e) => setStep2({...step2, projectType: e.target.value})} />
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">Capacity & Energy</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Current Energized MW" type="number" value={step3.currentEnergizedMw} onChange={(e) => setStep3({...step3, currentEnergizedMw: e.target.value})} />
                <Input label="Total IT Load MW" type="number" value={step3.totalItLoadMw} onChange={(e) => setStep3({...step3, totalItLoadMw: e.target.value})} />
                <Input label="Total Utility MVA" type="number" value={step3.totalUtilityMva} onChange={(e) => setStep3({...step3, totalUtilityMva: e.target.value})} />
                <Input label="Total White Space (sqm)" type="number" value={step3.totalWhiteSpaceSqm} onChange={(e) => setStep3({...step3, totalWhiteSpaceSqm: e.target.value})} />
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">Power Infrastructure</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Power Source" value={step5.powerSource} onChange={(e) => setStep5({...step5, powerSource: e.target.value})} />
                <Input label="Grid Voltage (kV)" type="number" value={step5.gridVoltageKv} onChange={(e) => setStep5({...step5, gridVoltageKv: e.target.value})} />
                <Input label="Power Redundancy" value={step5.powerRedundancy} onChange={(e) => setStep5({...step5, powerRedundancy: e.target.value})} />
                <Input label="Backup Power" value={step5.backupPower} onChange={(e) => setStep5({...step5, backupPower: e.target.value})} />
                <Input label="Renewable Energy %" type="number" value={step5.renewableEnergyPct} onChange={(e) => setStep5({...step5, renewableEnergyPct: e.target.value})} />
                <Input label="UPS Autonomy (min)" type="number" value={step5.upsAutonomyMin} onChange={(e) => setStep5({...step5, upsAutonomyMin: e.target.value})} />
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">Commercial Terms</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Lease Term Options" value={step7.leaseTermOptions} onChange={(e) => setStep7({...step7, leaseTermOptions: e.target.value})} />
                <Input label="Payment Frequency" value={step7.paymentFrequency} onChange={(e) => setStep7({...step7, paymentFrequency: e.target.value})} />
                <Input label="Tax/VAT Treatment" value={step7.taxVatTreatment} onChange={(e) => setStep7({...step7, taxVatTreatment: e.target.value})} />
                <Input label="Avg Power Price (cents/kWh)" type="number" value={step7.powerPriceCurrentUsd} onChange={(e) => setStep7({...step7, powerPriceCurrentUsd: e.target.value})} />
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">Phasing ({phasingRows.filter(r => r.month).length} rows)</h3>
              {phasingRows.filter(r => r.month).length === 0 ? (
                <p className="text-sm text-gray-400">No phasing rows entered.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-[var(--color-border)]">
                        <th className="pb-2 pr-3">Phase</th><th className="pb-2 pr-3">Month</th>
                        <th className="pb-2 pr-3">IT Load (MW)</th><th className="pb-2 pr-3">Capex (M$)</th>
                        <th className="pb-2">MRC ($/kW/mo)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phasingRows.filter(r => r.month).map((row, i) => (
                        <tr key={i} className="border-b border-[var(--color-border)]">
                          <td className="py-1.5 pr-3">{row.phase}</td>
                          <td className="py-1.5 pr-3">{row.month}</td>
                          <td className="py-1.5 pr-3">{row.itLoadMw}</td>
                          <td className="py-1.5 pr-3">{row.estimatedCapexMusd}</td>
                          <td className="py-1.5">{row.mrcRequestPerKw}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6">New DC Listing</h1>
        <Stepper steps={STEPS} currentStep={step} />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{STEPS[step]}</h2>
          <AutoSaveIndicator status={autoSaveStatus} />
        </div>
        {renderStep()}
      </Card>

      <div className="flex justify-between items-center gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
        <div className="flex gap-3">
          {step < STEPS.length - 1 ? (
            <Button onClick={next} loading={saving} disabled={saving}>Save & Continue</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={back}>Back to Previous</Button>
              <Button onClick={() => submit()} loading={submitting} disabled={!appId}>Submit Listing</Button>
            </>
          )}
        </div>
      </div>

      <DuplicateWarningModal
        open={duplicateModal.open}
        onClose={() => setDuplicateModal({ open: false, duplicates: [], hasDuplicates: false })}
        duplicates={duplicateModal.duplicates}
        onContinue={handleContinueWithDuplicates}
        loading={submitting}
      />
    </div>
  );
}
