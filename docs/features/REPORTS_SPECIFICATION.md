# FlowTrust — Reports and Printable Business Intelligence Specification

**Status:** Approved Authoritative MVP Specification (v2.0 — Preserved Core Scope + Finalized Period Boundaries, Section Matrix, Completeness Rules & Print/PDF Specification)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Reporting Year Convention:** Indian Financial Year (**1 April – 31 March**)  
**Initial Export Method:** Browser Print $\rightarrow$ Save as PDF (`window.print()` with `@media print` CSS)  
**Related Specifications:** [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) · [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](./CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) · [RISK_SIMULATOR_SPECIFICATION.md](./RISK_SIMULATOR_SPECIFICATION.md) · [UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md](../design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md)

---

## 1. Purpose and Core Principles (Preserved)

FlowTrust Reports provides a clear, evidence-based overview of a business's financial activity, performance, and financial risks over a selected period.

Every report category must be available in **two distinct report types**:

1. **Statistical Report** — presents factual financial figures, tables, breakdowns, and descriptive statistics **without** risk scores, risk labels, subjective risk assessments, or risk-management recommendations.
2. **Risk Overview Report** — presents the relevant factual statistics along with a clearly separated **Financial Risk Assessment** section containing evidence-based risk observations, cash-flow pressure indicators, receivables/payables exposure, cash-buffer considerations, and practical, proportionate next steps.

### Core Principles
* **Accuracy first:** Reuse validated FlowTrust records and centralized `lib/finance/` calculations.
* **Separate facts from interpretation:** Clearly distinguish recorded actuals, descriptive analytics, estimates, and hypothetical scenarios.
* **No fabricated completeness:** If data covers only part of a selected period, disclose the actual coverage range and active record days.
* **No unsupported conclusions:** Never present limited or incomplete data as a reliable trend, prediction, or risk conclusion.
* **Business workspace isolation & server-side authorization:** Every report query is scoped to the verified active `business_id` on the server.
* **Zero financial data mutation:** Generating, viewing, or printing a report is strictly read-only.

---

## 2. Finalized Reporting Periods & Boundary Conventions

All period boundaries are evaluated using calendar `DATE` values (`YYYY-MM-DD`) in the active workspace's configured timezone (`businesses.timezone`, defaulting to **`Asia/Kolkata` / IST `UTC+05:30`**). Both start and end dates $[P_{\text{start}}, P_{\text{end}}]$ are **inclusive**.

| Report Category | Period Selection Options | Exact Date-Boundary Rule (`[P_start, P_end]`) |Valid Prior Comparison Period (`[P_prev_start, P_prev_end]`) |
|---|---|---|---|
| **1. Weekly Financial Report** | ISO Week selector (`Current Week`, `Previous Week`, or any calendar week `Monday–Sunday`) | `P_start` = Monday (`00:00:00`), `P_end` = Sunday (`23:59:59`) of the selected 7-day week. | Immediately preceding 7-day Monday–Sunday week (`P_start - 7d` to `P_end - 7d`). |
| **2. Monthly Financial Report** | Calendar Month & Year selector (e.g., `October 2026`, `September 2026`) | `P_start` = `YYYY-MM-01`, `P_end` = last calendar day of `YYYY-MM` (`28`, `29`, `30`, or `31`). | Immediately preceding calendar month (e.g., `September 2026` compared against `October 2026`). |
| **3. Yearly Financial Report** | Indian Financial Year selector (e.g., `FY 2026–27`, `FY 2025–26`) | `P_start` = **`YYYY-04-01` (1 April)**, `P_end` = **`(YYYY+1)-03-31` (31 March)**. | Preceding Indian Financial Year (`(YYYY-1)-04-01` to `YYYY-03-31`). |
| **4. Individual Customer Report** | Customer selector + Period (`Selected Month`, `Selected FY`, `Last 90 Days`, or `All Available History`) | Inclusive `[P_start, P_end]` for period activity; `Current Outstanding` and `Current Overdue` evaluated as of `min(P_end, current_date)`. | Preceding equivalent period (when a bounded period is selected and covered by data). |
| **5. Individual Supplier Report** | Supplier selector + Period (`Selected Month`, `Selected FY`, `Last 90 Days`, or `All Available History`) | Inclusive `[P_start, P_end]` for period activity; `Current Outstanding`, `Overdue`, and `Due Soon` evaluated as of `min(P_end, current_date)`. | Preceding equivalent period (when valid). |

