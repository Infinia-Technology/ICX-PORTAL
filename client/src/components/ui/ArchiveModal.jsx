import { useState } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import Badge from './Badge';

const ARCHIVE_REASONS = [
  { value: 'MANUAL', label: 'Manual Archive' },
  { value: 'BUSINESS_CLOSURE', label: 'Business Closure' },
  { value: 'DUPLICATE', label: 'Duplicate Entry' },
  { value: 'OUTDATED', label: 'Outdated' },
  { value: 'OTHER', label: 'Other Reason' },
];

export default function ArchiveModal({
  open, onClose, item, onArchive, onRestore, archived = false, loading = false,
}) {
  const [reason, setReason] = useState('MANUAL');
  const [reasonText, setReasonText] = useState('');

  const handleArchive = async () => {
    await onArchive({ reason, reasonText });
    setReason('MANUAL');
    setReasonText('');
  };

  const handleRestore = async () => {
    await onRestore();
  };

  return (
    <Modal open={open} onClose={onClose} title={archived ? 'Restore Listing' : 'Archive Listing'}>
      <div className="space-y-4">
        {item && (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">{item.vendorName || item.companyLegalEntity}</p>
            {archived && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Archived on:
                  {' '}
                  {new Date(item.archivedAt).toLocaleDateString()}
                </p>
                {item.archivedReason && (
                  <p className="text-xs text-gray-500">
                    Reason:
                    {' '}
                    {item.archivedReason}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!archived && (
          <>
            <Select
              label="Archive Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={ARCHIVE_REASONS}
            />
            <Input
              label="Additional Notes (Optional)"
              type="textarea"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Explain why this listing is being archived..."
            />
          </>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={archived ? handleRestore : handleArchive}
            loading={loading}
            variant={archived ? 'secondary' : 'danger'}
          >
            {archived ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Listing
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                Archive Listing
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
