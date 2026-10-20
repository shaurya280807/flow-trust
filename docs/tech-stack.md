# FlowTrust — Recommended Tech Stack

**Status:** Recommended, not final. Nothing listed here has been built yet.
Package versions and provider pricing will be checked before setup.

**Approach:** Start with a single Next.js + TypeScript app. Add a separate
Python service only if the analytics later need it.

---

## 1. Stack at a glance

| Layer | Technology | Why |
|---|---|---|
| Language | TypeScript | Types across frontend and server code catch mistakes early |
| Web framework | Next.js (React) | Pages and server endpoints in one project, less setup |
| Styling | Tailwind CSS | Fast, consistent, responsive styling |
| UI components | shadcn/ui | Ready-made dialogs, cards, tables, forms |
| Charts | Recharts | Income, expenses, cash balance and trends |
| Icons | Lucide React | One consistent icon set |
| CSV parsing | PapaParse | Reliable CSV reading instead of manual string splitting |
| Validation | Zod | Checks uploaded rows and API input before processing |
| Financial calculations | TypeScript modules (`lib/finance/`) | Deterministic, testable metrics |
| AI explanations | OpenAI API (server-side) | Turns calculated metrics into plain-language summaries |
| Database and auth | Supabase (PostgreSQL + Auth + Row Level Security) | Accounts, saved records, per-business access control |
| Version control | Git + GitHub | History and collaboration |
| Deployment | Vercel | Simple hosting for Next.js |
| Optional analytics | Python + Pandas, optionally FastAPI | Only if heavier data processing is needed later |

## 2. Why Next.js first

For a small team, one codebase is easier to build, deploy and debug.

- Pages, UI and server endpoints live in one project.
- Types are shared between frontend and server.
- Fewer services to configure and deploy.
- API keys and sensitive processing stay on the server.

**Why not a separate Python backend from day one?** It is a second app to
deploy, secure and connect. That is worth it for model-heavy work, but our
first job is importing records and calculating clear metrics. We will add
Python/FastAPI only if a real need comes up, such as a Python-only model or a
larger data pipeline.

## 3. Frontend

**Next.js + React** — sign-in and onboarding, CSV upload, dashboard,
records table and filters, charts, risk explanations, reports.

**Tailwind CSS** — spacing, typography, colours, layout, responsive design.

**shadcn/ui** — buttons, cards, tabs, dropdowns, dialogs, tooltips, tables.
Reviewed for accessibility and visual consistency.

**Recharts** — monthly income vs expenses, net cash-flow trend, balance over
time, expense categories, projected balance scenarios. Every chart has labels,
units and an empty state.

**Lucide React** — small, consistent icons.

## 4. Data import and validation

**PapaParse** reads uploaded CSV files.

Expected fields (final format to be documented separately): date,
description, amount, type, category, party, reference, due date.

**Zod** validates every row before it reaches the calculations:

- Required fields are present.
- Dates parse correctly.
- Amounts are numeric and within sensible limits.
- Types use supported values.
- Duplicate rows are flagged.
- Invalid rows are explained to the user.

The original upload is kept separate from the cleaned records, and a
transaction's meaning is never changed silently.

## 5. Financial calculations

All calculations live in a separate, tested module (`lib/finance/`), never
inside UI components and never done by the AI.

| Metric | Calculation | What it tells the user |
|---|---|---|
| Total inflow | Sum of money received in the period | Money in |
| Total outflow | Sum of money paid in the period | Money out |
| Net cash flow | Inflow − outflow | Whether cash grew or shrank |
| Essential expenses | Sum of expenses in essential categories | Regular commitments |
| Reserve coverage | Available cash ÷ average monthly essential expenses | Months of expenses covered |
| Income variability | Variation in monthly income over enough history | How predictable income is |
| Late-payment rate | Late payments ÷ payments with known outcome | Payment punctuality |
| Invoice ageing | Today − due date for unpaid invoices | How long amounts are overdue |

Things to define before coding:

