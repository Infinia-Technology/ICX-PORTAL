import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';

const STATUS_VARIANT = { NEW: 'info', IN_REVIEW: 'warning', RESUBMITTED: 'warning', APPROVED: 'success', REJECTED: 'error' };
const TYPE_VARIANT = { SUPPLIER_KYC: 'default', DC_LISTING: 'info', GPU_CLUSTER: 'success', CUSTOMER_APPLICATION: 'default', GPU_DEMAND: 'warning', DC_REQUEST: 'warning' };

export default function QueuePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    api.get(`/admin/queue?${params}`).then((r) => setItems(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  const columns = [
    { key: 'type', label: 'Type', render: (v) => <Badge variant={TYPE_VARIANT[v] || 'default'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={STATUS_VARIANT[v] || 'default'}>{v}</Badge> },
    { key: 'priority', label: 'Priority' },
    { key: 'createdAt', label: 'Submitted', render: (v) => new Date(v).toLocaleDateString() },
    { key: '_id', label: 'Actions', render: (v) => <Link to={`/admin/queue/${v}`}><Button size="sm">Review</Button></Link> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Review Queue</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">All pending review items</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Statuses' }, 'NEW', 'IN_REVIEW', 'RESUBMITTED', 'APPROVED', 'REJECTED'].map((o) => typeof o === 'string' ? { value: o, label: o } : o)} />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={[{ value: '', label: 'All Types' }, 'SUPPLIER_KYC', 'DC_LISTING', 'GPU_CLUSTER', 'CUSTOMER_APPLICATION', 'GPU_DEMAND', 'DC_REQUEST'].map((o) => typeof o === 'string' ? { value: o, label: o.replace(/_/g, ' ') } : o)} />
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : <DataTable columns={columns} data={items} />}
    </div>
  );
}
