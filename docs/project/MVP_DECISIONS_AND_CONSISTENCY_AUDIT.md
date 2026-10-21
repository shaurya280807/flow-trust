# FlowTrust — Master MVP Decision Finalization and Cross-Feature Consistency Audit

**Status:** Approved Authoritative Decision Log & Audit (v2.0 — Supersedes Obsolete Oct 19 Pre-Scope Audit)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Authoritative Scope:** Repository State Audit, Summary of Finalized MVP Decisions Across All Features, Cross-Feature Financial Consistency Checklist, Documented Assumptions, Remaining Unresolved Decisions, and Deferred Post-MVP Backlog  
**Related Specifications:** [Master Documentation Index](../README.md) · [PRODUCT_SCOPE.md](../product/PRODUCT_SCOPE.md) · [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md)

> **Historical Note on Superseded Pre-Scope Files:** The initial pre-scope files `docs/audit-report.md` and `docs/open-questions.md` (created on 19 October 2026 for an early Python 3.14 / FastAPI / SQLite 8-hour hackathon concept) were completely superseded by the approved Next.js + TypeScript + Supabase PostgreSQL architecture and product specifications established on 22 October 2026. Those obsolete files have been removed and replaced by this authoritative document so outdated Python/SQLite notes can never conflict with current specifications.

---

## 1. Repository Audit & Epistemic Classification

### 1.1 Current Repository State
An inspection of the workspace (`c:\Users\SHAURYA GUPTA\Documents\projects\flowtrust`) confirms:
* **Application Source Code:** None exists yet (`0` `.ts`/`.tsx` files, no `package.json`, no database migrations).
* **CSV Datasets:** None exist in the repository yet (`0` `.csv` files). Per Section 22 of the engineering plan, the complete dataset strategy, canonical data model, CSV format specifications, and synthetic business profiles have been defined from scratch in [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md), ready for deterministic synthetic CSV generation in the next phase.
* **Documentation:** Organized into a single-source-of-truth hierarchy under `docs/` (indexed in [docs/README.md](../README.md)).

### 1.2 Distinction Between Decision Categories
Throughout the FlowTrust documentation set, items are strictly distinguished as:
1. **Confirmed Product & Foundational Decisions (Preserved Intact):**
   * Area A: Multi-user business workspaces, join-code onboarding, shared member access in v1, optional CSV import vs. skip setup, manual entry, and synthetic demo workspace isolation ([WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](../product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md)).
   * Area B: Financial foundation separating cash movements (`transactions`) from obligations (`invoices`, `bills`), bank + physical cash definition of `Available Cash`, partial payment support, opening-balance double-counting prevention, and deterministic `lib/finance/` calculations ([FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md)).
2. **Finalized MVP Technical & Feature Decisions (Completed in This Task):**
   * Summarized in Section 2 below and specified across `docs/data/`, `docs/features/`, `docs/architecture/`, `docs/quality/`, and `docs/operations/`.
3. **Existing Implementation in Repository:**
   * None yet (documentation and specification phase complete; ready for Phase P0 implementation).
4. **Remaining Unresolved Product/Visual Calibrations:**
   * Listed explicitly in Section 4 below with safe MVP defaults so implementation is not blocked.
5. **Deferred Post-MVP Features:**
   * Listed in Section 5 below.

---

## 2. Summary of Finalized MVP Decisions

