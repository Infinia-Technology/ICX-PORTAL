import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import PhoneInput from '../../components/ui/PhoneInput';
import OtpRequestForm from '../../components/auth/OtpRequestForm';
import OtpVerifyForm from '../../components/auth/OtpVerifyForm';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { VENDOR_TYPES, MANDATE_STATUSES } from '../../config/constants';

export default function SupplierRegisterPage() {
  const location = useLocation();
  const prefilledEmail = location.state?.email || '';
  const [step, setStep] = useState(prefilledEmail ? 'form' : 'email');
  const [email, setEmail] = useState(prefilledEmail);
  const { login } = useAuth();
  const { loading, post } = useApi();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    vendorType: '',
    mandateStatus: '',
    contactNumber: '',
  });
  const [errors, setErrors] = useState({});

  const handleOtpSent = (email) => {
    setEmail(email);
    setStep('otp');
  };

  const handleVerified = (data) => {
    if (data.registered) {
      login(data.token, data.user);
      const pendingOrgStatuses = ['SUBMITTED', 'PENDING', 'REVISION_REQUESTED', 'REJECTED'];
      if (pendingOrgStatuses.includes(data.user?.org_status)) {
        navigate('/supplier/kyc-waiting', { replace: true });
      } else {
        navigate('/supplier/dashboard', { replace: true });
      }
      return;
    }
    setEmail(data.email);
    setStep('form');
  };

  const validate = () => {
    const errs = {};
    if (!form.vendorType) errs.vendorType = 'Required';
    if (!form.mandateStatus) errs.mandateStatus = 'Required';
    if (!form.contactNumber) errs.contactNumber = 'Required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      const data = await post('/auth/register/supplier', { ...form, email });
      login(data.token, data.user);
      navigate('/supplier/kyc-waiting', { replace: true });
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Registration failed' });
    }
  };

  const updateField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  if (step === 'email') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <Card elevated className="w-full max-w-md">
          {/* Role toggle */}
          <div className="flex border border-[var(--color-border)] rounded-lg overflow-hidden mb-6">
            <div className="flex-1 px-4 py-2.5 text-sm font-semibold text-center bg-[var(--color-primary)] text-white">
              I Have Infrastructure
            </div>
            <a href="/register/customer" className="flex-1 px-4 py-2.5 text-sm font-medium text-center text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors">
              I Want Infrastructure
            </a>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Supplier Registration</h1>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">Verify your email to get started</p>
          <OtpRequestForm onOtpSent={handleOtpSent} />
        </Card>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <Card elevated className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Verify Your Email</h1>
          <OtpVerifyForm email={email} onVerified={handleVerified} onBack={() => setStep('email')} />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <Card elevated className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-2">Complete Your Profile</h1>
        <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">
          KYC information for <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Vendor Type"
            options={VENDOR_TYPES}
            value={form.vendorType}
            onChange={(e) => updateField('vendorType', e.target.value)}
            error={errors.vendorType}
            required
          />
          <Select
            label="Mandate Status"
            options={MANDATE_STATUSES}
            value={form.mandateStatus}
            onChange={(e) => updateField('mandateStatus', e.target.value)}
            error={errors.mandateStatus}
            required
          />

          <PhoneInput
            label="Contact Number *"
            value={form.contactNumber}
            onChange={(e) => updateField('contactNumber', e.target.value)}
            name="contactNumber"
            error={errors.contactNumber}
          />

          {errors.submit && (
            <p className="text-sm text-[var(--color-error)] text-center">{errors.submit}</p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Submit Registration
          </Button>
        </form>
      </Card>
    </div>
  );
}
