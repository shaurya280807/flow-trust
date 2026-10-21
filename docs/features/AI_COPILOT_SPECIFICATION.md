# FlowTrust — AI Copilot MVP Specification

**Status:** Approved Authoritative MVP Specification (v1.0)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Authoritative Scope:** AI Copilot Core Use Cases, Deterministic Calculation Authority, Context Assembly & Source Traceability, Workspace Isolation, Provider-Agnostic Server Architecture, Deterministic Fallback Mode, Error Handling, and MVP Guardrails  
**Related Specifications:** [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) · [RISK_SIMULATOR_SPECIFICATION.md](./RISK_SIMULATOR_SPECIFICATION.md) · [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](./CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) · [SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md](../architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md)

---

## 1. Purpose and MVP Scope

The FlowTrust AI Copilot is a domain-scoped, read-only financial decision-support assistant embedded inside the workspace. Its purpose is to help small-business owners understand their verified financial position, interpret customer and supplier payment patterns, and explore hypothetical Risk Simulator scenarios using plain language.

### 1.1 Approved Core Use Cases (MVP)
The Copilot is designed and tested to handle six concrete capabilities:
1. **Answer Questions About Available Financial Data:** Report current `Available Cash`, period `Cash Inflows`, `Cash Outflows`, `Net Cash Flow`, top expense categories, `Total Receivables`, and `Total Payables` using authoritative outputs from `lib/finance/`.
2. **Explain Deterministic Financial Metrics:** Explain how a displayed metric was calculated (e.g., why `Available Cash` differs from `Net Cash Flow` or why an invoice is excluded from `Average Payment Delay`).
3. **Explain Historical Cash-Flow & Payment Patterns:** Summarize observed trends across periods or customers where sufficient records exist, and explicitly state when sample sizes ($N_{\text{eligible}} < 3$ for customer delays or $< 14\text{ days}$ for run-rate) are insufficient.
4. **Run & Explain Risk Simulator Scenarios:** Accept natural-language "what-if" questions (e.g., *"What happens to our 30-day cash if customer payments are delayed by 20 days and we have a ₹50,000 unexpected expense?"*), invoke the deterministic `simulateRiskScenario` function in `lib/finance/simulator.ts`, and explain the resulting baseline vs. scenario numbers.
5. **Summarize Report Findings:** Summarize key factual figures and evidence-backed risk observations from Weekly, Monthly, Yearly (FY Apr–Mar), Customer, or Supplier reports.
6. **Suggest Proportionate, Evidence-Backed Next Steps:** Offer practical operational suggestions tied directly to recorded workspace facts (e.g., prioritizing collection follow-ups on specific overdue invoices or reserving cash for bills due within 7 days).

### 1.2 Strictly Out of Scope for MVP
* Acting as an open-ended general-purpose chatbot (answering non-financial trivia, writing unrelated code, or giving tax-filing/legal opinions).
* Creating, editing, or deleting `transactions`, `invoices`, `bills`, `payments`, `customers`, or `suppliers` (the MVP Copilot is **strictly read-only** with respect to canonical business records).
* Autonomously executing payments or sending external emails/messages to customers.

---

## 2. Data Access and Deterministic Calculation Authority

### 2.1 Zero AI Arithmetic Rule
**The AI model must never perform raw arithmetic over transaction lists or invent financial figures.**
* Every rupee total, percentage, delay average, overdue balance, and scenario projection referenced by the Copilot is computed **before** or **during** the request by deterministic TypeScript modules in `lib/finance/`.
* The LLM's role is strictly **natural-language synthesis, explanation, and structured tool invocation** over pre-computed, verified numbers.

### 2.2 Strictly Prohibited Fabrications
The system prompt, structured response schema, and post-processing guardrails prohibit the Copilot from fabricating:
1. Nonexistent transactions, invoices, bills, or payments.
2. Unrecorded historical trends when workspace data is sparse or missing.
3. Customer or supplier behavioural ratings when $N_{\text{eligible}} < 3$.
4. Supplier product quality, delivery speed, or operational reliability claims.
5. Guaranteed future cash balances or default probabilities.
6. Accounting profit figures (net cash flow is never presented as accounting net profit).

---

## 3. Context Assembly, Tools, and Source Traceability

### 3.1 Why Vector Databases / RAG Are Not Used in the MVP
Financial questions in FlowTrust require **exact completeness across relational records** (e.g., summing all active outflows in October 2026 or listing all overdue invoices as of today). Vector embedding top-$k$ retrieval (`RAG`) retrieves partial subsets of rows, leading to inaccurate sums and hallucinated answers.

Instead, FlowTrust uses **Authorized Structured Snapshot Assembly + Deterministic Server-Side Tools**:
1. **Baseline Workspace Context Snapshot (`buildCopilotWorkspaceSnapshot`):**
   On every authorized Copilot request, the server deterministically computes a compact JSON snapshot (~1.5–3 KB) for the active `business_id` containing:
   * Workspace metadata (`business_name`, `currency_code`, `opening_cash_balance`, `opening_balance_date`, data coverage date span `[D_min, D_max]`, `is_demo`).
   * Current position (`available_cash`, `total_receivables`, `overdue_receivables`, `total_payables`, `overdue_payables`, `bills_due_within_7_days`).
   * Current month and trailing 30-day cash flow (`inflows`, `outflows`, `net_cash_flow`, top 5 expense categories).
   * Top overdue customer invoices and upcoming supplier bills (with document numbers, counterparty names, amounts, and days overdue / due dates).
   * Customer collection indicator summaries (including sample counts $N_{\text{eligible}}$).
