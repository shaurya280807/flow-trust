# FlowTrust — Complete Application UI/UX & Visual Design Specification

**Document Type:** Master UI/UX Specification, Visual Design Direction & Frontend Blueprint  
**Product:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Target Platform:** Web (Desktop-first productivity with responsive tablet and mobile layouts)  
**Status:** Approved MVP Specification (v1.2) — Incorporates Visual Design & Interaction Direction and Finalized MVP Feature/Financial Decisions; Exact Visual Tokens Open for Screenshot Calibration  
**Related Specifications:** [Master Documentation Index](../README.md) · [PRODUCT_SCOPE.md](../product/PRODUCT_SCOPE.md) · [WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](../product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md) · [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) · [RISK_SIMULATOR_SPECIFICATION.md](../features/RISK_SIMULATOR_SPECIFICATION.md) · [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) · [REPORTS_SPECIFICATION.md](../features/REPORTS_SPECIFICATION.md) · [AI_COPILOT_SPECIFICATION.md](../features/AI_COPILOT_SPECIFICATION.md) · [NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md](../features/NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md)

---

## Decision Classification Legend

To maintain strict separation between approved product scope and adaptable layout recommendations, every major architectural, interface, and workflow item in this specification is classified using one of four tags:

* **`[Confirmed Requirement]`** — Explicitly established in project documentation ([PRODUCT_SCOPE.md](../product/PRODUCT_SCOPE.md), [WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](../product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md), [TECH_STACK_AND_ARCHITECTURE.md](../architecture/TECH_STACK_AND_ARCHITECTURE.md), [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md), [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md), [RISK_SIMULATOR_SPECIFICATION.md](../features/RISK_SIMULATOR_SPECIFICATION.md), [REPORTS_SPECIFICATION.md](../features/REPORTS_SPECIFICATION.md), or the Visual Design & Interaction Direction).
* **`[Finalized MVP Decision]`** — Technical, mathematical, or workflow rule finalized for the MVP in [MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md](../project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md) and its companion feature specifications.
* **`[Proposed UX Improvement]`** — Recommended layout structure, component grouping, navigation pattern, or interaction refinement designed to serve confirmed requirements; adaptable upon screenshot review.
* **`[Open Visual Calibration]`** — Visual tokens (exact hex/OKLCH palette values, card spacing, ledger density) awaiting Khatabook/reference screenshot calibration.

---

## 1. Product Understanding, Design Philosophy, and Visual Direction

### 1.1 Product Purpose and Target User `[Confirmed Requirement]`
FlowTrust is a financial management, intelligence, and risk-management platform for small-business owners who need clear visibility into their actual cash position, outstanding customer receivables, supplier payment obligations, historical payment patterns, and forward-looking cash scenarios without needing advanced accounting or technical expertise.

### 1.2 Core Design Goal & Reference Guidance `[Confirmed Requirement]`
FlowTrust must feel like a calm, trustworthy, practical, modern application built by a mature product team—not a generic AI-generated SaaS dashboard, futuristic fintech concept, or hackathon prototype.

* **Reference Benchmark (Khatabook Inspiration, Not Imitation):** Use the supplied Khatabook screenshots (when reviewed) as references for simplicity, clear information hierarchy, familiar navigation, restrained styling, and everyday ease of use. Do not copy Khatabook's branding, illustrations, or exact screen layouts.
* **Priorities:** Usability, clear information hierarchy, financial readability, and consistency take precedence over decorative visual effects.

### 1.3 Overall Visual Language `[Confirmed Requirement]`
The interface uses a subtle, eye-comfortable visual language with restrained colors and clear contrast:

* **Surface Palette:** Prefer a soft off-white background in Light mode rather than an overwhelmingly bright, pure-white canvas. Use muted, low-saturation tones for surfaces, borders, navigation, and supporting elements.
* **Restrained Accents:** Avoid the stereotypical bright tech-blue palette, bright gradients, neon colors, glowing borders, and excessive purple. Never use color purely as decoration when it serves no functional purpose.
* **Semantic Financial Colors:** Use restrained green and red tones for positive and negative financial values or critical alerts, always paired with explicit symbols (`+`, `-`), icons, or text labels so color is never the sole carrier of meaning.
* **Borders, Spacing & Containers:** Prefer subtle borders, thoughtful spacing, dividers, and clean alignment over heavy drop shadows or floating cards. Use rounded corners sparingly and consistently; avoid pill-shaped containers everywhere or oversized rounded cards.
* **Balanced Density Without Card Overload:** Do not force every piece of information into a separate card. Use tables, compact summaries, section groupings, dividers, whitespace, and aligned rows wherever appropriate.
* **Typography Discipline:** Use a consistent, professional typography system with comfortable reading sizes, tabular numerals for financial figures, and appropriate font weights. Avoid excessive bold text, oversized headings, and unnecessary decorative icons beside every label.

### 1.4 Microcopy and Product Language `[Confirmed Requirement]`
Use concise, natural, professional language comparable to mainstream business applications.

* **Direct Terminology:** Prefer clear, concrete labels that accurately reflect the underlying financial data:
  * `Available cash`
  * `Total receivables`
  * `Overdue amount`
  * `Upcoming payments`
  * `Import transactions`
  * `Add customer`
  * `Save changes`
  * `View report`
