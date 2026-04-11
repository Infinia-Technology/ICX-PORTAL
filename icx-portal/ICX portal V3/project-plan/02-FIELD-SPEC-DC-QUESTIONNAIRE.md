# DC Questionnaire — Complete Field Specification

**Source:** `001-Infinia DC Questionnaire new_shared with IT.xlsx`  
**Sheets:** Overall Description, Phasing and Expansion Schedule, Site Financials  
**Rule:** Only fields marked "Questionnaire" in column D are shown to the supplier. Fields marked "Internal" are admin-only.

---

## Registration KYC Fields (6 fields)

These are collected during initial supplier/broker registration. User cannot proceed until admin approves.

| # | Field Name | Input Type | Options | Required | Notes |
|---|-----------|-----------|---------|----------|-------|
| 1 | Vendor Type | Dropdown | Operator / Developer / Landlord / Broker / Advisor / Other Intermediary | **Mandatory** | If Broker/Advisor/Other Intermediary → broker behaviour enabled |
| 2 | Mandate Status | Dropdown | Exclusive / Non-exclusive / Direct / Unknown | **Mandatory** | |
| 3 | NDA Required? | Dropdown | Yes / No | Optional | |
| 4 | NDA Signed | Dropdown | Yes / No | Optional | |
| 5 | Email Address | Email input | — | **Mandatory** | Used for OTP login + primary contact |
| 6 | Contact Number | Phone input | — | **Mandatory** | With country code |

**System auto-fields (not shown to user):**
- Date of Entry: auto-timestamped on registration
- Availability Date: auto-set when approved
- Availability DD Completed: internal admin tracking

---

## DC Application Wizard

### Step 1: DC Provider Company Details (7 fields)

| # | Field Name | Input Type | Required | Notes |
|---|-----------|-----------|----------|-------|
| 1 | DC Company Legal Entity (Vendor) | Free text | **Mandatory** | If broker: the DC company they represent |
| 2 | DC Company Office Address | Free text | **Mandatory** | |
| 3 | DC Company Country of Incorporation | Free text | **Mandatory** | |
| 4 | Contact Name | Free text | **Mandatory** | |
| 5 | Contact Email | Free text | **Mandatory** | Limited to 500 characters |
| 6 | Contact Mobile No. | Free text | **Mandatory** | |
| 7 | Other Details | Free text | Optional | |

---

### Step 2: DC Site Details (14 fields)

| # | Field Name | Input Type | Options | Required |
|---|-----------|-----------|---------|----------|
| 1 | Site/Project Name | Free text | — | **Mandatory** |
| 2 | Project Type | Dropdown | Brownfield (Retrofit/Conversion) / Greenfield / Expansion | **Mandatory** |
| 3 | Current Project Status | Dropdown | Planned / Permitted / Under Construction / Live / Partially Live | Optional |
| 4 | Business Model | Dropdown | Colocation (Wholesale/Retail) / Powered Shell / Build-to-Suit | **Mandatory** |
| 5 | Sovereignty/Access Restrictions | Dropdown | None / Domestic Only / Sovereign Cloud Capable / Restricted / Government-Sensitive | **Mandatory** |
| 6 | Regulatory/Legal Compliance | Dropdown | GDPR / Local Law / GDPR + Local Law | **Mandatory** |
| 7 | Air-Gapped/Disconnected Capability | Dropdown | Yes / No | Optional |
| 8 | Land Size, sqm | Numeric (whole numbers only) | — | Optional |
| 9 | Building Count (fully live) | Numeric (whole numbers only) | — | Optional |
| 10 | Data Hall Count (fully live) | Numeric (whole numbers only) | — | Optional |
| 11 | Address | Free text | — | **Mandatory** |
| 12 | State/Region | Free text | — | **Mandatory** |
| 13 | Country | Free text | — | **Mandatory** |
| 14 | Coordinates (Google Maps Link preferable) | Free text / hyperlink | — | **Mandatory** |

---

### Step 2b: Master Plan Capacity — End State (6 fields)

