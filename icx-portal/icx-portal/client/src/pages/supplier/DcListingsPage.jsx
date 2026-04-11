import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2 } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import DataTable from '../../components/ui/DataTable';

const STATUS_VARIANT = {
  DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning',
  REVISION_REQUESTED: 'warning', RESUBMITTED: 'info',
  APPROVED: 'success', REJECTED: 'error',
};

export default function DcListingsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dc-applications').then((r) => setApplications(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'companyLegalEntity', label: 'Company', render: (v, row) => v || <span className="text-gray-400">Untitled Draft</span> },
    { key: 'contactEmail', label: 'Contact' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'createdAt', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-2">
          <Link to={`/supplier/dc-listings/${v}`}><Button size="sm" variant="ghost">View</Button></Link>
          {['DRAFT', 'REVISION_REQUESTED'].includes(row.status) && (
            <Link to={`/supplier/dc-listings/${v}/edit`}><Button size="sm">Edit</Button></Link>
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
          <h1 className="text-2xl font-bold">DC Listings</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage your data center applications</p>
        </div>
        <Link to="/supplier/dc-listings/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>New DC Listing</Button>
        </Link>
      </div>

      {applications.length === 0 ? (
        <Card className="text-center py-16">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No DC listings yet</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">Create your first DC listing to get started</p>
          <Link to="/supplier/dc-listings/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create DC Listing</Button>
          </Link>
        </Card>
      ) : (
        <DataTable columns={columns} data={applications} />
      )}
    </div>
  );
}
