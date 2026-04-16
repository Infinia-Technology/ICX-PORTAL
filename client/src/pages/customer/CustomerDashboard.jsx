import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { Eye, Zap, Database, Construction, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
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

function CustomerAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/customer/analytics')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!stats) return <div className="text-center py-20 text-gray-400">Failed to load analytics</div>;

  const gpuData = [
    { name: 'Total', value: stats.totalGpuDemands || 0 },
    { name: 'New', value: stats.newGpuDemands || 0 },
    { name: 'Closed', value: stats.closedGpuDemands || 0 },
  ];

  const dcData = [
    { name: 'Total', value: stats.totalDcRequests || 0 },
    { name: 'New', value: stats.newDcRequests || 0 },
    { name: 'Closed', value: stats.closedDcRequests || 0 },
  ];

  const pieData = [
    { name: 'GPU Demands (New)', value: stats.newGpuDemands || 0 },
    { name: 'GPU Demands (Closed)', value: stats.closedGpuDemands || 0 },
    { name: 'DC Requests (New)', value: stats.newDcRequests || 0 },
    { name: 'DC Requests (Closed)', value: stats.closedDcRequests || 0 },
  ];

  return (
    <div>
      {/* GPU Demands */}
      <div className="mb-3">
        <h2 className="text-base font-semibold mb-3">GPU Demands</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Zap} label="Total" value={stats.totalGpuDemands} color="text-blue-500" iconBg="bg-blue-50" />
          <StatCard icon={CheckCircle} label="New / Open" value={stats.newGpuDemands} color="text-green-500" iconBg="bg-green-50" />
          <StatCard icon={XCircle} label="Closed" value={stats.closedGpuDemands} color="text-gray-500" iconBg="bg-gray-100" />
        </div>
      </div>

      {/* DC Requests */}
      <div className="mb-6">
        <h2 className="text-base font-semibold mb-3">DC Requests</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Database} label="Total" value={stats.totalDcRequests} color="text-purple-500" iconBg="bg-purple-50" />
          <StatCard icon={CheckCircle} label="New / Open" value={stats.newDcRequests} color="text-green-500" iconBg="bg-green-50" />
          <StatCard icon={XCircle} label="Closed" value={stats.closedDcRequests} color="text-gray-500" iconBg="bg-gray-100" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <h3 className="font-semibold text-sm">GPU Demands</h3>
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
            <h3 className="font-semibold text-sm">DC Requests</h3>
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
            <h3 className="font-semibold text-sm">Activity Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, name) => [v, name]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">
        Welcome back{user?.email ? `, ${user.email}` : ''}
      </h1>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6">Your customer portal overview</p>

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
          <div className="relative">
            <Card elevated className="opacity-60 cursor-not-allowed">
              <Eye className="w-8 h-8 text-[var(--color-info)] mb-3" />
              <h3 className="font-semibold">Marketplace</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Browse DC and GPU listings</p>
            </Card>
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
              <Construction className="w-3 h-3" /> Coming Soon
            </span>
          </div>

          <Link to="/customer/gpu-demands">
            <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
              <Zap className="w-8 h-8 text-[var(--color-success)] mb-3" />
              <h3 className="font-semibold">GPU Demands</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Submit GPU capacity requests</p>
            </Card>
          </Link>

          <Link to="/customer/dc-requests">
            <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
              <Database className="w-8 h-8 text-[var(--color-warning)] mb-3" />
              <h3 className="font-semibold">DC Requests</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Request data center capacity</p>
            </Card>
          </Link>
        </div>
      )}

      {tab === 'analytics' && <CustomerAnalytics />}
    </div>
  );
}
