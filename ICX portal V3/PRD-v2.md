# ICX Platform — Full PRD v2.0

**Version:** 2.0  
**Date:** 06 April 2026  
**Status:** Active  
**Supersedes:** PRD v1.0 (25 March 2026)  
**Inputs:** Process Flows v1.3, Infinia DC Questionnaire (Excel), GPU Cluster Inventory (Excel), GPU Client Pipeline (Excel), Previous codebase (Aastha/Infinia-Exchange)

---

## 1. Product Overview

**ICX (Infinia Compute Exchange)** is a private, authenticated B2B marketplace for data center infrastructure. It connects DC suppliers (operators, developers, landlords, brokers) with enterprise/government buyers. There is **no public directory** — all access is admin-controlled.

### Core Concept
- Suppliers/Brokers register, complete KYC, get approved by admin
- Once approved, they can submit **multiple DC site applications** (each application can contain multiple DC sites) **AND/OR multiple GPU Cluster listings**
- **Two listing types**: DC Sites (colocation/infrastructure) and GPU Clusters (compute capacity)
- Brokers can submit on behalf of DC companies AND manage multiple DC companies under their account
- Customers (transacting buyers) apply, get verified, then browse DC listings and/or submit **GPU demand requirements** via the GPU Client Pipeline
- Readers (browse-only buyers) are provisioned directly by admin — no self-registration
- Admin operates via a centralised incoming requests queue
- All authentication is **OTP-based** (email/SMS) — no passwords

