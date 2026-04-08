# ICX Portal — Developer Project Plan

**Product:** ICX (Infinia Compute Exchange) — Private B2B marketplace for data center infrastructure  
**Stack:** React 19 + Vite 8 + Tailwind CSS 4 | Express.js + MongoDB 7 + Mongoose 8 | Docker Compose  
**Auth:** Pure OTP (no passwords) via Resend | JWT 8hr sessions  
**Status:** Ready for development  
**Last Updated:** 08 April 2026

---

## Folder Structure

```
icx-portal/
├── PRD-v2.md                              ← Full Product Requirements Document
├── dc supplier/
│   └── 001-Infinia DC Questionnaire...xlsx   ← Source Excel: all DC listing fields
├── gpu supplier/
│   ├── 002 - GPU Cluster Inventory...xlsx    ← Source Excel: all GPU cluster fields
│   └── GPU Client Pipeline...xlsx            ← Source Excel: all GPU demand fields
└── project-plan/                          ← YOU ARE HERE — all implementation specs
```

---

## How to Read This Plan

### Step 1: Understand the Product
| File | What You Learn |
|------|---------------|
| **01-OVERVIEW.md** | What ICX is, tech stack, user roles, auth flow, email config |

### Step 2: Set Up the Project
| File | What You Learn |
|------|---------------|
| **05-ARCHITECTURE.md** | Full directory structure (~160 files), Docker Compose with MongoDB + MinIO + Express + Nginx |
| **12-SECURITY-AND-OPERATIONS.md** | Environment variables, S3/MinIO config, rate limiting, input validation (Zod), file upload rules, CORS, nginx proxy, backup strategy, GDPR compliance |

### Step 3: Build the Database
| File | What You Learn |
|------|---------------|
| **09-DATA-MODELS.md** | All 16 Mongoose schemas with exact field names, types, enums, required flags, and relationships |

### Step 4: Build the API
| File | What You Learn |
|------|---------------|
| **06-API-ROUTES.md** | All 95 API endpoints — method, path, description, auth requirements. Covers auth, supplier, DC, GPU, customer, admin, superadmin, marketplace, readers, reports, GDPR, notifications |

### Step 5: Follow the Sprint Plan
| File | What You Learn |
|------|---------------|
| **08-BUILD-ORDER.md** | 6 sprints, 86 tasks in priority order. Sprint 1 = foundation, Sprint 6 = reports + GDPR + polish. Each task lists file count and priority (P0/P1) |

### Step 6: Build the Forms (Reference During Implementation)
| File | What You Learn |
|------|---------------|
| **02-FIELD-SPEC-DC-QUESTIONNAIRE.md** | Every DC listing field (119+ across 9 steps). Exact dropdown options, mandatory/optional, data types, conditional logic (Leasehold→Years, Latency→Destination), character limits |
| **03-FIELD-SPEC-GPU-CLUSTER.md** | Every GPU cluster field (49+ across 8 steps). Mandatory flags, data types. All fields from both Excel sheets (Basic + Extended merged) |
| **04-FIELD-SPEC-GPU-DEMAND-AND-DC-REQUEST.md** | GPU demand form (18 fields from Excel) + DC capacity request form (15 fields). Access rules (available from customer AND supplier portals) |

### Step 7: Implement Access Control
| File | What You Learn |
|------|---------------|
| **10-ACCESS-CONTROL.md** | RBAC matrix (which role can access which routes), field visibility per role (what customers vs readers see), application status flow diagram, superadmin/admin capabilities, viewer read-only rules, auto-assignment logic |

### Step 8: Wire Up Frontend Routes
| File | What You Learn |
|------|---------------|
| **07-FRONTEND-ROUTES.md** | All ~40 pages with route paths, sidebar navigation per role, login redirect logic per role + onboarding status |

### Step 9: Verify Before Launch
| File | What You Learn |
|------|---------------|
| **11-AUDIT-REPORT.md** | 33 code-level issues + 11 launch blockers that were found and resolved. Use as a verification checklist after development. |

---

## Key Numbers

| Metric | Count |
|--------|-------|
| API endpoints | 95 |
| Frontend pages | ~40 |
| Mongoose models | 16 |
| Total files to create | ~160 |
| Sprint tasks | 86 |
| DC listing fields | 119+ (9 wizard steps) |
| GPU cluster fields | 49+ (8 wizard steps) |
| GPU demand fields | 18 |
| DC capacity request fields | 15 |
| User roles | 8 (superadmin, admin, supplier, broker, subordinate, customer, reader, viewer) |
| Email notification events | 20+ |

---

## Source of Truth for Fields

**Every form field in this application comes from one of these Excel files. No fields were invented. All dropdown options, mandatory/optional flags, and data types match the Excel exactly.**

| Form | Excel Source |
|------|-------------|
| DC Listing Wizard (Steps 1-9) | `dc supplier/001-Infinia DC Questionnaire new_shared with IT.xlsx` |
| GPU Cluster Wizard (Steps 1-8) | `gpu supplier/002 - GPU Cluster Inventory- Current_for IT.xlsx` |
| GPU Demand Request | `gpu supplier/GPU Client Pipeline - Current_shared with IT.xlsx` |
| DC Capacity Request | Designed based on PRD requirements (no Excel source) |
| Supplier KYC Registration | Rows 7-10 of DC Questionnaire Excel |
| Customer Registration | PRD Section 7.1 + field spec in `12-SECURITY-AND-OPERATIONS.md` Section 12 |

---

## What's Deferred (Not in This Build)

These PRD features are intentionally deferred to Phase 2/3 (post-launch):
- RFQ system (create, quote, accept/reject)
- CRM workspace auto-creation
- Contract tracking (LoI/MSA milestones)
- Executive dashboards (map, analytics, portfolio)
- Maps integration (React-Leaflet)
- Quote comparison, customer contracts page
- Advanced analytics (RFQ-to-contract conversion, revenue metrics)

---

## Quick Reference: Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| mongodb | 27017 | Database |
| minio | 9000 (API), 9001 (console) | S3-compatible file storage |
| server | 5000 | Express.js API |
| client | 80 | Nginx serving React app + proxying /api/ |
