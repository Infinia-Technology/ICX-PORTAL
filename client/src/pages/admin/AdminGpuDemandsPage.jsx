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

const EMPTY_FORM = {
  contactName: '', contactEmail: '', contactPhone: '',
  customerName: '', customerCountry: '', technologyType: '',
  clusterSizeGpus: '', contractLengthYears: '', timelineGoLive: '',
  idealClusterLocation: '', exportConstraints: '',
  connectivityMbps: '', latencyMs: '', dcTierMinimum: '',
  targetPriceGpuHr: '', decisionMaker: '', procurementStage: '',
  redundancyRequirements: '', otherComments: '',
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

  const handleSubmit = async () => {
    if (!form.contactName || !form.customerName || !form.technologyType || !form.clusterSizeGpus) {
      addToast({ type: 'error', message: 'Please fill in Contact Name, Customer Name, Technology Type and Cluster Size' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/gpu-demands', form);
      addToast({ type: 'success', message: 'GPU demand created' });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setLoading(true);
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create demand' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'contactName', label: 'Contact' },
    { key: 'customerName', label: 'Customer' },
    { key: 'customerCountry', label: 'Country' },
    { key: 'technologyType', label: 'Technology' },
    { key: 'clusterSizeGpus', label: 'GPUs' },
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
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">All GPU requests from customers</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add GPU Request
        </Button>
      </div>

      <DataTable columns={columns} data={demands} />

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm(EMPTY_FORM); }} title="Add GPU Request">
        <div className="grid sm:grid-cols-2 gap-4 p-1">
          <div className="sm:col-span-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Contact Information</div>
          <Input label="Contact Name" name="contactName" value={form.contactName} onChange={update} />
          <Input label="Decision Maker Email" name="contactEmail" type="email" value={form.contactEmail} onChange={update} />
          <Input label="Decision Maker Phone" name="contactPhone" value={form.contactPhone} onChange={update} />

          <div className="sm:col-span-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mt-2">Demand Details</div>
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
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Create Demand</Button>
        </div>
      </Modal>
    </div>
  );
}
