import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Info, X } from 'lucide-react';

const PAGE_OVERVIEWS = {
  // Admin
  '/admin/dashboard': {
    title: 'Admin Dashboard',
    description: 'Central command for the platform. Switch between Workspace (queue + KPIs) and Analytics (charts + summaries).',
    highlights: ['Review pending queue items', 'Monitor supplier & customer counts', 'Track DC and GPU listing statuses', 'View platform-wide charts'],
  },
  '/admin/suppliers': {
    title: 'Suppliers',
    description: 'Browse and manage all registered supplier organizations on the platform.',
    highlights: ['Filter by KYC status', 'View supplier profiles and listings', 'Approve or request revisions'],
  },
  '/admin/customers': {
    title: 'Customers',
    description: 'View all registered customer organizations and their associated demands.',
    highlights: ['Review customer profiles', 'Track GPU demands and DC requests', 'Monitor KYC status'],
  },
  '/admin/dc-listings': {
    title: 'DC Listings',
    description: 'All data center listings submitted by suppliers across the platform.',
    highlights: ['Filter by status, country, MW', 'Review and approve listings', 'Export listing data'],
  },
  '/admin/gpu-clusters': {
    title: 'GPU Listings',
    description: 'All GPU cluster listings submitted by suppliers.',
    highlights: ['Filter by technology, location, status', 'Review and approve GPU listings', 'Export cluster data'],
  },
  '/admin/inventory': {
    title: 'GPU Requests (Inventory)',
    description: 'Inventory items linked to approved GPU clusters — unit-level availability tracking.',
    highlights: ['View available, reserved, and sold units', 'Filter by unit type and status', 'Export inventory reports'],
  },
  '/admin/gpu-demands': {
    title: 'GPU Requests',
    description: 'GPU capacity requests submitted by customers.',
    highlights: ['Review customer requirements', 'Filter by technology and status', 'Match demands to available clusters'],
  },
  '/admin/dc-requests': {
    title: 'DC Requests',
    description: 'Data center capacity requests submitted by customers.',
    highlights: ['View customer site requirements', 'Filter by status and location', 'Match requests to DC listings'],
  },
  '/admin/archives': {
    title: 'Archives',
    description: 'Listings, demands, and requests that have been archived from active view.',
    highlights: ['Browse archived records', 'Restore archived items', 'Filter by type and date'],
  },
  '/admin/reports': {
    title: 'Reports',
    description: 'Generate and export reports across all platform data modules.',
    highlights: ['Select fields and apply filters', 'Export to PDF, DOCX, XLSX, CSV, or JSON', 'Preview data before download'],
  },
  '/admin/users': {
    title: 'Users',
    description: 'Manage all user accounts across the platform (Superadmin only).',
    highlights: ['View all users and roles', 'Create or deactivate accounts', 'Assign roles and organizations'],
  },
  '/admin/audit-log': {
    title: 'Audit Log',
    description: 'Full trail of all actions taken on the platform for compliance and traceability.',
    highlights: ['Filter by user, action type, date', 'Track changes to listings and profiles', 'Export audit records'],
  },
  '/admin/settings': {
    title: 'Platform Settings',
    description: 'Configure platform-level settings and preferences.',
    highlights: ['Manage email templates', 'Configure system defaults', 'View platform configuration'],
  },

  // Supplier
  '/supplier/dashboard': {
    title: 'Supplier Dashboard',
    description: 'Your supplier portal home. Switch between Dashboard (quick links) and Analytics (listing stats).',
    highlights: ['Navigate to DC and GPU listings', 'View listing counts by status', 'Manage your team'],
  },
  '/supplier/dc-listings': {
    title: 'DC Listings',
    description: 'All your data center listings — drafts, submitted, and approved.',
    highlights: ['Create new DC listings', 'Track approval status', 'Edit draft or revision-requested listings'],
  },
  '/supplier/dc-listings/new': {
    title: 'New DC Listing',
    description: 'Multi-step form to submit a new data center listing for review.',
    highlights: ['10 steps: Company Details to Documents', 'Auto-save on each step', 'Submit for admin review when complete'],
  },
  '/supplier/gpu-clusters': {
    title: 'GPU Listings',
    description: 'All your GPU cluster listings — drafts, submitted, and approved.',
    highlights: ['Create new GPU listings', 'Track approval status', 'Edit and resubmit listings'],
  },
  '/supplier/gpu-clusters/new': {
    title: 'New GPU Listing',
    description: 'Multi-step form to submit a new GPU cluster listing for review.',
    highlights: ['8 steps: Basic Info to Extended Information', 'Auto-save on each step', 'Submit for admin review when complete'],
  },
  '/supplier/inventory': {
    title: 'GPU Requests (Inventory)',
    description: 'Manage your GPU inventory units linked to approved GPU cluster listings.',
    highlights: ['Add new inventory units', 'Track availability, reserved, and sold status', 'Link units to GPU cluster listings'],
  },
  '/supplier/team': {
    title: 'Team',
    description: 'Manage team members invited to your organization.',
    highlights: ['Invite team members by email', 'View pending and accepted invites', 'Revoke access when needed'],
  },
  '/supplier/settings': {
    title: 'Supplier Settings',
    description: 'View and update your organization profile and KYC details.',
    highlights: ['Update vendor type and mandate status', 'View KYC approval status', 'Manage NDA and contact info'],
  },

  // Customer
  '/customer/dashboard': {
    title: 'Customer Dashboard',
    description: 'Your customer portal home. Switch between Dashboard (quick links) and Analytics (demand stats).',
    highlights: ['Submit new GPU demands or DC requests', 'View open and closed demands', 'Track request activity'],
  },
  '/customer/gpu-demands': {
    title: 'GPU Requests',
    description: 'All your GPU capacity requests submitted to the platform.',
    highlights: ['Submit new GPU demand requests', 'Track status of active demands', 'View demand history'],
  },
  '/customer/gpu-demands/new': {
    title: 'New GPU Demand',
    description: 'Submit a new GPU capacity requirement for matching against available clusters.',
    highlights: ['Specify technology, cluster size, location', 'Set contract length and timeline', 'Add connectivity and pricing requirements'],
  },
  '/customer/dc-requests': {
    title: 'DC Requests',
    description: 'All your data center capacity requests submitted to the platform.',
    highlights: ['Submit new DC capacity requests', 'Track status of active requests', 'View request history'],
  },
  '/customer/dc-requests/new': {
    title: 'New DC Request',
    description: 'Submit a new data center capacity requirement for matching.',
    highlights: ['Specify location and power requirements', 'Set compliance and sovereignty needs', 'Define budget and timeline'],
  },
  '/customer/settings': {
    title: 'Customer Settings',
    description: 'View and update your organization profile details.',
    highlights: ['Update company information', 'Manage billing contact', 'Update use case and budget range'],
  },

  // Reader
  '/reader/marketplace': {
    title: 'Marketplace',
    description: 'Browse available DC and GPU listings on the platform.',
    highlights: ['Filter listings by location and specs', 'View approved listings', 'Read-only access'],
  },
};

