import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import InfoIcon from '../../components/ui/InfoIcon';
import { useToast } from '../../components/ui/Toast';

const EMPTY_FORM = {
  name: '',
  gpuClusterListingId: '',
  totalUnits: '',
  notes: '',
};

export default function SupplierInventoryPage() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reservations, setReservations] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const load = () => {
    Promise.all([
      api.get('/inventory?limit=1000'),
      api.get('/gpu-clusters?limit=1000'),
    ])
      .then(([invRes, clusterRes]) => {
        setInventoryItems(invRes.data.data || invRes.data);
        setClusters(clusterRes.data.data || clusterRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const loadReservations = async (inventoryId) => {
    try {
      const res = await api.get(`/inventory/${inventoryId}/reservations`);
      setReservations((prev) => ({ ...prev, [inventoryId]: res.data }));
    } catch (err) {
      console.error('Failed to load reservations', err);
    }
  };

  const toggleExpanded = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
      loadReservations(id);
    }
    setExpandedRows(newSet);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name,
      gpuClusterListingId: row.gpuClusterListingId._id || row.gpuClusterListingId,
      totalUnits: row.totalUnits,
      notes: row.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        totalUnits: parseInt(form.totalUnits, 10),
        notes: form.notes,
      };

      if (editing) {
        await api.put(`/inventory/${editing._id}`, payload);
        addToast({ type: 'success', message: 'Inventory updated' });
      } else {
        payload.gpuClusterListingId = form.gpuClusterListingId;
        await api.post('/inventory', payload);
        addToast({ type: 'success', message: 'Inventory created' });
      }
      setShowModal(false);
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this inventory item?')) return;

    try {
      await api.delete(`/inventory/${id}`);
      addToast({ type: 'success', message: 'Inventory deleted' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to delete' });
    }
  };

  const canEditDelete = (status) => !['RESERVED', 'SOLD'].includes(status);

  const columns = [
    {
      key: 'expand',
      label: '',
      render: (v, row) => (
        <button
          className="p-1"
          onClick={() => toggleExpanded(row._id)}
          title={expandedRows.has(row._id) ? 'Collapse' : 'Expand'}
        >
          {expandedRows.has(row._id) ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      ),
      width: '40px',
    },
    {
      key: 'name',
      label: 'Name',
      render: (v) => v,
    },
    {
      key: 'gpuClusterListingId',
      label: 'GPU Cluster',
      render: (v) => v?.vendorName || 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <Badge status={v} />,
    },
    {
      key: 'totalUnits',
      label: 'Units',
      render: (totalUnits, row) => (
        <div className="flex gap-3 text-xs whitespace-nowrap">
          <span className="text-gray-500">
            Total: <b>{totalUnits}</b>
          </span>
          <span className="text-orange-600">
            Booked: <b>{row.bookedUnits}</b>
          </span>
          <span className="text-green-600">
            Available: <b>{row.availableUnits}</b>
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (v, row) => {
        const disabled = !canEditDelete(row.status);
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openEdit(row)}
              disabled={disabled}
              className={disabled ? 'cursor-not-allowed opacity-50' : ''}
              title={disabled ? `Cannot modify ${row.status} inventory` : 'Edit inventory'}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(v)}
              disabled={disabled}
              className={disabled ? 'cursor-not-allowed opacity-50' : ''}
              title={disabled ? `Cannot delete ${row.status} inventory` : 'Delete inventory'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Inventory</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Track GPU cluster inventory with unit bookings
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Inventory
        </Button>
      </div>

      <DataTable columns={columns} data={inventoryItems} />

      {/* Expanded rows for reservations */}
      {inventoryItems.map(
        (item) =>
          expandedRows.has(item._id) && (
            <div key={`reservations-${item._id}`} className="mt-4 ml-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-4">
                Reservations for
                {' '}
                {item.name}
              </h3>

              {!reservations[item._id] ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : reservations[item._id].length === 0 ? (
                <p className="text-sm text-gray-500">No reservations</p>
              ) : (
                <div className="space-y-2">
                  {reservations[item._id].map((res) => (
                    <div key={res._id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {res.customerOrgId?.companyName || 'Unknown Customer'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {res.units}
                          {' '}
                          units |
                          {' '}
                          {new Date(res.contractStartDate).toLocaleDateString()}
                          {' '}
                          to
                          {' '}
                          {new Date(res.contractEndDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge status={res.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Inventory' : 'Create Inventory'}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Name</label>
              <span className="text-red-500">*</span>
              <InfoIcon text="A descriptive name for this inventory item" placement="top" />
            </div>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          {!editing && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">GPU Cluster</label>
                <span className="text-red-500">*</span>
                <InfoIcon text="Select an approved GPU cluster listing to track inventory for" placement="top" />
              </div>
              <Select
                required
                value={form.gpuClusterListingId}
                onChange={(e) => setForm((p) => ({ ...p, gpuClusterListingId: e.target.value }))}
                options={clusters
                  .filter((c) => c.status === 'APPROVED')
                  .map((c) => ({ value: c._id, label: `${c.vendorName} (${c.gpu})` }))}
              />
            </div>
          )}
          {editing && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium">Status</p>
                <InfoIcon text="AVAILABLE: All units free | RESERVED: Some units booked | SOLD: All units sold | ARCHIVED: Listing inactive" placement="top" />
              </div>
              <Badge status={editing.status} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Total Units</label>
              <span className="text-red-500">*</span>
              <InfoIcon text="Total number of units available. Cannot be edited once units are booked." placement="top" />
            </div>
            <Input
              required
              type="number"
              min="1"
              value={form.totalUnits}
              onChange={(e) => setForm((p) => ({ ...p, totalUnits: e.target.value }))}
            />
          </div>
          <Input
            label="Notes"
            type="textarea"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
