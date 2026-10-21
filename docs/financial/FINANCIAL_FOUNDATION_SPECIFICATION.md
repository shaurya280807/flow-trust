# FlowTrust — Financial Foundation Specification

**Status:** Approved Authoritative Financial Foundation (Area B — Preserved Core Decisions + Section 14 Implementation & Formula Annex)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Related Specifications:** [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) · [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md) · [RISK_SIMULATOR_SPECIFICATION.md](../features/RISK_SIMULATOR_SPECIFICATION.md) · [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) · [REPORTS_SPECIFICATION.md](../features/REPORTS_SPECIFICATION.md)

---

## 1. Financial Data Model

FlowTrust will maintain two connected but distinct types of financial records.

### 1.1 Financial transactions
Financial transactions represent actual money entering or leaving a business.

Examples:
- Customer payments received
- Rent and utility payments
- Supplier payments
- Other income and expenses

These records determine actual cash movement and contribute to the business's cash balance.

### 1.2 Invoices and bills
Invoices and bills represent amounts owed by customers and amounts owed to suppliers.

- Customer invoices create receivables.
- Supplier bills create payables.
- Issuing an invoice does not count as cash received.
- Creating a bill does not count as cash paid.

### 1.3 Payments and partial payments
Payments can be linked to the corresponding invoice or bill.

The system must support partial payments. For example, a payment of ₹20,000 against a ₹50,000 invoice leaves ₹30,000 outstanding.

Payments must not be counted twice when calculating cash movement or outstanding balances.

### 1.4 Initial scope
This is not intended to be a complete double-entry accounting system. The initial implementation focuses on cash visibility, receivables, payables, financial trends, and risk analysis.

The model should remain extensible for future financial capabilities.

## 2. Opening Balances and Historical Data

Businesses can establish an opening financial position without importing their complete financial history.

### 2.1 Opening balances
Businesses may provide starting balances such as:
- Opening cash balance
- Outstanding customer receivables
- Outstanding supplier payables

Opening balances establish the starting position from which subsequent financial activity is tracked.

### 2.2 Optional historical records
Importing historical records is optional. Businesses may import available historical transactions, invoices, and bills to support richer financial analysis.

The application must distinguish historical activity from the opening position to avoid counting the same activity twice.

### 2.3 Existing receivables and payables
Where practical, existing unpaid customer invoices and supplier bills should be recorded as individual documents rather than only as aggregate totals. This allows payments, partial payments, due dates, and outstanding balances to be tracked.

If a user provides only an aggregate opening receivable or payable balance, the system must not invent individual invoices or bills to explain it.

### 2.4 Reconciliation
Opening balances and imported records must be reconciled carefully. The application must not double-count:
- Opening cash and historical cash movements
- Opening receivables and imported outstanding invoices
- Opening payables and imported outstanding bills

For example, if opening cash is ₹1,00,000 and subsequent eligible transactions include ₹20,000 received and ₹10,000 paid, the resulting cash balance is ₹1,10,000.

Historical transactions before the opening point must not be blindly added to the opening balance. The import flow and calculation logic must establish which transactions belong after the opening point.

## 3. Definition of Available Cash

**Finalized:** Available cash includes bank balances and physical cash only.

| Financial item | Included in available cash? |
|---|---|
| Bank account balances | Yes |
| Physical cash | Yes |
| Payment gateway funds awaiting settlement | No; track separately when supported |
| Unpaid customer invoices | No; these are receivables |
| Expected future revenue | No |

Available cash is not the same as the total financial position. Receivables, payables, pending settlements, and other relevant items should be presented separately.

## 4. Income and Expense Recording

**Finalized:** Income and expense transaction records represent actual cash movements only.

- An income transaction represents money actually received and increases cash.
- An expense transaction represents money actually paid and decreases cash.
- A customer invoice represents money owed and does not immediately change cash.
- A supplier bill represents money payable and does not immediately change cash.
- A payment against an invoice or bill represents actual cash movement.
- Partial payments are supported.
- An invoice and its payment must not be counted as two separate income events.

### Future scope
The alternative model in which income and expense entries can independently have `Paid`, `Partially Paid`, or `Unpaid` statuses is future scope. Any future implementation must integrate with invoices, bills, and payments without creating duplicate financial records or double-counting.

## 5. Income and Expense Categories

**Finalized:** Use predefined standard categories and allow custom categories.

