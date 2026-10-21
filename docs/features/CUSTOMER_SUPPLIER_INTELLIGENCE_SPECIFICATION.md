# FlowTrust — Customer & Supplier Intelligence Specification

**Status:** Approved Authoritative MVP Specification (v2.0 — Product Scope + Finalized Payment-Delay Formulas, Sample-Size Rules, Risk Indicator Matrix & Entity Lifecycle)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Authoritative Scope:** Customer & Supplier Directories, Financial Profiles, Payment-Delay Mathematics, On-Time Payment Rate, Sample-Size Sufficiency Rules, Explainable Customer Risk Indicators, Supplier Obligation Planning, and Entity Archiving  
**Related Specifications:** [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) · [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) · [REPORTS_SPECIFICATION.md](./REPORTS_SPECIFICATION.md) · [UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md](../design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md)

---

## 1. Product Goal

FlowTrust helps a small-business owner understand the financial relationship they have with each customer and supplier—not merely store names and contact details.

The feature makes it easy to answer:
- How much does each customer currently owe the business, and how much of that is overdue?
- How has the customer paid historically across completed invoices?
- Are payment delays becoming longer where enough completed-payment history exists to assess this?
- Which supplier bills are outstanding, overdue, or coming due within the next 7 or 30 days?
- How much cash is needed for upcoming supplier obligations?
- What does the recorded evidence show, and where is history too limited to draw a conclusion?

All metrics are deterministic (`lib/finance/intelligence.ts`), traceable to underlying invoices, bills, and payments, and honest about insufficient data.

---

## 2. Dedicated Directories & Entity Lifecycle (Preserved & Finalized)

### 2.1 Separate Customers and Suppliers Directories
FlowTrust provides separate **Customers** (`/customers`) and **Suppliers** (`/suppliers`) directories.
* Each directory entry is stored in `customers` or `suppliers` with a stable UUID primary key (`id`) scoped to `business_id`.
* Invoices (`invoices.customer_id`), bills (`bills.supplier_id`), and transactions/payments link strictly to these UUIDs rather than fragile free-text names.
* If the same external company both buys from and sells to the business, it is represented as one record in `customers` and one record in `suppliers` so receivable and payable metrics remain unambiguous.

### 2.2 Entity Fields & Validation
* **Required Field:** `name` (trimmed non-empty string, `1..160` characters).
* **Optional Fields:** `external_code` (e.g., `CUST-001`), `email` (validated format if non-empty), `phone`, `address`, `notes`.
* **Status:** `'ACTIVE'` (default) or `'ARCHIVED'`.

### 2.3 Creating, Editing, Searching, and Duplicate Warnings
1. **Directory & Inline Creation:** Users can create a customer or supplier either from the directory page or inline from the `Create Invoice` / `Create Bill` modal via a searchable combobox (`"+ Create new customer '[Typed Name]'"`) without losing their form progress.
2. **Non-Destructive Duplicate Warning:** When creating or editing an entity whose normalized `name` (trimmed, case-insensitive) or `email`/`phone` matches an existing entity in the same workspace, FlowTrust displays a warning (`"A customer named 'Sahyadri Foods' already exists. Select the existing customer or confirm creating a separate record."`). It never silently merges two records, and allows legitimate distinct entities to coexist if confirmed.
3. **Editing Details:** Updating `name`, `email`, `phone`, `address`, or `notes` updates the entity record immediately; because all historical invoices, bills, and payments link via `customer_id` / `supplier_id`, historical continuity is preserved automatically.

### 2.4 Archiving vs. Deletion Integrity Rule
* **Soft Archiving (`status = 'ARCHIVED'`):** Any customer or supplier with $\ge 1$ linked `invoices`, `bills`, `transactions`, or `payments` **cannot be hard-deleted** (`ON DELETE RESTRICT`). Instead, the user archives the entity (`status = 'ARCHIVED'`).
* **Behavior After Archiving:**
  * Archived entities are hidden from the default `"Active"` directory filter (viewable via the `"Show Archived"` filter) and excluded from new invoice/bill creation dropdowns (unless unarchived).
  * All historical invoices, bills, payments, dashboard receivables/payables totals, and reports linked to an archived customer or supplier remain 100% intact and queryable.
