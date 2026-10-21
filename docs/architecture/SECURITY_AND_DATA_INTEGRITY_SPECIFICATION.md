# FlowTrust — Security, Data Integrity, and Operational Reliability Specification

**Status:** Approved Authoritative MVP Specification (v1.0)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Authoritative Scope:** Multi-Tenant Workspace Isolation, PostgreSQL Row Level Security (RLS), Server-Side Authorization, Secrets Management, Financial Data Integrity Constraints, Error Handling, Audit Logging, and Backup/Recovery Strategy  
**Related Specifications:** [WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](../product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md) · [TECH_STACK_AND_ARCHITECTURE.md](./TECH_STACK_AND_ARCHITECTURE.md) · [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) · [DEPLOYMENT_AND_ENVIRONMENT_READINESS.md](../operations/DEPLOYMENT_AND_ENVIRONMENT_READINESS.md)

---

## 1. Defense-in-Depth Workspace Isolation

Business-level data isolation is FlowTrust's foundational security requirement. A user authenticated in FlowTrust must **never** be able to read, modify, import into, simulate, report on, or query via the AI Copilot any record belonging to a business workspace of which they are not an authorized member in `business_memberships`.

### 1.1 Two Mandatory Enforcement Layers
A client-side workspace selector, URL parameter, or hidden button is **never** treated as a security boundary. Isolation is enforced at two independent server-side layers:

```mermaid
flowchart TD
    Req["Incoming Request (Page Load / Server Action / API Route)"] --> L1["Layer 1: Server Application Guard (verifyWorkspaceMembership)"]
    L1 -->|Unauthenticated| E401["HTTP 401 Unauthorized"]
    L1 -->|Not in business_memberships| E403["HTTP 403 Forbidden"]
    L1 -->|Authorized (user_id, business_id)| L2["Layer 2: PostgreSQL Row Level Security (RLS) Policy"]
    L2 --> DB[("Supabase PostgreSQL\nEvery query scoped to business_id")]
```

#### Layer 1: Application Server Guard (`lib/auth/workspace-guard.ts`)
Every Next.js Server Component data loader, Server Action, and Route Handler (`/api/*`) must execute `requireAuthorizedWorkspace(requestedBusinessId)` before performing any business logic:
1. Extracts the authenticated user from the server-verified Supabase Auth session (`await supabase.auth.getUser()`). Never trusts decoded unverified JWTs from client storage.
2. Queries `business_memberships` for `WHERE user_id = authUser.id AND business_id = requestedBusinessId`.
3. When modifying or fetching a child entity by ID (e.g., `invoiceId`, `customerId`, `scenarioId`, `importBatchId`), every query includes `AND business_id = authorizedBusinessId` so an attacker cannot pass their own valid `business_id` alongside another workspace's `invoiceId` (preventing Insecure Direct Object Reference / IDOR).

#### Layer 2: PostgreSQL Row Level Security (RLS) Policies
RLS must be enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) on **every** table in the `public` schema:
* **Helper Security-Definer Function:**
  ```sql
  CREATE OR REPLACE FUNCTION public.is_business_member(target_business_id UUID)
  RETURNS BOOLEAN
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.business_memberships
      WHERE business_id = target_business_id
        AND user_id = auth.uid()
    );
  $$;
  ```
* **Table Isolation Coverage:**
  Every business-owned table (`categories`, `customers`, `suppliers`, `invoices`, `bills`, `transactions`, `payments`, `import_batches`, `import_batch_rows`, `saved_scenarios`, `notifications`) enforces `USING (public.is_business_member(business_id))` for `SELECT`, `UPDATE`, and `DELETE`, and `WITH CHECK (public.is_business_member(business_id))` for `INSERT` and `UPDATE`.

### 1.2 Isolation Across Every Feature Surface
| Feature Surface | Required Isolation Control |
|---|---|
| **Customers & Suppliers** | All directory searches, autocomplete queries, and inline entity creations bind `business_id = authorizedBusinessId`. |
| **Transactions, Invoices, Bills & Payments** | Linked foreign keys (`customer_id`, `supplier_id`, `invoice_id`, `bill_id`, `transaction_id`) are verified to belong to the **same** `business_id` before insert/update (preventing cross-workspace foreign key linking). |
| **CSV Imports** | `import_batches` and all created records are stamped with `authorizedBusinessId`; duplicate detection fingerprints are hashed and queried strictly within `authorizedBusinessId`. |
| **Risk Simulator & Saved Scenarios** | `saved_scenarios` queries and updates require `business_id = authorizedBusinessId`. |
| **Reports** | All 5 report categories verify `authorizedBusinessId` on the server; Customer/Supplier reports additionally verify that the requested `customerId`/`supplierId` belongs to `authorizedBusinessId`. |
| **AI Copilot** | Context snapshots and deterministic tool calls execute exclusively with `authorizedBusinessId`; conversation context is cleared on workspace switch. |

---

## 2. Secrets and Credentials Management