| Domain | Finalized MVP Decision | Authoritative Document |
|---|---|---|
| **Monetary Storage & Precision** | `NUMERIC(14,2)` in PostgreSQL; integer minor-unit (`paise`) arithmetic in `lib/finance/`; default workspace currency `INR (₹)` with `en-IN` formatting. | [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) §14.1 |
| **Opening Balance & Cutoff Date** | Stored as `opening_cash_balance` + `opening_balance_date` on `businesses`. Transactions with `transaction_date <= opening_balance_date` are tagged `is_pre_opening_cutoff = true` (preserved for historical analytics/reports, excluded from post-opening `Available Cash`). | [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) §14.2 |
| **Canonical Data Model** | 12 RLS-protected PostgreSQL tables (`businesses`, `business_memberships`, `categories`, `customers`, `suppliers`, `invoices`, `bills`, `transactions`, `payments`, `import_batches`, `saved_scenarios`, `notifications`). | [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) §2 |
| **Supported CSV Formats** | 3 official MVP formats: **Format 1** (`flowtrust_transactions.csv` unified cash ledger), **Format 2** (`bank_statement_export.csv` split Debit/Credit via flexible column mapping), and **Format 3** (`flowtrust_documents.csv` invoices, bills & payment settlements). | [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) §3 |
| **CSV Import Pipeline & Limits** | 7-stage pipeline (`Upload -> Column Mapping -> Validation -> Preview -> Duplicate Review -> Confirm -> Import Summary`); single file per batch, max `5 MB` / `10,000 rows`, atomic PostgreSQL transaction on confirm, partial import of valid rows permitted. | [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md) §2 |
| **CSV Duplicate Detection** | Two-layer deterministic detection: **Layer 1 (`CONFIRMED_DUPLICATE`)** via file SHA-256 or external `reference_id`/`document_number`; **Layer 2 (`POSSIBLE_DUPLICATE`)** via SHA-256 fingerprint of `(business_id, date, direction, amount_paise, normalized_description)`. Same date + amount with *different* description defaults to `Import` with a low-confidence notice. | [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md) §2.5 |
| **Risk Simulator Horizon & Baseline** | Default horizon **`30 days`**, selectable **`30 / 60 / 90 days`**, computed at **daily granularity (`d = 0..H`)**. Hybrid baseline combines scheduled open `invoices`/`bills` with trailing non-document operating run-rate (`DIRECT_INCOME` / `DIRECT_EXPENSE`, requiring $\ge 14\text{ days}$ history and $\ge 3$ txns). | [RISK_SIMULATOR_SPECIFICATION.md](../features/RISK_SIMULATOR_SPECIFICATION.md) §3–4 |
| **Risk Simulator Scenario Rules** | **Revenue Decline (`0–50%` slider / `0–100%` input)** scales projected unbilled inflows; **Customer Payment Delay (`0–60d` slider / `0–180d` input)** shifts scheduled invoice receipt dates forward (pushing items with $d_{\text{base}} + \Delta > H$ into `Receivables Shifted Beyond Horizon`); **Unexpected Expense** deducts a one-time outflow on `unexpectedExpenseDay` (default `Day 1`); **Proposed Investment** deducts initial + 30d recurring cost (keeping optional estimated benefit excluded from guaranteed cash by default). | [RISK_SIMULATOR_SPECIFICATION.md](../features/RISK_SIMULATOR_SPECIFICATION.md) §5–8 |
| **Customer Payment-Delay Formula** | Computed **exclusively from `PAID` non-cancelled invoices with non-null `due_date`**. Single-payment delay $= \text{payment\_date} - \text{due\_date}$; multi-payment invoice delay uses **amount-weighted average delay** and counts as **1 invoice** in $N_{\text{eligible}}$. Open/overdue invoices are excluded from historical delay averages. | [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) §3 |
| **On-Time Rate & Sample Sufficiency** | Completed invoice is On-Time iff $\max(\text{payment\_date}) \le \text{due\_date}$. Requires **$N_{\text{eligible}} \ge 3$ completed invoices** to display statistical summary rates (`On-Time Rate %`, `Average Delay`, `Median Delay`). Requires **$N_{\text{eligible}} \ge 6$** for Recent-3 vs. Prior median trend comparison. Formal OLS regression is deferred. | [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) §4, §6 |
| **Customer Risk Indicator** | Transparent 4-state rule matrix (**`Elevated Overdue Exposure`**, **`Watch — Payment Delays`**, **`Regular Payer`**, **`Insufficient Data`**) paired with a mandatory factual explanation string. No black-box 0–100 credit score. | [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) §5 |
| **Supplier Intelligence & Due-Soon Window** | Strictly tracks financial obligations (`Billed`, `Paid`, `Outstanding`, `Overdue`, **`Bills Due Soon` = next `7 calendar days`**, plus `8–30 days` planning bucket and `Our Payment Timing`). Zero claims about supplier delivery or product quality. | [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) §7 |
| **Reports & Print/PDF** | 5 categories (`Weekly Mon–Sun`, `Monthly 1st–Last`, `Yearly FY Apr 1–Mar 31`, `Individual Customer`, `Individual Supplier`), each supporting **`Statistical Report`** (factual only) and **`Risk Overview Report`** (facts + Section 6 Financial Risk Assessment). Export via browser `Print -> Save as PDF` with `@media print` light-ink overrides. | [REPORTS_SPECIFICATION.md](../features/REPORTS_SPECIFICATION.md) §2–5 |
| **AI Copilot MVP** | Read-only assistant grounded in `WorkspaceFinancialContextSnapshot` and deterministic `lib/finance/` tools (`runRiskSimulation`, `getPeriodFinancialReport`, etc.) via a server-side provider adapter (Gemini default + deterministic template fallback). No vector DB / RAG overkill. | [AI_COPILOT_SPECIFICATION.md](../features/AI_COPILOT_SPECIFICATION.md) §1–5 |
| **Notifications & Reminders** | In-app workspace Notification Center only (`OVERDUE_INVOICE`, `BILL_DUE_SOON` [7d], `CASH_COVERAGE_WARNING`, `IMPORT_SUMMARY`), deduplicated by `condition_key` with auto-resolution when documents are paid/cancelled. | [NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md](../features/NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md) §1–3 |

