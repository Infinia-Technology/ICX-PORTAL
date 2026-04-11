import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = (q = '') => {
    const params = q ? `?action=${q}` : '';
    api.get(`/superadmin/audit-log${params}`).then((r) => setLogs(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'userId', label: 'User', render: (v) => v?.email || String(v) },
    { key: 'action', label: 'Action' },
    { key: 'targetModel', label: 'Target Model' },
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'createdAt', label: 'Time', render: (v) => new Date(v).toLocaleString() },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Full system audit trail</p>
        </div>
        <Input placeholder="Search actions..." value={search} onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} className="max-w-xs" />
      </div>
      <DataTable columns={columns} data={logs} />
    </div>
  );
}
