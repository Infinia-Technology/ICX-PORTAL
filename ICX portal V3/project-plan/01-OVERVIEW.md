# ICX Portal — Project Overview

**Version:** 1.0  
**Date:** 07 April 2026  
**Status:** Ready for Development

---

## What is ICX?

**ICX (Infinia Compute Exchange)** is a private, authenticated B2B marketplace for data center infrastructure. It connects DC suppliers (operators, developers, landlords, brokers) with enterprise/government buyers. There is no public directory — all access is admin-controlled.

## Core Flows

```
SUPPLIER FLOW:
  Register (OTP) → KYC (6 fields) → Admin Approves → Create DC Listing OR GPU Cluster → Admin Reviews → Live

CUSTOMER FLOW:
  Register (OTP) → Complete Profile → Admin Approves → Browse Marketplace → Submit GPU Demand OR DC Capacity Request

ADMIN FLOW:
  Centralised Queue → Review KYC / Listings / Demands → Approve / Reject / Request Revision → Analytics Dashboard

READER FLOW:
  Admin Creates Account → Browse Marketplace (restricted view: no pricing, no contacts, no docs)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router DOM 7 |
| UI Components | Lucide React (icons), Recharts (charts) |
| Backend | Express.js, Node.js 20 |
| Database | MongoDB 7, Mongoose 8 |
| Auth | OTP-based (email via Resend), JWT sessions (8hr), NO passwords |
| Email | Resend (from: support@iamsaif.ai) |
| File Storage | S3-compatible: MinIO (dev) / AWS S3 (prod) via @aws-sdk/client-s3 |
| Deployment | Docker Compose (MongoDB + Express + Vite/Nginx) |

## User Roles

| Role | Registration | Access |
|------|-------------|--------|
| **Supplier** | Self-registration (landing page) | Own listings, team management, inquiries |
| **Broker** | Self-registration (same form, detected by Vendor Type) | Same as supplier + manage multiple DC companies |
| **Subordinate** | Invited by supplier/broker (after KYC approval) | Scoped permissions on documents/sections |
| **Customer** | Self-registration (landing page) | Browse marketplace, submit GPU/DC demand requests |
| **Reader** | Admin-provisioned only | Browse-only (no pricing, no contacts, no docs) |
| **Admin** | Created by Superadmin | Queue review, KYC/listing approval, analytics |
| **Superadmin** | System-level | All admin + user CRUD, role promotion, audit logs |
| **Viewer** | Admin-provisioned | Read-only dashboards |

## Authentication

- **Pure OTP** — no passwords stored anywhere in the system
- User enters email → system sends 6-digit OTP via Resend (valid 5 minutes)
- User enters OTP → JWT issued (8-hour expiry)
- Redirected to role-appropriate dashboard
- Superadmin can create/edit/promote user roles

## Resend Email Config

```
API Key: stored in .env as RESEND_API_KEY (NEVER commit to repo or docs)
From: support@iamsaif.ai (stored in .env as EMAIL_FROM)
```

**SECURITY:** The Resend API key must ONLY exist in `.env` files. Never in source code, docs, or version control.

## Source Documents

All field definitions come from these Excel files (provided by business team):
1. `001-Infinia DC Questionnaire new_shared with IT.xlsx` — DC listing fields
2. `002 - GPU Cluster Inventory- Current_for IT.xlsx` — GPU cluster fields
3. `GPU Client Pipeline - Current_shared with IT.xlsx` — GPU customer demand fields