### Two-Stage Flow
```
STAGE 1: REGISTRATION + KYC (Company verification)
  Register → Company Profile (DC Provider Details) → Admin KYC Review → Approved/Rejected
  
STAGE 2: LISTING APPLICATIONS (Only after KYC approved)
  Option A — DC Sites: Add DC Site(s) → Full questionnaire per site → Admin Review → Approved/Rejected
  Option B — GPU Clusters: Add GPU Cluster(s) → Full inventory questionnaire → Admin Review → Approved/Rejected
  Can submit multiple applications of either type, each with multiple sites/clusters
  Can invite subordinates to help with data entry/documents
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8 (SPA), React Router DOM 7 |
| Styling | Tailwind CSS 4, Lucide React (icons) |
| Database | MongoDB 7, Mongoose 8 |
| Auth | OTP-based (email via Resend), JWT sessions (8hr) — NO passwords |
| Email | Resend (from: support@iamsaif.ai) |
| File Storage | S3-compatible (MinIO for dev, AWS S3 for prod) via @aws-sdk/client-s3 |
| Charts | Recharts |
| Maps | React-Leaflet / Leaflet (Phase 3) |
| Deployment | Docker Compose (MongoDB + Express + Vite/Nginx) |

> **Note:** Tech stack updated from PRD v1 (Next.js/PostgreSQL/Prisma/TypeScript) to the confirmed implementation stack (React+Vite/MongoDB/Mongoose/JavaScript) per stakeholder decision on 07 April 2026. Rationale: faster development velocity, same runtime performance for this use case.

---

## 3. User Roles & Access Model

| Role | Registration | Access Level |
|------|-------------|-------------|
| **Supplier / DC Operator** | Self-registration via landing page | Full read/write on own listings, company profile, documents |
| **Broker** | Self-registration via landing page | Submit DC applications on behalf of DC companies, manage multiple DC companies under one account |
| **Supplier Subordinate** | Invited by Supplier/Broker Admin (after KYC approval only) | Upload/update documents, edit delegated sections of listings |
| **Customer (Buyer)** | Self-registration via landing page | Browse marketplace (full view), submit RFQs, negotiate, execute contracts |
| **Reader** | Admin-provisioned only (no sign-up page) | Browse-only, sees curated subset of listing data — no pricing, no contacts, no documents |
| **Admin** | Created by Superadmin | Centralised queue, KYC review, field-level revision, approval/rejection, reader provisioning |
| **Superadmin** | System-level | All admin + user management, role assignment, system settings, audit logs |
| **Viewer (Executive)** | Admin-provisioned | Read-only dashboards, analytics, portfolio view. Can be scoped to specific suppliers |

### Access Control: Editor vs Reader View

| Data Field | Editor (Supplier) | Customer (Buyer) | Reader (Browse-Only) |
|------------|-------------------|-------------------|---------------------|
| DC Site Name & Location | Visible | Visible | Visible |
| Country & Region | Visible | Visible | Visible |
| Total MW Capacity | Visible | Visible | Visible |
| Availability Timeline | Visible | Visible | Visible |
| Cooling & Power Overview | Visible | Visible | Visible |
| Tiering / Certifications | Visible | Visible | Visible |
| Floor Space & Rack Density | Visible | Visible | Visible |
| NRC / MRC / Electricity Rate | Visible | Visible | **Hidden** |
| Deposit, Escalation, Lease Terms | Visible | Visible | **Hidden** |
| Insurance Details | Visible | Visible | **Hidden** |
| Internal Contacts (Name, Mobile) | Visible | **Hidden** | **Hidden** |
| Agency / Broker Details | Visible | **Hidden** | **Hidden** |
| Developer / Operator Details | Visible | Visible | **Hidden** |
| Uploaded Documents | Visible | **Hidden** | **Hidden** |
| **GPU Cluster Fields** | | | |
| GPU Technology & Cluster Size | Visible | Visible | Visible |
| Location & Country | Visible | Visible | Visible |
| Availability Date | Visible | Visible | Visible |
| Compute Node Specs | Visible | Visible | Visible |
| Network Topology & Technology | Visible | Visible | Visible |
| Target Price / Commercial Terms | Visible | Visible | **Hidden** |
| Restricted Use / Export Constraints | Visible | **Hidden** | **Hidden** |
| Cluster Documentation | Visible | **Hidden** | **Hidden** |

---

## 4. Authentication

**All users authenticate via OTP — no passwords.**

### Flow
1. User enters email or mobile number on login page
2. System sends 6-digit OTP (valid 5 minutes) via email/SMS
3. User enters OTP → session established (JWT, 8-hour expiry)
4. Redirected to role-appropriate dashboard

### First-Time Access
- **Suppliers & Customers**: Self-register via landing page → OTP sent to verify email → complete onboarding form
- **Readers**: Admin creates account → system emails credentials/login link
- **Admins**: Superadmin creates account → OTP-based login

---

## 5. Landing Page

A public-facing page (the **only** unauthenticated page besides login) that:

- Explains what ICX is (private DC infrastructure marketplace)
- Shows infrastructure categories: Colocation, Bare Metal, Connectivity, Power, **GPU Compute**
- Displays platform stats (suppliers, total MW, countries, listings)
- Has two clear CTAs:
  - **"Register as DC Supplier"** → Supplier registration flow
  - **"Register as Buyer"** → Customer registration flow
- **No** public listing directory or search — marketplace is behind authentication
- Login link for existing users

---

## 6. Supplier / Broker Flow

### 6.1 STAGE 1: Registration & KYC (Company Verification)

This is the **only step before admin approval**. The supplier/broker registers and provides company-level details. They **cannot** access the DC application form until KYC is approved.

**Self-registration from landing page:**

1. Supplier/Broker clicks "Register as DC Supplier"
2. Enters email → OTP verification → account created
3. Completes **registration form** — only 4 fields from DC Provider Company Details (rows 7-10):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Vendor Type | Dropdown: Operator / Developer / Landlord / Broker / Advisor / Other Intermediary | Yes | Determines if this is a direct supplier or broker |
| Mandate Status | Dropdown: Exclusive / Non-exclusive / Direct / Unknown | Yes | |
| NDA Required | Yes/No | No | |
| NDA Signed | Yes/No | No | |
| Email Address | Email input | Yes | Used for OTP login + primary contact |
| Contact Number | Phone input | Yes | With country code |

**That's it for registration (6 fields).** The remaining company details (Legal Entity, Address, Country, Other Details) are collected later in Stage 2 as part of the DC application form.

**Broker-specific behaviour:**
- If Vendor Type = "Broker" or "Advisor" or "Other Intermediary":
  - The broker can later **add multiple DC companies** under their account
  - Each DC company has its own Legal Entity, Address, Country
  - The broker submits DC applications **on behalf of** those companies

**System auto-fields (not shown to user):**
- Date of Entry: auto-timestamped on registration
- Availability Date: auto-set when approved
- Availability DD Completed: internal admin tracking

**On submission:**
- Email sent to Supplier/Broker (confirmation) + Admin (new registration alert with review link)
- Status: `Pending` → enters admin review queue
- **User is blocked from DC application until approved**

### 6.1b KYC Waiting State

After submitting company details, the user sees a **KYC Waiting Page**:
- Status indicator: "Your registration is under review"
- Shows submitted company details (read-only)
- If admin requests revision: flagged fields highlighted with admin comments, user can edit and resubmit
- If approved: redirected to Supplier Dashboard with ability to create DC applications

### 6.2 Supplier Team / Subordinate Access (After KYC Approval Only)

Once KYC is approved, the Supplier/Broker Admin (primary contact) can:
- **Invite team members** by email → subordinate receives OTP login link
- **Assign permissions**: which sections/documents the subordinate can edit
- **Subordinates can**: upload/update documents, edit delegated listing sections
- **Subordinates cannot**: submit applications, change company profile, invite others

This enables the supplier to delegate document gathering to their IT/ops team while maintaining control.

### 6.3 STAGE 2: DC Application (After KYC Approved)

**Only accessible after KYC approval.** This is where the supplier/broker fills in the full DC questionnaire.

**Multi-site support:**
- One supplier/broker can submit **multiple DC applications**
- Each application can contain **multiple DC sites** (e.g., a broker submitting 3 sites for the same DC company, or an operator with campuses in different cities)
- Each DC site within an application has its own full set of questionnaire fields
- Applications are reviewed by admin independently

**Broker multi-company support:**
- A broker can manage **multiple DC companies** under their account
- When creating a DC application, the broker selects which DC company this is for (or adds a new one)
- Each DC company has its own Legal Entity, Address, Country details

The application form is a **multi-step wizard with save-as-draft** and auto-save:

#### Step 1: DC Provider Company Details (rows 11-17 from questionnaire)

These fields were NOT collected during registration — they are part of the DC application.

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| DC Company Legal Entity (Vendor) | Free text | Yes | If broker: the DC company they represent |
| DC Company Office Address | Free text | Yes | |
| DC Company Country of Incorporation | Free text | Yes | |
| Contact Name | Free text | Yes | |
| Contact Email | Free text | Yes | Limited to 500 characters |
| Contact Mobile No. | Free text | Yes | |
| Other Details | Free text (500 chars) | No | |

*Note: For brokers, this captures the DC company's details (not the broker's own details).*

#### Step 2: DC Site Details

| Field | Input Type | Required |
|-------|-----------|----------|
| Site/Project Name | Free text | Yes |
| Project Type | Dropdown: Brownfield (Retrofit/Conversion) / Greenfield / Expansion | Yes |
| Current Project Status | Dropdown: Planned / Permitted / Under Construction / Live / Partially Live | No |
| Business Model | Dropdown: Colocation (Wholesale/Retail) / Powered Shell / Build-to-Suit | Yes |
| Sovereignty / Access Restrictions | Dropdown: None / Domestic Only / Sovereign Cloud Capable / Restricted / Government-Sensitive | Yes |
| Regulatory / Legal Compliance | Dropdown: GDPR / Local Law / GDPR + Local Law | Yes |
| Air-Gapped / Disconnected Capability | Yes/No | No |
| Land Size (sqm) | Numeric (whole) | No |
| Building Count (fully live) | Numeric (whole) | No |
| Data Hall Count (fully live) | Numeric (whole) | No |
| Address | Free text | Yes |
| State/Region | Free text | Yes |
| Country | Free text | Yes |
| Coordinates (Google Maps link preferable) | Free text / hyperlink | Yes |

#### Step 2b: Master Plan Capacity (End State)

| Field | Input Type | Required |
|-------|-----------|----------|
| Current Energized Capacity (MW) | Numeric (whole) | No |
| Total IT Load Final Target (MW) | Numeric (whole) | Yes |
| Total Utility Power Reserved (MVA) | Numeric (whole) | No |
| Total White Space Area (sqm) | Numeric (whole) | No |
| Expansion Possibility | Yes/No | No |
| Expansion Possibility (MW) | Numeric (whole) | No |

#### Step 3: DC Specifications

| Field | Input Type | Required |
|-------|-----------|----------|
| Max Rack Density (kW/Rack) | Numeric (whole) | Yes |
| Typical Rack Density (kW/Rack) | Numeric (whole) | No |
| Cooling Methodology | Checkboxes: Air Cooled / Liquid Cooling Ready (Rear Door/DLC) / Hybrid | Yes |
| Liquid Cooling Delivered | Dropdown: Installed / Ready for Retrofit / Design-ready only / No | No |
| Design PUE (full load, contractual) | Numeric (fractional) | Yes |
| Design WUE (L/kWh) | Numeric (whole) | Yes |
| Floor Plan Available | File upload (PDF) — "where will docs get saved? CRM would be helpful" | No |
| Floor Max Weight (tons/sqm or sqft) | Numeric (whole) | No |
| Land Owner | Free text | Yes |
| Land Ownership Type | Dropdown: Freehold / Leasehold → **if Leasehold, show "Lease Years" input** | No |
| Physical Security Details | Free text (500 chars) | No |
| DC Tiering | Dropdown: Tier I / II / III / IV / Not Certified | No |
| DC Tiering Certified | Yes/No | No |
| ISO 27001 | Yes/No | No |
| ISO 50001 | Yes/No | No |
| SOC 2 | Yes/No | No |
| Other Certifications | Free text | No |
| Power Permit Status | Dropdown: Not Required / Not Applied / In Preparation / Submitted Under Review / Approved / Approved with Conditions / Rejected / Expired / Unknown | No |
| Building Permit Status | Same 9-option dropdown | No |
| Environmental Permit Status | Same 9-option dropdown | No |
| Describe Current Status in Detail | Free text | No |
| Other Details (Ceiling Height, slab constraints) | Free text | No |
| Fire Suppression Type | Dropdown: Inert Gas / Water Mist / Pre-Action Sprinkler / Hybrid / Unknown | No |
| Water/Flood Risk | Dropdown: Low / Medium / High / Unknown | No |
| Seismic Risk | Dropdown: Low / Medium / High / Unknown | No |
| DC Site Developer (General Contractor) | Free text | No |
| DC Site Operator (if different) | Free text | No |

#### Step 4: Power Infrastructure

| Field | Input Type | Required |
|-------|-----------|----------|
| Power Source | Dropdown: Grid / Power Behind Meter / Hybrid | Yes |
| Grid Connection Voltage (kV) | Numeric (whole) | Yes |
| Power Redundancy Topology | Dropdown: N / N+1 / 2N / 2N+1 / 2(N+1) / Shared Redundant | Yes |
| Backup Power | Dropdown: Batteries (BESS) / Diesel Generators / Dual Source / etc. | Yes |
| On-site Substation Status | Dropdown: Existing / Under Construction / Planned / Off-site Only | No |
| Transformer Redundancy | Dropdown: N / N+1 / 2N / Unknown | No |
| Maintenance Concurrency | Dropdown: Yes / No / Partial | No |
| UPS Autonomy (minutes) | Numeric (whole) | No |
| UPS Topology | Dropdown: Centralized / Distributed / Block Redundant / Modular | No |
| Renewable Energy (% of Total) | Numeric (whole) | No |
| Type of Renewable Energy | Checkboxes: Hydro / Wind / Solar | No |
| Number of Feeds | Numeric (whole) | No |
| A/B Feeds Physically Separated | Dropdown: Yes / No / Unknown | No |
| Future Reserved Power Secured | Dropdown: Yes / No / Partially | No |
| Curtailment Risk | Dropdown: None Known / Low / Medium / High | No |
| Other Details | Free text | No |

#### Step 5: Connectivity

| Field | Input Type | Required |
|-------|-----------|----------|
| Carrier Neutrality | Yes/No | No |
| Number of Carriers On-Net | Numeric (whole) | No |
| Carriers Available on Site | Free text | No |
| Dark Fibre Availability | Yes/No | No |
| Fiber Entry Points (Connectivity) | Free text | No |
| Meet-Me-Room Description | Free text (2000 char limit) | No |
| MMR Redundancy | Dropdown: Single / Redundant / Unknown | No |
| Connectivity Detailed Mapping | Free text (2000 char limit) | No |
| Distance to Nearest Major IX/Network Hub (km) | Numeric (whole) | No |
| Cross-Connect Availability | Dropdown: Yes / No / Planned | No |
| Latency (ms, one way) | Numeric | No |
| Latency Destination | Free text — **mandatory if latency is filled** | Conditional |
| Other Details | Free text | No |

#### Step 6: Commercial Terms

| Field | Input Type | Required |
|-------|-----------|----------|
| Lease Term Options | Free text | No |
| Break/Extension Rights | Free text | No |
| Payment Frequency | Dropdown: Monthly / Yearly | No |
| Deposit/Security Requirement | Free text (watermark: "USD amount or X months of rent") | No |
| Remote Hands Pricing | Free text | No |
| Other Opex Charges | Free text | No |
| Fit-Out Contribution / TI Allowance | Free text | No |
| Make-Good / Restoration Obligations | Free text | No |
| Tax/VAT Treatment | Free text | No |
| Indexation Basis | Free text | No |

#### Step 7: Phasing & Expansion Schedule

A **monthly grid with custom timeline** — the supplier sets the start month and end month (not fixed to Mar 2026 → Dec 2030). Rows are auto-generated monthly between the chosen dates. Columns:

| Column | Input Type |
|--------|-----------|
| Month | Auto-populated (datetime) |
| IT Load (MW) | Numeric (whole) |
| Cumulative IT Load (MW) | **Auto-calculated** (running total) |
| Scope of Works | Dropdown: Shell & Core + Fitout / etc. |
| Estimated Capex (M$) | Numeric (whole) |
| Phase | Dropdown: Original Phase / Expansion 1 / Expansion 2 |
| Minimum Lease Duration (yrs) | Numeric (whole) |
| NRC Request (M$) | Numeric (fractional) |
| Initial Deposit (M$) | Numeric (fractional) |
| MRC Request ($/kW/month) | Numeric (whole) |
| Key Inclusions in MRC | Free text |

**Total (MW)** auto-calculated at top of grid.

#### Step 8: Site Financials

| Field | Input Type | Required |
|-------|-----------|----------|
| Storage Area Rent ($/sqm or sqft/month, USD) | Numeric (whole) | No |
| Tax Incentives Available | Yes/No | No |
| Annual Escalation (%) | Numeric | No |
| Additional Opex Charges (USD, incl. pass-through utilities) | Free text | No |
| Insurance by DC | Yes/No | No |
| Deposit Required | Yes/No | No |
| Power Price Structure | Dropdown: Fixed / Indexed / Pass-through / Blended | No |
| PPA | Free text | No |
| Avg Power Price (previous 12 months, USD cents/kWh) | Numeric (whole) | No |
| Cross-Connect Pricing | Free text | No |

*Note from questionnaire: "For AI/wholesale sites, financial comparability is impossible without power pricing and commercial structure."*

#### Step 9: Documents & Submit

**Supplier-facing uploads:**

| Document | Type |
|----------|------|
| DC Compliance Sheet | File upload |
| DC Space Docs | File upload |
| DC Agreements | File upload |
| Remarks (if any) | Free text |

**Admin-only internal tracking (per document):**

| Internal Field | Type | Notes |
|---------------|------|-------|
| Received | Yes / No / Pending | For sales person |
| Reviewed | Yes / No / In Progress | Auto "In Progress" once sales person assigned |
| File Path | Auto-generated | Internal use only |

**Additional internal-only items:**

| Item | Type | Notes |
|------|------|-------|
| LoI/MoU | Checkbox | "Ideally sync with legal system once LoI/MoU signed" |
| MSA | Checkbox | "Ideally sync with legal system once MSA signed" |

**On submission:**
- Application status → `Submitted`
- Email to: Supplier (confirmation + ref number) + Admin (review link) + Broker (if applicable)
- Supplier **cannot edit** while in Submitted status

### 6.4 Application Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Saved but not submitted — not visible in admin queue, fully editable |
| **Submitted** | Formal application — enters admin review queue, supplier cannot edit |
| **In Review** | Admin has opened the submission |
| **Revision Requested** | Admin flagged specific fields with comments — supplier can edit flagged fields only |
| **Resubmitted** | Supplier fixed flagged fields and resubmitted — re-enters queue with change diff |
| **Approved** | Listing goes live + CRM workspace created |
| **Rejected** | Does not meet standards — rationale provided, option to re-apply |

### 6.5 Report Download

From questionnaire notes: *"Create ability to download report with timestamps and who it is assigned to."*

The platform should generate downloadable reports (PDF/CSV) of:
- Supplier profile + all listing data
- Submission timestamps
- Assigned reviewer
- Review history + comments

### 6.6 STAGE 2 (Alt): GPU Cluster Listing (After KYC Approved)

**GPU Clusters are a separate listing type alongside DC Sites.** Once KYC-approved, a supplier can create DC site applications, GPU cluster listings, or both. GPU clusters represent compute capacity (GPU-as-a-Service) offered by the supplier, sourced from the GPU Cluster Inventory questionnaire.

**Multi-cluster support:**
- One supplier can submit **multiple GPU Cluster listings**
- Each listing represents a distinct cluster (unique location + technology combination)
- Applications are reviewed by admin independently (same review/revision flow as DC sites)

The application form is a **multi-step wizard with save-as-draft** and auto-save:

#### GPU Step 1: Basic Cluster Information

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| Vendor / Operator Name | Free text | Yes | Pre-filled from org profile if available |
| Location | Free text | Yes | City / facility name |
| Country | Free text | Yes | |
| GPU Technology | Free text | Yes | e.g., NV B300, NV GB300 NVL72, H200 |
| Google Maps Link | URL / hyperlink | Yes | Coordinates of the facility |
| DC Landlord | Free text | No | If hosted in a third-party DC |
| Total Number of GPUs | Numeric (whole) | No | Total GPUs across all clusters at this location |
| Single Cluster Size (# of GPUs) | Numeric (whole) | Yes | GPUs in the offered cluster |
| Availability Date (RFS) | Date picker | Yes | Ready-for-service date |
| Notes (e.g., contract length) | Free text (500 chars) | Yes | Minimum commitment, terms |
| Restricted Use | Free text | No | Export controls, usage restrictions |

**System auto-fields:** Date of Entry (auto-timestamped)

#### GPU Step 2: Compute Node Specifications

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| GPU Server Model | Free text | Yes | e.g., NVIDIA DGX B200, SuperMicro custom |
| CPU | Free text | No | e.g., AMD EPYC 9004, Intel Xeon |
| GPU | Free text | No | e.g., NVIDIA B300 80GB HBM3e |
| RAM | Free text | No | e.g., 2TB DDR5 per node |
| Local Storage | Free text | Yes | e.g., 8x 3.84TB NVMe SSD per node |
| NICs | Free text | No | e.g., 8x ConnectX-7 400GbE |

#### GPU Step 3: Compute Network (Back-End / East-West)

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| Topology | Free text | No | e.g., Rail Optimized, Fat Tree |
| Technology | Free text | Yes | e.g., Ethernet / InfiniBand NDR / InfiniBand XDR |
| Switch Vendor | Free text | No | e.g., NVIDIA Spectrum-X, Arista |
| Number of Network Layers | Free text | No | e.g., spine-leaf architecture, 3-tier |
| Oversubscription Ratio | Free text | No | e.g., 1:1 (non-blocking), 2:1 |
| Scalability Plan for Future Expansion | Free text | No | |
| QoS Configuration | Free text | No | |

#### GPU Step 4: Management Network (Front-End / North-South)

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| Topology | Free text | No | e.g., Fat Tree |
| Technology | Free text | No | e.g., Ethernet 400G |
| Number of Network Layers | Numeric (whole) | No | |
| Switch Vendor | Free text | No | |
| Oversubscription Ratio | Free text | No | |
| Scalability Plan for Future Expansion | Free text | No | |

#### GPU Step 5: OOB Network, Storage & Connectivity

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| Out-of-Band (OOB) Network Technology | Free text | No | e.g., Ethernet 1G |
| Storage Options | Free text (2000 chars) | No | Vendor name, speed, max capacity |
| Connectivity Details | Free text (2000 chars) | No | Bandwidth, redundancy, links, peering |

#### GPU Step 6: Cluster Description & Documentation

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| Cluster Description | Free text (2000 chars) | No | Overview of the cluster and its capabilities |
| Security & Compliance Documentation | File upload | No | Certifications, audit reports |
| Other Documentation | File upload | No | Architecture diagrams, spec sheets |

#### GPU Step 7: Extended Information — Power & Facility (Optional)

These fields capture facility-level details for GPU clusters that are self-hosted or where the supplier manages the facility infrastructure.

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| Power Supply Status | Free text | No | Status of DC power infrastructure |
| Rack Power Capacity (kW/rack) | Numeric (whole) | No | |
| Number of Modular Data Halls | Numeric (whole) | No | |
| Total Power Capacity — IT Load (MW) | Numeric (whole) | No | |
| Power Capacity Per Floor | Numeric (whole) | No | |
| Modular Data Hall Layout Per Floor | Free text | No | |
| Future Expansion Capability | Free text | No | Additional power and space |
| Dual-Feed Redundant Power Supply | Free text | No | |
| UPS Configuration | Free text | No | |
| Backup Generators (number & capacity) | Free text | No | |
| Cooling System Design | Free text | No | e.g., chilled water, direct expansion, rear-door liquid cooling |
| Number of Cooling Units | Free text | No | |
| Cooling Capacity (kW or tons) | Free text | No | |
| Floor Plans (rack & module arrangements) | Free text / File upload | No | |

#### GPU Step 8: Submit

Same submission flow as DC listings:
- Application status → `Submitted`
- Email to: Supplier (confirmation + ref number) + Admin (review link)
- Supplier **cannot edit** while in Submitted status
- Admin reviews via same queue, same field-level revision flow, same statuses (Draft → Submitted → In Review → Revision Requested → Resubmitted → Approved → Rejected)

---

### 6.7 GPU Client Pipeline (Customer Demand Matching)

**Purpose:** Customers (buyers) can submit GPU compute requirements through a structured demand form. This enables admin to match GPU demand with available GPU cluster supply.

When a verified customer needs GPU compute capacity, they submit a **GPU Demand Request** with the following fields:

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| Customer Name | Free text | Yes | Pre-filled from customer org profile |
| Date of Entry | Date (auto) | Yes | Auto-timestamped |
| Customer Country | Free text | Yes | |
| Type of Technology | Free text | Yes | e.g., B300, H200, GB300 |
| Contract Length (Years) | Free text | Yes | e.g., "3 years", "1 year (H200)" |
| Cluster Size (GPU #) | Free text | Yes | e.g., "10000", "2048*8 = 16,384" |
| Ideal Cluster Location | Free text | No | e.g., "Europe or SE Asia", "Non-regulated / Non-sanctioned" |
| Export Constraints | Free text | No | Any export control considerations |
| Timeline for Go Live | Free text | Yes | e.g., "ASAP", "Q3 2026" |
| Connectivity (Mbps) | Numeric (whole) | No | |
| Latency (ms) | Numeric (whole) | No | |
| Interconnectivity | Free text | No | |
| DC Tier (minimum) | Dropdown: Tier 1 / Tier 2 / Tier 3 / Tier 4 | No | |
| Redundancy / Uptime Requirements | Free text | No | |
| Target Price (GPU/h, USD) | Free text | No | Can be a range |
| Decision Maker | Free text | No | |
| Procurement Stage | Free text | No | e.g., "RFP issued", "Shortlisting", "Budget approved" |
| Other Comments | Free text (500 chars) | No | |

**On submission:**
- GPU demand enters admin queue as "GPU Demand Request"
- Admin can match demand against approved GPU cluster listings
- Admin can forward matching cluster details to the customer
- Admin can create RFQ on behalf of the customer to matching GPU suppliers

---

## 7. Customer Flow

### 7.1 Customer Registration (Transacting Buyer)

**Self-registration from landing page:**

1. Customer clicks "Register as Buyer"
2. Enters email → OTP verification → account created
3. Completes application form:

| Field | Type | Required |
|-------|------|----------|
| Company Name | Free text | Yes |
| Company Type | Dropdown | Yes |
| Jurisdiction | Dropdown (UAE, KSA, Qatar, Bahrain, Oman, Kuwait, Other) | Yes |
| Industry/Sector | Free text | Yes |
| Tax/VAT Registration Number | Free text | Yes |
| Company Address | Free text | Yes |
| Website | URL | No |
| Authorised Signatory Name | Free text | Yes |
| Authorised Signatory Title | Free text | Yes |
| Billing Contact Name | Free text | Yes |
| Billing Contact Email | Free text | Yes |
| Primary Use Cases | Checkboxes | Yes |
| Location Preferences | Checkboxes | No |
| Sovereignty Requirements | Checkboxes | No |
| Compliance Requirements | Checkboxes | No |
| Budget Range | Dropdown | No |
| Urgency | Dropdown | No |

**On submission:** Email to Customer (confirmation) + Admin (new application alert)

### 7.2 Customer Marketplace Access (Post-Approval)

Approved customers can:
- Browse all approved DC listings (**full commercial view** — including pricing, terms)
- Submit RFQs targeting specific suppliers or open to all matched
- Evaluate received quotes (side-by-side comparison)
- Execute LoI/MSA agreements
- Track contracts and consumption

### 7.3 Reader Access (Browse-Only Buyer)

- **No self-registration** — admin creates reader accounts directly
- Reader receives welcome email with login credentials/link
- Can browse marketplace with **subset view** (no pricing, no contacts, no docs)
- Cannot submit RFQs or transact
- Admin can customise field visibility per reader
- Admin can activate/deactivate/revoke reader accounts

---

## 8. Admin Flow

### 8.1 Centralised Incoming Requests Queue

The admin dashboard aggregates **all platform activity** into a single, filterable queue:

| Request Type | Examples |
|-------------|---------|
| Supplier Registration | New supplier KYC pending |
| DC Listing Submission | New DC application submitted |
| **GPU Cluster Submission** | **New GPU cluster listing submitted** |
| Supplier Resubmission | Corrected fields after revision request (DC or GPU) |
| Customer Application | New buyer verification pending |
| **GPU Demand Request** | **Customer GPU compute requirements submitted** |
| Customer Resubmission | Corrected fields after revision request |
| RFQ Submitted | Customer → Supplier RFQ |
| LoI Executed | Contract milestone tracking |

**Queue Features:**
- Filter by: type, status (New / In Review / Resubmitted / Approved / Rejected), date, assigned reviewer
- Sort by: date, priority, type
- Reviewer assignment (auto or manual)
- Action buttons per item: Review, Approve, Request Revision, Reject
- Email triggers on every inbound + outbound event

### 8.2 Supplier Onboarding Review

1. Supplier registration arrives in queue → Admin receives email
2. KYC verification: legal entity, contact validation, agency authorisation, duplicate check, sanctions screening
3. DC listing submission arrives separately → Admin validates:
   - Site details vs coordinates/construction status
   - Technical specs vs uploaded floor plans & cert documents
   - Certifications (Tier/ISO/PCI) verified and current
   - Commercials within market norms, terms complete
   - Capacity claims realistic for current build phase
   - All required documents present and legible
4. **Decision**: Approve / Request Revision (flag specific fields with inline comments) / Reject
5. **Revision loop**: supplier edits flagged fields → resubmits → re-enters queue as "Resubmitted" with change diff → admin re-reviews → repeat until approved or rejected
6. **On approval**: listing goes live, CRM workspace auto-created

### 8.3 Customer Onboarding Review

1. Customer application arrives in queue → Admin receives email
2. Verification: legal entity, tax/VAT ID, contact domain match, industry legitimacy, authorised signatory, duplicate check
3. Decision: Approve (full marketplace access) / Request Revision (flag fields) / Reject
4. Revision loop: same pattern as supplier

### 8.4 Reader Account Management

| Action | Description |
|--------|-------------|
| Create Account | Enter buyer company, contact name, email → role auto-assigned as Reader |
| Credential Delivery | System emails login link/credentials with instructions |
| Activate/Deactivate | Toggle access without deleting account |
| Adjust Field Visibility | Customise which fields a specific reader can see (override default subset) |
| View Login Activity | Last login, total sessions, listings viewed |
| Resend Credentials | Re-send welcome email |
| Revoke Access | Permanently remove reader account |

### 8.5 Field-Level Revision Flow (Admin Side)

1. Open submission from queue
2. Review each section — click any field to flag it
3. Add comment per flagged field (e.g., "PUE value needs supporting documentation")
4. Set decision: "Request Revision"
5. System emails supplier/customer with flagged fields & comments
6. When resubmitted, item re-appears in queue as "Resubmitted" **with change diff** highlighting what changed
7. Cycle repeats until approved or rejected

### 8.6 Platform Operations

- **Capacity & Inventory Management**: real-time capacity view across all listed DCs, updated as bookings confirmed and new phases come online
- **RFQ & Contract Pipeline**: all RFQs, negotiations, contract milestones tracked in queue
- **Document & Compliance Management**: certification expiry tracking (90/60/30 day automated email reminders to suppliers)
- **Reporting & Analytics**: listing performance, RFQ-to-contract conversion, capacity utilisation, regional demand, revenue metrics

### 8.7 CRM Workspace (Auto-Created Per Approved Supplier)

On listing approval, a CRM workspace is automatically created containing:
- Supplier profile (company details, contacts, agency/broker)
- DC listing data (site, technical, commercials, capacity timeline)
- All uploaded documents
- Full communication log (admin interactions, revision notes, decision history)
- Transaction pipeline (incoming RFQs, proposals, LoI/MSA tracking)

---

## 9. Email Notifications

Every state transition triggers email notifications:

| Event | To | Content |
|-------|----|---------|
| Supplier registers | Supplier + Admin | Registration confirmation, review link |
| DC listing submitted | Supplier + Admin + Broker (if applicable) | Confirmation with ref number + summary, review link |
| Listing approved | Supplier + Broker | Listing URL, portal credentials, CRM workspace provisioned |
| Revision requested | Supplier + Broker | Exact flagged fields with admin comments, edit link |
| Listing resubmitted | Admin | Resubmission alert with change summary |
| Listing rejected | Supplier + Broker | Rationale provided, option to re-apply |
| Customer applies | Customer + Admin | Application confirmation, review link |
| Customer approved | Customer + Billing Contact | Full marketplace access granted |
| Customer revision | Customer | Flagged fields with comments |
| Reader created | Reader + Admin | Login credentials, access instructions, accessible data overview |
| Reader deactivated | Reader + Admin | Access suspended notification |
| Reader reactivated | Reader + Admin | Access restored notification |
| Reader revoked | Reader + Admin | Account permanently removed |
| GPU cluster submitted | Supplier + Admin | Confirmation with ref number, review link |
| GPU cluster approved | Supplier | Listing live, marketplace entry |
| GPU cluster revision requested | Supplier | Flagged fields with admin comments |
| GPU cluster rejected | Supplier | Rationale provided |
| GPU demand submitted | Customer + Admin | Demand details, matching initiated |
| GPU demand matched | Customer + Admin | Matched cluster(s) details, next steps |
| RFQ submitted | Supplier + Admin | RFQ details, response deadline |
| Cert expiring | Supplier + Admin | 90/60/30 day expiry reminders |
| CRM workspace created | CRM System + Supplier + Admin | Workspace provisioning confirmation |

---

## 10. Data Model (New/Modified Prisma Models)

### Organization — Represents supplier/broker account (Registration Stage 1)
```
id                  String @id
email               String       // login email (OTP)
type                OrgType      // SUPPLIER, CUSTOMER, BROKER
status              RegStatus    // PENDING, APPROVED, REJECTED

