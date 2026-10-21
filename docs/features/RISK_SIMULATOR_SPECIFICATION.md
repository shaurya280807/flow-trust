# FlowTrust — Risk Simulator MVP Specification

**Status:** Approved Authoritative MVP Specification (v2.0 — Product Scope + Finalized Financial Formulas, Baseline Model, Scenario Rules & Test Cases)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Authoritative Scope:** Interactive Risk Simulator Controls, Projection Horizons, Baseline Cash-Flow Model, Scenario Transformation Rules, Combined Scenario Math, Output Metrics, Cash Buffer Thresholds, Saved Scenarios, and Verification Suite  
**Related Specifications:** [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) · [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) · [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](./CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) · [UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md](../design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md)

---

## 1. Product Goal & Core Principles

The Risk Simulator helps a small-business owner explore **“what if?”** financial situations before they happen. Users adjust intuitive horizontal controls and immediately see how plausible financial pressures could affect the business's future cash position.

### Core Principles (Preserved & Finalized)
1. **Planning Tool, Not a Prediction Guarantee:** Results are scenario estimates based on available business records and explicitly displayed assumptions.
2. **Strict Separation from Actual Records:** Running, adjusting, saving, reopening, or resetting a simulation **never** creates, modifies, or deletes actual `transactions`, `invoices`, `bills`, `payments`, or `businesses.opening_cash_balance`.
3. **Deterministic Calculations First:** All baseline and scenario formulas execute inside `lib/finance/simulator.ts`. Neither UI components nor the AI Copilot may independently improvise or alter simulator arithmetic.
4. **Honest Treatment of Missing Data:** Where historical records or document due dates are missing or insufficient, the simulator surfaces an explicit limitation disclosure rather than inventing financial certainty.

---

## 2. Finalized Scenario Inputs and Configurable MVP Bounds

The simulator supports four combinable scenario inputs. Every slider is paired with a synchronized direct numeric input so users can either drag smoothly or type an exact value.

| Scenario Input | Parameter Key | Primary Slider Range (Step) | Allowed Numeric Input Bounds | Default (Baseline) |
|---|---|---|---|---|
| **1. Revenue Decline** | `revenueDeclinePct` | `0%` to `50%` (step `1%`) | `0%` to `100%` | `0%` |
| **2. Customer Payment Delay** | `customerDelayDays` | `0 days` to `60 days` (step `1 day`) | `0 days` to `180 days` | `0 days` |
| **3. Unexpected Expense** | `unexpectedExpenseAmount` | `₹0` to `₹5,00,000` (step `₹5,000`)* | `₹0` to `₹10,00,00,000` | `₹0` |
| **3b. Expense Timing** | `unexpectedExpenseDay` | `Day 1 (Immediate)` or selector within `[1..H]` | Integer day offset `1 <= d <= H` | `Day 1` |
| **4. Proposed Investment** | `investment.initialAmount` | `₹0` to `₹10,00,000` (step `₹10,000`)* | `₹0` to `₹10,00,00,000` | `₹0` |
| **4b. Investment Timing** | `investment.plannedDay` | Selector within `[1..H]` | Integer day offset `1 <= d <= H` | `Day 1` |
| **4c. Recurring Monthly Cost** | `investment.recurringMonthlyCost` | Optional numeric input | `₹0` to `₹10,00,00,000` | `₹0` |
| **4d. Estimated Monthly Benefit** | `investment.estimatedMonthlyBenefit` | Optional numeric input + explicit inclusion toggle | `₹0` to `₹10,00,00,000` | `₹0` (`includeBenefit = false`) |

*\*Configurable Slider Scaling Rule:* The slider upper track defaults to `₹5,00,000` for Unexpected Expense and `₹10,00,000` for Proposed Investment, and scales up automatically to `2 × average_monthly_outflows` (rounded to the nearest `₹1,00,000`) for larger businesses so the slider remains practical across business sizes.

---

## 3. Finalized Projection Horizon

