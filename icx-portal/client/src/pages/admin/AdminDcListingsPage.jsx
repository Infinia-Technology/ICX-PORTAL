import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', REVISION_REQUESTED: 'warning', RESUBMITTED: 'warning', APPROVED: 'success', REJECTED: 'error' };

export default function AdminDcListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/admin/dc-listings${params}`).then((r) => setListings(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, [statusFilter]);

  const columns = [
    { key: 'companyLegalEntity', label: 'Company', render: (v) => v || '—' },
    { key: 'contactEmail', label: 'Contact' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'submittedAt', label: 'Submitted', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'createdAt', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
    { key: '_id', label: 'Actions', render: (v) => <Link to={`/admin/dc-listings/${v}`}><Button size="sm">Review</Button></Link> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">DC Applications</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">All DC listing applications</p>
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Statuses' }, 'SUBMITTED', 'IN_REVIEW', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'].map((o) => typeof o === 'string' ? { value: o, label: o.replace(/_/g, ' ') } : o)} />
      </div>
      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : <DataTable columns={columns} data={listings} />}
    </div>
  );
}