* **Zero Redundant Explanatory Copy:** Do not place a paragraph beneath a heading or table that merely repeats what the heading already says (e.g., never write *"Total Receivables — Here you can see the total amount of money that your customers currently owe your business"*).
* **Strictly Prohibited Copy Patterns:**
  * Long introductory paragraphs on ordinary application pages.
  * Generic marketing copy inside the application.
  * AI-style filler phrases such as *"Unlock powerful insights into your financial future,"* *"Let's dive in,"* *"Here's what you need to know,"* or *"Your journey starts here."*
  * Excessive exclamation marks, motivational language, or artificial enthusiasm.
  * Vague button labels such as `"Explore"` when a specific action label (`"Open Risk Simulator"`, `"Import CSV"`) is clearer.
  * Fake notifications, fabricated activity feeds, or placeholder content presented as real business data.
* **When Supporting Text is Permitted:** Use short helper text, tooltips, or disclosures only when explaining a non-obvious calculation, an active scenario assumption, a data-coverage limitation, an insufficient-data state, or a recovery step from an empty/error state.

### 1.5 Theme System: Light, Dark, and System `[Confirmed Requirement]`
FlowTrust must support three appearance modes sharing the exact same layout, hierarchy, and component behavior:

1. **Light:** Uses a soft off-white base canvas with muted neutral surfaces, subtle borders, and high-readability dark neutral text.
2. **Dark:** Uses carefully selected dark neutral surfaces, comfortable text contrast, and restrained accent colors. Explicitly avoids pure-black (`#000000`) backgrounds, glowing elements, and neon accents.
3. **System:** Automatically follows the user's operating-system preference (`prefers-color-scheme`) and updates dynamically if the OS setting changes.

* **Token Consistency & Persistence:** All components, tables, charts, modals, and the AI Copilot must consume shared semantic design tokens so theme switching applies uniformly across the entire application. User theme preference is persisted across sessions via `next-themes` / `localStorage`.

### 1.6 Subtle Interaction and Animation `[Confirmed Requirement]`
Interactions should make the application feel responsive and refined without delaying user workflows:

* **Where Subtle Transitions Apply:**
  * Hover, focus, and pressed states on buttons, rows, and controls.
  * Opening and closing menus, dialogs, drawers, and dropdowns.
  * Expanding or collapsing disclosure sections.
  * Switching tabs or report views.
  * Updating charts and financial summaries when filters or slider inputs change.
  * Progress feedback during loading, saving, and CSV importing.
  * Calm empty-state transitions when the first record is added.
  * Smooth surface transitions during theme changes.
* **Motion Constraints:** Keep transitions short (`150ms–220ms`), smooth, and understated (small opacity, background, border, or position adjustments). Avoid constant movement, bouncing icons, animated gradients, parallax, elaborate page transitions, or rolling number counters.
* **Accessibility:** Always respect `prefers-reduced-motion: reduce` by disabling non-essential motion. Every interactive control must define distinct `default`, `hover`, `focus-visible`, `pressed`, `disabled`, and `loading` states.

---

## 2. Authoritative Specification References

| Document | Key Established Scope & Finalized Rules |
|---|---|
| [PRODUCT_SCOPE.md](../product/PRODUCT_SCOPE.md) | Target users, basic multi-user business structure, 13-step user journey, P0–P4 phased implementation order, core feature scope, and exclusions. |
| [WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](../product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md) | Many-to-many user-business relationship; single-active-business workspace model; business creation (`Business Name` required, `INR` default) and 10-character join-code joining (`Join an Existing Business`); shared member access in v1; optional CSV initialization vs skip flow; isolated `is_demo` workspace support. |
| [TECH_STACK_AND_ARCHITECTURE.md](../architecture/TECH_STACK_AND_ARCHITECTURE.md) | Approved stack: TypeScript, Next.js (App Router), Tailwind CSS, shadcn/ui, Recharts, Lucide React, PapaParse, Zod, Supabase (PostgreSQL + Auth + RLS), deterministic `lib/finance/` modules, Vercel deployment. |
| [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) | Two distinct record types: `transactions` (actual cash in/out) vs `invoices` and `bills` (receivables/payables). `Available Cash` = bank balances + physical cash only. Partial payments supported. Opening balances (`opening_cash_balance` + `opening_balance_date`) and historical imports reconcile via `is_pre_opening_cutoff`. Centralized calculations in `lib/finance/`. |
| [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) | Canonical 12-table PostgreSQL schema, 3 official MVP CSV formats (Transactions, Bank Statement, Invoices/Bills), cross-dataset financial invariants, and synthetic business profile plan. |
| [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md) | 7-stage import pipeline (`Upload -> Column Mapping -> Validation -> Preview -> Duplicate Review -> Confirm -> Summary`), `5 MB` / `10,000 rows` default limits, two-layer deduplication, and atomic PostgreSQL batch persistence. |
| [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) | Separate Customers and Suppliers directories with stable UUIDs; completed-payment delay analytics ($N_{\text{eligible}} \ge 3$ sample-size rule) kept separate from unpaid/overdue invoices; 4-state Customer Collection Indicator; supplier `Bills Due Soon` (next 7 days). |
| [RISK_SIMULATOR_SPECIFICATION.md](../features/RISK_SIMULATOR_SPECIFICATION.md) | Interactive sliders (`Revenue decline`, `Customer payment delay`, `Unexpected expense`, `Proposed investment`); `30 / 60 / 90 day` horizons (`30d` default); hybrid scheduled + operating run-rate baseline; saved scenarios with staleness detection; zero mutation of real records. |
| [REPORTS_SPECIFICATION.md](../features/REPORTS_SPECIFICATION.md) | 5 report categories: Weekly (`Mon–Sun`), Monthly, Yearly (`FY Apr 1 – Mar 31`), Individual Customer, Individual Supplier. Two modes for every category: **Statistical Report** (factual only) and **Risk Overview Report** (statistics + Section 6 Financial Risk Assessment). Browser Print $\rightarrow$ Save as PDF (`@media print`). |
| [AI_COPILOT_SPECIFICATION.md](../features/AI_COPILOT_SPECIFICATION.md) | Read-only financial assistant backed by `WorkspaceFinancialContextSnapshot` and deterministic `lib/finance/` tools via a replaceable provider adapter (`gemini-2.5-flash` default + deterministic fallback). |
| [NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md](../features/NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md) | Scoped in-app Notification Center covering `OVERDUE_INVOICE`, `BILL_DUE_SOON` (7d), `CASH_COVERAGE_WARNING`, and `IMPORT_SUMMARY`, deduplicated by `condition_key`. |

