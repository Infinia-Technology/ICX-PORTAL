import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import Button from '../../components/ui/Button';
import OtpRequestForm from '../../components/auth/OtpRequestForm';
import OtpVerifyForm from '../../components/auth/OtpVerifyForm';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import {
  COMPANY_TYPES, JURISDICTIONS, PRIMARY_USE_CASES,
  LOCATION_PREFERENCES, SOVEREIGNTY_REQS, COMPLIANCE_REQS,
  BUDGET_RANGES, URGENCY_OPTIONS,
} from '../../config/constants';

export default function CustomerRegisterPage() {
  const location = useLocation();
  const prefilledEmail = location.state?.email || '';
  const [step, setStep] = useState(prefilledEmail ? 'form' : 'email');
  const [email, setEmail] = useState(prefilledEmail);
  const { login } = useAuth();
  const { loading, post } = useApi();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: '', companyType: '', jurisdiction: '', industrySector: '',
    taxVatNumber: '', companyAddress: '', website: '',
    authSignatoryName: '', authSignatoryTitle: '',
    billingContactName: '', billingContactEmail: '',
    primaryUseCases: [], locationPreferences: [], sovereigntyReqs: [],
    complianceReqs: [], budgetRange: '', urgency: '',
  });
  const [errors, setErrors] = useState({});

  const handleOtpSent = (email) => { setEmail(email); setStep('otp'); };
  const handleVerified = (data) => {
    if (data.registered) { login(data.token, data.user); navigate('/customer/dashboard', { replace: true }); return; }
    setEmail(data.email);
    setForm((f) => ({ ...f, billingContactEmail: data.email }));
    setStep('form');
  };

  const updateField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    const required = ['companyName', 'companyType', 'jurisdiction', 'industrySector', 'taxVatNumber', 'companyAddress', 'authSignatoryName', 'authSignatoryTitle', 'billingContactName', 'billingContactEmail'];
    required.forEach((f) => { if (!form[f]) errs[f] = 'Required'; });
    if (!form.primaryUseCases.length) errs.primaryUseCases = 'Select at least one';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const data = await post('/auth/register/customer', { ...form, email });
      login(data.token, data.user);
      navigate('/customer/dashboard', { replace: true });
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Registration failed' });
    }
  };

  if (step === 'email') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <Card elevated className="w-full max-w-md">
          {/* Role toggle */}
          <div className="flex border border-[var(--color-border)] rounded-lg overflow-hidden mb-6">
            <a href="/register/supplier" className="flex-1 px-4 py-2.5 text-sm font-medium text-center text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors">
              I Have Infrastructure
            </a>
            <div className="flex-1 px-4 py-2.5 text-sm font-semibold text-center bg-[var(--color-primary)] text-white">
              I Want Infrastructure
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Customer Registration</h1>
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
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card elevated>
        <h1 className="text-2xl font-bold text-center mb-2">Complete Your Profile</h1>
        <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">Customer registration for <strong>{email}</strong></p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Company Name" value={form.companyName} onChange={(e) => updateField('companyName', e.target.value)} error={errors.companyName} required />
            <Select label="Company Type" options={COMPANY_TYPES} value={form.companyType} onChange={(e) => updateField('companyType', e.target.value)} error={errors.companyType} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Jurisdiction" options={JURISDICTIONS} value={form.jurisdiction} onChange={(e) => updateField('jurisdiction', e.target.value)} error={errors.jurisdiction} required />
            <Input label="Industry / Sector" value={form.industrySector} onChange={(e) => updateField('industrySector', e.target.value)} error={errors.industrySector} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Tax / VAT Number" value={form.taxVatNumber} onChange={(e) => updateField('taxVatNumber', e.target.value)} error={errors.taxVatNumber} required />
            <Input label="Website" type="url" value={form.website} onChange={(e) => updateField('website', e.target.value)} placeholder="https://..." />
          </div>
          <Input label="Company Address" value={form.companyAddress} onChange={(e) => updateField('companyAddress', e.target.value)} error={errors.companyAddress} required />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Authorised Signatory Name" value={form.authSignatoryName} onChange={(e) => updateField('authSignatoryName', e.target.value)} error={errors.authSignatoryName} required />
            <Input label="Authorised Signatory Title" value={form.authSignatoryTitle} onChange={(e) => updateField('authSignatoryTitle', e.target.value)} error={errors.authSignatoryTitle} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Billing Contact Name" value={form.billingContactName} onChange={(e) => updateField('billingContactName', e.target.value)} error={errors.billingContactName} required />
            <Input label="Billing Contact Email" type="email" value={form.billingContactEmail} onChange={(e) => updateField('billingContactEmail', e.target.value)} error={errors.billingContactEmail} required />
          </div>

          <Checkbox label="Primary Use Cases" options={PRIMARY_USE_CASES} value={form.primaryUseCases} onChange={(v) => updateField('primaryUseCases', v)} error={errors.primaryUseCases} required />
          <Checkbox label="Location Preferences" options={LOCATION_PREFERENCES} value={form.locationPreferences} onChange={(v) => updateField('locationPreferences', v)} />
          <Checkbox label="Sovereignty Requirements" options={SOVEREIGNTY_REQS} value={form.sovereigntyReqs} onChange={(v) => updateField('sovereigntyReqs', v)} />
          <Checkbox label="Compliance Requirements" options={COMPLIANCE_REQS} value={form.complianceReqs} onChange={(v) => updateField('complianceReqs', v)} />

          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Budget Range" options={BUDGET_RANGES} value={form.budgetRange} onChange={(e) => updateField('budgetRange', e.target.value)} />
            <Select label="Urgency" options={URGENCY_OPTIONS} value={form.urgency} onChange={(e) => updateField('urgency', e.target.value)} />
          </div>

          {errors.submit && <p className="text-sm text-[var(--color-error)] text-center">{errors.submit}</p>}

          <Button type="submit" loading={loading} className="w-full mt-2">Submit Registration</Button>
        </form>
      </Card>
    </div>
  );
}
