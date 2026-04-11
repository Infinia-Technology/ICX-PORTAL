import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import TextArea from '../../components/ui/TextArea';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import PhoneInput from '../../components/ui/PhoneInput';

export default function DcListingEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [app, setApp] = useState(null);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    api.get(`/dc-applications/${id}`).then((r) => {
      setApp(r.data);
      setSite(r.data.sites?.[0] || null);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/dc-applications/${id}`, {
        companyLegalEntity: app.companyLegalEntity, companyOfficeAddress: app.companyOfficeAddress,
        companyCountry: app.companyCountry, contactName: app.contactName,
        contactEmail: app.contactEmail, contactMobile: app.contactMobile,
      });
      if (site?._id) {
        await api.put(`/dc-applications/${id}/sites/${site._id}`, site);
      }
      addToast({ type: 'success', message: 'Saved successfully' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const resubmit = async () => {
    setResubmitting(true);
    try {
      await save();
      await api.post(`/dc-applications/${id}/resubmit`);
      addToast({ type: 'success', message: 'Resubmitted for review' });
      navigate(`/supplier/dc-listings/${id}`);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to resubmit' });
    } finally {
      setResubmitting(false);
    }
  };

  const updateApp = (e) => setApp((p) => ({ ...p, [e.target.name]: e.target.value }));
  const updateSite = (e) => setSite((p) => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!app) return <div className="text-center py-20">Not found</div>;

  const flagged = site?.flaggedFields || [];
  const highlight = (field) => flagged.includes(field) ? 'ring-2 ring-yellow-400' : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit DC Listing</h1>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={save} loading={saving}>Save Draft</Button>
          {app.status === 'REVISION_REQUESTED' && (
            <Button onClick={resubmit} loading={resubmitting}>Resubmit for Review</Button>
          )}
        </div>
      </div>

      {flagged.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm text-yellow-800">
          <strong>Revision requested</strong> — fields highlighted in yellow require updates.
        </div>
      )}

      <Card>
        <h2 className="font-semibold mb-4">Company Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Company Legal Entity" name="companyLegalEntity" value={app.companyLegalEntity || ''} onChange={updateApp} className={highlight('companyLegalEntity')} />
          <Input label="Office Address" name="companyOfficeAddress" value={app.companyOfficeAddress || ''} onChange={updateApp} className={highlight('companyOfficeAddress')} />
          <Input label="Country" name="companyCountry" value={app.companyCountry || ''} onChange={updateApp} />
          <Input label="Contact Name" name="contactName" value={app.contactName || ''} onChange={updateApp} className={highlight('contactName')} />
          <Input label="Contact Email" name="contactEmail" value={app.contactEmail || ''} onChange={updateApp} className={highlight('contactEmail')} />
          <PhoneInput label="Contact Mobile" name="contactMobile" value={app.contactMobile || ''} onChange={updateApp} className={highlight('contactMobile')} />
        </div>
      </Card>

      {site && (
        <Card>
          <h2 className="font-semibold mb-4">Site: {site.siteName}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Site Name" name="siteName" value={site.siteName || ''} onChange={updateSite} className={highlight('siteName')} />
            <Input label="Address" name="address" value={site.address || ''} onChange={updateSite} className={highlight('address')} />
            <Input label="Country" name="country" value={site.country || ''} onChange={updateSite} />
            <Input label="State/Region" name="stateRegion" value={site.stateRegion || ''} onChange={updateSite} />
            <Input label="Total IT Load (MW)" name="totalItLoadMw" type="number" value={site.totalItLoadMw || ''} onChange={updateSite} className={highlight('totalItLoadMw')} />
            <Input label="Design PUE" name="designPue" type="number" step="0.01" value={site.designPue || ''} onChange={updateSite} className={highlight('designPue')} />
            <TextArea label="Remarks" name="remarks" value={site.remarks || ''} onChange={updateSite} className="sm:col-span-2" />
          </div>
        </Card>
      )}
    </div>
  );
}
