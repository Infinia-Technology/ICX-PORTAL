import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import TextArea from '../../components/ui/TextArea';
import { useToast } from '../../components/ui/Toast';

export default function GpuDemandNewPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ customerName: '', customerCountry: '', technologyType: '', contractLengthYears: '', clusterSizeGpus: '', idealClusterLocation: '', exportConstraints: '', timelineGoLive: '', connectivityMbps: '', latencyMs: '', interconnectivity: '', dcTierMinimum: '', redundancyUptimeRequirements: '', targetPriceGpuHr: '', decisionMaker: '', procurementStage: '', otherComments: '' });
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (asDraft = false) => {
    setSubmitting(true);
    try {
      const res = await api.post('/gpu-demands', form);
      if (!asDraft) await api.post(`/gpu-demands/${res.data._id}/submit`);
      addToast({ type: 'success', message: asDraft ? 'Saved as draft' : 'GPU demand submitted!' });
      navigate('/customer/gpu-demands');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Submit GPU Demand Request</h1>
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Customer Name *" name="customerName" value={form.customerName} onChange={update} />
          <Input label="Customer Country *" name="customerCountry" value={form.customerCountry} onChange={update} />
          <Input label="Technology Type *" name="technologyType" value={form.technologyType} onChange={update} placeholder="e.g. NVIDIA H100" />
          <Input label="Contract Length (years) *" name="contractLengthYears" value={form.contractLengthYears} onChange={update} />
          <Input label="Cluster Size (GPUs) *" name="clusterSizeGpus" value={form.clusterSizeGpus} onChange={update} />
          <Input label="Timeline Go-Live *" name="timelineGoLive" value={form.timelineGoLive} onChange={update} placeholder="e.g. Q3 2025" />
          <Input label="Ideal Cluster Location" name="idealClusterLocation" value={form.idealClusterLocation} onChange={update} />
          <Input label="Export Constraints" name="exportConstraints" value={form.exportConstraints} onChange={update} />
          <Input label="Connectivity (Mbps)" name="connectivityMbps" type="number" value={form.connectivityMbps} onChange={update} />
          <Input label="Latency (ms)" name="latencyMs" type="number" value={form.latencyMs} onChange={update} />
          <Input label="Interconnectivity" name="interconnectivity" value={form.interconnectivity} onChange={update} placeholder="e.g. n/a, dedicated link, peering" />
          <Select label="DC Tier Minimum" name="dcTierMinimum" value={form.dcTierMinimum} onChange={update} options={['', 'Tier I', 'Tier II', 'Tier III', 'Tier IV'].map((o) => ({ value: o, label: o || 'Select...' }))} />
          <TextArea label="Redundancy / Uptime Requirements" name="redundancyUptimeRequirements" value={form.redundancyUptimeRequirements} onChange={update} className="sm:col-span-2" placeholder="Describe redundancy and uptime SLA requirements" />
          <Input label="Target Price (GPU/hr)" name="targetPriceGpuHr" value={form.targetPriceGpuHr} onChange={update} />
          <Input label="Decision Maker" name="decisionMaker" value={form.decisionMaker} onChange={update} />
          <Input label="Procurement Stage" name="procurementStage" value={form.procurementStage} onChange={update} />
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
