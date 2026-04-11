import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', MATCHED: 'success', CLOSED: 'default' };

export default function AdminGpuDemandsPage() {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/gpu-demands').then((r) => setDemands(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">GPU Demand Requests</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">All GPU demand requests from customers and suppliers</p>
      </div>
      <DataTable columns={columns} data={demands} />
    </div>
  );
}