---

## 3. Cross-Feature Consistency Verification Checklist

The table below verifies that all 12 FlowTrust specifications adhere to identical financial and operational invariants with zero contradictions:

| # | Cross-Feature Invariant | Verified Across Specifications | Resolution / Enforcement Mechanism |
|---|---|---|---|
| **1** | **A payment is never counted twice as available cash.** | Financial Foundation · CSV Import · Transactions · Invoices/Bills · Dashboard · Reports | Recording an `INVOICE_PAYMENT` creates one `transactions` row linked 1:1 to a `payments` allocation row. In CSV imports, cross-file matching on `payment_reference` / `document_number` links Format 1 and Format 3 records to the same single transaction. |
| **2** | **An unpaid invoice or bill is never treated as cash already received or paid.** | Financial Foundation · Dashboard · Customer/Supplier Profiles · Risk Simulator · Reports · Copilot | `invoices` and `bills` update `Total Receivables` and `Total Payables` only. `Available Cash`, `Cash Inflows`, `Cash Outflows`, and `Net Cash Flow` query settled `transactions` exclusively. |
| **3** | **Partial payments update outstanding balances and statuses deterministically.** | Financial Foundation · Canonical Data Model · Customer/Supplier Intelligence · Risk Simulator · Reports | `outstanding_amount = total_amount - sum(active_payments)`. Status transitions automatically (`UNPAID` $\rightarrow$ `PARTIALLY_PAID` $\rightarrow$ `PAID`). Risk Simulator shifts only the remaining `outstanding_amount`. |
| **4** | **Opening balances and historical transactions cannot be double-counted.** | Financial Foundation · CSV Import · Dashboard · Reports · Risk Simulator | `Available Cash` sums `opening_cash_balance` + transactions with `transaction_date > opening_balance_date` (`is_pre_opening_cutoff = false`). `"Opening Balance B/F"` rows in bank CSVs are tagged `OPENING_BALANCE_MARKER` and excluded from inflows. |
| **5** | **A delayed payment or expense in the Risk Simulator never modifies real records.** | Financial Foundation · Risk Simulator · Reports · AI Copilot · Notifications | `lib/finance/simulator.ts` is a pure read-only function. `saved_scenarios` stores parameter JSON in a separate table and never writes to `transactions`, `invoices`, `bills`, or `payments`, nor triggers workspace notifications. |
| **6** | **Dashboard, Customer/Supplier Profiles, Reports, and AI Copilot use identical metric definitions.** | Financial Foundation · Customer/Supplier Intelligence · Reports · AI Copilot · Testing Spec | All four surfaces invoke the same exported functions in `lib/finance/` (`cash.ts`, `cashflow.ts`, `obligations.ts`, `intelligence.ts`, `reports.ts`). Verified by parity tests `REP-T01` and `REP-T02`. |
| **7** | **An overdue unpaid invoice is never mixed into completed historical payment-delay averages or counted as an on-time payment.** | Customer/Supplier Intelligence · Reports · AI Copilot · Testing Spec | Completed-payment metrics (`Average Delay`, `Median Delay`, `On-Time Rate`) filter strictly for `status = 'PAID' AND due_date IS NOT NULL`. Open overdue invoices are reported separately under `Overdue Receivables` and trigger the `Customer Collection Indicator`. |
| **8** | **Statistical Reports never contain risk ratings, labels, or recommendations.** | Product Scope · Reports Spec · UI/UX Spec · Testing Spec | Section 6 (`Financial Risk Assessment & Suggested Next Steps`) and customer risk badges are rendered exclusively when `reportMode === 'RISK_OVERVIEW'` (verified by `REP-T04`). |
| **9** | **Saved scenarios calculated on older data are never silently presented as current.** | Risk Simulator Spec · UI/UX Spec · Testing Spec | `saved_scenarios` records `source_data_as_of`. Reopening compares `source_data_as_of` with the latest workspace record timestamp and displays a staleness banner with a one-click live recalculation toggle. |
| **10** | **Archiving a customer or supplier never erases linked historical financial records.** | Customer/Supplier Spec · Security & Data Integrity Spec · Reports Spec | Foreign keys on `invoices`, `bills`, and `transactions` use `ON DELETE RESTRICT`. Entities with history use `status = 'ARCHIVED'`, preserving 100% of historical balances and reports. |
| **11** | **Notifications never imply that a hypothetical or estimated event has actually occurred.** | Notifications Spec · Risk Simulator Spec · UI/UX Spec | Notifications trigger exclusively from actual overdue invoices, actual bills due within 7 days, actual cash vs. 7-day bill coverage, and actual CSV import completions. |
| **12** | **Workspace isolation is enforced on the server and database for every feature.** | Workspace Spec · Security Spec · AI Copilot Spec · Reports Spec · Testing Spec | Every route/action verifies `business_memberships` on the server and queries through PostgreSQL RLS (`public.is_business_member(business_id)`). |

