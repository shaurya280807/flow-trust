# FlowTrust — Customer & Supplier Intelligence Specification

**Status:** Product scope specification  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Purpose:** Define the initial Customer and Supplier Directory, financial history, payment analytics, and evidence-based risk insights before UI implementation.

---

## 1. Product Goal

FlowTrust should help a small-business owner understand the financial relationship they have with customers and suppliers—not merely store names and contact details.

The initial feature should make it easy to answer questions such as:
- How much does each customer currently owe the business?
- How much of that amount is overdue?
- How has the customer paid historically?
- Are payment delays becoming more frequent or longer, where enough history exists to assess this?
- Which supplier bills are outstanding or coming due soon?
- How much cash may be needed for upcoming supplier payments?
- What does the available evidence suggest, and where is there not enough data to draw a conclusion?

The system must be transparent: calculations should be traceable to financial records, and risk indicators must not present unsupported assumptions as facts.

---

## 2. Initial-Version Scope

The initial version includes dedicated customer and supplier directories, linked financial records, summaries, and basic evidence-based analytics.

### 2.1 Dedicated directories

Provide separate **Customers** and **Suppliers** sections.

Each directory entry represents a distinct entity with a stable unique ID. Invoices, bills, and associated payment records must link to that ID rather than relying on a free-text name.

#### Customer record
- Required customer/business name.
- Optional contact details, such as email, phone, and address.
- Created/updated timestamps where appropriate.
- Active/inactive status or equivalent archive behaviour, if needed to preserve history.

#### Supplier record
- Required supplier/business name.
- Optional contact details, such as email, phone, and address.
- Created/updated timestamps where appropriate.
- Active/inactive status or equivalent archive behaviour, if needed to preserve history.

Do not require users to enter optional contact information to create a record. Avoid deleting historical relationships when a customer or supplier is no longer active.

### 2.2 Create and select entities

- Users can add, view, edit, search, and archive customers and suppliers.
- When creating an invoice, the user selects an existing customer using a searchable dropdown/autocomplete.
- When creating a bill, the user selects an existing supplier using a searchable dropdown/autocomplete.
- Allow a user to create a new customer/supplier from the invoice or bill workflow without losing the current workflow.
- Avoid accidental duplicates by warning when a similar name or matching contact detail already exists. Do not silently merge records automatically.
- If two distinct entities legitimately share a name, the system must still allow them to exist separately.

### 2.3 Customer financial profile

Each customer profile should summarize the financial relationship using linked records:

- Total invoiced amount for the selected period or lifetime, clearly labelled.
- Total amount received against the relevant invoices.
- Current outstanding receivables.
- Overdue receivables.
- Invoice count and payment status breakdown.
- Recent payment history.
- Linked invoices and recorded payments.
- Payment-delay analytics where there is enough completed-payment history.
- Clear indicators when history is too limited to support a reliable trend or risk assessment.

The profile should support navigation from a summary amount to the underlying invoices/payments when practical.

### 2.4 Supplier financial profile

Each supplier profile should summarize the outgoing financial relationship:

- Total billed amount for the selected period or lifetime, clearly labelled.
- Total amount paid against the relevant bills.
- Current outstanding payables.
- Overdue payables.
- Bills due soon.
- Bill count and payment status breakdown.
- Recent payment history.
- Linked bills and recorded payments.
- Historical payment timing summaries where the data supports them.
- Clear indicators when history is too limited to support a reliable trend or risk assessment.

The supplier module must not claim to assess supplier delivery quality, product quality, or overall reliability unless FlowTrust later collects relevant evidence for those claims.

---

## 3. Payment and Financial Definitions

Use the financial foundation rules already established for FlowTrust:

- **Outstanding receivable:** amount still due from a customer on linked invoices, after applying recorded payments and valid adjustments.
- **Overdue receivable:** outstanding invoice amount whose due date has passed.
- **Outstanding payable:** amount still due to a supplier on linked bills, after applying recorded payments and valid adjustments.
- **Overdue payable:** outstanding bill amount whose due date has passed.
- **Completed historical payment:** a payment that has actually been recorded as received or paid, with a usable payment date.
- **Payment delay:** difference between the applicable due date and the actual completed payment date, using a consistent sign convention. Payments made before the due date are early/on-time; payments after the due date are late.
- **Partial payments:** apply to the correct invoice or bill and reduce the corresponding outstanding balance without treating the whole document as paid prematurely.
- **Cancelled documents:** must be excluded or handled according to the shared financial rules, without erasing the audit/history context.

All amounts must be calculated from linked invoices, bills, and recorded payments—not manually maintained counters that can drift out of sync. Exact handling of credits, write-offs, taxes, and other adjustments should follow the central financial model if and when those cases are supported.

### Period and lifetime totals

Where totals are shown, label the time basis clearly:
- Current outstanding is the current open balance.
- Period totals cover documents/payments whose relevant dates fall within the selected period.
- Lifetime totals cover the available retained history.
- Do not imply lifetime completeness if the business has imported only partial history.

