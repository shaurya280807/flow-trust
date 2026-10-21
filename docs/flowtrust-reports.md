# FlowTrust Reports — Feature Specification

**Status:** Feature scope defined; detailed financial formulas will be finalized in the shared finance-calculation specification.

**Reporting Year:** Financial Year (April 1 – March 31)

**Initial Export Method:** Browser Print → Save as PDF

---

## 1. Purpose

FlowTrust Reports provides a clear, evidence-based overview of a business's financial activity, performance, and financial risks over a selected period.

The reporting system must present recorded financial information accurately without confusing actual historical figures with analytical observations, estimates, or hypothetical simulations.

Every report must be available in two distinct types:

1. **Statistical Report** — presents factual financial figures, tables, breakdowns, and descriptive statistics without risk assessment or recommendations.
2. **Risk Overview Report** — presents the relevant statistics along with a separate assessment of financial risks, potential cash-flow pressure, and evidence-based observations.

Both report types must use the same validated financial data. The Risk Overview Report must add interpretation without changing or misrepresenting the underlying figures.

## 2. Core Principles

* **Accuracy first:** Use validated FlowTrust records and centralized financial calculations.
* **Separate facts from interpretation:** Clearly distinguish recorded figures, descriptive analytics, estimates, and hypothetical scenarios.
* **No fabricated completeness:** If data covers only part of a selected period, disclose the actual coverage.
* **No unsupported conclusions:** Do not present limited or incomplete data as a reliable trend, prediction, or risk conclusion.
* **Transparent limitations:** Disclose relevant data gaps, assumptions, and insufficient sample sizes.
* **Consistent calculations:** Reuse centrally defined formulas for cash, income, expenses, receivables, payables, payment delays, and other metrics.
* **Business workspace isolation:** Every report must use data belonging only to the currently active business workspace.
* **Server-side authorization:** Access control must be enforced on the server, not merely through frontend filtering.
* **No financial data mutation:** Generating, viewing, or printing a report must not modify financial records.
* **Currency clarity:** Display the business currency consistently and format dates and amounts clearly.

## 3. Two Report Types

### 3.1 Statistical Report

The Statistical Report is a factual presentation of recorded business financial activity.

It may include:

* Recorded financial totals and balances.
* Income and expense breakdowns.
* Cash inflows, outflows, and net cash flow.
* Receivables and payables.
* Period-by-period tables and charts.
* Transaction, invoice, bill, and payment counts.
* Descriptive statistics such as averages, medians, counts, and proportions where meaningful.
* Comparisons with a previous period when the comparison is valid.
* Neutral data-coverage information.

It must NOT include:

* Financial risk scores or ratings.
* Risk labels or risk assessments.
* Risk-oriented recommendations.
* Interpretations claiming that the business or a customer is financially safe or unsafe.
* Hypothetical Risk Simulator outcomes mixed with actual financial results.

Neutral data-quality messages are permitted. For example, "Records are available for 8 of the 12 months" describes data coverage rather than assessing risk.

### 3.2 Risk Overview Report

The Risk Overview Report contains the relevant statistical information plus a separate **Financial Risk Assessment** section.

Depending on the report type and available data, the assessment may cover:

* Changes in available cash and net cash flow.
* Outstanding and overdue customer receivables.
* Historical customer payment behaviour, where enough completed-payment data exists.
* Outstanding, overdue, and upcoming supplier obligations.
* Cash-buffer changes and potential cash-flow pressure.
* Significant changes compared with a valid previous period.
* Evidence-supported customer payment patterns.
* Data limitations that affect the reliability of an observation.
* Practical, evidence-based next steps.

Risk observations must be linked to visible figures or clearly identified evidence.

Recommendations must be proportionate to the available data. They must not be presented as guaranteed outcomes or professional financial advice.

**Risk scoring is not defined by this specification.** No risk score, threshold, or rating formula may be invented during UI implementation. Any scoring system requires a separately defined and validated methodology.

---

## 4. Report Categories

FlowTrust will support five report categories:

1. Weekly Financial Report.
2. Monthly Financial Report.
3. Yearly Financial Report.
4. Individual Customer Report.
5. Individual Supplier Report.

Each category must support both Statistical and Risk Overview versions.

## 5. Weekly Financial Report

### Statistical Report

May include:

* Opening available cash for the selected week, where supported by the records.
* Closing available cash for the selected week, where supported by the records.
* Recorded cash inflows and outflows.
* Net cash flow.
* Income and expense breakdowns.
* Receivables and payables figures relevant to the period.
* Transactions grouped by date or category.
* Comparison with the previous week when the comparison is meaningful.

