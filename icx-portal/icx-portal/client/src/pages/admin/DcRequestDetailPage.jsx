import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const Field = ({ label, value }) => (<div><dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt><dd className="text-sm">{value || '—'}</dd></div>);

export default function DcRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [request, setRequest] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/dc-requests/${id}`),
      api.get('/admin/dc-listings?status=APPROVED'),
    ]).then(([r, l]) => {
      setRequest(r.data);
      setListings(l.data.data || l.data);
      setSelected(r.data.matchedListingIds?.map((m) => m._id || m) || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const match = async () => {
    setMatching(true);
    try {
      await api.put(`/admin/dc-requests/${id}/match`, { listingIds: selected });
      addToast({ type: 'success', message: 'DC request matched with listings' });
      navigate('/admin/dc-requests');
    } catch (err) {
      addToast({ type: 'error', message: 'Match failed' });
    } finally {
      setMatching(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!request) return <div className="text-center py-20">Not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">DC Request — {request.companyName}</h1>
        <Button variant="ghost" onClick={() => navigate('/admin/dc-requests')}>Back</Button>
      </div>
      <Card>
        <h2 className="font-semibold mb-4">Request Details</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Company" value={request.companyName} />
          <Field label="Country" value={request.country} />
          <Field label="Required Power" value={request.requiredPowerMw ? `${request.requiredPowerMw} MW` : null} />
          <Field label="DC Tier" value={request.dcTierRequirement} />
          <Field label="Business Model" value={request.businessModel} />
          <Field label="Timeline" value={request.timelineGoLive} />
          <Field label="Budget Range" value={request.budgetRange} />
          <Field label="Preferred Location" value={request.preferredLocation} />
        </dl>
      </Card>
      <Card>
        <h2 className="font-semibold mb-4">Match with DC Listings</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {listings.map((l) => (
            <label key={l._id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={selected.includes(l._id)} onChange={() => setSelected((p) => p.includes(l._id) ? p.filter((x) => x !== l._id) : [...p, l._id])} />
              <div>
                <p className="text-sm font-medium">{l.companyLegalEntity}</p>
                <p className="text-xs text-gray-500">{l.companyCountry}</p>
              </div>
            </label>
          ))}
        </div>
        <Button onClick={match} loading={matching} disabled={selected.length === 0} className="mt-4">
          Save Matching ({selected.length} selected)
        </Button>
      </Card>
    </div>
  );
}