| # | Field Name | Input Type | Required |
|---|-----------|-----------|----------|
| 1 | Current Energized Capacity, MW | Numeric (whole) | Optional |
| 2 | Total IT Load (Final Target), MW | Numeric (whole) | **Mandatory** |
| 3 | Total Utility Power Reserved, MVA | Numeric (whole) | Optional |
| 4 | Total White Space Area, sqm | Numeric (whole) | Optional |
| 5 | Expansion Possibility | Dropdown: Yes / No | Optional |
| 6 | Expansion Possibility, MW | Numeric (whole) | Optional |

---

### Step 3: DC Specifications (28 fields)

| # | Field Name | Input Type | Options | Required | Conditional Logic |
|---|-----------|-----------|---------|----------|-------------------|
| 1 | Rack Density, kW/Rack (max supported) | Numeric (whole) | — | **Mandatory** | |
| 2 | Design Rack Density, kW/Rack (typical) | Numeric (whole) | — | Optional | |
| 3 | Cooling Methodology | **Checkboxes** (multi-select) | Air Cooled / Liquid Cooling Ready (Rear Door/DLC) / Hybrid | **Mandatory** | |
| 4 | Liquid Cooling Delivered | Dropdown | Installed / Ready for Retrofit / Design-ready only / No | Optional | |
| 5 | Design PUE (at full load, contractual) | Numeric (**fractional** allowed) | — | **Mandatory** | |
| 6 | Design WUE, L/kWh | Numeric (whole) | — | **Mandatory** | |
| 7 | Floor Plan Available? | **File upload** (PDF) | — | Optional | Upload button |
| 8 | Floor Max Weight (tons/sqm or sqft) | Numeric (whole) | — | Optional | |
| 9 | Land Owner | Free text | — | **Mandatory** | |
| 10 | Land Ownership Type | Dropdown | Freehold / Leasehold | Optional | **If Leasehold → show "Lease Years" field** |
| 11 | Lease Years | Numeric (whole) | — | Conditional | Only visible if Land Ownership = Leasehold |
| 12 | Physical Security Details | Free text (500 chars) | — | Optional | |
| 13 | DC Tiering | Dropdown | Tier I / Tier II / Tier III / Tier IV / Not Certified | Optional | |
| 14 | DC Tiering Certified | Dropdown | Yes / No | Optional | |
| 15 | ISO 27001 | Dropdown | Yes / No | Optional | |
| 16 | ISO 50001 | Dropdown | Yes / No | Optional | |
| 17 | SOC 2 | Dropdown | Yes / No | Optional | |
| 18 | Other Certifications | Free text | — | Optional | |
| 19 | Power Permit Status | Dropdown | Not Required / Not Applied / In Preparation / Submitted Under Review / Approved / Approved with Conditions / Rejected / Expired / Unknown | Optional | |
| 20 | Building Permit Status | Dropdown | (same 9 options as Power Permit) | Optional | |
| 21 | Environmental Permit Status | Dropdown | (same 9 options as Power Permit) | Optional | |
| 22 | Describe Current Status in Detail | Free text | — | Optional | |
| 23 | Other Details (Ceiling Height, slab constraints) | Free text | — | Optional | |
| 24 | Fire Suppression Type | Dropdown | Inert Gas / Water Mist / Pre-Action Sprinkler / Hybrid / Unknown | Optional | |
| 25 | Water/Flood Risk | Dropdown | Low / Medium / High / Unknown | Optional | |
| 26 | Seismic Risk | Dropdown | Low / Medium / High / Unknown | Optional | |
| 27 | DC Site Developer (General Contractor) | Free text | — | Optional | |
| 28 | DC Site Operator (if different) | Free text | — | Optional | |

---

### Step 4: Power Infrastructure (16 fields)