---

## 3. Complete Application Sitemap and Navigation Structure

### 3.1 Recommended Route Hierarchy `[Proposed UX Improvement]`
Because no Next.js routes exist in the repository yet, the following route tree is the recommended structure aligned with the Next.js App Router ([TECH_STACK_AND_ARCHITECTURE.md](../architecture/TECH_STACK_AND_ARCHITECTURE.md)) and the confirmed feature set:

```text
/                                       # Entry redirect (-> /dashboard if authenticated with active workspace, else -> /login)
├── /login                              # Sign in [Confirmed Requirement]
├── /signup                             # Account creation [Confirmed Requirement]
├── /onboarding                         # Workspace selection / creation / joining [Confirmed Requirement]
│   ├── /onboarding/create              # Create a Business + Optional CSV Initialization or Skip
│   └── /onboarding/join                # Join an Existing Business via 10-character Join Code
└── (workspace-scoped routes)           # Requires authenticated session + verified active business membership
    ├── /dashboard                      # Default landing page [Confirmed Requirement]
    ├── /transactions                   # Cash inflow and outflow records [Confirmed Requirement]
    ├── /invoices                       # Customer invoices & receivables [Confirmed Requirement]
    ├── /bills                          # Supplier bills & payables [Confirmed Requirement]
    ├── /customers                      # Customer directory [Confirmed Requirement]
    │   └── /customers/[id]             # Customer financial profile [Confirmed Requirement]
    ├── /suppliers                      # Supplier directory [Confirmed Requirement]
    │   └── /suppliers/[id]             # Supplier financial profile [Confirmed Requirement]
    ├── /simulator                      # Financial Risk Simulator [Confirmed Requirement]
    ├── /reports                        # Financial Reports (Weekly, Monthly, Yearly, Customer, Supplier) [Confirmed Requirement]
    ├── /copilot                        # AI Financial Copilot [Confirmed Requirement]
    └── /settings                       # Workspace, opening balances, join-code, and appearance settings [Confirmed Requirement]
```

### 3.2 Navigation Architecture & Active State Treatment

```text
+--------------------------------------------------------------------------------------------------+
| TOP BAR: [FlowTrust] | [Workspace Switcher: Kaveri Packaging v]  [Import CSV] [Bell] [Theme] [User]|
+----------------------+---------------------------------------------------------------------------+
| PRIMARY NAVIGATION   | MAIN CONTENT AREA                                                         |
|                      |                                                                           |
| Overview             | Page Header (Title, Period Filter or Contextual Actions)                  |
|   Dashboard          |---------------------------------------------------------------------------|
|                      |                                                                           |
| Financial Records    | Primary Content Region (Summaries, Tables, Charts, or Forms)              |
|   Transactions       |                                                                           |
|   Invoices           |                                                                           |
|   Bills              |                                                                           |
|                      |                                                                           |
| Relationships        |                                                                           |
|   Customers          |                                                                           |
|   Suppliers          |                                                                           |
|                      |                                                                           |
| Analysis & Planning  |                                                                           |
|   Risk Simulator     |                                                                           |
|   Reports            |                                                                           |
|   AI Copilot         |                                                                           |
|                      |                                                                           |
| -------------------- |                                                                           |
|   Settings           |                                                                           |
+----------------------+---------------------------------------------------------------------------+
```

