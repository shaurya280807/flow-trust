# FlowTrust — Testing Strategy and Definition of Done

**Status:** Approved Authoritative MVP Specification (v1.0)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Authoritative Scope:** Automated Testing Architecture, Financial Calculation Test Suite, CSV Import Test Suite, Risk Simulator Test Suite, Analytics & Reports Test Suite, Security & Isolation Test Suite, and Feature-by-Feature Definition of Done  
**Related Specifications:** [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) · [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md) · [RISK_SIMULATOR_SPECIFICATION.md](../features/RISK_SIMULATOR_SPECIFICATION.md) · [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) · [REPORTS_SPECIFICATION.md](../features/REPORTS_SPECIFICATION.md) · [SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md](../architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md)

---

## 1. Testing Philosophy and Architecture

In a business financial intelligence platform, **a feature is never complete merely because its UI renders**. Every calculation, import rule, scenario projection, report summary, and workspace boundary must be deterministically verified.

### 1.1 Three-Tier Test Pyramid
1. **Tier 1 — Deterministic Unit Tests (Vitest — Fast, Zero-Network):**
   * Targets: `lib/finance/*`, `lib/csv/*`, `lib/validations/*`, and `lib/ai/fallback-explainer.ts`.
   * Requirement: `100%` of core financial formulas, rounding rules, payment-delay calculations, Risk Simulator transformations, and CSV validation/deduplication rules must be covered by fast, pure-function unit tests.
2. **Tier 2 — Server Integration & Security Tests (Vitest + Database / RLS Test Harness):**
   * Targets: Workspace isolation (`verifyWorkspaceMembership` + PostgreSQL RLS), atomic CSV batch persistence & rollback, payment-to-invoice allocation integrity, and report/dashboard calculation parity.
3. **Tier 3 — End-to-End User Workflow Tests (Playwright):**
   * Targets: Auth & workspace creation/joining via join code, 7-stage CSV import flow, manual record & partial payment entry, Risk Simulator slider interaction & scenario saving, and Report switching (`Statistical` vs `Risk Overview`) + print layout readiness.

---

## 2. Financial Calculation Test Suite (`tests/unit/finance/`)

All tests below verify the authoritative modules in `lib/finance/` against [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md):

