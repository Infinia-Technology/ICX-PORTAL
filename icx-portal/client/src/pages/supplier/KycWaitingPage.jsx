import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Clock } from 'lucide-react';

export default function KycWaitingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <Card elevated className="w-full max-w-md text-center">
        <Clock className="w-16 h-16 mx-auto text-[var(--color-warning)] mb-4" />
        <h1 className="text-2xl font-bold mb-2">Account Under Review</h1>
        <p className="text-[var(--color-text-secondary)] mb-4">
          Your KYC application is being reviewed by our admin team.
          You'll receive an email once your account has been verified.
        </p>
        <Badge status={user?.organizationStatus || 'KYC_SUBMITTED'} />
        <p className="text-sm text-[var(--color-text-muted)] mt-4">
          Registered as: <strong>{user?.email}</strong>
        </p>
      </Card>
    </div>
  );
}
