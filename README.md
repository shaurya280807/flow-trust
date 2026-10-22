# FlowTrust — Beyond Balance. Into Resilience.

> **Project Stage:** Planning, Requirements Engineering, Synthetic Dataset Verification & System Architecture Complete — **Application Implementation Not Yet Started**

---

## 1. Overview

**FlowTrust** is a financial management, customer/supplier payment intelligence, and cash-flow risk simulation project designed for small businesses—particularly businesses operating with irregular cash inflows and limited financial visibility.

The goal of FlowTrust is to help small-business owners look beyond a single bank balance and understand their actual near-term financial resilience: how much cash is genuinely available, which customer invoices and supplier bills are open or overdue, how reliably counterparties settle their obligations over time, and how potential stresses (such as delayed customer payments or a drop in revenue) would affect cash coverage over the next 30 to 90 days.

This repository is also a deliberate, learning-driven software engineering project focused on designing and building a complete system from requirements and financial domain modeling through architecture, implementation, testing, and deployment.

---

## 2. Current Project Status

At the time of writing, **FlowTrust is in its specification, data-modeling, and architecture-planning stage. The web application itself has not yet been implemented or deployed.**

To keep the state of the repository transparent, work is separated into four categories:

### A. Completed & Verified in the Repository Today
* **Product & Feature Specifications (`docs/`):** 17 detailed Markdown specifications covering product scope, workspace onboarding, financial calculation rules, canonical data structures, CSV import validation, customer and supplier intelligence, risk simulation, reporting, notifications, UI/UX design, testing standards, and deployment readiness.
* **AI & Financial Intelligence Architecture (`docs/architecture/` & `docs/project/`):** Complete 8-module architecture design and a 9-phase, 35-task implementation roadmap separating deterministic financial math (`lib/finance/`) from AI interpretation (`lib/ai/`).
* **Deterministic Synthetic Datasets & Validation Suite (`datasets/synthetic/`):**
  * **Implemented & Verified:** Two zero-dependency Node.js scripts—[`generate_datasets.mjs`](./datasets/synthetic/scripts/generate_datasets.mjs) and [`validate_datasets.mjs`](./datasets/synthetic/scripts/validate_datasets.mjs)—that deterministically generate and validate 50 dataset files across 4 fictional Indian small-business scenarios (`Profile A` through `Profile D`), 3 CSV import templates, and 8 malformed/edge-case CSV test fixtures, backed by ground-truth financial assertions in [`manifest.json`](./datasets/synthetic/manifest.json).

### B. Architecture & Technical Decisions Finalized (Not Yet Built in Application Code)
* Single-codebase **Next.js (App Router) + TypeScript** modular architecture.
* **12-table PostgreSQL schema** with **Supabase Auth** and **Row Level Security (RLS)** for multi-user business workspace isolation.
* **Integer-paise (`NUMERIC(14,2)`) financial rules** separating cash movements (`transactions`) from accrual obligations (`invoices`, `bills`, and `payments`).
* **Read-only AI Copilot grounding contract** with mandatory deterministic fallback when an external LLM is unavailable or unconfigured.

### C. Planned for Implementation (Not Yet Started)
* Next.js project scaffold (`package.json`, `app/`, `components/`, `lib/`).
* Supabase SQL migrations and Row Level Security policies (`supabase/migrations/`).
* Production TypeScript financial calculation engine (`lib/finance/`).
* 7-stage CSV import and deduplication pipeline (`lib/csv/`).
* Frontend pages and workflows (Dashboard, Transactions, Invoices & Bills, Customers, Suppliers, Risk Simulator, Reports, Notifications, and AI Copilot).
* Automated unit, integration, security, and end-to-end application test suites.

---

## 3. Problem Statement and Intended Solution

### The Problem
Small businesses frequently track finances using disconnected spreadsheets, basic ledger apps, or raw bank statements. In practice, this creates several blind spots:
1. **Confusing bank balance with available resilience:** A positive cash balance today can hide an upcoming cash shortfall if large supplier bills fall due before delayed customer invoices are collected.
2. **Double-counting or mixing invoices with cash:** Treating an issued invoice as cash received—or miscounting opening balances when importing historical bank statements—distorts true cash flow.
3. **Opaque counterparty behaviour:** Business owners often know intuitively that a customer pays late, but lack clear historical metrics (such as average payment delay, on-time settlement rate, or concentration exposure) backed by sample-size checks.
4. **No structured way to test "what-if" scenarios:** Assessing the impact of a 30-day customer payment delay, a 25% revenue dip, or an unexpected expense usually requires manual spreadsheet formulas that risk modifying real records.

