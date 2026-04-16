const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-50 text-yellow-700',
  KYC_SUBMITTED: 'bg-blue-50 text-blue-700',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  IN_REVIEW: 'bg-purple-50 text-purple-700',
  REVISION_REQUESTED: 'bg-orange-50 text-orange-700',
  RESUBMITTED: 'bg-indigo-50 text-indigo-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  MATCHED: 'bg-teal-50 text-teal-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  NEW: 'bg-blue-50 text-blue-700',
  AVAILABLE: 'bg-green-50 text-green-700',
  RESERVED: 'bg-orange-50 text-orange-700',
  SOLD: 'bg-red-50 text-red-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
  ACTIVE: 'bg-green-50 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-50 text-red-700',
};

const variantColors = {
  default: 'bg-gray-100 text-gray-700',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-green-50 text-green-700',
  error: 'bg-red-50 text-red-700',
  warning: 'bg-orange-50 text-orange-700',
};

export default function Badge({ status, variant, children, className = '' }) {
  const colorClass = status
    ? statusColors[status] || 'bg-gray-100 text-gray-700'
    : variantColors[variant] || 'bg-gray-100 text-gray-700';

  const display = children ?? (status ? status.replace(/_/g, ' ').toLowerCase() : '');

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-full)]
        text-xs font-medium capitalize
        ${colorClass}
        ${className}
      `}
    >
      {display}
    </span>
  );
}