- How transfers, refunds and reversals are treated.
- How to avoid double-counting (for example, a credit sale and its later payment).
- What counts as an essential expense (may need the user's input).
- Short or incomplete history must be shown as a limitation, not a confident result.
- No derived indicator is called a credit score.

## 6. AI integration

**AI does:**

- Explain trends the calculation engine has already worked out.
- Summarise changes across months.
- Explain which figures led to a warning.
- Write short plain-language reports.
- Suggest questions worth looking into.

**Code does (never the AI):**

- Sums, averages, ratios and cash-flow figures.
- Overdue checks.
- Field validation.
- Risk and resilience formulas.
- Access permissions.

**Flow:**

1. Server validates and cleans the data.
2. Calculation engine produces a small set of metrics.
3. Server sends only those metrics and needed context to the model.
4. Model returns a structured explanation.
5. App checks the response and shows it next to the actual figures.

Only the data the answer needs is sent. Users are told when an external AI
provider processes their information. The API key never reaches the browser.
If the AI is unavailable, the dashboard and calculations keep working.

## 7. Database, authentication and security

Supabase handles accounts and saved financial history.

Likely tables: `businesses`, `business_members`, `contacts`, `documents`
(invoices and bills), `payments`, `import_jobs`.

**Why PostgreSQL:** the data is relational. A business has many users,
contacts, invoices and payments.

**Security rules:**

- Row Level Security so users only see their own business's data.
- Service-role and AI keys stay on the server.
- Never store banking passwords, UPI PINs, OTPs or card details.
- Demo data is synthetic and labelled as such.
- No raw financial records or secrets in logs.
- Users can delete demo data.

## 8. Project structure

```text
flowtrust/
├── app/
│   ├── page.tsx
│   ├── dashboard/
│   ├── records/
│   ├── contacts/
│   ├── simulator/
│   ├── copilot/
│   ├── reports/
│   └── api/
├── components/
│   ├── dashboard/
│   ├── charts/
│   ├── records/
│   └── ui/
├── lib/
│   ├── csv/          parse.ts, validate.ts
│   ├── finance/      metrics.ts, simulator.ts
│   ├── ai/           explain.ts
│   └── supabase/
├── types/
├── tests/
├── public/
├── .env.example
├── package.json
└── README.md
```

Folders are created as features are built, not all at once.

## 9. Environment variables

Secrets live in local `.env` files and in the hosting provider's settings.
Only `.env.example` with empty placeholders is committed.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Server-side only
OPENAI_API_KEY=
```

Anything prefixed `NEXT_PUBLIC_` is visible in the browser, so private keys
never use that prefix. The anon key alone is not security; Row Level Security
policies are.

## 10. Deployment

- Code on GitHub.
- Next.js app deployed to Vercel.
- Environment variables set in Vercel.
- All server routes tested after each deploy.

A separate Python service, if ever needed, is deployed on its own host with
protected, validated endpoints.

## 11. Build order

**Phase 1: Core**
Next.js project, dashboard shell and navigation, CSV import, validation,
inflow / outflow / net cash flow.

**Phase 2: Differentiators**
Customer and supplier payment metrics, reserve coverage, risk simulator,
charts, warnings for incomplete data.

**Phase 3: AI and reports**
Server-side AI explanations, error handling and rate limits, printable
reports.

**Phase 4: Release**
Supabase auth and Row Level Security, Vercel deploy, mobile and desktop
testing, demo dataset and rehearsed demo.

## 12. Team split

| Member | Owns |
|---|---|
| Developer 1 | Frontend, design system, dashboard, charts |
| Developer 2 | CSV pipeline, financial calculations, tests |
| Developer 3 (if available) | AI, Supabase, deployment, demo prep |

With two people: one owns the finance engine and server endpoints, the other
owns UI and integration. Agree on data types and API responses early.

## 13. Testing checklist

- [ ] Valid CSV imports correctly.
- [ ] Missing or malformed columns give clear errors.
- [ ] Money in and money out are handled consistently.
- [ ] Nothing is double-counted.
- [ ] Duplicate rows are flagged.
- [ ] Empty history shows an empty state, not a false result.
- [ ] Metrics match hand-calculated test cases.
- [ ] Projections state their assumptions.
- [ ] AI explanations match the supplied figures.
- [ ] AI failure does not break the dashboard.
- [ ] No secrets in the browser bundle or on GitHub.
- [ ] Users cannot read another business's records.
- [ ] Demo data is labelled as synthetic.

## 14. What we avoid

- A separate microservice for every feature.
- Letting the AI do financial arithmetic.
- Claiming bank-verified data when the demo uses uploaded or synthetic CSVs.
- Presenting a prototype indicator as an official credit score.
- Real financial records in a public repository.
- Storing bank logins or payment secrets.
- Adding more data sources before the core workflow works.

## 15. Summary

**Core stack:** Next.js + TypeScript + Tailwind CSS + shadcn/ui + Recharts +
PapaParse + Zod + server-side OpenAI API + Supabase + Vercel.

**Later, only if needed:** Python + Pandas / FastAPI.

**A good MVP lets someone:** upload a sample CSV, see validated records,
understand key cash-flow figures, explore a risk scenario with a clear
explanation, and get an AI summary based on those figures, with synthetic
data clearly marked.
