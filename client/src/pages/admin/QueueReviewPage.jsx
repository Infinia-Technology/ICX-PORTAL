import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TextArea from '../../components/ui/TextArea';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const STATUS_ICON = {
  NEW: Clock,
  IN_REVIEW: AlertTriangle,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  RESUBMITTED: FileText,
};

const STATUS_COLOR = {
  NEW: 'text-blue-500',
  IN_REVIEW: 'text-yellow-500',
  APPROVED: 'text-green-500',
  REJECTED: 'text-red-500',
  RESUBMITTED: 'text-indigo-500',
};

const Field = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</dd>
    </div>
  );
};

// Render entity details based on type
function EntityDetails({ item }) {
  const entity = item.entity;
  if (!entity) return <p className="text-sm text-gray-400">No submission data available</p>;

  const type = item.referenceModel;

  if (type === 'Organization') {
    return (
      <dl className="grid sm:grid-cols-3 gap-4">
        <Field label="Type" value={entity.type} />
        <Field label="Status" value={entity.status} />
        <Field label="Vendor Type" value={entity.vendorType} />
        <Field label="Mandate Status" value={entity.mandateStatus} />
        <Field label="Contact Email" value={entity.contactEmail} />
        <Field label="Contact Number" value={entity.contactNumber} />
        <Field label="NDA Required" value={entity.ndaRequired} />
        <Field label="NDA Signed" value={entity.ndaSigned} />
        <Field label="Company Name" value={entity.companyName} />
        <Field label="Company Type" value={entity.companyType} />
        <Field label="Jurisdiction" value={entity.jurisdiction} />
        <Field label="Industry Sector" value={entity.industrySector} />
        <Field label="Registered" value={entity.createdAt ? new Date(entity.createdAt).toLocaleDateString() : null} />
      </dl>
    );
  }

  if (type === 'DcApplication') {
    const site = entity.sites?.[0];
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Company Details</h3>
          <dl className="grid sm:grid-cols-3 gap-4">
            <Field label="Legal Entity" value={entity.companyLegalEntity} />
            <Field label="Country" value={entity.companyCountry} />
            <Field label="Contact Name" value={entity.contactName} />
            <Field label="Contact Email" value={entity.contactEmail} />
            <Field label="Contact Mobile" value={entity.contactMobile} />
            <Field label="Submitted" value={entity.submittedAt ? new Date(entity.submittedAt).toLocaleDateString() : null} />
          </dl>
        </div>
        {site && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Site: {site.siteName || 'Unnamed'}</h3>
            <dl className="grid sm:grid-cols-3 gap-4">
              <Field label="Project Type" value={site.projectType} />
              <Field label="Business Model" value={site.businessModel} />
              <Field label="Address" value={site.address} />
              <Field label="Country" value={site.country} />
              <Field label="Total IT Load" value={site.totalItLoadMw ? `${site.totalItLoadMw} MW` : null} />
              <Field label="DC Tiering" value={site.dcTiering} />
              <Field label="Power Source" value={site.powerSource} />
              <Field label="Power Redundancy" value={site.powerRedundancy} />
              <Field label="Carrier Neutral" value={site.carrierNeutral} />
            </dl>
          </div>
        )}
        <Link to={`/admin/dc-listings/${entity._id}`} className="inline-block">
          <Button size="sm" variant="secondary">View Full Details</Button>
        </Link>
      </div>
    );
  }

  if (type === 'GpuClusterListing') {
    return (
      <div className="space-y-4">
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Vendor Name" value={entity.vendorName} />
          <Field label="GPU Technology" value={entity.gpuTechnology} />
          <Field label="Location" value={entity.location} />
          <Field label="Country" value={entity.country} />
          <Field label="Cluster Size" value={entity.singleClusterSize ? `${entity.singleClusterSize} GPUs` : null} />
          <Field label="Total GPUs" value={entity.totalGpuCount} />
          <Field label="Availability" value={entity.availabilityDate ? new Date(entity.availabilityDate).toLocaleDateString() : null} />
          <Field label="GPU Server Model" value={entity.gpuServerModel} />
          <Field label="Compute Network" value={entity.computeNetTechnology} />
          <Field label="Submitted" value={entity.submittedAt ? new Date(entity.submittedAt).toLocaleDateString() : null} />
        </dl>
        <Link to={`/admin/gpu-clusters/${entity._id}`} className="inline-block">
          <Button size="sm" variant="secondary">View Full Details</Button>
        </Link>
      </div>
    );
  }

  if (type === 'GpuDemandRequest' || type === 'DcCapacityRequest') {
    return (
      <dl className="grid sm:grid-cols-3 gap-4">
        <Field label="Company" value={entity.companyName} />
        <Field label="Country" value={entity.country} />
        <Field label="Status" value={entity.status} />
        <Field label="Submitted" value={entity.submittedAt ? new Date(entity.submittedAt).toLocaleDateString() : null} />
      </dl>
    );
  }

  // Fallback
  return (
    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
      {JSON.stringify(entity, null, 2)}
    </pre>
  );
}

