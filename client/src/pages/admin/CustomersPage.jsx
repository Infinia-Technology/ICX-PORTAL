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
import { useToast } from '../../components/ui/Toast';

const STATUS_VARIANT = { PENDING: 'default', KYC_SUBMITTED: 'info', APPROVED: 'success', REJECTED: 'error', REVISION_REQUESTED: 'warning' };

const EMPTY_FORM = {
  email: '',
  companyName: '',
  companyType: '',
  jurisdiction: '',
  industrySector: '',
  companyAddress: '',
  authSignatoryName: '',
  authSignatoryTitle: '',
  taxVatNumber: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const load = () => {
    api.get('/admin/customers').then((r) => setCustomers(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const update = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.email || !form.companyName) {
      addToast({ type: 'error', message: 'Email and Company Name are required' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/customers', form);
      addToast({ type: 'success', message: 'Customer created successfully' });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setLoading(true);
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create customer' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'contactEmail', label: 'Email' },
    { key: 'jurisdiction', label: 'Jurisdiction' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'createdAt', label: 'Registered', render: (v) => new Date(v).toLocaleDateString() },
    { key: '_id', label: 'Actions', render: (v) => <Link to={`/admin/customers/${v}`}><Button size="sm">View</Button></Link> },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">All registered customer organizations</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      <DataTable columns={columns} data={customers} />

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm(EMPTY_FORM); }} title="Add Customer">
        <div className="grid sm:grid-cols-2 gap-4 p-1">
          <div className="sm:col-span-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Account</div>
          <Input label="Email *" name="email" type="email" value={form.email} onChange={update} />
          <Input label="Company Name *" name="companyName" value={form.companyName} onChange={update} />

          <div className="sm:col-span-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mt-2">Details</div>
          <Input label="Company Type" name="companyType" value={form.companyType} onChange={update} placeholder="e.g. Enterprise, SME" />
          <Input label="Jurisdiction" name="jurisdiction" value={form.jurisdiction} onChange={update} placeholder="e.g. UAE, UK" />
          <Input label="Industry / Sector" name="industrySector" value={form.industrySector} onChange={update} />
          <Input label="Tax / VAT Number" name="taxVatNumber" value={form.taxVatNumber} onChange={update} />
          <Input label="Company Address" name="companyAddress" value={form.companyAddress} onChange={update} className="sm:col-span-2" />
          <Input label="Name" name="authSignatoryName" value={form.authSignatoryName} onChange={update} placeholder="Authorised signatory name" />
          <Input label="Title" name="authSignatoryTitle" value={form.authSignatoryTitle} onChange={update} placeholder="e.g. CEO, Director" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Create Customer</Button>
        </div>
      </Modal>
    </div>
  );
}