// Registration fields ONLY (from questionnaire rows 7-10 + contact)
vendorType          String?      // Operator/Developer/Landlord/Broker/Advisor/Other Intermediary
mandateStatus       String?      // Exclusive/Non-exclusive/Direct/Unknown
ndaRequired         Boolean?
ndaSigned           Boolean?
contactEmail        String       // email for OTP login + primary contact
contactMobile       String?      // phone with country code

// System auto-fields
dateOfEntry         DateTime     // auto-timestamped on registration
approvedAt          DateTime?    // auto-set when approved

// Relations
users               User[]
dcApplications      DCApplication[]
brokerDCCompanies   BrokerDCCompany[]   // only for brokers
```
Note: Company details (Legal Entity, Address, Country, Contact info) are NOT on Organization — 
they are captured per DC application in Step 1 of the application form.

### BrokerDCCompany — New model (for brokers managing multiple DC companies)
```
id                  String @id
brokerId            String       // the broker Organization id
legalEntity         String       // DC Company Legal Entity
officeAddress       String
countryOfIncorp     String
contactName         String?
contactEmail        String?
contactMobile       String?
createdAt           DateTime
```

### DCApplication — New model (groups multiple DC sites)
```
id                  String @id
organizationId      String       // supplier or broker org
brokerDCCompanyId   String?      // if submitted by broker, which DC company
status              AppStatus    // DRAFT, SUBMITTED, IN_REVIEW, REVISION_REQUESTED, RESUBMITTED, APPROVED, REJECTED
assignedTo          String?      // admin reviewer
submittedAt         DateTime?
reviewedAt          DateTime?
createdAt           DateTime
updatedAt           DateTime