### The Intended Solution
FlowTrust is designed around a strict separation between **actual historical records**, **deterministic projections**, and **AI-generated explanations**:
* **Evidence-Based Ledger & Cash Position:** Tracks bank and physical cash movements separately from open customer invoices and supplier bills, supporting partial payments and explicit opening-balance cutoff dates.
* **Transparent Counterparty Intelligence:** Computes payment-delay metrics and on-time rates only from completed invoices with sufficient history ($N \ge 3$), explicitly labeling sparse records as `Insufficient Data` rather than guessing.
* **Read-Only Risk Simulator:** Projects baseline vs. stressed daily cash trajectories over 30, 60, and 90 days without altering underlying ledger records.
* **Grounded Financial Copilot:** Uses deterministic backend calculations as its single source of numerical truth, translating computed figures into plain-language summaries with citations to specific invoices, bills, and counterparties.

---

## 4. Key Planned Capabilities

All capabilities below are **planned features** defined in [`docs/product/PRODUCT_SCOPE.md`](./docs/product/PRODUCT_SCOPE.md):

1. **Multi-User Business Workspaces & Onboarding:** Create a business workspace, join an existing workspace via a join code, configure opening cash balances and cutoff dates, or explore an isolated synthetic demonstration workspace.
2. **Financial Dashboard:** View `Available Cash`, settled inflows and outflows, net cash flow, outstanding receivables and payables, overdue obligations, and near-term cash coverage warnings.
3. **Financial Records & 7-Stage CSV Import:** Record transactions, invoices, bills, and partial payment allocations manually or import records via three documented CSV formats (Unified Ledger, Bank Statement Debit/Credit Export, and Documents CSV) with column mapping, Zod validation, and two-layer duplicate detection.
4. **Customer & Supplier Intelligence Directories:** Inspect per-customer and per-supplier transaction histories, outstanding/overdue balances, completed-invoice payment delays, revenue/spend share, and rule-based collection risk indicators.
5. **Interactive Risk Simulator:** Compare a 30/60/90-day baseline cash projection against combined stress scenarios (revenue decline, customer payment delays, unexpected expenses, and proposed investments) to identify projected cash shortfalls and minimum cash dates.
6. **Printable Financial & Risk Reports:** Generate Weekly, Monthly, Yearly (Indian Financial Year: April 1 – March 31), Customer, and Supplier reports in two distinct modes—**Statistical Report** (strictly factual) and **Risk Overview Report** (factual statistics plus a clearly separated risk assessment)—with browser print-to-PDF support (`@media print`).
7. **In-App Operational Notifications:** Workspace-scoped alerts for overdue invoices, bills due within 7 days, cash coverage warnings, and CSV import summaries, with automatic resolution when underlying obligations are settled.
8. **Grounded AI Copilot & Deterministic Fallback:** Ask natural-language questions about cash position, overdue receivables, concentration risks, and simulator scenarios, backed by read-only deterministic tools and a built-in template fallback mode.

---

## 5. Product and Technical Decisions

Key architectural and domain rules established during the planning phase ([`docs/project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md`](./docs/project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md)):

* **Deterministic Math Only (`lib/finance/`):** Every monetary figure is stored as `NUMERIC(14,2)` in PostgreSQL and calculated using integer minor units (`paise`) in TypeScript. The AI model is never permitted to perform freehand arithmetic.
* **Opening Balance Cutoff Protection:** Transactions dated on or before a workspace's `opening_balance_date` are flagged as pre-cutoff (`is_pre_opening_cutoff = true`) so historical imports never double-count cash already included in the opening balance.
* **Sample-Size Honesty ($N \ge 3$ and $N \ge 6$ Gates):** Customer payment-delay averages and on-time rates require at least 3 completed invoices with due dates ($N_{\text{eligible}} \ge 3$). Trend comparisons require $N_{\text{eligible}} \ge 6$.
* **No Unverified Operational Claims:** Supplier intelligence tracks bill obligations and the business's own payment timing only; it never claims to rate supplier product quality or delivery speed without supporting data.
* **Single Modular Codebase (No Premature Microservices):** Frontend, server actions/route handlers, financial modules, and AI orchestration will live in a single Next.js TypeScript repository rather than split across separate backend microservices or vector databases.
* **Defense-in-Depth Workspace Isolation:** Every query is scoped to an authenticated user's verified `business_id` both in server-side authorization checks and in PostgreSQL Row Level Security (RLS) policies.

