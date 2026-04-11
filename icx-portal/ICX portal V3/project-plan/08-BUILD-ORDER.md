# ICX Portal — Build Order & Sprint Plan

---

## Sprint 1: Foundation
**Goal:** App boots, auth works, landing page renders

| # | Task | Files | Priority |
|---|------|-------|----------|
| 1 | Docker Compose (MongoDB + MinIO + Express + Nginx) + Dockerfiles + nginx.conf + .env.example | 6 | P0 |
| 2 | Backend: Express app, MongoDB connection, CORS, health check, error handler | 4 | P0 |
| 3 | Mongoose models: User, Otp, Organization, Notification, AuditLog | 5 | P0 |
| 4 | OTP service: generate 6-digit, store in Otp model, verify, rate limit (3 attempts) | 1 | P0 |
| 5 | Email service: Resend integration (OTP template) | 1 | P0 |
| 6 | JWT service: sign (8hr expiry), verify, attach to req.user | 1 | P0 |
| 7 | Auth + roles + rateLimiter + validate middleware | 4 | P0 |
| 8 | S3 service: MinIO/S3 upload, pre-signed URLs, delete (@aws-sdk/client-s3) | 1 | P0 |
| 9 | Auth routes + controller: OTP request, OTP verify, register supplier, register customer, /me | 2 | P0 |
| 10 | Frontend: Vite + React + Tailwind scaffolding + CSS design tokens | 4 | P0 |
| 11 | UI components: Button, Input, Select, Checkbox, TextArea, Card, Badge, Modal, Toast, Spinner, Stepper, FileUpload, CookieConsent | 13 | P0 |
| 12 | Layout: PublicLayout, DashboardLayout, Sidebar, Topbar | 4 | P0 |
| 13 | Auth UI: AuthContext, OtpRequestForm, OtpVerifyForm, ProtectedRoute | 4 | P0 |
| 14 | LoginPage + role-based redirect + NotFoundPage + ErrorPage | 3 | P0 |

**Deliverable:** App boots with all infrastructure. User can login via OTP. 404/error pages work. File uploads go to MinIO/S3.

---

## Sprint 2: Registration + KYC Review
**Goal:** Suppliers register, admin reviews KYC

| # | Task | Files | Priority |
|---|------|-------|----------|
| 14 | Landing page (Hero, Categories, Stats, CTAs) | 1 | P0 |
| 15 | SupplierRegisterPage (OTP verify → 6-field KYC form → submit) | 1 | P0 |
| 16 | CustomerRegisterPage (OTP verify → customer profile → submit) | 1 | P0 |
| 17 | KycWaitingPage (status indicator, submitted details read-only) | 1 | P0 |
| 18 | QueueItem model + queue service (auto-create on KYC submit) | 2 | P0 |
| 19 | Admin queue page (QueueTable + filters) | 2 | P0 |
| 20 | Admin KYC review panel (field-level flagging + approve/reject/revision) | 2 | P0 |
| 21 | Admin routes + controller for KYC review | 2 | P0 |
| 22 | Email templates: registration confirm, revision requested, approved, rejected | 4 | P1 |
| 23 | Notification model + routes (list, mark read, unread count) | 2 | P0 |
| 24 | Superadmin user management (create/edit/promote/deactivate roles) | 2 | P0 |
| 25 | TermsPage + PrivacyPage (static legal content) + CookieConsent banner | 3 | P0 |
| 26 | Admin reader management page + routes (create, activate/deactivate, resend, revoke) | 3 | P0 |

**Deliverable:** Full supplier registration → admin KYC review → approval/rejection flow. Legal pages live. Reader management working.

---

## Sprint 3: DC Listing Wizard
**Goal:** Suppliers can create DC listings with all 119+ fields

| # | Task | Files | Priority |
|---|------|-------|----------|
| 25 | Models: DcApplication, DcSite, DcPhasingSchedule, DcDocument | 4 | P0 |
| 26 | useWizard hook (step nav, validation, draft persistence) | 1 | P0 |
| 27 | useAutoSave hook (2.5s debounce PUT) | 1 | P0 |
| 28 | DcWizard orchestrator + Stepper | 2 | P0 |
| 29 | Step 1: CompanyDetailsStep (7 fields) | 1 | P0 |
| 30 | Step 2: SiteDetailsStep (14 fields) + MasterPlanStep (6 fields) | 2 | P0 |
| 31 | Step 3: DcSpecsStep (28 fields, conditional: Leasehold→Years) | 1 | P0 |
| 32 | Step 4: PowerInfraStep (16 fields, Backup Power dropdown+Other, checkboxes) | 1 | P0 |
| 33 | Step 5: ConnectivityStep (13 fields, conditional: Latency→Destination) | 1 | P0 |
| 34 | Step 6: CommercialTermsStep (10 fields) | 1 | P0 |
| 35 | Step 7: PhasingScheduleStep (dynamic month picker, 11 cols/month, auto-calc) | 1 | P0 |
| 36 | Step 8: SiteFinancialsStep (10 fields) | 1 | P0 |
| 37 | Step 9: DocumentsSubmitStep (3 uploads + remarks + submit) | 1 | P0 |
| 38 | FileUpload + DatePicker components | 2 | P0 |
| 39 | Backend: DC application CRUD routes + controller | 2 | P0 |
| 40 | Backend: DC site CRUD, phasing CRUD, document upload | 3 | P0 |
| 41 | SupplierDashboard + DcListingsPage | 2 | P0 |