// Status timeline component
function StatusTimeline({ item }) {
  const steps = [
    { label: 'Submitted', status: 'done', time: item.createdAt },
    {
      label: item.status === 'APPROVED' ? 'Approved' : item.status === 'REJECTED' ? 'Rejected' : 'Under Review',
      status: ['APPROVED', 'REJECTED'].includes(item.status) ? 'done' : 'current',
      time: item.updatedAt !== item.createdAt ? item.updatedAt : null,
    },
  ];

  if (item.status === 'RESUBMITTED') {
    steps.splice(1, 0, { label: 'Revision Requested', status: 'done', time: null });
    steps[2] = { label: 'Resubmitted', status: 'current', time: item.updatedAt };
  }

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                s.status === 'done' ? 'bg-green-500' : s.status === 'current' ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
              }`}>
                {s.status === 'done' ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <p className="text-[10px] font-medium mt-1 text-center whitespace-nowrap">{s.label}</p>
              {s.time && <p className="text-[9px] text-gray-400">{new Date(s.time).toLocaleDateString()}</p>}
            </div>
            {!isLast && <div className="w-16 h-0.5 bg-gray-200 mx-1 mb-6" />}
          </div>
        );
      })}
    </div>
  );
}

export default function QueueReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/admin/queue/${id}`).then((r) => setItem(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const reviewEndpoint = () => {
    if (!item) return null;
    if (item.referenceModel === 'Organization') {
      if (item.type === 'SUPPLIER_KYC') return `/admin/suppliers/${item.referenceId}/kyc`;
      return `/admin/customers/${item.referenceId}/verify`;
    }
    if (item.referenceModel === 'DcApplication') return `/admin/dc-listings/${item.referenceId}/review`;
    if (item.referenceModel === 'GpuClusterListing') return `/admin/gpu-clusters/${item.referenceId}/review`;
    return null;
  };

  const submit = async (actionType) => {
    const endpoint = reviewEndpoint();
    if (!endpoint) return;
    setSubmitting(true);
    try {
      await api.put(endpoint, { action: actionType, reason });
      addToast({ type: 'success', message: `${actionType.replace('_', ' ')} applied successfully` });
      navigate('/admin/queue');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!item) return <div className="text-center py-20">Queue item not found</div>;

  const StatusIcon = STATUS_ICON[item.status] || Clock;
  const canReview = ['NEW', 'IN_REVIEW', 'RESUBMITTED'].includes(item.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Queue Item</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusIcon className={`w-4 h-4 ${STATUS_COLOR[item.status] || 'text-gray-500'}`} />
            <Badge variant="info">{item.type?.replace(/_/g, ' ')}</Badge>
            <Badge variant={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'}>{item.status}</Badge>
            {item.assignedTo?.length > 0 && (
              <span className="text-xs text-gray-500">Assigned: {item.assignedTo.map((u) => u.email).join(', ')}</span>
            )}
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin/queue')}>Back to Queue</Button>
      </div>

      {/* Status Timeline */}
      <Card>
        <h2 className="font-semibold mb-4">Status Timeline</h2>
        <StatusTimeline item={item} />
      </Card>

      {/* Submission Details */}
      <Card>
        <h2 className="font-semibold mb-4">Submission Details</h2>
        <EntityDetails item={item} />
      </Card>

      {/* Review Decision */}
      {canReview && reviewEndpoint() && (
        <Card>
          <h2 className="font-semibold mb-4">Review Decision</h2>
          <TextArea label="Reason / Comments (optional)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide a reason for your decision..." rows={3} />
          <div className="flex gap-3 mt-4">
            <Button onClick={() => submit('APPROVE')} loading={submitting} className="bg-green-600 hover:bg-green-700">Approve</Button>
            <Button onClick={() => submit('REQUEST_REVISION')} loading={submitting} variant="secondary" className="border-yellow-400 text-yellow-700">Request Revision</Button>
            <Button onClick={() => submit('REJECT')} loading={submitting} variant="secondary" className="border-red-400 text-red-600">Reject</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
