import { useState, useEffect, useContext } from 'react';
import { Building2, Download, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import PhoneInput from '../../components/ui/PhoneInput';
import { AuthContext } from '../../context/AuthContext';

export default function SupplierSettingsPage() {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    api.get('/supplier/profile')
      .then((r) => setProfile(r.data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load profile' }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { contactEmail, contactNumber, vendorType, mandateStatus, ndaRequired, ndaSigned } = profile;
      await api.put('/supplier/profile', { contactEmail, contactNumber, vendorType, mandateStatus, ndaRequired, ndaSigned });
      addToast({ type: 'success', message: 'Profile updated' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await api.get('/account/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `icx-data-export-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Data exported' });
    } catch {
      addToast({ type: 'error', message: 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  const deactivateAccount = async () => {
    setDeactivating(true);
    try {
      await api.post('/account/deactivate');
      addToast({ type: 'success', message: 'Account deactivated' });
      logout();
    } catch {
      addToast({ type: 'error', message: 'Deactivation failed' });
      setDeactivating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage your organization profile and account</p>
      </div>

      {/* Account Info */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Role</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">KYC Status</p>
            <Badge status={profile?.status} />
          </div>
        </div>
      </Card>

      {/* Organization Profile */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Organization Profile</h2>
        <div className="space-y-4">
          <Input
            label="Contact Email"
            type="email"
            value={profile?.contactEmail || ''}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
          />
          <PhoneInput
            label="Contact Number"
            value={profile?.contactNumber || ''}
            onChange={(e) => handleChange('contactNumber', e.target.value)}
            name="contactNumber"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">Vendor Type</label>
              <select
                className="h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm bg-white"
                value={profile?.vendorType || ''}
                onChange={(e) => handleChange('vendorType', e.target.value)}
              >
                <option value="">Select...</option>
                {['Operator', 'Developer', 'Landlord', 'Broker', 'Advisor', 'Other Intermediary'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">Mandate Status</label>
              <select
                className="h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm bg-white"
                value={profile?.mandateStatus || ''}
                onChange={(e) => handleChange('mandateStatus', e.target.value)}
              >
                <option value="">Select...</option>
                {['Exclusive', 'Non-exclusive', 'Direct', 'Unknown'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={profile?.ndaRequired || false}
                onChange={(e) => handleChange('ndaRequired', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">NDA Required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={profile?.ndaSigned || false}
                onChange={(e) => handleChange('ndaSigned', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">NDA Signed</span>
            </label>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Data & Privacy</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Download a copy of all your data or deactivate your account.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportData} loading={exporting}>
            <Download className="w-4 h-4" /> Export My Data
          </Button>
          <Button variant="danger" onClick={() => setShowDeactivate(true)}>
            <AlertTriangle className="w-4 h-4" /> Deactivate Account
          </Button>
        </div>
      </Card>

      <Modal open={showDeactivate} onClose={() => setShowDeactivate(false)} title="Deactivate Account">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          This will deactivate your account and log you out. You will no longer be able to access the platform. Contact support to reactivate.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeactivate(false)}>Cancel</Button>
          <Button variant="danger" onClick={deactivateAccount} loading={deactivating}>Confirm Deactivation</Button>
        </div>
      </Modal>
    </div>
  );
}
