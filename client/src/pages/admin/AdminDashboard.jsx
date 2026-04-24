import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { ClipboardList, Building2, Users, Server, Zap, Database, CheckCircle, Clock } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, to }) => {
  const content = (
    <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
      <Icon className={`w-8 h-8 ${color} mb-3`} />
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">{label}</p>
    </Card>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

const QUEUE_STATUS_VARIANT = { NEW: 'warning', IN_REVIEW: 'info', APPROVED: 'success', REJECTED: 'error', RESUBMITTED: 'warning' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentQueue, setRecentQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics'),
      api.get('/admin/queue?limit=5'),
    ]).then(([analyticsRes, queueRes]) => {
      setStats(analyticsRes.data);
      setRecentQueue(queueRes.data.data || queueRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <Card className="bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>How to add new listings:</strong> Navigate to <strong>DC Listings</strong> or <strong>GPU Capacity Listings</strong> in the sidebar to review supplier submissions. Suppliers create and submit their own listings for your approval.
          </p>
        </Card>
      </div>

      {/* KPI Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={ClipboardList} label="Pending Queue" value={stats?.pendingQueue} color="text-[var(--color-info)]" to="/admin/queue" />
        <StatCard icon={Building2} label="Approved Suppliers" value={stats?.totalSuppliers} color="text-[var(--color-success)]" to="/admin/suppliers" />
        <StatCard icon={Users} label="Approved Customers" value={stats?.totalCustomers} color="text-[var(--color-warning)]" to="/admin/customers" />
        <StatCard icon={CheckCircle} label="Approved MW (Total)" value={stats?.totalApprovedMw ? `${stats.totalApprovedMw} MW` : '0 MW'} color="text-purple-500" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Building2} label="DC Listings (Approved)" value={stats?.approvedDcListings} color="text-[var(--color-info)]" to="/admin/dc-listings" />
        <StatCard icon={Clock} label="DC Listings (Pending)" value={stats?.pendingDcListings} color="text-yellow-500" to="/admin/dc-listings" />
        <StatCard icon={Server} label="GPU Capacity Listings (Approved)" value={stats?.approvedGpuClusters} color="text-[var(--color-success)]" to="/admin/gpu-clusters" />
        <StatCard icon={Zap} label="GPU Requests" value={stats?.totalGpuDemands} color="text-orange-500" to="/admin/gpu-demands" />
      </div>

      {/* Recent Queue + Quick Links */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Queue Items</h3>
            <Link to="/admin/queue" className="text-xs text-[var(--color-primary)] hover:underline">View All</Link>
          </div>
          {recentQueue.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No items in queue</p>
          ) : (
            <div className="space-y-2">
              {recentQueue.map((q) => (
                <Link key={q._id} to={`/admin/queue/${q._id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-[var(--radius-md)] hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{q.type?.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-gray-400">{new Date(q.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={QUEUE_STATUS_VARIANT[q.status] || 'default'}>{q.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Link to="/admin/queue">
            <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
              <h3 className="font-semibold mb-2">Review Queue</h3>
              <p className="text-[var(--color-text-secondary)] text-sm">{stats?.pendingQueue || 0} items awaiting review</p>
            </Card>
          </Link>
          <Link to="/admin/dc-requests">
            <Card elevated className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
              <h3 className="font-semibold mb-2">DC Requests</h3>
              <p className="text-[var(--color-text-secondary)] text-sm">{stats?.totalDcRequests || 0} total DC capacity requests</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
