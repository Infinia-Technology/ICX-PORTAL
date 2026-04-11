import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', MATCHED: 'success', CLOSED: 'default' };

export default function AdminDcRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dc-requests').then((r) => setRequests(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'country', label: 'Country' },
    { key: 'requiredPowerMw', label: 'Power (MW)' },
    { key: 'timelineGoLive', label: 'Timeline' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v]}>{v}</Badge> },
    { key: 'createdAt', label: 'Submitted', render: (v) => new Date(v).toLocaleDateString() },
    { key: '_id', label: 'Actions', render: (v) => <Link to={`/admin/dc-requests/${v}`}><Button size="sm">View</Button></Link> },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">DC Capacity Requests</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">All DC capacity requests</p>
      </div>
      <DataTable columns={columns} data={requests} />
    </div>
  );
}
