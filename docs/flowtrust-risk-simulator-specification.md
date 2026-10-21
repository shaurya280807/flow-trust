# FlowTrust — Risk Simulator Feature Specification

**Status:** Product scope specification  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Purpose:** Define what the first version of the Risk Simulator should do before UI implementation and detailed formula design.

---

## 1. Product Goal

The Risk Simulator helps a small-business owner explore **“what if?”** financial situations before they happen. Users can adjust a few simple controls, move them left or right, and immediately see how the scenario could affect the business's cash position.

The experience should feel interactive and understandable—not like a complex financial modelling tool. The user should be able to change assumptions, compare the result with the current baseline, combine multiple risks, reset the scenario, and save useful scenarios to revisit.

### Core principle

**The simulator is a planning tool, not a prediction guarantee.** Results are scenario estimates based on available records and explicitly shown assumptions. Actual financial records must never be changed by running a simulation.

---

## 2. Initial-Version Scope

### 2.1 Interactive scenario controls

The primary interaction is a set of **horizontal, left-to-right sliders**. As a user moves a slider, the results should update promptly without requiring a separate “Run” action for ordinary scenarios.

#### A. Revenue decline
- Slider representing a reduction in expected revenue/inflows.
- Show the selected percentage clearly beside the slider.
- The initial prototype may display a range such as **0–50%**; this is a proposed UI range, not a finalized financial rule.
- The calculation must be based on an explicitly defined revenue/inflow baseline and forecast period. Do not silently treat historical revenue as guaranteed future revenue.

#### B. Customer payment delay
- Slider representing how many days customer payments are delayed.
- Show the selected number of days beside the slider.
- The initial prototype may display a range such as **0–60 days**; this is a proposed UI range, not a finalized financial rule.
- Model the effect on the timing of expected incoming cash, not as an automatic cancellation of receivables.
- Clearly explain which outstanding invoices or expected receipts are included in the calculation.

#### C. Unexpected expense
- Slider or amount control for a one-off unexpected cost.
- Show the selected amount in the business's configured currency.
- A prototype may use a sample range such as **₹0–₹1,00,000** for demonstration, but production ranges should adapt to the business currency and reasonable input limits.
- Treat this as a hypothetical cash outflow for the selected scenario only.

#### D. Proposed investment / major purchase
Support a proposed investment as an additional scenario input:
- Investment or purchase amount.
- Planned payment date or timing.
- Optional recurring cost associated with the investment.
- Optional estimated financial benefit, if the user has a reasonable estimate.
- Display which values were entered by the user and which assumptions were applied by the system.

The first version should focus on the cash impact of the proposed investment. It must not claim to provide a sophisticated return-on-investment forecast until the required modelling is explicitly designed.

### 2.2 Combine risks

Users can apply more than one control at the same time—for example:
- Revenue falls by a selected percentage.
- Customer payments arrive later.
- An unexpected expense occurs.
- A proposed investment is made.

The simulator must calculate the combined scenario rather than forcing the user to run each risk separately. The UI should make it clear which assumptions are currently active.

### 2.3 Baseline versus scenario comparison

Show a clear comparison between:
1. **Baseline:** the calculated position without the hypothetical changes.
2. **Scenario:** the calculated position after applying the selected assumptions.

Comparison should be visual and easy to scan. Bar-style comparisons are appropriate where they make the difference clearer. Do not rely on colour alone to communicate whether a value is positive or negative.

### 2.4 Results and key outputs

The initial results area should aim to show the following, where the available data supports a meaningful calculation:

- **Current available cash:** actual cash held in bank accounts plus physical cash, according to FlowTrust's financial foundation rules.
- **Projected ending cash:** estimated cash at the end of the selected simulation horizon.
- **Minimum projected cash / cash buffer:** the lowest projected cash point during the scenario horizon, if the calculation model supports this.
- **Net cash flow:** projected cash inflows minus projected cash outflows over the selected period.
- **Cash shortfall warning:** whether the scenario produces a projected cash balance below zero or below a separately defined safety threshold.
- **Receivables affected by delay:** the relevant outstanding incoming payments whose timing is changed by the scenario, when identifiable from the data.
- **Sustainability/runway estimate:** show only when a defensible formula and sufficient data are available. Otherwise explain that there is not enough reliable information to estimate it.

