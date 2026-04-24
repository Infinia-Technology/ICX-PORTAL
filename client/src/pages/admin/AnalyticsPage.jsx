import { useState, useEffect } from 'react';
import {
  Building2, Server, Users, Zap, Database, ClipboardList,
  CheckCircle, Clock, TrendingUp, BarChart2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <Card elevated>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-[var(--radius-md)] bg-opacity-10 ${color.replace('text-', 'bg-').replace(/-([\d]+)/, '-$1/10')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </Card>
);

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!stats) return <div className="text-center py-20 text-gray-400">Failed to load analytics</div>;

  const listingsData = [
    { name: 'DC Approved', value: stats.approvedDcListings || 0 },
    { name: 'DC Pending', value: stats.pendingDcListings || 0 },
    { name: 'GPU Approved', value: stats.approvedGpuClusters || 0 },
  ];

  const platformData = [
    { name: 'Suppliers', value: stats.totalSuppliers || 0 },
    { name: 'Customers', value: stats.totalCustomers || 0 },
    { name: 'GPU Requests', value: stats.totalGpuDemands || 0 },
    { name: 'DC Requests', value: stats.totalDcRequests || 0 },
  ];

  const pieData = [
    { name: 'Approved DC', value: stats.approvedDcListings || 0 },
    { name: 'Pending DC', value: stats.pendingDcListings || 0 },
    { name: 'Approved GPU', value: stats.approvedGpuClusters || 0 },
    { name: 'GPU Requests', value: stats.totalGpuDemands || 0 },
    { name: 'DC Requests', value: stats.totalDcRequests || 0 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Platform-wide activity overview</p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={ClipboardList}
          label="Pending Queue"
          value={stats.pendingQueue}
          color="text-blue-500"
          sub="Awaiting review"
        />
        <StatCard
          icon={Building2}
          label="Approved Suppliers"
          value={stats.totalSuppliers}
          color="text-green-500"
          sub="Active on platform"
        />
        <StatCard
          icon={Users}
          label="Approved Customers"
          value={stats.totalCustomers}
          color="text-yellow-500"
          sub="Active on platform"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Approved MW"
          value={stats.totalApprovedMw ? `${stats.totalApprovedMw} MW` : '0 MW'}
          color="text-purple-500"
          sub="Across all DC listings"
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={CheckCircle}
          label="DC Listings (Approved)"
          value={stats.approvedDcListings}
          color="text-blue-500"
        />
        <StatCard
          icon={Clock}
          label="DC Listings (Pending)"
          value={stats.pendingDcListings}
          color="text-yellow-500"
        />
        <StatCard
          icon={Server}
          label="GPU Capacity Listings (Approved)"
          value={stats.approvedGpuClusters}
          color="text-green-500"
        />
        <StatCard
          icon={Zap}
          label="GPU Requests"
          value={stats.totalGpuDemands}
          color="text-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart: listings breakdown */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <h2 className="font-semibold text-sm">Listings Overview</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={listingsData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {listingsData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie chart: platform activity */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <h2 className="font-semibold text-sm">Platform Activity Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [v, name]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar chart: platform participants */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <h2 className="font-semibold text-sm">Platform Participants & Requests</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={platformData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {platformData.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Summary table */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <h2 className="font-semibold text-sm">Summary</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {[
              { label: 'Approved Suppliers', value: stats.totalSuppliers },
              { label: 'Approved Customers', value: stats.totalCustomers },
              { label: 'Approved DC Listings', value: stats.approvedDcListings },
              { label: 'Pending DC Listings', value: stats.pendingDcListings },
              { label: 'Approved GPU Capacity Listings', value: stats.approvedGpuClusters },
              { label: 'Total Approved MW', value: `${stats.totalApprovedMw || 0} MW` },
              { label: 'GPU Requests', value: stats.totalGpuDemands },
              { label: 'DC Requests', value: stats.totalDcRequests },
              { label: 'Pending Queue Items', value: stats.pendingQueue },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[var(--color-text-secondary)]">{label}</span>
                <span className="font-semibold">{value ?? '—'}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
