# ICX Portal — Access Control & Field Visibility

---

## Role-Based Access Control (RBAC)

### Route Protection Matrix

| Route Group | superadmin | admin | supplier | broker | subordinate | customer | reader | viewer |
|-------------|-----------|-------|----------|--------|-------------|----------|--------|--------|
| `/api/auth/*` | Public | Public | Public | Public | Public | Public | Public | Public |
| `/api/supplier/*` | **Yes (full)** | **Yes (full)** | Yes | Yes | Limited | - | - | - |
| `/api/dc-applications/*` | **Yes (full)** | **Yes (full)** | Yes | Yes | Limited | - | - | - |
| `/api/gpu-clusters/*` | **Yes (full)** | **Yes (full)** | Yes | Yes | Limited | - | - | - |
| `/api/gpu-demands/*` | **Yes (full)** | **Yes (full)** | Yes | Yes | - | Yes | - | - |
| `/api/dc-requests/*` | **Yes (full)** | **Yes (full)** | Yes | Yes | - | Yes | - | - |
| `/api/customer/*` | **Yes (full)** | **Yes (full)** | - | - | - | Yes | - | - |
| `/api/admin/*` | **Yes (full)** | Yes | - | - | - | - | - | - |
| `/api/superadmin/*` | **Yes (full)** | - | - | - | - | - | - | - |
| `/api/marketplace/*` | **Yes (full)** | **Yes (full)** | - | - | - | Yes | Yes | Yes |
| `/api/notifications/*` | **Yes (full)** | **Yes (full)** | Yes | Yes | Yes | Yes | Yes | Yes |

> **Viewer special rule:** Viewer can access `GET` methods on `/api/admin/*` routes (read-only) but NOT `PUT`/`POST`/`DELETE`. UI hides all action buttons for viewer role.

> **Key rule:** Superadmin inherits ALL permissions from every role. Admin inherits all permissions except superadmin-exclusive routes (user CRUD, audit log). Both can access any route in the system for oversight purposes.

### Subordinate Permissions (Scoped)

Subordinates can ONLY perform actions within their granted permissions:

| Permission | Allowed Actions |
|-----------|----------------|
| `documents` | Upload, rename, delete documents on listings |
| `site_details` | Edit DC site information fields |
| `technical` | Edit power, connectivity, specifications fields |
| `commercial` | Edit pricing, lease terms, financial fields |
| `phasing` | Edit phasing schedule |
| `financials` | Edit site financials |

Subordinates **cannot**: submit applications, change company profile, invite others, delete listings.

---

## Field Visibility Matrix (Marketplace)

When browsing the marketplace, different roles see different fields:

### DC Listings

| Data Field | Supplier (Editor) | Customer (Buyer) | Reader (Browse-Only) |
|------------|-------------------|-------------------|---------------------|
| DC Site Name & Location | Visible | Visible | Visible |
| Country & Region | Visible | Visible | Visible |
| Total MW Capacity | Visible | Visible | Visible |
| Availability Timeline | Visible | Visible | Visible |
| Cooling & Power Overview | Visible | Visible | Visible |
| Tiering / Certifications | Visible | Visible | Visible |
| Floor Space & Rack Density | Visible | Visible | Visible |
| NRC / MRC / Electricity Rate | Visible | Visible | **HIDDEN** |
| Deposit, Escalation, Lease Terms | Visible | Visible | **HIDDEN** |
| Insurance Details | Visible | Visible | **HIDDEN** |
| Internal Contacts (Name, Mobile) | Visible | **HIDDEN** | **HIDDEN** |
| Agency / Broker Details | Visible | **HIDDEN** | **HIDDEN** |
| Developer / Operator Details | Visible | Visible | **HIDDEN** |
| Uploaded Documents | Visible | **HIDDEN** | **HIDDEN** |

### GPU Clusters

| Data Field | Supplier (Editor) | Customer (Buyer) | Reader (Browse-Only) |
|------------|-------------------|-------------------|---------------------|
| GPU Technology & Cluster Size | Visible | Visible | Visible |
| Location & Country | Visible | Visible | Visible |
| Availability Date | Visible | Visible | Visible |
| Compute Node Specs | Visible | Visible | Visible |
| Network Topology & Technology | Visible | Visible | Visible |
| Target Price / Commercial Terms | Visible | Visible | **HIDDEN** |
| Restricted Use / Export Constraints | Visible | **HIDDEN** | **HIDDEN** |
| Cluster Documentation | Visible | **HIDDEN** | **HIDDEN** |

---

## Application Status Flow

```
           ┌─────────┐
           │  DRAFT   │
           └────┬─────┘
                │ submit
           ┌────▼─────┐
           │ SUBMITTED │
           └────┬─────┘
                │ admin opens
           ┌────▼─────┐
           │ IN_REVIEW │
           └──┬───┬──┬─┘
              │   │  │
    approve   │   │  │  reject
              │   │  │
         ┌────▼┐  │  ┌▼────────┐
         │APPRO│  │  │REJECTED │
         │VED  │  │  └─────────┘
         └─────┘  │
                  │ request revision
           ┌──────▼──────────┐
           │REVISION_REQUESTED│
           └───────┬─────────┘
                   │ supplier fixes & resubmits
           ┌───────▼─────┐
           │ RESUBMITTED  │──────→ (back to IN_REVIEW)
           └──────────────┘
```

---

## Admin Capabilities

Admin has full access to all operational routes. They can do everything except user management.

| Action | Description |
|--------|-------------|
| **All Queue Operations** | View, filter, assign, review any queue item |
| **KYC Review** | Approve / Reject / Request Revision on any supplier/customer |
| **DC Listing Review** | View all DC applications, approve/reject/revision with field-level comments |
| **GPU Cluster Review** | View all GPU clusters, approve/reject/revision with field-level comments |
| **GPU Demand Management** | View all GPU demands, match with clusters |
| **DC Request Management** | View all DC capacity requests, match with listings |
| **Customer Management** | View/verify all customer applications |
| **Reader Management** | Create, activate/deactivate, revoke reader accounts |
| **Marketplace Access** | Full view of all marketplace listings (all fields visible) |
| **Supplier Data Access** | Can view any supplier's profile, listings, documents, team |
| **Customer Data Access** | Can view any customer's profile, demands, requests |
| **Analytics Dashboard** | View all platform analytics and KPIs |

---

## Superadmin Capabilities

Superadmin has **everything Admin has** plus exclusive user management and system-level controls.

| Action | Description |
|--------|-------------|
| **Everything Admin can do** | All admin capabilities listed above |
| **Create User** | Create any user with any role (admin, reader, viewer, supplier, customer, etc.) |
| **Edit User** | Change any user's role, email, active status |
| **Promote User** | Change role (e.g., viewer → admin, supplier → broker) |
| **Demote User** | Change role downward (e.g., admin → viewer) |
| **Deactivate/Reactivate User** | Toggle user active status without deleting |
| **Delete User** | Permanently remove any user |
| **View Audit Log** | Full system audit trail (who did what, when, IP address) |
| **System Settings** | Platform configuration (future) |

---

## Auto-Assignment Rule

When any item is submitted (KYC, DC listing, GPU cluster, GPU demand, DC request):
- A QueueItem is created
- `assignedTo` is populated with **all active admin + superadmin users**
- Any admin can pick up and review the item
