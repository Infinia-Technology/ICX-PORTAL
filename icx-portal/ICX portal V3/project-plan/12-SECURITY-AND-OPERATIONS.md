# ICX Portal — Security, Validation, Environment & Operations

---

## 1. Authentication Security

### OTP Configuration
- 6-digit numeric code, cryptographically random
- Hashed before storage (bcrypt)
- Expires in 5 minutes (TTL index on MongoDB)
- Max 3 verification attempts per OTP code
- After 3 failed attempts, OTP is invalidated — user must request a new one

### Rate Limiting (express-rate-limit)
| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/otp/request` | 5 requests per email | 15 minutes |
| `POST /api/auth/otp/verify` | 10 requests per IP | 15 minutes |
| All other API routes | 100 requests per IP | 1 minute |

### JWT Configuration
- Algorithm: HS256
- Expiry: 8 hours
- Payload: `{ userId, email, role, organizationId }`
- No refresh tokens — user re-authenticates via OTP after expiry
- Frontend Axios interceptor: on 401 response → clear localStorage → redirect to `/login`
- Auto-save ensures wizard data is persisted to draft before session expires

### CORS Configuration
```javascript
cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',  // no wildcard in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

---

## 2. Input Validation

### Backend (Zod schemas per route)
Every route handler validates request body before processing:

- **String fields:** Trim whitespace, enforce maxlength (500 default, 2000 for description fields)
- **Numeric fields:** Must be finite numbers, whole vs fractional as specified
- **Email fields:** RFC 5322 format validation
- **Phone fields:** Allow digits, spaces, `+`, `-`, `(`, `)` only
- **URL fields:** Must start with `http://` or `https://`
- **Enum fields:** Must match defined dropdown options exactly
- **Required fields:** Return 400 with field name if missing
- **Conditional fields:** Validate dependencies (e.g., if latencyMs provided, latencyDestination required)

### Frontend (field-level validation)
- Validate on blur (field loses focus)
- Validate all fields on step change (wizard) and on submit
- Show inline error messages below fields
- Prevent form submission until all required fields pass
- Character counter for limited fields (500/2000 chars)

---

## 3. File Upload Security (S3/MinIO)

### Storage Architecture
- **Development:** MinIO (S3-compatible) running in Docker Compose
- **Production:** AWS S3 (or any S3-compatible service)
- **Library:** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- **Flow:** Frontend requests pre-signed upload URL → uploads directly to S3 → backend stores the S3 key in the document model

### Upload Flow
```
1. Frontend calls POST /api/uploads/presign { fileName, mimeType, context }
2. Backend validates type/size, generates pre-signed PUT URL (5min expiry)
3. Frontend uploads file directly to S3/MinIO via pre-signed URL
4. Frontend sends the S3 key back to backend to attach to the entity
```

### Validation Rules
| Rule | Value |
|------|-------|
| Max file size | 10 MB |
| Allowed types | PDF, DOC, DOCX, JPG, PNG |
| Max files per request | 5 |
| Filename | Sanitized (remove special chars, add UUID prefix) |
| Storage | MinIO (dev) / AWS S3 (prod) |
| Access | Pre-signed GET URLs with 1hr expiry (not publicly accessible) |
| Bucket structure | `icx-uploads/{orgId}/{entityType}/{entityId}/{filename}` |

---

## 4. Environment Variables

### Required (.env)

```bash
# Server
NODE_ENV=development              # development | production
PORT=5000

# MongoDB
MONGO_URI=mongodb://mongodb:27017/icx

# Authentication
JWT_SECRET=<random-64-char-string>
OTP_EXPIRY_MINUTES=5
JWT_EXPIRY=8h

# Email (Resend)
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=support@iamsaif.ai

# Frontend URL (for CORS + email links)
CLIENT_URL=http://localhost:3000

# S3 / MinIO (File Storage)
S3_ENDPOINT=http://minio:9000      # MinIO in dev, omit for AWS S3 in prod
S3_REGION=us-east-1
S3_BUCKET=icx-uploads
S3_ACCESS_KEY=minioadmin            # MinIO default, use IAM role in prod
S3_SECRET_KEY=minioadmin
MAX_FILE_SIZE_MB=10
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api   # Only for development (prod uses nginx proxy)
```

### Production overrides
```bash
NODE_ENV=production
MONGO_URI=mongodb://user:pass@host:27017/icx?authSource=admin
CLIENT_URL=https://icx.yourdomain.com
```

