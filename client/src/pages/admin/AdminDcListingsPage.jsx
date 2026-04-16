import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', REVISION_REQUESTED: 'warning', RESUBMITTED: 'warning', APPROVED: 'success', REJECTED: 'error' };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const isOutdated = (listing) => {
  if (listing.status !== 'APPROVED' || listing.isArchived) return false;
  const lastActivity = new Date(listing.lastActivityAt || listing.updatedAt);
  return (Date.now() - lastActivity.getTime()) > THIRTY_DAYS_MS;
};

const draftAge = (listing) => {
  if (listing.status !== 'DRAFT') return null;
  return Math.floor((Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24));
};

export default function AdminDcListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (showArchived) params.set('includeArchived', 'true');
    api.get(`/admin/dc-listings?${params}`).then((r) => setListings(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, [statusFilter, showArchived]);

  const columns = [
    { key: 'companyLegalEntity', label: 'Company', render: (v) => v || '—' },
    { key: 'contactEmail', label: 'Contact' },
    {
      key: 'status', label: 'Status', render: (v, row) => (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={STATUS_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge>
          {isOutdated(row) && <Badge variant="warning">Outdated</Badge>}
          {row.isArchived && <Badge variant="default">Archived</Badge>}
          {draftAge(row) !== null && draftAge(row) > 7 && (
            <span className="text-[10px] text-orange-600">{draftAge(row)}d old</span>
          )}
        </div>
      ),
    },
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
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-[var(--color-primary)]" />
            Show Archived
          </label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Statuses' }, 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'].map((o) => typeof o === 'string' ? { value: o, label: o.replace(/_/g, ' ') } : o)} />
          <Link to="/admin/dc-listings/new"><Button variant="primary">+ New DC Listing</Button></Link>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : <DataTable columns={columns} data={listings} />}
    </div>
  );
}
