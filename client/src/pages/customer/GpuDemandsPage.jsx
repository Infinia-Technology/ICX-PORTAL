import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Zap } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', MATCHED: 'success', CLOSED: 'default' };

export default function GpuDemandsPage() {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gpu-demands').then((r) => setDemands(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'contactName', label: 'Contact' },
    { key: 'customerName', label: 'Customer' },
    { key: 'technologyType', label: 'Technology' },
    { key: 'clusterSizeGpus', label: 'GPUs' },
    { key: 'timelineGoLive', label: 'Timeline' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v]}>{v}</Badge> },
    { key: 'createdAt', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Track your GPU compute demand listings</p>
        </div>
        <Link to="/customer/gpu-demands/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>New Listing</Button>
        </Link>
      </div>

      {demands.length === 0 ? (
        <Card className="text-center py-16">
          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No listings yet</h3>
          <Link to="/customer/gpu-demands/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>New Listing</Button>
          </Link>
        </Card>
      ) : <DataTable columns={columns} data={demands} />}
    </div>
  );
}