**Deliverable:** Supplier can create, save draft, and submit a full DC application with all fields.

---

## Sprint 4: GPU Cluster + Admin Review
**Goal:** GPU listings work, admin can review both DC and GPU

| # | Task | Files | Priority |
|---|------|-------|----------|
| 42 | Models: GpuClusterListing, GpuClusterDocument | 2 | P0 |
| 43 | GpuWizard orchestrator | 1 | P0 |
| 44 | Step 1: BasicInfoStep (12 fields) | 1 | P0 |
| 45 | Step 2: ComputeNodeStep (6 fields) | 1 | P0 |
| 46 | Step 3: ComputeNetworkStep (7 fields) | 1 | P0 |
| 47 | Step 4: ManagementNetworkStep (6 fields) | 1 | P0 |
| 48 | Step 5: OobStorageStep (3 fields) | 1 | P0 |
| 49 | Step 6: ClusterDescriptionStep (1 field + doc uploads) | 1 | P0 |
| 50 | Step 7: PowerFacilityStep (14 fields) | 1 | P0 |
| 51 | Step 8: GpuSubmitStep (review + submit) | 1 | P0 |
| 52 | Backend: GPU cluster CRUD routes + controller | 2 | P0 |
| 53 | GpuClustersPage (supplier listing table) | 1 | P0 |
| 54 | Admin DC listing review page (read-only wizard view + field flagging + decision) | 2 | P0 |
| 55 | Admin GPU cluster review page | 1 | P0 |
| 56 | FieldWithFlag component (input + admin flag/comment overlay) | 1 | P0 |
| 57 | Backend: admin listing review routes | 1 | P0 |

**Deliverable:** Full GPU listing flow + admin can review and act on both DC and GPU submissions.

---

## Sprint 5: Customer + Demands + Marketplace
**Goal:** Customers browse, request GPU/DC capacity

| # | Task | Files | Priority |
|---|------|-------|----------|
| 58 | Models: GpuDemandRequest, DcCapacityRequest | 2 | P0 |
| 59 | GpuDemandForm (18 fields from Excel) | 1 | P0 |
| 60 | DcCapacityRequestForm (15 fields) | 1 | P0 |
| 61 | Backend: GPU demand routes + DC request routes | 4 | P0 |
| 62 | CustomerDashboard | 1 | P0 |
| 63 | GpuDemandsPage + GpuDemandNewPage (customer) | 2 | P0 |
| 64 | DcRequestsPage + DcRequestNewPage (customer) | 2 | P0 |
| 65 | Supplier portal: GpuDemandNewPage + DcRequestNewPage | 2 | P0 |
| 66 | MarketplacePage (DC + GPU browse, role-based field filtering) | 1 | P0 |
| 67 | ReaderMarketplacePage (restricted view) | 1 | P0 |
| 68 | Backend: marketplace routes + fieldFilter utility | 2 | P0 |
| 69 | Admin GPU demands page + DC requests page | 2 | P0 |
| 70 | Admin demand matching interface | 1 | P1 |

**Deliverable:** Customer can browse marketplace, submit GPU/DC demands. Reader sees restricted view.

---

## Sprint 6: Analytics, Reports, GDPR, Polish
**Goal:** Admin dashboard, reports, compliance, launch readiness

| # | Task | Files | Priority |
|---|------|-------|----------|
| 71 | Admin dashboard: Recharts analytics (total MW, GPU count, listings by status) | 1 | P0 |
| 72 | AnalyticsSummary component (sum of values across listings) | 1 | P0 |
| 73 | Backend: analytics endpoint (aggregate queries) | 1 | P0 |
| 74 | NotificationBell component | 1 | P0 |
| 75 | Email on every state change (all 20+ events per 12-SECURITY-AND-OPERATIONS.md Section 13) | 1 | P0 |
| 76 | Auto-assign new submissions to all admins | 1 | P0 |
| 77 | **Report service** (pdfkit for PDF, json2csv for CSV) + report routes | 2 | P0 |
| 78 | **Report download UI** — download buttons on listing detail pages (supplier + admin) | 1 | P0 |
| 79 | **Admin Audit Log page** — filterable table of all actions | 1 | P0 |
| 80 | **GDPR: Data export API** (`GET /api/account/export`) — JSON download of own data | 1 | P0 |
| 81 | **GDPR: Account deactivation** (`POST /api/account/deactivate`) + confirmation UI | 1 | P0 |
| 82 | **MongoDB backup script** — cron-compatible mongodump script + restore docs | 1 | P0 |
| 83 | **Mobile responsive pass** — audit all pages with Tailwind breakpoints (max-w-767) | — | P0 |
| 84 | Seed script (create test users for all roles + sample data) | 1 | P0 |
| 85 | Docker Compose finalization + test full build | 1 | P0 |
| 86 | End-to-end flow testing (all 8 roles, all forms, all admin actions) | — | P0 |

**Deliverable:** Complete, launch-ready application with reports, GDPR compliance, backup strategy, mobile responsive.

---

## Total: ~86 tasks, ~160 files, 6 sprints
