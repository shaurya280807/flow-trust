# FlowTrust — Master Documentation Index

**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Status:** MVP Specifications Finalized & Organized for Implementation Planning  

Welcome to the authoritative documentation directory for **FlowTrust**, an AI-assisted financial management, customer/supplier intelligence, and cash-flow risk simulation platform for small businesses.

Every major product, financial, data, feature, security, and operational subject has **one authoritative specification** in the hierarchy below.

---

## 1. Documentation Directory Structure & Source of Truth Map

```text
docs/
├── README.md                                                  # This Master Documentation Index
├── product/
│   ├── PRODUCT_SCOPE.md                                       # Product vision, target users, user journey & P0–P4 priorities
│   └── WORKSPACE_AND_ONBOARDING_SPECIFICATION.md              # Multi-user businesses, join codes, setup flow & demo isolation
├── architecture/
│   ├── TECH_STACK_AND_ARCHITECTURE.md                         # Next.js, TypeScript, Supabase, RLS, Zod, PapaParse & module layout
│   ├── LAYERED_INTELLIGENCE_AND_COMPONENT_ARCHITECTURE.md     # 7-layer intelligence pipeline, 12 analytical components (COMP-01..12) & risk indicators
│   ├── AI_SYSTEM_ARCHITECTURE.md                              # 8-module AI & financial intelligence architecture, boundaries & guardrails
│   └── SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md           # Workspace isolation, RLS policies, secrets, record integrity & backups
├── financial/
│   └── FINANCIAL_FOUNDATION_SPECIFICATION.md                  # Authoritative accounting rules, available cash & lib/finance/ formulas
├── data/
│   ├── DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md   # Canonical 12-table data model, 3 CSV formats & synthetic data plan
│   └── CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md             # 7-stage CSV import pipeline, validation, deduplication & test cases
├── features/
│   ├── RISK_SIMULATOR_SPECIFICATION.md                        # Interactive risk scenarios, 30/60/90d horizons & baseline/stress math
│   ├── CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md        # Directories, payment-delay math, n>=3 rule & risk indicator matrix
│   ├── REPORTS_SPECIFICATION.md                               # Weekly, Monthly, Yearly (FY Apr–Mar), Customer & Supplier reports + PDF
│   ├── AI_COPILOT_SPECIFICATION.md                            # Grounded read-only Copilot, deterministic tools & fallback architecture
│   └── NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md           # In-app operational alerts, condition_key deduplication & auto-resolution
├── design/
│   └── UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md               # Sitemap, screen wireframes, Light/Dark/System themes & microcopy rules
├── quality/
│   └── TESTING_AND_DEFINITION_OF_DONE.md                      # Unit, integration, security test suites & 10-point Definition of Done
├── operations/
│   └── DEPLOYMENT_AND_ENVIRONMENT_READINESS.md                # Local setup, .env.example contract, Supabase migrations & Vercel deploy
└── project/
    ├── MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md                 # Finalized MVP decision log, cross-feature consistency & deferred scope
    └── AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md          # 9-phase implementation plan & 35 atomic tasks (TASK-1.1 to TASK-9.4)
```

---

## 2. Quick Navigation Guide for Developers

| If You Are Implementing or Reviewing... | Start With This Authoritative Document |
|---|---|
| **Overall Product Vision & Feature Priorities (P0–P4)** | [product/PRODUCT_SCOPE.md](./product/PRODUCT_SCOPE.md) |
| **Auth, Business Creation, Join Codes & Onboarding** | [product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](./product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md) |
| **Tech Stack, Folder Structure & Module Boundaries** | [architecture/TECH_STACK_AND_ARCHITECTURE.md](./architecture/TECH_STACK_AND_ARCHITECTURE.md) |
| **Database Schema, Entities & Synthetic Dataset Strategy** | [data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](./data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) |
| **Financial Formulas (`Available Cash`, `Receivables`, `Payables`, `Opening Balances`)** | [financial/FINANCIAL_FOUNDATION_SPECIFICATION.md](./financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) |
| **CSV Upload, Column Mapping, Validation & Duplicate Detection** | [data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](./data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md) |
| **Risk Simulator (`lib/finance/simulator.ts` & `/simulator`)** | [features/RISK_SIMULATOR_SPECIFICATION.md](./features/RISK_SIMULATOR_SPECIFICATION.md) |
| **Customers & Suppliers Directories, Payment Delays & Risk Indicators** | [features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](./features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) |
| **Statistical vs. Risk Overview Reports & Print-to-PDF** | [features/REPORTS_SPECIFICATION.md](./features/REPORTS_SPECIFICATION.md) |
| **AI Financial Copilot & Deterministic Tool Grounding** | [features/AI_COPILOT_SPECIFICATION.md](./features/AI_COPILOT_SPECIFICATION.md) |
| **7-Layer Intelligence Pipeline & 12 Analytical Components (`COMP-01`–`12`)** | [architecture/LAYERED_INTELLIGENCE_AND_COMPONENT_ARCHITECTURE.md](./architecture/LAYERED_INTELLIGENCE_AND_COMPONENT_ARCHITECTURE.md) |
| **Complete 8-Module AI & Financial Intelligence Architecture** | [architecture/AI_SYSTEM_ARCHITECTURE.md](./architecture/AI_SYSTEM_ARCHITECTURE.md) |
| **9-Phase AI & Intelligence Implementation Roadmap (`TASK-1.1`–`9.4`)** | [project/AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md](./project/AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md) |
| **In-App Notifications & Payment Reminders** | [features/NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md](./features/NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md) |
| **UI Layouts, Navigation, Theme System (`Light`/`Dark`/`System`) & Copy** | [design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md](./design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md) |
| **Row Level Security (RLS), Workspace Isolation & Data Integrity** | [architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md](./architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md) |
| **Unit, Integration, E2E Tests & Definition of Done** | [quality/TESTING_AND_DEFINITION_OF_DONE.md](./quality/TESTING_AND_DEFINITION_OF_DONE.md) |
| **Environment Variables (`.env.example`), Migrations & Vercel Deployment** | [operations/DEPLOYMENT_AND_ENVIRONMENT_READINESS.md](./operations/DEPLOYMENT_AND_ENVIRONMENT_READINESS.md) |
| **Cross-Feature Consistency Audit, Open Calibrations & Deferred Backlog** | [project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md](./project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md) |

---

## 3. Historical / Superseded Documents

* The initial pre-scope notes `docs/audit-report.md` and `docs/open-questions.md` (authored on 19 October 2026 for an early Python/SQLite concept) were superseded by the approved Next.js + TypeScript + Supabase PostgreSQL architecture and specifications above, and have been replaced by [project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md](./project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md).

