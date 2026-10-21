# FlowTrust — Financial Foundation Decisions

**Status:** Product-level decisions finalized in conversation; detailed implementation specifications remain pending where noted.

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

**Implementation decision pending:** Whether opening balances will be stored as dedicated opening-balance records or in dedicated balance fields. Decide during technical schema design.

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

**Detailed specifications pending:** Exact CSV template, column-mapping rules, date formats, and duplicate-matching implementation.

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

## 12. Summary of Decisions and Pending Details

| Area | Status |
|---|---|
| Financial data model | Finalized |
| Opening balances | Finalized |
| Available cash definition | Finalized |
| Income and expense recording | Finalized |
| Standard and custom categories | Finalized |
| Partial payments | Finalized |
| Invoice/bill payment statuses | Initial approach finalized |
| CSV import workflow | Finalized at product level |
| Duplicate detection | Initial approach finalized |
| Financial calculations architecture | Finalized at architectural level |
| Historical reporting | Initial approach finalized |
| Financial record integrity | Initial approach finalized |
| Exact database schema | Pending technical design |
| Exact CSV template | Pending detailed specification |
| Detailed calculation formulas | Pending calculation design |
| Opening balance storage approach | Pending technical schema design |

## 13. Guiding Principles

1. Actual cash movements must remain distinct from invoices and bills.
2. Avoid double-counting opening balances, imported records, invoices, and payments.
3. Do not invent missing financial records or values.
4. Clearly distinguish actual results, outstanding obligations, pending settlements, estimates, and projections.
5. Keep financial calculations deterministic, centralized, testable, and independent of AI-generated explanations.
6. Preserve financial integrity when editing or deleting linked records.
7. Keep advanced capabilities in future scope unless they are necessary for the initial product.
