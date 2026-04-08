# ICX Portal — Architecture & Project Structure

---

## Directory Structure

```
icx-portal/
├── docker-compose.yml
├── .env.example
├── nginx.conf
│
├── client/                              # React 19 + Vite Frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf                       # Frontend nginx config (API proxy)
│   │
│   └── src/
│       ├── main.jsx                     # ReactDOM entry
│       ├── App.jsx                      # Router + AuthContext
│       ├── index.css                    # Tailwind + design system CSS tokens
│       │
│       ├── config/
│       │   └── constants.js             # Enums, API_URL, dropdown options
│       │
│       ├── context/
│       │   └── AuthContext.jsx           # JWT state, user role, login/logout
│       │
│       ├── hooks/
│       │   ├── useAuth.js               # Auth context consumer
│       │   ├── useApi.js                # Axios wrapper with JWT header
│       │   ├── useAutoSave.js           # 2.5s debounce draft persistence
│       │   └── useWizard.js             # Multi-step form orchestration
│       │
│       ├── lib/
│       │   ├── api.js                   # Axios instance, interceptors
│       │   └── validators.js            # Field validation helpers
│       │
│       ├── components/
│       │   ├── ui/                      # Design system primitives
│       │   │   ├── Button.jsx           # Primary(44px) / Secondary(40px) / Tertiary(36px)
│       │   │   ├── Input.jsx            # Text input with label above
│       │   │   ├── Select.jsx           # Dropdown
│       │   │   ├── Checkbox.jsx         # Multi-select checkboxes
│       │   │   ├── TextArea.jsx         # Long text with char limit
│       │   │   ├── FileUpload.jsx       # Document upload
│       │   │   ├── DatePicker.jsx       # Month/date picker
│       │   │   ├── Card.jsx             # Bordered (static) / Elevated (interactive)
│       │   │   ├── Badge.jsx            # Status badges
│       │   │   ├── Modal.jsx            # Dialog overlay
│       │   │   ├── Toast.jsx            # Notification toast
│       │   │   ├── Spinner.jsx          # Loading state
│       │   │   ├── Stepper.jsx          # Wizard step indicator
│       │   │   └── DataTable.jsx        # Sortable/filterable table
│       │   │
│       │   ├── layout/
│       │   │   ├── PublicLayout.jsx      # Navbar + footer for public pages
│       │   │   ├── DashboardLayout.jsx   # Sidebar + topbar + content area
│       │   │   ├── Sidebar.jsx           # 320px sidebar with role-based nav
│       │   │   └── Topbar.jsx            # Header bar with user info + logout
│       │   │
│       │   ├── auth/
│       │   │   ├── OtpRequestForm.jsx    # Email input → send OTP
│       │   │   ├── OtpVerifyForm.jsx     # 6-digit OTP input → verify
│       │   │   └── ProtectedRoute.jsx    # Role-based route guard
│       │   │
│       │   ├── dc-listing/              # DC wizard step components
│       │   │   ├── DcWizard.jsx         # Orchestrator (state + navigation)
│       │   │   ├── CompanyDetailsStep.jsx
│       │   │   ├── SiteDetailsStep.jsx
│       │   │   ├── MasterPlanStep.jsx
│       │   │   ├── DcSpecsStep.jsx
│       │   │   ├── PowerInfraStep.jsx
│       │   │   ├── ConnectivityStep.jsx
│       │   │   ├── CommercialTermsStep.jsx
│       │   │   ├── PhasingScheduleStep.jsx
│       │   │   ├── SiteFinancialsStep.jsx
│       │   │   └── DocumentsSubmitStep.jsx
│       │   │
│       │   ├── gpu-listing/             # GPU wizard step components
│       │   │   ├── GpuWizard.jsx
│       │   │   ├── BasicInfoStep.jsx
│       │   │   ├── ComputeNodeStep.jsx
│       │   │   ├── ComputeNetworkStep.jsx
│       │   │   ├── ManagementNetworkStep.jsx
│       │   │   ├── OobStorageStep.jsx
│       │   │   ├── ClusterDescriptionStep.jsx
│       │   │   ├── PowerFacilityStep.jsx
│       │   │   └── GpuSubmitStep.jsx
│       │   │
│       │   ├── demand/
│       │   │   ├── GpuDemandForm.jsx     # 18-field GPU demand form
│       │   │   └── DcCapacityRequestForm.jsx  # 15-field DC request form
│       │   │
│       │   ├── admin/
│       │   │   ├── QueueTable.jsx
│       │   │   ├── ReviewPanel.jsx       # Field-level flagging + comments
│       │   │   ├── AnalyticsSummary.jsx  # Recharts dashboard
│       │   │   └── UserManager.jsx       # Superadmin user CRUD
│       │   │
│       │   └── shared/
│       │       ├── StatusBadge.jsx
│       │       ├── NotificationBell.jsx
│       │       └── FieldWithFlag.jsx     # Input + admin flag/comment overlay
│       │
│       └── pages/
│           ├── public/
│           │   ├── LandingPage.jsx
│           │   ├── LoginPage.jsx
│           │   ├── SupplierRegisterPage.jsx
│           │   ├── CustomerRegisterPage.jsx
│           │   ├── TermsPage.jsx                 # Terms of Service (static)
│           │   ├── PrivacyPage.jsx               # Privacy Policy (static)
│           │   ├── NotFoundPage.jsx              # 404 page
│           │   └── ErrorPage.jsx                 # 500 / generic error
│           │
│           ├── supplier/
│           │   ├── SupplierDashboard.jsx
│           │   ├── KycWaitingPage.jsx
│           │   ├── DcListingsPage.jsx
│           │   ├── DcListingNewPage.jsx
│           │   ├── DcListingDetailPage.jsx      # View submitted listing (read-only)
│           │   ├── DcListingEditPage.jsx         # Edit listing (revision mode: flagged fields)
│           │   ├── GpuClustersPage.jsx
│           │   ├── GpuClusterNewPage.jsx
│           │   ├── GpuClusterDetailPage.jsx      # View GPU cluster (read-only)
│           │   ├── GpuClusterEditPage.jsx        # Edit GPU cluster (revision mode)
│           │   ├── GpuDemandNewPage.jsx
│           │   ├── DcRequestNewPage.jsx
│           │   ├── TeamPage.jsx
│           │   └── SettingsPage.jsx
│           │
│           ├── customer/
│           │   ├── CustomerDashboard.jsx
│           │   ├── MarketplacePage.jsx
│           │   ├── GpuDemandNewPage.jsx
│           │   ├── GpuDemandsPage.jsx
│           │   ├── DcRequestNewPage.jsx
│           │   ├── DcRequestsPage.jsx
│           │   └── SettingsPage.jsx
│           │
│           ├── admin/
│           │   ├── AdminDashboard.jsx
│           │   ├── QueuePage.jsx
│           │   ├── QueueReviewPage.jsx
│           │   ├── SuppliersPage.jsx
│           │   ├── SupplierDetailPage.jsx        # KYC detail + review
│           │   ├── CustomersPage.jsx
│           │   ├── CustomerDetailPage.jsx        # Customer verification
│           │   ├── DcListingsPage.jsx
│           │   ├── DcListingReviewPage.jsx       # DC full detail + approve/revise/reject
│           │   ├── GpuClustersPage.jsx
│           │   ├── GpuClusterReviewPage.jsx      # GPU cluster review + decision
│           │   ├── GpuDemandsPage.jsx
│           │   ├── GpuDemandDetailPage.jsx       # GPU demand + match with clusters
│           │   ├── DcRequestsPage.jsx
│           │   ├── DcRequestDetailPage.jsx       # DC request + match with listings
│           │   ├── ReadersPage.jsx                # Reader account CRUD
│           │   ├── AuditLogPage.jsx              # Superadmin: full audit trail
│           │   ├── UsersPage.jsx                 # Superadmin only
│           │   └── SettingsPage.jsx
│           │
│           └── reader/
│               └── ReaderMarketplacePage.jsx
│
│
└── server/                              # Express.js Backend
    ├── package.json
    ├── Dockerfile
    │
    └── src/
        ├── index.js                     # Express app, DB connect, routes mount
        │
        ├── config/
        │   ├── db.js                    # Mongoose connection
        │   └── resend.js               # Resend client setup
        │
        ├── middleware/
        │   ├── auth.js                  # JWT verify → req.user
        │   ├── roles.js                 # authorize(...allowedRoles) — superadmin always passes, admin passes for all except /superadmin
        │   ├── upload.js               # Multer + S3 upload (multer-s3 or pre-signed URL flow)
        │   ├── rateLimiter.js          # express-rate-limit config per route group
        │   ├── validate.js             # Zod schema validation middleware factory
        │   └── errorHandler.js         # Centralized error response
        │
        ├── models/                      # 16 Mongoose models
        │   ├── User.js
        │   ├── Otp.js
        │   ├── Organization.js
        │   ├── BrokerDcCompany.js
        │   ├── DcApplication.js
        │   ├── DcSite.js
        │   ├── DcPhasingSchedule.js
        │   ├── DcDocument.js
        │   ├── GpuClusterListing.js
        │   ├── GpuClusterDocument.js
        │   ├── GpuDemandRequest.js
        │   ├── DcCapacityRequest.js
        │   ├── TeamInvite.js
        │   ├── QueueItem.js
        │   ├── AuditLog.js
        │   └── Notification.js
        │
        ├── routes/                      # 13 route files
        │   ├── auth.routes.js
        │   ├── supplier.routes.js
        │   ├── dcApplication.routes.js
        │   ├── gpuCluster.routes.js
        │   ├── gpuDemand.routes.js
        │   ├── dcRequest.routes.js
        │   ├── customer.routes.js
        │   ├── admin.routes.js
        │   ├── reader.routes.js         # Admin reader account CRUD
        │   ├── superadmin.routes.js
        │   ├── marketplace.routes.js
        │   ├── notification.routes.js   # In-app notification CRUD
        │   └── report.routes.js         # PDF/CSV report download
        │
        ├── controllers/                 # Matching controllers
        │   ├── auth.controller.js
        │   ├── supplier.controller.js
        │   ├── dcApplication.controller.js
        │   ├── gpuCluster.controller.js
        │   ├── gpuDemand.controller.js
        │   ├── dcRequest.controller.js
        │   ├── customer.controller.js
        │   ├── admin.controller.js
        │   ├── superadmin.controller.js
        │   └── marketplace.controller.js
        │
        ├── services/
        │   ├── otp.service.js           # Generate, store, verify OTP
        │   ├── email.service.js         # Resend integration + templates
        │   ├── jwt.service.js           # Sign + verify JWT
        │   ├── queue.service.js         # Auto-create queue items
        │   ├── audit.service.js         # Log state transitions
        │   ├── s3.service.js            # S3/MinIO upload, pre-signed URLs, delete
        │   └── report.service.js        # PDF/CSV report generation (pdfkit + json2csv)
        │
        ├── utils/
        │   ├── fieldFilter.js           # Role-based field projection
        │   └── pagination.js            # Offset pagination helper
        │
        └── scripts/
            └── seed.js                  # Seed test users for all roles

```

