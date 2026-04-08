# ICX Portal — API Routes Specification

**Base URL:** `/api`  
**Auth:** JWT Bearer token in `Authorization` header  
**Response Format:** JSON

> **Access Rule:** `superadmin` has full access to ALL routes in the system. `admin` has full access to all routes EXCEPT `/api/superadmin/*`. Both roles can access supplier, customer, marketplace, and demand routes for oversight. The "Auth" column below shows the minimum required role(s), but admin and superadmin always have implicit access.

---

## Auth Routes (`/api/auth`)

| Method | Path | Description | Auth | Request Body |
|--------|------|-------------|------|-------------|
| POST | `/api/auth/otp/request` | Send 6-digit OTP to email | Public | `{ email }` |
| POST | `/api/auth/otp/verify` | Verify OTP, return JWT | Public | `{ email, otp }` |
| POST | `/api/auth/register/supplier` | Create supplier/broker org + user | OTP-verified | `{ email, vendorType, mandateStatus, ndaRequired, ndaSigned, contactNumber }` |
| POST | `/api/auth/register/customer` | Create customer org + user | OTP-verified | `{ email, companyName, companyType, jurisdiction, ... }` |
| GET | `/api/auth/me` | Get current user + org + role | JWT | — |

---

## Supplier Routes (`/api/supplier`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/supplier/profile` | Get own org profile | supplier, broker |
| PUT | `/api/supplier/profile` | Update KYC fields (if revision requested) | supplier, broker |
| POST | `/api/supplier/profile/submit` | Submit KYC for admin review | supplier, broker |

### Team Management

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/supplier/team` | List team members/invites | supplier, broker (approved) |
| POST | `/api/supplier/team/invite` | Invite subordinate by email | supplier, broker (approved) |
| DELETE | `/api/supplier/team/:id` | Revoke subordinate access | supplier, broker (approved) |

### Broker Companies

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/supplier/broker-companies` | List broker's DC companies | broker (approved) |
| POST | `/api/supplier/broker-companies` | Add DC company under broker | broker (approved) |
| PUT | `/api/supplier/broker-companies/:id` | Update broker DC company | broker (approved) |

---

## DC Application Routes (`/api/dc-applications`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/dc-applications` | List own DC applications | supplier, broker, subordinate |
| POST | `/api/dc-applications` | Create new DC application (draft) | supplier, broker (approved) |
| GET | `/api/dc-applications/:id` | Get DC app detail with all sites | supplier, broker, subordinate |
| PUT | `/api/dc-applications/:id` | Update DC app (company details) | supplier, broker |
| POST | `/api/dc-applications/:id/submit` | Submit for admin review | supplier, broker |
| POST | `/api/dc-applications/:id/resubmit` | Resubmit after revision | supplier, broker |
| POST | `/api/dc-applications/:id/sites` | Add DC site to application | supplier, broker, subordinate |
| GET | `/api/dc-applications/:id/sites/:siteId` | Get single site | supplier, broker, subordinate |
| PUT | `/api/dc-applications/:id/sites/:siteId` | Update site (auto-save) | supplier, broker, subordinate |
| DELETE | `/api/dc-applications/:id/sites/:siteId` | Remove site | supplier, broker |
| GET | `/api/dc-sites/:siteId/phasing` | Get phasing schedule rows | supplier, broker, subordinate |
| PUT | `/api/dc-sites/:siteId/phasing` | Update phasing grid (bulk upsert) | supplier, broker, subordinate |
| POST | `/api/dc-sites/:siteId/documents` | Upload document (multer) | supplier, broker, subordinate |
| DELETE | `/api/dc-sites/:siteId/documents/:docId` | Remove document | supplier, broker |

---

