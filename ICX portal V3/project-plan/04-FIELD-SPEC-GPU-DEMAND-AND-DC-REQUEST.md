# GPU Demand & DC Capacity Request — Field Specification

---

## A. GPU Client Pipeline (Customer/Supplier GPU Demand Request)

**Source:** `GPU Client Pipeline - Current_shared with IT.xlsx`  
**Sheet:** GPU Pipeline  
**Access:** Accessible from both Customer Portal AND Supplier Portal  
**Landing Page:** CTA on landing page directs to register first, then fill form

### Fields (18 total)

| # | Field Name (from Excel) | Input Type | Options | Required | Notes |
|---|------------------------|-----------|---------|----------|-------|
| 1 | Customer | Free text | — | **Mandatory** | Pre-filled from logged-in user's org profile |
| 2 | Date of Entry | Date (auto) | — | **Mandatory** | Auto-timestamped, not editable |
| 3 | Customer Country | Free text | — | **Mandatory** | |
| 4 | Type of Technology | Free text | — | **Mandatory** | e.g. "B300 or H200", "B300 or GB300" |
| 5 | Contract Length, Years | Free text | — | **Mandatory** | e.g. "3 years", "1 year (H200)", "3-5 years" |
| 6 | Cluster Size GPU # | Free text | — | **Mandatory** | e.g. "10000", "2048*8 = 16,384 (B300) or GB300 227 rack" |
| 7 | Ideal Cluster Location | Free text | — | Optional | e.g. "Unlimited non-regulated/non-sanctioned", "Europe or SE Asia" |
| 8 | Export Constraints | Free text | — | Optional | |
| 9 | Timeline for Go Live | Free text | — | **Mandatory** | e.g. "ASAP" |
| 10 | Connectivity, Mbps | Numeric (whole) | — | Optional | |
| 11 | Latency, ms | Numeric (whole) | — | Optional | |
| 12 | Interconnectivity | Free text | — | Optional | |
| 13 | DC Tier (minimum) | Dropdown | Tier I / Tier II / Tier III / Tier IV | Optional | Standardized to Roman numerals across all models |
| 14 | Redundancy / Uptime Requirements | Free text | — | Optional | |
| 15 | Target Price, GPU/h, USD | Free text | — | Optional | Can be a range |
| 16 | Decision Maker | Free text | — | Optional | |
| 17 | Procurement Stage | Free text | — | Optional | e.g. "RFP issued", "Shortlisting", "Budget approved" |
| 18 | Other Comments | Free text | — | Optional | |

### Summary
- **Total:** 18 fields
- **Mandatory:** 7 (Customer, Date, Country, Technology, Contract Length, Cluster Size, Timeline)
- **Dropdowns:** 1 (DC Tier)
- **Numeric:** 2 (Connectivity, Latency)
- **Free text:** 15
- **Auto-filled:** 2 (Customer name from profile, Date of Entry)

### Admin Flow
- GPU demand enters admin queue as "GPU Demand Request"
- Admin can match demand against approved GPU cluster listings
- Admin can forward matching cluster details to the customer

---

## B. DC Capacity Request (Customer/Supplier — Basic Questionnaire)

**Source:** Designed based on project requirements (no Excel source for this form)  
**Access:** Accessible from both Customer Portal AND Supplier Portal  
**Landing Page:** CTA on landing page directs to register first, then fill form

### Fields (15 total)

| # | Field Name | Input Type | Options | Required | Notes |
|---|-----------|-----------|---------|----------|-------|
| 1 | Company Name | Free text | — | **Mandatory** | Pre-filled from logged-in user's org profile |
| 2 | Date of Entry | Date (auto) | — | Auto | System timestamp |
| 3 | Country | Free text | — | **Mandatory** | |
| 4 | Required Power Capacity (MW) | Free text | — | **Mandatory** | e.g. "10 MW", "50-100 MW" |
| 5 | Preferred Location / Region | Free text | — | Optional | e.g. "Middle East", "Europe" |
| 6 | DC Tier Requirement | Dropdown | Tier I / Tier II / Tier III / Tier IV | Optional | |
| 7 | Business Model | Dropdown | Colocation (Wholesale/Retail) / Powered Shell / Build-to-Suit | Optional | |
| 8 | Sovereignty Requirements | Free text | — | Optional | |
| 9 | Compliance Requirements | Free text | — | Optional | e.g. "GDPR", "Local Data Residency" |
| 10 | Timeline for Go Live | Free text | — | **Mandatory** | e.g. "Q3 2026", "Immediate" |
| 11 | Contract Length | Free text | — | Optional | e.g. "3-5 years" |
| 12 | Budget Range | Free text | — | Optional | e.g. "$200K-$500K/month" |
| 13 | Cooling Requirements | Free text | — | Optional | e.g. "Liquid cooling required" |
| 14 | Connectivity Requirements | Free text | — | Optional | |
| 15 | Other Comments | Free text | — | Optional | |

### Summary
- **Total:** 15 fields
- **Mandatory:** 4 (Company, Country, Power Capacity, Timeline)
- **Dropdowns:** 2 (DC Tier, Business Model)
- **Auto-filled:** 2 (Company name from profile, Date of Entry)

### Admin Flow
- DC capacity request enters admin queue as "DC Capacity Request"
- Admin can match against approved DC listings
- Admin can forward matching DC details to the customer

---

## Access Matrix

| Portal | GPU Demand | DC Capacity Request |
|--------|-----------|-------------------|
| Customer Portal | Yes | Yes |
| Supplier Portal | Yes | Yes |
| Landing Page (unauthenticated) | CTA → Register first | CTA → Register first |
| Admin Portal | View + Match | View + Match |