* **When Hard Deletion Is Permitted:** Hard deletion of a customer or supplier record is permitted **only** if the entity has zero linked `invoices`, `bills`, `transactions`, and `payments` (e.g., a newly created typo entry with no financial history).

---

## 3. Finalized Customer Payment-Delay Mathematics (`lib/finance/intelligence.ts`)

### 3.1 Core Separation Principle
Historical payment behaviour metrics (`Average Payment Delay`, `Median Payment Delay`, `On-Time Payment Rate`) are calculated **exclusively from completed (`PAID`) invoices**. Currently unpaid (`UNPAID`) and partially paid (`PARTIALLY_PAID`) invoices are analyzed separately as **Current Receivables & Overdue Exposure** and are never mixed into completed historical delay averages.

### 3.2 Eligibility Criteria for Historical Payment-Delay Calculation
An invoice $i$ belonging to customer $C$ is included in the completed-payment sample set $\mathcal{I}_{\text{completed}}(C)$ if and only if:
1. $i.\text{status} == \text{'PAID'}$ (and $i.\text{is\_cancelled} == \text{false}$),
2. $i.\text{due\_date IS NOT NULL}$, and
3. $i$ has $k \ge 1$ active linked payment allocations $p_{i,1}, \dots, p_{i,k}$ with valid `payment_date`s such that $\sum_{j=1}^{k} p_{i,j}.\text{allocated\_amount} == i.\text{total\_amount}$.

Let $N_{\text{eligible}} = |\mathcal{I}_{\text{completed}}(C)|$ be the number of eligible completed invoices for customer $C$.

### 3.3 Treatment of Each Invoice & Payment Case

| Case | Treatment in Historical Payment-Delay Calculation | Treatment in Current Exposure Metrics |
|---|---|---|
| **1. Fully Paid Invoice (Single Payment $p_1$)** | Included in $\mathcal{I}_{\text{completed}}(C)$. Delay is $\text{delay\_days}_i = p_1.\text{payment\_date} - i.\text{due\_date}$ (in calendar days). | `outstanding_amount = ₹0` |
| **2. Fully Paid Invoice (Multiple Partial Payments $p_1, \dots, p_k$)** | Included as **one single invoice observation** ($N_{\text{eligible}}$ increments by 1, never by $k$). Invoice delay is the **amount-weighted average delay**: $\text{delay\_days}_i = \frac{\sum_{j=1}^{k} p_{i,j}.\text{allocated\_amount} \times (p_{i,j}.\text{payment\_date} - i.\text{due\_date})}{i.\text{total\_amount}}$. The final settlement date is $d_{\text{final},i} = \max_j(p_{i,j}.\text{payment\_date})$. | `outstanding_amount = ₹0` |
| **3. Payment Received Before Due Date ($p.\text{payment\_date} < i.\text{due\_date}$)** | Produces a negative `delay_days` value (e.g., `-4 days` = paid 4 days early). Preserved as negative in signed Average/Median Delay so early payers are accurately represented; also reported alongside `Average Late Delay (late invoices only)`. | Counted as **On-Time** (`<= 0 days delay`). |
| **4. Payment Received On Due Date ($p.\text{payment\_date} == i.\text{due\_date}$)** | $\text{delay\_days}_i = 0$. | Counted as **On-Time**. |
| **5. Payment Received After Due Date ($p.\text{payment\_date} > i.\text{due\_date}$)** | Produces a positive `delay_days` value (e.g., `+14 days` = paid 14 days late). | Counted as **Late** (`> 0 days delay`). |
| **6. Currently Partially Paid Invoice (`PARTIALLY_PAID`)** | **Excluded** from $\mathcal{I}_{\text{completed}}(C)$ until the remaining balance is settled (prevents premature distortion of completed invoice averages). Prior partial payments are listed in the invoice's payment timeline. | Remaining `outstanding_amount` included in `Current Outstanding Receivables` (and `Overdue Receivables` if `due_date < current_date`). |
| **7. Currently Unpaid Invoice (`UNPAID`)** | **Excluded** from $\mathcal{I}_{\text{completed}}(C)$. | Full `total_amount` included in `Current Outstanding Receivables` (and `Overdue Receivables` if `due_date < current_date`). |
| **8. Invoice With No Due Date (`due_date IS NULL`)** | **Excluded** from $\mathcal{I}_{\text{completed}}(C)$ even if `PAID`, because delay relative to a contractual due date is undefined. | Disclosed as `"Excluded from delay stats (no due date): [count] invoice(s)"`. |
| **9. Cancelled Invoice (`CANCELLED`)** | **Excluded** from all delay and receivable calculations. | Shown in history table with `Cancelled` badge only. |
| **10. Unlinked Direct Customer Receipt (`DIRECT_INCOME`)** | **Excluded** from $\mathcal{I}_{\text{completed}}(C)$ because no invoice `due_date` exists. | Included in `Cash Inflows` ledger. |