| # | Field Name | Input Type | Options | Required |
|---|-----------|-----------|---------|----------|
| 1 | Power Source | Dropdown | Grid / Power Behind Meter / Hybrid | **Mandatory** |
| 2 | Grid Connection Voltage, kV | Numeric (whole) | — | **Mandatory** |
| 3 | Power Redundancy Topology | Dropdown | N / N+1 / 2N / 2N+1 / 2(N+1) / Shared Redundant | **Mandatory** |
| 4 | Backup Power | Dropdown + free text "Other" | Batteries (BESS) / Diesel Generators / Dual Source / Other | **Mandatory** |
| 5 | On-site Substation Status | Dropdown | Existing / Under Construction / Planned / Off-site Only | Optional |
| 6 | Transformer Redundancy | Dropdown | N / N+1 / 2N / Unknown | Optional |
| 7 | Maintenance Concurrency | Dropdown | Yes / No / Partial | Optional |
| 8 | UPS Autonomy, minutes | Numeric (whole) | — | Optional |
| 9 | UPS Topology | Dropdown | Centralized / Distributed / Block Redundant / Modular | Optional |
| 10 | Renewable Energy, % of Total | Numeric (whole) | — | Optional |
| 11 | Type of Renewable Energy | **Checkboxes** (multi-select) | Hydro / Wind / Solar | Optional |
| 12 | Number of Feeds | Numeric (whole) | — | Optional |
| 13 | A/B Feeds Physically Separated? | Dropdown | Yes / No / Unknown | Optional |
| 14 | Future Reserved Power Secured? | Dropdown | Yes / No / Partially | Optional |
| 15 | Curtailment Risk | Dropdown | None Known / Low / Medium / High | Optional |
| 16 | Other Details | Free text | — | Optional |

> **Note:** Excel had "Future reserved power secured?" twice (row 86 as free text, row 88 as Yes/No/Partially). Using row 88 dropdown version only.

---

### Step 5: Connectivity (13 fields)

| # | Field Name | Input Type | Options | Required | Conditional |
|---|-----------|-----------|---------|----------|-------------|
| 1 | Carrier Neutrality | Dropdown | Yes / No | Optional | |
| 2 | Number of Carriers On-net | Numeric (whole) | — | Optional | |
| 3 | Carriers Available on Site | Free text | — | Optional | |
| 4 | Dark Fibre Availability | Dropdown | Yes / No | Optional | |
| 5 | Fiber Entry Points (Connectivity) | Free text | — | Optional | |
| 6 | Meet-Me-Room Description | Free text | — | Optional | **2000 character limit** |
| 7 | MMR Redundancy | Dropdown | Single / Redundant / Unknown | Optional | |
| 8 | Connectivity Detailed Mapping | Free text | — | Optional | **2000 character limit** |
| 9 | Distance to Nearest IX/Network Hub, km | Numeric (whole) | — | Optional | |
| 10 | Cross-connect Availability | Dropdown | Yes / No / Planned | Optional | |
| 11 | Latency, ms (one way) | Numeric | — | Optional | |
| 12 | Latency Destination | Free text | — | **Conditional** | **MANDATORY if Latency (field 11) is filled** |
| 13 | Other Details | Free text | — | Optional | |

---

### Step 6: Commercial Terms (10 fields)

| # | Field Name | Input Type | Options | Required | Notes |
|---|-----------|-----------|---------|----------|-------|
| 1 | Lease Term Options | Free text | — | Optional | |
| 2 | Break/Extension Rights | Free text | — | Optional | |
| 3 | Payment Frequency | Dropdown | Monthly / Yearly | Optional | |
| 4 | Deposit/Security Requirement | Free text | — | Optional | Placeholder watermark: "USD amount or x months of rent" |
| 5 | Remote Hands Pricing | Free text | — | Optional | |
| 6 | Other Opex Charges | Free text | — | Optional | |
| 7 | Fit-out Contribution/TI Allowance | Free text | — | Optional | |
| 8 | Make-good/Restoration Obligations | Free text | — | Optional | |
| 9 | Tax/VAT Treatment | Free text | — | Optional | |
| 10 | Indexation Basis | Free text | — | Optional | |

---

### Step 7: Phasing & Expansion Schedule (dynamic monthly grid)

**How it works:**
- Supplier selects which months they want to add data for (can select multiple at once)
- For each selected month, they fill in 11 columns
- "Cumulative IT Load" is auto-calculated (running sum)
- "Total (MW)" is auto-calculated at top of grid

**Columns per month row:**

