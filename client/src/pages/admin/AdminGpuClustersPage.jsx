import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', REVISION_REQUESTED: 'warning', RESUBMITTED: 'warning', APPROVED: 'success', REJECTED: 'error' };

export default function AdminGpuClustersPage() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/gpu-clusters').then((r) => setClusters(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'vendorName', label: 'Vendor' },
    { key: 'gpuTechnology', label: 'Technology' },
    { key: 'singleClusterSize', label: 'Cluster Size', render: (v) => v ? `${v} GPUs` : '—' },
    { key: 'country', label: 'Country' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: '_id', label: 'Actions', render: (v) => <Link to={`/admin/gpu-clusters/${v}`}><Button size="sm">Review</Button></Link> },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">GPU Listings</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">All All GPU listings</p>
      </div>
      <DataTable columns={columns} data={clusters} />
    </div>
  );
}