### 3.4 Aggregate Delay Formulas (When $N_{\text{eligible}} \ge 3$)
For a customer with eligible completed invoice delays $D = [\text{delay\_days}_1, \dots, \text{delay\_days}_N]$ sorted ascending ($N = N_{\text{eligible}} \ge 3$):
1. **Average Payment Delay (Signed):**
   $$\text{Average Delay (days)} = \frac{1}{N} \sum_{i=1}^{N} \text{delay\_days}_i \quad (\text{rounded to 1 decimal place})$$
2. **Median Payment Delay (Signed, Robust to Outliers):**
   $$\text{Median Delay (days)} = \begin{cases} D_{(N+1)/2} & \text{if } N \text{ is odd} \\ \frac{D_{N/2} + D_{N/2 + 1}}{2} & \text{if } N \text{ is even} \end{cases}$$
3. **UI Sign Formatting:**
   * Positive values (`> 0`): Formatted as `+X.X days late`
   * Zero (`0.0`): Formatted as `On due date (0 days)`
   * Negative values (`< 0`): Formatted as `X.X days early`

---

## 4. Finalized On-Time Payment Rate & Sample-Size Rules

### 4.1 Definition of an On-Time Completed Invoice
An eligible completed invoice $i \in \mathcal{I}_{\text{completed}}(C)$ is counted as **Paid On Time** if and only if its final settling payment occurred on or before its contractual due date:
$$d_{\text{final},i} = \max_{j} (p_{i,j}.\text{payment\_date}) \le i.\text{due\_date}$$
*(Rationale: If an invoice due on 10 Oct had 40% paid on 9 Oct and 60% paid on 25 Oct, the invoice was not fully settled on time by its due date, so $d_{\text{final},i} > i.\text{due\_date}$ and it is classified as a late settlement for On-Time Rate purposes while its partial early payment reduces its amount-weighted delay in §3.3).*

### 4.2 Denominator & Formula
The denominator is strictly $N_{\text{eligible}}$ (the count of fully `PAID` non-cancelled invoices with a non-null `due_date`):
$$\text{On-Time Payment Rate (\%)} = \text{round}_1\left(\frac{\left|\{i \in \mathcal{I}_{\text{completed}}(C) : d_{\text{final},i} \le i.\text{due\_date}\}\right|}{N_{\text{eligible}}} \times 100\right)$$

### 4.3 Sample-Size Sufficiency Rules (Finalized MVP Threshold: $N_{\text{eligible}} \ge 3$)
To prevent misleading percentages (such as declaring a customer `"100% Reliable"` or `"0% On-Time"` from a single historical invoice), FlowTrust enforces a **minimum sample size of $N_{\text{eligible}} \ge 3$ completed invoices** for statistical summary rates and behavioural classifications:

