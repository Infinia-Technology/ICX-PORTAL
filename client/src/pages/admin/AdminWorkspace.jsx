import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';
import {
  ClipboardList, Building2, Users, Server, Zap, CheckCircle,
  TrendingUp, TrendingDown, Clock, Database, BarChart2,
} from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const QUEUE_STATUS_VARIANT = { NEW: 'info', IN_REVIEW: 'warning', APPROVED: 'success', REJECTED: 'error', RESUBMITTED: 'warning' };
const QUEUE_TYPE_VARIANT = { SUPPLIER_KYC: 'default', DC_LISTING: 'info', GPU_CLUSTER: 'success', CUSTOMER_APPLICATION: 'default', GPU_DEMAND: 'warning', DC_REQUEST: 'warning' };

const MetricCard = ({ icon: Icon, label, value, sub, delta, color, iconBg, to }) => {
  const content = (
    <Card elevated className={`${to ? 'hover:border-[var(--color-primary)] transition-colors cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">{label}</p>
          <p className="text-3xl font-bold truncate">{value ?? '—'}</p>
          {sub && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{sub}</p>}
          {delta !== undefined && (
            <p className="text-xs mt-2 flex items-center gap-1">
              {delta >= 0 ? (
                <><TrendingUp className="w-3 h-3 text-green-500" /><span className="text-green-600">+{delta}</span></>
              ) : (
                <><TrendingDown className="w-3 h-3 text-red-500" /><span className="text-red-600">{delta}</span></>
              )}
              <span className="text-gray-400">from last week</span>
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-[var(--radius-md)] ${iconBg || 'bg-gray-100'} shrink-0 ml-3`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </Card>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

export default function AdminWorkspace() {
  const [tab, setTab] = useState('workspace');
  const [stats, setStats] = useState(null);
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics'),
      api.get('/admin/queue?limit=100'),
    ]).then(([analyticsRes, queueRes]) => {
      setStats(analyticsRes.data);
      setQueueItems(queueRes.data.data || queueRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const REVIEW_STATUSES = ['NEW', 'KYC_SUBMITTED', 'RESUBMITTED', 'IN_REVIEW'];

  const queueColumns = [
    { key: 'type', label: 'Type', render: (v) => <Badge variant={QUEUE_TYPE_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={QUEUE_STATUS_VARIANT[v] || 'default'}>{v}</Badge> },
    { key: 'submitterEmail', label: 'Submitter' },
    { key: 'organizationName', label: 'Organization' },
    { key: 'submitterRole', label: 'Role' },
    { key: 'createdAt', label: 'Submitted', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: '_id',
      label: 'Actions',
      render: (id, row) => {
        const isReview = REVIEW_STATUSES.includes(row.status);
        return (
          <Link to={`/admin/queue/${id}`}>
            <Button size="sm" variant={isReview ? 'primary' : 'secondary'}>
              {isReview ? 'Review' : 'View'}
            </Button>
          </Link>
        );
      },
    },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const listingsChartData = [
    { name: 'DC Approved', value: stats?.approvedDcListings || 0 },
    { name: 'DC Pending', value: stats?.pendingDcListings || 0 },
    { name: 'GPU Approved', value: stats?.approvedGpuClusters || 0 },
  ];

  const participantsChartData = [
    { name: 'Suppliers', value: stats?.totalSuppliers || 0 },
    { name: 'Customers', value: stats?.totalCustomers || 0 },
    { name: 'GPU Demands', value: stats?.totalGpuDemands || 0 },
    { name: 'DC Requests', value: stats?.totalDcRequests || 0 },
  ];

  const pieData = [
    { name: 'Approved DC', value: stats?.approvedDcListings || 0 },
    { name: 'Pending DC', value: stats?.pendingDcListings || 0 },
    { name: 'Approved GPU', value: stats?.approvedGpuClusters || 0 },
    { name: 'GPU Demands', value: stats?.totalGpuDemands || 0 },
    { name: 'DC Requests', value: stats?.totalDcRequests || 0 },
  ];

  const summaryRows = [
    { label: 'Approved Suppliers', value: stats?.totalSuppliers },
    { label: 'Approved Customers', value: stats?.totalCustomers },
    { label: 'Approved DC Listings', value: stats?.approvedDcListings },
    { label: 'Pending DC Listings', value: stats?.pendingDcListings },
    { label: 'Approved GPU Listings', value: stats?.approvedGpuClusters },
    { label: 'Total Approved MW', value: `${stats?.totalApprovedMw || 0} MW` },
    { label: 'GPU Demands', value: stats?.totalGpuDemands },
    { label: 'DC Requests', value: stats?.totalDcRequests },
    { label: 'Pending Queue Items', value: stats?.pendingQueue },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-[var(--color-text-secondary)]">Platform overview — suppliers, listings, queue, and analytics</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-[var(--radius-md)] w-fit mb-6">
        <button
          onClick={() => setTab('workspace')}
          className={`px-4 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-all ${
            tab === 'workspace'
              ? 'bg-white shadow-sm text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Workspace
        </button>
        <button
          onClick={() => setTab('analytics')}
          className={`px-4 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-all ${
            tab === 'analytics'
              ? 'bg-white shadow-sm text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Analytics
        </button>
      </div>

      {tab === 'workspace' && (
        <>
          {/* KPI Row 1 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <MetricCard icon={ClipboardList} label="Pending Queue" value={stats?.pendingQueue} sub="Awaiting review" color="text-blue-500" iconBg="bg-blue-50" to="/admin/queue" />
            <MetricCard icon={Building2} label="Approved Suppliers" value={stats?.totalSuppliers} sub="Active on platform" color="text-green-500" iconBg="bg-green-50" to="/admin/suppliers" />
            <MetricCard icon={Users} label="Approved Customers" value={stats?.totalCustomers} sub="Active on platform" color="text-yellow-500" iconBg="bg-yellow-50" to="/admin/customers" />
            <MetricCard icon={TrendingUp} label="Total Approved MW" value={stats?.totalApprovedMw ? `${stats.totalApprovedMw} MW` : '0 MW'} sub="Across all DC listings" color="text-purple-500" iconBg="bg-purple-50" />
          </div>

          {/* KPI Row 2 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <MetricCard icon={CheckCircle} label="DC Listings (Approved)" value={stats?.approvedDcListings} color="text-blue-500" iconBg="bg-blue-50" to="/admin/dc-listings" />
            <MetricCard icon={Clock} label="DC Listings (Pending)" value={stats?.pendingDcListings} color="text-yellow-500" iconBg="bg-yellow-50" to="/admin/dc-listings" />
            <MetricCard icon={Server} label="GPU Listings (Approved)" value={stats?.approvedGpuClusters} color="text-green-500" iconBg="bg-green-50" to="/admin/gpu-clusters" />
            <MetricCard icon={Zap} label="GPU Demands" value={stats?.totalGpuDemands} color="text-orange-500" iconBg="bg-orange-50" to="/admin/gpu-demands" />
          </div>

          {/* Review Queue */}
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Review Queue</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">All pending review items awaiting action</p>
            </div>
            {queueItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No items in queue</p>
            ) : (
              <DataTable columns={queueColumns} data={queueItems} />
            )}
          </Card>
        </>
      )}

      {tab === 'analytics' && (
        <>
          {/* KPI Row 1 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <MetricCard icon={ClipboardList} label="Pending Queue" value={stats?.pendingQueue} sub="Awaiting review" color="text-blue-500" iconBg="bg-blue-50" />
            <MetricCard icon={Building2} label="Approved Suppliers" value={stats?.totalSuppliers} sub="Active on platform" color="text-green-500" iconBg="bg-green-50" />
            <MetricCard icon={Users} label="Approved Customers" value={stats?.totalCustomers} sub="Active on platform" color="text-yellow-500" iconBg="bg-yellow-50" />
            <MetricCard icon={TrendingUp} label="Total Approved MW" value={stats?.totalApprovedMw ? `${stats.totalApprovedMw} MW` : '0 MW'} sub="Across all DC listings" color="text-purple-500" iconBg="bg-purple-50" />
          </div>

          {/* KPI Row 2 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <MetricCard icon={CheckCircle} label="DC Listings (Approved)" value={stats?.approvedDcListings} color="text-blue-500" iconBg="bg-blue-50" />
            <MetricCard icon={Clock} label="DC Listings (Pending)" value={stats?.pendingDcListings} color="text-yellow-500" iconBg="bg-yellow-50" />
            <MetricCard icon={Server} label="GPU Listings (Approved)" value={stats?.approvedGpuClusters} color="text-green-500" iconBg="bg-green-50" />
            <MetricCard icon={Zap} label="GPU Demands" value={stats?.totalGpuDemands} color="text-orange-500" iconBg="bg-orange-50" />
          </div>

          {/* Charts */}
          <div className="mb-2">
            <h2 className="text-lg font-bold mb-1">Platform Analytics</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">Platform-wide activity overview</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="font-semibold text-sm">Listings Overview</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={listingsChartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {listingsChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="font-semibold text-sm">Platform Activity Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="font-semibold text-sm">Platform Participants & Requests</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={participantsChartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {participantsChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="font-semibold text-sm">Summary</h3>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {summaryRows.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-[var(--color-text-secondary)]">{label}</span>
                    <span className="font-semibold">{value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