## GPU Cluster Routes (`/api/gpu-clusters`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/gpu-clusters` | List own GPU cluster listings | supplier, broker |
| POST | `/api/gpu-clusters` | Create GPU cluster draft | supplier, broker (approved) |
| GET | `/api/gpu-clusters/:id` | Get GPU cluster detail | supplier, broker, subordinate |
| PUT | `/api/gpu-clusters/:id` | Update GPU cluster (auto-save) | supplier, broker, subordinate |
| POST | `/api/gpu-clusters/:id/submit` | Submit for review | supplier, broker |
| POST | `/api/gpu-clusters/:id/resubmit` | Resubmit after revision | supplier, broker |
| POST | `/api/gpu-clusters/:id/documents` | Upload GPU doc | supplier, broker, subordinate |
| DELETE | `/api/gpu-clusters/:id/documents/:docId` | Remove GPU doc | supplier, broker |

---

## GPU Demand Routes (`/api/gpu-demands`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/gpu-demands` | List own GPU demand requests | customer, supplier, broker |
| POST | `/api/gpu-demands` | Create GPU demand request | customer, supplier, broker |
| GET | `/api/gpu-demands/:id` | Get demand detail | customer, supplier, broker (own) |
| PUT | `/api/gpu-demands/:id` | Update demand (draft) | customer, supplier, broker (own) |
| POST | `/api/gpu-demands/:id/submit` | Submit demand | customer, supplier, broker |

---

## DC Capacity Request Routes (`/api/dc-requests`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/dc-requests` | List own DC capacity requests | customer, supplier, broker |
| POST | `/api/dc-requests` | Create DC capacity request | customer, supplier, broker |
| GET | `/api/dc-requests/:id` | Get request detail | customer, supplier, broker (own) |
| PUT | `/api/dc-requests/:id` | Update request (draft) | customer, supplier, broker (own) |
| POST | `/api/dc-requests/:id/submit` | Submit request | customer, supplier, broker |

---

## Customer Routes (`/api/customer`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/customer/profile` | Get customer org profile | customer |
| PUT | `/api/customer/profile` | Update profile (if revision requested) | customer |

---

## Admin Routes (`/api/admin`)

### Queue

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/queue` | All queue items (filterable: type, status, date; sortable; paginated) | admin, superadmin |
| GET | `/api/admin/queue/:id` | Queue item detail with full referenced entity | admin, superadmin |

### KYC Review

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/suppliers` | List all supplier/broker orgs | admin, superadmin |
| GET | `/api/admin/suppliers/:id` | Supplier detail + KYC | admin, superadmin |
| PUT | `/api/admin/suppliers/:id/kyc` | Approve / Reject / Request Revision (with flaggedFields + fieldComments) | admin, superadmin |

### Listing Review

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/dc-listings` | All DC applications (all statuses) | admin, superadmin |
| GET | `/api/admin/dc-listings/:id` | DC application full detail with all sites | admin, superadmin |
| PUT | `/api/admin/dc-listings/:id/review` | Approve / Reject / Request Revision | admin, superadmin |
| GET | `/api/admin/gpu-clusters` | All GPU cluster listings | admin, superadmin |
| GET | `/api/admin/gpu-clusters/:id` | GPU cluster full detail | admin, superadmin |
| PUT | `/api/admin/gpu-clusters/:id/review` | Approve / Reject / Request Revision | admin, superadmin |

### Customer Review

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/customers` | All customer applications | admin, superadmin |
| GET | `/api/admin/customers/:id` | Customer detail | admin, superadmin |
| PUT | `/api/admin/customers/:id/verify` | Approve / Reject / Request Revision | admin, superadmin |

### Demand/Request Matching

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/gpu-demands` | All GPU demand requests | admin, superadmin |
| GET | `/api/admin/gpu-demands/:id` | GPU demand detail | admin, superadmin |
| PUT | `/api/admin/gpu-demands/:id/match` | Match demand with cluster IDs | admin, superadmin |
| GET | `/api/admin/dc-requests` | All DC capacity requests | admin, superadmin |
| GET | `/api/admin/dc-requests/:id` | DC request detail | admin, superadmin |
| PUT | `/api/admin/dc-requests/:id/match` | Match DC request with listing IDs | admin, superadmin |

### Document Tracking (Admin)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| PUT | `/api/admin/documents/:docId/status` | Update received/reviewed status on any document | admin, superadmin |

### Analytics

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/analytics` | Dashboard analytics (sums of MW, GPU count, listings by status, etc.) | admin, superadmin |