---

## 6. Technology Stack

None of the web application packages below have been installed yet; only the Node.js synthetic dataset generator and validator scripts are currently active in the repository.

| Layer | Technology | Current Status | Purpose in FlowTrust |
|---|---|---|---|
| **Dataset & Verification Tooling** | Node.js ESM (`node:fs`, `node:crypto`) | **Implemented & Verified** | Generates and validates the 50 synthetic dataset files and `manifest.json` in `datasets/synthetic/`. |
| **Language** | TypeScript (Strict Mode) | **Selected (Planned)** | End-to-end static typing across domain models, financial math, API contracts, and UI. |
| **Application Framework** | Next.js (App Router) + React | **Selected (Planned)** | Unified frontend pages, server components, and server-side API route handlers. |
| **Styling & UI Primitives** | Tailwind CSS + shadcn/ui + Lucide React | **Selected (Planned)** | Accessible, responsive interface with Light, Dark, and System theme support. |
| **Charts & Visualization** | Recharts | **Selected (Planned)** | Cash-flow trend charts and Risk Simulator baseline vs. stressed trajectory plots. |
| **Database & Authentication** | Supabase (PostgreSQL + Supabase Auth + RLS) | **Selected (Planned)** | Relational persistence across 12 canonical tables, email/password auth, and RLS isolation. |
| **Schema & Input Validation** | Zod | **Selected (Planned)** | Runtime validation for forms, CSV rows, API payloads, and AI tool arguments. |
| **CSV Parsing** | PapaParse | **Selected (Planned)** | Parsing and header normalization for the 7-stage CSV import pipeline. |
| **AI Provider Integration** | Server-side Provider Adapter (Google Gemini `gemini-2.5-flash` default) + Deterministic Fallback | **Selected / Optional Key (Planned)** | Grounded natural-language explanations over `lib/finance/` tool outputs; falls back to `lib/ai/fallback-explainer.ts` if no API key is configured. |
| **Testing & Deployment** | Vitest + Playwright · Vercel | **Selected (Planned)** | Unit/integration testing against synthetic fixtures, E2E workflow tests, and hosting. |

---

## 7. Development Philosophy

FlowTrust is guided by the following engineering principles—applied first during specification and dataset design, and intended to govern every phase of implementation:

1. **Define requirements before implementation:** Resolve domain edge cases (partial payments, cancelled invoices, opening balance cutoffs, duplicate CSV rows) in writing before writing application code.
2. **Keep financial calculations deterministic and testable:** Financial outputs must be pure functions of the underlying records and evaluation date.
3. **Separate financial calculations from AI-generated interpretations:** The deterministic engine computes the numbers; the AI explains them and cites the source records.
4. **Prefer understandable architecture over unnecessary complexity:** Avoid introducing vector databases, autonomous multi-agent loops, or distributed microservices when a modular monolith and structured tool calls solve the problem cleanly.
5. **Build incrementally with clear dependencies:** Implement and test foundational data contracts and financial math before wiring UI dashboards or AI endpoints.
6. **Test important business rules against ground truth:** Verify calculation modules against pre-computed synthetic business scenarios (`manifest.json`).
7. **Document decisions and unresolved questions:** Maintain an explicit audit log of confirmed requirements, proposed improvements, and calibrated defaults.
8. **Treat security, data integrity, and workspace isolation as architectural requirements:** Design Row Level Security, foreign-key constraints (`ON DELETE RESTRICT` for financial history), and server-side workspace guards from day one.
9. **Avoid presenting unimplemented functionality as complete:** Keep documentation honest about what is specified versus what is running in code.

---

## 8. My Role and Ownership