// Contains one or more DCSite records
```

### DCSite — New model (one per DC site within an application)
```
id                  String @id
dcApplicationId     String       // parent application

// Site Details (~30 fields from questionnaire Step 3)
siteName, projectType, currentStatus, businessModel,
sovereigntyRestrictions, regulatoryCompliance, airGapped,
landSizeSqm, buildingCount, dataHallCount, address,
stateRegion, country, coordinates

// Capacity (~6 fields from questionnaire)
currentEnergizedMw, totalItLoadMw, totalUtilityMva,
totalWhiteSpaceSqm, expansionPossible, expansionMw

// DC Specifications (~30 fields from questionnaire Step 4)
maxRackDensityKw, typicalRackDensityKw, coolingMethodology[],
liquidCoolingStatus, designPue, designWue, floorMaxWeight,
landOwner, landOwnershipType, leaseYears, physicalSecurity,
dcTiering, dcTieringCertified, iso27001, iso50001, soc2,
otherCerts, permits (power/building/env), fireSuppressionType,
waterFloodRisk, seismicRisk, siteDevGC, siteOperator

// Power Infrastructure (~16 fields from questionnaire Step 5)
powerSource, gridVoltageKv, powerRedundancy, backupPower,
substationStatus, transformerRedundancy, maintenanceConcurrency,
upsAutonomyMin, upsTopology, renewableEnergyPct,
renewableTypes[], numberOfFeeds, abFeedsSeparated,
futureReservedPower, curtailmentRisk

