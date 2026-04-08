# ICX Portal — Pre-Development Audit Report

**Date:** 07 April 2026  
**Status:** 33 issues found → ALL resolved below  
**Auditor:** Automated cross-reference of all 10 plan documents

---

## Issues Found & Resolutions

### CRITICAL (6) — All Fixed

| ID | Issue | Resolution |
|----|-------|------------|
| C-01 | Resend API key in plaintext in 01-OVERVIEW.md | **FIXED** — Replaced with env var reference. Key goes in `.env` only, never in docs. |
| C-02 | 10 detail/edit/review pages missing from 05-ARCHITECTURE.md | **FIXED** — Added all 10 pages to directory structure. |
| C-03 | Floor Plan upload field missing from DcSite model | **FIXED** — Floor plan handled via DcDocument with type `FLOOR_PLAN`. No separate field needed on DcSite. DcDocument already has the enum. |
| C-04 | DC Tier enum mismatch (Arabic "Tier 1" vs Roman "Tier I") | **FIXED** — Standardized ALL to Roman numerals: `Tier I / Tier II / Tier III / Tier IV` across GpuDemandRequest, DcCapacityRequest, and DcSite. |
| C-05 | No notification API routes defined | **FIXED** — Added 4 notification endpoints to 06-API-ROUTES.md. |
| C-06 | No admin DC request matching endpoint | **FIXED** — Added `PUT /api/admin/dc-requests/:id/match` to 06-API-ROUTES.md. |

### IMPORTANT (15) — All Fixed

| ID | Issue | Resolution |
|----|-------|------------|
| I-01 | Settings pages referenced in sidebar but unspecified | **FIXED** — Added settings routes and placeholder specification. Settings scope: notification preferences, profile edit. |
| I-02 | Viewer role contradictory (redirects to admin but blocked) | **FIXED** — Viewer added to admin route access list. Viewer sees admin dashboard in read-only mode (no action buttons). |
| I-03 | No JWT refresh/expiry handling | **FIXED** — Added spec: Axios interceptor catches 401 → redirect to /login. Auto-save preserves draft data before expiry. No refresh token (re-login via OTP). |
| I-04 | No input validation specification | **FIXED** — Added backend validation requirement: Zod schemas per route. Frontend: field-level validation before submit. |
| I-05 | No file upload validation (type/size) | **FIXED** — Added spec: Max 10MB, allowed types: PDF/DOC/DOCX/JPG/PNG, filename sanitization. |
| I-06 | No rate limiting on auth endpoints | **FIXED** — Added spec: express-rate-limit, 5 OTP requests/email/15min, 10 verify attempts/IP/15min. |
| I-07 | No CORS configuration specified | **FIXED** — Added spec: CORS allows client origin only, no wildcard in production. |
| I-08 | Customer registration fields not fully specified | **FIXED** — Added customer field spec to 04 document with all dropdown options and mandatory flags. |
| I-09 | Build order missing 10+ page files | **FIXED** — Added missing pages to Sprint 3/4/5 tasks. |
| I-10 | "Remarks" field missing from DcSite model | **FIXED** — Added `remarks: String` to DcSite model. |
| I-11 | Broker registration flow underspecified | **FIXED** — Added broker flow documentation. |
| I-12 | Admin internal fields (LoI/MSA, doc tracking) not in API | **FIXED** — Added admin document status update endpoint. |
| I-13 | Docker setup missing health checks | **FIXED** — Added health checks, restart policies, MongoDB auth. |
| I-14 | No environment variable documentation | **FIXED** — Created complete env var list. |
| I-15 | Change diff on resubmission not specified | **FIXED** — Added history snapshot format and diff display spec. |

### MINOR (12) — All Fixed

| ID | Issue | Resolution |
|----|-------|------------|
| M-01 | Model count says 15, actual is 16 | **FIXED** — Corrected to 16. |
| M-02 | Upload route redundancy (generic vs entity-specific) | **FIXED** — Clarified: generic route unused, entity-specific routes handle uploads. Removed generic route. |
| M-03 | Scope of Works dropdown has only 1 option | **FIXED** — Changed to free text field (supplier enters scope description). |
| M-04 | NDA fields as Boolean vs Dropdown | **FIXED** — Keep as Boolean in model, render as Yes/No dropdown in frontend. Null = not answered. |
| M-05 | Auto-save not confirmed for GPU wizard | **FIXED** — Confirmed: auto-save applies to all wizard forms (DC, GPU, demands, requests). |
| M-06 | Supplier marketplace access unspecified | **FIXED** — Clarified: suppliers cannot browse marketplace (competitive separation). |
| M-07 | GPU Notes field missing maxlength in spec | **FIXED** — Added "500 chars" to field spec. |
| M-08 | DataTable sorting/filtering unspecified | **FIXED** — Added: all list pages support sort by date/status, filter by status dropdown, 20 items/page. |
| M-09 | googleMapsLink missing required in model | **FIXED** — Added `required: true` to model. |
| M-10 | Seed script spec missing | **FIXED** — Added seed specification. |
| M-11 | GPU notes/googleMapsLink missing required | **FIXED** — Same as M-09. |
| M-12 | Nginx proxy config not detailed | **FIXED** — Added nginx config specification. |

---

## Changes Applied to Plan Documents

All fixes have been applied to the source documents (files 01-10). See the updated files for the complete corrected specifications.

---

## Product Launch Readiness Audit (08 April 2026)

A second audit was performed from a product/launch perspective, comparing all plan docs against the full PRD v2. **11 launch blockers were identified and ALL resolved:**

| # | Launch Blocker | Resolution |
|---|---------------|------------|
| 1 | Tech stack mismatch (PRD said Next.js/PostgreSQL) | PRD updated to reflect confirmed stack (React+Vite/MongoDB) |
| 2 | S3 file storage (was local disk) | MinIO (dev) + AWS S3 (prod) added. Pre-signed URL flow. Docker Compose includes MinIO. |
| 3 | Report download (PDF/CSV) | Report service (pdfkit + json2csv) + 6 report endpoints + UI download buttons added |
| 4 | No Terms of Service | TermsPage added to frontend routes + architecture + Sprint 2 |
| 5 | No Privacy Policy | PrivacyPage added to frontend routes + architecture + Sprint 2 |
| 6 | No Cookie Consent | CookieConsent component added to Sprint 1 UI components |
| 7 | No 404/error pages | NotFoundPage + ErrorPage added to Sprint 1 |
| 8 | No mobile responsive strategy | Mobile responsive pass added to Sprint 6 + Tailwind breakpoints in PRD NFRs |
| 9 | No backup strategy | MongoDB backup script (mongodump cron) added to Sprint 6 |
| 10 | No GDPR data subject handling | Data export API + account deactivation endpoint added (2 new routes) |
| 11 | No data export for users | Covered by report download (#3) + GDPR export (#10) |

**Additional items added to plan:**
- Reader management admin page + 6 API routes
- Admin audit log frontend page
- Notification API routes (4 endpoints)
- Updated PRD Section 2 (tech stack), Section 13 (key differences), Section 15 (non-functional requirements)
- Total endpoints: 81 → 95
- Total files: ~146 → ~160
- Total tasks: 79 → 86