1. **Strict Server/Client Variable Separation:**
   * Only variables explicitly safe for public browser bundles may use the `NEXT_PUBLIC_` prefix (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   * Privileged credentials (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `AI_API_KEY`) must **never** be prefixed with `NEXT_PUBLIC_` and must only be imported inside server-only modules (`import 'server-only'`).
2. **Source Control Hygiene:**
   * `.env`, `.env.local`, `.env.development.local`, and `.env.production.local` must remain in `.gitignore` and never be committed.
   * Only `.env.example` containing placeholder variable names and safe dummy descriptions may be committed to Git.
   * No real API keys, database passwords, or JWTs may ever be pasted into Markdown documentation, test snapshots, or client logs.

---

## 3. Financial Data Integrity Protections

Financial records in FlowTrust must never silently drift out of sync or lose historical traceability when users edit, cancel, archive, or delete items.

### 3.1 Protection Rules by Entity Type

| Entity / Operation | Finalized Integrity Rule |
|---|---|
| **1. Deleting an Invoice or Bill with Linked Payments** | **Strictly Blocked (`ON DELETE RESTRICT`).** If an invoice or bill has $\ge 1$ active linked `payments`, hard deletion is rejected (`"Cannot delete an invoice that has recorded payments. You may void the payment first or cancel the remaining balance."`). |
| **2. Cancelling an Invoice or Bill (`status = 'CANCELLED'`)** | Allowed when `amount_paid == 0`. Sets `status = 'CANCELLED'` and `cancelled_at = now()`. Preserves the document row for historical reference while excluding it from `Outstanding Receivables` / `Outstanding Payables`. If `amount_paid > 0`, the user must first void/unallocate the linked payment before cancelling the document. |
| **3. Editing an Invoice or Bill Total Amount** | `total_amount` cannot be reduced below `amount_paid` (`CHECK (total_amount >= amount_paid)`). Changing `total_amount` or `due_date` immediately recomputes `status` (`UNPAID` / `PARTIALLY_PAID` / `PAID`) and overdue status in the same database transaction. |
| **4. Recording or Voiding a Payment Allocation (`payments`)** | Recording a payment against an invoice/bill atomically creates the cash `transactions` row (`INVOICE_PAYMENT` / `BILL_PAYMENT`), inserts the `payments` allocation row, and updates `invoice.amount_paid` and `invoice.status` in a **single PostgreSQL transaction**. Voiding a payment atomically marks both the `payments` row and its linked `transactions` row as `VOIDED` and recomputes the parent document's `amount_paid` and `status`. |
| **5. Deleting a Customer or Supplier with Linked History** | **Strictly Blocked (`ON DELETE RESTRICT`)** whenever any `invoices`, `bills`, or `transactions` reference the entity. Users use **Archive (`status = 'ARCHIVED'`)** instead. Hard deletion is allowed only when reference count is `0`. |
| **6. Hard Deletion of Unlinked Direct Transactions** | Permitted only for unlinked manual transactions (`transaction_kind IN ('DIRECT_INCOME', 'DIRECT_EXPENSE')` with zero linked `payments`), or via soft-void (`status = 'VOIDED'`). |
| **7. Failed or Repeated CSV Imports** | Stage 6 persistence runs inside an atomic DB transaction; mid-batch failures roll back `100%` of the batch. File SHA-256 and row `dedup_fingerprint` checks prevent accidental duplicate ledger creation on retry or re-upload. |

---

## 4. Error Handling and Structured Logging

### 4.1 User-Facing Error Contract
All server actions and API endpoints return structured, deterministic error responses (`{ ok: false, error: { code, message, fieldErrors? } }`):
* **Validation Failures (`400`):** Return specific field-level or row-level messages (via Zod) so the user knows exactly what to fix.
* **Authentication / Authorization Failures (`401` / `403`):** Return generic, safe messages (`"Session expired. Please sign in again."` or `"You do not have access to this business workspace."`) without revealing whether a target UUID exists in another workspace.
* **Database / Constraint Errors (`409` / `422`):** Map PostgreSQL constraint codes (`23505` unique violation, `23503` foreign key restriction, `23514` check violation) to plain-English explanations (e.g., `"Invoice number INV-2026-004 already exists in this workspace."`).
* **Unexpected Server Errors (`500`):** Return a calm fallback message with a correlation `requestId` (`"Something went wrong while saving your changes (Ref: req_8f2a). Your existing records were not modified."`). **Never** expose raw SQL queries, stack traces, file system paths, or environment variables to the client.

### 4.2 Privacy-Safe Server Logging
Server logs capture `timestamp`, `requestId`, `route`, `statusCode`, `durationMs`, and `errorCode`, while **excluding**:
* Passwords, session tokens, join codes, or API keys.
* Full CSV payloads, raw bank narrations, or counterparty personal contact details.

---

## 5. Backups and Recovery Strategy (MVP)

FlowTrust's backup and recovery posture distinguishes clearly between **platform capabilities provided by Supabase** and **operational configurations that must be verified at deployment**:

| Capability | Status in Repository Today | MVP Requirement & Operational Procedure |
|---|---|---|
| **1. Schema & Deterministic Seed Recovery** | **Specified** (migrations to be created in P0) | All database tables, constraints, functions, and RLS policies must be version-controlled in reproducible SQL migration files (`supabase/migrations/*.sql`) so a clean database instance can be reconstructed from Git in under 2 minutes. |
| **2. Transactional Rollback on Partial Failure** | **Specified** (PostgreSQL ACID transactions) | Multi-table writes (payment recording + invoice update, CSV batch import) execute inside atomic database transactions that self-recover via automatic rollback on failure. |
| **3. Automated Database Backups** | **Provider Capability (Requires Configuration on Hosted Supabase)** | Not yet active because no production Supabase project is linked yet. On Supabase Free tier, run scheduled logical dumps (`pg_dump` via GitHub Actions or local backup script before major changes); on Supabase Pro tier, enable daily automated backups and Point-in-Time Recovery (PITR). |
| **4. Workspace CSV Export / Portability** | **MVP Safeguard** | Users can export/print financial reports (`Save as PDF`) and download their transaction/document registers as standard CSV files so business owners retain a portable local backup of their financial records. |