### Risk Overview Report

Includes the relevant statistical information and adds:

* Significant cash-flow movements.
* Changes in the cash position.
* Overdue customer receivables.
* Upcoming supplier payment obligations.
* Changes in the available cash buffer.
* Evidence of possible short-term cash-flow pressure.
* Relevant limitations and practical next steps.

The report must not treat a single unusual transaction as a long-term trend without supporting evidence.

## 6. Monthly Financial Report

### Statistical Report

May include:

* Recorded cash inflows and outflows.
* Net cash flow.
* Income and expense breakdowns by category.
* Receivables and payables.
* Transaction counts and relevant descriptive statistics.
* Comparison with the previous month, provided the periods are comparable.

### Risk Overview Report

Adds:

* Changes in cash position and cash-flow patterns.
* Overdue receivables and observed payment-delay patterns.
* Upcoming supplier obligations and their relevance to cash planning.
* Cash-buffer changes.
* Sustainability or runway observations only when the underlying data supports a defensible calculation.
* Evidence-based observations and practical next steps.

Comparisons must use consistent date ranges and financial definitions. Missing records must not automatically be interpreted as zero activity.

## 7. Yearly Financial Report

### Reporting Convention

The initial version will use the Indian financial-year convention:

**April 1 through March 31.**

For example, FY 2026–27 runs from April 1, 2026, through March 31, 2027.

A configurable financial-year start date is future scope. The initial version must consistently use the April–March cycle.

### Statistical Report

May include:

* Annual recorded cash inflows and outflows.
* Net cash flow for the financial year.
* Income and expense breakdowns by category.
* Month-by-month financial figures.
* Monthly cash-flow comparisons.
* Receivables and payables, with the relevant reporting or "as of" date clearly identified.
* Available-cash trends where the records support them.
* Descriptive statistics.
* Comparison with the previous financial year when valid and sufficiently supported by data.

### Risk Overview Report

Adds:

* Months with significant cash-flow changes or possible pressure.
* Changes in the available cash buffer.
* Trends in overdue receivables.
* Completed-payment delay patterns where sufficient data exists.
* Outstanding and upcoming supplier obligations.
* Concentrations of financial pressure during particular periods.
* Evidence-based annual risk observations.
* Practical next steps grounded in recorded financial information.

### Partial-Year Safeguard

The report must clearly identify which dates are covered by the available records.

If the business has only three months of records for a financial year, the report must not imply that those records represent a complete twelve-month financial history.

Missing months must not be treated as months with zero activity unless that conclusion is explicitly supported by the data.

## 8. Individual Customer Report

The Individual Customer Report focuses on one selected customer over a selected period or across the available history.

### Statistical Report

May include:

* Total invoiced amount.
* Total amount received.
* Current outstanding amount.
* Current overdue amount.
* Invoice and payment counts.
* Completed-payment history.
* Average payment delay, if sufficient completed-payment observations exist.
* Median payment delay, if sufficient completed-payment observations exist.
* On-time payment rate, where meaningful.
* Late-payment counts and proportions, where meaningful.
* Period-by-period payment statistics.
* Historical trends when supported by enough data.

### Risk Overview Report

Adds:

* Evidence-supported observations about outstanding and overdue receivables.
* Historical customer payment behaviour.
* The potential effect of outstanding or delayed receipts on business cash flow.
* Changes in payment patterns when the number and coverage of observations support a meaningful comparison.
* Relevant limitations and suggested next steps.
* A clear "Insufficient data" state when a dependable conclusion cannot be made.

### Payment-Delay Rules

Historical payment-delay statistics must be calculated using completed payments only, according to the centrally defined financial rules.

Unpaid invoices must be assessed separately using information such as:

* Outstanding amount.
* Overdue amount.
* Days overdue.

Unpaid invoices must not be mixed into historical completed-payment delay averages or medians.

Partial payments must follow one consistent, centrally defined calculation method.

Regression, trend analysis, or predictive insights must only be enabled when the required data-sufficiency and validation rules are met.

The system must not claim causation or produce reliable-sounding predictions from a small number of records.

## 9. Individual Supplier Report

The Individual Supplier Report focuses on one selected supplier over a selected period or across the available history.

### Statistical Report

May include:

* Total billed amount.
* Total amount paid.
* Current outstanding amount.
* Current overdue amount.
* Bill and payment counts.
* Payment history.
* Upcoming payment obligations, where available.
* Period-by-period financial figures.
* Comparisons with previous periods where meaningful.

