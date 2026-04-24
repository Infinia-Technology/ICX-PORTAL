import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import Stepper from '../../components/ui/Stepper';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import LocationInput from '../../components/ui/LocationInput';
import { useAutoSave } from '../../hooks/useAutoSave';
import AutoSaveIndicator from '../../components/ui/AutoSaveIndicator';
import DuplicateWarningModal from '../../components/ui/DuplicateWarningModal';
import InfoIcon from '../../components/ui/InfoIcon';

const STEPS = ['Basic Info', 'Compute Node', 'Compute Network', 'Management Network', 'Other', 'Cluster Description', 'Cluster Configuration', 'Extended Information', 'Review & Submit'];

export default function GpuClusterNewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [step, setStep] = useState(Number(searchParams.get('step')) || 0);
  const [clusterId, setClusterId] = useState(searchParams.get('id') || null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(!!searchParams.get('id'));
  const [duplicateModal, setDuplicateModal] = useState({ open: false, duplicates: [], hasDuplicates: false });

  const [s1, setS1] = useState({ vendorName: '', location: '', country: '', gpuTechnology: '', googleMapsLink: '', dcLandlord: '', totalGpuCount: '', singleClusterSize: '', availabilityDate: '', notes: '', restrictedUse: '' });
  const [s2, setS2] = useState({ gpuServerModel: '', cpu: '', gpu: '', ram: '', localStorage: '', nics: '' });
  const [s3, setS3] = useState({ computeNetTopology: '', computeNetTechnology: '', computeNetSwitchVendor: '', computeNetLayers: '', computeNetOversubscription: '', computeNetScalability: '', computeNetQos: '' });
  const [s4, setS4] = useState({ mgmtNetTopology: '', mgmtNetTechnology: '', mgmtNetLayers: '', mgmtNetSwitchVendor: '', mgmtNetOversubscription: '', mgmtNetScalability: '' });
  const [s5, setS5] = useState({ oobNetTechnology: '', storageOptions: '', connectivityDetails: '' });
  const [s6, setS6] = useState({ clusterDescription: '' });
  const [s7, setS7] = useState({ redundancy: '', failover: '', clusterName: '', clusterIdentifier: '' });
  const [s8, setS8] = useState({ powerSupplyStatus: '', rackPowerCapacityKw: '', modularDataHalls: '', totalPowerCapacityMw: '', powerCapacityPerFloor: '', modularDataHallLayoutPerFloor: '', futureExpansionCapability: '', dualFeedRedundant: '', upsConfiguration: '', backupGenerators: '', coolingDesign: '', numberOfCoolingUnits: '', coolingCapacityKw: '', rackModuleLayout: '' });

  // Reload draft data on mount if id exists in URL
  useEffect(() => {
    const draftId = searchParams.get('id');
    if (!draftId) return;
    api.get(`/gpu-clusters/${draftId}`)
      .then((r) => {
        const c = r.data;
        setS1({ vendorName: c.vendorName || '', location: c.location || '', country: c.country || '', gpuTechnology: c.gpuTechnology || '', googleMapsLink: c.googleMapsLink || '', dcLandlord: c.dcLandlord || '', totalGpuCount: c.totalGpuCount ?? '', singleClusterSize: c.singleClusterSize ?? '', availabilityDate: c.availabilityDate ? c.availabilityDate.slice(0, 10) : '', notes: c.notes || '', restrictedUse: c.restrictedUse || '' });
        setS2({ gpuServerModel: c.gpuServerModel || '', cpu: c.cpu || '', gpu: c.gpu || '', ram: c.ram || '', localStorage: c.localStorage || '', nics: c.nics || '' });
        setS3({ computeNetTopology: c.computeNetTopology || '', computeNetTechnology: c.computeNetTechnology || '', computeNetSwitchVendor: c.computeNetSwitchVendor || '', computeNetLayers: c.computeNetLayers || '', computeNetOversubscription: c.computeNetOversubscription || '', computeNetScalability: c.computeNetScalability || '', computeNetQos: c.computeNetQos || '' });
        setS4({ mgmtNetTopology: c.mgmtNetTopology || '', mgmtNetTechnology: c.mgmtNetTechnology || '', mgmtNetLayers: c.mgmtNetLayers ?? '', mgmtNetSwitchVendor: c.mgmtNetSwitchVendor || '', mgmtNetOversubscription: c.mgmtNetOversubscription || '', mgmtNetScalability: c.mgmtNetScalability || '' });
        setS5({ oobNetTechnology: c.oobNetTechnology || '', storageOptions: c.storageOptions || '', connectivityDetails: c.connectivityDetails || '' });
        setS6({ clusterDescription: c.clusterDescription || '' });
        setS7({ redundancy: c.redundancy || '', failover: c.failover || '', clusterName: c.clusterName || '', clusterIdentifier: c.clusterIdentifier || '' });
        setS8({ powerSupplyStatus: c.powerSupplyStatus || '', rackPowerCapacityKw: c.rackPowerCapacityKw ?? '', modularDataHalls: c.modularDataHalls ?? '', totalPowerCapacityMw: c.totalPowerCapacityMw ?? '', powerCapacityPerFloor: c.powerCapacityPerFloor ?? '', modularDataHallLayoutPerFloor: c.modularDataHallLayoutPerFloor || '', futureExpansionCapability: c.futureExpansionCapability || '', dualFeedRedundant: c.dualFeedRedundant || '', upsConfiguration: c.upsConfiguration || '', backupGenerators: c.backupGenerators || '', coolingDesign: c.coolingDesign || '', numberOfCoolingUnits: c.numberOfCoolingUnits ?? '', coolingCapacityKw: c.coolingCapacityKw ?? '', rackModuleLayout: c.rackModuleLayout || '' });
      })
      .catch(() => addToast({ type: 'error', message: 'Failed to load draft' }))
      .finally(() => setLoadingDraft(false));
  }, []);

  const updateUrl = (newId, newStep) => {
    const params = {};
    if (newId || clusterId) params.id = newId || clusterId;
    if (newStep !== undefined) params.step = newStep;
    setSearchParams(params, { replace: true });
  };

  // Auto-save current step's data only
  const gpuStepMap = { 0: s1, 1: s2, 2: s3, 3: s4, 4: s5, 5: s6, 6: s7, 7: s8 };
  const currentStepData = gpuStepMap[step] || null;
  const { status: autoSaveStatus } = useAutoSave(
    clusterId ? `/gpu-clusters/${clusterId}` : null,
    currentStepData,
    { enabled: !!clusterId && step < 8 }
  );

  const f = (setter) => (e) => {
    setter((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => { const { [e.target.name]: _, ...rest } = prev; return rest; });
  };

  const saveCluster = async (data) => {
    console.log('[GPU] saveCluster called, clusterId:', clusterId, 'data keys:', Object.keys(data));
    try {
      if (!clusterId) {
        const res = await api.post('/gpu-clusters', data);
        console.log('[GPU] POST /gpu-clusters response:', res.data);
        const newId = res.data._id || res.data.id;
        setClusterId(newId);
        return newId;
      } else {
        const res = await api.put(`/gpu-clusters/${clusterId}`, data);
        console.log('[GPU] PUT /gpu-clusters response:', res.data);
        return clusterId;
      }
    } catch (err) {
      console.error('[GPU] saveCluster error:', err.response?.status, err.response?.data || err.message);
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save' });
      return null;
    }
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

  const getStepErrors = (stepNum) => {
    const errs = {};
    const check = (data, fields) => {
      for (const [key, label] of fields) {
        const val = data[key];
        if (val === undefined || val === null || String(val).trim() === '') errs[key] = `${label} is required`;
      }
    };
    if (stepNum === 0) check(s1, [['vendorName','Vendor Name'],['location','Location'],['country','Country'],['gpuTechnology','GPU Technology'],['googleMapsLink','Google Maps Link'],['dcLandlord','DC Landlord'],['totalGpuCount','Total GPU Count'],['singleClusterSize','Single Cluster Size'],['availabilityDate','Availability Date (RFS)'],['restrictedUse','Restricted Use']]);
    if (stepNum === 1) check(s2, [['gpuServerModel','GPU Server Model'],['cpu','CPU'],['gpu','GPU'],['ram','RAM'],['localStorage','Local Storage'],['nics','NICs']]);
    if (stepNum === 2) check(s3, [['computeNetTopology','Topology'],['computeNetTechnology','Technology'],['computeNetSwitchVendor','Switch Vendor'],['computeNetLayers','Number of Network Layers'],['computeNetOversubscription','Oversubscription Ratio'],['computeNetScalability','Scalability Plan'],['computeNetQos','QoS Configuration']]);
    if (stepNum === 3) check(s4, [['mgmtNetTopology','Topology'],['mgmtNetTechnology','Technology'],['mgmtNetLayers','Number of Network Layers'],['mgmtNetSwitchVendor','Switch Vendor'],['mgmtNetOversubscription','Oversubscription Ratio'],['mgmtNetScalability','Scalability Plan']]);
    if (stepNum === 4) check(s5, [['oobNetTechnology','OOB Network Technology'],['storageOptions','Storage'],['connectivityDetails','Connectivity']]);
    if (stepNum === 5) check(s6, [['clusterDescription','Cluster Description']]);
    if (stepNum === 6) check(s7, [['clusterName','Cluster Name'],['clusterIdentifier','Cluster Identifier'],['redundancy','Redundancy'],['failover','Failover']]);
    if (stepNum === 7) check(s8, [['powerSupplyStatus','Power supply status'],['rackPowerCapacityKw','Rack power capacity'],['modularDataHalls','Modular data halls'],['totalPowerCapacityMw','Total power capacity'],['powerCapacityPerFloor','Power capacity per floor'],['modularDataHallLayoutPerFloor','Data hall layout'],['futureExpansionCapability','Future expansion'],['dualFeedRedundant','Dual-feed redundant'],['upsConfiguration','UPS configuration'],['backupGenerators','Backup generators'],['coolingDesign','Cooling design'],['numberOfCoolingUnits','Cooling units'],['coolingCapacityKw','Cooling capacity'],['rackModuleLayout','Rack & Module Layout']]);
    return errs;
  };

  const next = async () => {
    if (saving) return;

    setSaveError(null);

    const stepErrors = getStepErrors(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const firstErrorKey = Object.keys(stepErrors)[0];
      const el = document.querySelector(`[name="${firstErrorKey}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    setSaving(true);
    const stepDataMap = { 0: s1, 1: s2, 2: s3, 3: s4, 4: s5, 5: s6, 6: s7, 7: s8 };
    const data = stepDataMap[step] ? { ...stepDataMap[step] } : {};
    try {
      const id = await saveCluster(data);
      if (id) {
        const nextStep = Math.min(step + 1, STEPS.length - 1);
        setStep(nextStep);
        setErrors({});
        setSaveError(null);
        setSearchParams({ id, step: nextStep }, { replace: true });
      } else {
        setSaveError('Failed to save. Please check your connection and try again.');
      }
    } catch {
      setSaveError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submit = async (force = false) => {
    // Validate all required fields before submitting
    const allRequired = [
      [s1, [['vendorName','Vendor Name'],['location','Location'],['country','Country'],['gpuTechnology','GPU Technology'],['googleMapsLink','Google Maps Link'],['dcLandlord','DC Landlord'],['totalGpuCount','Total GPU Count'],['singleClusterSize','Single Cluster Size'],['availabilityDate','Availability Date (RFS)'],['restrictedUse','Restricted Use']]],
      [s2, [['gpuServerModel','GPU Server Model'],['cpu','CPU'],['gpu','GPU'],['ram','RAM'],['localStorage','Local Storage'],['nics','NICs']]],
      [s3, [['computeNetTopology','Topology'],['computeNetTechnology','Technology'],['computeNetSwitchVendor','Switch Vendor'],['computeNetLayers','Number of Network Layers'],['computeNetOversubscription','Oversubscription Ratio'],['computeNetScalability','Scalability Plan'],['computeNetQos','QoS Configuration']]],
      [s4, [['mgmtNetTopology','Topology'],['mgmtNetTechnology','Technology'],['mgmtNetLayers','Number of Network Layers'],['mgmtNetSwitchVendor','Switch Vendor'],['mgmtNetOversubscription','Oversubscription Ratio'],['mgmtNetScalability','Scalability Plan']]],
      [s5, [['oobNetTechnology','OOB Network Technology'],['storageOptions','Storage'],['connectivityDetails','Connectivity']]],
      [s6, [['clusterDescription','Cluster Description']]],
      [s7, [['clusterName','Cluster Name'],['clusterIdentifier','Cluster Identifier'],['redundancy','Redundancy'],['failover','Failover']]],
      [s8, [['powerSupplyStatus','Power supply status'],['rackPowerCapacityKw','Rack power capacity'],['modularDataHalls','Modular data halls'],['totalPowerCapacityMw','Total power capacity'],['powerCapacityPerFloor','Power capacity per floor'],['modularDataHallLayoutPerFloor','Data hall layout'],['futureExpansionCapability','Future expansion'],['dualFeedRedundant','Dual-feed redundant'],['upsConfiguration','UPS configuration'],['backupGenerators','Backup generators'],['coolingDesign','Cooling design'],['numberOfCoolingUnits','Cooling units'],['coolingCapacityKw','Cooling capacity'],['rackModuleLayout','Rack & Module Layout']]],
    ];
    for (const [data, fields] of allRequired) {
      const missing = validateRequired(data, fields);
      if (missing) {
        addToast({ type: 'error', message: `${missing} is required before submitting` });
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/gpu-clusters/${clusterId}/submit`, { force });

      // If duplicates found, show modal instead of submitting
      if (res.data.hasDuplicates) {
        setDuplicateModal({ open: true, duplicates: res.data.duplicates, hasDuplicates: true });
        setSubmitting(false);
        return;
      }

      addToast({ type: 'success', message: 'GPU capacity listing submitted successfully! Our team will review it shortly.' });
      navigate(isAdmin ? '/admin/gpu-clusters' : '/supplier/gpu-clusters');
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
      case 0: return (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Vendor Name *</label>
              <InfoIcon text="The vendor or company providing this GPU cluster. Used for duplicate detection." placement="top" />
            </div>
            <Input name="vendorName" value={s1.vendorName} onChange={f(setS1)} error={errors.vendorName} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Location *</label>
              <InfoIcon text="City or region where the cluster is located. Used for duplicate detection." placement="top" />
            </div>
            <Input name="location" value={s1.location} onChange={f(setS1)} error={errors.location} />
          </div>
          <Input label="Country *" name="country" value={s1.country} onChange={f(setS1)} error={errors.country} />
          <Input label="GPU Technology *" name="gpuTechnology" value={s1.gpuTechnology} onChange={f(setS1)} error={errors.gpuTechnology} />
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Google Maps Link *</label>
              <InfoIcon text="Precise location coordinates for GPS-based duplicate detection (50-100m radius)." placement="top" />
            </div>
            <LocationInput name="googleMapsLink" value={s1.googleMapsLink} onChange={f(setS1)} error={errors.googleMapsLink} />
          </div>
          <Input label="DC Landlord *" name="dcLandlord" value={s1.dcLandlord} onChange={f(setS1)} error={errors.dcLandlord} />
          <Input label="Total GPU Count *" name="totalGpuCount" type="number" value={s1.totalGpuCount} onChange={f(setS1)} error={errors.totalGpuCount} />
          <Input label="Single Cluster Size (n. of GPUs) *" name="singleClusterSize" type="number" value={s1.singleClusterSize} onChange={f(setS1)} error={errors.singleClusterSize} />
          <Input label="Availability Date (RFS) *" name="availabilityDate" type="date" value={s1.availabilityDate} onChange={f(setS1)} error={errors.availabilityDate} />
          <Input label="Restricted Use *" name="restrictedUse" value={s1.restrictedUse} onChange={f(setS1)} error={errors.restrictedUse} />
          <TextArea label="Notes" name="notes" value={s1.notes} onChange={f(setS1)} className="sm:col-span-2" placeholder="e.g. contract length" />
        </div>
      );
      case 1: return (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="GPU Server Model *" name="gpuServerModel" value={s2.gpuServerModel} onChange={f(setS2)} error={errors.gpuServerModel} />
          <Input label="CPU *" name="cpu" value={s2.cpu} onChange={f(setS2)} error={errors.cpu} />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">GPU *</label>
              <InfoIcon text="GPU model/type (e.g., A100, H100). Used for duplicate detection." placement="top" />
            </div>
            <Input name="gpu" value={s2.gpu} onChange={f(setS2)} error={errors.gpu} />
          </div>
          <Input label="RAM *" name="ram" value={s2.ram} onChange={f(setS2)} error={errors.ram} />
          <Input label="Local Storage *" name="localStorage" value={s2.localStorage} onChange={f(setS2)} error={errors.localStorage} />
          <Input label="NICs *" name="nics" value={s2.nics} onChange={f(setS2)} error={errors.nics} />
        </div>
      );
      case 2: return (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Compute Network (Back-End, aka East-West)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Topology *" name="computeNetTopology" value={s3.computeNetTopology} onChange={f(setS3)} error={errors.computeNetTopology} />
              <Input label="Technology *" name="computeNetTechnology" value={s3.computeNetTechnology} onChange={f(setS3)} error={errors.computeNetTechnology} />
              <Input label="Switch vendor *" name="computeNetSwitchVendor" value={s3.computeNetSwitchVendor} onChange={f(setS3)} error={errors.computeNetSwitchVendor} />
              <Input label="Number of network layers (e.g., spine-leaf architecture) *" name="computeNetLayers" value={s3.computeNetLayers} onChange={f(setS3)} error={errors.computeNetLayers} />
              <Input label="Oversubscription ratio *" name="computeNetOversubscription" value={s3.computeNetOversubscription} onChange={f(setS3)} error={errors.computeNetOversubscription} />
              <Input label="Scalability plan for future expansion *" name="computeNetScalability" value={s3.computeNetScalability} onChange={f(setS3)} error={errors.computeNetScalability} />
              <Input label="QoS configuration *" name="computeNetQos" value={s3.computeNetQos} onChange={f(setS3)} className="sm:col-span-2" error={errors.computeNetQos} />
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Management Network (Front-End, aka North-South)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Topology *" name="mgmtNetTopology" value={s4.mgmtNetTopology} onChange={f(setS4)} error={errors.mgmtNetTopology} />
              <Input label="Technology *" name="mgmtNetTechnology" value={s4.mgmtNetTechnology} onChange={f(setS4)} error={errors.mgmtNetTechnology} />
              <Input label="Number of network layers *" name="mgmtNetLayers" type="number" value={s4.mgmtNetLayers} onChange={f(setS4)} error={errors.mgmtNetLayers} />
              <Input label="Switch vendor *" name="mgmtNetSwitchVendor" value={s4.mgmtNetSwitchVendor} onChange={f(setS4)} error={errors.mgmtNetSwitchVendor} />
              <Input label="Oversubscription ratio *" name="mgmtNetOversubscription" value={s4.mgmtNetOversubscription} onChange={f(setS4)} error={errors.mgmtNetOversubscription} />
              <Input label="Scalability plan for future expansion *" name="mgmtNetScalability" value={s4.mgmtNetScalability} onChange={f(setS4)} error={errors.mgmtNetScalability} />
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Out-of-Band (OOB) Network Technology *" name="oobNetTechnology" value={s5.oobNetTechnology} onChange={f(setS5)} placeholder="e.g. Ethernet 1G" className="sm:col-span-2" error={errors.oobNetTechnology} />
          <TextArea label="Storage *" name="storageOptions" value={s5.storageOptions} onChange={f(setS5)} className="sm:col-span-2" placeholder="Please provide detailed storage options available, including vendor name, speed, max capacity" error={errors.storageOptions} />
          <TextArea label="Connectivity *" name="connectivityDetails" value={s5.connectivityDetails} onChange={f(setS5)} className="sm:col-span-2" placeholder="Please provide detailed connectivity information (bandwidth, redundancy, links, etc.)" error={errors.connectivityDetails} />
        </div>
      );
      case 5: return (
        <TextArea label="Cluster description *" name="clusterDescription" value={s6.clusterDescription} onChange={f(setS6)} rows={8} placeholder="Please provide description of the cluster and all available documentation (ie. Security, compliance)" error={errors.clusterDescription} />
      );
      case 6: return (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Other</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Cluster Name *" name="clusterName" value={s7.clusterName} onChange={f(setS7)} error={errors.clusterName} />
              <Input label="Cluster Identifier *" name="clusterIdentifier" value={s7.clusterIdentifier} onChange={f(setS7)} error={errors.clusterIdentifier} />
              <Input label="Redundancy *" name="redundancy" value={s7.redundancy} onChange={f(setS7)} className="sm:col-span-2" error={errors.redundancy} />
              <Input label="Failover *" name="failover" value={s7.failover} onChange={f(setS7)} className="sm:col-span-2" error={errors.failover} />
            </div>
          </div>
        </div>
      );
      case 7: return (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Power Supply</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Power supply status of the data center *" name="powerSupplyStatus" value={s8.powerSupplyStatus} onChange={f(setS8)} className="sm:col-span-2" error={errors.powerSupplyStatus} />
              <Input label="Rack power capacity (xx kW per rack) *" name="rackPowerCapacityKw" type="number" value={s8.rackPowerCapacityKw} onChange={f(setS8)} error={errors.rackPowerCapacityKw} />
              <Input label="Number of modular data halls *" name="modularDataHalls" type="number" value={s8.modularDataHalls} onChange={f(setS8)} error={errors.modularDataHalls} />
              <Input label="Total power capacity (xx MW) - IT Load *" name="totalPowerCapacityMw" type="number" value={s8.totalPowerCapacityMw} onChange={f(setS8)} error={errors.totalPowerCapacityMw} />
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Floor Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Power capacity per floor *" name="powerCapacityPerFloor" type="number" value={s8.powerCapacityPerFloor} onChange={f(setS8)} error={errors.powerCapacityPerFloor} />
              <Input label="Modular data hall layout per floor *" name="modularDataHallLayoutPerFloor" value={s8.modularDataHallLayoutPerFloor} onChange={f(setS8)} error={errors.modularDataHallLayoutPerFloor} />
              <TextArea label="Future expansion capability (additional power and space) *" name="futureExpansionCapability" value={s8.futureExpansionCapability} onChange={f(setS8)} className="sm:col-span-2" error={errors.futureExpansionCapability} />
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Power Redundancy and Backup</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Dual-feed redundant power supply? *" name="dualFeedRedundant" value={s8.dualFeedRedundant} onChange={f(setS8)} placeholder="e.g. Yes / No" error={errors.dualFeedRedundant} />
              <Input label="UPS configuration *" name="upsConfiguration" value={s8.upsConfiguration} onChange={f(setS8)} error={errors.upsConfiguration} />
              <TextArea label="Number and capacity of on-site backup generators *" name="backupGenerators" value={s8.backupGenerators} onChange={f(setS8)} className="sm:col-span-2" error={errors.backupGenerators} />
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">HVAC (Heating, Ventilation, and Air Conditioning)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextArea label="Cooling system design (e.g., chilled water, direct expansion, etc.) *" name="coolingDesign" value={s8.coolingDesign} onChange={f(setS8)} className="sm:col-span-2" error={errors.coolingDesign} />
              <Input label="Number of cooling units *" name="numberOfCoolingUnits" type="number" value={s8.numberOfCoolingUnits} onChange={f(setS8)} error={errors.numberOfCoolingUnits} />
              <Input label="Cooling capacity (in kW or tons) *" name="coolingCapacityKw" value={s8.coolingCapacityKw} onChange={f(setS8)} error={errors.coolingCapacityKw} />
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Rack & Module Layout</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextArea label="Floor plans for each data hall showing rack and module arrangements *" name="rackModuleLayout" value={s8.rackModuleLayout} onChange={f(setS8)} className="sm:col-span-2" error={errors.rackModuleLayout} />
            </div>
          </div>
        </div>
      );
      case 8: return (
        <div className="space-y-4">
          <p className="text-gray-500">Review and submit your GPU capacity listing.</p>
          <Card>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-400 text-xs">Vendor</dt><dd>{s1.vendorName}</dd></div>
              <div><dt className="text-gray-400 text-xs">Technology</dt><dd>{s1.gpuTechnology}</dd></div>
              <div><dt className="text-gray-400 text-xs">Cluster Size</dt><dd>{s1.singleClusterSize} GPUs</dd></div>
              <div><dt className="text-gray-400 text-xs">Location</dt><dd>{s1.location}, {s1.country}</dd></div>
            </dl>
          </Card>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6">New GPU Capacity Listing</h1>
        <Stepper steps={STEPS} currentStep={step} />
      </div>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{STEPS[step]}</h2>
          <AutoSaveIndicator status={autoSaveStatus} />
        </div>
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-700">Please fill in all required fields before continuing:</p>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {Object.values(errors).map((msg, i) => (
                <li key={i} className="text-sm text-red-600">{msg}</li>
              ))}
            </ul>
          </div>
        )}
        {saveError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}
        {renderStep()}
      </Card>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => { const p = Math.max(step - 1, 0); setStep(p); setErrors({}); setSaveError(null); updateUrl(null, p); }} disabled={step === 0}>Back</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} loading={saving} disabled={saving}>Save & Continue</Button>
        ) : (
          <Button onClick={() => submit()} loading={submitting} disabled={!clusterId}>Submit Listing</Button>
        )}
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
