import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import { Eye, Zap, Database, Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Welcome back{user?.email ? `, ${user.email}` : ''}
      </h1>

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
    </div>
  );
}
