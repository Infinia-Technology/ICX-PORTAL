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
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  customerName: '',
  customerCountry: '',
  technologyType: '',
  clusterSizeGpus: '',
  contractLengthYears: '',
  timelineGoLive: '',
  idealClusterLocation: '',
  exportConstraints: '',
  connectivityMbps: '',
  latencyMs: '',
  dcTierMinimum: '',
  targetPriceGpuHr: '',
  decisionMaker: '',
  procurementStage: '',
  redundancyRequirements: '',
  otherComments: '',
};

export default function GpuDemandNewPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (asDraft = false) => {
    if (!asDraft && (!form.contactName || !form.customerName || !form.technologyType || !form.clusterSizeGpus)) {
      addToast({ type: 'error', message: 'Please fill in Contact Name, Customer Name, Technology Type and Cluster Size' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/gpu-demands', form);
      if (!asDraft) await api.post(`/gpu-demands/${res.data._id}/submit`);
      addToast({ type: 'success', message: asDraft ? 'Saved as draft' : 'Listing submitted!' });
      navigate('/customer/gpu-demands');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New GPU Request Listing</h1>
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Contact Information */}
          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Contact Information</h3>
          </div>
          <Input label="Contact Name *" name="contactName" value={form.contactName} onChange={update} />
          <Input label="Decision Maker Email *" name="contactEmail" type="email" value={form.contactEmail} onChange={update} />
          <Input label="Decision Maker Phone" name="contactPhone" value={form.contactPhone} onChange={update} />

          {/* Company & Requirements */}
          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 mt-2">Demand Details</h3>
          </div>
          <Input label="Customer Name *" name="customerName" value={form.customerName} onChange={update} />
          <Input label="Customer Country *" name="customerCountry" value={form.customerCountry} onChange={update} />
          <Input label="Technology Type *" name="technologyType" value={form.technologyType} onChange={update} placeholder="e.g. NVIDIA H100" />
          <Input label="Cluster Size (GPUs) *" name="clusterSizeGpus" type="number" value={form.clusterSizeGpus} onChange={update} />
          <Input label="Contract Length (years)" name="contractLengthYears" type="number" value={form.contractLengthYears} onChange={update} />
          <Input label="Timeline Go-Live" name="timelineGoLive" value={form.timelineGoLive} onChange={update} placeholder="e.g. Q3 2025" />
          <Input label="Ideal Cluster Location" name="idealClusterLocation" value={form.idealClusterLocation} onChange={update} />
          <Input label="Export Constraints" name="exportConstraints" value={form.exportConstraints} onChange={update} />
          <Input label="Connectivity (Mbps)" name="connectivityMbps" type="number" value={form.connectivityMbps} onChange={update} />
          <Input label="Latency (ms)" name="latencyMs" type="number" value={form.latencyMs} onChange={update} />
          <Select
            label="DC Tier Minimum"
            name="dcTierMinimum"
            value={form.dcTierMinimum}
            onChange={update}
            options={['', 'Tier I', 'Tier II', 'Tier III', 'Tier IV'].map((o) => ({ value: o, label: o || 'Select...' }))}
          />
          <Input label="GPU Price/h (USD)" name="targetPriceGpuHr" type="number" value={form.targetPriceGpuHr} onChange={update} />
          <Input
            label="Decision Maker Name"
            name="decisionMaker"
            value={form.decisionMaker}
            onChange={update}
            placeholder="Person responsible for GPU demand decision"
          />
          <Input label="Procurement Stage" name="procurementStage" value={form.procurementStage} onChange={update} />
          <TextArea label="Redundancy / Uptime Requirements" name="redundancyRequirements" value={form.redundancyRequirements} onChange={update} className="sm:col-span-2" />
          <TextArea label="Other Comments" name="otherComments" value={form.otherComments} onChange={update} className="sm:col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => submit(true)} loading={submitting}>Save Draft</Button>
          <Button onClick={() => submit(false)} loading={submitting}>Submit Demand</Button>
        </div>
      </Card>
    </div>
  );
}