---

## 4. Documented Assumptions & Remaining Unresolved Items

Per Section 17 of the task instructions, every technical decision required to unblock MVP engineering has been finalized with a conservative, evidence-backed default. Only the following two non-blocking items await optional user input:

| Item ID | Question / Calibration Item | Why It Cannot Be Verified From Repo Alone | Does It Block Implementation? | Active Conservative Default Established in Docs |
|---|---|---|---|---|
| **`OPEN-01`** | **Visual Reference Screenshots (Khatabook Layout Calibration)** | The visual design prompt referenced attached Khatabook screenshots for calibrating exact card density, spacing, and ledger row alignment, which have not yet been uploaded into the workspace. | **No** (Backend, database, `lib/finance/`, CSV parser, and adaptable shadcn/ui page layouts can proceed immediately). | [UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md](../design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md) defines adaptable, high-readability ledger tables, compact summary strips, soft off-white light mode, and 3-mode theming (`Light`/`Dark`/`System`) ready for visual token tuning whenever screenshots are shared. |
| **`OPEN-02`** | **External AI Provider API Key Provisioning (`AI_API_KEY`)** | Providing a live Google Gemini or OpenAI API key requires the developer's private external account credentials at `.env.local` / Vercel setup time. | **No** (`lib/ai/` is designed with a replaceable provider adapter + built-in `deterministic_fallback` mode). | Default provider adapter is configured for Google Gemini (`gemini-2.5-flash`) via server-side `AI_API_KEY`, and automatically falls back to deterministic template explanations when no key is present. |

---

## 5. Consolidated Deferred Features (Post-MVP Future Scope)

To protect MVP delivery quality and prevent scope creep, the following capabilities are explicitly deferred across all specifications:
1. **Role-Based Access Hierarchy & Invitations:** Separate `Owner`, `Admin`, `Accountant`, and `Viewer` permissions, granular per-action ACLs, and email invitation links.
2. **External Banking & Accounting Integrations:** Live bank feeds (Account Aggregator / Plaid), automated bank reconciliation, and native Tally XML / Zoho Books connectors.
3. **Advanced Accounting Sub-Systems:** Double-entry chart of accounts, journal vouchers, inventory/stock management, multi-currency FX conversion, credit notes/refund splits, and GST tax-return computation.
4. **Statistical & Predictive Modelling:** Formal OLS/multivariate regression on payment delays, machine-learning credit scoring, default-probability calibration, and Monte Carlo simulations.
5. **Supplier Operational Ratings:** Supplier delivery speed, defect rate, or operational reliability scoring (deferred until operational evidence is collected).
6. **External Notification & Report Delivery Channels:** Email/SMS/WhatsApp payment reminders, Web Push notifications, scheduled background report cron jobs, and dedicated headless-browser PDF microservices.
7. **Autonomous AI Write Actions & Vector RAG:** AI-initiated ledger modifications and vector-database embedding pipelines.