### Risk Overview Report

Adds:

* Outstanding supplier obligations.
* Overdue supplier obligations.
* Upcoming payments relevant to cash planning.
* Changes in payable exposure.
* Concentrations of payments during particular periods.
* Evidence-supported observations about the timing and financial impact of obligations.
* Practical cash-planning considerations.

The initial version must not make unsupported claims about supplier delivery quality, product quality, or operational reliability.

Supplier insights should focus on financial obligations and their potential impact on business cash planning unless the product later collects reliable evidence about other supplier attributes.

---

## 10. Financial Risk Assessment Structure

The Risk Overview Report may use the following structure, including only the sections relevant to the selected report.

### 10.1 Financial Position

Summarize available cash and relevant changes during the selected period.

### 10.2 Cash-Flow Overview

Present recorded inflows, outflows, net cash flow, and meaningful changes over time.

### 10.3 Receivables Exposure

Summarize outstanding and overdue customer amounts, along with completed-payment behaviour where sufficient data exists.

### 10.4 Payables Exposure

Summarize outstanding, overdue, and upcoming supplier obligations.

### 10.5 Cash Buffer

Show observed changes in the cash buffer.

Runway or sustainability metrics may be included only when the underlying calculations are defensible and the available data supports them.

### 10.6 Changes Over Time

Compare the current period with a valid previous period or financial year.

### 10.7 Key Observations

Present evidence-linked findings and disclose relevant data limitations or sample-size constraints.

### 10.8 Suggested Next Steps

Provide practical suggestions grounded in the available records.

Not every report must contain every section. For example, a customer report should primarily focus on that customer and explain the potential impact of outstanding receipts on the business.

---

## 11. Separation of Actuals, Analytics, Estimates, and Simulations

Reports must clearly distinguish four categories.

### Recorded Actuals

Figures derived from actual entered or imported transactions, invoices, bills, payments, and balances.

### Descriptive Analytics

Summaries such as totals, averages, medians, payment rates, counts, and historical trends.

### Estimates or Projections

Forward-looking figures calculated using defined assumptions. These must be explicitly labelled as estimates and included only where supported.

### Hypothetical Scenarios

Outputs produced by the Risk Simulator.

These are hypothetical outcomes, not recorded financial events.

The Statistical Report must exclude Risk Simulator outcomes by default.

If scenario results are introduced as a future optional appendix, they must be explicitly labelled as hypothetical and kept separate from actual financial results.

AI-generated explanations must use validated figures and respect the same limitations. AI must not invent calculations, fill missing data with fabricated values, or override deterministic financial results.

---

## 12. Period Selection and Comparisons

* Support weekly, monthly, and financial-year reporting.
* Support individual customer and supplier reporting.
* Allow a suitable reporting period to be selected for each report.
* Use April 1 through March 31 for financial-year reports in the initial version.
* Compare against a previous period only when the date ranges and data coverage make the comparison meaningful.
* Clearly label the comparison period.
* Do not interpret missing records as zero activity.
* Do not show misleading percentage changes when the baseline is zero, unavailable, or unsuitable.
* If a comparison is unavailable or unreliable, explain why.
* Clearly identify whether a figure represents activity during a period or a balance as of a particular date.

---

## 13. Printing and PDF Output

The initial version will use the browser's built-in **Print → Save as PDF** workflow.

A dedicated PDF-generation service is not required for the initial version.

Printed reports must:

* Have a clear title.
* Identify whether the report is a Statistical Report or Risk Overview Report.
* Display the business/workspace name.
* Display the selected period.
* Display the report generation date.
* Display the currency where applicable.
* Disclose relevant data coverage and limitations.
* Use readable headings, figures, and tables.
* Avoid clipping important values.
* Handle page breaks sensibly.
* Repeat table headers across pages where supported by browser printing.
* Keep charts readable and provide suitable labels or tables where needed.
* Exclude navigation, interactive controls, sliders, and dashboard-only elements.
* Keep the Financial Risk Assessment clearly separated from factual statistics.

Printing or saving a report must not modify financial records.

---

## 14. Data Integrity, Privacy, and Access Control

* Use validated financial records and centralized financial calculations.
* Scope every report query to the active business workspace.
* Enforce authorization on the server.
* Do not rely on frontend filtering as a security mechanism.
* Customer reports must include only records linked to the selected customer through stable IDs.
* Supplier reports must include only records linked to the selected supplier through stable IDs.
* Generating a report must not modify transactions, invoices, bills, payments, customers, or suppliers.
* Prevent information from another workspace from appearing through queries, cached results, URLs, or exports.
* Avoid including unnecessary personal information in printed reports.
* Do not expose environment variables, credentials, or other secrets through reports.