I am the primary person driving FlowTrust. I define the product vision and scope, make the product and technical decisions, evaluate architectural alternatives, set implementation priorities, and review and approve every specification and design decision in this repository.

Where trade-offs arise—such as choosing how to handle opening-balance cutoffs, defining sample-size thresholds for customer payment delays, deciding what belongs in the MVP versus post-MVP scope, or keeping the AI Copilot strictly read-only—the final decisions and direction are mine.

---

## 9. AI-Assisted Development and Learning Approach

### Learning-Driven Engineering Goal
A central goal of building FlowTrust is to learn how real software systems are engineered end to end, rather than simply obtaining generated code that appears to work. Throughout the project, I am using FlowTrust to study and practice:

* **Requirements engineering and scope definition:** Translating high-level product ideas into unambiguous rules and edge-case specifications.
* **System architecture and module boundaries:** Designing clean interfaces between database queries, pure domain logic, API routes, and UI components.
* **Database design and data relationships:** Modeling relational tables, constraints, partial payment allocations, and non-destructive archiving.
* **Financial calculations and business logic:** Implementing integer-paise arithmetic, cash-flow cutoffs, ageing buckets, and scenario projections.
* **Validation, error handling, and testing:** Designing multi-stage CSV validation, deterministic deduplication, and automated test suites.
* **Backend and frontend integration & API contracts:** Structuring type-safe request/response payloads and predictable client states.
* **Authentication, authorization, and data security:** Enforcing multi-tenant workspace isolation via server checks and PostgreSQL RLS.
* **AI integration and its limitations:** Grounding LLM responses in deterministic tools, defending against hallucinations and prompt injection, and building reliable fallbacks.
* **Debugging, maintainability, and deployment:** Writing readable code, diagnosing failures systematically, and managing environment configurations.

### Intended Development Workflow
For each module in the roadmap, the workflow I follow is:
1. **Understand the requirement:** Clarify the user problem, financial rule, and edge cases.
2. **Evaluate the design:** Compare possible data structures, algorithms, and module boundaries.
3. **Make a decision:** Select an approach and document the rationale and trade-offs.
4. **Implement:** Write or review the implementation in small, understandable increments.
5. **Test:** Verify behavior against unit tests, synthetic datasets, and edge-case fixtures.
6. **Review and refine:** Inspect the code and test results to ensure I understand how and why it works before moving on.

### How AI Tools Are Used
I use AI as a technical discussion partner and development assistant throughout this process:
* **How AI assists:** Exploring architectural alternatives, explaining unfamiliar technical or financial concepts, reviewing requirements to spot missing edge cases, drafting structured documentation and implementation plans, assisting with code and test generation, and helping analyze bugs or errors.
* **Boundaries and oversight:** AI does not own the product direction, and AI-generated proposals or code are never treated as automatically correct. Every architectural recommendation is evaluated and approved by me, and any AI-assisted code must be read, understood, tested against the deterministic specifications, and revised where necessary.

---

## 10. Project Roadmap

The roadmap below reflects the actual state of the repository and the planned implementation sequence ([`docs/project/AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md`](./docs/project/AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md)):

