import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Topbar />
      <Sidebar role={user?.role} />
      <main
        className="pt-[var(--topbar-height)] pl-[var(--sidebar-width)]"
        style={{ minHeight: '100vh' }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