2. **Deterministic Read-Only Tools (`lib/ai/tools.ts`):**
   When a user asks about a specific period, entity, or simulation, the server exposes four Zod-validated read-only tools backed by `lib/finance/`:
   * `getPeriodFinancialReport({ periodType, startDate, endDate })`
   * `getCustomerOrSupplierProfile({ entityType, entityIdOrName })`
   * `runRiskSimulation({ horizonDays, revenueDeclinePct, customerDelayDays, unexpectedExpenseAmount, investmentAmount })`
   * `listOverdueOrUpcomingDocuments({ documentType, filter })`

### 3.2 Epistemic Labelling & Source Traceability in Responses
Every Copilot response returns structured metadata so the UI clearly separates facts from interpretation:
1. **Response Classification Badges:**
   * **`Verified Workspace Figures`** — Actual recorded balances and deterministic calculations from `lib/finance/`.
   * **`Hypothetical Scenario Estimate`** — Shown whenever the response includes outputs from `runRiskSimulation`.
   * **`Data Limitation Notice`** — Shown whenever requested data is missing or below sample-size thresholds.
2. **Supporting Source Citations Strip:**
   * Beneath each answer, the Copilot renders concise clickable reference chips (e.g., `Source: Current Month Cash Flow (1–22 Oct 2026)`, `Source: 2 Overdue Invoices (₹75,000)`, `Source: Risk Simulator (30d Horizon)`), linking directly to the relevant Dashboard section, Customer Profile, Report, or Simulator state.
   * Raw database UUIDs and SQL queries are never exposed to the user.

---

## 4. Permissions and Workspace Isolation

1. **Server-Side Session & Membership Verification (`verifyWorkspaceMembership`):**
   * Every request to `/api/copilot/chat` authenticates the user via Supabase Auth (`supabase.auth.getUser()`) on the server and verifies that `(user.id, activeBusinessId)` exists in `business_memberships`.
   * A client-supplied `businessId` that fails membership verification immediately returns `403 Forbidden` before any database query or AI provider call occurs.
2. **Strict Context Scoping:**
   * All snapshot builders and read-only tools bind `WHERE business_id = $verifiedBusinessId` at the query layer (reinforced by PostgreSQL RLS).
   * Switching the active workspace in the UI clears the current Copilot chat view (or scopes history strictly to the selected `business_id`) so context from Business A never leaks into Business B.

---

## 5. AI Provider Architecture and Offline/Fallback Resilience

### 5.1 Replaceable Server-Side Provider Adapter (`lib/ai/provider.ts`)
To keep the provider modular and credentials strictly server-side:
* **Configuration via Environment Variables:**
  * `AI_PROVIDER`: `'gemini'` (recommended default using Google Gemini API `gemini-2.5-flash`), `'openai'`, or `'deterministic_fallback'`.
  * `AI_API_KEY`: Server-only secret key (never prefixed with `NEXT_PUBLIC_`).
  * `AI_MODEL_NAME`: Optional override (defaults to `'gemini-2.5-flash'`).
* **Zero Client-Side Secret Exposure:** All LLM calls occur strictly inside Next.js server route handlers (`/api/copilot/chat`).

### 5.2 Deterministic Fallback Mode (Guaranteed Availability)
External AI APIs can experience rate limits, network timeouts, or missing API keys in local evaluation environments. FlowTrust implements a **built-in Deterministic Financial Explainer Fallback (`lib/ai/fallback-explainer.ts`)**:
* Whenever `AI_API_KEY` is unset, `AI_PROVIDER=deterministic_fallback`, or the external LLM call fails/times out (`> 12 seconds`), the server automatically answers the user's query using deterministic structured templates populated from `WorkspaceFinancialContextSnapshot` and `lib/finance/` tools (covering cash position, receivables/payables, customer delays, report summaries, and simulator scenarios).
* Responses served via fallback display a subtle, honest notice: `"Answered using FlowTrust's built-in deterministic financial summary (external AI service unavailable)."`

---

## 6. Failure and Edge-Case Handling

| Failure / Edge Condition | Required Copilot Behaviour |
|---|---|
| **1. External AI Provider Timeout or `5xx` / `429` Error** | Catches error server-side without crashing; logs sanitized error status; seamlessly returns deterministic fallback explanation for supported financial intents or displays: `"The AI assistant is temporarily unavailable. Your financial dashboard, reports, and simulator remain fully operational."` |
| **2. Database / Snapshot Query Failure** | Returns HTTP `503` with a clear error state (`"Unable to load workspace financial context right now. Please retry."`). Never invokes the LLM with an empty/broken context that could cause hallucinated numbers. |
| **3. User Asks About Missing / Unrecorded Data** | States the exact limitation (e.g., `"Your workspace currently has records from 1 May 2026 to 22 October 2026. No transactions are recorded for January 2026."`). |
| **4. User Asks for Unsupported Prediction / Speculation** | Declines speculation (e.g., `"FlowTrust cannot predict exact future sales or customer default probabilities. You can model a hypothetical revenue drop or payment delay in the Risk Simulator."`) and provides a one-click link to the Risk Simulator. |
| **5. Unauthorized Workspace Request** | Rejects with HTTP `401`/`403`; zero financial data retrieved or sent to the AI provider. |
| **6. Prompt Injection / Out-of-Domain Request** | System instructions restrict responses to the active business's financial management; out-of-domain prompts receive a polite redirection back to workspace finances. |

---

## 7. MVP Usage Limits and Future Scope

* **MVP Safeguards:**
  * Maximum input message length: `1,000 characters` (validated by Zod).
  * Rate limit: `20 requests per minute` per authenticated user session.
  * Context window bound: Sends the current structured workspace snapshot plus at most the last `6` turns of conversation within the active workspace session.
* **Deferred to Future Scope:**
  * Multi-agent autonomous workflows.
  * Vector search over unstructured PDF attachments.
  * Write actions (creating invoices/transactions via chat confirmation).

