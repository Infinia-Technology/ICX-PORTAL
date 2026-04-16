import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';

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

export default function AdminGpuClustersPage() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (showArchived) params.set('includeArchived', 'true');
    params.set('limit', '1000');
    api.get(`/admin/gpu-clusters?${params}`).then((r) => setClusters(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, [statusFilter, showArchived]);

  const columns = [
    { key: 'vendorName', label: 'Vendor' },
    { key: 'gpuTechnology', label: 'Technology' },
    { key: 'singleClusterSize', label: 'Cluster Size', render: (v) => v ? `${v} GPUs` : '—' },
    { key: 'country', label: 'Country' },
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
    { key: '_id', label: 'Actions', render: (v) => <Link to={`/admin/gpu-clusters/${v}`}><Button size="sm">Review</Button></Link> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">GPU Listings</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">All GPU listings</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-[var(--color-primary)]" />
            Show Archived
          </label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              ...['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'].map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
            ]}
          />
          <Link to="/admin/gpu-clusters/new"><Button variant="primary">+ New GPU Listing</Button></Link>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : <DataTable columns={columns} data={clusters} />}
    </div>
  );
}
