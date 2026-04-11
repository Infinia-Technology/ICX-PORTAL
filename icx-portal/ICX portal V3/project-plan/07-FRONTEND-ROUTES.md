# ICX Portal — Frontend Routes & Pages

---

## Public Routes (No auth required)

| Route | Page | Description |
|-------|------|-------------|
| `/` | LandingPage | Hero, categories, stats, CTAs (Register Supplier, Register Buyer, GPU Demand, DC Request) |
| `/login` | LoginPage | OTP request + verify → role-based redirect |
| `/register/supplier` | SupplierRegisterPage | OTP verify → 6-field KYC form |
| `/register/customer` | CustomerRegisterPage | OTP verify → customer profile form |
| `/terms` | TermsPage | Terms of Service (static content) |
| `/privacy` | PrivacyPage | Privacy Policy (static content) |
| `/*` (catch-all) | NotFoundPage | 404 page with link back to home |

---

## Supplier Routes (roles: supplier, broker)

| Route | Page | Description |
|-------|------|-------------|
| `/supplier/dashboard` | SupplierDashboard | KYC status, listings summary, inquiries, quick actions |
| `/supplier/kyc-waiting` | KycWaitingPage | Shows after KYC submitted, before admin decision |
| `/supplier/dc-listings` | DcListingsPage | Table of own DC applications with status |
| `/supplier/dc-listings/new` | DcListingNewPage | DC wizard (9 steps) |
| `/supplier/dc-listings/:id` | DcListingDetailPage | View submitted listing (read-only) |
| `/supplier/dc-listings/:id/edit` | DcListingEditPage | Edit listing (revision mode: flagged fields highlighted) |
| `/supplier/gpu-clusters` | GpuClustersPage | Table of own GPU cluster listings |
| `/supplier/gpu-clusters/new` | GpuClusterNewPage | GPU wizard (8 steps) |
| `/supplier/gpu-clusters/:id` | GpuClusterDetailPage | View GPU cluster detail |
| `/supplier/gpu-clusters/:id/edit` | GpuClusterEditPage | Edit GPU cluster (revision mode) |
| `/supplier/gpu-demands/new` | GpuDemandNewPage | Submit GPU demand (on behalf of client) |
| `/supplier/dc-requests/new` | DcRequestNewPage | Submit DC capacity request (on behalf of client) |
| `/supplier/team` | TeamPage | Invite subordinates, manage permissions |

---

## Customer Routes (role: customer)

| Route | Page | Description |
|-------|------|-------------|
| `/customer/dashboard` | CustomerDashboard | Overview, quick actions, recent demands |
| `/customer/marketplace` | MarketplacePage | Browse approved DC + GPU listings (full commercial view) |
| `/customer/gpu-demands` | GpuDemandsPage | List own GPU demand requests |
| `/customer/gpu-demands/new` | GpuDemandNewPage | Submit new GPU demand |
| `/customer/dc-requests` | DcRequestsPage | List own DC capacity requests |
| `/customer/dc-requests/new` | DcRequestNewPage | Submit new DC capacity request |

---

## Admin Routes (roles: admin, superadmin)

| Route | Page | Description |
|-------|------|-------------|
| `/admin/dashboard` | AdminDashboard | KPIs, analytics charts, pending actions |
| `/admin/queue` | QueuePage | Centralised incoming requests queue |
| `/admin/queue/:id` | QueueReviewPage | Review item detail (field flagging + decision) |
| `/admin/suppliers` | SuppliersPage | All suppliers/brokers list |
| `/admin/suppliers/:id` | SupplierDetailPage | Supplier KYC detail + review |
| `/admin/customers` | CustomersPage | All customers list |
| `/admin/customers/:id` | CustomerDetailPage | Customer detail + verification |
| `/admin/dc-listings` | AdminDcListingsPage | All DC applications (all statuses) |
| `/admin/dc-listings/:id` | DcListingReviewPage | DC full detail + approve/revise/reject |
| `/admin/gpu-clusters` | AdminGpuClustersPage | All GPU clusters (all statuses) |
| `/admin/gpu-clusters/:id` | GpuClusterReviewPage | GPU cluster review + decision |
| `/admin/gpu-demands` | AdminGpuDemandsPage | All GPU demand requests (pipeline) |
| `/admin/gpu-demands/:id` | GpuDemandDetailPage | GPU demand detail + match with clusters |
| `/admin/dc-requests` | AdminDcRequestsPage | All DC capacity requests |
| `/admin/dc-requests/:id` | DcRequestDetailPage | DC request detail + match with listings |

---

## Superadmin Routes (role: superadmin)

| Route | Page | Description |
|-------|------|-------------|
| `/admin/readers` | ReadersPage | Reader account CRUD: create, activate/deactivate, resend, revoke |
| `/admin/audit-log` | AuditLogPage | Full audit trail with filters (superadmin full, admin read-only) |
| `/admin/users` | UsersPage | Create/edit/promote/deactivate all users (superadmin only) |

---

## Reader Routes (role: reader)

| Route | Page | Description |
|-------|------|-------------|
| `/reader/marketplace` | ReaderMarketplacePage | Browse DC + GPU (subset view: no pricing, no contacts, no docs) |

---

## Login Redirect Logic

After OTP verification, redirect based on role + onboarding status:

```
supplier/broker:
  → KYC not submitted   → /register/supplier (if new) or /supplier/dashboard
  → KYC submitted       → /supplier/kyc-waiting
  → KYC approved        → /supplier/dashboard
  → KYC rejected        → /supplier/dashboard (shows rejection + re-apply)

customer:
  → Profile not complete → /register/customer
  → Profile pending      → /customer/dashboard (shows pending message)
  → Approved             → /customer/dashboard

admin/superadmin:
  → /admin/dashboard

reader:
  → /reader/marketplace

viewer:
  → /admin/dashboard (read-only)
```

---

## Sidebar Navigation (per role)

### Supplier/Broker Sidebar
- Dashboard
- DC Listings
- GPU Clusters
- GPU Demand Request
- DC Capacity Request
- Team Management
- Settings

### Customer Sidebar
- Dashboard
- DC Marketplace
- GPU Marketplace
- GPU Demands
- DC Capacity Requests
- Settings

### Admin Sidebar
- Dashboard
- Review Queue
- Suppliers
- Customers
- DC Listings
- GPU Clusters
- GPU Demands
- DC Requests
- Readers
- Audit Log
- Users (superadmin only)
- Settings

### Reader Sidebar
- Marketplace
- Settings

---

## Total Page Count: ~35 pages
