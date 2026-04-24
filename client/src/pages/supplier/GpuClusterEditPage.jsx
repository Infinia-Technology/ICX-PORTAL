import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import LocationInput from '../../components/ui/LocationInput';

export default function GpuClusterEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/gpu-clusters/${id}`).then((r) => setCluster(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const save = async (resubmit = false) => {
    setSaving(true);
    try {
      await api.put(`/gpu-clusters/${id}`, cluster);
      if (resubmit) {
        await api.post(`/gpu-clusters/${id}/resubmit`);
        addToast({ type: 'success', message: 'Resubmitted for review' });
        navigate(`/supplier/gpu-clusters/${id}`);
      } else {
        addToast({ type: 'success', message: 'Saved' });
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const update = (e) => setCluster((p) => ({ ...p, [e.target.name]: e.target.value }));

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!cluster) return <div className="text-center py-20">Not found</div>;

  const flagged = cluster.flaggedFields || [];
  const hl = (f) => flagged.includes(f) ? 'ring-2 ring-yellow-400' : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit GPU Capacity Listing</h1>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => save(false)} loading={saving}>Save Draft</Button>
          {cluster.status === 'REVISION_REQUESTED' && <Button onClick={() => save(true)} loading={saving}>Resubmit</Button>}
        </div>
      </div>
      {flagged.length > 0 && <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm text-yellow-800"><strong>Revision requested</strong> — highlighted fields need updates.</div>}
      <Card>
        <h2 className="font-semibold mb-4">Basic Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Vendor Name" name="vendorName" value={cluster.vendorName || ''} onChange={update} className={hl('vendorName')} />
          <Input label="GPU Technology" name="gpuTechnology" value={cluster.gpuTechnology || ''} onChange={update} className={hl('gpuTechnology')} />
          <Input label="Location" name="location" value={cluster.location || ''} onChange={update} />
          <Input label="Country" name="country" value={cluster.country || ''} onChange={update} />
          <LocationInput label="Google Maps Link" name="googleMapsLink" value={cluster.googleMapsLink || ''} onChange={update} />
          <Input label="Total GPUs" name="totalGpuCount" type="number" value={cluster.totalGpuCount || ''} onChange={update} />
          <Input label="Cluster Size (GPUs)" name="singleClusterSize" type="number" value={cluster.singleClusterSize || ''} onChange={update} />
          <TextArea label="Notes" name="notes" value={cluster.notes || ''} onChange={update} className={`sm:col-span-2 ${hl('notes')}`} />
          <TextArea label="Cluster Description" name="clusterDescription" value={cluster.clusterDescription || ''} onChange={update} className="sm:col-span-2" />
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold mb-4">Compute Node</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="GPU Server Model" name="gpuServerModel" value={cluster.gpuServerModel || ''} onChange={update} className={hl('gpuServerModel')} />
          <Input label="CPU" name="cpu" value={cluster.cpu || ''} onChange={update} />
          <Input label="GPU" name="gpu" value={cluster.gpu || ''} onChange={update} />
          <Input label="RAM" name="ram" value={cluster.ram || ''} onChange={update} />
          <Input label="Local Storage" name="localStorage" value={cluster.localStorage || ''} onChange={update} />
          <Input label="NICs" name="nics" value={cluster.nics || ''} onChange={update} />
        </div>
      </Card>
    </div>
  );
}