Initial examples:

**Income**
- Sales
- Service Revenue
- Other Income

**Expenses**
- Rent
- Salaries
- Utilities
- Inventory Purchases
- Marketing
- Transportation
- Software & Subscriptions
- Taxes
- Other Expenses

Categories support dashboard visualizations, expense breakdowns, trends, and financial insights. The final category list may be refined during implementation.

### Future scope
Advanced automatic transaction categorization.

## 6. Invoice and Bill Payment Statuses

Payment status will be calculated from the document amount and its linked payments.

- **Unpaid:** No payment has been recorded.
- **Partially Paid:** Some amount has been paid, but a balance remains outstanding.
- **Paid:** The full amount has been settled.
- **Overdue:** The due date has passed and an amount remains outstanding.

Overdue is a separate dimension from payment progress. An invoice may be both partially paid and overdue.

Basic cancellation support should preserve linked financial history. Cancelled documents must not be included in normal outstanding totals.

## 7. CSV Import and Duplicate Detection

The initial import workflow is:

1. Upload CSV.
2. Detect or configure column mapping.
3. Validate records.
4. Preview records and review errors.
5. Review potential duplicates.
6. Confirm import.
7. Show an import summary.

Potential columns include date, description, amount, income/expense type, category, and payment account where available.

Validation should identify malformed rows, invalid dates, missing amounts, and unsupported transaction types.

### Duplicate detection
Use two initial layers:

1. **Exact import repetition:** Attempt to recognize when the same file or records are imported again.
2. **Potential transaction duplicates:** Flag similar records using date, amount, description, and available identifiers for review.

Matching only date and amount is not enough to safely identify duplicates because two genuine transactions can share those values. Ambiguous cases should be reviewed rather than automatically deleted.

The import summary should report imported records, rejected records, and potential duplicates flagged for review.

### Future scope
- Bank integrations
- Automatic bank reconciliation
- Advanced duplicate matching

## 8. Financial Calculations and Source of Truth

**Finalized at the architectural level:** Financial calculations will be implemented in dedicated deterministic TypeScript modules under `lib/finance/`.

Application components, charts, and AI responses must not independently invent or implement inconsistent versions of financial formulas.

Initial calculations include:
- Available cash
- Cash inflows and outflows
- Net cash flow
- Outstanding receivables
- Outstanding payables
- Expense category breakdowns
- Invoice payment progress
- Cash-flow trends

Each calculation should have clearly defined inputs and outputs and appropriate unit tests.

### Cash flow versus profit
Cash flow is the primary financial metric for the initial dashboard. Profit must not be treated as equivalent to cash flow. Without the necessary accounting model and data, FlowTrust must not claim to calculate accurate accounting profit for every business.

Any future profit-related estimates must disclose their assumptions.

## 9. Historical Data and Reporting Periods

Financial records must use their actual dates.

- Transactions have transaction dates.
- Invoices and bills have issue dates and due dates where available.
- Payments have actual payment dates.
- Reports are calculated for the selected date range.
- Missing dates must not be silently invented.

Initial reporting periods:
- Last 7 days
- Last 30 days
- Current month
- Previous month
- Custom date range

Incomplete historical data should be disclosed where it limits a report or insight.

### Future scope
- Configurable financial year
- Advanced comparative reporting
- Automated scheduled reports

## 10. Financial Record Editing, Deletion, and Integrity

Users can create, view, edit, and delete financial records for businesses they are authorized to access.

The system must preserve consistency across linked records:
- Payments must not become silently orphaned.
- Deleting an invoice must not silently remove a cash transaction.
- Linked-record dependencies must be validated.
- Invalid operations should return clear errors.
- Financial totals must be recalculated correctly after valid changes.

### Future scope
- Full audit trail
- Record version history
- Accounting-grade immutable ledger

## 11. Missing Information and Uncertainty

**Finalized principle:** FlowTrust must not fabricate financial certainty.

Examples:
- Insufficient history: reliable trend unavailable.
- Missing due dates: overdue analysis may be incomplete.
- Missing expense records: cash-flow projections may be less reliable.
- Unknown payment status: payment progress cannot be confidently determined.

AI explanations and projections must respect the same limitations. Estimates and projections must be distinguished from actual financial results.

## 12. Summary of Decisions