### 2.1 Activity During Period vs. Balance As Of Date
Every report table and metric card must explicitly label whether a figure represents:
* **Period Flow (`During [P_start – P_end]`):** `Cash Inflows`, `Cash Outflows`, `Net Cash Flow`, `Category Breakdowns`, `Invoices Issued in Period`, `Payments Recorded in Period`.
* **Point-in-Time Balance (`As of [Date]`):** `Opening Available Cash (as of P_start - 1d)`, `Closing Available Cash (as of min(P_end, current_date))`, `Outstanding Receivables`, `Overdue Receivables`, `Outstanding Payables`, `Overdue Payables`.

---

## 3. Report Completeness and Missing-Data Rules

1. **Data Coverage Disclosure Banner (Mandatory on Partial Periods):**
   * For any report period $[P_{\text{start}}, P_{\text{end}}]$, `lib/finance/reports.ts` compares $[P_{\text{start}}, P_{\text{end}}]$ against the workspace's earliest recorded date $D_{\min}$ (across `opening_balance_date`, `transactions`, `invoices`, `bills`) and latest recorded date $D_{\max}$ (or `current_date`).
   * If $D_{\min} > P_{\text{start}}$ or $P_{\text{end}} > \text{current\_date}$ (for example, generating an `FY 2026–27` report when records exist only from `1 May 2026` to `22 October 2026`), the report header displays a mandatory **Data Coverage Notice**:
     `"Partial Period Coverage: Available workspace records span [D_min] to [D_max] ([M] of 12 months in FY 2026–27). Months without recorded history are marked 'No records available' rather than ₹0 activity."`
2. **Prior-Period Comparison Safeguard:**
   * A percentage or rupee comparison against a prior period $[P_{\text{prev\_start}}, P_{\text{prev\_end}}]$ is computed **only if** the workspace has recorded data covering $[P_{\text{prev\_start}}, P_{\text{prev\_end}}]$ AND the prior-period baseline value is non-zero (for `%` change).
   * If prior-period data is absent, the comparison column displays **`"Prior period unavailable (no records prior to [D_min])"`**—never `"+100%"` or `"₹0 in prior period"`.
3. **Opening Cash Availability in Reports:**
   * If `businesses.opening_balance_date` is set and $P_{\text{start}} > \text{opening\_balance\_date}$, `Opening Available Cash` and `Closing Available Cash` for the period are shown.
   * If `opening_balance_date` is `NULL` or $P_{\text{start}} \le \text{opening\_balance\_date}$, the report shows `Net Cash Flow` for the period and labels `Opening Available Cash` as **`"Opening balance not established prior to [opening_balance_date / period start]"`**.
4. **Missing Due Dates & Cancelled Records:**
   * `CANCELLED` invoices and bills are excluded from all invoiced/billed, outstanding, and overdue totals (with an optional footnote stating `[K] cancelled document(s) excluded`).
   * Open invoices or bills with `due_date IS NULL` are included in `Total Outstanding Receivables / Payables` and disclosed in a footnote (`"Includes [M] open document(s) totaling ₹[X] without a recorded due date"`).

---

## 4. Authoritative Report Structure & Section Matrix

### 4.1 Common Report Header (Mandatory on All 5 Categories, Screen & Print)
* **Report Title & Category:** e.g., `Monthly Financial Report` or `Individual Customer Report — Sahyadri Foods Pvt Ltd`
* **Report Type Badge:** **`Statistical Report`** (Neutral badge) or **`Risk Overview Report`** (Accent/Amber badge)
* **Workspace Name & Currency:** `businesses.name` (`INR ₹`)
* **Selected Period & As-Of Date:** e.g., `1 October 2026 – 31 October 2026 (Balances as of 22 October 2026)`
* **Generated Timestamp:** e.g., `Generated on 22 Oct 2026, 04:15 IST`
* **Data Coverage Notice:** Displayed whenever period coverage is partial or opening balance is unset.