#### Navigation Design Rules:
1. **Logical Grouping `[Proposed UX Improvement]`:** Primary sidebar navigation groups items into scannable categories (`Overview`, `Financial Records`, `Relationships`, `Analysis & Planning`, and `Settings`) so users can move directly to Invoices, Bills, Customers, or Suppliers without hunting through sub-tabs.
2. **Restrained Active-State Cue `[Confirmed Requirement]`:** Do not use a stereotypical bright-blue underline beneath active tabs or loud neon highlights. Indicate the active navigation item using a subtle neutral surface fill, a refined weight/contrast shift, and a muted left indicator or border token.
3. **Workspace Switcher `[Confirmed Requirement]`:** Placed in the top bar (or top of the sidebar). Displays the currently active business name. If the user belongs to multiple businesses, clicking opens a menu to switch the active workspace, explore the synthetic demo workspace, or create/join another business. Switching workspaces refreshes all page data strictly to the newly selected business.
4. **Notification Bell `[Finalized MVP Decision]`:** Displays unread badge count for the 4 in-app operational notification categories (`OVERDUE_INVOICE`, `BILL_DUE_SOON`, `CASH_COVERAGE_WARNING`, `IMPORT_SUMMARY`) as specified in [NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md](../features/NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md).
5. **CSV Import Discoverability `[Confirmed Requirement]`:** Available via a direct `[Import transactions]` action in the top bar/Dashboard header and on the Transactions, Invoices, and Bills pages.
6. **Contextual Cross-Linking `[Confirmed Requirement]`:** Summary numbers (such as overdue receivables on the Dashboard or customer totals on a profile) link to the filtered underlying records (`Invoices`, `Bills`, `Transactions`) or the entity's report view.

---

## 4. Authentication, Onboarding, and Workspace Interfaces

### 4.1 Authentication (`/login` & `/signup`)
* **Purpose `[Confirmed Requirement]`:** Authenticate users via Supabase Auth (Email + Password) before granting access to any workspace or financial endpoint.
* **Interface Structure `[Proposed UX Improvement]`:**
  * Compact, centered container on a soft off-white (Light) or dark neutral (Dark) background.
  * Direct form fields: `Email address`, `Password`, and primary submit button (`Sign in` or `Create account`).
  * Inline field validation and clear, non-technical error feedback.

### 4.2 Workspace Onboarding & Selection (`/onboarding`)
* **Purpose `[Confirmed Requirement]`:** Route authenticated users to their active business workspace:
  * If a user belongs to **one** business, open that workspace's `/dashboard` automatically.
  * If a user belongs to **multiple** businesses, present a clean workspace selector list alongside options to create or join a business.
  * If a user belongs to **zero** businesses, present two primary choices (plus optional demo workspace exploration):
    1. **Create a Business**
    2. **Join an Existing Business**

#### Flow A: Create a Business (`/onboarding/create`) `[Confirmed Requirement & Finalized MVP Decision]`
1. **Step 1 — Business Details:**
   * Input: `Business name` (`2–120` characters, required). Workspace defaults to `INR (₹)` and `Asia/Kolkata` timezone ([WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](../product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md) §3.1).
2. **Step 2 — Initialize Financial Data:**
   * Presents the two confirmed setup paths:
     * **Option A — Import financial data (CSV):** Opens the guided 7-stage CSV upload, mapping, validation, preview, and duplicate-review workflow.
     * **Option B — Skip for now:** Proceeds directly to `/dashboard` with an informative empty state.

#### Flow B: Join an Existing Business (`/onboarding/join`) `[Confirmed Requirement & Finalized MVP Decision]`
1. Single focused input: `Join code` (10-character uppercase alphanumeric code `XXXX-XXXXXX`).
2. Action: `[Join business]`.
3. Validation & Behavior:
   * Server validates the code. If valid, the user is immediately added as an authorized member in `business_memberships` and routed to `/dashboard`.
   * Duplicate memberships for the same user and business are prevented.
   * Invalid codes show a clear error message (`"Invalid join code. Please check the code with a workspace member."`) without leaking any business names or internal details.

---

## 5. Main Dashboard — Financial Intelligence (`/dashboard`)

### 5.1 Purpose `[Confirmed Requirement]`
Provide an immediate, trustworthy overview of the business's financial position, recent cash movements, receivables, payables, and actionable risk indicators without overwhelming the user.

### 5.2 Recommended Layout & Information Hierarchy `[Proposed UX Improvement — Adaptable to Screenshots]`
*Note: The exact grid arrangement, number of summary blocks, and chart proportions below are recommended defaults and remain adaptable to screenshot calibration.*