| Area | Status |
|---|---|
| Financial data model | Finalized |
| Opening balances | Finalized |
| Available cash definition | Finalized |
| Income and expense recording | Finalized |
| Standard and custom categories | Finalized |
| Partial payments | Finalized |
| Invoice/bill payment statuses | Finalized |
| CSV import workflow | Finalized (Detailed in [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md)) |
| Duplicate detection | Finalized (Detailed in [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md)) |
| Financial calculations architecture | Finalized (`lib/finance/`) |
| Historical reporting | Finalized (Detailed in [REPORTS_SPECIFICATION.md](../features/REPORTS_SPECIFICATION.md)) |
| Financial record integrity | Finalized (Detailed in [SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md](../architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md)) |
| Canonical schema & formulas | Finalized in Section 14 below and [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) |

## 13. Guiding Principles

1. Actual cash movements must remain distinct from invoices and bills.
2. Avoid double-counting opening balances, imported records, invoices, and payments.
3. Do not invent missing financial records or values.
4. Clearly distinguish actual results, outstanding obligations, pending settlements, estimates, and projections.
5. Keep financial calculations deterministic, centralized, testable, and independent of AI-generated explanations.
6. Preserve financial integrity when editing or deleting linked records.
7. Keep advanced capabilities in future scope unless they are necessary for the initial product.

---

## 14. Authoritative Implementation Specification & Formula Annex (`lib/finance/`)

This annex finalizes the technical storage and mathematical definitions required to implement Sections 1–13 consistently across the database, dashboard, reports, Risk Simulator, and AI Copilot.

### 14.1 Monetary Representation, Precision, and Rounding Policy
1. **Database Storage:** All monetary amounts are stored in PostgreSQL as `NUMERIC(14, 2)` (supporting values up to `₹99,99,99,99,999.99` with exact two-decimal precision).
2. **TypeScript Calculation Arithmetic:** Inside `lib/finance/`, all monetary additions, subtractions, and allocations are performed using integer minor units (`paise = Math.round(amount * 100)`) before converting back to two decimal places (`paise / 100`), eliminating IEEE-754 floating-point representation errors (such as `0.1 + 0.2 = 0.30000000000000004`).
3. **Percentage & Day Rounding:**
   * Percentages (e.g., `On-Time Payment Rate`, `Category Share`, `Period Change %`) are rounded to **1 decimal place** (`Math.round(val * 10) / 10`) for display.
   * Payment delays (`Average Payment Delay`, `Median Payment Delay`) are rounded to **1 decimal place** in days.
   * Runway / day counts are rounded down (`Math.floor`) to whole days so cash endurance is never overstated.

### 14.2 Opening Balance Storage & Cutoff Reconciliation Rule
1. **Storage Model:** Each business workspace stores its opening cash anchor on the `businesses` table:
   * `opening_cash_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00`
   * `opening_balance_date DATE NULL` (the "as-of" cutoff date of the opening balance).
   * Optional aggregate opening receivables/payables where individual historical invoices/bills are not available: `opening_receivables_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00`, `opening_payables_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00`. (Where individual open invoices/bills are entered or imported, they are stored as individual `invoices` / `bills` records per Section 2.3).
2. **Available Cash Formula (as of Date $T$):**
   Let $\mathcal{T}_{\text{post}}(T)$ be the set of all `ACTIVE` (non-voided) settled `transactions` belonging to the business where:
   * `payment_account IN ('BANK', 'CASH')` (excluding unsettled gateway balances),
   * `transaction_date <= T`, and
   * if `opening_balance_date IS NOT NULL`, `transaction_date > opening_balance_date` (i.e., `is_pre_opening_cutoff = false`).

   Then:
   $$\text{Available Cash}(T) = \text{opening\_cash\_balance} + \sum_{tx \in \mathcal{T}_{\text{post}}(T),\, \text{INFLOW}} tx.\text{amount} - \sum_{tx \in \mathcal{T}_{\text{post}}(T),\, \text{OUTFLOW}} tx.\text{amount}$$

3. **Treatment of Pre-Opening Historical Transactions (`transaction_date <= opening_balance_date`):**
   * Transactions dated on or before `opening_balance_date` are flagged `is_pre_opening_cutoff = true`.
   * They **do not** modify `Available Cash(T)` for $T \ge \text{opening\_balance\_date}$ because their net cash impact is already included in `opening_cash_balance`.
   * They **are** included when computing historical period inflows/outflows for periods falling within or across their transaction dates, when full historical transactions for that period have been imported.