### 4.2 Section Inclusion Matrix by Category and Report Mode

| Section | Weekly | Monthly | Yearly (FY Apr–Mar) | Customer Report | Supplier Report | Mode Rules |
|---|---|---|---|---|---|---|
| **1. Executive Financial Summary Strip** | **Mandatory** (Inflows, Outflows, Net Cash Flow, Closing Cash, Open AR/AP) | **Mandatory** | **Mandatory** | **Mandatory** (Total Invoiced, Received, Outstanding, Overdue) | **Mandatory** (Total Billed, Paid, Outstanding, Overdue, Due in 7d) | Included in both **Statistical** and **Risk Overview**. |
| **2. Cash-Flow Breakdown Table / Chart** | **Mandatory** (Daily breakdown table) | **Mandatory** (Weekly buckets + prior month comparison if valid) | **Mandatory** (12-month Apr–Mar table; unrecorded months marked `No data`) | *Omitted* | *Omitted* | Factual cash basis in both modes. |
| **3. Income & Expense Category Breakdown** | **Conditional** (Shown if $\ge 1$ categorized txn in week) | **Mandatory** (Table + horizontal share bar) | **Mandatory** (Annual category totals + % share) | *Omitted* | *Omitted* | Excludes transfers & opening markers. |
| **4. Receivables & Payables Schedule** | **Mandatory** (Overdue items + items due in selected week) | **Mandatory** (Ageing summary: Current, 1–30d, >30d overdue, No due date) | **Mandatory** (As-of balance + ageing summary) | **Mandatory** (Customer's open & historical invoices table) | **Mandatory** (Supplier's open & historical bills table) | Factual schedule in both modes. |
| **5. Completed-Payment Timing Statistics** | *Omitted* | **Conditional** (Workspace-wide on-time rate if $\ge 3$ paid invoices) | **Conditional** (Annual completed-payment summary if $\ge 3$ paid invoices) | **Mandatory** (Avg/Median Delay, On-Time Rate, Sample count $n$, or `Insufficient data` if $n < 3$) | **Mandatory** (`Our Payment Timing` summary on settled bills, or `Insufficient data` if $n < 3$) | Strictly uses completed (`PAID`) documents with due dates. |
| **6. Financial Risk Assessment & Next Steps** | **Risk Overview Only** | **Risk Overview Only** | **Risk Overview Only** | **Risk Overview Only** | **Risk Overview Only** | **Strictly Forbidden in Statistical Reports.** Mandatory in **Risk Overview Reports**. |

### 4.3 Structure of Section 6: Financial Risk Assessment (Risk Overview Reports Only)
When generating a **Risk Overview Report**, Section 6 is rendered inside a visually distinct container (`Financial Risk Assessment — Evidence-Based Observations`) structured into:
1. **Cash-Flow & Buffer Pressure Observations:** Evaluates whether Period Net Cash Flow was negative, whether Closing Available Cash declined relative to Opening Cash, and whether `Overdue Payables + 7-Day Bills` exceed `Available Cash`.
2. **Receivables & Customer Collection Exposure:** Highlights total overdue receivables, single-customer overdue concentration (if any customer accounts for $\ge 30\%$ of total overdue receivables), and observed completed-payment delays ($n \ge 3$).
3. **Payables & Upcoming Obligation Exposure:** Highlights overdue supplier bills and bills due within the next 7 and 30 days.
4. **Data Limitations Disclosure:** Lists any missing opening balances, partial period coverage, or customers with $n < 3$ completed invoices.
5. **Practical, Proportionate Next Steps:** Deterministic, evidence-linked action items (e.g., `"Follow up on 2 overdue invoices from Malwa Agro Exports totaling ₹50,000 (up to 38 days past due)"`, `"Ensure ₹85,000 in available cash is reserved for 2 supplier bills falling due within the next 7 days"`). Never phrased as guaranteed predictions or regulated investment advice.

