# FlowTrust — Deployment and Environment Readiness Specification

**Status:** Approved Authoritative MVP Specification (v1.0)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Authoritative Scope:** Local Development Setup, Environment Variable Contract (`.env.example`), Supabase Database/Auth/RLS Provisioning, Schema Migrations, Production Environment Separation, Vercel Build & Deployment Pipeline, Server-Side Secrets, Backup Configuration, and Post-Deployment Verification  
**Related Specifications:** [TECH_STACK_AND_ARCHITECTURE.md](../architecture/TECH_STACK_AND_ARCHITECTURE.md) · [SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md](../architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md) · [TESTING_AND_DEFINITION_OF_DONE.md](../quality/TESTING_AND_DEFINITION_OF_DONE.md)

---

## 1. Current Repository & Deployment Status

To maintain strict transparency between documented plans and repository state:

| Readiness Dimension | Current Status | Notes |
|---|---|---|
| **Architecture & Stack Selection** | **Approved** | Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, Recharts, Supabase (PostgreSQL + Auth + RLS), Vercel ([TECH_STACK_AND_ARCHITECTURE.md](../architecture/TECH_STACK_AND_ARCHITECTURE.md)). |
| **Application Code & `package.json`** | **Not Yet Initialized** | Repository currently contains authoritative specifications only (`docs/`). Codebase scaffolding begins in Phase P0. |
| **Database Schema & Migrations** | **Specified** | Canonical schema and RLS policies are defined in [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) and [SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md](../architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md); SQL migration files will be created in Phase P0. |
| **Hosted Production Environment** | **Not Yet Deployed** | Must be provisioned on Supabase and Vercel following the runbook below. |

---

## 2. Local Development Environment Requirements

### 2.1 Required Developer Tooling
* **Node.js:** `v20.x LTS` or `v22.x LTS` (64-bit).
* **Package Manager:** `npm` (v10+) or `pnpm` (v9+).
* **Git:** `v2.40+`.
* **Supabase Project (or Supabase CLI):** Either a cloud-hosted development Supabase project or local Supabase CLI (`npx supabase start` via Docker).