---

## Superadmin Routes (`/api/superadmin`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/superadmin/users` | List all users (all roles) | superadmin |
| POST | `/api/superadmin/users` | Create user (set any role) | superadmin |
| PUT | `/api/superadmin/users/:id` | Edit user (change role, activate/deactivate) | superadmin |
| DELETE | `/api/superadmin/users/:id` | Remove user | superadmin |
| GET | `/api/superadmin/audit-log` | Full audit trail | superadmin |

---

## Marketplace Routes (`/api/marketplace`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/marketplace/dc-listings` | Browse approved DC listings (role-based field filtering) | customer, reader, viewer |
| GET | `/api/marketplace/dc-listings/:id` | DC listing detail (customer vs reader view) | customer, reader, viewer |
| GET | `/api/marketplace/gpu-clusters` | Browse approved GPU clusters (role-based) | customer, reader, viewer |
| GET | `/api/marketplace/gpu-clusters/:id` | GPU cluster detail (role-based) | customer, reader, viewer |

---

## Reader Management Routes (`/api/admin/readers`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/readers` | List all reader accounts | admin, superadmin |
| POST | `/api/admin/readers` | Create reader account (sends welcome email) | admin, superadmin |
| GET | `/api/admin/readers/:id` | Get reader detail (login activity, field visibility config) | admin, superadmin |
| PUT | `/api/admin/readers/:id` | Update reader (activate/deactivate, adjust field visibility) | admin, superadmin |
| DELETE | `/api/admin/readers/:id` | Revoke reader permanently | admin, superadmin |
| POST | `/api/admin/readers/:id/resend` | Resend welcome email with login link | admin, superadmin |

---

## Report Routes (`/api/reports`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/reports/dc-listing/:id/pdf` | Download DC listing report as PDF | supplier (own), admin, superadmin |
| GET | `/api/reports/dc-listing/:id/csv` | Download DC listing report as CSV | supplier (own), admin, superadmin |
| GET | `/api/reports/gpu-cluster/:id/pdf` | Download GPU cluster report as PDF | supplier (own), admin, superadmin |
| GET | `/api/reports/gpu-cluster/:id/csv` | Download GPU cluster report as CSV | supplier (own), admin, superadmin |
| GET | `/api/reports/supplier/:id/pdf` | Download full supplier profile + all listings report | admin, superadmin |
| GET | `/api/reports/analytics/csv` | Download analytics data as CSV | admin, superadmin |

---

## GDPR / Data Export Routes (`/api/account`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/account/export` | Download all own data as JSON (GDPR portability) | any authenticated |
| POST | `/api/account/deactivate` | Self-service account deactivation request | any authenticated |

---

## Notification Routes (`/api/notifications`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/notifications` | List current user's notifications (paginated) | any authenticated |
| GET | `/api/notifications/unread-count` | Get unread count | any authenticated |
| PUT | `/api/notifications/:id/read` | Mark single notification as read | any authenticated |
| PUT | `/api/notifications/read-all` | Mark all as read | any authenticated |

---

## Total Endpoint Count

| Area | Count |
|------|-------|
| Auth | 5 |
| Supplier | 9 |
| DC Applications | 14 |
| GPU Clusters | 8 |
| GPU Demands | 5 |
| DC Requests | 5 |
| Customer | 2 |
| Admin | 20 |
| Reader Management | 6 |
| Superadmin | 5 |
| Marketplace | 4 |
| Notifications | 4 |
| Reports | 6 |
| GDPR / Account | 2 |
| **TOTAL** | **95** |
