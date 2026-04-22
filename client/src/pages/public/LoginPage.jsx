import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import OtpRequestForm from '../../components/auth/OtpRequestForm';
import OtpVerifyForm from '../../components/auth/OtpVerifyForm';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_DASHBOARDS } from '../../config/constants';

export default function LoginPage() {
  const [step, setStep] = useState('email'); // email | otp | not-found
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleOtpSent = (sentEmail) => {
    setEmail(sentEmail);
    setStep('otp');
  };

  const handleVerified = (data) => {
    if (data.registered && data.token) {
      login(data.token, data.user);
      const supplierRoles = ['supplier', 'broker', 'subordinate'];
      const pendingOrgStatuses = ['SUBMITTED', 'PENDING', 'REVISION_REQUESTED', 'REJECTED'];
      if (supplierRoles.includes(data.user.role) && pendingOrgStatuses.includes(data.user.org_status)) {
        navigate('/supplier/kyc-waiting', { replace: true });
      } else {
        const redirect = ROLE_DASHBOARDS[data.user.role] || '/';
        navigate(redirect, { replace: true });
      }
    } else {
      // No account found — let user choose registration type
      setStep('not-found');
    }
  };

  if (step === 'not-found') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="w-full max-w-md">
          <Card elevated className="w-full">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold">No Account Found</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                No account exists for <strong>{email}</strong>.
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-3">
                Access is by invitation only. Please contact your administrator or visit the client portal to register.
              </p>
            </div>
            <button
              onClick={() => setStep('email')}
              className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-gray-50 transition-colors"
            >
              Try a different email
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Infrastructure Capacity Registry</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-3">
            Submit available capacity or sourcing requirements. Our team handles the rest.
          </p>
        </div>

        <Card elevated className="w-full">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold">Access Your Account</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {step === 'email'
                ? 'Enter your email to receive a verification code'
                : 'Check your email for the verification code'
              }
            </p>
          </div>

          {step === 'email' ? (
            <OtpRequestForm onOtpSent={handleOtpSent} />
          ) : (
            <OtpVerifyForm
              email={email}
              onVerified={handleVerified}
              onBack={() => setStep('email')}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