| Stage | Milestone / Scope | Status | Evidence in Repository |
|---|---|---|---|
| **Stage 1** | **Product Requirements & Scope Definition** | **Completed (Specification)** | [`docs/product/PRODUCT_SCOPE.md`](./docs/product/PRODUCT_SCOPE.md), [`WORKSPACE_AND_ONBOARDING_SPECIFICATION.md`](./docs/product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md) |
| **Stage 2** | **Financial Foundations, Canonical Data Model & Synthetic Dataset Validation** | **Completed (Spec + Verified Scripts & Data)** | [`FINANCIAL_FOUNDATION_SPECIFICATION.md`](./docs/financial/FINANCIAL_FOUNDATION_SPECIFICATION.md), [`datasets/synthetic/`](./datasets/synthetic/README.md) (`generate_datasets.mjs`, `validate_datasets.mjs`, `manifest.json`) |
| **Stage 3** | **System Architecture & Implementation Task Breakdown** | **Completed (Architecture & Plan)** | [`TECH_STACK_AND_ARCHITECTURE.md`](./docs/architecture/TECH_STACK_AND_ARCHITECTURE.md), [`AI_SYSTEM_ARCHITECTURE.md`](./docs/architecture/AI_SYSTEM_ARCHITECTURE.md), [`AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md`](./docs/project/AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md) |
| **Stage 4** | **Project Scaffold, Database Schema & Authorization Foundations (`Phase 1`)** | **Planned (Not Started)** | Next.js initialization, 12-table Supabase SQL migrations, RLS policies, and `types/finance.ts` / `types/ai.ts`. |
| **Stage 5** | **Deterministic Financial Engine (`Phases 2–3`)** | **Planned (Not Started)** | Implementation of `lib/finance/` (`money.ts`, `cash.ts`, `cashflow.ts`, `obligations.ts`, `intelligence.ts`, `simulator.ts`, `reports.ts`, `notifications.ts`) verified against `manifest.json`. |
| **Stage 6** | **AI Context, Grounding Tools & Deterministic Fallback (`Phases 4–6`)** | **Planned (Not Started)** | Implementation of `lib/ai/` (`context-builder.ts`, `tools.ts`, `fallback-explainer.ts`, `provider.ts`, `guardrails.ts`, `orchestrator.ts`) and `POST /api/copilot/chat`. |
| **Stage 7** | **Core Ledger, CSV Import Pipeline & Dashboard UI (`Phase 7`)** | **Planned (Not Started)** | Auth/onboarding screens, 7-stage CSV import pipeline (`lib/csv/`), transactions/documents CRUD, and Dashboard UI. |
| **Stage 8** | **Customer/Supplier Intelligence, Risk Simulator & Printable Reports UI (`Phase 7`)** | **Planned (Not Started)** | Counterparty directory pages, interactive Risk Simulator (`/simulator`), Statistical & Risk Overview Reports (`/reports`), and Copilot UI drawer. |
| **Stage 9** | **Automated Verification, Security Review & Deployment (`Phases 8–9`)** | **Planned (Not Started)** | Full Vitest/Playwright test execution, cross-workspace RLS verification, edge-case hardening, and Vercel deployment. |

---

## 11. Documentation Guide

All specifications are organized in a single-source-of-truth hierarchy under [`docs/`](./docs/README.md):

* **Master Index:** [`docs/README.md`](./docs/README.md)
* **Product & Onboarding:**
  * [`docs/product/PRODUCT_SCOPE.md`](./docs/product/PRODUCT_SCOPE.md) — Product vision, target users, core features, and P0–P4 priorities.
  * [`docs/product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md`](./docs/product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md) — Multi-user workspaces, join codes, setup flow, and demo workspace isolation.
* **Architecture & Security:**
  * [`docs/architecture/TECH_STACK_AND_ARCHITECTURE.md`](./docs/architecture/TECH_STACK_AND_ARCHITECTURE.md) — Stack baseline, folder structure, and module boundaries.
  * [`docs/architecture/AI_SYSTEM_ARCHITECTURE.md`](./docs/architecture/AI_SYSTEM_ARCHITECTURE.md) — 8-module financial intelligence and AI Copilot architecture, boundaries, and guardrails.
  * [`docs/architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md`](./docs/architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md) — Row Level Security, server-side authorization, secret hygiene, and record integrity.
* **Financial Rules & Data Engineering:**
  * [`docs/financial/FINANCIAL_FOUNDATION_SPECIFICATION.md`](./docs/financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) — Authoritative accounting rules, available cash, receivables/payables, and opening-balance cutoffs.
  * [`docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md`](./docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) — Canonical 12-table PostgreSQL schema, 3 CSV formats, and synthetic business scenarios.
  * [`docs/data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md`](./docs/data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md) — 7-stage CSV import workflow, validation rules, and two-layer duplicate detection.
  * [`datasets/synthetic/README.md`](./datasets/synthetic/README.md) — Guide to the 50 generated synthetic dataset files, ground-truth figures, and validation scripts.