// Connectivity (~13 fields from questionnaire Step 6)
carrierNeutral, carriersOnNet, carriersAvailable,
darkFibreAvailable, fiberEntryPoints, mmrDescription,
mmrRedundancy, connectivityMapping, distanceToIxKm,
crossConnectAvail, latencyMs, latencyDestination

// Commercial Terms (~10 fields from questionnaire Step 7)
leaseTermOptions, breakExtensionRights, paymentFrequency,
depositRequirement, remoteHandsPricing, otherOpex,
fitOutContribution, makeGoodObligations, taxVatTreatment,
indexationBasis

// Site Financials (~10 fields from questionnaire Step 9)
storageRentUsd, taxIncentives, annualEscalationPct,
additionalOpex, insuranceByDc, depositRequired,
powerPriceStructure, ppa, avgPowerPriceCents,
crossConnectPricing

// Review tracking
flaggedFields       String[]
fieldComments       Json          // { "fieldPath": "admin comment" }
history             Json[]        // snapshots per submission
assignedTo          String?
reviewedAt          DateTime?
submittedAt         DateTime?
```

### DCPhasingSchedule — New model (custom timeline per site)
```
id                  String @id
dcSiteId            String       // parent DC site
month               DateTime     // user-defined start/end range (not fixed)
itLoadMw            Int?
cumulativeItLoadMw  Int?         // auto-calculated running total
scopeOfWorks        String?
estimatedCapexMusd  Int?
phase               String?      // Original Phase / Expansion 1 / Expansion 2
minLeaseDurationYrs Int?
nrcRequestMusd      Float?
initialDepositMusd  Float?
mrcRequestPerKw     Int?
mrcInclusions       String?
```
The supplier picks a **start month** and **end month** → system generates monthly rows.
Can extend beyond Dec 2030 or start before Mar 2026.

### DCDocument — New model
```
id                  String @id
dcSiteId            String       // parent DC site
documentType        String       // COMPLIANCE_SHEET, SPACE_DOCS, AGREEMENTS, FLOOR_PLAN, CERT_COPY
fileName            String
fileUrl             String
uploadedAt          DateTime
uploadedBy          String       // userId (could be supplier admin or subordinate)
// Admin-only tracking:
received            String?      // Yes / No / Pending
reviewed            String?      // Yes / No / In Progress (auto "In Progress" once assigned)
reviewComment       String?
```

### TeamInvite — New model (subordinate access)
```
id, organizationId, invitedByUserId, email
role (SUPPLIER_MEMBER), permissions[] (documents/site_details/technical/...)
status (PENDING/ACCEPTED/REVOKED), invitedAt, acceptedAt
```

### GPUClusterListing — New model (GPU cluster inventory listing)
```
id                    String @id
organizationId        String       // supplier org
status                AppStatus    // same statuses as DC applications
assignedTo            String?      // admin reviewer
submittedAt           DateTime?
reviewedAt            DateTime?
createdAt             DateTime
updatedAt             DateTime

