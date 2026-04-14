import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';
import { ClipboardList, Building2, Users, Server, Zap, Database, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

const QUEUE_STATUS_VARIANT = { NEW: 'info', IN_REVIEW: 'warning', APPROVED: 'success', REJECTED: 'error', RESUBMITTED: 'warning' };
const QUEUE_TYPE_VARIANT = { SUPPLIER_KYC: 'default', DC_LISTING: 'info', GPU_CLUSTER: 'success', CUSTOMER_APPLICATION: 'default', GPU_DEMAND: 'warning', DC_REQUEST: 'warning' };

const MetricCard = ({ icon: Icon, label, value, delta, color, to }) => {
  const content = (
    <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">{label}</p>
          <p className="text-3xl font-bold">{value ?? '—'}</p>
          {delta !== undefined && (
            <p className="text-xs mt-2 flex items-center gap-1">
              {delta >= 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">+{delta}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">{delta}</span>
                </>
              )}
              <span className="text-gray-400">from last week</span>
            </p>
          )}
        </div>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
    </Card>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

export default function AdminWorkspace() {
  const [stats, setStats] = useState(null);
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadData = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);

    Promise.all([
      api.get('/admin/analytics'),
      api.get(`/admin/queue?${params}`),
    ]).then(([analyticsRes, queueRes]) => {
      setStats(analyticsRes.data);
      setQueueItems(queueRes.data.data || queueRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [statusFilter, typeFilter]);

  const queueColumns = [
    { key: 'type', label: 'Type', render: (v) => <Badge variant={QUEUE_TYPE_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={QUEUE_STATUS_VARIANT[v] || 'default'}>{v}</Badge> },
    { key: 'submitterEmail', label: 'Submitter Email' },
    { key: 'organizationName', label: 'Organization' },
    { key: 'submitterRole', label: 'Role' },
    { key: 'createdAt', label: 'Submitted', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: '_id',
      label: 'Actions',
      render: (id, row) => (
        <Link to={`/admin/queue/${id}`}>
          <Button size="sm">
            {['NEW', 'RESUBMITTED'].includes(row.status) ? 'Review' : 'View'}
          </Button>
        </Link>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Workspace</h1>
        <p className="text-[var(--color-text-secondary)]">Manage submissions, suppliers, customers, and platform analytics</p>
      </div>

      {/* KPI Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard icon={ClipboardList} label="Pending Queue" value={stats?.pendingQueue} delta={3} color="text-[var(--color-info)]" to="/admin/queue" />
        <MetricCard icon={Building2} label="Approved Suppliers" value={stats?.totalSuppliers} delta={2} color="text-[var(--color-success)]" to="/admin/suppliers" />
        <MetricCard icon={Users} label="Approved Customers" value={stats?.totalCustomers} delta={1} color="text-[var(--color-warning)]" to="/admin/customers" />
        <MetricCard icon={CheckCircle} label="Approved MW" value={stats?.totalApprovedMw ? `${stats.totalApprovedMw} MW` : '0 MW'} color="text-purple-500" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard icon={Building2} label="DC Listings (Approved)" value={stats?.approvedDcListings} color="text-[var(--color-info)]" to="/admin/dc-listings" />
        <MetricCard icon={ClipboardList} label="DC Listings (Pending)" value={stats?.pendingDcListings} color="text-yellow-500" to="/admin/dc-listings" />
        <MetricCard icon={Server} label="GPU Listings (Approved)" value={stats?.approvedGpuClusters} color="text-[var(--color-success)]" to="/admin/gpu-clusters" />
        <MetricCard icon={Zap} label="GPU Demands" value={stats?.totalGpuDemands} color="text-orange-500" to="/admin/gpu-demands" />
      </div>

      {/* Review Queue Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Review Queue</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">All pending review items awaiting action</p>
          </div>
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                'NEW',
                'IN_REVIEW',
                'RESUBMITTED',
                'APPROVED',
                'REJECTED',
              ].map((o) => typeof o === 'string' ? { value: o, label: o } : o)}
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                'SUPPLIER_KYC',
                'DC_LISTING',
                'GPU_CLUSTER',
                'CUSTOMER_APPLICATION',
                'GPU_DEMAND',
                'DC_REQUEST',
              ].map((o) => typeof o === 'string' ? { value: o, label: o.replace(/_/g, ' ') } : o)}
            />
          </div>
        </div>

        {queueItems.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No items in queue</p>
        ) : (
          <DataTable columns={queueColumns} data={queueItems} />
        )}
      </Card>
    </div>
  );
}
