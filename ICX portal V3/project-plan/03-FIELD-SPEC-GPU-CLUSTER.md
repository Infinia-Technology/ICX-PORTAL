# GPU Cluster Inventory — Complete Field Specification

**Source:** `002 - GPU Cluster Inventory- Current_for IT.xlsx`  
**Sheets:** Basic Information, Extended Information  
**Structure:** Both sheets merged into a single multi-step wizard form. Extended Information fields are optional but shown in the main form (not a separate section).

---

## GPU Cluster Wizard (8 Steps)

### Step 1: Basic Cluster Information (12 fields)

| # | Field Name | Input Type | Required | Notes |
|---|-----------|-----------|----------|-------|
| 1 | Date of Entry | Date (auto) | Auto | System auto-timestamp, not editable |
| 2 | Vendor / Operator Name | Free text | **Mandatory** | e.g. "Northern Data" |
| 3 | Location | Free text | **Mandatory** | City / facility name, e.g. "Amsterdam" |
| 4 | Country | Free text | **Mandatory** | e.g. "Netherlands" |
| 5 | GPU Technology | Free text | **Mandatory** | e.g. "NV B300", "NV GB300 NVL72", "H200" |
| 6 | Google Maps Link | URL / hyperlink | **Mandatory** | Coordinates of the facility |
| 7 | DC Landlord | Free text | Optional | If hosted in a third-party DC |
| 8 | Total Number of GPUs | Numeric (whole) | Optional | Total GPUs across all clusters at this location |
| 9 | Single Cluster Size (n. of GPUs) | Numeric (whole) | **Mandatory** | GPUs in the offered cluster |
| 10 | Availability Date (RFS) | Date picker | **Mandatory** | Ready-for-service date |
| 11 | Notes (e.g. contract length) | Free text | **Mandatory** | Minimum commitment, terms |
| 12 | Restricted Use | Free text | Optional | Export controls, usage restrictions |

---

### Step 2: Compute Node Specifications (6 fields)

| # | Field Name | Input Type | Required | Notes |
|---|-----------|-----------|----------|-------|
| 1 | GPU Server Model | Free text | **Mandatory** | e.g. "NVIDIA DGX B200", "SuperMicro custom" |
| 2 | CPU | Free text | Optional | e.g. "AMD EPYC 9004", "Intel Xeon" |
| 3 | GPU | Free text | Optional | e.g. "NVIDIA B300 80GB HBM3e" |
| 4 | RAM | Free text | Optional | e.g. "2TB DDR5 per node" |
| 5 | Local Storage | Free text | **Mandatory** | e.g. "8x 3.84TB NVMe SSD per node" |
| 6 | NICs | Free text | Optional | e.g. "8x ConnectX-7 400GbE" |

---

### Step 3: Compute Network — Back-End / East-West (7 fields)

| # | Field Name | Input Type | Required | Notes |
|---|-----------|-----------|----------|-------|
| 1 | Topology | Free text | Optional | e.g. "Rail Optimized", "Fat Tree" |
| 2 | Technology | Free text | **Mandatory** | e.g. "Ethernet", "InfiniBand NDR", "InfiniBand XDR" |
| 3 | Switch Vendor | Free text | Optional | e.g. "NVIDIA Spectrum-X", "Arista" |
| 4 | Number of Network Layers | Free text | Optional | e.g. "spine-leaf architecture", "3-tier" |
| 5 | Oversubscription Ratio | Free text | Optional | e.g. "1:1 (non-blocking)", "2:1" |
| 6 | Scalability Plan for Future Expansion | Free text | Optional | |
| 7 | QoS Configuration | Free text | Optional | |

---

### Step 4: Management Network — Front-End / North-South (6 fields)

| # | Field Name | Input Type | Required | Notes |
|---|-----------|-----------|----------|-------|
| 1 | Topology | Free text | Optional | e.g. "Fat Tree" |
| 2 | Technology | Free text | Optional | e.g. "Ethernet 400G" |
| 3 | Number of Network Layers | Numeric (whole) | Optional | |
| 4 | Switch Vendor | Free text | Optional | |
| 5 | Oversubscription Ratio | Free text | Optional | |
| 6 | Scalability Plan for Future Expansion | Free text | Optional | |