// Basic Cluster Information (GPU Step 1)
vendorName            String       // operator name
location              String       // city / facility
country               String
gpuTechnology         String       // e.g., NV B300, NV GB300 NVL72
googleMapsLink        String?      // coordinates URL
dcLandlord            String?      // if hosted in third-party DC
totalGpuCount         Int?         // total GPUs at location
singleClusterSize     Int          // GPUs in offered cluster
availabilityDate      DateTime     // ready-for-service date
notes                 String?      // contract length, terms (500 chars)
restrictedUse         String?      // export controls, usage restrictions

// Compute Node Specifications (GPU Step 2)
gpuServerModel        String       // e.g., NVIDIA DGX B200
cpu                   String?      // e.g., AMD EPYC 9004
gpu                   String?      // e.g., NVIDIA B300 80GB HBM3e
ram                   String?      // e.g., 2TB DDR5 per node
localStorage          String       // e.g., 8x 3.84TB NVMe SSD per node
nics                  String?      // e.g., 8x ConnectX-7 400GbE

// Compute Network — Back-End / East-West (GPU Step 3)
computeNetTopology    String?      // e.g., Rail Optimized
computeNetTechnology  String       // e.g., Ethernet / InfiniBand NDR
computeNetSwitchVendor String?
computeNetLayers      String?      // number of network layers
computeNetOversubscription String?
computeNetScalability String?
computeNetQos         String?

// Management Network — Front-End / North-South (GPU Step 4)
mgmtNetTopology       String?      // e.g., Fat Tree
mgmtNetTechnology     String?      // e.g., Ethernet 400G
mgmtNetLayers         Int?
mgmtNetSwitchVendor   String?
mgmtNetOversubscription String?
mgmtNetScalability    String?

// OOB, Storage & Connectivity (GPU Step 5)
oobNetTechnology      String?      // e.g., Ethernet 1G
storageOptions        String?      // vendor, speed, capacity (2000 chars)
connectivityDetails   String?      // bandwidth, redundancy, links (2000 chars)

// Cluster Description (GPU Step 6)
clusterDescription    String?      // overview (2000 chars)

// Extended — Power & Facility (GPU Step 7)
powerSupplyStatus     String?
rackPowerCapacityKw   Int?
modularDataHalls      Int?
totalPowerCapacityMw  Int?
powerCapacityPerFloor Int?
dataHallLayoutPerFloor String?
futureExpansion       String?
dualFeedPower         String?
upsConfiguration      String?
backupGenerators      String?
coolingDesign         String?
coolingUnits          String?
coolingCapacity       String?
floorPlans            String?

// Review tracking (same as DCSite)
flaggedFields         String[]
fieldComments         Json          // { "fieldPath": "admin comment" }
history               Json[]        // snapshots per submission
```

### GPUClusterDocument — New model (documents for GPU cluster listings)
```
id                    String @id
gpuClusterListingId   String       // parent GPU cluster listing
documentType          String       // SECURITY_COMPLIANCE, ARCHITECTURE_DIAGRAM, SPEC_SHEET, OTHER
fileName              String
fileUrl               String
uploadedAt            DateTime
uploadedBy            String       // userId
received              String?      // Yes / No / Pending (admin tracking)
reviewed              String?      // Yes / No / In Progress
reviewComment         String?
```

### GPUDemandRequest — New model (customer GPU demand pipeline)
```
id                    String @id
organizationId        String       // customer org
status                AppStatus    // DRAFT, SUBMITTED, IN_REVIEW, MATCHED, CLOSED

// Demand fields (from GPU Client Pipeline)
customerName          String       // pre-filled from org
dateOfEntry           DateTime     // auto-timestamped
customerCountry       String
technologyType        String       // e.g., B300, H200, GB300
contractLengthYears   String       // e.g., "3 years", "1 year (H200)"
clusterSizeGpus       String       // e.g., "10000", "2048*8 = 16,384"
idealClusterLocation  String?      // e.g., "Europe or SE Asia"
exportConstraints     String?
timelineGoLive        String       // e.g., "ASAP", "Q3 2026"
connectivityMbps      Int?
latencyMs             Int?
interconnectivity     String?
dcTierMinimum         String?      // Tier 1 / Tier 2 / Tier 3 / Tier 4
redundancyRequirements String?
targetPriceGpuHr      String?     // USD, can be a range
decisionMaker         String?
procurementStage      String?
otherComments         String?      // 500 chars