These are scenario outputs, not guarantees. Every projected value must be labelled as projected or simulated rather than actual.

### 2.5 Scenario actions

- **Live update:** changing a control updates the scenario results promptly.
- **Reset:** restore all controls to the baseline/default scenario.
- **Save scenario:** allow a user to save a named scenario and its assumptions/results for later review.
- **Reopen and rerun:** a saved scenario can be opened and recalculated against the current eligible business data.
- **Scenario comparison:** preserve the ability to compare the baseline with the current scenario. Comparing multiple saved scenarios may be included if it fits the initial implementation without complicating the experience.
- Clearly distinguish a saved scenario's original results from results recalculated using newer business records.

### 2.6 Explain assumptions and limitations

Every scenario should make it possible to understand:
- The time period being simulated.
- Which records and expected cash movements are included.
- Which user-entered assumptions are active.
- Any defaults used by the calculation engine.
- Whether important data is missing or incomplete.
- Why a particular warning or result is shown, where practical.

Do not show false precision. If data is insufficient, display a clear limitation or unavailable state instead of inventing a figure.

---

## 3. Financial Calculation Rules

### 3.1 Deterministic calculations first

- All core scenario calculations must live in the shared, testable TypeScript finance modules under `lib/finance/`.
- The UI must call the finance logic rather than duplicate formulas in React components.
- The same inputs and the same underlying data should produce the same result.
- Centralize formulas and test important edge cases.
- AI may explain results in plain language, but it must not invent or independently replace financial calculations.

### 3.2 Use FlowTrust's financial foundation

The simulator must follow the established financial rules:
- Available cash means bank balances plus physical cash.
- Pending payment-gateway settlements are not yet available cash.
- Unpaid customer invoices are receivables, not cash.
- Unpaid supplier bills are payables, not cash outflows that have already occurred.
- Transaction records represent actual cash movements.
- Invoices and bills affect cash only as payments are recorded or as a clearly labelled hypothetical scenario models future payment timing.
- Partial payments must be respected.
- Cash flow must not be presented as equivalent to profit.
- Never double-count an opening balance, transaction, invoice, bill, or payment.

### 3.3 Do not mutate real records

Running, changing, saving, or resetting a scenario must not:
- Create actual income or expense transactions.
- Change invoices, bills, or payment statuses.
- Change a business's real cash balance.
- Alter imported records.

Saved scenarios are separate planning objects. Only an explicit, separately designed user action in a future feature could turn a hypothetical plan into real records.

### 3.4 Forecast horizon and formula details are pending

The following need to be designed during the finance-calculation phase:
- Default simulation horizon and whether the user can change it.
- Exact baseline calculation and eligible inflow/outflow sources.
- How revenue decline is applied without double-counting historical or invoice data.
- How payment delays shift the timing of incoming payments.
- Treatment of overlapping assumptions and payment dates.
- Exact calculation of minimum cash, shortfall, and safety buffer.
- Whether and when a sustainability/runway estimate is defensible.
- Currency-aware input limits and rounding rules.
- Warning thresholds and how they are explained.

**Do not treat example slider ranges or demo formulas as approved production formulas.** The finance engine and its tests must define the final behaviour.

---

## 4. User Experience Requirements

- Make sliders the primary interaction; users should be able to drag them left or right and see outcomes change.
- Display the selected value clearly, including units such as `%`, `days`, or the configured currency.
- Provide a direct reset action.
- Make the baseline and scenario result easy to compare.
- Keep the interface calm, professional, and business-oriented, consistent with FlowTrust's muted visual direction.
- Use red for critical alerts or errors, not as decoration.
- Provide clear loading, empty, unavailable, and error states.
- Support keyboard interaction and visible focus states for sliders and buttons.
- On smaller screens, keep controls and results readable without requiring users to interpret an overcrowded chart.
- Do not depend on colour alone; use labels, icons, and/or text for warnings.
- Show actual values and simulated values distinctly.

The frontend designer/implementer (Antigravity) may decide the exact layout, component placement, chart type, responsive behaviour, and visual hierarchy, provided these product and financial rules remain intact.