| Column | Field Name | Input Type | Options |
|--------|-----------|-----------|---------|
| A | Month | Date picker (month/year) | Supplier selects |
| B | IT Load (MW) | Numeric (whole) | — |
| C | Cumulative IT Load (MW) | **Auto-calculated** | Running total of column B |
| D | Scope of Works | Dropdown | Shell & Core + Fitout |
| E | Estimated Capex (M$) | Numeric (whole) | — |
| F | Phase | Dropdown | Original Phase / Expansion 1 / Expansion 2 |
| G | Minimum Lease Duration (yrs) | Numeric (whole) | — |
| H | NRC Request (M$) | Numeric (fractional) | — |
| I | Initial Deposit (M$) | Numeric (fractional) | — |
| J | MRC Request ($/kW/month) | Numeric (whole) | — |
| K | Key Inclusions in MRC | Free text | — |

---

### Step 8: Site Financials (10 fields)

**Source:** Sheet 3 of Excel

| # | Field Name | Input Type | Options | Required |
|---|-----------|-----------|---------|----------|
| 1 | Storage Area Rent ($/sqm or sqft/month) USD | Numeric (whole) | — | Optional |
| 2 | Tax Incentives Available | Dropdown | Yes / No | Optional |
| 3 | Annual Escalation, % | Numeric | — | Optional |
| 4 | Additional Opex Charges USD (incl. pass-through utilities) | Free text | — | Optional |
| 5 | Insurance by DC | Dropdown | Yes / No | Optional |
| 6 | Deposit Required | Dropdown | Yes / No | Optional |
| 7 | Power Price Structure | Dropdown | Fixed / Indexed / Pass-through / Blended | Optional |
| 8 | PPA | Free text | — | Optional |
| 9 | Avg Power Price (prev 12 months, USD cents/kWh) | Numeric (whole) | — | Optional |
| 10 | Cross-connect Pricing | Free text | — | Optional |

---

### Step 9: Documents & Submit

**Supplier-facing uploads:**

| Document | Type |
|----------|------|
| DC Compliance Sheet | File upload |
| DC Space Docs | File upload |
| DC Agreements | File upload |
| Remarks (if any) | Free text |

**Admin-only internal tracking (per document — NOT visible to supplier):**

| Field | Type | Notes |
|-------|------|-------|
| Received | Yes / No / Pending | For admin/sales tracking |
| Reviewed | Yes / No / In Progress | Auto "In Progress" once reviewer assigned |
| File Path | Auto-generated | Internal use only |

**Admin-only internal items:**

| Item | Type | Notes |
|------|------|-------|
| LoI/MoU | Checkbox | Ideally sync with legal system |
| MSA | Checkbox | Ideally sync with legal system |

---

## Application Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Saved but not submitted — not visible in admin queue, fully editable |
| **Submitted** | Formal submission — enters admin queue, supplier cannot edit |
| **In Review** | Admin has opened the submission |
| **Revision Requested** | Admin flagged specific fields with comments — supplier can edit flagged fields only |
| **Resubmitted** | Supplier fixed flagged fields — re-enters queue with change diff |
| **Approved** | Listing goes live |
| **Rejected** | Does not meet standards — rationale provided |

---

## Total DC Field Count Summary

| Step | Fields | Mandatory | Dropdowns | Checkboxes | Conditional |
|------|--------|-----------|-----------|------------|-------------|
| Step 1: Company Details | 7 | 6 | 0 | 0 | 0 |
| Step 2: Site Details + Master Plan | 20 | 10 | 8 | 0 | 0 |
| Step 3: DC Specifications | 28 | 5 | 14 | 1 | 1 |
| Step 4: Power Infrastructure | 16 | 4 | 10 | 1 | 0 |
| Step 5: Connectivity | 13 | 0+1 conditional | 5 | 0 | 1 |
| Step 6: Commercial Terms | 10 | 0 | 1 | 0 | 0 |
| Step 7: Phasing Schedule | 11/month | 0 | 2 | 0 | 0 |
| Step 8: Site Financials | 10 | 0 | 4 | 0 | 0 |
| Step 9: Documents | 4 | 0 | 0 | 0 | 0 |
| **TOTAL** | **~119 + phasing** | **25+1** | **44** | **2** | **2** |