// Match the current path to a page overview (supports dynamic segments like /admin/suppliers/:id)
function matchOverview(pathname) {
  if (PAGE_OVERVIEWS[pathname]) return PAGE_OVERVIEWS[pathname];
  // Try prefix match for detail/edit pages
  const segments = pathname.split('/').filter(Boolean);
  for (let len = segments.length - 1; len >= 1; len--) {
    const prefix = '/' + segments.slice(0, len).join('/');
    if (PAGE_OVERVIEWS[prefix]) {
      // Return with a note that this is a detail view
      const base = PAGE_OVERVIEWS[prefix];
      return { ...base, title: base.title + ' — Detail' };
    }
  }
  return null;
}

export default function PageOverview() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const overview = matchOverview(pathname);

  if (!overview) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {/* Tooltip card */}
      <div
        className={`
          w-72 bg-[var(--color-surface)] border border-[var(--color-border)]
          rounded-[var(--radius-lg)] shadow-xl p-4
          transition-all duration-200 origin-bottom-right
          ${visible
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold leading-tight">{overview.title}</h3>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">
          {overview.description}
        </p>

        {/* Highlights */}
        <ul className="space-y-1.5">
          {overview.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
              <span className="text-xs text-[var(--color-text-secondary)]">{h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trigger button */}
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        className={`
          w-10 h-10 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-200 pointer-events-auto
          ${visible
            ? 'bg-[var(--color-primary)] text-white scale-110'
            : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)] hover:text-white hover:scale-110'}
        `}
        title="Page overview"
        aria-label="Page overview"
      >
        <Info className="w-4.5 h-4.5" />
      </button>
    </div>
  );
}