---

## 5. Browser Print and Save-as-PDF Specification (`@media print`)

FlowTrust implements report export using native browser printing (`window.print()`) styled via dedicated `@media print` rules in Tailwind / global CSS:

1. **Forced Light-Neutral Print Palette:**
   * Even if the user is viewing FlowTrust in `Dark` theme, `@media print` forces a white paper background (`#FFFFFF`), high-contrast dark ink (`#111827`), and crisp neutral borders (`#D1D5DB`) so printed pages and saved PDFs never waste toner or render dark backgrounds.
2. **Hidden Application Chrome (`print:hidden`):**
   * Top navigation bar, workspace switcher, theme toggle, notification bell, report category/period selector bar, `"Print / Save as PDF"` button, AI Copilot drawer/triggers, and interactive tooltips are completely hidden during printing.
3. **Page Setup & Page-Break Discipline:**
   * `@page { size: A4 portrait; margin: 14mm 12mm; }`
   * Summary KPI grids and the `Financial Risk Assessment` callout box use `break-inside: avoid` (`page-break-inside: avoid`) so cards and risk observations are never sliced in half across pages.
   * Multi-row financial tables use `thead { display: table-header-group; }` and `tr { break-inside: avoid; }` so column headers repeat automatically at the top of each new page.
4. **Chart & Table Readability:**
   * Every chart in a report is paired with an underlying or adjacent tabular summary so exact rupee figures are readable on paper without hover tooltips.
   * Status badges (`Overdue`, `Paid`, `Statistical Report`, `Risk Overview Report`) render with visible `1px solid` borders and text labels rather than relying on background fill colors alone.

---

## 6. Shared Calculation Logic & Verification Requirements

Reports must call the exact same functions in `lib/finance/` used by the Dashboard and Customer/Supplier Intelligence modules:
* `getAvailableCashAsOf(businessId, date)`
* `getPeriodCashFlowSummary(businessId, startDate, endDate)`
* `getCategoryBreakdown(businessId, startDate, endDate)`
* `getReceivablesAndPayablesSummary(businessId, asOfDate)`
* `getCustomerIntelligenceProfile(businessId, customerId, period)`
* `getSupplierIntelligenceProfile(businessId, supplierId, period)`

### Mandatory Consistency & Report Tests
1. **Dashboard ↔ Report Parity (`REP-T01`):** For an identical date range (e.g., `Current Month`), `Cash Inflows`, `Cash Outflows`, `Net Cash Flow`, `Available Cash`, `Total Receivables`, and `Total Payables` on the Monthly Report match the Dashboard KPIs to the exact paisa (`±₹0.00`).
2. **Customer Profile ↔ Customer Report Parity (`REP-T02`):** `Total Invoiced`, `Total Received`, `Outstanding`, `Overdue`, `Average Delay`, `Median Delay`, `On-Time Rate`, and `Sample Count (n)` on the Individual Customer Report match the Customer Detail Profile identically.
3. **Indian Financial Year Boundary (`REP-T03`):** Selecting `FY 2026–27` queries `[2026-04-01, 2027-03-31]`; a transaction on `2026-03-31` falls in `FY 2025–26` and a transaction on `2026-04-01` falls in `FY 2026–27`.
4. **Statistical vs. Risk Overview Strict Separation (`REP-T04`):** Rendering any of the 5 report categories in `Statistical Report` mode produces zero DOM nodes containing `Financial Risk Assessment`, risk indicator badges, or suggested next steps; switching to `Risk Overview Report` mode adds Section 6 while keeping Sections 1–5 numerically identical.
5. **Partial-Period & Missing-Prior-Period Honesty (`REP-T05`):** Generating a Yearly Report for a workspace with only 3 months of data renders the `Partial Period Coverage` banner, marks the 9 unrecorded months as `No records`, and omits invalid year-over-year percentage comparisons.