* **Feature Specifications:**
  * [`docs/features/RISK_SIMULATOR_SPECIFICATION.md`](./docs/features/RISK_SIMULATOR_SPECIFICATION.md) — 30/60/90-day baseline and stress projection formulas.
  * [`docs/features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md`](./docs/features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) — Payment delay math, sample-size rules ($N \ge 3$), and collection risk indicators.
  * [`docs/features/REPORTS_SPECIFICATION.md`](./docs/features/REPORTS_SPECIFICATION.md) — Weekly, Monthly, Yearly (FY Apr–Mar), Customer, and Supplier reports + print-to-PDF rules.
  * [`docs/features/AI_COPILOT_SPECIFICATION.md`](./docs/features/AI_COPILOT_SPECIFICATION.md) — Read-only Copilot grounding, deterministic tools, and fallback architecture.
  * [`docs/features/NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md`](./docs/features/NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md) — In-app operational alerts, deduplication keys, and auto-resolution.
* **Design, Quality, Operations & Roadmap:**
  * [`docs/design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md`](./docs/design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md) — Sitemap, page wireframes, theme system (`Light`/`Dark`/`System`), and financial microcopy.
  * [`docs/quality/TESTING_AND_DEFINITION_OF_DONE.md`](./docs/quality/TESTING_AND_DEFINITION_OF_DONE.md) — Unit, integration, security, and E2E test suites and 10-point Definition of Done.
  * [`docs/operations/DEPLOYMENT_AND_ENVIRONMENT_READINESS.md`](./docs/operations/DEPLOYMENT_AND_ENVIRONMENT_READINESS.md) — `.env.example` contract, Supabase migration workflow, and Vercel deployment checklist.
  * [`docs/project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md`](./docs/project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md) — Finalized MVP decisions, 12 cross-feature consistency invariants, and deferred scope.
  * [`docs/project/AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md`](./docs/project/AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md) — 9-phase implementation plan and 35 atomic tasks (`TASK-1.1` to `TASK-9.4`).

---

## 12. Testing and Quality Principles

### Currently Implemented Verification (Synthetic Datasets)
You can run the existing synthetic dataset generator and 15-check programmatic validator today using Node.js (requires zero external `npm` packages):

```bash
# 1. Deterministically regenerate all 50 synthetic dataset files and manifest.json
node datasets/synthetic/scripts/generate_datasets.mjs

# 2. Run the 15-check programmatic verification suite against the generated files
node datasets/synthetic/scripts/validate_datasets.mjs
```

### Planned Application Testing Strategy
As defined in [`docs/quality/TESTING_AND_DEFINITION_OF_DONE.md`](./docs/quality/TESTING_AND_DEFINITION_OF_DONE.md), application implementation will be gated by:
* **Financial Engine Unit Tests (`FIN-T01..T09`, `INT-T01..T06`, `SIM-T01..T06`, `REP-T01..T04`):** Verifying that `lib/finance/` produces exact paise-level parity with `datasets/synthetic/manifest.json` across all four synthetic business profiles.
* **CSV Import & Deduplication Tests (`CSV-T01..T08`):** Testing valid imports (`csv_import/`) and ensuring all 8 malformed/edge-case files (`edge_cases/fixture_01` through `fixture_08`) produce the exact expected validation errors in `expected_validation_outcomes.json`.
* **AI Grounding & Fallback Tests (`AI-T01..T10`):** Verifying numerical grounding, rejection of fabricated currency figures or invoice IDs, prompt-injection refusal, and automatic fallback to `lib/ai/fallback-explainer.ts` when no API key is present.
* **Security & Workspace Isolation Tests (`SEC-T01..T04`):** Confirming that cross-workspace queries are rejected with `403` and server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `AI_API_KEY`) never leak into client bundles.

---

## 13. Current Limitations and Project Status Summary

* **No Application Code Yet:** There is currently no running web interface, backend API server, or initialized database in this repository.
* **Focused MVP Scope:** When implemented, the MVP will deliberately exclude live banking integrations, automated bank reconciliation, full double-entry accounting/GST tax filing, inventory management, machine-learning credit scoring, and autonomous AI write actions.
* **Next Step:** Begin **Phase 1 (`TASK-1.1` – `TASK-1.4`)** of [`docs/project/AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md`](./docs/project/AI_AND_INTELLIGENCE_IMPLEMENTATION_ROADMAP.md) to initialize the Next.js + TypeScript + Vitest scaffold, author the 12-table Supabase SQL migrations and RLS policies, and implement the deterministic financial engine in `lib/finance/`.