| Test ID | Calculation Area | Input Condition | Expected Deterministic Outcome |
|---|---|---|---|
| `FIN-T01` | **Available Cash Definition** | `opening_cash_balance = ₹1,00,000` (`2026-04-30`); post-opening Bank inflow `+₹50,000`, Physical Cash inflow `+₹10,000`, Bank outflow `-₹25,000`, plus an unpaid invoice of `₹40,000` and an unpaid bill of `₹15,000`. | `Available Cash === ₹1,35,000.00`. Unpaid invoice (`₹40,000`) and unpaid bill (`₹15,000`) have **zero** effect on Available Cash. |
| `FIN-T02` | **Opening Balance & Pre-Cutoff Safeguard** | `opening_cash_balance = ₹2,00,000` as of `2026-04-30`; historical transaction `-₹30,000` on `2026-04-15` (`is_pre_opening_cutoff = true`); post-cutoff transaction `+₹45,000` on `2026-05-02`. | `Available Cash` as of `2026-05-02` is **`₹2,45,000.00`** (pre-cutoff transaction on `2026-04-15` is never subtracted a second time). |
| `FIN-T03` | **Cash Inflows, Outflows & Net Cash Flow** | Period `[2026-10-01, 2026-10-31]` with `DIRECT_INCOME = ₹80,000`, `INVOICE_PAYMENT = ₹40,000`, `DIRECT_EXPENSE = ₹55,000`, `BILL_PAYMENT = ₹20,000`, plus an `INTERNAL_TRANSFER` of `₹10,000` and `OPENING_BALANCE_MARKER` of `₹3,00,000`. | `Cash Inflows === ₹1,20,000.00`, `Cash Outflows === ₹75,000.00`, `Net Cash Flow === +₹45,000.00`. Transfers and opening markers are excluded from inflows/outflows. |
| `FIN-T04` | **Invoice & Payment Single-Counting** | Issue invoice `INV-01` for `₹50,000` on `2026-10-05`; record payment of `₹50,000` against `INV-01` on `2026-10-18`. | On `2026-10-05`: `Cash Inflows = ₹0`, `Outstanding Receivables = ₹50,000`. On `2026-10-18`: `Cash Inflows = ₹50,000` (counted once via the payment transaction), `Outstanding Receivables = ₹0`, `INV-01.status = 'PAID'`. |
| `FIN-T05` | **Partial Payments & Remaining Balance** | Invoice `INV-02` for `₹50,000` due `2026-10-15`; partial payment 1 of `₹20,000` on `2026-10-10`; partial payment 2 of `₹12,000` on `2026-10-12`. Evaluated on `2026-10-20`. | `amount_paid === ₹32,000.00`, `outstanding_amount === ₹18,000.00`, `status === 'PARTIALLY_PAID'`, `is_overdue === true`, `days_overdue === 5`. |
| `FIN-T06` | **Overpayment Rejection** | Attempt to allocate a `₹25,000` payment against an invoice with `outstanding_amount = ₹18,000`. | Rejected by validation (`ALLOCATION_EXCEEDS_OUTSTANDING_BALANCE`); zero database changes. |
| `FIN-T07` | **Cancelled Documents** | Cancel unpaid invoice `INV-03` (`₹35,000`) and unpaid bill `BILL-03` (`₹12,000`). | Both set to `status = 'CANCELLED'`; excluded from `Total Outstanding Receivables`, `Overdue Receivables`, `Total Outstanding Payables`, and Risk Simulator schedules. |
| `FIN-T08` | **Missing Due Dates on Documents** | Open invoice `INV-04` (`₹22,000`, `due_date = NULL`). | Included in `Total Outstanding Receivables (₹22,000)`; `is_overdue === false`; flagged in `missingDueDateReceivables`. |
| `FIN-T09` | **Exact Paise / Decimal Arithmetic** | Sum 3 transactions: `₹10,000.10`, `₹20,000.20`, and `₹5,000.30`. | Exact result `₹35,000.60` (no floating-point `.6000000000000014` artifacts). |
| `FIN-T10` | **Period Boundary Precision** | Transactions on `2026-03-31`, `2026-04-01`, `2026-09-30`, `2026-10-01`. | `2026-03-31` belongs to `FY 2025–26` / `March 2026`; `2026-04-01` belongs to `FY 2026–27` / `April 2026`. |

---

## 3. CSV Import Test Suite (`tests/unit/csv/` & `tests/integration/csv/`)

Covers all 12 test cases (`CSV-T01` through `CSV-T12`) specified in [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md) §5, verifying:
* Valid ingestion of Format 1 (Unified Transactions), Format 2 (Bank Statement Debit/Credit), and Format 3 (Invoices & Bills).
* Rejection of empty files, header-only files, binary files, missing required mappings, invalid dates (`2026-02-30`), ambiguous dates (`03/04/2026` without convention confirmation), malformed amounts, and conflicting debit/credit rows.
* Two-layer duplicate detection: `CONFIRMED_DUPLICATE` (SHA-256 file match or `external_reference` / `document_number` match) vs. `POSSIBLE_DUPLICATE` (same date + direction + amount + normalized description) vs. legitimate `SAME_DATE_AMOUNT_DIFFERENT_DESC` (imported by default with review notice).
* Opening-balance cutoff protection (`is_pre_opening_cutoff = true` for `transaction_date <= opening_balance_date`).
* Cancellation before Stage 6 writing zero records, and atomic PostgreSQL rollback on mid-batch database errors.

---

## 4. Risk Simulator Test Suite (`tests/unit/simulator/`)

