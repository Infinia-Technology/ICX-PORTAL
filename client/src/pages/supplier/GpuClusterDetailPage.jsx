import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', REVISION_REQUESTED: 'warning', RESUBMITTED: 'info', APPROVED: 'success', REJECTED: 'error' };
const Field = ({ label, value }) => (<div><dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt><dd className="text-sm">{value || <span className="text-gray-400">—</span>}</dd></div>);

export default function GpuClusterDetailPage() {
  const { id } = useParams();
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/gpu-clusters/${id}`).then((r) => setCluster(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!cluster) return <div className="text-center py-20">GPU capacity listing not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{cluster.vendorName}</h1>
          <p className="text-gray-500 text-sm mt-1">{cluster.gpuTechnology} — {cluster.location}, {cluster.country}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANT[cluster.status] || 'default'}>{cluster.status?.replace(/_/g, ' ')}</Badge>
          {['DRAFT', 'REVISION_REQUESTED'].includes(cluster.status) && (
            <Link to={`/supplier/gpu-clusters/${id}/edit`}><Button>Edit</Button></Link>
          )}
        </div>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">Basic Information</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Vendor Name" value={cluster.vendorName} />
          <Field label="GPU Technology" value={cluster.gpuTechnology} />
          <Field label="Total GPUs" value={cluster.totalGpuCount} />
          <Field label="Single Cluster Size" value={cluster.singleClusterSize ? `${cluster.singleClusterSize} GPUs` : null} />
          <Field label="Availability Date" value={cluster.availabilityDate ? new Date(cluster.availabilityDate).toLocaleDateString() : null} />
          <Field label="Country" value={cluster.country} />
        </dl>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Compute Node</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Server Model" value={cluster.gpuServerModel} />
          <Field label="CPU" value={cluster.cpu} />
          <Field label="GPU" value={cluster.gpu} />
          <Field label="RAM" value={cluster.ram} />
          <Field label="Local Storage" value={cluster.localStorage} />
          <Field label="NICs" value={cluster.nics} />
        </dl>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Network</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Compute Net Technology" value={cluster.computeNetTechnology} />
          <Field label="Compute Topology" value={cluster.computeNetTopology} />
          <Field label="Mgmt Net Technology" value={cluster.mgmtNetTechnology} />
        </dl>
      </Card>

      {cluster.clusterDescription && (
        <Card>
          <h2 className="font-semibold mb-3">Cluster Description</h2>
          <p className="text-sm whitespace-pre-wrap">{cluster.clusterDescription}</p>
        </Card>
      )}

      {cluster.notes && (
        <Card>
          <h2 className="font-semibold mb-3">Notes</h2>
          <p className="text-sm">{cluster.notes}</p>
        </Card>
      )}
    </div>
  );
}
