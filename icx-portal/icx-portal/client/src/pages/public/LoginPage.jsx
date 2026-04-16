import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import OtpRequestForm from '../../components/auth/OtpRequestForm';
import OtpVerifyForm from '../../components/auth/OtpVerifyForm';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_DASHBOARDS } from '../../config/constants';

export default function LoginPage() {
  const [step, setStep] = useState('email'); // email | otp
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleOtpSent = (email) => {
    setEmail(email);
    setStep('otp');
  };

  const handleVerified = (data) => {
    if (data.registered && data.token) {
      login(data.token, data.user);
      const redirect = ROLE_DASHBOARDS[data.user.role] || '/';
      navigate(redirect, { replace: true });
    } else {
      // New user — send to registration
      navigate('/register/supplier', { state: { email: data.email } });
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <Card elevated className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Welcome to ICX</h1>
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
  );
}