Covers all 16 deterministic test cases (`SIM-T01` through `SIM-T16`) specified in [RISK_SIMULATOR_SPECIFICATION.md](../features/RISK_SIMULATOR_SPECIFICATION.md) §11, verifying:
* Identity between Scenario and Baseline when all sliders are at default (`0`).
* Independent and combined effects of Revenue Decline (`0–100%`), Customer Payment Delay (`0–180d`), Unexpected Expense (`₹0+`), and Proposed Investment (initial cost + recurring cost + optional unverified benefit toggle).
* Accurate calculation of `Receivables Shifted Beyond Horizon` when `d_base + customerDelayDays > H`.
* Accurate detection of `Minimum Projected Cash`, `Projected Cash Shortfall`, and `firstShortfallDate` when cash dips below `₹0` mid-horizon.
* Proper handling of partially paid invoices, overdue invoices (`1–90d` vs `>90d`), missing due dates, and `<14 days` historical transaction coverage.
* Staleness detection when reopening a `saved_scenario` after workspace records have changed.
* Strict immutability (`Object.freeze` assertion confirming zero mutation of real financial records).

---

## 5. Customer/Supplier Intelligence & Reports Test Suite (`tests/unit/intelligence/` & `tests/unit/reports/`)

| Test ID | Feature Area | Input Condition | Expected Deterministic Outcome |
|---|---|---|---|
| `INT-T01` | **Completed Invoice Delay (Single & Early/Late)** | Customer has 3 `PAID` invoices: `INV-1` (due `10th`, paid `7th` $\rightarrow -3\text{d}$), `INV-2` (due `10th`, paid `10th` $\rightarrow 0\text{d}$), `INV-3` (due `10th`, paid `19th` $\rightarrow +9\text{d}$). | `N_eligible === 3`; `Average Delay === +2.0 days`; `Median Delay === 0.0 days`; `On-Time Payment Rate === 66.7%` (2 of 3 paid on or before due date). |
| `INT-T02` | **Multi-Payment Weighted Invoice Delay** | `INV-4` (`₹1,00,000` total, due `2026-10-10`) paid in two instalments: `₹40,000` on `2026-10-10` ($0\text{d}$) and `₹60,000` on `2026-10-20` ($+10\text{d}$). | Counted as **1** completed invoice (`N_eligible += 1`); weighted delay $= (0.4 \times 0) + (0.6 \times 10) = +6.0\text{ days}$; final settlement date $= \text{2026-10-20} > \text{due\_date}$ (counted as late for On-Time Rate). |
| `INT-T03` | **Exclusion of Unpaid & Partially Paid Invoices from Historical Delay** | Customer has 3 `PAID` invoices (all paid on time, `0d` delay) plus 1 `UNPAID` invoice currently `45 days overdue`. | Historical `On-Time Rate === 100.0% (n = 3)` and `Median Delay === 0.0 days`. Current `Overdue Receivable` shows the 45-day overdue invoice, and Customer Risk Indicator triggers **`Elevated Overdue Exposure`** due to `max_days_overdue > 30`. |
| `INT-T04` | **Sample-Size Threshold ($N_{\text{eligible}} < 3$)** | Customer A has $N_{\text{eligible}} = 2$ completed invoices and `₹0` overdue. | Does not display summary average/median/on-time KPI cards; displays raw count `"2 completed invoices"` and **`Insufficient Data`** indicator. |
| `INT-T05` | **Supplier Payment Planning & Due-Soon Window** | Supplier has 1 overdue bill (`₹20,000`), 2 bills due in 5 days (`₹35,000`), and 1 bill due in 20 days (`₹50,000`). | `Outstanding Payable === ₹1,05,000`, `Overdue Payable === ₹20,000`, `Bills Due Soon (7d) === ₹35,000 (2 bills)`. Zero supplier quality/delivery ratings rendered. |
| `INT-T06` | **Archiving Entity Integrity** | Attempt hard delete on Customer with 1 invoice $\rightarrow$ blocked; archive Customer $\rightarrow$ succeeds. | Archived customer's invoice remains in workspace receivables and reports; customer hidden from active new-invoice dropdown. |
| `REP-T01` | **Dashboard ↔ Report Metric Parity** | Compare Dashboard metrics for `October 2026` against Monthly Report (`October 2026`). | `Available Cash`, `Inflows`, `Outflows`, `Net Cash Flow`, `Receivables`, and `Payables` are identical to `₹0.00`. |
| `REP-T02` | **Statistical vs. Risk Overview Separation** | Generate Weekly, Monthly, Yearly, Customer, and Supplier reports in `Statistical` mode vs. `Risk Overview` mode. | `Statistical` mode contains zero risk assessment sections or recommendations; `Risk Overview` mode includes Section 6 without altering factual figures in Sections 1–5. |
| `REP-T03` | **Indian Financial Year & Partial Coverage** | Workspace has data from `May 2026 – Oct 2026`; generate `FY 2026–27` (`1 Apr 2026 – 31 Mar 2027`) report. | Displays `Partial Period Coverage (6 of 12 months)` banner; Apr 2026 and Nov 2026–Mar 2027 rows show `No records` (not `₹0`). |