```text
+---------------------------------------------------------------------------------------------------+
| HEADER: Kaveri Packaging Solutions | Period: [Last 30 days v]  [Import transactions] [+ Add record]|
+---------------------------------------------------------------------------------------------------+
| FINANCIAL POSITION SUMMARY (Compact Aligned Summary Strip / Table-Style Metric Row)               |
|                                                                                                   |
| Available cash          Cash flow (Last 30 days)      Total receivables        Total payables     |
| ₹4,80,000               +₹42,500                      ₹3,15,000                ₹1,95,000          |
| Bank + physical cash    In: ₹3,40,500 · Out: ₹2,98,000 Overdue: ₹75,000 (2)    Due in 7d: ₹85,000 |
+---------------------------------------------------------------------------------------------------+
| CASH-FLOW TRENDS & EXPENSE BREAKDOWN (Two-Column Section)                                         |
| +---------------------------------------------------+ +-----------------------------------------+ |
| | Cash inflows vs outflows                          | | Expenses by category                    | |
| | [Grouped Bar / Line Chart over selected period]   | | [Aligned Category Table / Bar Summary]  | |
| |                                                   | | Salaries          ₹1,20,000     40.3%   | |
| |                                                   | | Rent                ₹60,000     20.1%   | |
| |                                                   | | Utilities           ₹18,500      6.2%   | |
| +---------------------------------------------------+ +-----------------------------------------+ |
+---------------------------------------------------------------------------------------------------+
| ATTENTION REQUIRED: OVERDUE RECEIVABLES & UPCOMING PAYMENTS (Two-Column Split)                    |
| +---------------------------------------------------+ +-----------------------------------------+ |
| | Overdue customer invoices           [View all ->] | | Supplier bills due soon (7d)[View all->]| |
| | Customer      Due date    Days late       Balance | | Supplier      Due date          Balance | |
| | Malwa Agro    14 Sep      38 days         ₹50,000 | | Metro Supply  25 Oct            ₹45,000 | |
| | Deccan Bev    10 Oct      12 days         ₹25,000 | | Apex Power    27 Oct            ₹40,000 | |
| +---------------------------------------------------+ +-----------------------------------------+ |
+---------------------------------------------------------------------------------------------------+
| OBSERVATIONS & PLANNING SHORTCUTS (Compact Footer Strip)                                          |
| • 23.8% of total receivables are currently past due. [Test payment delays in Risk Simulator ->]   |
| • Need a period summary?                             [View monthly report ->]                     |
+---------------------------------------------------------------------------------------------------+
```

### 5.3 Dashboard Content & Financial Integrity Rules
* **Available Cash `[Confirmed Requirement]`:** Displays bank balances + physical cash only (`opening_cash_balance + post_opening_inflows - post_opening_outflows`). Never includes unpaid invoices, expected future revenue, or pending payment-gateway settlements.
* **Period Selector `[Confirmed Requirement]`:** Supports `Last 7 days`, `Last 30 days`, `Current month`, `Previous month`, and `Custom date range`. `Available cash`, `Total receivables`, and `Total payables` are point-in-time balances (labeled `As of today`), while `Cash inflows`, `Cash outflows`, `Net cash flow`, and `Expense breakdowns` reflect activity during the selected period.
* **Due-Soon Window `[Finalized MVP Decision]`:** `Bills due soon` displays open supplier bills due within the next **7 calendar days** (`0 <= due_date - current_date <= 7`).
* **Shortcuts `[Confirmed Requirement]`:** Direct actions to `Import transactions` (CSV), `Add transaction`, `Create invoice`, `Add bill`, `Open Risk Simulator`, and `View reports`.

### 5.4 Empty Dashboard State `[Confirmed Requirement]`
When a workspace has no recorded transactions, invoices, bills, or opening balances:
* **No Fabricated Numbers:** Never populate charts or summary blocks with fictional numbers.
* **Calm, Direct Empty State:** Display a concise empty state explaining that no financial records have been added yet, accompanied by direct actions:
  1. `[Import transactions (CSV)]`
  2. `[Add transaction]` / `[Set opening balance]`
  3. `[Explore synthetic demo workspace]` (opens or seeds an isolated `is_demo = true` workspace with a persistent top banner: `"Synthetic Demo Workspace — Sample records for product exploration"`).

---

## 6. CSV Import and Financial File Upload Experience

### 6.1 Confirmed 7-Stage Import Workflow `[Confirmed Requirement & Finalized MVP Decision]`
The CSV import experience follows the 7-stage pipeline defined in [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md):

1. **Upload CSV:** Select a `.csv` file (max `5 MB` / `10,000 rows`), choose mode (`Cash Transactions / Bank Statement` vs `Invoices & Bills Schedule`), or download a standard CSV template. Empty (`0-byte`) or header-only files are rejected immediately.
2. **Column Mapping:** Auto-detects header aliases (`Date`, `Description`, `Amount` or `Debit`/`Credit`, `Type`, `Category`, `Account`, `Reference ID`, `Counterparty Name`, `Document Number`) while requiring user review before proceeding.
3. **Validate Records:** Validates rows via PapaParse and Zod (`ERROR` rows blocked; `WARNING` rows highlighted for review; `INFO` notices summarized).
4. **Preview Records & Review Errors:** Filterable preview table (`All | Errors | Warnings | Ready`) showing interpreted dates, direction badges (`+ INFLOW` / `- OUTFLOW`), normalized amounts, and active parsing assumptions.
5. **Review Potential Duplicates:**
   * **Layer 1 (`CONFIRMED_DUPLICATE`):** Whole-file SHA-256 match or existing `reference_id` / `document_number` match (default: `Skip`).
   * **Layer 2 (`POSSIBLE_DUPLICATE`):** Composite SHA-256 match on `(date, direction, amount, normalized_description)` (default: `Skip`, user-overridable). Rows sharing only `(date, amount)` with different descriptions default to `Import` with a review notice.
