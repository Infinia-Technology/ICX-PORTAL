import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function KycWaitingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <Card elevated className="w-full max-w-md text-center">
        <CheckCircle className="w-14 h-14 mx-auto text-[var(--color-success)] mb-4" />
        <h1 className="text-2xl font-bold mb-2">Registration Submitted</h1>
        <p className="text-[var(--color-text-secondary)] mb-2">
          Your profile has been submitted for review. Our team will be in touch once it has been verified.
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          In the meantime, you can start filling in your listings — use the <strong>DC Listings</strong> or <strong>GPU Listings</strong> links in the sidebar.
        </p>
        <div className="inline-block px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold mb-4">
          Submitted
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">
          Registered as: <strong>{user?.email}</strong>
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/supplier/dc-listings">
            <Button className="w-full">
              Go to DC Listings <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/supplier/gpu-clusters">
            <Button variant="secondary" className="w-full">
              Go to GPU Listings <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
