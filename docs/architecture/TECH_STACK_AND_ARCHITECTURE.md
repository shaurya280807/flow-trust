# FlowTrust — Technology Stack and Architecture Specification

**Status:** Approved MVP Baseline (v1.2)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Related Specifications:** [PRODUCT_SCOPE.md](../product/PRODUCT_SCOPE.md) · [SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md](./SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md) · [DEPLOYMENT_AND_ENVIRONMENT_READINESS.md](../operations/DEPLOYMENT_AND_ENVIRONMENT_READINESS.md)

---

## 1. Stack Status

The following technology stack is the approved baseline for FlowTrust.

The stack is intended to support a complete, functional portfolio prototype with a maintainable architecture, reliable financial calculations, appropriate data access controls, and room for future expansion.

## 2. Frontend

- **Language:** TypeScript
- **Framework:** Next.js (App Router) with React
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Charts and Visualizations:** Recharts
- **Icons:** Lucide React

The frontend must be responsive and provide a consistent interface across the dashboard, financial records, customer and supplier profiles, risk simulator, AI Copilot, and reports, adhering to [UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md](../design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md).

## 3. Backend and Application Architecture

- **Application Framework:** Next.js
- **API Approach:** Server-side endpoints (Next.js Route Handlers / Server Actions) and server-side application logic within the Next.js application.
- **Validation:** Zod
- **Financial Calculations:** Dedicated deterministic TypeScript modules under `lib/finance/`.

The initial implementation will use a single Next.js codebase instead of maintaining a separate backend service.

Business logic, data validation, authorization checks, and financial calculations must not depend on frontend components.

The architecture keeps its modules organized so that services can be separated later if the project's requirements justify it:

```text
src/ (or root)
├── app/                        # Next.js App Router pages, layouts, and API route handlers
├── components/                 # Reusable UI, layout, ledger, simulator, and report components
├── lib/
│   ├── auth/                   # Server-side session & workspace membership verification
│   ├── db/                     # Supabase server/client initialization & repository queries
│   ├── finance/                # Authoritative deterministic financial calculation engine
│   ├── csv/                    # PapaParse wrapper, header mapper, Zod row validators, deduplicator
│   ├── ai/                     # Provider-agnostic AI Copilot adapter & deterministic fallback
│   └── validations/            # Shared Zod schemas for forms, API payloads, and query params
└── types/                      # Canonical TypeScript domain and database interfaces
```

## 4. Database and Authentication

- **Database:** PostgreSQL
- **Database and Backend Platform:** Supabase
- **Authentication:** Supabase Auth (Email + Password authentication for MVP)
- **Data Access Security:** PostgreSQL Row Level Security (RLS), supported by explicit server-side authorization checks (`verifyWorkspaceMembership`).

The data model supports multiple users belonging to the same business through `business_memberships`.

Business records must be associated with the appropriate `business_id`, and users must only be able to access data they are authorized to access.

Authentication alone is not sufficient authorization. Every protected operation must enforce the appropriate access rules defined in [SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md](./SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md).

## 5. CSV Import

- **CSV Parsing:** PapaParse
- **Input Validation:** Zod
- **Processing:** Server-side validation and transactional database writes.

CSV imports validate incoming data before creating financial records, provide understandable validation errors, and prevent accidental duplicate entries as specified in [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md).

## 6. Financial Calculations

Financial calculations will be implemented in dedicated TypeScript modules organized under:

`lib/finance/`

These modules are responsible for all deterministic financial calculations used throughout FlowTrust:

- Available cash (`lib/finance/cash.ts`)
- Income, expense totals, and net cash flow (`lib/finance/cashflow.ts`)
- Outstanding receivables, payables, partial payment allocations, and overdue ageing (`lib/finance/obligations.ts`)
- Customer and supplier payment-delay metrics, on-time rates, and risk indicators (`lib/finance/intelligence.ts`)
- Risk Simulator baseline, scenario projections, cash buffer, and runway estimates (`lib/finance/simulator.ts`)
- Report period aggregations and data-coverage checks (`lib/finance/reports.ts`)

