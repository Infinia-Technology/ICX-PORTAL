import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { CheckCircle, XCircle, Users } from 'lucide-react';

const ROLE_LABELS = {
  subordinate: 'Subordinate — can view and edit listings',
  viewer: 'Viewer — read-only access to listings',
};

export default function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    api.get(`/invites/${token}`)
      .then(r => setInvite(r.data))
      .catch(err => setError(err.response?.data?.error || 'Invalid or expired invite link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await api.post(`/invites/${token}/accept`, { name });
      setAccepted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept invite');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="mb-8 flex flex-col items-center gap-1">
        <img src="/logo.svg" alt="Infinia" className="h-8 w-auto" />
        <span className="text-xs font-medium tracking-wide text-[var(--color-text-secondary)]">Compute Exchange</span>
      </div>

      <Card className="w-full max-w-md">
        {/* Error state */}
        {error && !invite && (
          <div className="text-center py-6">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Invite</h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">{error}</p>
            <Link to="/login">
              <Button variant="secondary">Go to Login</Button>
            </Link>
          </div>
        )}

        {/* Success state */}
        {accepted && (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invite Accepted!</h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-1">
              You've joined <strong>{invite?.organizationName}</strong> as a <strong>{invite?.role}</strong>.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              Log in with <strong>{invite?.email}</strong> to get started.
            </p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </div>
        )}

        {/* Invite details */}
        {invite && !accepted && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight">You've been invited</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  by {invite.inviterEmail}
                </p>
              </div>
            </div>

            {/* Invite details card */}
            <div className="bg-[var(--color-bg)] rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Organization</span>
                <span className="font-medium">{invite.organizationName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Your email</span>
                <span className="font-medium">{invite.email}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-[var(--color-text-secondary)]">Role</span>
                <Badge variant="info">{invite.role}</Badge>
              </div>
              {invite.expiresAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Expires</span>
                  <span className="font-medium">{new Date(invite.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] mb-2">
              {ROLE_LABELS[invite.role] || invite.role}
            </p>

            <div className="space-y-4">
              <Input
                label="Your name (optional)"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
              />

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button
                className="w-full"
                onClick={handleAccept}
                loading={submitting}
              >
                Accept Invitation
              </Button>

              <p className="text-xs text-center text-[var(--color-text-secondary)]">
                After accepting, log in using your email{' '}
                <strong>{invite.email}</strong> via OTP.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