### 2.2 Standard Local Setup Workflow (Once P0 Scaffolding Is Created)
1. Clone repository: `git clone https://github.com/shaurya280807/flow-trust.git`
2. Install dependencies: `npm install`
3. Copy environment template: `cp .env.example .env.local` and populate development credentials.
4. Apply database schema & RLS migrations: `npx supabase db push` (or run `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL Editor).
5. Start development server: `npm run dev` (`http://localhost:3000`).
6. Run automated test suite: `npm test`.

---

## 3. Environment Variable Contract (`.env.example` Specification)

When the application is initialized in Phase P0, a committed `.env.example` file must document the following variables using safe placeholder values only. Real values are stored in `.env.local` (local) and Vercel Encrypted Environment Variables (hosted).

```ini
# ==============================================================================
# FLOWTRUST — ENVIRONMENT VARIABLE TEMPLATE (.env.example)
# Copy this file to .env.local for local development.
# NEVER commit real keys or credentials to Git.
# ==============================================================================

# 1. Public Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 2. Supabase Public Client Configuration (Safe for Browser with RLS Enabled)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-public-key"

# 3. Supabase Server-Only Privileged Key (STRICTLY SERVER-ONLY — Never prefix with NEXT_PUBLIC_)
# Used only for controlled server-side operations where documented; standard queries use authenticated user client + RLS.
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-secret-key"

# 4. AI Copilot Provider Configuration (STRICTLY SERVER-ONLY)
# Supported values: "gemini" | "openai" | "deterministic_fallback"
AI_PROVIDER="gemini"
AI_API_KEY="your-server-side-ai-api-key"
AI_MODEL_NAME="gemini-2.5-flash"

# 5. CSV Import Configurable Limits (Optional Overrides)
CSV_MAX_FILE_SIZE_BYTES="5242880"
CSV_MAX_ROWS_PER_BATCH="10000"
```

### 3.1 Startup Environment Validation (`lib/config/env.ts`)
* The application validates required environment variables at server startup using Zod.
* If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, startup fails immediately with an explicit configuration error listing the missing variable name.
* If `AI_API_KEY` is missing or empty, the application **does not crash**; instead, `lib/ai/provider.ts` logs a startup notice and automatically activates `deterministic_fallback` mode so all non-LLM features and deterministic Copilot explanations work out-of-the-box.

---

## 4. Database, Authentication, and Migration Setup (Supabase)

### 4.1 Database Schema & Migrations (`supabase/migrations/`)
All database changes must be tracked as sequential, idempotent SQL migration files under `supabase/migrations/`:
1. `0001_extensions_and_enums.sql`: Enables `pgcrypto` (`gen_random_uuid()`) and creates domain check constraints.
2. `0002_core_workspace_and_entities.sql`: Creates `businesses`, `business_memberships`, `categories`, `customers`, and `suppliers` with foreign keys and unique constraints.
3. `0003_financial_documents_and_ledger.sql`: Creates `invoices`, `bills`, `transactions`, `payments`, `import_batches`, `import_batch_rows`, `saved_scenarios`, and `notifications` with composite indexes on `(business_id, transaction_date)`, `(business_id, dedup_fingerprint)`, `(business_id, status)`, and `(business_id, condition_key)`.
4. `0004_rls_policies_and_rpc.sql`: Enables Row Level Security (`ENABLE ROW LEVEL SECURITY`) on all 12 tables, creates `public.is_business_member(UUID)`, defines `SELECT/INSERT/UPDATE/DELETE` policies, and defines atomic PostgreSQL RPC functions for transactional operations (`record_payment_atomic`, `commit_csv_import_batch_atomic`, `create_business_with_default_categories`).

### 4.2 Supabase Authentication Configuration
* **Provider:** Email + Password authentication enabled in Supabase Auth.
* **Email Confirmation Policy:**
  * *Local / Portfolio Evaluation Mode:* Email confirmation can be toggled off in the development/demo Supabase project so evaluators can create an account and immediately test business creation and join codes without waiting for SMTP verification emails.
  * *Production Mode:* Email confirmation enabled with custom SMTP configured in Supabase Auth settings, and Redirect URLs allowlisted strictly to `https://<production-domain>/auth/callback` and `http://localhost:3000/auth/callback`.
* **Session Handling:** Managed via `@supabase/ssr` using secure HTTP-only cookies refreshed in Next.js `middleware.ts`.

---

## 5. Production Environment Separation & Vercel Deployment

### 5.1 Environment Separation
* **Development Environment:** Local Next.js server (`localhost:3000`) connected to a dedicated **Development Supabase Project** (or local Supabase CLI container).
* **Preview / Staging Environment:** Vercel Preview deployments connected to the Development/Staging Supabase Project.
* **Production Environment:** Vercel Production deployment (`main` branch) connected to an isolated **Production Supabase Project** with separate database credentials, separate `SUPABASE_SERVICE_ROLE_KEY`, and separate `AI_API_KEY`.

### 5.2 Build and Deployment Pipeline (Vercel)
1. **Pre-Deploy Quality Gate (GitHub Actions / Vercel Build):**
   * `npm run typecheck` (`tsc --noEmit` — zero TypeScript errors)
   * `npm run lint` (ESLint — zero errors)
   * `npm run test:run` (Vitest unit test suite for `lib/finance/` and `lib/csv/` must pass `100%`)
   * `npm run build` (Next.js production build succeeds)
2. **Database Migration Step:**
   * Apply any pending SQL migrations in `supabase/migrations/` to the target Supabase database prior to promoting the Vercel build.

---

## 6. Post-Deployment Verification Checklist

After deploying to Vercel and connecting Supabase, the following 8-step verification smoke test must be executed before declaring the deployment ready:

1. **HTTPS & Security Headers Check:** Confirm the production URL serves over HTTPS and returns `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`.
2. **Client Bundle Secret Check:** Inspect browser DevTools Network/Sources tab to confirm only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are visible; verify `SUPABASE_SERVICE_ROLE_KEY` and `AI_API_KEY` are absent.
3. **Auth & Onboarding Smoke Test:** Sign up a new user $\rightarrow$ Create a Business $\rightarrow$ Verify standard income/expense categories are seeded and Empty Dashboard renders with `₹0.00` (no fake data).
4. **Join-Code Multi-User Isolation Test:** Sign up a second user in an incognito window $\rightarrow$ Attempt to access Business 1 by URL (`403` blocked) $\rightarrow$ Join Business 1 using its 10-character Join Code $\rightarrow$ Verify shared access succeeds $\rightarrow$ Regenerate Join Code and verify the old code is invalidated.
5. **CSV Import & Opening Balance Test:** Set an Opening Balance (`₹3,40,000` as of `2026-04-30`) $\rightarrow$ Upload sample CSV $\rightarrow$ Verify Preview, Duplicate Detection, and final `Available Cash` calculation.
6. **Risk Simulator & Saved Scenario Test:** Move sliders (`Revenue Decline`, `Customer Payment Delay`, `Unexpected Expense`, `Proposed Investment`), verify immediate chart/KPI update, save scenario, and verify real ledger balances remain unchanged.
7. **Reports & Print/PDF Check:** Open Weekly, Monthly, Yearly (`FY 2026–27`), Customer, and Supplier reports in both `Statistical` and `Risk Overview` modes; trigger `Print / Save as PDF` (`Ctrl+P`) and verify navigation chrome is hidden and light-ink tables paginate cleanly.
8. **AI Copilot Check:** Ask a grounded question about current cash and overdue receivables; verify response matches Dashboard figures and displays source reference chips.