6. **Confirm Import & Opening-Balance Safeguard:**
   * Commits valid and approved rows inside a single atomic PostgreSQL transaction.
   * Rows dated on or before `businesses.opening_balance_date` are flagged `is_pre_opening_cutoff = true` so they never double-count into current `Available Cash`.
7. **Import Summary:** Displays exact counts of Imported, Skipped Duplicates, Rejected Errors, Pre-Opening Historical Rows, and Net Post-Opening Cash Movement added.

---

## 7. Core Financial-Management Pages

### 7.1 Transactions (`/transactions`)
* **Purpose `[Confirmed Requirement]`:** Record and review actual settled cash movements (money actually received or paid).
* **Layout & Controls `[Proposed UX Improvement]`:**
  * **Header Bar:** Page title (`Transactions`), period/date-range filter, search input, category filter, type filter (`All`, `Income`, `Expense`), import batch filter, `[Import transactions]`, and `[Add transaction]`.
  * **Summary Strip:** Shows `Cash received`, `Cash paid`, and `Net cash flow` for the currently filtered period.
  * **Table Columns:** `Date`, `Description`, `Category`, `Account` (`Bank` / `Cash`), `Linked Invoice / Bill` (if recorded as a document payment), `Type` (`+ Inflow` / `- Outflow`), `Amount` (right-aligned, tabular numerals), and row actions (`View`, `Edit`, `Void/Delete`).
* **Add / Edit Transaction Form `[Confirmed Requirement & Finalized MVP Decision]`:**
  * `Transaction type`: `Income (money received)` or `Expense (money paid)`.
  * `Transaction date`: Actual date of settled cash movement (`<= current_date`; future obligations belong in Invoices/Bills).
  * `Amount`: Required positive number (`> 0`).
  * `Category`: Select from predefined standard categories or create a custom category.
  * `Payment account`: `Bank` (default) or `Physical Cash`.
  * `Description` and optional `Reference ID`.

### 7.2 Invoices and Receivables (`/invoices`)
* **Purpose `[Confirmed Requirement]`:** Track customer invoices and outstanding receivables without counting unpaid invoices as cash.
* **Layout & Controls `[Proposed UX Improvement]`:**
  * **Header Bar:** Title (`Invoices`), search by invoice number/customer, filter by payment status (`All`, `Unpaid`, `Partially Paid`, `Paid`, `Cancelled`), separate filter/toggle for `Overdue only`, and `[Create invoice]`.
  * **Summary Strip:** `Total outstanding receivables`, `Overdue amount`, and `Invoices due within 7 days`.
  * **Table Columns:** `Invoice #`, `Customer` (links to `/customers/[id]`), `Issue date`, `Due date` (or `No due date` notice), `Total amount`, `Paid amount`, `Outstanding balance`, `Payment status` (`Unpaid` / `Partially Paid` / `Paid` / `Cancelled`), `Overdue indicator` (`Overdue by X days`), and actions (`Record payment`, `View / Cancel`).
* **Record Payment Interaction `[Confirmed Requirement]`:**
  * Displays `Invoice total`, `Already received`, and `Remaining balance`.
  * Inputs: `Payment amount` (`0 < amount <= remaining_balance`), `Payment date`, `Deposit account` (`Bank` / `Cash`), and optional `Reference / UTR`.
  * Atomically creates the `payments` allocation and `INVOICE_PAYMENT` cash transaction while updating the invoice's `amount_paid` and `status`.

### 7.3 Bills and Payables (`/bills`)
* **Purpose `[Confirmed Requirement]`:** Track supplier bills, upcoming obligations, and outstanding payables without counting unpaid bills as cash outflows.
* **Layout & Controls `[Proposed UX Improvement]`:**
  * **Header Bar:** Title (`Bills`), search, filter by payment status (`All`, `Unpaid`, `Partially Paid`, `Paid`, `Cancelled`), filter for `Overdue` or `Due soon (7 days)`, and `[Add bill]`.
  * **Summary Strip:** `Total outstanding payables`, `Overdue payables`, and `Bills due within 7 days`.
  * **Table Columns:** `Bill #`, `Supplier` (links to `/suppliers/[id]`), `Issue date`, `Due date`, `Total amount`, `Paid amount`, `Outstanding balance`, `Payment status`, `Overdue / Due soon indicator`, and actions (`Record payment`, `View / Cancel`).

---

## 8. Customer and Supplier Intelligence Interfaces

### 8.1 Customers Directory (`/customers`) `[Confirmed Requirement & Finalized MVP Decision]`
* **Controls:** Search by customer name/code/contact detail; sort by `Largest overdue amount`, `Longest overdue`, `Highest outstanding balance`, `Total invoiced`, or `Name`; filter by `Active / Archived` or `Has overdue balance`.
* **Table Columns `[Proposed UX Improvement]`:**
  * `Customer name` (links to `/customers/[id]`)
  * `Outstanding receivable`
  * `Overdue receivable` (with max days overdue if `> 0`)
  * `On-time payment rate` (shown when $N_{\text{eligible}} \ge 3$ completed invoices with due dates exist; otherwise `Insufficient data (n = X)`)
  * `Median payment delay` (completed invoices only when $N_{\text{eligible}} \ge 3$; otherwise `—`)
  * `Collection indicator` (`Elevated Overdue Exposure` | `Watch — Payment Delays` | `Regular Payer` | `Insufficient Data`)
  * `Actions` (`View profile`, `Create invoice`)

