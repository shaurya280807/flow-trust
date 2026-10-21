# FlowTrust — Beyond Balance. Into Resilience.

FlowTrust is an AI-assisted financial management, relationship intelligence, and cash-flow risk simulation platform for small businesses. It helps business owners understand their true cash position, track customer receivables and supplier payables, evaluate historical payment behaviour, simulate forward-looking financial pressures, and generate printable financial and risk reports.

---

## Project Status

* **Current Phase:** Master MVP Specifications & Decision Finalization Complete (Ready for Phase P0 Implementation & Synthetic Dataset Generation).
* **Application Code:** Not yet initialized (repository currently houses the complete authoritative specification suite under [`docs/`](./docs/README.md)).
* **Synthetic CSV Datasets:** Canonical data model and CSV schemas are finalized in [`docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md`](./docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md); synthetic CSV files will be generated in the next phase following specification review.

---

## Approved Technology Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript |
| **Frontend & Routing** | Next.js (App Router) + React |
| **Styling & Components** | Tailwind CSS + shadcn/ui + Lucide React |
| **Charts & Visualization** | Recharts |
| **Backend & Validation** | Next.js Route Handlers / Server Actions + Zod |
| **Financial Engine** | Deterministic TypeScript modules (`lib/finance/`) |
| **CSV Ingestion** | PapaParse + Zod + 2-Layer Deterministic Deduplication |
| **Database & Auth** | Supabase (PostgreSQL + Supabase Auth + Row Level Security) |
| **AI Copilot** | Server-side Provider Adapter (Google Gemini default + Deterministic Fallback) |
| **Reports Export** | Browser Print $\rightarrow$ Save as PDF (`@media print`) |
| **Testing & Deployment** | Vitest + Playwright · Deployed on Vercel |

---

## Documentation Index

Start with the [**Master Documentation Index (`docs/README.md`)**](./docs/README.md):

* **Product & Workspace:**
  * [Product Scope & Phased Priorities](./docs/product/PRODUCT_SCOPE.md)
  * [Workspace, Membership & Onboarding Specification](./docs/product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md)
* **Architecture & Security:**
  * [Technology Stack & Architecture Specification](./docs/architecture/TECH_STACK_AND_ARCHITECTURE.md)
  * [Security, Data Integrity & Operational Reliability Specification](./docs/architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md)
* **Financial Foundation & Data:**
  * [Financial Foundation & Calculation Specification](./docs/financial/FINANCIAL_FOUNDATION_SPECIFICATION.md)
  * [Dataset Strategy, Canonical Data Model & Synthetic Data Specification](./docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md)
  * [CSV Import & Validation Specification](./docs/data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md)
* **Feature Specifications:**
  * [Risk Simulator MVP Specification](./docs/features/RISK_SIMULATOR_SPECIFICATION.md)
  * [Customer & Supplier Intelligence Specification](./docs/features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md)
  * [Reports & Printable Business Intelligence Specification](./docs/features/REPORTS_SPECIFICATION.md)
  * [AI Copilot MVP Specification](./docs/features/AI_COPILOT_SPECIFICATION.md)
  * [Notifications & Reminders MVP Specification](./docs/features/NOTIFICATIONS_AND_REMINDERS_SPECIFICATION.md)
* **Design, Quality & Operations:**
  * [Complete Application UI/UX & Visual Design Specification](./docs/design/UI_UX_AND_VISUAL_DESIGN_SPECIFICATION.md)
  * [Testing Strategy & Definition of Done](./docs/quality/TESTING_AND_DEFINITION_OF_DONE.md)
  * [Deployment & Environment Readiness Specification](./docs/operations/DEPLOYMENT_AND_ENVIRONMENT_READINESS.md)
  * [Master MVP Decision Finalization & Consistency Audit](./docs/project/MVP_DECISIONS_AND_CONSISTENCY_AUDIT.md)