---

## 5. Data, Access, and Persistence

- All scenario data must belong to the active business workspace.
- Respect FlowTrust's existing business-level data isolation and server-side authorization checks.
- A user must not be able to read or modify scenarios belonging to another business by changing a client-side identifier.
- If scenarios are saved, store the assumptions and enough context to identify the calculation period and result version. Decide the exact schema during implementation planning.
- When a saved scenario is rerun, calculate against the latest eligible business data and clearly label the new result.
- Do not store secrets in client-side code or commit secrets to Git.
- Do not create a separate copy of financial records just to run a scenario; use authorized, read-only inputs from the finance layer.

---

## 6. Errors and Edge Cases

Handle at least the following:
- No financial records or no meaningful baseline data.
- Missing opening balance or incomplete cash information.
- No eligible expected receipts for a payment-delay scenario.
- A scenario amount outside allowed input bounds.
- Negative or very low projected cash.
- Missing dates or ambiguous payment timing.
- Currency or rounding edge cases.
- A saved scenario whose underlying business data has changed.
- A saved scenario that cannot be recalculated reliably.
- A network or persistence failure when saving a scenario.

Where calculation is not reliable, explain why and avoid presenting a misleading number.

---

## 7. Testing Requirements

Create unit tests for the finance engine covering:
- Baseline with no scenario adjustments.
- Revenue decline at zero and at a non-zero value.
- Payment delay at zero and at a non-zero value.
- Unexpected expense at zero and at a non-zero value.
- Investment scenario with required and optional inputs.
- Multiple simultaneous scenario adjustments.
- Cash-shortfall conditions.
- Partial payments and outstanding balances.
- No data / insufficient data cases.
- Date boundaries and payment timing.
- Currency formatting and rounding where relevant.
- Confirmation that scenario calculations do not mutate actual financial records.

UI tests should verify that moving sliders updates displayed values/results, reset restores defaults, and saved scenarios can be reopened where persistence is implemented.

---

## 8. Explicitly Out of Scope for the Initial Version

These are tracked as **future scope**, not promised initial-version features:

1. Automatic scenario suggestions based on detected business patterns.
2. Probabilistic simulations and Monte Carlo analysis.
3. Seasonal forecasting.
4. Advanced sensitivity analysis across many variables.
5. External economic indicators and market data.
6. AI-generated scenario recommendations.
7. Sophisticated investment-return / ROI modelling.
8. More advanced predictive forecasting beyond the deterministic initial model.

Other FlowTrust future-scope items tracked separately include:
- Bank integrations and reconciliation.
- Automatic transaction categorization.
- Advanced audit trails/version history or immutable ledger.
- Configurable financial-year settings and comparative/scheduled reports.
- Advanced business access controls: Owner/Admin/Accountant/Viewer roles, granular permissions, email invitations, and advanced membership management.
- Richer business onboarding fields such as business size, financial-year start, Tax/GST details, address, and contacts.
- Further multiple-business workflow enhancements.

These items should remain backlog items until explicitly promoted into a later release.

---

## 9. Definition of Done — Initial Risk Simulator

The initial feature is ready when:
- Users can adjust revenue decline, customer payment delay, and unexpected expense with left-right controls.
- A proposed investment scenario is supported at the agreed initial level.
- Multiple assumptions can be combined.
- Baseline and scenario results are clearly compared.
- Supported outputs update from deterministic finance logic.
- Results are labelled as estimates/simulations and assumptions are visible.
- Reset works.
- Saving and reopening scenarios works if persistence is included in the agreed initial delivery.
- The simulator does not modify actual financial records.
- Business-level access controls are enforced.
- Core formulas and key edge cases have automated tests.
- Insufficient data produces a clear explanation rather than a fabricated result.

---

## 10. Product Summary

**The FlowTrust Risk Simulator lets a business owner slide through hypothetical financial pressures and immediately explore the possible cash impact.** Its initial version prioritizes intuitive controls, combined scenarios, baseline comparison, deterministic calculations, transparent assumptions, and safe separation from real records. Advanced prediction and recommendation features remain in the future-scope backlog.