### 8.2 Customer Detail Profile (`/customers/[id]`) `[Confirmed Requirement & Finalized MVP Decision]`

```text
+---------------------------------------------------------------------------------------------------+
| Relationships / Customers / Deccan Beverages              [Edit customer] [View customer report]  |
+---------------------------------------------------------------------------------------------------+
| COLLECTION INDICATOR: [Watch — Payment Delays]                                                    |
| Reason: ₹25,000 is 12 days past due; historical median delay is +9.0 days across 5 paid invoices. |
+---------------------------------------------------------------------------------------------------+
| CURRENT RECEIVABLES EXPOSURE (Unpaid & Overdue — Evaluated Separately from Historical Delay)      |
| Current outstanding: ₹25,000        Overdue amount: ₹25,000 (12d late)    Open invoices: 1        |
+---------------------------------------------------------------------------------------------------+
| HISTORICAL PAYMENT BEHAVIOUR (Completed Invoices Only — Sample: n = 5 paid invoices with due date)|
| Total invoiced: ₹3,40,000           Total received: ₹3,15,000             On-time rate: 60.0%     |
| Median delay: +9.0 days late        Average delay: +8.4 days late         Recent trend: n < 6     |
+---------------------------------------------------------------------------------------------------+
| TABS: [Invoices (6)]   [Recorded Payments (6)]                                                    |
+---------------------------------------------------------------------------------------------------+
```

### 8.3 Suppliers Directory (`/suppliers`) & Supplier Detail Profile (`/suppliers/[id]`) `[Confirmed Requirement & Finalized MVP Decision]`
* **Directory Columns:** `Supplier name`, `Outstanding payable`, `Overdue payable`, `Bills due soon (7 days)`, `Total billed`, and `Actions` (`View profile`, `Add bill`).
* **Supplier Detail Profile Sections:**
  1. **Obligation Summary (Cash Planning Focus):** `Current outstanding payables`, `Overdue payables`, `Bills due within 7 days`, `Bills due in 8–30 days`, `Total billed`, and `Total paid`.
  2. **Upcoming Bills Due Soon Table:** Lists unpaid/partially paid bills sorted by due date with direct `[Record payment]` actions.
  3. **Linked Bills & Our Payment History Tabs:** Complete list of bills, recorded outgoing payments, and `Our Historical Payment Timing` (when $\ge 3$ bills are settled). Never claims to rate supplier product quality or delivery reliability.

---

## 9. Risk Simulator Interface (`/simulator`)

### 9.1 Layout & Interactive Controls `[Confirmed Requirement & Finalized MVP Decision]`

```text
+---------------------------------------------------------------------------------------------------+
| Risk Simulator                     Simulation banner: Hypothetical scenario — real records unchanged|
| Horizon: [(•) 30 Days ( ) 60 Days ( ) 90 Days]  [Reset to baseline] [Saved scenarios v] [Save]    |
+---------------------------------------------------------------------------------------------------+
| SCENARIO ASSUMPTIONS (Left Column)               | BASELINE VS SCENARIO COMPARISON (Right Column) |
|                                                  |                                                |
| Revenue decline                                  | Current available cash (Actual):     ₹4,80,000 |
| [=======O------------------]  [ 20 ] %           |                                                |
|                                                  |                       Baseline        Scenario |
| Customer payment delay                           | Projected inflows    ₹3,20,000       ₹2,15,000 |
| [===========O--------------]  [ 30 ] days        | Projected outflows   ₹2,65,000       ₹3,15,000 |
|                                                  | Net cash flow         +₹55,000       -₹1,00,000|
| Unexpected expense                               | Projected ending cash ₹5,35,000      ₹3,80,000 |
| [=====O--------------------]  ₹[ 50,000 ] Day[1] | Minimum projected cash ₹4,40,000     ₹3,45,000 |
|                                                  |                                                |
| Proposed investment / purchase  [+ Expand]       | [Daily / Weekly Trajectory & Bar Comparison]   |
|   Initial amount:      ₹[ 0 ]  Day [ 1 ]         |                                                |
|   Recurring monthly:   ₹[ 0 ]                    | Receivables shifted beyond 30-day horizon:     |
|   Est. monthly benefit:₹[ 0 ]  [ ] Include       | • ₹60,000 across 2 open invoices               |
+---------------------------------------------------------------------------------------------------+
```

All calculations follow [RISK_SIMULATOR_SPECIFICATION.md](../features/RISK_SIMULATOR_SPECIFICATION.md).

---

## 10. Statistical and Risk Overview Report Interfaces (`/reports`)

