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
import DatePicker from '../../components/ui/DatePicker';
import { useToast } from '../../components/ui/Toast';
import { INVENTORY_STATUS, RESERVATION_STATUS } from '../../config/constants';

const UNIT_TYPE_OPTIONS = [
  { value: 'GPU', label: 'GPU' },
  { value: 'NODE', label: 'Node' },
  { value: 'RACK', label: 'Rack' },
  { value: 'CLUSTER', label: 'Cluster' },
];

const PRICING_PERIOD_OPTIONS = [
  { value: 'HOUR', label: 'Per Hour' },
  { value: 'DAY', label: 'Per Day' },
  { value: 'MONTH', label: 'Per Month' },
  { value: 'YEAR', label: 'Per Year' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'AED', label: 'AED' },
  { value: 'SAR', label: 'SAR' },
];

const EMPTY_FORM = {
  name: '',
  gpuClusterListingId: '',
  unitType: 'GPU',
  totalUnits: '',
  pricePerUnit: '',
  pricingPeriod: '',
  currency: 'USD',
  minOrderQuantity: '1',
  availabilityStartDate: '',
  availabilityEndDate: '',
  location: '',
  description: '',
  notes: '',
};

const EMPTY_RESERVATION_FORM = {
  customerOrgId: '',
  units: '',
  contractStartDate: '',
  contractEndDate: '',
  notes: '',
};

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingReservationFor, setEditingReservationFor] = useState(null);
  const [reservations, setReservations] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [form, setForm] = useState(EMPTY_FORM);
  const [reservationForm, setReservationForm] = useState(EMPTY_RESERVATION_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusItem, setStatusItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const { addToast } = useToast();

  const load = () => {
    Promise.all([
      api.get('/inventory?limit=1000'),
      api.get('/admin/gpu-clusters?limit=1000'),
      api.get('/admin/customers'),
    ])
      .then(([invRes, clusterRes, custRes]) => {
        setInventoryItems(invRes.data.data || invRes.data);
        setClusters(clusterRes.data.data || clusterRes.data);
        setCustomers(custRes.data.data || custRes.data);
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
      unitType: row.unitType || 'GPU',
      totalUnits: row.totalUnits,
      pricePerUnit: row.pricePerUnit || '',
      pricingPeriod: row.pricingPeriod || '',
      currency: row.currency || 'USD',
      minOrderQuantity: row.minOrderQuantity || '1',
      availabilityStartDate: row.availabilityStartDate ? row.availabilityStartDate.slice(0, 10) : '',
      availabilityEndDate: row.availabilityEndDate ? row.availabilityEndDate.slice(0, 10) : '',
      location: row.location || '',
      description: row.description || '',
      notes: row.notes || '',
    });
    setShowModal(true);
  };

  const openReservationModal = (item) => {
    setEditingReservationFor(item);
    setReservationForm(EMPTY_RESERVATION_FORM);
    setShowReservationModal(true);
  };

  const openStatusModal = (item) => {
    setStatusItem(item);
    setNewStatus(item.status);
    setShowStatusModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        unitType: form.unitType,
        totalUnits: parseInt(form.totalUnits, 10),
        currency: form.currency,
        minOrderQuantity: parseInt(form.minOrderQuantity, 10) || 1,
        location: form.location,
        description: form.description,
        notes: form.notes,
      };
      if (form.pricePerUnit) payload.pricePerUnit = parseFloat(form.pricePerUnit);
      if (form.pricingPeriod) payload.pricingPeriod = form.pricingPeriod;
      if (form.availabilityStartDate) payload.availabilityStartDate = form.availabilityStartDate;
      if (form.availabilityEndDate) payload.availabilityEndDate = form.availabilityEndDate;

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

  const handleStatusChange = async () => {
    setSubmitting(true);
    try {
      await api.put(`/inventory/${statusItem._id}/status`, { status: newStatus });
      addToast({ type: 'success', message: 'Status updated' });
      setShowStatusModal(false);
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to update status' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReservation = async () => {
    setSubmitting(true);
    try {
      const payload = {
        customerOrgId: reservationForm.customerOrgId,
        units: parseInt(reservationForm.units, 10),
        contractStartDate: new Date(reservationForm.contractStartDate).toISOString(),
        contractEndDate: new Date(reservationForm.contractEndDate).toISOString(),
        notes: reservationForm.notes,
      };

      await api.post(`/inventory/${editingReservationFor._id}/reservations`, payload);
      addToast({ type: 'success', message: 'Reservation created' });
      setShowReservationModal(false);
      load();
      loadReservations(editingReservationFor._id);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create reservation' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (inventoryId, reservationId) => {
    if (!confirm('Cancel this reservation?')) return;

    try {
      await api.put(`/inventory/${inventoryId}/reservations/${reservationId}/cancel`);
      addToast({ type: 'success', message: 'Reservation cancelled' });
      load();
      loadReservations(inventoryId);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to cancel reservation' });
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
      key: 'unitType',
      label: 'Unit Type',
      render: (v) => v || 'GPU',
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
      key: 'pricePerUnit',
      label: 'Price',
      render: (v, row) =>
        v ? `${row.currency || 'USD'} ${v}/${(row.pricingPeriod || 'MONTH').toLowerCase()}` : '-',
    },
    {
      key: 'location',
      label: 'Location',
      render: (v) => v || '-',
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
              onClick={() => openStatusModal(row)}
              title="Change inventory status"
            >
              Change Status
            </Button>
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
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Track and manage GPU cluster inventory with unit reservations
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Reservations for
                  {' '}
                  {item.name}
                </h3>
                {item.status === 'AVAILABLE' && (
                  <Button size="sm" onClick={() => openReservationModal(item)}>
                    Add Reservation
                  </Button>
                )}
              </div>

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
                        <p className="text-xs text-gray-500">
                          Booked by:
                          {' '}
                          {res.bookedBy?.email || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge status={res.status} />
                        {res.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCancelReservation(item._id, res._id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
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
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          {!editing && (
            <Select
              label="GPU Cluster"
              required
              value={form.gpuClusterListingId}
              onChange={(e) => {
                const clusterId = e.target.value;
                const selectedCluster = clusters.find((c) => c._id === clusterId);
                setForm((p) => ({
                  ...p,
                  gpuClusterListingId: clusterId,
                  location: selectedCluster?.location || p.location,
                }));
              }}
              options={clusters
                .filter((c) => c.status === 'APPROVED')
                .map((c) => ({ value: c._id, label: `${c.vendorName} (${c.gpu})` }))}
            />
          )}
          {editing && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                Status:
                {' '}
                <Badge status={editing.status} />
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Unit Type"
              value={form.unitType}
              onChange={(e) => setForm((p) => ({ ...p, unitType: e.target.value }))}
              options={UNIT_TYPE_OPTIONS}
            />
            <Input
              label="Total Units"
              required
              type="number"
              min="1"
              value={form.totalUnits}
              onChange={(e) => setForm((p) => ({ ...p, totalUnits: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Price Per Unit"
              type="number"
              min="0"
              step="0.01"
              value={form.pricePerUnit}
              onChange={(e) => setForm((p) => ({ ...p, pricePerUnit: e.target.value }))}
            />
            <Select
              label="Pricing Period"
              value={form.pricingPeriod}
              onChange={(e) => setForm((p) => ({ ...p, pricingPeriod: e.target.value }))}
              options={PRICING_PERIOD_OPTIONS}
            />
            <Select
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
              options={CURRENCY_OPTIONS}
            />
          </div>

          <Input
            label="Minimum Order Quantity"
            type="number"
            min="1"
            value={form.minOrderQuantity}
            onChange={(e) => setForm((p) => ({ ...p, minOrderQuantity: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Availability Start Date"
              value={form.availabilityStartDate}
              onChange={(e) => setForm((p) => ({ ...p, availabilityStartDate: e.target.value }))}
            />
            <DatePicker
              label="Availability End Date"
              value={form.availabilityEndDate}
              onChange={(e) => setForm((p) => ({ ...p, availabilityEndDate: e.target.value }))}
            />
          </div>

          <Input
            label="Location"
            value={form.location}
            placeholder="Auto-filled from GPU cluster"
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          />
          <Input
            label="Description"
            type="textarea"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Detailed description of the inventory offering"
          />
          <Input
            label="Notes"
            type="textarea"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Internal notes (max 500 characters)"
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

      {/* Status Change Modal */}
      <Modal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Inventory Status"
      >
        <div className="space-y-4">
          {statusItem && (
            <>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  Current Status:
                  {' '}
                  <Badge status={statusItem.status} />
                </p>
              </div>
              <Select
                label="New Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                options={Object.values(INVENTORY_STATUS).map((s) => ({ value: s, label: s }))}
              />
            </>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} loading={submitting}>
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Reservation Modal */}
      <Modal
        open={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        title={`Add Reservation for ${editingReservationFor?.name || ''}`}
      >
        <div className="space-y-4">
          {editingReservationFor && (
            <div className="p-3 bg-gray-50 rounded text-sm">
              <p>
                Available Units:
                {' '}
                <b>{editingReservationFor.availableUnits}</b>
              </p>
            </div>
          )}
          <Select
            label="Customer Organization"
            required
            value={reservationForm.customerOrgId}
            onChange={(e) => setReservationForm((p) => ({ ...p, customerOrgId: e.target.value }))}
            options={customers.map((c) => ({ value: c._id, label: c.companyName }))}
          />
          <Input
            label="Units to Reserve"
            required
            type="number"
            min="1"
            value={reservationForm.units}
            onChange={(e) => setReservationForm((p) => ({ ...p, units: e.target.value }))}
          />
          <DatePicker
            label="Contract Start Date"
            required
            value={reservationForm.contractStartDate}
            onChange={(e) => setReservationForm((p) => ({ ...p, contractStartDate: e.target.value }))}
          />
          <DatePicker
            label="Contract End Date"
            required
            value={reservationForm.contractEndDate}
            onChange={(e) => setReservationForm((p) => ({ ...p, contractEndDate: e.target.value }))}
          />
          <Input
            label="Notes"
            type="textarea"
            value={reservationForm.notes}
            onChange={(e) => setReservationForm((p) => ({ ...p, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowReservationModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReservation} loading={submitting}>
              Create Reservation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
