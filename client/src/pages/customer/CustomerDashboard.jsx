import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { Zap, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold mb-3">GPU Requests</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Zap} label="Total" value={stats.totalGpuDemands} color="text-blue-500" iconBg="bg-blue-50" />
          <StatCard icon={CheckCircle} label="New / Open" value={stats.newGpuDemands} color="text-green-500" iconBg="bg-green-50" />
          <StatCard icon={XCircle} label="Closed" value={stats.closedGpuDemands} color="text-gray-500" iconBg="bg-gray-100" />
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <h3 className="font-semibold text-sm">GPU Request Activity</h3>
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
        <div className="grid sm:grid-cols-2 gap-6">
          <Link to="/customer/gpu-demands">
            <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
              <Zap className="w-8 h-8 text-[var(--color-success)] mb-3" />
              <h3 className="font-semibold">GPU Requests</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Submit GPU capacity requests</p>
            </Card>
          </Link>
        </div>
      )}

      {tab === 'analytics' && <CustomerAnalytics />}
    </div>
  );
}
