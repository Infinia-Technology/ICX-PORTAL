import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import { Building2, Server, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SupplierDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Welcome back{user?.email ? `, ${user.email}` : ''}
      </h1>

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
            <h3 className="font-semibold">GPU Listings</h3>
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
    </div>
  );
}