---

## Docker Compose

```yaml
services:
  mongodb:
    image: mongo:7
    restart: unless-stopped
    ports: ["27017:27017"]
    volumes: [mongo-data:/data/db]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  minio:
    image: minio/minio
    restart: unless-stopped
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio-data:/data]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

  server:
    build: ./server
    restart: unless-stopped
    ports: ["5000:5000"]
    depends_on:
      mongodb: { condition: service_healthy }
      minio: { condition: service_healthy }
    env_file: .env
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/health', r => process.exit(r.statusCode===200?0:1))"]
      interval: 30s
      timeout: 10s
      retries: 3

  client:
    build: ./client
    restart: unless-stopped
    ports: ["80:80"]
    depends_on:
      server: { condition: service_healthy }

volumes:
  mongo-data:
  minio-data:
```

**Client Dockerfile:** Two-stage — `node:20-alpine` builds Vite, `nginx:alpine` serves static files + proxies `/api/` to `server:5000`.

**Server Dockerfile:** `node:20-alpine`, `npm install`, `node src/index.js`.

---

## Estimated File Counts

| Area | Files |
|------|-------|
| UI components | 14 |
| Layout components | 4 |
| Auth components | 3 |
| DC listing steps | 11 |
| GPU listing steps | 9 |
| Demand/request forms | 2 |
| Admin components | 4 |
| Shared components | 3 |
| Pages | ~30 |
| Hooks + Context + Lib | 7 |
| Config files (frontend) | 5 |
| **Frontend Total** | **~92** |
| Models | 16 |
| Routes | 10 |
| Controllers | 10 |
| Services | 5 |
| Middleware | 4 |
| Utils + Config + Scripts | 5 |
| **Backend Total** | **~50** |
| Docker/infra files | 4 |
| **GRAND TOTAL** | **~146 files** |