---

### Step 5: OOB Network, Storage & Connectivity (3 fields)

| # | Field Name | Input Type | Required | Notes |
|---|-----------|-----------|----------|-------|
| 1 | Out-of-Band (OOB) Network Technology | Free text | Optional | e.g. "Ethernet 1G" |
| 2 | Storage Options | Free text | Optional | "Provide detailed storage options: vendor name, speed, max capacity" |
| 3 | Connectivity Details | Free text | Optional | "Provide detailed connectivity: bandwidth, redundancy, links, etc." |

---

### Step 6: Cluster Description & Documentation (1 field + file uploads)

| # | Field Name | Input Type | Required | Notes |
|---|-----------|-----------|----------|-------|
| 1 | Cluster Description | Free text | Optional | "Description of the cluster and all available documentation (security, compliance)" |
| 2 | Security & Compliance Documentation | File upload | Optional | Certifications, audit reports |
| 3 | Other Documentation | File upload | Optional | Architecture diagrams, spec sheets |

---

### Step 7: Extended Information — Power & Facility (14 fields, ALL Optional)

These fields come from Sheet 2 ("Extended Information") of the Excel. They capture facility-level details for GPU clusters that are self-hosted or where the supplier manages the facility.

**Section: Power Supply**

| # | Field Name | Input Type | Required |
|---|-----------|-----------|----------|
| 1 | Power Supply Status | Free text | Optional |
| 2 | Rack Power Capacity (kW/rack) | Numeric (whole) | Optional |
| 3 | Number of Modular Data Halls | Numeric (whole) | Optional |
| 4 | Total Power Capacity (MW) — IT Load | Numeric (whole) | Optional |

**Section: Floor Information**

| # | Field Name | Input Type | Required |
|---|-----------|-----------|----------|
| 5 | Power Capacity per Floor | Numeric (whole) | Optional |
| 6 | Modular Data Hall Layout per Floor | Free text | Optional |
| 7 | Future Expansion Capability (additional power & space) | Free text | Optional |

**Section: Power Redundancy and Backup**

| # | Field Name | Input Type | Required |
|---|-----------|-----------|----------|
| 8 | Dual-feed Redundant Power Supply? | Free text | Optional |
| 9 | UPS Configuration | Free text | Optional |
| 10 | Number and Capacity of Backup Generators | Free text | Optional |

**Section: HVAC (Heating, Ventilation, and Air Conditioning)**

| # | Field Name | Input Type | Required |
|---|-----------|-----------|----------|
| 11 | Cooling System Design | Free text | Optional |
| 12 | Number of Cooling Units | Free text | Optional |
| 13 | Cooling Capacity (kW or tons) | Free text | Optional |

**Section: Rack & Module Layout**

| # | Field Name | Input Type | Required |
|---|-----------|-----------|----------|
| 14 | Floor Plans (rack & module arrangements) | Free text / File upload | Optional |

---

### Step 8: Review & Submit

- Review all entered data across steps 1-7
- Submit for admin review
- Same status flow as DC listings (Draft → Submitted → In Review → Revision Requested → Resubmitted → Approved → Rejected)

---

## GPU Cluster Total Field Count

| Step | Fields | Mandatory | Optional |
|------|--------|-----------|----------|
| Step 1: Basic Info | 12 | 8 | 4 |
| Step 2: Compute Node | 6 | 2 | 4 |
| Step 3: Compute Network E-W | 7 | 1 | 6 |
| Step 4: Management Network N-S | 6 | 0 | 6 |
| Step 5: OOB + Storage + Connectivity | 3 | 0 | 3 |
| Step 6: Description + Docs | 1+2 uploads | 0 | 3 |
| Step 7: Power & Facility | 14 | 0 | 14 |
| **TOTAL** | **49 + 2 uploads** | **11** | **40** |

**No dropdowns in GPU form** — all fields are either free text or numeric. No conditional logic.