// Admin matching
matchedClusterIds     String[]     // GPU cluster listings matched by admin
createdAt             DateTime
updatedAt             DateTime
```

### Enums
```
OrgType:        SUPPLIER, BROKER, CUSTOMER
ListingType:    DC_SITE, GPU_CLUSTER
KYCStatus:      NOT_STARTED, KYC_PENDING, KYC_SUBMITTED, APPROVED, REJECTED, REVISION_REQUESTED
AppStatus:      DRAFT, SUBMITTED, IN_REVIEW, REVISION_REQUESTED, RESUBMITTED, APPROVED, REJECTED, MATCHED, CLOSED
TeamInviteStatus: PENDING, ACCEPTED, REVOKED
```

---

## 11. API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/otp/request` | Send OTP to email/mobile |
| POST | `/api/auth/otp/verify` | Verify OTP → return JWT |
| POST | `/api/auth/register/supplier` | Register supplier org + user |
| POST | `/api/auth/register/customer` | Register customer org + user |

### Supplier
| Method | Route | Description |
|--------|-------|-------------|
| GET/PUT | `/api/supplier/profile` | Get/update own org profile |
| POST | `/api/supplier/team/invite` | Invite subordinate |
| GET | `/api/supplier/team` | List team members |
| DELETE | `/api/supplier/team/:id` | Revoke subordinate |
| GET | `/api/supplier/listings` | Get own DC listings |
| POST | `/api/supplier/listings` | Create new DC listing draft |
| PUT | `/api/supplier/listings/:id` | Update listing (save draft / edit flagged fields) |
| POST | `/api/supplier/listings/:id/submit` | Submit for review |
| POST | `/api/supplier/listings/:id/resubmit` | Resubmit after revision |
| POST/DELETE | `/api/supplier/listings/:id/documents` | Upload/remove document |
| GET/PUT | `/api/supplier/listings/:id/phasing` | Get/update phasing schedule |

### Supplier — GPU Clusters
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/supplier/gpu-clusters` | Get own GPU cluster listings |
| POST | `/api/supplier/gpu-clusters` | Create new GPU cluster listing draft |
| GET | `/api/supplier/gpu-clusters/:id` | Get GPU cluster detail |
| PUT | `/api/supplier/gpu-clusters/:id` | Update GPU cluster (save draft / edit flagged fields) |
| POST | `/api/supplier/gpu-clusters/:id/submit` | Submit for review |
| POST | `/api/supplier/gpu-clusters/:id/resubmit` | Resubmit after revision |
| POST/DELETE | `/api/supplier/gpu-clusters/:id/documents` | Upload/remove GPU cluster document |

### Customer — GPU Demand
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/customer/gpu-demands` | Get own GPU demand requests |
| POST | `/api/customer/gpu-demands` | Create new GPU demand request |
| GET | `/api/customer/gpu-demands/:id` | Get GPU demand detail |
| PUT | `/api/customer/gpu-demands/:id` | Update GPU demand request |
| POST | `/api/customer/gpu-demands/:id/submit` | Submit GPU demand request |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/queue` | Incoming requests queue (filterable, sortable, paginated) |
| GET | `/api/admin/queue/:id` | Queue item details |
| PUT | `/api/admin/queue/:id/assign` | Assign reviewer |
| PUT | `/api/admin/suppliers/:id/kyc` | Approve/reject supplier KYC |
| GET | `/api/admin/listings/:id` | DC listing full details |
| PUT | `/api/admin/listings/:id/review` | Approve/Revise/Reject with flagged fields + comments |
| GET | `/api/admin/customers/:id` | Customer application details |
| PUT | `/api/admin/customers/:id/verify` | Approve/Revise/Reject |
| POST/GET | `/api/admin/readers` | Create / list reader accounts |
| PUT/DELETE | `/api/admin/readers/:id` | Update / revoke reader |
| POST | `/api/admin/readers/:id/resend` | Resend credentials |
| GET | `/api/admin/gpu-clusters` | All GPU cluster listings (all statuses) |
| GET | `/api/admin/gpu-clusters/:id` | GPU cluster review (full detail) |
| PUT | `/api/admin/gpu-clusters/:id/review` | Approve/Revise/Reject GPU cluster with flagged fields + comments |
| GET | `/api/admin/gpu-demands` | All GPU demand requests |
| GET | `/api/admin/gpu-demands/:id` | GPU demand detail |
| PUT | `/api/admin/gpu-demands/:id/match` | Match GPU demand with cluster listings |

### Marketplace (Authenticated)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/marketplace/listings` | Browse approved listings (role-based field filtering) |
| GET | `/api/marketplace/listings/:id` | View listing detail (editor vs reader vs customer view) |
| GET | `/api/marketplace/gpu-clusters` | Browse approved GPU cluster listings (role-based field filtering) |
| GET | `/api/marketplace/gpu-clusters/:id` | View GPU cluster detail (role-based view) |

### RFQ
| Method | Route | Description |
|--------|-------|-------------|
| POST/GET | `/api/rfqs` | Create / list RFQs |
| GET | `/api/rfqs/:id` | RFQ detail |
| POST | `/api/rfqs/:id/quotes` | Submit quote (supplier) |
| PUT | `/api/rfqs/:id/quotes/:qid` | Accept/reject quote (customer) |

---

## 12. Pages Required

### Public
| Route | Page |
|-------|------|
| `/` | Landing page (platform intro, DC categories, stats, register CTAs) |
| `/login` | OTP login (email/mobile → OTP entry → role redirect) |
| `/register/supplier` | Supplier registration (OTP verify + company profile) |
| `/register/customer` | Customer registration (OTP verify + application form) |

### Supplier Dashboard
| Route | Page |
|-------|------|
| `/supplier/dashboard` | Overview (listings status, RFQ matches, activity) |
| `/supplier/listings` | My DC Listings (all applications with status) |
| `/supplier/listings/new` | New DC Listing wizard (Steps 3-10) |
| `/supplier/listings/:id` | View listing detail |
| `/supplier/listings/:id/edit` | Edit listing (revision mode: flagged fields highlighted, admin comments inline) |
| `/supplier/team` | Team management (invite subordinates, manage permissions) |
| `/supplier/gpu-clusters` | My GPU Cluster Listings (all with status) |
| `/supplier/gpu-clusters/new` | New GPU Cluster wizard (Steps 1-8) |
| `/supplier/gpu-clusters/:id` | View GPU cluster listing detail |
| `/supplier/gpu-clusters/:id/edit` | Edit GPU cluster (revision mode: flagged fields highlighted) |
| `/supplier/settings` | Organization profile, notification preferences |

### Customer Dashboard
| Route | Page |
|-------|------|
| `/customer/dashboard` | Overview (RFQs, quotes, contracts) |
| `/customer/marketplace` | Browse approved DC listings (full commercial view) |
| `/customer/marketplace/gpu` | Browse approved GPU cluster listings |
| `/customer/gpu-demands` | My GPU Demand Requests |
| `/customer/gpu-demands/new` | Submit new GPU demand request |
| `/customer/rfqs` | My RFQs |
| `/customer/rfqs/new` | Create new RFQ |
| `/customer/quotes` | Received quotes (compare, accept/reject) |
| `/customer/contracts` | Active contracts |
| `/customer/settings` | Organization profile, team, notifications |

### Reader
| Route | Page |
|-------|------|
| `/reader/marketplace` | Browse DC listings (subset view — no pricing/contacts/docs) |
| `/reader/marketplace/gpu` | Browse GPU cluster listings (subset view — no pricing/restricted info) |