| Completed Eligible Invoices ($N_{\text{eligible}}$) | Display of Delay & On-Time Metrics | Behavioural Classification Eligibility |
|---|---|---|
| **$N_{\text{eligible}} = 0$** | Displays **`Insufficient data (0 completed invoices with due dates)`** instead of `0%` or `0 days`. | Ineligible for historical behavioural rating (`Insufficient Data`, unless current overdue exposure exists). |
| **$1 \le N_{\text{eligible}} \le 2$** | Displays raw factual observation text only: e.g., **`"1 of 2 completed invoices paid on time (Last delay: +4 days) — Minimum 3 completed invoices required for statistical averages"`**. Does not render summary percentage KPI cards. | Historical behaviour marked `Insufficient History (n = 1..2)`. Current overdue invoices are still flagged immediately! |
| **$N_{\text{eligible}} \ge 3$** | Displays **`On-Time Payment Rate (%)`**, **`Median Payment Delay`**, and **`Average Payment Delay`**, always suffixed with sample count **`(n = N invoices)`**. | Eligible for full Customer Collection Risk Indicator evaluation. |

---

## 5. Finalized Customer Risk Indicator Specification

FlowTrust does **not** use an opaque 0–100 credit score or claim to compute a statistical probability of default. Instead, every customer profile and directory row displays a **transparent, rule-based Customer Collection Indicator** evaluated from two explicit dimensions:
1. **Current Overdue Exposure** (`overdue_amount` and `max_days_overdue` across currently open invoices).
2. **Historical Settlement Behaviour** (`median_delay_days` and `on_time_rate_pct` when $N_{\text{eligible}} \ge 3$).

### 5.1 Deterministic Classification Rules (Evaluated in Priority Order)

| Priority | Indicator Label | Trigger Condition | Required Explanation Template Shown in UI |
|---|---|---|---|
| **1 (Highest)** | **`Elevated Overdue Exposure`** | (`overdue_amount > 0` AND `max_days_overdue > 30`) **OR** (`overdue_amount > 0` AND $N_{\text{eligible}} \ge 3$ AND (`median_delay_days > 15` OR `on_time_rate_pct < 50%`)) | `"₹[overdue_amount] is currently overdue (up to [max_days_overdue] days past due)[; historical median delay is +X days across n completed invoices]."` |
| **2** | **`Watch — Payment Delays`** | (`overdue_amount > 0` with `1 <= max_days_overdue <= 30`) **OR** (`overdue_amount == 0` AND $N_{\text{eligible}} \ge 3$ AND (`median_delay_days > 7` OR `on_time_rate_pct < 75%`)) | If overdue: `"₹[overdue_amount] is [max_days_overdue] days past due."` Else: `"No current overdue balance, but historical payments averaged/medianed +[X] days past due ([on_time_rate]% on-time across [n] invoices)."` |
| **3** | **`Regular Payer`** | `overdue_amount == 0` **AND** $N_{\text{eligible}} \ge 3$ **AND** `on_time_rate_pct >= 75%` **AND** `median_delay_days <= 7` | `"No overdue balance; [on_time_rate]% of completed invoices paid on time (median [delay] days across [n] invoices)."` |
| **4 (Default)** | **`Insufficient Data`** | `overdue_amount == 0` **AND** $N_{\text{eligible}} < 3$ | `"No overdue balance; fewer than 3 completed invoices with due dates ([n] recorded) to establish a historical payment pattern."` |

> **Important Safeguard:** Notice that if a brand-new customer ($N_{\text{eligible}} = 0$) has an active invoice that is currently 10 days overdue, Priority 2 (**`Watch — Payment Delays`**) or Priority 1 (**`Elevated Overdue Exposure`** if $>30$ days overdue) triggers immediately based on the **factual current overdue balance**, while explicitly stating `"Historical completed invoices: 0"`. Conversely, a new customer with $N_{\text{eligible}} < 3$ and ₹0 overdue is **never** penalized as high risk and receives **`Insufficient Data`**.

---

## 6. Trend Analysis and Regression Decision

