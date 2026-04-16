import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArchiveRestore, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

export default function AdminArchivePage() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, archive: null });
  const [restoring, setRestoring] = useState(false);
  const { addToast } = useToast();

  const load = () => {
    setLoading(true);
    api.get('/archive')
      .then(r => setArchives(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openRestore = (archive) => setConfirmModal({ open: true, archive });

  const confirmRestore = async () => {
    const { archive } = confirmModal;
    setRestoring(true);
    try {
      await api.put(`/archive/Listing/${archive.target_id}/restore`);
      addToast({ type: 'success', message: 'Record restored successfully' });
      setConfirmModal({ open: false, archive: null });
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to restore' });
    } finally {
      setRestoring(false);
    }
  };

  // Separate active archives from restored ones
  const active = archives.filter(a => a.isActive);
  const restored = archives.filter(a => !a.isActive);

  const columns = [
    {
      key: 'target_model',
      label: 'Type',
      render: (v) => <Badge variant="default">{v}</Badge>,
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (v) => v?.replace(/_/g, ' ') || '—',
    },
    {
      key: 'reason_text',
      label: 'Note',
      render: (v) => v || '—',
    },
    {
      key: 'archivedBy',
      label: 'Archived By',
      render: (v) => v?.email || '—',
    },
    {
      key: 'archived_at',
      label: 'Archived',
      render: (v) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      key: 'restoredBy',
      label: 'Restored By',
      render: (v) => v?.email || '—',
    },
    {
      key: 'restored_at',
      label: 'Restored',
      render: (v) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      key: '_id',
      label: 'Actions',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          {/* Link to the original listing review page */}
          <Link to={`/admin/dc-listings/${row.target_id}`}>
            <Button size="sm" variant="secondary">View</Button>
          </Link>
          {row.isActive && (
            <Button size="sm" variant="primary" onClick={() => openRestore(row)}>
              <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
              Restore
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Archive Management</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          View and restore archived listings
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card elevated>
          <p className="text-sm text-[var(--color-text-secondary)]">Currently Archived</p>
          <p className="text-3xl font-bold mt-1">{loading ? '—' : active.length}</p>
        </Card>
        <Card elevated>
          <p className="text-sm text-[var(--color-text-secondary)]">Previously Restored</p>
          <p className="text-3xl font-bold mt-1">{loading ? '—' : restored.length}</p>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          {/* Active archives */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Archived Records</h2>
            {active.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] py-6 text-center">No archived records</p>
            ) : (
              <DataTable columns={columns} data={active} />
            )}
          </Card>

          {/* Restored archives */}
          {restored.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-secondary)]">Restored Records</h2>
              <DataTable columns={columns} data={restored} />
            </Card>
          )}
        </div>
      )}

      {/* Restore Confirm Modal */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, archive: null })}
        title="Restore Record"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              This will restore the archived record and make it active again in the system. Are you sure?
            </p>
          </div>
          {confirmModal.archive && (
            <div className="bg-[var(--color-bg)] rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Type</span>
                <span className="font-medium">{confirmModal.archive.target_model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Archive reason</span>
                <span className="font-medium">{confirmModal.archive.reason?.replace(/_/g, ' ') || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Archived on</span>
                <span className="font-medium">{new Date(confirmModal.archive.archived_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmModal({ open: false, archive: null })}>Cancel</Button>
            <Button onClick={confirmRestore} loading={restoring}>Restore</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