---

## 5. Docker Compose — Production-Ready

See `05-ARCHITECTURE.md` for the canonical Docker Compose configuration. Key services:
- **mongodb** — MongoDB 7, health check, persistent volume
- **minio** — S3-compatible storage (dev), health check, persistent volume, console on :9001
- **server** — Express.js, depends on mongodb + minio healthy, env_file
- **client** — Nginx serving Vite build, proxy /api/ to server

All services have `restart: unless-stopped` and health checks.

---

## 6. Nginx Proxy Configuration (client/nginx.conf)

```nginx
server {
    listen 80;
    server_name localhost;
    client_max_body_size 10M;   # Match file upload limit

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;   # SPA fallback
    }

    location /api/ {
        proxy_pass http://server:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # MinIO console (dev only — remove in production)
    location /minio/ {
        proxy_pass http://minio:9001/;
        proxy_set_header Host $host;
    }
}
```

---

## 7. Seed Script Specification

The seed script (`server/src/scripts/seed.js`) creates:

| Role | Email | Count |
|------|-------|-------|
| superadmin | superadmin@icx.com | 1 |
| admin | admin@icx.com | 1 |
| supplier | supplier@icx.com | 1 (with completed KYC + 2 sample DC listings + 1 GPU cluster) |
| broker | broker@icx.com | 1 (with completed KYC + 1 broker DC company) |
| customer | customer@icx.com | 1 (with approved profile) |
| reader | reader@icx.com | 1 |
| viewer | viewer@icx.com | 1 |

Sample data includes:
- 2 DC applications (1 approved/live, 1 submitted/pending review)
- 1 GPU cluster listing (approved)
- 1 GPU demand request (submitted)
- Marketplace populated with approved listings for testing

---

## 8. Broker Registration Flow (Detailed)

```
1. Broker registers via /register/supplier
   - Selects Vendor Type = "Broker" (or "Advisor" / "Other Intermediary")
   - Organization created with type = BROKER

2. Admin approves KYC → Organization.status = APPROVED

3. Broker lands on /supplier/dashboard
   - Sees "Manage DC Companies" option in sidebar

4. Broker adds DC companies via /supplier/broker-companies
   - POST /api/supplier/broker-companies → creates BrokerDcCompany record
   - Each DC company: Legal Entity, Address, Country, Contact info

5. Broker creates DC application
   - POST /api/dc-applications with { brokerDcCompanyId: <id> }
   - Step 1 (Company Details) is PRE-FILLED from BrokerDcCompany data
   - Broker can override/edit pre-filled values
   - Application is linked to both the broker org AND the specific DC company

6. Admin reviews same as any DC application
   - Can see broker details + DC company details
```

---

## 9. Change Diff on Resubmission

### History Snapshot Format
When a listing is submitted or resubmitted, a snapshot is pushed to the `history` array:

```javascript
{
  data: { ...allFieldValues },        // Complete snapshot of all fields at time of submission
  submittedAt: Date,
  submittedBy: ObjectId,              // User who submitted
  version: Number                     // Incrementing version counter
}
```

### Diff Display (Admin Review)
When admin opens a resubmitted listing:
1. Backend returns current data + previous snapshot from `history[-2]`
2. Frontend compares field-by-field
3. Changed fields highlighted with yellow background
4. Shows "Previous: X → New: Y" inline on changed fields
5. Unchanged fields shown normally (no highlight)

### API
- `GET /api/admin/dc-listings/:id` returns `{ data, previousSnapshot }` when status = RESUBMITTED
- Same for GPU cluster review endpoint

---

## 10. Auto-Save Specification

Applies to ALL wizard forms: DC Listing, GPU Cluster, GPU Demand, DC Capacity Request.

```
Trigger: Any field value change
Debounce: 2.5 seconds after last change
Method: PUT to draft endpoint (e.g., PUT /api/dc-applications/:id/sites/:siteId)
Indicator: Small "Saving..." / "Saved" text near form header
Error handling: If save fails, show "Save failed" with retry button
Draft persistence: Drafts survive page refresh, browser close, session expiry
```

---

## 11. Viewer Role Specification