### 6.1 Approved for MVP: Simple Descriptive Recent-vs-Prior Trend ($N_{\text{eligible}} \ge 6$)
* When a customer has **$N_{\text{eligible}} \ge 6$ completed eligible invoices** ordered chronologically by `issue_date`:
  * FlowTrust compares the **median payment delay of the 3 most recent completed invoices** ($\text{Median}_{\text{recent},3}$) against the **median payment delay of the preceding completed invoices** ($\text{Median}_{\text{prior}}$):
    $$\Delta_{\text{trend}} = \text{Median}_{\text{recent},3} - \text{Median}_{\text{prior}}$$
  * **Classification:**
    * $\Delta_{\text{trend}} \ge +5.0\text{ days}$: `"Observed payment delays have increased recently (recent median +[A]d vs prior +[B]d)."`
    * $\Delta_{\text{trend}} \le -5.0\text{ days}$: `"Observed payment timing has improved recently (recent median [A]d vs prior [B]d)."`
    * $|\Delta_{\text{trend}}| < 5.0\text{ days}$: `"Observed payment timing has remained relatively stable across recent invoices."`
* When $N_{\text{eligible}} < 6$: Trend comparison displays **`"Insufficient history for trend comparison (requires at least 6 completed invoices; [n] available)"`**.

### 6.2 Deferred to Future Scope: Linear / Multivariate Regression
* Formal Ordinary Least Squares (OLS) regression (e.g., regressing delay days against time or invoice size, computing $R^2$ / $p$-values, or predicting exact future payment dates via regression) is **explicitly deferred to post-MVP future scope**.
* **Rationale:** In small-business datasets where most individual customers have 1 to 10 invoices, linear regression produces noisy slopes with wide confidence intervals that risk misleading non-technical business owners. The $N \ge 6$ descriptive median comparison above delivers transparent, robust trend visibility without false statistical precision.

---

## 7. Supplier Intelligence and Cash-Planning Obligations

Supplier profiles and directory views focus strictly on **outgoing financial obligations and cash planning**:

### 7.1 Approved Supplier Metrics
1. **Total Billed Amount:** Sum of `bills.total_amount` (excluding `CANCELLED`) for the selected period or available history.
2. **Total Amount Paid:** Sum of active `payments.allocated_amount` linked to the supplier's bills.
3. **Current Outstanding Payable:** Sum of `outstanding_amount` across all `UNPAID` and `PARTIALLY_PAID` bills for the supplier.
4. **Overdue Payable:** Sum of `outstanding_amount` on open bills where `due_date < current_date` (plus `max_days_overdue`).
5. **Bills Due Soon (Finalized MVP Default Window: Next 7 Calendar Days):**
   * Sum of `outstanding_amount` and count of open bills where `current_date <= due_date <= current_date + 7 days`.
   * Also displays a secondary **`Due in 8–30 Days`** obligation total for monthly cash planning.
6. **Our Payment History Summary:** Factual record of past payments made to the supplier (`count of paid bills`, `last payment date`, and `our median payment timing relative to bill due date` when $\ge 3$ bills are settled, explicitly labelled **`"Our Payment Timing"`**—never labelled as a rating of supplier reliability).

### 7.2 Strictly Prohibited Supplier Claims
FlowTrust must **never** display supplier delivery reliability scores, defect/quality ratings, lead-time scores, or labels implying operational trustworthiness unless dedicated operational evidence tables are introduced in a future version.

---

## 8. Acceptance Criteria & Required Tests

1. Separate searchable `Customers` and `Suppliers` directories with stable UUIDs and inline creation from Invoice/Bill modals.
2. Archiving a customer or supplier with linked records preserves 100% of historical invoices, bills, payments, and report figures while preventing hard deletion.
3. Completed-payment delay metrics (`Average Delay`, `Median Delay`, `On-Time Rate`) exclude `UNPAID`, `PARTIALLY_PAID`, `CANCELLED`, and `due_date IS NULL` invoices.
4. Multi-payment settled invoices increment $N_{\text{eligible}}$ by `1` (using amount-weighted delay for average/median and final settlement date for on-time rate).
5. Customers with $N_{\text{eligible}} < 3$ display explicit `Insufficient data` states for statistical averages and rates.
6. Customer Collection Indicators match the 4-tier deterministic rule matrix in Section 5.1 and always render their factual explanation string.
7. Supplier profiles display `Outstanding Payable`, `Overdue Payable`, and `Bills Due Soon (Next 7 Days)` without any unsupported quality/delivery claims.