### 3.1 Supported Horizons
* **Default Projection Horizon:** **`30 days`** (`H = 30` calendar days forward from `asOfDate`, where `asOfDate` defaults to the workspace's current date $T_0$).
* **Selectable Alternatives:** **`30 days`** (default), **`60 days`**, and **`90 days`**.
* **Rationale:** 30 to 90 days represents the actionable working-capital window for small businesses (covering standard 15–60 day invoice credit terms and monthly rent/salary cycles) without pretending to forecast multi-year macroeconomic trends.

### 3.2 Date Granularity and Chart Aggregation
* **Internal Calculation Granularity:** **Daily (`d = 0, 1, 2, ..., H`)**. Computing balances day-by-day ensures that `Minimum Projected Cash` and the exact date a cash shortfall occurs (`firstShortfallDate`) are captured accurately even when a large supplier bill is due 4 days before a customer invoice is collected.
* **Visual Chart Granularity:**
  * `30-day horizon`: Plotted at **daily** or **weekly (`Day 0, Day 7, Day 14, Day 21, Day 30`)** intervals alongside a Baseline vs. Scenario summary bar comparison.
  * `60-day` & `90-day horizons`: Plotted at **weekly** or **15-day** intervals, always pinning the exact `Minimum Cash Point` marker if it falls between interval ticks.

---

## 4. Authoritative Baseline Projection Model (`lib/finance/simulator.ts`)

The Baseline projection ($C_{\text{base}}(d)$ for $d \in \{0, 1, \dots, H\}$) represents the business's projected cash trajectory when all scenario adjustments are zero (`0%` decline, `0` delay days, `₹0` unexpected expense, `₹0` investment).

### 4.1 Starting Available Cash ($C_0$)
At $d = 0$ (`asOfDate`):
$$C_{\text{base}}(0) = \text{Available Cash}(T_0)$$
computed via the authoritative formula in [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) §14.2 (bank balances + physical cash only; excludes unpaid invoices, unpaid bills, and unsettled payment-gateway balances).

### 4.2 Scheduled Document Cash Flows (Invoices & Bills)
To respect actual open receivables and payables without double-counting:

1. **Scheduled Customer Receivable Inflows ($I_{\text{sched}}(d)$):**
   * **Eligible Open Invoices Due in Future ($T_0 \le \text{due\_date} \le T_0 + H$):**
     Every non-cancelled invoice with `status IN ('UNPAID', 'PARTIALLY_PAID')` and a valid `due_date` falling on day $d = \text{due\_date} - T_0$ contributes its remaining `outstanding_amount` (`total_amount - amount_paid`) to $I_{\text{sched}}(d)$.
   * **Treatment of Currently Overdue Invoices ($\text{due\_date} < T_0$):**
     * Overdue invoices must **not** be assumed to arrive on Day 0/Day 1 (which would falsely inflate immediate cash), nor assumed permanently lost unless aged past a conservative cutoff.
     * **Finalized MVP Rule:**
       * Overdue invoices aged **`1 to 90 days` past `due_date`** ($1 \le T_0 - \text{due\_date} \le 90$) are scheduled at a conservative baseline recovery offset:
         $$d_{\text{overdue\_recovery}} = \min\left(90, \max\left(14, \lceil\text{CustomerMedianDelayDays}\rceil\right)\right)$$
         (defaulting to `Day 14` if customer median delay is `< 14` or unavailable), and flagged in the Assumptions disclosure as `"Overdue receivables recovery estimate"`.
       * Severely overdue invoices aged **`> 90 days` past `due_date`** are **excluded from baseline projected cash inflows** and surfaced in `"Excluded Uncertain Receivables (>90d Overdue)"`.
   * **Treatment of Invoices Missing a Due Date (`due_date IS NULL`):**
     * **Excluded** from $I_{\text{sched}}(d)$ because payment timing cannot be established without inventing a date. Surfaced in the simulator's data-limitations banner (`"[N] open invoice(s) totaling ₹[X] have no due date and are excluded from dated cash projections"`).

2. **Scheduled Supplier Payable Outflows ($O_{\text{sched}}(d)$):**
   * **Eligible Open Bills Due in Horizon ($T_0 \le \text{due\_date} \le T_0 + H$):**
     Every non-cancelled bill with `status IN ('UNPAID', 'PARTIALLY_PAID')` and a valid `due_date` falling on day $d = \text{due\_date} - T_0$ contributes its remaining `outstanding_amount` to $O_{\text{sched}}(d)$.
   * **Treatment of Currently Overdue Bills ($\text{due\_date} < T_0$):**
     * Because a supplier can demand payment of an already-overdue bill immediately, overdue bills are conservatively scheduled on **`Day 1` ($d = 1$)** of the projection horizon (`O_sched(1)`) so the business owner sees the immediate cash pressure required to clear overdue payables.
   * **Treatment of Bills Missing a Due Date (`due_date IS NULL`):**
     * Flagged in the data-limitations banner; excluded from dated daily buckets unless a due date is provided.

### 4.3 Historical Operating Run-Rate for Non-Document Cash Flows ($I_{\text{run}}(d)$ and $O_{\text{run}}(d)$)
Small businesses frequently have direct cash sales (`DIRECT_INCOME`) and recurring operating expenses (`DIRECT_EXPENSE` such as rent, salaries, utilities, and daily operating costs) that are recorded directly as transactions rather than pre-entered as future supplier bills.

1. **Historical Lookback Window ($L$):**
   * Evaluates active settled `transactions` within the trailing $L = \min(90, \text{available\_history\_days})$ calendar days up to $T_0$, where $L$ is the span from the earliest recorded transaction date (or `opening_balance_date`) to $T_0$.
   * **Minimum History Sufficiency Rule:** Requires **$L \ge 14\text{ calendar days}$** and **at least `3` active transactions** to compute a daily operating run-rate.
   * If $L < 14\text{ days}$ or transaction count `< 3`, $I_{\text{run}}(d) = 0$ and $O_{\text{run}}(d) = 0$, and the simulator displays an explicit warning: `"Insufficient historical transaction coverage (<14 days) to estimate recurring daily inflows/outflows; projection reflects scheduled open invoices and bills only."`

2. **Anti-Double-Counting Partition Rule:**
   * **Projected Daily Unbilled Inflow ($I_{\text{run}}(d)$):**
     * If the workspace has open customer invoices, $I_{\text{run}}(d)$ is computed **exclusively from `DIRECT_INCOME` transactions** over the lookback window $L$:
       $$I_{\text{run}}(d) = \frac{1}{L} \sum_{tx \in \mathcal{T}_{L},\, tx.\text{kind} = \text{'DIRECT\_INCOME'}} tx.\text{amount}$$
       (`INVOICE_PAYMENT` transactions are excluded from $I_{\text{run}}$ when open invoices exist so customer collections are not counted both via open invoices and via historical receipt averages).
     * If the workspace does not use customer invoices (`0` open invoices in workspace), $I_{\text{run}}(d)$ includes all historical operating inflows (`DIRECT_INCOME` + `INVOICE_PAYMENT`).
   * **Projected Daily Non-Bill Operating Outflow ($O_{\text{run}}(d)$):**
     * Computed **exclusively from `DIRECT_EXPENSE` transactions** over the lookback window $L$:
       $$O_{\text{run}}(d) = \frac{1}{L} \sum_{tx \in \mathcal{T}_{L},\, tx.\text{kind} = \text{'DIRECT\_EXPENSE'}} tx.\text{amount}$$
       (`BILL_PAYMENT` transactions are excluded when open supplier bills exist so supplier obligations are not double-counted).

3. **Baseline Daily Balance Trajectory:**
   For each day $d \in \{1, \dots, H\}$:
   $$C_{\text{base}}(d) = C_{\text{base}}(d - 1) + I_{\text{sched}}(d) + I_{\text{run}}(d) - O_{\text{sched}}(d) - O_{\text{run}}(d)$$

---

## 5. Scenario Transformation Rules

### 5.1 Scenario 1: Revenue Decline (`revenueDeclinePct`)
* **What It Modifies:** Reduces projected ongoing/new cash inflows by $r = \text{revenueDeclinePct} / 100$:
  * When $I_{\text{run}}(d) > 0$, applies to the daily operating inflow run-rate:
    $$I_{\text{run\_scen}}(d) = I_{\text{run}}(d) \times (1 - r)$$
  * If a business operates 100% on invoiced credit sales ($I_{\text{run}}(d) = 0$, all inflows are in $I_{\text{sched}}$), the simulator applies $(1 - r)$ to scheduled collections on invoices issued within the current cycle (or displays an explicit toggle: `"Apply revenue decline to expected invoice collections"`, enabled automatically when $I_{\text{run}} = 0$ and clearly disclosed in the active assumptions list).
* **Distinction Between Accounting Revenue & Cash Receipts:** The UI helper label beneath the slider states: `"Reduces projected cash inflows over the next [H] days by [X]%."`

### 5.2 Scenario 2: Customer Payment Delay (`customerDelayDays`)
* **What It Modifies:** Shifts every scheduled customer receivable collection in $I_{\text{sched}}$ forward by $\Delta_{\text{delay}} = \text{customerDelayDays}$ calendar days relative to its baseline expected receipt day $d_{\text{base}}$:
  $$d_{\text{scen}} = d_{\text{base}} + \Delta_{\text{delay}}$$
* **Horizon Boundary Effect (`Receivables Shifted Beyond Horizon`):**
  * If $d_{\text{base}} \le H$ and $d_{\text{scen}} > H$, that invoice's remaining `outstanding_amount` no longer arrives within the $H$-day window. It drops out of $[1, H]$ scenario inflows and is added to the **`Receivables Shifted Beyond Horizon`** output metric.
* **Idempotence Guarantee:** `d_scen` is always computed from the immutable baseline schedule (`d_base + customerDelayDays`), never by mutating the previous render's delayed schedule. Moving the slider from `15d` $\rightarrow$ `30d` $\rightarrow$ `15d` produces the exact same numbers every time.

### 5.3 Scenario 3: Unexpected Expense (`unexpectedExpenseAmount`, `unexpectedExpenseDay`)
* **What It Modifies:** Introduces a one-time hypothetical cash outflow $E_{\text{unexp}}(d)$ in workspace currency (`INR`) on day $d = \text{unexpectedExpenseDay}$ (default `d = 1`):
  $$E_{\text{unexp}}(d) = \begin{cases} \text{unexpectedExpenseAmount} & \text{if } d = \text{unexpectedExpenseDay} \\ 0 & \text{otherwise} \end{cases}$$
* **Shortfall Behavior:** If $E_{\text{unexp}}$ causes $C_{\text{scen}}(d) < 0$, the simulator records the exact negative balance (`Minimum Projected Cash`) and highlights the resulting shortfall deficit without clamping the balance to zero.

### 5.4 Scenario 4: Proposed Investment (`investment`)
* **What It Modifies:**
  1. **Initial Outflow:** Deducts `investment.initialAmount` on $d = \text{investment.plannedDay}$ (default `d = 1`).
  2. **Optional Recurring Cost:** Deducts `investment.recurringMonthlyCost` on days $d = \text{plannedDay} + 30, \text{plannedDay} + 60, \dots$ where $d \le H$.
  3. **Optional Estimated Benefit (`estimatedMonthlyBenefit`):**
     * **Never automatically treated as guaranteed income.**
     * By default (`includeBenefitInCash = false`), the simulator calculates the cash position using only the investment's costs and shows the user's entered benefit separately as an unverified assumption (`"User-estimated monthly benefit of ₹[B] not included in guaranteed cash projection"`).
     * If the user explicitly toggles `"Include estimated benefit in scenario cash projection"` (`includeBenefitInCash = true`), `estimatedMonthlyBenefit / 30` is added daily starting after `plannedDay`, and the output carries an explicit badge: **`Includes Unverified Benefit Assumption`**.
* **No False ROI Claim:** The simulator evaluates **cash affordability and liquidity impact** over the horizon $H$; it never claims to calculate net present value (NPV), internal rate of return (IRR), or guaranteed profitability.

---

## 6. Combined Scenario Calculation Formula

When multiple scenario controls are active simultaneously, the scenario cash balance $C_{\text{scen}}(d)$ for day $d \in \{1, \dots, H\}$ is computed deterministically in a single pass:

$$C_{\text{scen}}(0) = C_{\text{base}}(0)$$

$$C_{\text{scen}}(d) = C_{\text{scen}}(d - 1) + I_{\text{run\_scen}}(d) + I_{\text{sched\_delayed}}(d) + B_{\text{opt}}(d) - O_{\text{sched}}(d) - O_{\text{run}}(d) - E_{\text{unexp}}(d) - I_{\text{invest}}(d)$$

Where:
* $I_{\text{run\_scen}}(d)$ = Revenue-decline-adjusted daily operating inflow.
* $I_{\text{sched\_delayed}}(d)$ = Sum of open invoice balances whose delayed receipt day $d_{\text{base}} + \Delta_{\text{delay}}$ equals $d$.
* $B_{\text{opt}}(d)$ = Optional user-toggled investment benefit (`0` by default).
* $O_{\text{sched}}(d)$ = Scheduled supplier bill outflows on day $d$.
* $O_{\text{run}}(d)$ = Historical non-bill operating outflow run-rate on day $d$.
* $E_{\text{unexp}}(d)$ = One-time unexpected expense on `unexpectedExpenseDay`.
* $I_{\text{invest}}(d)$ = Proposed investment initial outflow on `plannedDay` + recurring monthly cost at 30-day intervals.

Because each scenario input transforms a distinct component of the cash equation, the combined calculation is completely deterministic, order-independent, and free of double-counting.

---

## 7. Approved Output Metrics Specification

| Metric Name | Classification | Formula / Procedure (`lib/finance/simulator.ts`) | Units & Rounding | Insufficient-Data / Edge-Case Behavior |
|---|---|---|---|---|
| **1. Current Available Cash ($C_0$)** | **Actual** | `Available Cash(T_0)` | `INR (₹)`, 2 decimals | Displays `₹0.00` with setup notice if workspace has no opening balance and no transactions. |
| **2. Baseline Ending Cash** | **Estimated Baseline** | $C_{\text{base}}(H)$ | `INR (₹)`, 2 decimals | Discloses if based only on scheduled documents (`<14d` txn history). |
| **3. Scenario Ending Cash** | **Hypothetical Projection** | $C_{\text{scen}}(H)$ | `INR (₹)`, 2 decimals | Equals `Baseline Ending Cash` when all scenario inputs are `0`. |
| **4. Net Scenario Cash Impact** | **Hypothetical Delta** | $C_{\text{scen}}(H) - C_{\text{base}}(H)$ | Signed `INR (+₹ / -₹)` | `₹0.00` when no scenario controls are active. |
| **5. Minimum Projected Cash & Date** | **Hypothetical Projection** | $C_{\min} = \min_{d \in [0, H]} C_{\text{scen}}(d)$ and earliest day $d_{\min}$ achieving $C_{\min}$ | `INR (₹)` + Calendar Date | Captures transient mid-horizon cash troughs even if Ending Cash recovers by Day $H$. |
| **6. Projected Cash Shortfall** | **Hypothetical Alert Metric** | $\text{Shortfall} = \max(0, -C_{\min})$ when $C_{\min} < 0$; plus `firstShortfallDate` (earliest $d$ where $C_{\text{scen}}(d) < 0$) | `INR (₹)` + Date | `₹0.00 (No projected cash deficit)` when $C_{\min} \ge 0$. |
| **7. Receivables Shifted Beyond Horizon** | **Hypothetical Impact** | Sum and invoice count of eligible open invoices where $d_{\text{base}} \le H$ and $d_{\text{base}} + \Delta_{\text{delay}} > H$ | `INR (₹)` + Invoice Count | `₹0.00 (0 invoices)` when `customerDelayDays == 0` or no open invoices cross Day $H$. |
| **8. Payables Due Within Horizon** | **Actual Obligation Schedule** | $\sum_{d=1}^{H} O_{\text{sched}}(d)$ and open bill count | `INR (₹)` + Bill Count | Discloses count of any open bills missing a `due_date`. |
| **9. Cash Buffer Comparison** | **Configurable Indicator** | Compares $C_{\min}$ against `target_cash_buffer` (if configured by user) or against `₹0` | Status Badge + Delta (`INR`) | See Section 8 below. |
| **10. Estimated Cash Runway** | **Conditional Estimate** | If average daily net cash change $\Delta_{\text{daily}} = (C_{\text{scen}}(H) - C_0)/H < 0$ AND history $L \ge 30\text{ days}$: $\lfloor C_0 / |\Delta_{\text{daily}}| \rfloor$ days | Whole days (`d`) or months (`d / 30`) | If $\Delta_{\text{daily}} \ge 0$: displays `"Cash-flow positive over horizon"`. If $L < 30\text{ days}$: displays `"Insufficient history (<30 days) for runway estimate"`. |

---

## 8. Cash Buffer and Risk Thresholds

FlowTrust does **not** invent a hardcoded rupee amount (such as `₹1,00,000`) and claim it is an universal safety buffer for every business. Instead, projected cash pressure is communicated using a three-tier transparent threshold rule:

1. **Tier 1 — Projected Cash Deficit (`Minimum Projected Cash < ₹0`):**
   * **Status Label:** **`Projected Cash Shortfall`**
   * **Explanation:** `"Projected cash falls below ₹0 on [firstShortfallDate], reaching a minimum of -₹[|C_min|]. Additional working capital, faster collections, or deferred outflows of at least ₹[|C_min|] would be required."`
2. **Tier 2 — Below Target / Illustrative Buffer (`₹0 <= Minimum Projected Cash < Buffer`):**
   * **Buffer Definition:**
     * Uses `businesses.target_cash_buffer` if the user has configured a preferred minimum cash reserve in Settings or in the Simulator buffer input.
     * If `target_cash_buffer` is not set and $\ge 14\text{ days}$ of history exists, displays an **optional, explicitly labelled Illustrative Benchmark (`15 Days of Operating Outflows`)**.
     * If neither is available, Tier 2 is omitted and only `< ₹0` vs `>= ₹0` is evaluated.
   * **Status Label:** **`Below Cash Buffer Target`**
3. **Tier 3 — Above Buffer (`Minimum Projected Cash >= Buffer` and `>= ₹0`):**
   * **Status Label:** **`Positive Projected Cash Position`** (paired with the reminder that positive projected cash is a scenario estimate, not a guarantee).

---

## 9. Saved Scenarios and Recalculation Rules

1. **What Is Stored (`saved_scenarios` table):**
   * `name`: User-provided scenario title (e.g., `"Q3 Monsoon Delay + Packaging Machine Purchase"`).
   * `horizon_days`: `30`, `60`, or `90`.
   * `inputs_json`: Exact slider and numeric parameter values (`revenueDeclinePct`, `customerDelayDays`, `unexpectedExpenseAmount`, `unexpectedExpenseDay`, `investment`).
   * `baseline_snapshot_json`: Snapshot of $C_0$, $C_{\text{base}}(H)$, and open receivables/payables totals at the moment the scenario was saved.
   * `scenario_outputs_json`: Snapshot of $C_{\text{scen}}(H)$, $C_{\min}$, `shortfallAmount`, and `shiftedReceivablesAmount` at save time.
   * `source_data_as_of`: Exact UTC timestamp and latest workspace ledger update timestamp when the calculation was performed.
2. **Staleness Detection & Re-Run Workflow:**
   * When a user opens a saved scenario from the `Saved Scenarios` list:
     * FlowTrust compares `saved_scenario.source_data_as_of` against the active workspace's latest transaction/invoice/bill/payment `updated_at` timestamp.
     * If underlying financial records have changed since `source_data_as_of`, FlowTrust displays a clear banner:
       `"Workspace financial records have been updated since this scenario was saved on [Date]. Viewing recalculated live results alongside original saved snapshot."`
     * The user can toggle between **Live Recalculated Results (Current Data)** and **Original Saved Snapshot (`source_data_as_of`)**, or click **Update Saved Snapshot**.
3. **Handling Archived or Cancelled Records on Recalculation:**
   * Because saved scenarios store parameter inputs (`revenueDeclinePct`, `customerDelayDays`, etc.) rather than hardcoding fragile foreign-key pointers to individual invoices, recalculating against current workspace records automatically excludes any invoices or bills that were paid or cancelled since the scenario was first saved.

---

## 10. Simulator Interface Behaviour

* **Immediate Deterministic Reactivity:** Because `lib/finance/simulator.ts` operates in-memory over the pre-fetched workspace summary and open document schedule in `< 5ms`, dragging any slider updates the comparison chart, KPI cards, and shortfall notices immediately without network round-trips on every pixel of drag.
* **Reset Action:** Clicking **`Reset to Baseline`** sets all four scenario inputs back to zero (`0%`, `0d`, `₹0`, `₹0`) in one click.
* **Active Assumptions Summary Pill Strip:** Directly above the results area, displays concise pills for every non-zero input (`Revenue -20%`, `Customer Delay +30d`, `Unexpected Expense ₹50,000 on Day 1`, `Horizon: 30 Days`) with an `×` button on each pill to remove that individual risk assumption.
* **Empty / Insufficient Data States:**
  * If a workspace has zero transactions, zero opening balance, and zero open documents, the simulator displays its controls in an educational preview state with a calm banner: `"Add an opening cash balance, transactions, or invoices to simulate cash-flow scenarios against your business records."`

---

## 11. Financial Accuracy and Required Test Cases

All implementations of `lib/finance/simulator.ts` must be verified by automated unit tests covering the 16 mandatory cases below:

| Test ID | Test Case | Expected Deterministic Result |
|---|---|---|
| `SIM-T01` | **No Active Risks (Zero Inputs)** | `Scenario Ending Cash === Baseline Ending Cash` on every day $d \in [0, H]$; `Net Scenario Impact === ₹0.00`. |
| `SIM-T02` | **Revenue Decline Only (`25%`)** | Daily unbilled inflow run-rate $I_{\text{run\_scen}}(d) = 0.75 \times I_{\text{run}}(d)$; scheduled open invoice amounts are not double-discounted. |
| `SIM-T03` | **Customer Payment Delay Within Horizon (`+10d`)** | Invoice due on Day 12 shifts to Day 22; `Scenario Ending Cash` at Day 30 is unchanged, but `Minimum Projected Cash` between Day 12 and Day 21 is lower. |
| `SIM-T04` | **Customer Payment Delay Crossing Horizon (`+20d` on 30d Horizon)** | Invoice of `₹60,000` due on Day 18 shifts to Day 38 ($> 30$); `Scenario Ending Cash` at Day 30 decreases by exactly `₹60,000`; `Receivables Shifted Beyond Horizon` increases by `₹60,000 (1 invoice)`. |
| `SIM-T05` | **Unexpected Expense Only (`₹80,000` on Day 1)** | $C_{\text{scen}}(d) = C_{\text{base}}(d) - ₹80,000$ for all $d \ge 1$. |
| `SIM-T06` | **Proposed Investment (Initial + Recurring + Benefit Off vs On)** | Initial cost deducted on `plannedDay`, recurring cost at `+30d`; optional benefit excluded when toggle is `false` and included with assumption flag when `true`. |
| `SIM-T07` | **Combined 4-Way Stress Scenario** | Simultaneous `20%` revenue decline + `30d` delay + `₹50,000` expense + `₹1,00,000` investment equals the exact algebraic sum of their individual orthogonal component adjustments. |
| `SIM-T08` | **Zero Starting Available Cash ($C_0 = ₹0$)** | Outflows on Day 1 produce negative projected cash immediately without division-by-zero errors. |
| `SIM-T09` | **Negative Projected Cash & Shortfall Detection** | When $C_{\min} = -₹42,500$ on Day 19, `shortfallAmount === ₹42,500.00` and `firstShortfallDate` identifies the exact first day $C_{\text{scen}}(d) < 0$. |
| `SIM-T10` | **Workspace with Zero Open Invoices** | `customerDelayDays = 45` produces `₹0` change and displays `"No open customer invoices with due dates are affected by payment delay."` |
| `SIM-T11` | **Invoices Missing Due Dates (`due_date = NULL`)** | Excluded from $I_{\text{sched}}$ and reported in `excludedMissingDueDateReceivables` count/amount. |
| `SIM-T12` | **Partially Paid Invoices (`₹50k` Total, `₹20k` Paid)** | Only the remaining `₹30,000` `outstanding_amount` is scheduled and shifted by `customerDelayDays`. |
| `SIM-T13` | **Overdue Invoices (`<90d` vs `>90d`)** | `<90d` overdue scheduled at conservative recovery offset; `>90d` overdue excluded from baseline cash inflows and disclosed. |
| `SIM-T14` | **Insufficient Historical Data (`<14 days` of transactions)** | Operating run-rate defaults to `0` with explicit limitation flag; scheduled invoices and bills still project accurately. |
| `SIM-T15` | **Idempotence & Repeat Calculation** | Running `simulateScenario(state, inputs)` 100 times in a row with identical inputs returns bit-for-bit identical output objects. |
| `SIM-T16` | **Zero Mutation of Actual Records** | Deep-freezing (`Object.freeze`) all input transactions, invoices, bills, and payments prior to running `simulateScenario` throws zero mutation errors; DB row counts and values remain untouched. |

