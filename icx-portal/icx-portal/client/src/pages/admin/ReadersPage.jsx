import { useState, useEffect } from 'react';
import { Eye, UserPlus, Trash2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

export default function ReadersPage() {
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();

  const load = () => {
    api.get('/admin/readers').then((r) => setReaders(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    if (!email) return;
    setCreating(true);
    try {
      await api.post('/admin/readers', { email });
      addToast({ type: 'success', message: 'Reader account created and welcome email sent' });
      setShowModal(false);
      setEmail('');
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create reader' });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.put(`/admin/readers/${id}`, { isActive: !isActive });
      addToast({ type: 'success', message: `Reader ${isActive ? 'deactivated' : 'activated'}` });
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update reader' });
    }
  };

  const resend = async (id) => {
    try {
      await api.post(`/admin/readers/${id}/resend`);
      addToast({ type: 'success', message: 'Welcome email resent' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to resend email' });
    }
  };

  const deleteReader = async (id) => {
    if (!confirm('Permanently remove this reader?')) return;
    try {
      await api.delete(`/admin/readers/${id}`);
      addToast({ type: 'success', message: 'Reader removed' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to delete reader' });
    }
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'isActive', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'error'}>{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'lastLoginAt', label: 'Last Login', render: (v) => v ? new Date(v).toLocaleDateString() : 'Never' },
    { key: 'createdAt', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => toggleActive(v, row.isActive)}>{row.isActive ? 'Deactivate' : 'Activate'}</Button>
          <Button size="sm" variant="ghost" onClick={() => resend(v)}><RefreshCw className="w-3 h-3" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteReader(v)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reader Accounts</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage read-only marketplace access</p>
        </div>
        <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Create Reader</Button>
      </div>

      {readers.length === 0 ? (
        <Card className="text-center py-16">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No reader accounts yet</h3>
          <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Create Reader</Button>
        </Card>
      ) : (
        <DataTable columns={columns} data={readers} />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Reader Account">
        <div className="space-y-4">
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="reader@company.com" />
          <p className="text-xs text-gray-500">A welcome email with login instructions will be sent automatically.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={create} loading={creating}>Create Reader</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