---

## 15. Empty, Incomplete, and Error States

The reporting system must handle:

* No records in the selected period.
* Partial coverage of a week, month, or financial year.
* Missing opening balances.
* Incomplete historical records.
* No prior period available for comparison.
* Customers or suppliers with no completed payments.
* Too few observations for meaningful averages, medians, payment rates, trends, or regression.
* Partial payments.
* Cancelled invoices and bills according to the central financial rules.
* Invalid reporting periods.
* Unavailable data.
* Report-generation failures.

Examples of suitable messages:

* "No records were found for this period."
* "Data is available for only part of the selected financial year."
* "Insufficient completed payments to calculate a reliable payment-delay statistic."
* "A prior-period comparison is unavailable for this selection."

Do not silently replace missing or unavailable data with zero.

---

## 16. Testing Requirements

Tests must verify:

* Correct date boundaries for weekly reports.
* Correct month boundaries for monthly reports.
* Correct financial-year boundaries.
* FY 2026–27 runs from April 1, 2026, through March 31, 2027.
* Financial totals match the centralized finance modules.
* Category breakdowns match the underlying records.
* Partial payments and cancelled records follow the shared financial rules.
* Unpaid invoices are excluded from historical completed-payment delay statistics.
* Statistical Reports contain no risk scores, risk labels, risk recommendations, or risk assessments.
* Risk Overview Reports add assessments without changing the underlying factual figures.
* Recorded actuals, estimates, and hypothetical scenarios remain distinct.
* Partial data is disclosed clearly.
* Customer reports include only the selected customer's linked records.
* Supplier reports include only the selected supplier's linked records.
* Workspace isolation and server-side authorization are enforced.
* Printed reports display the correct title, report type, period, and currency.
* Printed output remains readable across page breaks.
* Report generation does not mutate financial records.

---

## 17. Definition of Done

The feature is complete when:

* Users can generate weekly financial reports.
* Users can generate monthly financial reports.
* Users can generate financial-year reports.
* Users can generate individual customer reports.
* Users can generate individual supplier reports.
* Every report category supports both Statistical and Risk Overview versions.
* Statistical Reports present factual figures and descriptive statistics without risk assessment.
* Risk Overview Reports add relevant, evidence-supported financial-risk observations.
* Financial-year reports consistently follow the April 1–March 31 convention.
* Metrics reuse centralized and tested financial definitions.
* Incomplete coverage and insufficient data are disclosed clearly.
* Invalid or misleading comparisons are avoided.
* Reports respect active-workspace isolation and server-side authorization.
* Browser printing produces a readable Save-as-PDF result.
* Tests cover period boundaries, calculations, data limitations, report-type separation, and access control.

---

## 18. Future Scope

The following features are not part of the initial implementation unless explicitly promoted into scope:

* Configurable financial-year start date.
* Scheduled reports.
* Automatic report delivery by email.
* Dedicated PDF-generation service.
* Advanced branded PDF templates.
* Custom report builders.
* Advanced audit trails and version history.
* External accounting and bank integrations.
* Predictive risk scores without a separately specified and validated methodology.
* Advanced regression or predictive models beyond the agreed data-sufficiency rules.
* Automatic AI-generated financial conclusions that bypass validated calculations.
* Combining Risk Simulator scenarios with actual figures in ways that could confuse users.
* Additional supplier performance metrics based on separately collected, reliable evidence.

---

## 19. Open Decisions for the Shared Finance-Calculation Specification

This document defines report scope and presentation, not every financial formula.

The following must be finalized in the shared finance-calculation specification before implementation:

* Exact definitions of opening and closing available cash.
* Rules for assigning cash movements to reporting periods.
* Treatment of partial payments, cancellations, refunds, and adjustments.
* Definitions of payment delay, on-time payment, and late payment.
* Minimum sample sizes and validation requirements for averages, medians, rates, trends, and regression.
* Conditions under which cash buffer, runway, or sustainability can be reported.
* Any risk scores, risk thresholds, or scoring weights. This specification does not authorize any particular score.
* Rounding rules and currency precision.
* Handling of missing, incomplete, or inconsistent records.

**Implementation rule:** The frontend may determine the visual hierarchy, layout, charts, tables, responsive behaviour, and print presentation. It must not independently change financial formulas, risk methodology, data access rules, or the definitions established by the backend and shared finance modules.