---

## 4. Payment Behaviour Analytics

### 4.1 Initial descriptive metrics

Customer payment behaviour should initially be based on **completed payments only**. Unpaid invoices are not treated as completed historical payment observations.

Where sufficient data exists, calculate:
- Average payment delay.
- Median payment delay.
- On-time payment rate.
- Late-payment count or proportion.
- Recent payment-delay trend, where there are enough dated observations.
- Number of completed payments/documents included in the calculation.

The UI should identify the time period and sample size used for these metrics. Partial payments need a consistent treatment so the same invoice is not accidentally counted as multiple independent invoices. The exact aggregation rule for partial payments must be defined in the shared finance/analytics logic before implementation.

### 4.2 Unpaid and overdue items remain separate

Unpaid invoices must be analysed separately using:
- Outstanding amount.
- Overdue amount.
- Days overdue.
- Due date and status.

Do not mix an unpaid invoice's current overdue duration into the historical average payment delay as though the invoice had been paid. This preserves the agreed distinction between actual historical behaviour and current unresolved risk.

### 4.3 Regression and trend analysis

Regression may be used where it answers a meaningful question and enough relevant data exists. Possible future analytical questions include:
- Is observed payment delay increasing or decreasing over time?
- Is there an observable trend in the timing of completed payments?
- Is there a relationship between invoice amount and payment delay in the available records?

Requirements:
- Use regression only when the data quantity and quality are adequate for the specific analysis.
- Label trend results as estimates, not proof of causation.
- Do not make a prediction from only a handful of observations or imply statistical confidence that has not been established.
- If data is insufficient, show descriptive metrics and an explicit “not enough history” state.
- Do not add regression solely for marketing or to claim that the product uses AI/ML.
- Regression is not required for every customer or supplier; it should be applied only to supported use cases.

For the initial implementation, descriptive metrics are the baseline. Regression-based trend analysis can be enabled only after a minimum-data rule, suitable method, and validation approach have been specified. Do not invent a sample-size threshold in the UI or present an unvalidated predictive model as production-ready.

---

## 5. Risk Indicators and Ranking

### 5.1 Initial risk indicator

FlowTrust may display a transparent, evidence-based risk indicator for customers when enough data supports it. This is a **risk indicator**, not a guaranteed outcome or validated probability of default.

Potential inputs include:
- Overdue amount and overdue share.
- Outstanding balance.
- Historical average/median delay.
- On-time payment rate.
- Recent delay trend, only when sufficiently supported.
- Number of completed payment observations.

The exact formula, weights, thresholds, and category names must be specified and tested before implementation. Do not invent them ad hoc in the UI.

### 5.2 Insufficient-data state

Include a distinct **Insufficient data** state when the history is too limited or incomplete to support a fair assessment. Do not automatically classify a new customer as high risk merely because they have little or no history.

### 5.3 Risk categories and explanations

If risk categories are used, they must:
- Be based on documented criteria.
- Explain the key factors contributing to the result.
- Separate observed facts from inferred trends.
- Avoid presenting a ranking as a statistical probability unless a properly validated model supports that interpretation.
- Avoid treating a customer as inherently unreliable based on limited data.
- Allow the business owner to inspect the underlying invoices and payment history.

Supplier risk indicators, if introduced, should initially focus on **payment obligations and cash-planning exposure** (for example, bills due soon or overdue), not supplier quality or delivery reliability.

### 5.4 Ranking display

A sorted customer list may prioritize actionable financial exposure, such as the largest overdue amount or the longest overdue items. If a composite risk score is introduced, it must be documented and validated. Provide the underlying metrics so the ordering is explainable and does not hide important context.

---

## 6. Supplier Payment Planning

The initial supplier experience should support cash planning through transparent obligation summaries:

- Total outstanding payable.
- Total overdue payable.
- Bills due within a defined upcoming window.
- A list of bills due soon, including due date and outstanding amount.
- Links to the underlying bills.
- Clear distinction between recorded historical payments and future obligations.

The exact default “due soon” window (for example, the next 7 days) is a product default to confirm during implementation. Do not imply that a bill is paid until a payment is recorded.

Supplier payment summaries can later inform the Risk Simulator, but the simulator must remain consistent with the same central financial calculations and avoid double-counting bills and transactions.

---

## 7. Integration with Other FlowTrust Features

- **Invoices and bills:** customer/supplier entities are selected and linked when documents are created.
- **Payments:** recorded payments must be linked to the relevant invoice or bill where applicable, so balances and payment history remain accurate.
- **Dashboard:** may surface aggregate receivables, payables, overdue balances, and due-soon obligations using the same financial source of truth.
- **Risk Simulator:** may use eligible receivables, payment timing, and supplier obligations as scenario inputs, without changing actual records.
- **AI Copilot:** may explain authorized, computed metrics and cite the underlying records conceptually; it must not invent financial figures or replace deterministic calculations.
- **Reports:** may later present customer/supplier summaries and payment-history reports. Detailed report formats will be designed separately.

