/**
 * ListingMembersPanel
 * Reusable panel for assigning / inviting users to a listing (DC or GPU).
 * Usage:
 *   <ListingMembersPanel listingId={id} listingName="My DC Site" />
 */
import { useState, useEffect, useRef } from 'react';
import { UserPlus, Trash2, Users, Mail, Search } from 'lucide-react';
import api from '../../lib/api';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import Modal from './Modal';
import Spinner from './Spinner';
import { useToast } from './Toast';

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer — read-only access' },
  { value: 'collaborator', label: 'Collaborator — can contribute' },
];

const ROLE_VARIANT = { viewer: 'default', collaborator: 'info' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ListingMembersPanel({ listingId, listingName }) {
  const { addToast } = useToast();

  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(false);

  // Assign existing user modal
  const [showAssign, setShowAssign] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignRole, setAssignRole]   = useState('viewer');
  const [assigning, setAssigning]     = useState(false);
  const searchTimer = useRef(null);

  // Invite new user modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'viewer' });
  const [inviting, setInviting]     = useState(false);

  // Confirm remove
  const [confirmRemove, setConfirmRemove] = useState({ open: false, userId: null, email: '' });

  // ── load members ──────────────────────────────────────────────────────────
  const loadMembers = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const r = await api.get(`/admin/listings/${listingId}/members`);
      setMembers(r.data);
    } catch (err) {
      setLoadError(true);
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to load team members' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (listingId) loadMembers(); }, [listingId]);

  // ── search assignable users ───────────────────────────────────────────────
  useEffect(() => {
    if (!showAssign) return;
    clearTimeout(searchTimer.current);
    if (!userSearch) { setUserOptions([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const r = await api.get(`/admin/users/assignable?search=${encodeURIComponent(userSearch)}`);
        setUserOptions(r.data);
      } catch {
        setUserOptions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, [userSearch, showAssign]);

  // ── assign existing user ──────────────────────────────────────────────────
  const assign = async () => {
    if (!selectedUser) {
      addToast({ type: 'error', message: 'Please select a user' });
      return;
    }
    setAssigning(true);
    try {
      await api.post(`/admin/listings/${listingId}/members`, {
        userId: selectedUser.id || selectedUser._id,
        role: assignRole,
      });
      addToast({ type: 'success', message: `${selectedUser.email} added to listing` });
      setShowAssign(false);
      setSelectedUser(null);
      setUserSearch('');
      setUserOptions([]);
      setAssignRole('viewer');
      loadMembers();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to assign user' });
    } finally {
      setAssigning(false);
    }
  };

  // ── invite by email ───────────────────────────────────────────────────────
  const invite = async () => {
    if (!inviteForm.email || !EMAIL_RE.test(inviteForm.email)) {
      addToast({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }
    setInviting(true);
    try {
      const r = await api.post(`/admin/listings/${listingId}/invite`, inviteForm);
      addToast({
        type: 'success',
        message: r.data.userCreated
          ? `New user created and added to listing`
          : `${inviteForm.email} added to listing`,
      });
      setShowInvite(false);
      setInviteForm({ name: '', email: '', role: 'viewer' });
      loadMembers();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to invite user' });
    } finally {
      setInviting(false);
    }
  };

  // ── remove member ─────────────────────────────────────────────────────────
  const removeMember = async () => {
    try {
      await api.delete(`/admin/listings/${listingId}/members/${confirmRemove.userId}`);
      addToast({ type: 'success', message: 'Member removed from listing' });
      setConfirmRemove({ open: false, userId: null, email: '' });
      loadMembers();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to remove member' });
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <h2 className="font-semibold text-base">Team Members</h2>
          <span className="text-xs text-[var(--color-text-secondary)] bg-gray-100 rounded-full px-2 py-0.5">
            {members.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" leftIcon={<Search className="w-3.5 h-3.5" />} onClick={() => setShowAssign(true)}>
            Assign User
          </Button>
          <Button size="sm" leftIcon={<Mail className="w-3.5 h-3.5" />} onClick={() => setShowInvite(true)}>
            Invite by Email
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : loadError ? (
        <div className="text-center py-8">
          <p className="text-sm text-red-500">Failed to load members.</p>
          <Button size="sm" variant="ghost" onClick={loadMembers} className="mt-2">Retry</Button>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-10">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">No team members assigned yet.</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Use "Assign User" to add existing users, or "Invite by Email" to add new ones.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {members.map((m) => (
            <div key={m._id || m.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{m.user?.name || m.user?.email}</p>
                {m.user?.name && (
                  <p className="text-xs text-[var(--color-text-secondary)]">{m.user.email}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={ROLE_VARIANT[m.role] || 'default'} className="capitalize">{m.role}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmRemove({ open: true, userId: m.user_id, email: m.user?.email })}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Assign existing user modal ─────────────────────────────────── */}
      <Modal open={showAssign} onClose={() => { setShowAssign(false); setSelectedUser(null); setUserSearch(''); setUserOptions([]); }} title="Assign Existing User">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Search for an existing platform user and assign them to this listing.
          </p>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setSelectedUser(null); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Search results */}
          {searchLoading && (
            <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          )}
          {!searchLoading && userOptions.length > 0 && (
            <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] max-h-48 overflow-y-auto divide-y divide-[var(--color-border)]">
              {userOptions.map((u) => (
                <button
                  key={u.id || u._id}
                  onClick={() => { setSelectedUser(u); setUserSearch(u.email); setUserOptions([]); }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    selectedUser?.id === u.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="font-medium">{u.name || u.email}</span>
                  {u.name && <span className="text-[var(--color-text-secondary)] ml-2 text-xs">{u.email}</span>}
                  <span className="ml-2 text-xs text-gray-400 capitalize">({u.role})</span>
                </button>
              ))}
            </div>
          )}
          {!searchLoading && userSearch && userOptions.length === 0 && !selectedUser && (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-2">
              No users found. Use "Invite by Email" to add a new user.
            </p>
          )}

          {selectedUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-md)] px-3 py-2 text-sm">
              Selected: <strong>{selectedUser.email}</strong>
            </div>
          )}

          <Select
            label="Access Role"
            value={assignRole}
            onChange={(e) => setAssignRole(e.target.value)}
            options={ROLE_OPTIONS}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowAssign(false); setSelectedUser(null); setUserSearch(''); setUserOptions([]); }}>
              Cancel
            </Button>
            <Button onClick={assign} loading={assigning} disabled={!selectedUser || assigning}>
              Assign to Listing
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Invite by email modal ──────────────────────────────────────── */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite by Email">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Enter an email address. If the user exists they'll be added directly;
            if not, a new account will be created and they'll receive a notification.
          </p>
          <Input
            label="Full Name (optional)"
            type="text"
            placeholder="e.g. John Smith"
            value={inviteForm.name}
            onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="colleague@company.com"
            value={inviteForm.email}
            onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
          />
          <Select
            label="Access Role"
            value={inviteForm.role}
            onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}
            options={ROLE_OPTIONS}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={invite}
              loading={inviting}
              disabled={!inviteForm.email || inviting}
            >
              Add to Listing
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm remove modal ───────────────────────────────────────── */}
      <Modal open={confirmRemove.open} onClose={() => setConfirmRemove({ open: false, userId: null, email: '' })} title="Remove Member">
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Remove <strong>{confirmRemove.email}</strong> from this listing? They will lose access immediately.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmRemove({ open: false, userId: null, email: '' })}>
            Cancel
          </Button>
          <Button variant="danger" onClick={removeMember}>Remove</Button>
        </div>
      </Modal>
    </Card>
  );
}