---

## 6. Security and Isolation Test Suite (`tests/integration/security/`)

| Test ID | Security Control Tested | Attack / Test Vector | Expected Outcome |
|---|---|---|---|
| `SEC-T01` | **Cross-Workspace Read Isolation** | User A (member of Business 1 only) requests Dashboard, Transactions, Invoices, Customers, Suppliers, or Reports with `businessId = Business 2`. | Server guard and PostgreSQL RLS reject with HTTP `403 Forbidden` / empty result set; zero records from Business 2 leaked. |
| `SEC-T02` | **Cross-Workspace Write / IDOR Prevention** | User A submits a payment, invoice edit, or archive action passing `businessId = Business 1` but targeting `invoiceId` belonging to `Business 2`. | Rejected with `403`/`404`; `Business 2`'s invoice remains untouched. |
| `SEC-T03` | **Cross-Workspace Saved Scenario Isolation** | User A attempts to read, rerun, or delete a `saved_scenario` UUID belonging to `Business 2`. | Rejected with `403`/`404`. |
| `SEC-T04` | **AI Copilot Context Isolation** | User A sends a Copilot prompt asking for `Business 2`'s cash balance or passing `businessId = Business 2`. | Request rejected with `403`; when querying within `Business 1`, the assembled context snapshot contains exclusively `Business 1` records. |
| `SEC-T05` | **CSV Import Authorization** | User A attempts to commit a CSV import batch into `Business 2` or read `Business 2`'s `import_batches`. | Rejected with `403`. |
| `SEC-T06` | **Invalid / Regenerated Join Code Rejection** | User B attempts to join `Business 1` using a random invalid code or a previously regenerated (old) join code. | Rejected with generic `"Invalid join code"` error (`400`); no membership created; no business name leaked. |
| `SEC-T07` | **Client Bundle Secret Audit** | Inspect compiled Next.js `.next/static/` client bundles for `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `AI_API_KEY`. | Zero matches found in client-side JavaScript bundles. |

---

## 7. Feature-by-Feature Definition of Done (MVP Release Gate)

Every major MVP feature must satisfy all ten checklist pillars before being marked **Done**:

### 7.1 Universal 10-Point Completion Checklist (Applies to Every Feature)
- [ ] **1. Functional Behaviour:** End-to-end user workflow operates against the real Supabase PostgreSQL database (no hardcoded mock arrays in UI components).
- [ ] **2. Financial Correctness:** Uses centralized `lib/finance/` functions; zero double-counting between opening balances, transactions, invoices, bills, and payments.
- [ ] **3. Input Validation:** Shared Zod schemas enforce client and server validation with clear field-level messages.
- [ ] **4. Error Handling:** Database, network, and validation failures return actionable user messages without stack traces or partial data corruption.
- [ ] **5. Loading, Empty & Insufficient-Data States:** Displays calm skeleton/loading states, helpful zero-data guidance, and explicit `Insufficient data` badges when sample sizes are below threshold.
- [ ] **6. Workspace Access Control:** Server-side membership verification (`verifyWorkspaceMembership`) and PostgreSQL RLS policies enforced on every read and write.
- [ ] **7. Theme & Responsive Usability:** Renders cleanly in `Light`, `Dark`, and `System` modes across desktop (`1280px+`), tablet (`768px`), and mobile (`375px`) viewports, respecting `prefers-reduced-motion`.
- [ ] **8. Automated Tests:** All assigned unit, integration, and security test cases pass in CI/local test runs.
- [ ] **9. Documentation Sync:** Matches the authoritative specification in `docs/` with zero undocumented overrides.
- [ ] **10. Zero Fabricated Data:** Never invents missing dates, fake transactions, unverified risk scores, or artificial notifications.

