import { useState, useEffect } from 'react';
import { UserPlus, Search } from 'lucide-react';
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
import { useAuth } from '../../hooks/useAuth';

const ALL_ROLES = ['superadmin', 'admin', 'supplier', 'broker', 'customer', 'reader', 'viewer', 'subordinate'];
const ASSIGNABLE_ROLES = ['supplier', 'broker', 'customer', 'reader', 'viewer', 'subordinate'];

const ROLE_VARIANT = {
  superadmin: 'error',
  admin: 'warning',
  supplier: 'info',
  broker: 'info',
  customer: 'success',
  reader: 'default',
  viewer: 'default',
  subordinate: 'default',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── All Users tab (superadmin only) ────────────────────────────────────────
function AllUsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', role: 'reader' });
  const [creating, setCreating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });
  const { addToast } = useToast();

  const assignableRoles = currentUser?.role === 'superadmin' ? ALL_ROLES : ALL_ROLES.filter(r => r !== 'superadmin');

  const openConfirm = (message, onConfirm) => setConfirmModal({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirmModal({ open: false, message: '', onConfirm: null });

  const load = () => {
    setLoading(true);
    api.get('/superadmin/users')
      .then((r) => setUsers(r.data.data || r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    if (!newUser.email || !EMAIL_RE.test(newUser.email)) {
      addToast({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }
    if (!newUser.role) {
      addToast({ type: 'error', message: 'Please select a role' });
      return;
    }
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

  const toggleActive = (id, isActive) => {
    openConfirm(`${isActive ? 'Deactivate' : 'Activate'} this user?`, async () => {
      try {
        await api.put(`/superadmin/users/${id}`, { isActive: !isActive });
        addToast({ type: 'success', message: `User ${isActive ? 'deactivated' : 'activated'}` });
        load();
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to update user' });
      }
    });
  };

  const deleteUser = (id) => {
    openConfirm('Permanently delete this user? This cannot be undone.', async () => {
      try {
        await api.delete(`/superadmin/users/${id}`);
        addToast({ type: 'success', message: 'User deleted' });
        load();
      } catch (err) {
        addToast({ type: 'error', message: err.response?.data?.error || 'Failed to delete user' });
      }
    });
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (v) => <Badge variant={ROLE_VARIANT[v] || 'default'}>{v}</Badge> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'error'}>{v ? 'Active' : 'Inactive'}</Badge> },
    { key: 'lastLoginAt', label: 'Last Login', render: (v) => v ? new Date(v).toLocaleDateString() : 'Never' },
    { key: 'createdAt', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => toggleActive(v, row.isActive)}>
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteUser(v)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--color-text-secondary)]">All platform users — {users.length} total</p>
        <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Create User</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <DataTable columns={columns} data={users} />
      )}

      <Modal open={confirmModal.open} onClose={closeConfirm} title="Confirm">
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">{confirmModal.message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={closeConfirm}>Cancel</Button>
          <Button variant="danger" onClick={() => { closeConfirm(); confirmModal.onConfirm?.(); }}>Confirm</Button>
        </div>
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create User">
        <div className="space-y-4">
          <Input label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} />
          <Select
            label="Role"
            value={newUser.role}
            onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
            options={assignableRoles.map((r) => ({ value: r, label: r }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={create} loading={creating}>Create User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Manage Users tab (admin + superadmin) ───────────────────────────────────
function ManageUsersTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'reader' });
  const [creating, setCreating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });
  const { addToast } = useToast();

  const openConfirm = (message, onConfirm) => setConfirmModal({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirmModal({ open: false, message: '', onConfirm: null });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const r = await api.get(`/admin/manage-users?${params}`);
      const data = r.data.data || r.data;
      setUsers(Array.isArray(data) ? data : []);
      setTotal(r.data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  const create = async () => {
    if (!newUser.email || !EMAIL_RE.test(newUser.email)) {
      addToast({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }
    if (!newUser.role) {
      addToast({ type: 'error', message: 'Please select a role' });
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/manage-users', newUser);
      addToast({ type: 'success', message: 'User created successfully' });
      setShowCreate(false);
      setNewUser({ name: '', email: '', role: 'reader' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create user' });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = (id, isActive) => {
    openConfirm(`${isActive ? 'Deactivate' : 'Activate'} this user?`, async () => {
      try {
        await api.put(`/admin/manage-users/${id}`, { isActive: !isActive });
        addToast({ type: 'success', message: `User ${isActive ? 'deactivated' : 'activated'}` });
        load();
      } catch (err) {
        addToast({ type: 'error', message: err.response?.data?.error || 'Failed to update user' });
      }
    });
  };

  const deleteUser = (id, email) => {
    openConfirm(`Permanently delete ${email}? This cannot be undone.`, async () => {
      try {
        await api.delete(`/admin/manage-users/${id}`);
        addToast({ type: 'success', message: 'User deleted' });
        load();
      } catch (err) {
        addToast({ type: 'error', message: err.response?.data?.error || 'Failed to delete user' });
      }
    });
  };

  const columns = [
    { key: 'email', label: 'Email' },
    {
      key: 'role', label: 'Role',
      render: (v) => <Badge variant={ROLE_VARIANT[v] || 'default'} className="capitalize">{v}</Badge>,
    },
    {
      key: 'isActive', label: 'Status',
      render: (v) => <Badge variant={v ? 'success' : 'error'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    { key: 'lastLoginAt', label: 'Last Login', render: (v) => v ? new Date(v).toLocaleDateString() : 'Never' },
    { key: 'createdAt', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: '_id', label: 'Actions',
      render: (v, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => toggleActive(v, row.isActive)}>
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteUser(v, row.email)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Manage assignable-role users — {total} user{total !== 1 ? 's' : ''}
        </p>
        <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              ...ASSIGNABLE_ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })),
            ]}
            className="min-w-[140px]"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <DataTable columns={columns} data={users} />
      )}

      <Modal open={confirmModal.open} onClose={closeConfirm} title="Confirm Action">
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">{confirmModal.message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={closeConfirm}>Cancel</Button>
          <Button variant="danger" onClick={() => { closeConfirm(); confirmModal.onConfirm?.(); }}>Confirm</Button>
        </div>
      </Modal>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Admins can create users with the following roles: {ASSIGNABLE_ROLES.join(', ')}.
          </p>
          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. John Smith"
            value={newUser.name}
            onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="user@example.com"
            value={newUser.email}
            onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
          />
          <Select
            label="Role *"
            value={newUser.role}
            onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
            options={ASSIGNABLE_ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={create} loading={creating} disabled={creating}>Create User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const tabs = [
    ...(isSuperAdmin ? [{ id: 'all', label: 'All Users' }] : []),
    { id: 'manage', label: 'Manage Users' },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            {isSuperAdmin ? 'View and manage all platform users' : 'Create and manage platform users'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      {isSuperAdmin && (
        <div className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'all' && isSuperAdmin && <AllUsersTab />}
      {activeTab === 'manage' && <ManageUsersTab />}
    </div>
  );
}
