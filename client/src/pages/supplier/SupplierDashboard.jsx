import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { Building2, Server, FileText, CheckCircle, Clock, XCircle, Package, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import api from '../../lib/api';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ icon: Icon, label, value, color, iconBg }) => (
  <Card elevated>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
      </div>
      <div className={`p-2.5 rounded-[var(--radius-md)] ${iconBg || 'bg-gray-100'} shrink-0 ml-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </Card>
);

function SupplierAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/supplier/analytics')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!stats) return <div className="text-center py-20 text-gray-400">Failed to load analytics</div>;

  const dcData = [
    { name: 'Approved', value: stats.approvedDcListings || 0 },
    { name: 'Pending', value: stats.pendingDcListings || 0 },
    { name: 'Draft', value: stats.draftDcListings || 0 },
    { name: 'Rejected', value: stats.rejectedDcListings || 0 },
  ];

  const gpuData = [
    { name: 'Approved', value: stats.approvedGpuListings || 0 },
    { name: 'Pending', value: stats.pendingGpuListings || 0 },
    { name: 'Draft', value: stats.draftGpuListings || 0 },
  ];

  const inventoryData = [
    { name: 'Available', value: stats.availableInventory || 0 },
    { name: 'Reserved', value: stats.reservedInventory || 0 },
    { name: 'Sold', value: stats.soldInventory || 0 },
  ];

  return (
    <div>
      {/* DC Listings KPIs */}
      <div className="mb-3">
        <h2 className="text-base font-semibold mb-3">DC Listings</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard icon={Building2} label="Total" value={stats.totalDcListings} color="text-blue-500" iconBg="bg-blue-50" />
          <StatCard icon={CheckCircle} label="Approved" value={stats.approvedDcListings} color="text-green-500" iconBg="bg-green-50" />
          <StatCard icon={Clock} label="Pending" value={stats.pendingDcListings} color="text-yellow-500" iconBg="bg-yellow-50" />
          <StatCard icon={FileText} label="Draft" value={stats.draftDcListings} color="text-gray-500" iconBg="bg-gray-100" />
          <StatCard icon={XCircle} label="Rejected" value={stats.rejectedDcListings} color="text-red-500" iconBg="bg-red-50" />
        </div>
      </div>

      {/* GPU Capacity Listings KPIs */}
      <div className="mb-3">
        <h2 className="text-base font-semibold mb-3">GPU Capacity Listings</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Server} label="Total" value={stats.totalGpuListings} color="text-purple-500" iconBg="bg-purple-50" />
          <StatCard icon={CheckCircle} label="Approved" value={stats.approvedGpuListings} color="text-green-500" iconBg="bg-green-50" />
          <StatCard icon={Clock} label="Pending" value={stats.pendingGpuListings} color="text-yellow-500" iconBg="bg-yellow-50" />
          <StatCard icon={FileText} label="Draft" value={stats.draftGpuListings} color="text-gray-500" iconBg="bg-gray-100" />
        </div>
      </div>

      {/* Inventory KPIs */}
      <div className="mb-6">
        <h2 className="text-base font-semibold mb-3">Inventory</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Package} label="Total" value={stats.totalInventory} color="text-cyan-500" iconBg="bg-cyan-50" />
          <StatCard icon={CheckCircle} label="Available" value={stats.availableInventory} color="text-green-500" iconBg="bg-green-50" />
          <StatCard icon={Clock} label="Reserved" value={stats.reservedInventory} color="text-yellow-500" iconBg="bg-yellow-50" />
          <StatCard icon={XCircle} label="Sold" value={stats.soldInventory} color="text-gray-500" iconBg="bg-gray-100" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <h3 className="font-semibold text-sm">DC Listings</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dcData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {dcData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <h3 className="font-semibold text-sm">GPU Capacity Listings</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gpuData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {gpuData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <h3 className="font-semibold text-sm">Inventory Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={inventoryData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {inventoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">
        Welcome back{user?.email ? `, ${user.email}` : ''}
      </h1>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6">Your supplier portal overview</p>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-[var(--radius-md)] w-fit mb-6">
        <button
          onClick={() => setTab('dashboard')}
          className={`px-4 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-all ${
            tab === 'dashboard'
              ? 'bg-white shadow-sm text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Dashboard
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

      {tab === 'dashboard' && (
        <div className="grid sm:grid-cols-3 gap-6">
          <Link to="/supplier/dc-listings">
            <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
              <Building2 className="w-8 h-8 text-[var(--color-info)] mb-3" />
              <h3 className="font-semibold">DC Listings</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your data center listings</p>
            </Card>
          </Link>

          <Link to="/supplier/gpu-clusters">
            <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
              <Server className="w-8 h-8 text-[var(--color-success)] mb-3" />
              <h3 className="font-semibold">GPU Capacity Listings</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage GPU compute listings</p>
            </Card>
          </Link>

          <Link to="/supplier/team">
            <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
              <FileText className="w-8 h-8 text-[var(--color-warning)] mb-3" />
              <h3 className="font-semibold">Team</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage team members</p>
            </Card>
          </Link>
        </div>
      )}

      {tab === 'analytics' && <SupplierAnalytics />}
    </div>
  );
}
