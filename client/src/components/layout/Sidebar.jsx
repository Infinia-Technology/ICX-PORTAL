import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Server, Users, ShieldCheck,
  Settings, Eye, Zap, Database, PackageOpen, Archive, FileSpreadsheet,
} from 'lucide-react';
import { ROLES } from '../../config/constants';

const navConfig = {
  [ROLES.SUPPLIER]: [
    { label: 'Dashboard', to: '/supplier/dashboard', icon: LayoutDashboard },
    { section: 'Questionnaires' },
    { label: 'DC Listings', to: '/supplier/dc-listings', icon: Building2 },
    { label: 'GPU Listings', to: '/supplier/gpu-clusters', icon: Server },
    { section: 'Database' },
    { label: 'GPU Requests', to: '/supplier/inventory', icon: PackageOpen },
    { section: null },
    { label: 'Team', to: '/supplier/team', icon: Users },
    { label: 'Settings', to: '/supplier/settings', icon: Settings },
  ],
  [ROLES.BROKER]: [
    { label: 'Dashboard', to: '/supplier/dashboard', icon: LayoutDashboard },
    { label: 'DC Listings', to: '/supplier/dc-listings', icon: Building2 },
    { label: 'GPU Listings', to: '/supplier/gpu-clusters', icon: Server },
    { label: 'GPU Requests', to: '/supplier/inventory', icon: PackageOpen },
    { label: 'Team', to: '/supplier/team', icon: Users },
    { label: 'Settings', to: '/supplier/settings', icon: Settings },
  ],
  [ROLES.CUSTOMER]: [
    { label: 'Dashboard', to: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'Marketplace', to: '/customer/marketplace', icon: Eye, comingSoon: true },
    { section: 'Database' },
    { label: 'GPU Demands', to: '/customer/gpu-demands', icon: Zap },
    { label: 'DC Requests', to: '/customer/dc-requests', icon: Database },
    { section: null },
    { label: 'Settings', to: '/customer/settings', icon: Settings },
  ],
  [ROLES.ADMIN]: [
    { label: 'Admin Workspace', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Suppliers', to: '/admin/suppliers', icon: Building2 },
    { section: 'Questionnaires' },
    { label: 'Customers', to: '/admin/customers', icon: Users },
    { label: 'DC Listings', to: '/admin/dc-listings', icon: Building2 },
    { label: 'GPU Listings', to: '/admin/gpu-clusters', icon: Server },
    { section: 'Database' },
    { label: 'GPU Requests', to: '/admin/inventory', icon: PackageOpen },
    { label: 'GPU Demands', to: '/admin/gpu-demands', icon: Zap },
    { label: 'DC Requests', to: '/admin/dc-requests', icon: Database },
    { section: null },
    { label: 'Archives', to: '/admin/archives', icon: Archive },
    { label: 'Reports', to: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
  [ROLES.SUPERADMIN]: [
    { label: 'Admin Workspace', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Audit Log', to: '/admin/audit-log', icon: ShieldCheck },
    { label: 'Suppliers', to: '/admin/suppliers', icon: Building2 },
    { section: 'Questionnaires' },
    { label: 'Customers', to: '/admin/customers', icon: Users },
    { label: 'DC Listings', to: '/admin/dc-listings', icon: Building2 },
    { label: 'GPU Listings', to: '/admin/gpu-clusters', icon: Server },
    { section: 'Database' },
    { label: 'GPU Requests', to: '/admin/inventory', icon: PackageOpen },
    { label: 'GPU Demands', to: '/admin/gpu-demands', icon: Zap },
    { label: 'DC Requests', to: '/admin/dc-requests', icon: Database },
    { section: null },
    { label: 'Archives', to: '/admin/archives', icon: Archive },
    { label: 'Reports', to: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
  [ROLES.READER]: [
    { label: 'Marketplace', to: '/reader/marketplace', icon: Eye },
  ],
  [ROLES.VIEWER]: [
    { label: 'Admin Workspace', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Marketplace', to: '/customer/marketplace', icon: Eye },
  ],
};

export default function Sidebar({ role }) {
  const items = navConfig[role] || [];

  return (
    <aside className="w-[var(--sidebar-width)] bg-[var(--color-surface)] border-r border-[var(--color-border)] h-[calc(100vh-var(--topbar-height))] overflow-y-auto fixed top-[var(--topbar-height)] left-0">
      <nav className="p-4 flex flex-col gap-1">
        {items.map((item, index) => {
          if (item.section !== undefined) {
            if (item.section) {
              return (
                <div key={`section-${index}`} className="pt-3 pb-1 px-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  {item.section}
                </div>
              );
            } else {
              return <div key={`section-${index}`} className="py-1" />;
            }
          }

          const Icon = item.icon;
          if (item.comingSoon) {
            return (
              <div
                key={item.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-gray-400 cursor-not-allowed opacity-60"
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold">Soon</span>
              </div>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-gray-100 hover:text-[var(--color-text)]'
                }
              `}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
