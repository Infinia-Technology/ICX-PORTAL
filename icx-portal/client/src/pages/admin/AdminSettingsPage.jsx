import { useContext } from 'react';
import { Settings, Shield, Download, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { AuthContext } from '../../context/AuthContext';

export default function AdminSettingsPage() {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const isSuperadmin = user?.role === 'superadmin';

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Platform configuration and administration</p>
      </div>

      {/* Account Info */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-semibold">Your Account</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Role</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-semibold">Administration</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {isSuperadmin && (
            <Link to="/admin/users" className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-gray-50 transition-colors">
              <Users className="w-5 h-5 text-[var(--color-primary)]" />
              <div>
                <p className="font-medium">User Management</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Create, update, and manage user roles and access</p>
              </div>
            </Link>
          )}
          {isSuperadmin && (
            <Link to="/admin/audit-log" className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-gray-50 transition-colors">
              <Shield className="w-5 h-5 text-[var(--color-primary)]" />
              <div>
                <p className="font-medium">Audit Log</p>
                <p className="text-sm text-[var(--color-text-secondary)]">View all system actions and state transitions</p>
              </div>
            </Link>
          )}
          <Link to="/admin/readers" className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-gray-50 transition-colors">
            <Users className="w-5 h-5 text-[var(--color-primary)]" />
            <div>
              <p className="font-medium">Reader Management</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Provision and manage reader accounts</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Platform Info */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Platform Info</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Platform</span>
            <span className="font-medium">ICX Portal</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Version</span>
            <span className="font-medium">3.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Environment</span>
            <span className="font-medium capitalize">{import.meta.env.MODE}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
