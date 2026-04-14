import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const STEPS = [
  'Company Details', 'Site Details', 'Master Plan',
  'DC Specifications', 'Power Infrastructure', 'Connectivity',
  'Commercial Terms', 'Phasing and Expansion Schedule', 'Site Financials', 'Review & Submit',
];

const COOLING_OPTIONS = ['Air Cooled', 'Liquid Cooling Ready (Rear Door/DLC)', 'Immersion Cooling Supported', 'Hybrid'];
const RENEWABLE_OPTIONS = ['Hydro', 'Wind', 'Solar'];

export default function DcListingNewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [step, setStep] = useState(Number(searchParams.get('step')) || 0);
  const [appId, setAppId] = useState(searchParams.get('appId') || null);
  const [siteId, setSiteId] = useState(searchParams.get('siteId') || null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!searchParams.get('appId'));
  const [duplicateModal, setDuplicateModal] = useState({ open: false, duplicates: [], hasDuplicates: false });

  const [step1, setStep1] = useState({ companyLegalEntity: '', companyOfficeAddress: '', companyCountry: '', contactName: '', contactMobile: '', otherDetails: '' });
  const [step2, setStep2] = useState({ siteName: '', projectType: '', currentProjectStatus: '', businessModel: '', sovereigntyRestrictions: '', regulatoryCompliance: '', airGapped: false, landSizeSqm: '', buildingCount: '', dataHallCount: '', address: '', stateRegion: '', country: '', coordinates: '' });
  const [step3, setStep3] = useState({ currentEnergizedMw: '', totalItLoadMw: '', totalUtilityMva: '', totalWhiteSpaceSqm: '', expansionPossible: false, expansionMw: '' });
  const [step4, setStep4] = useState({ maxRackDensityKw: '', typicalRackDensityKw: '', rackCoolingEffectiveTempC: '', facilityCoolingEffectiveTempC: '', coolingMethodology: [], liquidCoolingStatus: '', waterCoolingSource: '', designPue: '', designWueType: '', designWue: '', floorMaxWeight: '', landOwner: '', landOwnershipType: '', leaseYears: '', physicalSecurityZones: '', physicalSecurity: '', dcTiering: '', dcTieringCertified: false, iso27001: false, iso50001: false, soc2: false, otherCertifications: '', powerPermitStatus: '', buildingPermitStatus: '', envPermitStatus: '', currentStatusDescription: '', fireSuppressionType: '', waterFloodRisk: '', seismicRisk: '', dcSiteDeveloper: '', dcSiteOperator: '', otherDetails: '' });
  const [step5, setStep5] = useState({ powerSource: '', gridVoltageKv: '', powerRedundancy: '', backupPower: '', backupPowerBessType: '', backupPowerOther: '', substationStatus: '', transformerRedundancy: '', maintenanceConcurrency: '', upsAutonomyMin: '', upsTopology: '', renewableEnergyPct: '', renewableTypes: [], numberOfFeeds: '', abFeedsSeparated: '', futureReservedPower: '', curtailmentRisk: '', powerInfraOtherDetails: '' });
  const [step6, setStep6] = useState({ carrierNeutral: false, carriersOnNet: '', carriersAvailable: '', darkFibreAvailable: false, fiberEntryPoints: '', mmrDescription: '', mmrRedundancy: '', connectivityMapping: '', distanceToIxKm: '', crossConnectAvail: '', latencyMs: '', latencyDestination: '', connectivityOtherDetails: '' });
  const [step7, setStep7] = useState({ leaseTermOptions: '', breakExtensionRights: '', paymentFrequency: '', depositRequirement: '', remoteHandsPricing: '', otherOpexCharges: '', fitOutContribution: '', makeGoodObligations: '', taxVatTreatment: '', indexationBasis: '', storageAreaRent: '', taxIncentivesAvailable: false, annualEscalationPct: '', additionalOpexCharges: '', insuranceByDc: false, prepaidRequired: false, powerPriceStructure: '', powerPriceCurrentUsd: '', crossConnectPricing: '' });
  const [step9, setStep9] = useState({ month: '', phase: '', totalMwv: '', itLoadMwv: '', cumulativeItLoadMwv: '', scopeOfWorks: '', estimatedCapexM: '', minimumLeaseDurationYrs: '', mrcRequestKw: '', initialDepositM: '', mrcRequestKwMonth: '', keyRevisions: '' });
  const [step8, setStep8] = useState({ storageRentUsd: '', taxIncentives: false, annualEscalationPct: '', additionalOpex: '', insuranceByDc: false, depositRequired: false, powerPriceStructure: '', avgPowerPriceCents: '', crossConnectPricing: '', remarks: '' });

  // Reload draft data on mount if appId exists in URL
  useEffect(() => {
    const draftAppId = searchParams.get('appId');
    if (!draftAppId) return;
    api.get(`/dc-applications/${draftAppId}`)
      .then((r) => {
        const app = r.data;
        setStep1({ companyLegalEntity: app.companyLegalEntity || '', companyOfficeAddress: app.companyOfficeAddress || '', companyCountry: app.companyCountry || '', contactName: app.contactName || '', contactMobile: app.contactMobile || '', otherDetails: app.otherDetails || '' });
        const site = app.sites?.[0];
        if (site) {
          setSiteId(site._id);
          setStep2({ siteName: site.siteName || '', projectType: site.projectType || '', currentProjectStatus: site.currentProjectStatus || '', businessModel: site.businessModel || '', sovereigntyRestrictions: site.sovereigntyRestrictions || '', regulatoryCompliance: site.regulatoryCompliance || '', airGapped: site.airGapped || false, landSizeSqm: site.landSizeSqm ?? '', buildingCount: site.buildingCount ?? '', dataHallCount: site.dataHallCount ?? '', address: site.address || '', stateRegion: site.stateRegion || '', country: site.country || '', coordinates: site.coordinates || '' });
          setStep3({ currentEnergizedMw: site.currentEnergizedMw ?? '', totalItLoadMw: site.totalItLoadMw ?? '', totalUtilityMva: site.totalUtilityMva ?? '', totalWhiteSpaceSqm: site.totalWhiteSpaceSqm ?? '', expansionPossible: site.expansionPossible || false, expansionMw: site.expansionMw ?? '' });
          setStep4({ maxRackDensityKw: site.maxRackDensityKw ?? '', typicalRackDensityKw: site.typicalRackDensityKw ?? '', rackCoolingEffectiveTempC: site.rackCoolingEffectiveTempC ?? '', facilityCoolingEffectiveTempC: site.facilityCoolingEffectiveTempC ?? '', coolingMethodology: site.coolingMethodology || [], liquidCoolingStatus: site.liquidCoolingStatus || '', waterCoolingSource: site.waterCoolingSource || '', designPue: site.designPue ?? '', designWueType: site.designWueType || '', designWue: site.designWue ?? '', floorMaxWeight: site.floorMaxWeight ?? '', landOwner: site.landOwner || '', landOwnershipType: site.landOwnershipType || '', leaseYears: site.leaseYears ?? '', physicalSecurityZones: site.physicalSecurityZones ?? '', physicalSecurity: site.physicalSecurity || '', dcTiering: site.dcTiering || '', dcTieringCertified: site.dcTieringCertified || false, iso27001: site.iso27001 || false, iso50001: site.iso50001 || false, soc2: site.soc2 || false, otherCertifications: site.otherCertifications || '', powerPermitStatus: site.powerPermitStatus || '', buildingPermitStatus: site.buildingPermitStatus || '', envPermitStatus: site.envPermitStatus || '', currentStatusDescription: site.currentStatusDescription || '', fireSuppressionType: site.fireSuppressionType || '', waterFloodRisk: site.waterFloodRisk || '', seismicRisk: site.seismicRisk || '', dcSiteDeveloper: site.dcSiteDeveloper || '', dcSiteOperator: site.dcSiteOperator || '', otherDetails: site.otherDetails || '' });
          setStep5({ powerSource: site.powerSource || '', gridVoltageKv: site.gridVoltageKv ?? '', powerRedundancy: site.powerRedundancy || '', backupPower: site.backupPower || '', backupPowerBessType: site.backupPowerBessType || '', backupPowerOther: site.backupPowerOther || '', substationStatus: site.substationStatus || '', transformerRedundancy: site.transformerRedundancy || '', maintenanceConcurrency: site.maintenanceConcurrency || '', upsAutonomyMin: site.upsAutonomyMin ?? '', upsTopology: site.upsTopology || '', renewableEnergyPct: site.renewableEnergyPct ?? '', renewableTypes: site.renewableTypes || [], numberOfFeeds: site.numberOfFeeds ?? '', abFeedsSeparated: site.abFeedsSeparated || '', futureReservedPower: site.futureReservedPower || '', curtailmentRisk: site.curtailmentRisk || '', powerInfraOtherDetails: site.powerInfraOtherDetails || '' });
          setStep6({ carrierNeutral: site.carrierNeutral || false, carriersOnNet: site.carriersOnNet ?? '', carriersAvailable: site.carriersAvailable || '', darkFibreAvailable: site.darkFibreAvailable || false, fiberEntryPoints: site.fiberEntryPoints || '', mmrDescription: site.mmrDescription || '', mmrRedundancy: site.mmrRedundancy || '', connectivityMapping: site.connectivityMapping || '', distanceToIxKm: site.distanceToIxKm ?? '', crossConnectAvail: site.crossConnectAvail || '', latencyMs: site.latencyMs ?? '', latencyDestination: site.latencyDestination || '', connectivityOtherDetails: site.connectivityOtherDetails || '' });
          setStep7({ leaseTermOptions: site.leaseTermOptions || '', breakExtensionRights: site.breakExtensionRights || '', paymentFrequency: site.paymentFrequency || '', depositRequirement: site.depositRequirement || '', remoteHandsPricing: site.remoteHandsPricing || '', otherOpexCharges: site.otherOpexCharges || '', fitOutContribution: site.fitOutContribution || '', makeGoodObligations: site.makeGoodObligations || '', taxVatTreatment: site.taxVatTreatment || '', indexationBasis: site.indexationBasis || '', storageAreaRent: site.storageAreaRent || '', taxIncentivesAvailable: site.taxIncentivesAvailable || false, annualEscalationPct: site.annualEscalationPct ?? '', additionalOpexCharges: site.additionalOpexCharges || '', insuranceByDc: site.insuranceByDc || false, prepaidRequired: site.prepaidRequired || false, powerPriceStructure: site.powerPriceStructure || '', powerPriceCurrentUsd: site.powerPriceCurrentUsd ?? '', crossConnectPricing: site.crossConnectPricing || '' });
          setStep9({ month: site.month || '', phase: site.phase || '', totalMwv: site.totalMwv ?? '', itLoadMwv: site.itLoadMwv ?? '', cumulativeItLoadMwv: site.cumulativeItLoadMwv ?? '', scopeOfWorks: site.scopeOfWorks || '', estimatedCapexM: site.estimatedCapexM ?? '', minimumLeaseDurationYrs: site.minimumLeaseDurationYrs ?? '', mrcRequestKw: site.mrcRequestKw ?? '', initialDepositM: site.initialDepositM ?? '', mrcRequestKwMonth: site.mrcRequestKwMonth ?? '', keyRevisions: site.keyRevisions || '' });
          setStep8({ storageRentUsd: site.storageRentUsd ?? '', taxIncentives: site.taxIncentives || false, annualEscalationPct: site.annualEscalationPct ?? '', additionalOpex: site.additionalOpex || '', insuranceByDc: site.insuranceByDc || false, depositRequired: site.depositRequired || false, powerPriceStructure: site.powerPriceStructure || '', avgPowerPriceCents: site.avgPowerPriceCents ?? '', crossConnectPricing: site.crossConnectPricing || '', remarks: site.remarks || '' });
        }
      })
      .catch(() => addToast({ type: 'error', message: 'Failed to load draft' }))
      .finally(() => setLoadingDraft(false));
  }, []);

  // Persist IDs to URL so refresh works
  const updateUrl = (newAppId, newSiteId, newStep) => {
    const params = {};
    if (newAppId || appId) params.appId = newAppId || appId;
    if (newSiteId || siteId) params.siteId = newSiteId || siteId;
    if (newStep !== undefined) params.step = newStep;
    setSearchParams(params, { replace: true });
  };

  // Auto-save current step's site data only
  const stepDataMap = { 1: step2, 2: step3, 3: step4, 4: step5, 5: step6, 6: step7, 7: step9, 8: step8 };
  const currentStepData = stepDataMap[step] || null;
  const { status: autoSaveStatus } = useAutoSave(
    siteId ? `/dc-applications/${appId}/sites/${siteId}` : null,
    currentStepData,
    { enabled: !!siteId && !!appId && step >= 1 && step <= 8 }
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

  // Create or update application on step 1 submit
  const saveStep1 = async () => {
    if (!step1.companyLegalEntity) {
      addToast({ type: 'error', message: 'Company name is required' });
      return false;
    }
    try {
      if (!appId) {
        const res = await api.post('/dc-applications', step1);
        setAppId(res.data._id);
        updateUrl(res.data._id, null, 1);
      } else {
        await api.put(`/dc-applications/${appId}`, step1);
      }
      return true;
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save' });
      return false;
    }
  };

  const saveStep2 = async () => {
    if (!step2.siteName) {
      addToast({ type: 'error', message: 'Site name is required' });
      return false;
    }
    try {
      if (!siteId) {
        const res = await api.post(`/dc-applications/${appId}/sites`, { ...step2, ...step3 });
        setSiteId(res.data._id);
        updateUrl(null, res.data._id);
      } else {
        await api.put(`/dc-applications/${appId}/sites/${siteId}`, { ...step2, ...step3 });
      }
      return true;
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save site' });
      return false;
    }
  };

  const saveSite = async (data) => {
    if (!appId) {
      addToast({ type: 'error', message: 'Please complete Company Details (Step 1) first' });
      return false;
    }
    try {
      if (!siteId) {
        const res = await api.post(`/dc-applications/${appId}/sites`, { siteName: step2.siteName || 'Site 1', ...step2, ...step3, ...data });
        setSiteId(res.data._id);
        updateUrl(null, res.data._id);
      } else {
        await api.put(`/dc-applications/${appId}/sites/${siteId}`, data);
      }
      return true;
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save' });
      return false;
    }
  };

  const next = async () => {
    let ok = true;
    if (step === 0) ok = await saveStep1();
    else if (step === 1 || step === 2) ok = await saveStep2();
    else if (step === 3) ok = await saveSite(step4);
    else if (step === 4) ok = await saveSite(step5);
    else if (step === 5) ok = await saveSite(step6);
    else if (step === 6) ok = await saveSite(step7);
    else if (step === 7) ok = await saveSite(step9);
    else if (step === 8) ok = await saveSite({ ...step8 });

    if (ok) {
      const nextStep = Math.min(step + 1, STEPS.length - 1);
      setStep(nextStep);
      updateUrl(null, null, nextStep);
    }
  };

  const back = () => {
    const prevStep = Math.max(step - 1, 0);
    setStep(prevStep);
    updateUrl(null, null, prevStep);
  };

  const submit = async (force = false) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/dc-applications/${appId}/submit`, { force });

      // If duplicates found, show modal instead of submitting
      if (res.data.hasDuplicates) {
        setDuplicateModal({ open: true, duplicates: res.data.duplicates, hasDuplicates: true });
        setSubmitting(false);
        return;
      }

      addToast({ type: 'success', message: 'DC listing submitted successfully! Our team will review it shortly.' });
      navigate('/supplier/dc-listings');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to submit' });
      setSubmitting(false);
    }
  };

  const handleContinueWithDuplicates = async () => {
    await submit(true); // Force submit bypassing duplicate check
  };

  if (loadingDraft) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">Company Legal Entity *</label>
                <InfoIcon text="Official company name. Used for duplicate detection via company name matching." placement="top" />
              </div>
              <Input name="companyLegalEntity" value={step1.companyLegalEntity} onChange={f(setStep1)} />
            </div>
            <Input label="Office Address *" name="companyOfficeAddress" value={step1.companyOfficeAddress} onChange={f(setStep1)} />
            <Input label="Country *" name="companyCountry" value={step1.companyCountry} onChange={f(setStep1)} />
            <Input label="Contact Name *" name="contactName" value={step1.contactName} onChange={f(setStep1)} />
            <PhoneInput label="Contact Mobile *" name="contactMobile" value={step1.contactMobile} onChange={f(setStep1)} />
            <TextArea label="Other Details" name="otherDetails" value={step1.otherDetails} onChange={f(setStep1)} className="sm:col-span-2" />
          </div>
        );
      case 1:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Site Name *" name="siteName" value={step2.siteName} onChange={f(setStep2)} />
            <Select label="Project Type" name="projectType" value={step2.projectType} onChange={f(setStep2)} options={[{ value: '', label: 'Select...' }, 'Brownfield (Retrofit/Conversion)', 'Greenfield', 'Expansion'].map((o) => typeof o === 'string' ? { value: o, label: o } : o)} />
            <Select label="Current Status" name="currentProjectStatus" value={step2.currentProjectStatus} onChange={f(setStep2)} options={['', 'Planned', 'Permitted', 'Under Construction', 'Live', 'Partially Live'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Business Model" name="businessModel" value={step2.businessModel} onChange={f(setStep2)} options={['', 'Colocation (Wholesale/Retail)', 'Powered Shell', 'Hyperscale/ Build-to-Suit', 'AI Factory/ Sovereign Cloud'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Sovereignty Restrictions" name="sovereigntyRestrictions" value={step2.sovereigntyRestrictions} onChange={f(setStep2)} options={['', 'None', 'Domestic Only', 'Sovereign Cloud Capable', 'Restricted'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Regulatory Compliance" name="regulatoryCompliance" value={step2.regulatoryCompliance} onChange={f(setStep2)} options={['', 'GDPR', 'Local Law', 'GDPR + Local Law'].map((o) => ({ value: o, label: o || 'Select...' }))} />
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
                <label className="text-sm font-medium">Google Maps Link</label>
                <InfoIcon text="Precise location for GPS-based duplicate detection (50-100m radius)." placement="top" />
              </div>
              <LocationInput name="coordinates" value={step2.coordinates} onChange={f(setStep2)} />
            </div>
            <Input label="Land Size (sqm)" name="landSizeSqm" type="number" value={step2.landSizeSqm} onChange={f(setStep2)} />
            <Input label="Building Count" name="buildingCount" type="number" value={step2.buildingCount} onChange={f(setStep2)} />
            <Input label="Data Hall Count" name="dataHallCount" type="number" value={step2.dataHallCount} onChange={f(setStep2)} />
            <Checkbox label="Air Gapped" name="airGapped" checked={step2.airGapped} onChange={f(setStep2)} />
          </div>
        );
      case 2:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Current Energized MW" name="currentEnergizedMw" type="number" value={step3.currentEnergizedMw} onChange={f(setStep3)} />
            <Input label="Total IT Load MW" name="totalItLoadMw" type="number" value={step3.totalItLoadMw} onChange={f(setStep3)} />
            <Input label="Total Utility MVA" name="totalUtilityMva" type="number" value={step3.totalUtilityMva} onChange={f(setStep3)} />
            <Input label="Total White Space (sqm)" name="totalWhiteSpaceSqm" type="number" value={step3.totalWhiteSpaceSqm} onChange={f(setStep3)} />
            <Input label="Expansion MW" name="expansionMw" type="number" value={step3.expansionMw} onChange={f(setStep3)} />
            <Checkbox label="Expansion Possible" name="expansionPossible" checked={step3.expansionPossible} onChange={f(setStep3)} />
          </div>
        );
      case 3:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Rack Cooling Effective Temperature Expectation (°C) *" name="rackCoolingEffectiveTempC" type="number" value={step4.rackCoolingEffectiveTempC} onChange={f(setStep4)} placeholder="e.g., 27" />
            <Input label="Facility Cooling Effective Temperature Expectation (°C) *" name="facilityCoolingEffectiveTempC" type="number" value={step4.facilityCoolingEffectiveTempC} onChange={f(setStep4)} placeholder="e.g., 27" />
            <Input label="Rack Density, kW/Rack (maximum supported) *" name="maxRackDensityKw" type="number" value={step4.maxRackDensityKw} onChange={f(setStep4)} placeholder="Whole numbers only" />
            <Input label="Design Rack Density, kW/Rack (typical supported) *" name="typicalRackDensityKw" type="number" value={step4.typicalRackDensityKw} onChange={f(setStep4)} placeholder="Whole numbers only" />
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
            <Select label="Liquid Cooling Delivered" name="liquidCoolingStatus" value={step4.liquidCoolingStatus} onChange={f(setStep4)} options={['', 'Installed', 'Ready for retrofit', 'Design-ready only', 'No'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Water Cooling Source (Seawater, District Cooling, etc.)" name="waterCoolingSource" value={step4.waterCoolingSource} onChange={f(setStep4)} />
            <Input label="Design PUE (at full load), Contractually committed *" name="designPue" type="number" step="0.01" value={step4.designPue} onChange={f(setStep4)} placeholder="Allow fractional numbers" />
            <Select label="Design WUE Type *" name="designWueType" value={step4.designWueType} onChange={f(setStep4)} options={['', 'Facility wide', 'Cooling only'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Design WUE, L/kWh *" name="designWue" type="number" value={step4.designWue} onChange={f(setStep4)} placeholder="Whole numbers only" />
            <Input label="Floor max weight (tons/sqm or tons/sqft)" name="floorMaxWeight" type="number" value={step4.floorMaxWeight} onChange={f(setStep4)} placeholder="Whole numbers only" />
            <Input label="Land Owner *" name="landOwner" value={step4.landOwner} onChange={f(setStep4)} />
            <Select label="Land Ownership Type" name="landOwnershipType" value={step4.landOwnershipType} onChange={f(setStep4)} options={['', 'Freehold', 'Leasehold'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            {step4.landOwnershipType === 'Leasehold' && (
              <Input label="Lease Years" name="leaseYears" type="number" value={step4.leaseYears} onChange={f(setStep4)} />
            )}
            <Input label="Physical Security Zones" name="physicalSecurityZones" type="number" value={step4.physicalSecurityZones} onChange={f(setStep4)} placeholder="Number of zones" />
            <TextArea label="Physical Security details" name="physicalSecurity" value={step4.physicalSecurity} onChange={f(setStep4)} className="sm:col-span-2" />
            <Select label="DC Tiering" name="dcTiering" value={step4.dcTiering} onChange={f(setStep4)} options={['', 'Tier I', 'Tier II', 'Tier III', 'Tier IV', 'Not Certified'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <div className="flex gap-6">
              <Checkbox label="DC Tiering certified" name="dcTieringCertified" checked={step4.dcTieringCertified} onChange={f(setStep4)} />
            </div>
            <div className="flex gap-6 sm:col-span-2">
              <Checkbox label="ISO 27001" name="iso27001" checked={step4.iso27001} onChange={f(setStep4)} />
              <Checkbox label="ISO 50001" name="iso50001" checked={step4.iso50001} onChange={f(setStep4)} />
              <Checkbox label="SOC 2" name="soc2" checked={step4.soc2} onChange={f(setStep4)} />
            </div>
            <TextArea label="Other Certifications" name="otherCertifications" value={step4.otherCertifications} onChange={f(setStep4)} className="sm:col-span-2" />
            <Select label="Power Permit Status" name="powerPermitStatus" value={step4.powerPermitStatus} onChange={f(setStep4)} options={['', 'Not Required', 'Not Applied', 'In Preparation', 'Submitted / Under Review', 'Approved', 'Approved with Conditions', 'Rejected', 'Expired', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Building Permit Status" name="buildingPermitStatus" value={step4.buildingPermitStatus} onChange={f(setStep4)} options={['', 'Not Required', 'Not Applied', 'In Preparation', 'Submitted / Under Review', 'Approved', 'Approved with Conditions', 'Rejected', 'Expired', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Environmental Permit Status" name="envPermitStatus" value={step4.envPermitStatus} onChange={f(setStep4)} options={['', 'Not Required', 'Not Applied', 'In Preparation', 'Submitted / Under Review', 'Approved', 'Approved with Conditions', 'Rejected', 'Expired', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Describe current status in detail (Permits, power, construction status)" name="currentStatusDescription" value={step4.currentStatusDescription || ''} onChange={f(setStep4)} className="sm:col-span-2" />
            <Select label="Fire Suppression Type" name="fireSuppressionType" value={step4.fireSuppressionType} onChange={f(setStep4)} options={['', 'Inert Gas', 'Water Mist', 'Pre-Action Sprinkler', 'Hybrid', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Water risk / flood risk" name="waterFloodRisk" value={step4.waterFloodRisk} onChange={f(setStep4)} options={['', 'Low', 'Medium', 'High', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Seismic risk" name="seismicRisk" value={step4.seismicRisk} onChange={f(setStep4)} options={['', 'Low', 'Medium', 'High', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="DC Site Developer details (General Contractor)" name="dcSiteDeveloper" value={step4.dcSiteDeveloper || ''} onChange={f(setStep4)} />
            <Input label="DC Site operator (if different)" name="dcSiteOperator" value={step4.dcSiteOperator || ''} onChange={f(setStep4)} />
            <TextArea label="Other details (Ceiling Height, slab constraints, etc)" name="otherDetails" value={step4.otherDetails || ''} onChange={f(setStep4)} className="sm:col-span-2" />
          </div>
        );
      case 4:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Power Source *" name="powerSource" value={step5.powerSource} onChange={f(setStep5)} options={['', 'Grid', 'Power Behind Meter', 'Hybrid'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Grid Connection Voltage, kV *" name="gridVoltageKv" type="number" value={step5.gridVoltageKv} onChange={f(setStep5)} placeholder="Whole numbers only" />
            <Select label="Power Redundancy Topology *" name="powerRedundancy" value={step5.powerRedundancy} onChange={f(setStep5)} options={['', 'N', 'N+1', '2N', '2N+1', '2(N+1)', 'Shared Redundant'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Backup Power *" name="backupPower" value={step5.backupPower} onChange={f(setStep5)} options={['', 'Batteries (BESS)', 'Diesel Generators', 'Dual Source', 'Other'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            {step5.backupPower === 'Batteries (BESS)' && (
              <Select label="Battery System Type" name="backupPowerBessType" value={step5.backupPowerBessType} onChange={f(setStep5)} options={['', 'Generators', 'Batteries (BESS)', 'Gas'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            )}
            {step5.backupPower === 'Other' && (
              <Input label="Specify other backup power type" name="backupPowerOther" value={step5.backupPowerOther} onChange={f(setStep5)} />
            )}
            <Select label="On-site substation status" name="substationStatus" value={step5.substationStatus} onChange={f(setStep5)} options={['', 'Existing', 'Under Construction', 'Planned', 'Off-site only'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Transformer redundancy" name="transformerRedundancy" value={step5.transformerRedundancy} onChange={f(setStep5)} options={['', 'N', 'N+1', '2N', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Select label="Maintenance concurrency" name="maintenanceConcurrency" value={step5.maintenanceConcurrency} onChange={f(setStep5)} options={['', 'Yes', 'No', 'Partial'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">UPS Autonomy, minutes (backup duration the UPS can support at the stated design / target load before other backup sources are required) *</label>
                <InfoIcon text="Time in minutes that UPS can maintain power at design load before backup generators or other sources activate." placement="top" />
              </div>
              <Input name="upsAutonomyMin" type="number" value={step5.upsAutonomyMin} onChange={f(setStep5)} placeholder="Whole numbers only" />
            </div>
            <Select label="UPS topology" name="upsTopology" value={step5.upsTopology} onChange={f(setStep5)} options={['', 'Centralized', 'Distributed', 'Block Redundant', 'Modular'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Renewable Energy, % of Total" name="renewableEnergyPct" type="number" value={step5.renewableEnergyPct} onChange={f(setStep5)} placeholder="Whole numbers only" />
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
            <Input label="Number of feeds" name="numberOfFeeds" type="number" value={step5.numberOfFeeds} onChange={f(setStep5)} placeholder="Whole numbers only" />
            <Select label="A/B feeds physically separated?" name="abFeedsSeparated" value={step5.abFeedsSeparated} onChange={f(setStep5)} options={['', 'Yes', 'No', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Future reserved power secured?" name="futureReservedPower" value={step5.futureReservedPower} onChange={f(setStep5)} className="sm:col-span-2" placeholder="Describe future power capacity reservations" />
            <Select label="Curtailment risk" name="curtailmentRisk" value={step5.curtailmentRisk} onChange={f(setStep5)} options={['', 'None known', 'Low', 'Medium', 'High'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Other details" name="powerInfraOtherDetails" value={step5.powerInfraOtherDetails} onChange={f(setStep5)} className="sm:col-span-2" />
          </div>
        );
      case 5:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Checkbox label="Carrier Neutrality *" name="carrierNeutral" checked={step6.carrierNeutral} onChange={f(setStep6)} />
            <Input label="Number of Carriers on-net" name="carriersOnNet" type="number" value={step6.carriersOnNet} onChange={f(setStep6)} placeholder="Whole numbers only" />
            <TextArea label="Carriers available on site" name="carriersAvailable" value={step6.carriersAvailable} onChange={f(setStep6)} className="sm:col-span-2" />
            <Checkbox label="Dark Fibre Availability *" name="darkFibreAvailable" checked={step6.darkFibreAvailable} onChange={f(setStep6)} />
            <TextArea label="Fiber Entry Points (Connectivity)" name="fiberEntryPoints" value={step6.fiberEntryPoints} onChange={f(setStep6)} className="sm:col-span-2" />
            <TextArea label="Meet-Me-Room description" name="mmrDescription" value={step6.mmrDescription} onChange={f(setStep6)} className="sm:col-span-2" maxLength="2000" placeholder="Maximum 2000 characters" />
            <Select label="MMR redundancy" name="mmrRedundancy" value={step6.mmrRedundancy} onChange={f(setStep6)} options={['', 'Single', 'Redundant', 'Unknown'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <TextArea label="Connectivity detailed mapping" name="connectivityMapping" value={step6.connectivityMapping} onChange={f(setStep6)} className="sm:col-span-2" maxLength="2000" placeholder="Maximum 2000 characters" />
            <Input label="Distance to nearest major IX / network hub, km" name="distanceToIxKm" type="number" value={step6.distanceToIxKm} onChange={f(setStep6)} placeholder="Whole numbers only" />
            <Select label="Cross-connect availability" name="crossConnectAvail" value={step6.crossConnectAvail} onChange={f(setStep6)} options={['', 'Yes', 'No', 'Planned'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Latency, ms, one way" name="latencyMs" type="number" value={step6.latencyMs} onChange={f(setStep6)} placeholder="Whole numbers only" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">Latency destination</label>
                <InfoIcon text="If latency is filled, this field is mandatory" placement="top" />
              </div>
              <Input name="latencyDestination" value={step6.latencyDestination} onChange={f(setStep6)} />
            </div>
            <TextArea label="Other details" name="connectivityOtherDetails" value={step6.connectivityOtherDetails} onChange={f(setStep6)} className="sm:col-span-2" />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)] text-sm">Based on last 12 months activity</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Lease term options" name="leaseTermOptions" value={step7.leaseTermOptions} onChange={f(setStep7)} />
              <Input label="Break/ Extension Rights" name="breakExtensionRights" value={step7.breakExtensionRights} onChange={f(setStep7)} />
              <Select label="Payment Frequency" name="paymentFrequency" value={step7.paymentFrequency} onChange={f(setStep7)} options={['', 'Monthly', 'Yearly'].map((o) => ({ value: o, label: o || 'Select...' }))} />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Deposit/ Security Requirement</label>
                  <InfoIcon text="USD amount or x months of rent" placement="top" />
                </div>
                <Input name="depositRequirement" value={step7.depositRequirement} onChange={f(setStep7)} />
              </div>
              <Input label="Remote Hands Pricing" name="remoteHandsPricing" value={step7.remoteHandsPricing} onChange={f(setStep7)} />
              <Input label="Other Opex Charges" name="otherOpexCharges" value={step7.otherOpexCharges} onChange={f(setStep7)} />
              <Input label="Fit-out contribution/ TI allowance" name="fitOutContribution" value={step7.fitOutContribution} onChange={f(setStep7)} />
              <Input label="Make-good/ restoration obligations" name="makeGoodObligations" value={step7.makeGoodObligations} onChange={f(setStep7)} />
              <Input label="Tax / VAT Treatment" name="taxVatTreatment" value={step7.taxVatTreatment} onChange={f(setStep7)} />
              <Input label="Indexation basis" name="indexationBasis" value={step7.indexationBasis} onChange={f(setStep7)} />
              <Input label="Storage Area Rent (Price/sqm or $/month) in USD" name="storageAreaRent" value={step7.storageAreaRent} onChange={f(setStep7)} />
              <Checkbox label="Tax incentives available" name="taxIncentivesAvailable" checked={step7.taxIncentivesAvailable} onChange={f(setStep7)} />
              <Input label="Annual escalation, %" name="annualEscalationPct" type="number" value={step7.annualEscalationPct} onChange={f(setStep7)} placeholder="Whole numbers only" />
              <Input label="Additional Opex Charges in USD (first pass through USDs)" name="additionalOpexCharges" value={step7.additionalOpexCharges} onChange={f(setStep7)} />
              <Checkbox label="Insurance by DC" name="insuranceByDc" checked={step7.insuranceByDc} onChange={f(setStep7)} />
              <Checkbox label="Prepaid required" name="prepaidRequired" checked={step7.prepaidRequired} onChange={f(setStep7)} />
              <Select label="Power Price Structure" name="powerPriceStructure" value={step7.powerPriceStructure} onChange={f(setStep7)} options={['', 'Fees', 'Indexed', 'Pass-through', 'Blended'].map((o) => ({ value: o, label: o || 'Select...' }))} />
              <Input label="Avg Power Price in previous 12 months, USD-cents/ kWh" name="powerPriceCurrentUsd" type="number" value={step7.powerPriceCurrentUsd} onChange={f(setStep7)} placeholder="Whole numbers only" />
              <Input label="Cross-connect pricing" name="crossConnectPricing" value={step7.crossConnectPricing} onChange={f(setStep7)} className="sm:col-span-2" />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Phase" name="phase" value={step9.phase} onChange={f(setStep9)} placeholder="e.g., Phase 1, Phase 2" />
            <Input label="Month" name="month" value={step9.month} onChange={f(setStep9)} placeholder="e.g., Jan-26, Feb-26" />
            <Input label="Total (MWv)" name="totalMwv" type="number" value={step9.totalMwv} onChange={f(setStep9)} placeholder="Whole numbers only" />
            <Input label="IT Load (MWv)" name="itLoadMwv" type="number" value={step9.itLoadMwv} onChange={f(setStep9)} placeholder="Whole numbers only" />
            <Input label="Cumulative IT Load (MWv)" name="cumulativeItLoadMwv" type="number" value={step9.cumulativeItLoadMwv} onChange={f(setStep9)} placeholder="Whole numbers only" />
            <TextArea label="Scope of Works" name="scopeOfWorks" value={step9.scopeOfWorks} onChange={f(setStep9)} className="sm:col-span-2" />
            <Input label="Estimated Capex (M$)" name="estimatedCapexM" type="number" value={step9.estimatedCapexM} onChange={f(setStep9)} placeholder="Numeric value" />
            <Input label="Minimum Lease Duration (yrs)" name="minimumLeaseDurationYrs" type="number" value={step9.minimumLeaseDurationYrs} onChange={f(setStep9)} placeholder="Whole numbers only" />
            <Input label="MRC Request ($/kW)" name="mrcRequestKw" type="number" value={step9.mrcRequestKw} onChange={f(setStep9)} placeholder="Numeric value" />
            <Input label="Initial Deposit (M$)" name="initialDepositM" type="number" value={step9.initialDepositM} onChange={f(setStep9)} placeholder="Numeric value" />
            <Input label="MRC Request ($/kW/month)" name="mrcRequestKwMonth" type="number" value={step9.mrcRequestKwMonth} onChange={f(setStep9)} placeholder="Numeric value" />
            <TextArea label="Key revisions in FSRL" name="keyRevisions" value={step9.keyRevisions} onChange={f(setStep9)} className="sm:col-span-2" placeholder="Describe any key revisions or changes" />
          </div>
        );
      case 8:
        return (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Storage Rent (USD/sqm)" name="storageRentUsd" type="number" value={step8.storageRentUsd} onChange={f(setStep8)} />
            <Input label="Annual Escalation %" name="annualEscalationPct" type="number" value={step8.annualEscalationPct} onChange={f(setStep8)} />
            <Select label="Power Price Structure" name="powerPriceStructure" value={step8.powerPriceStructure} onChange={f(setStep8)} options={['', 'Fixed', 'Indexed', 'Pass-through', 'Blended'].map((o) => ({ value: o, label: o || 'Select...' }))} />
            <Input label="Avg Power Price (cents/kWh)" name="avgPowerPriceCents" type="number" step="0.01" value={step8.avgPowerPriceCents} onChange={f(setStep8)} />
            <Input label="Cross-Connect Pricing" name="crossConnectPricing" value={step8.crossConnectPricing} onChange={f(setStep8)} />
            <div className="flex gap-4 sm:col-span-2">
              <Checkbox label="Tax Incentives" name="taxIncentives" checked={step8.taxIncentives} onChange={f(setStep8)} />
              <Checkbox label="Insurance by DC" name="insuranceByDc" checked={step8.insuranceByDc} onChange={f(setStep8)} />
              <Checkbox label="Deposit Required" name="depositRequired" checked={step8.depositRequired} onChange={f(setStep8)} />
            </div>
            <TextArea label="Remarks" name="remarks" value={step8.remarks} onChange={f(setStep8)} className="sm:col-span-2" />
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)] text-sm">Review all your entered information. You can edit any field directly below. Review is optional — you can skip and submit directly.</p>

            {/* Company Details */}
            <Card>
              <h3 className="font-semibold mb-4">Company Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Legal Entity" value={step1.companyLegalEntity} onChange={(e) => setStep1({...step1, companyLegalEntity: e.target.value})} />
                <Input label="Office Address" value={step1.companyOfficeAddress} onChange={(e) => setStep1({...step1, companyOfficeAddress: e.target.value})} />
                <Input label="Country" value={step1.companyCountry} onChange={(e) => setStep1({...step1, companyCountry: e.target.value})} />
                <Input label="Contact Name" value={step1.contactName} onChange={(e) => setStep1({...step1, contactName: e.target.value})} />
                <Input label="Contact Mobile" value={step1.contactMobile} onChange={(e) => setStep1({...step1, contactMobile: e.target.value})} />
                <TextArea label="Other Details" value={step1.otherDetails} onChange={(e) => setStep1({...step1, otherDetails: e.target.value})} />
              </div>
            </Card>

            {/* Site Details */}
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

            {/* Capacity & Energy */}
            <Card>
              <h3 className="font-semibold mb-4">Capacity & Energy</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Current Energized MW" type="number" value={step3.currentEnergizedMw} onChange={(e) => setStep3({...step3, currentEnergizedMw: e.target.value})} />
                <Input label="Total IT Load MW" type="number" value={step3.totalItLoadMw} onChange={(e) => setStep3({...step3, totalItLoadMw: e.target.value})} />
                <Input label="Total Utility MVA" type="number" value={step3.totalUtilityMva} onChange={(e) => setStep3({...step3, totalUtilityMva: e.target.value})} />
                <Input label="Total White Space (sqm)" type="number" value={step3.totalWhiteSpaceSqm} onChange={(e) => setStep3({...step3, totalWhiteSpaceSqm: e.target.value})} />
              </div>
            </Card>

            {/* Power Infrastructure Summary */}
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

            {/* Commercial Terms Summary */}
            <Card>
              <h3 className="font-semibold mb-4">Commercial Terms</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Lease Term Options" value={step7.leaseTermOptions} onChange={(e) => setStep7({...step7, leaseTermOptions: e.target.value})} />
                <Input label="Payment Frequency" value={step7.paymentFrequency} onChange={(e) => setStep7({...step7, paymentFrequency: e.target.value})} />
                <Input label="Tax/VAT Treatment" value={step7.taxVatTreatment} onChange={(e) => setStep7({...step7, taxVatTreatment: e.target.value})} />
                <Input label="Avg Power Price (cents/kWh)" type="number" value={step7.powerPriceCurrentUsd} onChange={(e) => setStep7({...step7, powerPriceCurrentUsd: e.target.value})} />
              </div>
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
            <Button onClick={next}>Save & Continue</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={back}>Back to Previous</Button>
              <Button onClick={submit} loading={submitting} disabled={!appId}>Submit Listing</Button>
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
