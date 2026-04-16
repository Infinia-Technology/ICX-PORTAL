// Reuse the same form as the supplier version but navigate to customer dashboard
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import TextArea from '../../components/ui/TextArea';
import { useToast } from '../../components/ui/Toast';
import LocationInput from '../../components/ui/LocationInput';

export default function DcRequestNewPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ companyName: '', country: '', requiredPowerMw: '', preferredLocation: '', dcTierRequirement: '', businessModel: '', sovereigntyReqs: '', complianceReqs: '', timelineGoLive: '', contractLength: '', budgetRange: '', coolingRequirements: '', connectivityReqs: '', otherComments: '' });
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (asDraft = false) => {
    setSubmitting(true);
    try {
      const res = await api.post('/dc-requests', form);
      if (!asDraft) await api.post(`/dc-requests/${res.data._id}/submit`);
      addToast({ type: 'success', message: asDraft ? 'Saved as draft' : 'DC request submitted!' });
      navigate('/customer/dc-requests');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Submit DC Capacity Request</h1>
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Company Name *" name="companyName" value={form.companyName} onChange={update} />
          <Input label="Country *" name="country" value={form.country} onChange={update} />
          <Input label="Required Power (MW) *" name="requiredPowerMw" value={form.requiredPowerMw} onChange={update} />
          <Input label="Timeline Go-Live *" name="timelineGoLive" value={form.timelineGoLive} onChange={update} />
          <LocationInput label="Preferred Location (Google Maps)" name="preferredLocation" value={form.preferredLocation} onChange={update} />
          <Select label="DC Tier Requirement" name="dcTierRequirement" value={form.dcTierRequirement} onChange={update} options={['', 'Tier I', 'Tier II', 'Tier III', 'Tier IV'].map((o) => ({ value: o, label: o || 'Select...' }))} />
          <Select label="Business Model" name="businessModel" value={form.businessModel} onChange={update} options={['', 'Colocation (Wholesale/Retail)', 'Powered Shell', 'Build-to-Suit'].map((o) => ({ value: o, label: o || 'Select...' }))} />
          <Input label="Contract Length" name="contractLength" value={form.contractLength} onChange={update} />
          <Input label="Budget Range" name="budgetRange" value={form.budgetRange} onChange={update} />
          <TextArea label="Other Comments" name="otherComments" value={form.otherComments} onChange={update} className="sm:col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => submit(true)} loading={submitting}>Save Draft</Button>
          <Button onClick={() => submit(false)} loading={submitting}>Submit Request</Button>
        </div>
      </Card>
    </div>
  );
}
