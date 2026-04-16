import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ORG_STATUS, ROLE_DASHBOARDS } from '../../config/constants';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const dash = ROLE_DASHBOARDS[user.role] || '/login';
    return <Navigate to={dash} replace />;
  }

  return children;
}
