import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Users, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const ROLE_OPTIONS = [
  { value: 'subordinate', label: 'Subordinate — can view and edit listings' },
  { value: 'viewer', label: 'Viewer — read-only access to listings' },
];

export default function TeamPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('subordinate');
  const [submitting, setSubmitting] = useState(false);
  // Confirm revoke modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, inviteId: null, email: '' });
  const { addToast } = useToast();

  const load = () => {
    api.get('/supplier/team').then((r) => setTeam(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const invite = async () => {
    if (!email) return;
    setSubmitting(true);
    try {
      await api.post('/supplier/team/invite', { email, role });
      addToast({ type: 'success', message: 'Invitation sent — they will receive an email with an invite link' });
      setShowModal(false);
      setEmail('');
      setRole('subordinate');
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to send invite' });
    } finally {
      setSubmitting(false);
    }
  };

  const openRevoke = (invite) => {
    setConfirmModal({ open: true, inviteId: invite._id || invite.id, email: invite.email });
  };

  const confirmRevoke = async () => {
    try {
      await api.delete(`/supplier/team/${confirmModal.inviteId}`);
      addToast({ type: 'success', message: 'Access revoked' });
      setConfirmModal({ open: false, inviteId: null, email: '' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to revoke access' });
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Invite and manage team members</p>
        </div>
        <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Invite Member</Button>
      </div>

      {team.length === 0 ? (
        <Card className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No team members yet</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">Invite team members to help manage your listings</p>
          <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Invite Member</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {team.map((member) => (
            <Card key={member._id || member.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{member.email}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 capitalize">{member.role || 'subordinate'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={member.status === 'ACCEPTED' ? 'success' : member.status === 'REVOKED' ? 'error' : 'warning'}>
                  {member.status}
                </Badge>
                {member.status !== 'REVOKED' && (
                  <Button size="sm" variant="ghost" onClick={() => openRevoke(member)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Invite Team Member">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            An invite link will be sent to their email. It expires in 48 hours.
          </p>
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" />
          <Select
            label="Access Level"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={ROLE_OPTIONS}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={invite} loading={submitting}>Send Invite</Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Confirm Modal */}
      <Modal open={confirmModal.open} onClose={() => setConfirmModal({ open: false, inviteId: null, email: '' })} title="Revoke Access">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Are you sure you want to revoke access for <strong>{confirmModal.email}</strong>? They will no longer be able to access your organization's data.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmModal({ open: false, inviteId: null, email: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRevoke}>Revoke Access</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
