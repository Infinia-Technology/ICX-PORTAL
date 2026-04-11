import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const STEPS = ['Basic Info', 'Compute Node', 'Compute Network', 'Management Network', 'OOB & Storage', 'Cluster Description', 'Power & Facility', 'Review & Submit'];

export default function GpuClusterNewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [step, setStep] = useState(Number(searchParams.get('step')) || 0);
  const [clusterId, setClusterId] = useState(searchParams.get('id') || null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!searchParams.get('id'));
  const [duplicateModal, setDuplicateModal] = useState({ open: false, duplicates: [], hasDuplicates: false });

  const [s1, setS1] = useState({ vendorName: '', location: '', country: '', gpuTechnology: '', googleMapsLink: '', dcLandlord: '', totalGpuCount: '', singleClusterSize: '', availabilityDate: '', notes: '', restrictedUse: '' });
  const [s2, setS2] = useState({ gpuServerModel: '', cpu: '', gpu: '', ram: '', localStorage: '', nics: '' });
  const [s3, setS3] = useState({ computeNetTopology: '', computeNetTechnology: '', computeNetSwitchVendor: '', computeNetLayers: '', computeNetOversubscription: '', computeNetScalability: '', computeNetQos: '' });
  const [s4, setS4] = useState({ mgmtNetTopology: '', mgmtNetTechnology: '', mgmtNetLayers: '', mgmtNetSwitchVendor: '', mgmtNetOversubscription: '', mgmtNetScalability: '' });
  const [s5, setS5] = useState({ oobNetTechnology: '', storageOptions: '', connectivityDetails: '' });
  const [s6, setS6] = useState({ clusterDescription: '' });
  const [s7, setS7] = useState({ powerSupplyStatus: '', rackPowerCapacityKw: '', modularDataHalls: '', totalPowerCapacityMw: '', coolingDesign: '', backupGenerators: '' });

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
        setS7({ powerSupplyStatus: c.powerSupplyStatus || '', rackPowerCapacityKw: c.rackPowerCapacityKw ?? '', modularDataHalls: c.modularDataHalls ?? '', totalPowerCapacityMw: c.totalPowerCapacityMw ?? '', coolingDesign: c.coolingDesign || '', backupGenerators: c.backupGenerators || '' });
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
  const gpuStepMap = { 0: s1, 1: s2, 2: s3, 3: s4, 4: s5, 5: s6, 6: s7 };
  const currentStepData = gpuStepMap[step] || null;
  const { status: autoSaveStatus } = useAutoSave(
    clusterId ? `/gpu-clusters/${clusterId}` : null,
    currentStepData,
    { enabled: !!clusterId && step < 7 }
  );

  const f = (setter) => (e) => setter((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveCluster = async (data) => {
    try {
      if (!clusterId) {
        const res = await api.post('/gpu-clusters', data);
        setClusterId(res.data._id);
        updateUrl(res.data._id, 1);
      } else {
        await api.put(`/gpu-clusters/${clusterId}`, data);
      }
      return true;
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save' });
      return false;
    }
  };

  const next = async () => {
    let data = {};
    if (step === 0) {
      if (!s1.vendorName) {
        addToast({ type: 'error', message: 'Vendor name is required' });
        return;
      }
      data = { ...s1 };
    } else if (step === 1) data = { ...s2 };
    else if (step === 2) data = { ...s3 };
    else if (step === 3) data = { ...s4 };
    else if (step === 4) data = { ...s5 };
    else if (step === 5) data = { ...s6 };
    else if (step === 6) data = { ...s7 };

    const ok = await saveCluster(data);
    if (ok) {
      const nextStep = Math.min(step + 1, STEPS.length - 1);
      setStep(nextStep);
      updateUrl(null, nextStep);
    }
  };

  const submit = async (force = false) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/gpu-clusters/${clusterId}/submit`, { force });

      // If duplicates found, show modal instead of submitting
      if (res.data.hasDuplicates) {
        setDuplicateModal({ open: true, duplicates: res.data.duplicates, hasDuplicates: true });
        setSubmitting(false);
        return;
      }

      addToast({ type: 'success', message: 'GPU listing submitted for review!' });
      navigate('/supplier/gpu-clusters');
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
            <Input name="vendorName" value={s1.vendorName} onChange={f(setS1)} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Location *</label>
              <InfoIcon text="City or region where the cluster is located. Used for duplicate detection." placement="top" />
            </div>
            <Input name="location" value={s1.location} onChange={f(setS1)} />
          </div>
          <Input label="Country *" name="country" value={s1.country} onChange={f(setS1)} />
          <Input label="GPU Technology *" name="gpuTechnology" value={s1.gpuTechnology} onChange={f(setS1)} />
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Google Maps Link *</label>
              <InfoIcon text="Precise location coordinates for GPS-based duplicate detection (50-100m radius)." placement="top" />
            </div>
            <LocationInput name="googleMapsLink" value={s1.googleMapsLink} onChange={f(setS1)} />
          </div>
          <Input label="DC Landlord" name="dcLandlord" value={s1.dcLandlord} onChange={f(setS1)} />
          <Input label="Total GPU Count" name="totalGpuCount" type="number" value={s1.totalGpuCount} onChange={f(setS1)} />
          <Input label="Single Cluster Size (GPUs) *" name="singleClusterSize" type="number" value={s1.singleClusterSize} onChange={f(setS1)} />
          <Input label="Availability Date *" name="availabilityDate" type="date" value={s1.availabilityDate} onChange={f(setS1)} />
          <Input label="Restricted Use" name="restrictedUse" value={s1.restrictedUse} onChange={f(setS1)} />
          <TextArea label="Notes *" name="notes" value={s1.notes} onChange={f(setS1)} className="sm:col-span-2" />
        </div>
      );
      case 1: return (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="GPU Server Model *" name="gpuServerModel" value={s2.gpuServerModel} onChange={f(setS2)} />
          <Input label="CPU" name="cpu" value={s2.cpu} onChange={f(setS2)} />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">GPU</label>
              <InfoIcon text="GPU model/type (e.g., A100, H100). Used for duplicate detection." placement="top" />
            </div>
            <Input name="gpu" value={s2.gpu} onChange={f(setS2)} />
          </div>
          <Input label="RAM" name="ram" value={s2.ram} onChange={f(setS2)} />
          <Input label="Local Storage *" name="localStorage" value={s2.localStorage} onChange={f(setS2)} />
          <Input label="NICs" name="nics" value={s2.nics} onChange={f(setS2)} />
        </div>
      );
      case 2: return (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Network Topology" name="computeNetTopology" value={s3.computeNetTopology} onChange={f(setS3)} />
          <Input label="Network Technology *" name="computeNetTechnology" value={s3.computeNetTechnology} onChange={f(setS3)} />
          <Input label="Switch Vendor" name="computeNetSwitchVendor" value={s3.computeNetSwitchVendor} onChange={f(setS3)} />
          <Input label="Layers" name="computeNetLayers" value={s3.computeNetLayers} onChange={f(setS3)} />
          <Input label="Oversubscription" name="computeNetOversubscription" value={s3.computeNetOversubscription} onChange={f(setS3)} />
          <Input label="Scalability" name="computeNetScalability" value={s3.computeNetScalability} onChange={f(setS3)} />
          <Input label="QoS" name="computeNetQos" value={s3.computeNetQos} onChange={f(setS3)} />
        </div>
      );
      case 3: return (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Topology" name="mgmtNetTopology" value={s4.mgmtNetTopology} onChange={f(setS4)} />
          <Input label="Technology" name="mgmtNetTechnology" value={s4.mgmtNetTechnology} onChange={f(setS4)} />
          <Input label="Layers" name="mgmtNetLayers" type="number" value={s4.mgmtNetLayers} onChange={f(setS4)} />
          <Input label="Switch Vendor" name="mgmtNetSwitchVendor" value={s4.mgmtNetSwitchVendor} onChange={f(setS4)} />
          <Input label="Oversubscription" name="mgmtNetOversubscription" value={s4.mgmtNetOversubscription} onChange={f(setS4)} />
          <Input label="Scalability" name="mgmtNetScalability" value={s4.mgmtNetScalability} onChange={f(setS4)} />
        </div>
      );
      case 4: return (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="OOB Network Technology" name="oobNetTechnology" value={s5.oobNetTechnology} onChange={f(setS5)} />
          <TextArea label="Storage Options" name="storageOptions" value={s5.storageOptions} onChange={f(setS5)} className="sm:col-span-2" />
          <TextArea label="Connectivity Details" name="connectivityDetails" value={s5.connectivityDetails} onChange={f(setS5)} className="sm:col-span-2" />
        </div>
      );
      case 5: return (
        <TextArea label="Cluster Description" name="clusterDescription" value={s6.clusterDescription} onChange={f(setS6)} rows={8} />
      );
      case 6: return (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Power Supply Status" name="powerSupplyStatus" value={s7.powerSupplyStatus} onChange={f(setS7)} />
          <Input label="Rack Power Capacity (kW)" name="rackPowerCapacityKw" type="number" value={s7.rackPowerCapacityKw} onChange={f(setS7)} />
          <Input label="Modular Data Halls" name="modularDataHalls" type="number" value={s7.modularDataHalls} onChange={f(setS7)} />
          <Input label="Total Power Capacity (MW)" name="totalPowerCapacityMw" type="number" value={s7.totalPowerCapacityMw} onChange={f(setS7)} />
          <Input label="Cooling Design" name="coolingDesign" value={s7.coolingDesign} onChange={f(setS7)} />
          <Input label="Backup Generators" name="backupGenerators" value={s7.backupGenerators} onChange={f(setS7)} />
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <p className="text-gray-500">Review and submit your GPU listing.</p>
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
        <h1 className="text-2xl font-bold mb-6">New GPU Listing</h1>
        <Stepper steps={STEPS} currentStep={step} />
      </div>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{STEPS[step]}</h2>
          <AutoSaveIndicator status={autoSaveStatus} />
        </div>
        {renderStep()}
      </Card>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => { const p = Math.max(step - 1, 0); setStep(p); updateUrl(null, p); }} disabled={step === 0}>Back</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>Save & Continue</Button>
        ) : (
          <Button onClick={submit} loading={submitting} disabled={!clusterId}>Submit Listing</Button>
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
