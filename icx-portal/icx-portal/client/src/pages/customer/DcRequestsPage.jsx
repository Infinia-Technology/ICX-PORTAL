import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Database } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', MATCHED: 'success', CLOSED: 'default' };

export default function DcRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dc-requests').then((r) => setRequests(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'country', label: 'Country' },
    { key: 'requiredPowerMw', label: 'Required Power (MW)' },
    { key: 'timelineGoLive', label: 'Timeline' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v]}>{v}</Badge> },
    { key: 'createdAt', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">DC Capacity Requests</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Track your data center capacity requests</p>
        </div>
        <Link to="/customer/dc-requests/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>New Request</Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <Card className="text-center py-16">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No DC requests yet</h3>
          <Link to="/customer/dc-requests/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Submit DC Request</Button>
          </Link>
        </Card>
      ) : <DataTable columns={columns} data={requests} />}
    </div>
  );
}