- **Access:** Admin dashboard in read-only mode + marketplace
- **Admin routes:** Viewer can access `GET` endpoints under `/api/admin/*` but NOT `PUT`/`POST`/`DELETE`
- **UI:** Same admin dashboard layout but with all action buttons (Approve/Reject/Revision) hidden
- **Marketplace:** Same as customer view (full commercial data visible)
- **Cannot:** Review/approve/reject anything, create users, modify any data

Implementation: `authorize()` middleware checks `req.method` for viewer — allows GET only on admin routes.

---

## 12. Customer Registration Field Spec

| # | Field Name | Input Type | Options | Required |
|---|-----------|-----------|---------|----------|
| 1 | Company Name | Free text | — | **Mandatory** |
| 2 | Company Type | Dropdown | Enterprise / Government / Cloud Provider / MSP / Financial Institution / Telco / Other | **Mandatory** |
| 3 | Jurisdiction | Dropdown | UAE / KSA / Qatar / Bahrain / Oman / Kuwait / Other | **Mandatory** |
| 4 | Industry/Sector | Free text | — | **Mandatory** |
| 5 | Tax/VAT Registration Number | Free text | — | **Mandatory** |
| 6 | Company Address | Free text | — | **Mandatory** |
| 7 | Website | URL | — | Optional |
| 8 | Authorised Signatory Name | Free text | — | **Mandatory** |
| 9 | Authorised Signatory Title | Free text | — | **Mandatory** |
| 10 | Billing Contact Name | Free text | — | **Mandatory** |
| 11 | Billing Contact Email | Email | — | **Mandatory** |
| 12 | Primary Use Cases | Checkboxes (multi-select) | AI/ML Training / AI Inference / HPC / Enterprise IT / Disaster Recovery / Edge Compute / Sovereign Cloud / Other | **Mandatory** |
| 13 | Location Preferences | Checkboxes | Middle East / Europe / Asia Pacific / North America / Africa / No Preference | Optional |
| 14 | Sovereignty Requirements | Checkboxes | None / Domestic Only / Sovereign Cloud / Government-Sensitive | Optional |
| 15 | Compliance Requirements | Checkboxes | GDPR / SOC 2 / ISO 27001 / PCI DSS / HIPAA / Local Data Residency / None | Optional |
| 16 | Budget Range | Dropdown | < $50K/month / $50K-$200K/month / $200K-$1M/month / $1M-$5M/month / > $5M/month / Undisclosed | Optional |
| 17 | Urgency | Dropdown | Immediate (< 1 month) / Short-term (1-3 months) / Medium-term (3-6 months) / Long-term (6+ months) / Exploratory | Optional |

---

## 13. Email Notifications — Complete List

| Event | To | Template |
|-------|-----|----------|
| OTP requested | User | OTP code + 5 min expiry |
| Supplier/Broker registered | Supplier + Admin | Registration confirmation |
| Customer registered | Customer + Admin | Application confirmation |
| KYC approved | Supplier | Access granted, can create listings |
| KYC rejected | Supplier | Reason provided |
| KYC revision requested | Supplier | Flagged fields listed |
| DC listing submitted | Supplier + Admin | Confirmation + ref number |
| DC listing approved | Supplier | Listing live |
| DC listing rejected | Supplier | Reason provided |
| DC listing revision requested | Supplier | Flagged fields + comments |
| DC listing resubmitted | Admin | Change summary |
| GPU cluster submitted | Supplier + Admin | Confirmation + ref number |
| GPU cluster approved | Supplier | Listing live |
| GPU cluster rejected | Supplier | Reason provided |
| GPU cluster revision requested | Supplier | Flagged fields + comments |
| GPU demand submitted | Customer/Supplier + Admin | Demand details |
| GPU demand matched | Customer + Admin | Matched clusters |
| DC request submitted | Customer/Supplier + Admin | Request details |
| Reader account created | Reader + Admin | Welcome + login link |
| Reader deactivated | Reader | Access suspended |

---

## 14. DataTable Specification

All list pages (DcListingsPage, GpuClustersPage, QueuePage, etc.) use a shared DataTable component.

| Feature | Specification |
|---------|--------------|
| Pagination | 20 items per page, offset-based, prev/next buttons |
| Sorting | Click column header to sort asc/desc. Default: newest first |
| Filtering | Status dropdown filter on all list pages |
| Search | Text search on name/company fields |
| Loading | Skeleton rows while fetching |
| Empty | Empty state with icon + message + CTA |
| Responsive | Horizontal scroll on mobile for wide tables |