Follows [REPORTS_SPECIFICATION.md](../features/REPORTS_SPECIFICATION.md):
* 5 categories: `Weekly Financial Report` (`Mon–Sun`), `Monthly Financial Report`, `Yearly Financial Report` (`FY Apr 1 – Mar 31`), `Individual Customer Report`, and `Individual Supplier Report`.
* 2 distinct modes per category: **`Statistical Report`** (factual statistics only; Section 6 omitted) and **`Risk Overview Report`** (statistics + Section 6 `Financial Risk Assessment & Suggested Next Steps`).
* Export via `[Print / Save as PDF]` (`window.print()`) with `@media print` CSS forcing a clean light-neutral paper palette, hiding application navigation chrome, and repeating table headers across page breaks.

---

## 11. AI Financial Copilot Interface (`/copilot`)

Follows [AI_COPILOT_SPECIFICATION.md](../features/AI_COPILOT_SPECIFICATION.md):
* Uses the same calm, restrained design tokens as the rest of FlowTrust (no glowing borders, neon orbs, or AI clichés).
* Displays **Verified Workspace Figures** and clickable **Source Citation Chips** separately from narrative explanation and suggested next steps.
* Remains fully functional via deterministic template fallback when an external LLM API key is not configured or unreachable.

---

## 12. Workspace and Account Settings (`/settings`)

1. **Workspace & Opening Financial Position `[Confirmed Requirement & Finalized MVP Decision]`:**
   * Displays active `Business name` and currency (`INR ₹`).
   * Allows setting or updating `Opening Cash Balance` (`opening_cash_balance`), `Opening Balance Cutoff Date` (`opening_balance_date`), and optional `Target Cash Buffer` (`target_cash_buffer`).
2. **Workspace Membership & Join Code `[Confirmed Requirement & Finalized MVP Decision]`:**
   * Displays current 10-character Join Code (`XXXX-XXXXXX`) with `[Copy code]` and `[Regenerate code]` actions available to any authorized business member.
3. **Appearance (Theme Preference) `[Confirmed Requirement]`:**
   * Segmented control: `Light` | `Dark` | `System`.
4. **Demo Workspace & Data Portability `[Confirmed Requirement & Finalized MVP Decision]`:**
   * Action to open or reset the isolated `is_demo = true` Synthetic Demo Workspace, and export workspace transactions/documents to CSV.

---

## 13. Reusable Component System (`shadcn/ui` + Tailwind CSS)

| Component | Recommended Location | Responsibility & Design Constraints |
|---|---|---|
| `AppShell` | `components/layout/app-shell.tsx` | Desktop sidebar, top bar, notification popover, responsive mobile drawer, and demo workspace banner. |
| `WorkspaceSwitcher` | `components/layout/workspace-switcher.tsx` | Switches active business workspace; links to create/join business and demo workspace flows. |
| `NotificationPopover` | `components/layout/notification-popover.tsx` | Displays the 4 in-app operational notification categories with dismiss and deep-link support. |
| `ThemeToggle` | `components/layout/theme-toggle.tsx` | 3-option selector (`Light`, `Dark`, `System`) bound to shared semantic tokens. |
| `PageHeader` | `components/ui/page-header.tsx` | Short page title, optional period filter, and primary/secondary action buttons (zero redundant explanatory paragraphs). |
| `SummaryStrip` | `components/ui/summary-strip.tsx` | Compact, aligned multi-metric summary row using tabular numerals. |
| `FinancialTable` | `components/ui/financial-table.tsx` | Accessible table with right-aligned currency columns, sorting, pagination, and mobile row adaptation. |
| `EntityCombobox` | `components/contacts/entity-combobox.tsx` | Searchable Customer/Supplier selector linked by stable UUID, with inline `[+ Add new]` creation and duplicate-name warning. |
| `StatusIndicator` | `components/ui/status-indicator.tsx` | Text + subtle border/surface badge for payment progress (`Unpaid`, `Partially Paid`, `Paid`, `Cancelled`), `Overdue`, and `Insufficient data` states. |
| `CsvImportWizard` | `components/import/csv-import-wizard.tsx` | 7-stage CSV upload, column mapping, Zod validation, preview, duplicate review, confirmation, and summary dialog. |
| `ScenarioSlider` | `components/simulator/scenario-slider.tsx` | Keyboard-accessible left-to-right slider paired with direct numeric input displaying unit (`%`, `days`, `₹`). |
| `ReportCanvas` | `components/reports/report-canvas.tsx` | Print-ready report container supporting Statistical and Risk Overview modes with `@media print` isolation. |

---

## 14. Explicitly Deferred Visual Decisions Awaiting Screenshots

In accordance with project instructions, the following visual parameters remain open (`[Open Visual Calibration]`) for calibration when you share reference screenshots:

1. **Exact Hex / OKLCH Color Tokens:** Specific off-white canvas value, dark-theme surface steps, border saturation, muted accent tone, and restrained green/red semantic values.
2. **Typography Selection & Scale:** Exact sans-serif and monospace/tabular font families, line heights, and heading/table text sizes.
3. **Spacing, Radius, and Border Tokens:** Exact container padding scale, table row height, and subtle border-radius value.
4. **Screenshot-Driven Layout Refinements:** Any adjustments to the Dashboard summary strip, navigation rail proportions, or contact/ledger table arrangements inspired by the visual references.

