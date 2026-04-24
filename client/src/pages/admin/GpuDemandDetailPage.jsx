import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const Field = ({ label, value }) => (
  <div>
    <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt>
    <dd className="text-sm">{value || '—'}</dd>
  </div>
);

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', MATCHED: 'success', CLOSED: 'default' };

export default function GpuDemandDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [demand, setDemand] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/gpu-demands/${id}`),
      api.get('/admin/gpu-clusters?status=APPROVED'),
    ]).then(([d, c]) => {
      const specs = d.data.specifications || {};
      setDemand({ ...d.data, ...specs });
      setClusters(c.data.data || c.data);
      setSelected(d.data.matchedClusterIds?.map((m) => m._id || m) || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const match = async () => {
    setMatching(true);
    try {
      await api.put(`/admin/gpu-demands/${id}/match`, { clusterIds: selected });
      addToast({ type: 'success', message: 'Demand matched with clusters' });
      navigate('/admin/gpu-demands');
    } catch (err) {
      addToast({ type: 'error', message: 'Match failed' });
    } finally {
      setMatching(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!demand) return <div className="text-center py-20">Not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GPU Request — {demand.customer}</h1>
          {demand.status && <Badge variant={STATUS_VARIANT[demand.status]} className="mt-1">{demand.status}</Badge>}
        </div>
        <Button variant="ghost" onClick={() => navigate('/admin/gpu-demands')}>Back</Button>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">Client Identity</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Customer" value={demand.customer} />
          <Field label="Date of Entry" value={demand.dateOfEntry} />
          <Field label="Customer Country" value={demand.customerCountry} />
        </dl>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Technical Requirements</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Type of Technology" value={demand.typeOfTechnology} />
          <Field label="Cluster Size GPU #" value={demand.clusterSizeGpu} />
          <Field label="DC Tier (minimum)" value={demand.dcTierMinimum} />
          <Field label="Connectivity, Mbps" value={demand.connectivityMbps} />
          <Field label="Latency, ms" value={demand.latencyMs} />
          <Field label="Interconnectivity" value={demand.interconnectivity} />
          <Field label="Redundancy / Uptime Requirements" value={demand.redundancyUptimeRequirements} />
        </dl>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Deployment</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Contract Length, Years" value={demand.contractLengthYears} />
          <Field label="Timeline for Go Live" value={demand.timelineForGoLive} />
          <Field label="Ideal Cluster Location" value={demand.idealClusterLocation} />
          <Field label="Export Constraints" value={demand.exportConstraints} />
        </dl>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Commercial & CRM</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Target Price, GPU/h, USD" value={demand.targetPriceGpuHUsd} />
          <Field label="Decision Maker" value={demand.decisionMaker} />
          <Field label="Procurement Stage" value={demand.procurementStage} />
          <Field label="Other Comments" value={demand.otherComments} />
        </dl>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Match with GPU Capacity Listings</h2>
        <p className="text-sm text-gray-500 mb-4">Select approved GPU capacity listings to match with this request.</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {clusters.map((c) => (
            <label key={c._id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selected.includes(c._id)}
                onChange={() => setSelected((p) => p.includes(c._id) ? p.filter((x) => x !== c._id) : [...p, c._id])}
              />
              <div>
                <p className="text-sm font-medium">{c.vendorName} — {c.gpuTechnology}</p>
                <p className="text-xs text-gray-500">{c.singleClusterSize} GPUs · {c.location}, {c.country}</p>
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