### Admin Dashboard
| Route | Page |
|-------|------|
| `/admin/dashboard` | KPIs, activity feed, pending actions |
| `/admin/queue` | Centralised incoming requests queue |
| `/admin/queue/:id` | Review item detail (field-level flagging + comments + decision) |
| `/admin/suppliers` | Supplier management |
| `/admin/suppliers/:id` | Supplier detail + KYC review |
| `/admin/customers` | Customer management |
| `/admin/customers/:id` | Customer detail + verification |
| `/admin/readers` | Reader account management |
| `/admin/listings` | All DC listings (all statuses) |
| `/admin/listings/:id` | DC listing review (full detail + approve/revise/reject) |
| `/admin/gpu-clusters` | All GPU cluster listings (all statuses) |
| `/admin/gpu-clusters/:id` | GPU cluster review (full detail + approve/revise/reject) |
| `/admin/gpu-demands` | All GPU demand requests (pipeline view) |
| `/admin/gpu-demands/:id` | GPU demand detail + match with clusters |
| `/admin/crm` | CRM pipeline, contacts, interactions |
| `/admin/compliance` | Jurisdictions, frameworks, cert tracking |
| `/admin/audit-log` | Full audit trail |
| `/admin/settings` | Platform configuration |

### Executive
| Route | Page |
|-------|------|
| `/executive/global-view` | Map + real-time supply/demand |
| `/executive/analytics` | Market intelligence, pricing trends, demand forecast |
| `/executive/portfolio` | Contract portfolio overview |

---

## 13. Key Differences: Previous Codebase → New

| Aspect | Previous (Aastha/Infinia-Exchange) | New (ICX v2) |
|--------|-----------------------------------|-------------|
| Auth | Email/password (bcrypt) | **OTP-based, no passwords** |
| Database | MongoDB (Mongoose) | MongoDB 7 (Mongoose 8) |
| Frontend | React + Vite (SPA) | React 19 + Vite 8 (SPA) |
| KYC form | 3 generic steps (company, owner, docs) | **Detailed company profile from Infinia questionnaire** |
| Listing form | 6 generic steps | **DC: 9 steps, 100+ fields matching exact Infinia DC Questionnaire. GPU: 8 steps, 60+ fields matching GPU Cluster Inventory questionnaire** |
| GPU Clusters | Not supported | **Full GPU cluster listing type: compute node specs, network topology, storage, connectivity, power/facility. Separate wizard, separate admin review** |
| GPU Demand Pipeline | Not supported | **Customers submit GPU compute requirements (technology, cluster size, location, timeline, pricing). Admin matches demand to GPU cluster supply** |
| Phasing schedule | Not supported | **Monthly grid with custom timeline (user-defined start/end, not fixed range)** |
| Multi-site | Multiple listings per user | **Multiple DC applications, each with multiple sites. Brokers manage multiple DC companies** |
| Team access | Not supported | **Supplier Admin invites subordinates with scoped permissions** |
| Roles | superadmin/admin/supplier/viewer | **supplier/supplier_member/customer/reader/admin/superadmin/executive** |
| Reader access | Viewer with matrix-based supplier access | **Dedicated Reader role, admin-provisioned, customisable subset field visibility** |
| Customer onboarding | Not implemented | **Full registration + admin verification + revision loop** |
| File storage | Multer (local disk /uploads) | **S3-compatible cloud storage** |
| Field-level revision | Flag fields + Map comments | **Same + change diff on resubmission** |
| Auto-save | 2.5s debounce | **Same, with draft persistence via API** |
| CRM workspace | Not implemented | **Auto-created on listing approval** |
| Email system | Resend API (basic templates) | **Full template system: all state transitions notified** |
| Internal tracking | Not supported | **Admin-only fields: received/reviewed/file path per document, LoI/MSA sync** |

---

## 14. Implementation Priority

### Phase 1 — Core Supplier Flow (Critical Path)
1. Landing page with registration CTAs
2. OTP authentication system (email)
3. Supplier registration + company profile form
4. DC Listing wizard (all 10 steps matching Infinia questionnaire)
5. Save-as-draft + auto-save functionality
6. Document upload to S3
7. Admin incoming requests queue
8. Admin field-level review + revision loop
9. Email notifications (registration, submission, revision, decision)
10. Listing approval → live status + marketplace entry

### Phase 2 — GPU Clusters, Team & Customer
11. GPU Cluster listing wizard (all 8 steps matching GPU Cluster Inventory questionnaire)
12. GPU Cluster admin review + revision loop (same flow as DC)
13. GPU Cluster marketplace browse with role-based field filtering
14. GPU Client Pipeline — customer demand request form
15. Admin GPU demand-to-supply matching interface
16. Supplier subordinate invites + scoped permissions
17. Customer registration + admin verification + revision loop
18. Reader account provisioning by admin
19. Marketplace browse with role-based field filtering (editor vs customer vs reader views)
20. RFQ creation + supplier response workflow

### Phase 3 — CRM & Operations
21. CRM workspace auto-creation on approval (DC + GPU clusters)
22. Contract pipeline tracking (LoI/MSA milestones)
23. Document compliance management (expiry reminders at 90/60/30 days)
24. Report generation (PDF/CSV with timestamps and assignment info)
25. Executive dashboards (map, analytics, portfolio — including GPU capacity view)
26. Audit logging on every state transition
27. Platform settings & configuration

---

## 15. Non-Functional Requirements

- **No public access** to supplier data — everything behind authentication
- **OTP-only auth** — no password storage anywhere
- **Field-level revision** with inline admin comments on every reviewable form
- **Save-as-draft** with auto-save on every multi-step form
- **Role-based field visibility** — editor vs reader vs customer views strictly enforced
- **S3 file storage** — not local disk, with pre-signed URLs
- **Audit trail** on every state transition (who, what, when, IP)
- **Email on every state change** — all relevant parties notified
- **Change diff on resubmission** — admin sees exactly what changed
- **Conditional fields** — e.g., Leasehold → show Years input; Latency filled → Destination mandatory
- **Character limits** — 500 chars default free text, 2000 chars for detailed description fields
- **Numeric validation** — whole numbers vs fractional numbers as specified per field
- **Mobile-responsive** — all pages usable on tablet/mobile
- **Dropdowns for "/" separated lists** — all options from questionnaire become proper dropdowns
- **Checkboxes for multi-select** — cooling methodology, renewable energy types

### Launch-Required Non-Functional Requirements (Added April 2026)

- **Legal pages** — Terms of Service and Privacy Policy pages required before launch
- **Cookie consent** — GDPR-compliant cookie consent banner (system references GDPR in compliance fields)
- **404 & error pages** — Custom 404 (not found), 500 (server error), and network error pages
- **Mobile responsive** — Tailwind responsive breakpoints: base (1440px+), max-w-1439, max-w-1023, max-w-767. All wizard steps must stack vertically on mobile. DataTable horizontal scroll on small screens.
- **S3/MinIO file storage** — MinIO for local development, AWS S3 for production. Pre-signed upload URLs. Max 10MB, PDF/DOC/DOCX/JPG/PNG only.
- **Report download** — PDF/CSV export of supplier profile + listing data + review history with timestamps and assigned reviewer
- **Database backup** — Automated MongoDB backup (daily cron via mongodump), 30-day retention, documented restore procedure
- **GDPR compliance** — User account deactivation (self-service or admin-triggered), data export API (JSON download of own data), right to erasure request mechanism
- **Rate limiting** — 5 OTP requests per email per 15 minutes, 10 verify attempts per IP per 15 minutes, 100 general API requests per IP per minute (express-rate-limit)
- **Input validation** — Server-side Zod schemas on every route. Frontend field-level validation on blur + on submit. Email format, phone format, URL format, numeric range, maxlength enforcement.
- **Reader management** — Dedicated admin page for reader accounts: create, activate/deactivate, resend credentials, revoke. Reader-specific API routes under `/api/admin/readers`.
- **Admin audit log UI** — Frontend page for superadmin (and admin read-only) to browse full audit trail with filters
