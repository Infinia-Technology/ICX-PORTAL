import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const ROLES = ['superadmin', 'admin', 'supplier', 'broker', 'customer', 'reader', 'viewer', 'subordinate'];
const ROLE_VARIANT = { superadmin: 'error', admin: 'warning', supplier: 'info', broker: 'info', customer: 'success', reader: 'default', viewer: 'default', subordinate: 'default' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', role: 'reader' });
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();

  const load = () => {
    api.get('/superadmin/users').then((r) => setUsers(r.data.data || r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    setCreating(true);
    try {
      await api.post('/superadmin/users', newUser);
      addToast({ type: 'success', message: 'User created' });
      setShowModal(false);
      setNewUser({ email: '', role: 'reader' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create user' });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.put(`/superadmin/users/${id}`, { isActive: !isActive });
      addToast({ type: 'success', message: `User ${isActive ? 'deactivated' : 'activated'}` });
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update user' });
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await api.delete(`/superadmin/users/${id}`);
      addToast({ type: 'success', message: 'User deleted' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to delete user' });
    }
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (v) => <Badge variant={ROLE_VARIANT[v] || 'default'}>{v}</Badge> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'error'}>{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'lastLoginAt', label: 'Last Login', render: (v) => v ? new Date(v).toLocaleDateString() : 'Never' },
    { key: 'createdAt', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => toggleActive(v, row.isActive)}>{row.isActive ? 'Deactivate' : 'Activate'}</Button>
          <Button size="sm" variant="ghost" onClick={() => deleteUser(v)} className="text-red-500">Delete</Button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">All platform users (superadmin only)</p>
        </div>
        <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Create User</Button>
      </div>

      <DataTable columns={columns} data={users} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create User">
        <div className="space-y-4">
          <Input label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} />
          <Select label="Role" value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))} options={ROLES.map((r) => ({ value: r, label: r }))} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={create} loading={creating}>Create User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