### 14.3 Period Cash Inflows, Outflows, and Net Cash Flow
For any selected date range $[D_{\text{start}}, D_{\text{end}}]$:
* Let $\mathcal{T}(D_{\text{start}}, D_{\text{end}})$ be the set of `ACTIVE` settled `transactions` where $D_{\text{start}} \le \text{transaction\_date} \le D_{\text{end}}$ and `transaction_kind NOT IN ('OPENING_BALANCE_MARKER', 'INTERNAL_TRANSFER')`.
* **Cash Inflows (Money Received):**
  $$\text{Cash Inflows}(D_{\text{start}}, D_{\text{end}}) = \sum_{tx \in \mathcal{T},\, \text{direction} = \text{'INFLOW'}} tx.\text{amount}$$
* **Cash Outflows (Money Paid):**
  $$\text{Cash Outflows}(D_{\text{start}}, D_{\text{end}}) = \sum_{tx \in \mathcal{T},\, \text{direction} = \text{'OUTFLOW'}} tx.\text{amount}$$
* **Net Cash Flow:**
  $$\text{Net Cash Flow}(D_{\text{start}}, D_{\text{end}}) = \text{Cash Inflows}(D_{\text{start}}, D_{\text{end}}) - \text{Cash Outflows}(D_{\text{start}}, D_{\text{end}})$$

### 14.4 Invoice & Bill Balance, Status, and Overdue Derivation
For any non-cancelled customer invoice $i$ (or supplier bill $b$) as of evaluation date $T$ (default $T = \text{current\_date}$ in workspace timezone):
1. **Paid Amount:**
   $$\text{amount\_paid}_i(T) = \sum_{p \in \text{ActivePayments}(i),\, p.\text{payment\_date} \le T} p.\text{allocated\_amount}$$
   Validation constraint: $\text{amount\_paid}_i \le \text{total\_amount}_i$. Overpayments ($\text{amount\_paid}_i > \text{total\_amount}_i$) are rejected by validation in the MVP.
2. **Outstanding Balance:**
   $$\text{outstanding\_amount}_i(T) = \text{total\_amount}_i - \text{amount\_paid}_i(T)$$
3. **Payment Progress Status (`status`):**
   * If `is_cancelled = true`: `CANCELLED` (`outstanding_amount` treated as `0` in all receivable/payable totals).
   * Else if $\text{amount\_paid}_i(T) == 0$: `UNPAID`
   * Else if $0 < \text{amount\_paid}_i(T) < \text{total\_amount}_i$: `PARTIALLY_PAID`
   * Else ($\text{amount\_paid}_i(T) == \text{total\_amount}_i$): `PAID`
4. **Overdue Dimension (`is_overdue` and `days_overdue`):**
   * An invoice or bill is **Overdue** as of date $T$ if and only if:
     $$\text{status} \in \{\text{'UNPAID'}, \text{'PARTIALLY\_PAID'}\} \;\land\; \text{due\_date IS NOT NULL} \;\land\; \text{due\_date} < T$$
   * When overdue:
     $$\text{days\_overdue}_i(T) = T - \text{due\_date}_i \quad (\text{in calendar days, } \ge 1)$$
   * Documents where `due_date IS NULL` are **never** classified as overdue and are surfaced with an explicit `"No due date"` status notice.
5. **Total Outstanding & Overdue Receivables / Payables:**
   * $\text{Total Outstanding Receivables}(T) = \sum_{i \in \text{OpenInvoices}} \text{outstanding\_amount}_i(T) + \text{opening\_receivables\_balance}$
   * $\text{Total Overdue Receivables}(T) = \sum_{i \in \text{OverdueInvoices}(T)} \text{outstanding\_amount}_i(T)$
   * $\text{Total Outstanding Payables}(T) = \sum_{b \in \text{OpenBills}} \text{outstanding\_amount}_b(T) + \text{opening\_payables\_balance}$
   * $\text{Total Overdue Payables}(T) = \sum_{b \in \text{OverdueBills}(T)} \text{outstanding\_amount}_b(T)$
   * $\text{Bills Due Soon}(T, W) = \sum_{b \in \text{OpenBills},\, T \le b.\text{due\_date} \le T + W} \text{outstanding\_amount}_b(T)$ where the default window is $W = 7\text{ days}$.

