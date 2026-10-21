# FlowTrust — Notifications and Reminders MVP Specification

**Status:** Approved Authoritative MVP Specification (v1.0)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Authoritative Scope:** Scoped In-App Notification Categories, Deterministic Trigger Conditions, Deduplication, Dismissal & Auto-Resolution Lifecycle, Deep Linking, and Deferred External Channels  
**Related Specifications:** [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) · [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](./CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md) · [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md) · [UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md](../design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md)

---

## 1. Purpose and MVP Scope Philosophy

The FlowTrust notification system surfaces high-signal, evidence-backed operational events that require a small-business owner's attention—without cluttering the interface with noisy alerts, fake activity feeds, or unverified predictions.

### 1.1 Delivery Channel Decision (MVP)
* **Approved MVP Delivery Channel:** **In-App Workspace Notification Center** (accessible via the top-header Notification Bell popover + critical action strip on the Dashboard).
* **Explicitly Deferred Channels (Future Scope):** Email notifications, SMS/WhatsApp reminders, browser Web Push notifications, and background cron digest emails are excluded from the MVP to avoid external messaging infrastructure overhead while delivering full operational utility inside the workspace.

---

## 2. Approved MVP Notification Categories

FlowTrust supports **four deterministic notification categories** in the MVP. Every notification is derived strictly from verified workspace records (`invoices`, `bills`, `Available Cash`, and `import_batches`):

| Category Code | Classification | Event Trigger Condition | Title & Message Template | Deep-Link Target |
|---|---|---|---|---|
| **1. `OVERDUE_INVOICE`** | **`ALERT`** (Receivables Action) | Open customer invoice (`status IN ('UNPAID', 'PARTIALLY_PAID')`) where `due_date IS NOT NULL` and `due_date < current_date`. | **Title:** `Invoice [document_number] is overdue`<br>**Message:** `[Customer Name] owes ₹[outstanding_amount] ([days_overdue] days past due date [due_date]).` | `/customers/[customer_id]` (or Invoice detail drawer) |
| **2. `BILL_DUE_SOON`** | **`REMINDER`** (Payables Planning) | Open supplier bill (`status IN ('UNPAID', 'PARTIALLY_PAID')`) where `due_date IS NOT NULL` and `0 <= due_date - current_date <= 7` (within the 7-day Due Soon window) or `due_date < current_date` (`OVERDUE_BILL` `ALERT`). | **Title:** `Supplier bill [document_number] due [in X days / today / overdue]`<br>**Message:** `₹[outstanding_amount] payable to [Supplier Name] (Due: [due_date]).` | `/suppliers/[supplier_id]` (or Bill detail drawer) |
| **3. `CASH_COVERAGE_WARNING`** | **`ALERT`** (Liquidity Pressure) | Triggered when `Total Overdue Supplier Bills + Supplier Bills Due Within 7 Days > Current Available Cash` (and `Overdue + 7-Day Bills > ₹0`). | **Title:** `Upcoming 7-day payables exceed available cash`<br>**Message:** `Bills due within 7 days plus overdue bills total ₹[obligations_7d], compared to ₹[available_cash] in available cash.` | `/dashboard` (or `/risk-simulator`) |
| **4. `IMPORT_SUMMARY`** | **`INFO`** (Operational Event) | Created immediately when a CSV import batch completes (`COMPLETED` / `PARTIAL_COMPLETED`) or fails (`FAILED`). | **Title:** `CSV import completed: [file_name]`<br>**Message:** `[imported_rows] records imported, [skipped_duplicate_rows] duplicates skipped, [rejected_error_rows] errors rejected.` | `/transactions?import_batch=[id]` |

### 2.1 Prohibited Notification Types
* **Zero Fabricated Risk Alerts:** Notifications are never triggered by hypothetical Risk Simulator sliders unless the user is actively viewing the simulator; running a "what-if" scenario never creates a workspace notification claiming a real cash shortfall has occurred.
* **Zero Speculative / AI-Generated Alerts:** The AI Copilot cannot autonomously create notifications.

---

## 3. Deduplication, Dismissal, and Auto-Resolution Lifecycle

To guarantee that reloading the dashboard or switching tabs never generates duplicate notifications for the same unpaid invoice or bill, FlowTrust uses a **deterministic `condition_key` lifecycle**:

### 3.1 Deterministic `condition_key` Deduplication
Every notification is keyed by `(business_id, condition_key)`:
* Overdue Invoice (1–30 days): `overdue_invoice:<invoice_id>:tier_1`
* Overdue Invoice (>30 days escalation): `overdue_invoice:<invoice_id>:tier_30`
* Supplier Bill Due Soon (within 7 days): `bill_due_soon:<bill_id>`
* Supplier Bill Overdue: `overdue_bill:<bill_id>`
* Cash Coverage Warning (for current date window): `cash_coverage_7d:<YYYY-MM-DD>`
* CSV Import Batch: `import_batch:<import_batch_id>`

### 3.2 Dismissal and Escalation Rules
1. **Dismissal (`Mark as Read / Dismiss`):**
   * Any authorized member of the workspace can dismiss a notification (`is_dismissed = true`, `dismissed_at = now()`) or click **`Dismiss All`**.
   * Once a notification with a given `condition_key` is dismissed, it is **suppressed and never re-triggered** for that same `condition_key`.
   * **Milestone Re-Alerting:** If an overdue invoice was dismissed at `tier_1` (e.g., 3 days overdue) and remains unpaid when it crosses **31 days overdue**, the new `condition_key` (`overdue_invoice:<invoice_id>:tier_30`) surfaces one escalation alert (`"Overdue > 30 days"`).
2. **Automatic Resolution When Source Records Change:**
   * Whenever a payment is recorded that fully settles an invoice (`status = 'PAID'`), or an invoice/bill is cancelled (`status = 'CANCELLED'`), or `due_date` is updated to a future date $> 7\text{ days}$ out, any active notification for that document is **automatically marked resolved (`resolved_at = now()`)** and immediately removed from the active unread list.
   * Similarly, if a new cash inflow increases `Available Cash` so that `Available Cash >= Overdue Bills + 7-Day Bills`, the `CASH_COVERAGE_WARNING` notification auto-resolves immediately.

---

## 4. Workspace Isolation and Shared Member Behavior

* Notifications belong strictly to `business_id`.
* Under FlowTrust's v1 shared-access membership model ([WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](../product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md) §1.6), all authorized members of a business view the same active operational alerts for that workspace.
* Switching to another business in the Workspace Switcher immediately scopes the Notification Bell badge count and list to the newly selected `business_id`.

