import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import TextArea from '../../components/ui/TextArea';
import { useToast } from '../../components/ui/Toast';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', MATCHED: 'success', CLOSED: 'default' };

const DC_TIER_OPTIONS = ['', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'].map((o) => ({ value: o, label: o || 'Select...' }));

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

export default function AdminGpuDemandsPage() {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const load = () => {
    api.get('/admin/gpu-demands').then((r) => setDemands(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/admin/gpu-demands', form);
      addToast({ type: 'success', message: 'GPU request created' });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setLoading(true);
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create request' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'customerCountry', label: 'Country' },
    { key: 'typeOfTechnology', label: 'Technology' },
    { key: 'clusterSizeGpu', label: 'Cluster Size' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v]}>{v}</Badge> },
    { key: 'createdAt', label: 'Submitted', render: (v) => new Date(v).toLocaleDateString() },
    { key: '_id', label: 'Actions', render: (v) => <Link to={`/admin/gpu-demands/${v}`}><Button size="sm">View</Button></Link> },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">GPU Requests</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">All GPU capacity requests from customers</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add GPU Request
        </Button>
      </div>

      <DataTable columns={columns} data={demands} />

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm(EMPTY_FORM); }} title="Add GPU Request">
        <div className="grid sm:grid-cols-2 gap-4 p-1">
          <div className="sm:col-span-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Client Identity</div>
          <Input label="Customer *" name="customer" value={form.customer} onChange={update} placeholder="Company / entity name" />
          <Input label="Date of Entry *" name="dateOfEntry" type="date" value={form.dateOfEntry} onChange={update} />
          <Input label="Customer Country *" name="customerCountry" value={form.customerCountry} onChange={update} />

          <div className="sm:col-span-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mt-2">Technical Requirements</div>
          <Input label="Type of Technology *" name="typeOfTechnology" value={form.typeOfTechnology} onChange={update} placeholder="e.g. B300, H200, GB300" />
          <Input label="Cluster Size GPU # *" name="clusterSizeGpu" value={form.clusterSizeGpu} onChange={update} placeholder="e.g. 10000 or 2048*8" />
          <Select label="DC Tier (minimum)" name="dcTierMinimum" value={form.dcTierMinimum} onChange={update} options={DC_TIER_OPTIONS} />
          <Input label="Connectivity, Mbps" name="connectivityMbps" type="number" value={form.connectivityMbps} onChange={update} />
          <Input label="Latency, ms" name="latencyMs" type="number" value={form.latencyMs} onChange={update} />
          <Input label="Interconnectivity" name="interconnectivity" value={form.interconnectivity} onChange={update} />
          <TextArea label="Redundancy / Uptime Requirements" name="redundancyUptimeRequirements" value={form.redundancyUptimeRequirements} onChange={update} className="sm:col-span-2" />

          <div className="sm:col-span-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mt-2">Deployment</div>
          <Input label="Contract Length, Years *" name="contractLengthYears" value={form.contractLengthYears} onChange={update} placeholder="e.g. 3 years" />
          <Input label="Timeline for Go Live *" name="timelineForGoLive" value={form.timelineForGoLive} onChange={update} placeholder="e.g. ASAP" />
          <Input label="Ideal Cluster Location" name="idealClusterLocation" value={form.idealClusterLocation} onChange={update} />
          <Input label="Export Constraints" name="exportConstraints" value={form.exportConstraints} onChange={update} />

          <div className="sm:col-span-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mt-2">Commercial & CRM</div>
          <Input label="Target Price, GPU/h, USD" name="targetPriceGpuHUsd" value={form.targetPriceGpuHUsd} onChange={update} placeholder="e.g. $1.50 or $1.20-$1.80" />
          <Input label="Decision Maker" name="decisionMaker" value={form.decisionMaker} onChange={update} />
          <Input label="Procurement Stage" name="procurementStage" value={form.procurementStage} onChange={update} />
          <TextArea label="Other Comments" name="otherComments" value={form.otherComments} onChange={update} className="sm:col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Create Request</Button>
        </div>
      </Modal>
    </div>
  );
}
