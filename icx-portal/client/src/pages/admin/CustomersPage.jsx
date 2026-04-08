import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';

const STATUS_VARIANT = { PENDING: 'default', KYC_SUBMITTED: 'info', APPROVED: 'success', REJECTED: 'error', REVISION_REQUESTED: 'warning' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/customers').then((r) => setCustomers(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'contactEmail', label: 'Email' },
    { key: 'jurisdiction', label: 'Jurisdiction' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'createdAt', label: 'Registered', render: (v) => new Date(v).toLocaleDateString() },
    { key: '_id', label: 'Actions', render: (v) => <Link to={`/admin/customers/${v}`}><Button size="sm">View</Button></Link> },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">All registered customer organizations</p>
      </div>
      <DataTable columns={columns} data={customers} />
    </div>
  );
}
