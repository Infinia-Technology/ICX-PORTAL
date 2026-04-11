import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Users } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const PERMISSIONS = ['documents', 'site_details', 'technical', 'commercial', 'phasing', 'financials'];

export default function TeamPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const load = () => {
    api.get('/supplier/team').then((r) => setTeam(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const invite = async () => {
    if (!email) return;
    setSubmitting(true);
    try {
      await api.post('/supplier/team/invite', { email, permissions });
      addToast({ type: 'success', message: 'Invitation sent' });
      setShowModal(false);
      setEmail('');
      setPermissions([]);
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to send invite' });
    } finally {
      setSubmitting(false);
    }
  };

  const revoke = async (id) => {
    if (!confirm('Revoke this team member\'s access?')) return;
    try {
      await api.delete(`/supplier/team/${id}`);
      addToast({ type: 'success', message: 'Access revoked' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to revoke access' });
    }
  };

  const togglePermission = (p) => {
    setPermissions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Invite and manage subordinate team members</p>
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
          {team.map((invite) => (
            <Card key={invite._id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{invite.email}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {invite.permissions?.map((p) => (
                    <Badge key={p} variant="default" className="text-xs">{p.replace(/_/g, ' ')}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={invite.status === 'ACCEPTED' ? 'success' : invite.status === 'REVOKED' ? 'error' : 'warning'}>
                  {invite.status}
                </Badge>
                {invite.status !== 'REVOKED' && (
                  <Button size="sm" variant="ghost" onClick={() => revoke(invite._id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Invite Team Member">
        <div className="space-y-4">
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" />
          <div>
            <p className="text-sm font-medium mb-2">Permissions</p>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePermission(p)} className="rounded" />
                  <span className="text-sm capitalize">{p.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={invite} loading={submitting}>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
