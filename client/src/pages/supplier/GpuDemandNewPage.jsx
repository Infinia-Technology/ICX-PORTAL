import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import TextArea from '../../components/ui/TextArea';
import { useToast } from '../../components/ui/Toast';

const EMPTY_FORM = {
  customer: '',
  dateOfEntry: '',
  customerCountry: '',
  typeOfTechnology: '',
  contractLengthYears: '',
  clusterSizeGpu: '',
  idealClusterLocation: '',
  exportConstraints: '',
  timelineForGoLive: '',
  connectivityMbps: '',
  latencyMs: '',
  interconnectivity: '',
  dcTierMinimum: '',
  redundancyUptimeRequirements: '',
  targetPriceGpuHUsd: '',
  decisionMaker: '',
  procurementStage: '',
  otherComments: '',
};

const DC_TIER_OPTIONS = ['', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'].map((o) => ({ value: o, label: o || 'Select...' }));

export default function GpuDemandNewPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    const required = [
      { key: 'customer', label: 'Customer' },
      { key: 'dateOfEntry', label: 'Date of Entry' },
      { key: 'customerCountry', label: 'Customer Country' },
      { key: 'typeOfTechnology', label: 'Type of Technology' },
      { key: 'contractLengthYears', label: 'Contract Length' },
      { key: 'clusterSizeGpu', label: 'Cluster Size GPU #' },
      { key: 'timelineForGoLive', label: 'Timeline for Go Live' },
    ];
    for (const { key, label } of required) {
      if (!form[key]?.trim()) {
        addToast({ type: 'error', message: `${label} is required` });
        return false;
      }
    }
    return true;
  };

  const submit = async (asDraft = false) => {
    if (!asDraft && !validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/gpu-demands', form);
      if (!asDraft) await api.post(`/gpu-demands/${res.data._id}/submit`);
      addToast({ type: 'success', message: asDraft ? 'Saved as draft' : 'GPU request submitted!' });
      navigate('/supplier/gpu-demands');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Submit GPU Request</h1>
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Client Identity</h3>
          </div>
          <Input label="Customer *" name="customer" value={form.customer} onChange={update} placeholder="Company / entity name" />
          <Input label="Date of Entry *" name="dateOfEntry" type="date" value={form.dateOfEntry} onChange={update} />
          <Input label="Customer Country *" name="customerCountry" value={form.customerCountry} onChange={update} />

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 mt-2">Technical Requirements</h3>
          </div>
          <Input label="Type of Technology *" name="typeOfTechnology" value={form.typeOfTechnology} onChange={update} placeholder="e.g. B300, H200, GB300" />
          <Input label="Cluster Size GPU # *" name="clusterSizeGpu" value={form.clusterSizeGpu} onChange={update} placeholder="e.g. 10000 or 2048*8" />
          <Select label="DC Tier (minimum)" name="dcTierMinimum" value={form.dcTierMinimum} onChange={update} options={DC_TIER_OPTIONS} />
          <Input label="Connectivity, Mbps" name="connectivityMbps" type="number" value={form.connectivityMbps} onChange={update} />
          <Input label="Latency, ms" name="latencyMs" type="number" value={form.latencyMs} onChange={update} />
          <Input label="Interconnectivity" name="interconnectivity" value={form.interconnectivity} onChange={update} placeholder="Networking topology / type" />
          <TextArea label="Redundancy / Uptime Requirements" name="redundancyUptimeRequirements" value={form.redundancyUptimeRequirements} onChange={update} className="sm:col-span-2" />

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 mt-2">Deployment</h3>
          </div>
          <Input label="Contract Length, Years *" name="contractLengthYears" value={form.contractLengthYears} onChange={update} placeholder="e.g. 3 years, 1-3 years" />
          <Input label="Timeline for Go Live *" name="timelineForGoLive" value={form.timelineForGoLive} onChange={update} placeholder="e.g. ASAP, Q3 2025" />
          <Input label="Ideal Cluster Location" name="idealClusterLocation" value={form.idealClusterLocation} onChange={update} placeholder="e.g. Europe or SE Asia" />
          <Input label="Export Constraints" name="exportConstraints" value={form.exportConstraints} onChange={update} />

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 mt-2">Commercial</h3>
          </div>
          <Input label="Target Price, GPU/h, USD" name="targetPriceGpuHUsd" value={form.targetPriceGpuHUsd} onChange={update} placeholder="e.g. $1.50 or $1.20-$1.80" />

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 mt-2">Pipeline / CRM</h3>
          </div>
          <Input label="Decision Maker" name="decisionMaker" value={form.decisionMaker} onChange={update} placeholder="Contact name or role" />
          <Input label="Procurement Stage" name="procurementStage" value={form.procurementStage} onChange={update} />
          <TextArea label="Other Comments" name="otherComments" value={form.otherComments} onChange={update} className="sm:col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => submit(true)} loading={submitting}>Save Draft</Button>
          <Button onClick={() => submit(false)} loading={submitting}>Submit Request</Button>
        </div>
      </Card>
    </div>
  );
}
