import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Server, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import DataTable from '../../components/ui/DataTable';
import { useToast } from '../../components/ui/Toast';

const STATUS_VARIANT = {
  DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning',
  REVISION_REQUESTED: 'warning', RESUBMITTED: 'info',
  APPROVED: 'success', REJECTED: 'error',
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const isOutdated = (listing) => {
  if (listing.status !== 'APPROVED' || listing.isArchived) return false;
  const lastActivity = new Date(listing.lastActivityAt || listing.updatedAt);
  return (Date.now() - lastActivity.getTime()) > THIRTY_DAYS_MS;
};

export default function GpuClustersPage() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(null);
  const { addToast } = useToast();

  const load = () => {
    api.get('/gpu-clusters').then((r) => setClusters(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRefresh = async (id) => {
    setRefreshing(id);
    try {
      await api.post(`/gpu-clusters/${id}/refresh`);
      addToast({ type: 'success', message: 'Listing refreshed' });
      load();
    } catch {
      addToast({ type: 'error', message: 'Failed to refresh' });
    } finally {
      setRefreshing(null);
    }
  };

  const columns = [
    { key: 'vendorName', label: 'Vendor', render: (v) => v || <span className="text-gray-400">Untitled Draft</span> },
    { key: 'gpuTechnology', label: 'GPU Technology' },
    { key: 'singleClusterSize', label: 'Cluster Size', render: (v) => v ? `${v} GPUs` : '-' },
    { key: 'country', label: 'Country' },
    {
      key: 'status', label: 'Status', render: (v, row) => (
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge>
          {isOutdated(row) && <Badge variant="warning">Outdated</Badge>}
        </div>
      ),
    },
    {
      key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-2">
          <Link to={`/supplier/gpu-clusters/${v}`}><Button size="sm" variant="ghost">View</Button></Link>
          {['DRAFT', 'REVISION_REQUESTED'].includes(row.status) && (
            <Link to={`/supplier/gpu-clusters/${v}/edit`}><Button size="sm">Edit</Button></Link>
          )}
          {isOutdated(row) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleRefresh(v)}
              loading={refreshing === v}
              title="Confirm listing data is still current"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">GPU Capacity Listings</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage your GPU capacity listings</p>
        </div>
        <Link to="/supplier/gpu-clusters/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>New GPU Capacity Listing</Button>
        </Link>
      </div>

      {clusters.length === 0 ? (
        <Card className="text-center py-16">
          <Server className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No GPU listings yet</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">List your first GPU listing to get started</p>
          <Link to="/supplier/gpu-clusters/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create GPU Capacity Listing</Button>
          </Link>
        </Card>
      ) : (
        <DataTable columns={columns} data={clusters} />
      )}
    </div>
  );
}
