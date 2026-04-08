import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TextArea from '../../components/ui/TextArea';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const STATUS_VARIANT = { PENDING: 'default', KYC_SUBMITTED: 'info', APPROVED: 'success', REJECTED: 'error', REVISION_REQUESTED: 'warning' };
const Field = ({ label, value }) => (<div><dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt><dd className="text-sm">{value || '—'}</dd></div>);

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/admin/customers/${id}`).then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const verify = async (action) => {
    setSubmitting(true);
    try {
      await api.put(`/admin/customers/${id}/verify`, { action, reason });
      addToast({ type: 'success', message: `Customer ${action.toLowerCase().replace('_', ' ')}` });
      navigate('/admin/customers');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-center py-20">Not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.companyName || data.contactEmail}</h1>
          <div className="flex gap-2 mt-1">
            <Badge variant="default">{data.type}</Badge>
            <Badge variant={STATUS_VARIANT[data.status] || 'default'}>{data.status?.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate('/admin/customers')}>Back</Button>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">Company Information</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Company Name" value={data.companyName} />
          <Field label="Company Type" value={data.companyType} />
          <Field label="Jurisdiction" value={data.jurisdiction} />
          <Field label="Industry Sector" value={data.industrySector} />
          <Field label="Tax/VAT Number" value={data.taxVatNumber} />
          <Field label="Website" value={data.website} />
          <Field label="Auth Signatory" value={data.authSignatoryName} />
          <Field label="Billing Contact" value={data.billingContactEmail} />
        </dl>
      </Card>

      {['KYC_SUBMITTED', 'REVISION_REQUESTED'].includes(data.status) && (
        <Card>
          <h2 className="font-semibold mb-4">Verification Decision</h2>
          <TextArea label="Reason / Comments" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason..." rows={3} />
          <div className="flex gap-3 mt-4">
            <Button onClick={() => verify('APPROVE')} loading={submitting} className="bg-green-600 hover:bg-green-700">Approve</Button>
            <Button onClick={() => verify('REQUEST_REVISION')} loading={submitting} variant="ghost" className="border-yellow-400 text-yellow-700">Request Revision</Button>
            <Button onClick={() => verify('REJECT')} loading={submitting} variant="ghost" className="border-red-400 text-red-600">Reject</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
