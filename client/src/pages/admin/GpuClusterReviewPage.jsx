import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TextArea from '../../components/ui/TextArea';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { LocationLink } from '../../components/ui/LocationInput';
import ListingMembersPanel from '../../components/ui/ListingMembersPanel';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', REVISION_REQUESTED: 'warning', RESUBMITTED: 'warning', APPROVED: 'success', REJECTED: 'error' };

const Field = ({ label, value, flagged }) => (
  <div className={flagged ? 'bg-yellow-50 border border-yellow-200 rounded p-2' : ''}>
    <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}{flagged && ' ⚠'}</dt>
    <dd className="text-sm">{value ?? '—'}</dd>
  </div>
);

const Section = ({ title, children }) => (
  <Card>
    <h2 className="font-semibold mb-4 text-base">{title}</h2>
    <dl className="grid sm:grid-cols-3 gap-x-6 gap-y-4">{children}</dl>
  </Card>
);

export default function GpuClusterReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [flaggedFields, setFlaggedFields] = useState([]);
  const [flagInput, setFlagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/admin/gpu-clusters/${id}`).then((r) => setCluster(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const review = async (action) => {
    setSubmitting(true);
    try {
      await api.put(`/admin/gpu-clusters/${id}/review`, { action, reason, flaggedFields });
      addToast({ type: 'success', message: `GPU listing ${action.toLowerCase().replace('_', ' ')}` });
      navigate('/admin/gpu-clusters');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const addFlag = () => {
    if (flagInput && !flaggedFields.includes(flagInput)) {
      setFlaggedFields((p) => [...p, flagInput]);
      setFlagInput('');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!cluster) return <div className="text-center py-20">Not found</div>;

  const flagSet = new Set(cluster.flaggedFields || []);
  const isFlagged = (f) => flagSet.has(f);
  const canReview = ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'].includes(cluster.status);
  const c = cluster;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{c.vendorName}</h1>
          <Badge variant={STATUS_VARIANT[c.status] || 'default'} className="mt-1">{c.status?.replace(/_/g, ' ')}</Badge>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin/gpu-clusters')}>Back</Button>
      </div>

      {/* Step 1: Basic Info */}
      <Section title="Step 1 — Basic Information">
        <Field label="Vendor Name" value={c.vendorName} flagged={isFlagged('vendorName')} />
        <Field label="Location" value={c.location} flagged={isFlagged('location')} />
        <Field label="Country" value={c.country} flagged={isFlagged('country')} />
        <Field label="GPU Technology" value={c.gpuTechnology} flagged={isFlagged('gpuTechnology')} />
        <Field label="Google Maps Link" value={<LocationLink value={c.googleMapsLink} />} />
        <Field label="DC Landlord" value={c.dcLandlord} />
        <Field label="Total GPU Count" value={c.totalGpuCount} />
        <Field label="Single Cluster Size" value={c.singleClusterSize ? `${c.singleClusterSize} GPUs` : null} flagged={isFlagged('singleClusterSize')} />
        <Field label="Availability Date" value={c.availabilityDate ? new Date(c.availabilityDate).toLocaleDateString() : null} flagged={isFlagged('availabilityDate')} />
        <Field label="Notes" value={c.notes} flagged={isFlagged('notes')} />
        <Field label="Restricted Use" value={c.restrictedUse} />
      </Section>

      {/* Step 2: Compute Node */}
      <Section title="Step 2 — Compute Node">
        <Field label="GPU Server Model" value={c.gpuServerModel} flagged={isFlagged('gpuServerModel')} />
        <Field label="CPU" value={c.cpu} flagged={isFlagged('cpu')} />
        <Field label="GPU" value={c.gpu} flagged={isFlagged('gpu')} />
        <Field label="RAM" value={c.ram} flagged={isFlagged('ram')} />
        <Field label="Local Storage" value={c.localStorage} flagged={isFlagged('localStorage')} />
        <Field label="NICs" value={c.nics} flagged={isFlagged('nics')} />
      </Section>

      {/* Step 3: Compute Network (East-West) */}
      <Section title="Step 3 — Compute Network (East-West)">
        <Field label="Topology" value={c.computeNetTopology} flagged={isFlagged('computeNetTopology')} />
        <Field label="Technology" value={c.computeNetTechnology} flagged={isFlagged('computeNetTechnology')} />
        <Field label="Switch Vendor" value={c.computeNetSwitchVendor} />
        <Field label="Layers" value={c.computeNetLayers} />
        <Field label="Oversubscription" value={c.computeNetOversubscription} />
        <Field label="Scalability" value={c.computeNetScalability} />
        <Field label="QoS" value={c.computeNetQos} />
      </Section>

      {/* Step 4: Management Network (North-South) */}
      <Section title="Step 4 — Management Network (North-South)">
        <Field label="Topology" value={c.mgmtNetTopology} />
        <Field label="Technology" value={c.mgmtNetTechnology} />
        <Field label="Layers" value={c.mgmtNetLayers} />
        <Field label="Switch Vendor" value={c.mgmtNetSwitchVendor} />
        <Field label="Oversubscription" value={c.mgmtNetOversubscription} />
        <Field label="Scalability" value={c.mgmtNetScalability} />
      </Section>

      {/* Step 5: OOB + Storage + Connectivity */}
      <Section title="Step 5 — OOB, Storage & Connectivity">
        <Field label="OOB Network Technology" value={c.oobNetTechnology} />
        <div className="sm:col-span-3">
          <Field label="Storage Options" value={c.storageOptions} />
        </div>
        <div className="sm:col-span-3">
          <Field label="Connectivity Details" value={c.connectivityDetails} />
        </div>
      </Section>

      {/* Step 6: Cluster Description */}
      {c.clusterDescription && (
        <Section title="Step 6 — Cluster Description">
          <div className="sm:col-span-3">
            <p className="text-sm whitespace-pre-wrap">{c.clusterDescription}</p>
          </div>
        </Section>
      )}

      {/* Step 7: Power & Facility */}
      <Section title="Step 7 — Power & Facility">
        <Field label="Power Supply Status" value={c.powerSupplyStatus} />
        <Field label="Rack Power Capacity" value={c.rackPowerCapacityKw ? `${c.rackPowerCapacityKw} kW` : null} />
        <Field label="Modular Data Halls" value={c.modularDataHalls} />
        <Field label="Total Power Capacity" value={c.totalPowerCapacityMw ? `${c.totalPowerCapacityMw} MW` : null} />
        <Field label="Power Capacity / Floor" value={c.powerCapacityPerFloor ? `${c.powerCapacityPerFloor} kW` : null} />
        <Field label="Data Hall Layout / Floor" value={c.dataHallLayoutPerFloor} />
        <Field label="Future Expansion" value={c.futureExpansion} />
        <Field label="Dual Feed Power" value={c.dualFeedPower} />
        <Field label="UPS Configuration" value={c.upsConfiguration} />
        <Field label="Backup Generators" value={c.backupGenerators} />
        <Field label="Cooling Design" value={c.coolingDesign} />
        <Field label="Cooling Units" value={c.coolingUnits} />
        <Field label="Cooling Capacity" value={c.coolingCapacity} />
        <Field label="Floor Plans" value={c.floorPlans} />
      </Section>

      {/* Documents */}
      {c.documents?.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-4">Documents</h2>
          <div className="space-y-2">
            {c.documents.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-[var(--radius-md)]">
                <div>
                  <p className="text-sm font-medium">{doc.fileName}</p>
                  <p className="text-xs text-gray-500">{doc.documentType} — {(doc.fileSize / 1024).toFixed(1)} KB</p>
                </div>
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-primary)] hover:underline">View</a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Review Decision */}
      {canReview && (
        <Card>
          <h2 className="font-semibold mb-4">Review Decision</h2>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Flag Fields (for revision)</p>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Field name to flag" value={flagInput} onChange={(e) => setFlagInput(e.target.value)} className="max-w-xs" />
              <Button size="sm" onClick={addFlag} variant="secondary">Add Flag</Button>
            </div>
            {flaggedFields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {flaggedFields.map((f) => (
                  <span key={f} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                    {f} <button onClick={() => setFlaggedFields((p) => p.filter((x) => x !== f))}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <TextArea label="Reason / Comments" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional notes..." rows={3} />
          <div className="flex gap-3 mt-4">
            <Button onClick={() => review('APPROVE')} loading={submitting} className="bg-green-600 hover:bg-green-700">Approve</Button>
            <Button onClick={() => review('REQUEST_REVISION')} loading={submitting} variant="secondary" className="border-yellow-400 text-yellow-700">Request Revision</Button>
            <Button onClick={() => review('REJECT')} loading={submitting} variant="secondary" className="border-red-400 text-red-600">Reject</Button>
          </div>
        </Card>
      )}

      {/* ── Team Members Panel ── */}
      <ListingMembersPanel
        listingId={id}
        listingName={c.vendorName || 'GPU Cluster'}
      />
    </div>
  );
}