The exact same calculation logic is reused across the dashboard, customer/supplier profiles, simulator, reports, notifications, and AI Copilot.

Financial figures must be computed and validated by application logic rather than generated by an AI model.

## 7. AI Copilot

The AI Copilot uses a server-side AI API integration with a replaceable provider adapter (`lib/ai/`).

- **Architecture:** Provider-agnostic server-side adapter supporting Google Gemini (`gemini-2.5-flash` recommended default) or OpenAI-compatible endpoints via environment configuration, paired with a deterministic template fallback when no external API key is configured or the provider is unreachable.
- **Security & Grounding Rules:**
  - API keys remain strictly server-side.
  - The AI explains computed financial metrics from `lib/finance/` rather than independently inventing financial figures.
  - The application validates simulation inputs before processing them.
  - The AI receives only the authorized active workspace's financial snapshot necessary to answer the user's request.
  - The application remains usable if the AI service is unavailable.
  - AI-generated insights communicate uncertainty and avoid presenting estimates as guaranteed outcomes.

See [AI_COPILOT_SPECIFICATION.md](../features/AI_COPILOT_SPECIFICATION.md) for full details.

## 8. Reports and PDF Export

Reports use browser-based printing and print-to-PDF (`window.print()` with `@media print` stylesheet rules).

Supported report categories:
- Weekly financial reports (Statistical & Risk Overview)
- Monthly financial reports (Statistical & Risk Overview)
- Yearly financial reports — FY April 1 to March 31 (Statistical & Risk Overview)
- Individual customer performance reports (Statistical & Risk Overview)
- Individual supplier performance reports (Statistical & Risk Overview)

A dedicated server-side PDF-generation service is not required for the MVP. See [REPORTS_SPECIFICATION.md](../features/REPORTS_SPECIFICATION.md).

## 9. Development and Deployment Tools

- **Version Control:** Git
- **Repository Hosting:** GitHub
- **Deployment:** Vercel
- **Environment Configuration:** Server-validated environment variables (documented in `.env.example`)
- **Testing:** Vitest (unit and integration tests for `lib/finance/`, CSV validation, and authorization) and Playwright (end-to-end workflow tests).

Secrets and private API keys must never be committed to the repository. See [DEPLOYMENT_AND_ENVIRONMENT_READINESS.md](../operations/DEPLOYMENT_AND_ENVIRONMENT_READINESS.md).

## 10. Optional Future Technologies

Python, Pandas, or FastAPI may be considered later if FlowTrust develops analytical requirements that are difficult to maintain efficiently within the existing TypeScript architecture. These technologies are not part of the required MVP stack.

## 11. Stack Summary

| Area | Approved Technology |
|---|---|
| Language | TypeScript |
| Frontend | Next.js (App Router) + React |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Next.js Route Handlers / Server Actions |
| Database | PostgreSQL (Supabase) |
| Authentication | Supabase Auth |
| Authorization | PostgreSQL RLS + Server-side membership checks |
| Validation | Zod |
| CSV Parsing | PapaParse |
| Financial Calculations | Deterministic TypeScript modules (`lib/finance/`) |
| AI Integration | Server-side Provider Adapter (Gemini default + Deterministic Fallback) |
| Reports | Browser printing and print-to-PDF (`@media print`) |
| Automated Testing | Vitest + Playwright |
| Version Control | Git + GitHub |
| Deployment | Vercel |
| Optional Future Analytics | Python / Pandas / FastAPI (Deferred) |

## 12. Implementation Priority

Technology implementation follows the project's agreed feature priority order:

- **P0 — Foundation:** Project setup, database schema, authentication, workspace isolation, and financial data model.
- **P1 — Core:** Financial records, dashboard, and CSV import.
- **P2 — Intelligence:** Customer/supplier analysis and Risk Simulator.
- **P3 — AI & Reports:** AI Copilot, in-app notifications, and financial reports.
- **P4 — Polish:** Responsive refinements, usability improvements, and comprehensive testing.