This specification does not require a separate shared intelligence engine decision now. Module architecture can be discussed after the feature scopes are established, as requested.

---

## 8. Data Integrity, Permissions, and Persistence

- Every customer and supplier belongs to one business workspace.
- All directory queries and linked financial records must respect the active business workspace.
- Enforce business-level access and authorization on the server, not only in the UI.
- A user must not be able to access another business's records by modifying a client-side ID.
- Use stable unique IDs for customers and suppliers; do not use names as primary keys.
- Prevent deleting a customer/supplier in a way that breaks existing invoices, bills, or payment history. Prefer archive/inactive behaviour when historical records are linked.
- Validate required fields and contact data formats where provided.
- Keep secrets server-side and out of Git.
- The exact database schema and deletion/archiving mechanics are implementation details to define consistently with the existing Supabase/PostgreSQL stack.

---

## 9. UX Requirements

The UI should be professional, calm, and readable, consistent with FlowTrust's muted business-finance direction.

- Separate Customers and Suppliers navigation/sections.
- Searchable directory lists.
- Useful sorting/filtering for balances, overdue status, and due dates.
- Clear customer/supplier detail pages.
- Searchable selection controls in invoice/bill workflows.
- Easy path to create a new entity from those workflows.
- Amounts, dates, statuses, and time periods must be labelled clearly.
- Make summary figures traceable to underlying records where practical.
- Distinguish actual facts, descriptive statistics, and estimated trends.
- Show loading, empty, validation, permission, and error states.
- Use an explicit insufficient-data state instead of misleading risk colours or scores.
- Do not rely on colour alone to communicate status.
- Antigravity may decide the exact layout, card placement, chart selection, responsive behaviour, and visual hierarchy once feature behaviour is agreed.

---

## 10. Error and Edge Cases

Handle at least:
- No customers or suppliers yet.
- A customer/supplier with no invoices, bills, or payments.
- Partial historical imports.
- Duplicate-looking names or shared contact details.
- A document with partial payments.
- Cancelled documents.
- Missing due dates or payment dates.
- A payment recorded against the wrong document.
- A customer with only one or two completed payment observations.
- A supplier with no historical payment data.
- A changed or archived customer/supplier with linked historical records.
- Incomplete or inconsistent data that prevents reliable analytics.
- Attempts to access another business's data.

Do not silently merge entities, silently discard financial history, or fabricate metrics to fill empty states.

---

## 11. Testing Requirements

Automated tests should cover:
- Customer/supplier creation, editing, search, and archive behaviour.
- Stable ID linkage between entities and invoices/bills.
- Correct totals for invoiced/billed, paid, outstanding, and overdue amounts.
- Partial payments and remaining balances.
- Due-date boundaries and payment-delay sign conventions.
- Completed-payment metrics excluding unpaid invoices.
- Consistent treatment of partial payments in statistical calculations.
- Insufficient-data behaviour.
- Risk-indicator explanations matching the documented calculation.
- Regression/trend analysis only activating when the specified data requirements are met.
- No mutation of financial records by analytics.
- Business-level authorization and cross-business isolation.
- Correct behaviour when historical records are incomplete or imported.

---

## 12. Future Scope — Not in Initial Version Unless Promoted

Keep the following in the FlowTrust future-scope backlog:
- More advanced regression models and validated predictive payment-delay estimates.
- Calibrated probability-of-late-payment or default models, if suitable labelled data becomes available.
- Advanced anomaly detection and automatic risk alerts.
- Customer segmentation and cohort analytics.
- Automated customer/supplier insights and recommended follow-up actions.
- Supplier delivery/quality tracking, but only if relevant evidence is collected.
- External data enrichment, where legally and practically appropriate.
- More advanced ranking and explainability techniques.

Broader FlowTrust future-scope items are tracked separately and are not promoted into this feature by this document.

---

## 13. Definition of Done — Initial Customer & Supplier Intelligence

The initial feature is ready when:
- Customers and suppliers have dedicated searchable directories and stable IDs.
- Users can create, edit, view, and archive entries without breaking history.
- Invoices link to customers and bills link to suppliers.
- New entities can be created from invoice/bill workflows.
- Profiles show accurate linked financial summaries and recent records.
- Outstanding and overdue amounts follow FlowTrust's financial foundation.
- Customer historical delay metrics use completed payments only.
- Unpaid invoice risk is shown separately.
- Insufficient history is clearly communicated.
- Any risk indicator is transparent and based on documented criteria.
- Analytics do not alter actual records.
- Business-level isolation and authorization are enforced.
- Core calculations and edge cases have automated tests.

---

## 14. Product Summary

**FlowTrust Customer & Supplier Intelligence turns linked financial records into a clear view of outstanding obligations and observed payment behaviour.** The initial version prioritizes reliable directories, accurate balances, transparent descriptive metrics, cautious trend analysis, and explainable risk indicators. Regression and more advanced prediction are used only where the available data supports them; unsupported certainty is never presented as fact.
