# FlowTrust — Open Questions

> Companion to [`audit-report.md`](./audit-report.md). Phase 0 only: nothing is implemented.
> Each question has a **recommended default**. If you reply "accept defaults" for a group, those defaults become the decisions and will be recorded in `docs/decisions.md`.
> **Blocks** = implementation of the named milestone (M0–M7, see report §15) should not start until answered.

## Decisions needed before coding starts (shortlist)

These 14 are the only ones that materially change architecture, financial correctness, security or scope. Everything else can safely take the default.

| Must answer | Topic |
|---|---|
| **G1, G2** | Hackathon facts; approve P0/P1/P2 and cut order |
| **A1** | Is the Copilot in the demo or a stretch goal? |
| **F1, F3** | SQLite vs PostgreSQL; Python version |
| **B1, B2, B3, B6** | Cash vs accrual, opening balances, payment linkage, missing due dates |
| **D1, D2** | CSV template shape; real-world file sources |
| **B8, B9** | Simulator baseline method; investment affordability rule |
| **C1** | Authentication mode |

Quick-reply format: `A1: default, B1: option 2, F1: default …` or simply "accept all defaults except …".

---

## A. Product decisions

### A1 — Is the AI Copilot part of the 8-hour MVP?
- **Why it matters:** The deck labels it "advanced / feasibility-dependent"; your brief makes it a primary tab. Fitting it means dropping something else (P0 already ≈ 7.5 h).
- **Options:** (1) Stretch goal built only if P0 finishes early, hidden from nav until working. (2) Include a "Copilot-lite" (snapshot Q&A + offline fallback, ~0.8–1 h) by dropping manual-entry forms (import-only) and the records filters. (3) Full Copilot including scenario tool and answer verifier (needs a second developer or a longer event).
- **Recommended default:** **1**.
- **Blocks implementation:** Yes — scope.

### A2 — What should a *supplier* "on-time rate / rating" mean?
- **Why it matters:** Payment records show how reliably **we pay them**, not supplier quality. Slide 5 shows Supplier A as "Strong", which a viewer will read as "a reliable supplier".
- **Options:** (1) Show the metric for suppliers but label it "Our payment timeliness" and use neutral wording (no Strong/Watch/At risk). (2) Show ratings for customers only; suppliers get statistics without ratings. (3) Keep the deck's wording unchanged.
- **Recommended default:** **1**.
- **Blocks:** Yes, for M5 (Contacts).

### A3 — Currency and locale
- **Why it matters:** Formatting and validation; the deck's "?" symbol was unreadable in extraction, though Indian digit grouping (4,80,000) implies ₹.
- **Options:** (1) INR only, `en-IN` formatting, single currency field in the schema. (2) Multi-currency.
- **Recommended default:** **1**.
- **Blocks:** No (default is safe; please confirm).

### A4 — Can one contact be both a customer and a supplier?
- **Why it matters:** Affects uniqueness rules and statistics direction.
- **Options:** (1) One kind per contact; a business that is both gets two contacts. (2) A single contact with both roles.
- **Recommended default:** **1** (simplest, statistics stay unambiguous).
- **Blocks:** No.

### A5 — How many categories can a contact belong to?
- **Why it matters:** Schema shape for custom categories (slide 5).
- **Options:** (1) Exactly one optional category per contact. (2) Many-to-many.
- **Recommended default:** **1**; categories apply to one kind (customer *or* supplier).
- **Blocks:** No (categories are P1; the nullable column is added now).

### A6 — Navigation naming
- **Why it matters:** "Relationship Intelligence" is jargon for a shop owner; also whether Copilot's tab is hidden until functional (see report §5.2).
- **Options:** (1) Keep your five names exactly. (2) Visible label "Customers & Suppliers" (keep internal name), hide unfinished tabs.
- **Recommended default:** **2**.
- **Blocks:** No.

---

## B. Financial and statistical rules

### B1 — Cash basis or accrual for "Income vs expenses" and "Net cash flow"?
- **Why it matters:** Deck charts are inconsistent: income − expenses = 50, 55, 35, 80, 42 (₹k) but plotted net cash flow = 32, 48, 35, 61, 42. A credit sale is "income" on one basis and not on the other.
- **Options:** (1) Charts use **cash basis** (receipts vs payments) so the gap always equals net cash flow; receivables shown separately as "billed, not yet collected". (2) Accrual for the income/expense chart, cash for net cash flow (needs both bases explained on screen). (3) User toggle.
- **Recommended default:** **1**.
- **Blocks:** Yes — M3 and the data semantics.

### B2 — Opening balance convention
- **Why it matters:** Wrong convention double-counts or drops cash.
- **Options:** (1) Opening cash = cash on hand at `opening_date` (default: day before earliest record); opening receivables/payables = ordinary documents dated before it with no payment; payments on/before opening date are kept for statistics but excluded from cash. (2) Require the user to enter all opening balances as separate figures (cash, total receivables, total payables) with no per-contact detail.
- **Recommended default:** **1** (keeps per-contact history and statistics).
- **Blocks:** Yes — M1.

### B3 — Must every payment be linked to a specific sale/expense?
- **Why it matters:** On-time rate and delay are computed per document; unlinked payments cannot be attributed.
- **Options:** (1) Yes, every payment references a document (via `reference` in CSV, via row action in UI). (2) Allow unlinked payments and auto-allocate oldest-first (FIFO) per contact.
- **Recommended default:** **1** for MVP; FIFO later as an import convenience.
- **Blocks:** Yes — M1 schema and import format.

### B4 — Definition of "on time" and "average delay"
- **Why it matters:** Directly drives ratings (deck: "transparent metrics").
- **Options:** (1) *On time* = document settled on/before `due_date`; *delay* = max(0, settlement − due) averaged over **all** settled documents; also show max delay and avg delay of late payments only. (2) Delay averaged only over late documents. (3) Per-payment instead of per-document.
- **Recommended default:** **1**. Open overdue items are excluded from the rate but always displayed next to it (prevents "never pays = 100 % on time").
- **Blocks:** Yes, for M5.

### B5 — Minimum history and rating thresholds
- **Why it matters:** Prevents unfair labels from tiny samples (deck: "Insufficient").
- **Options:** (1) ≥ 5 settled documents to rate; **Strong** ≥ 85 % on time and nothing > 30 d overdue; **Watch** 60–84 % or something > 30 d overdue; **At risk** < 60 % or something > 60 d overdue. (2) Different numbers, e.g. min 3. (3) No labels, statistics only.
- **Recommended default:** **1** (reproduces the deck's sample: 89 %/3.2 d = Strong, 76 %/6.1 d = Watch).
- **Blocks:** Before M5.

### B6 — What if a record has no due date?
- **Why it matters:** Without it, "on time" and ageing are undefined.
- **Options:** (1) Business-level default payment terms (30 days, editable in Settings); imported rows flagged "assumed". (2) Reject rows without due date. (3) Per-contact terms.
- **Recommended default:** **1**.
- **Blocks:** Yes — M2 (import rules).

### B7 — Out-of-scope accounting items: overpayments, refunds/credit notes, GST/tax, owner draws, loans, transfers
- **Why it matters:** Each changes cash vs income logic.
- **Options:** (1) Not supported in MVP; overpayments rejected; amounts are single gross figures; owner/loan money enters only through opening cash or as ordinary income/expense. (2) Support some (specify).
- **Recommended default:** **1**; stated openly in `financial-rules.md`.
- **Blocks:** No.

### B8 — Simulator baseline method and horizon
- **Why it matters:** The core differentiator. Deck table (₹3,20,000 inflow, ₹2,78,000 outflow) implies a monthly horizon but no method.
- **Options:** (1) **Run-rate:** baseline = trailing 3 complete months' average receipts/payments × horizon; customer delay shifts that customer's receipts out by *N* days. Simple, avoids double-counting, ignores ageing of individual open receivables. (2) **Schedule-based:** expected receipts at `due_date + customer's average delay`, plus new-sales run-rate net of those; more realistic, ~2× logic. (3) Hybrid later.
- **Horizon options:** fixed 30 d, or selectable 30/60/90.
- **Recommended default:** **1**, selectable 30/60/90 with 30 default.
- **Blocks:** Before M4.

### B9 — Investment affordability rule
- **Why it matters:** The deck's stress table omits the ₹1,00,000 investment, so the rule is undefined.
- **Options:** (1) Deduct investment on day 0; verdict by **lowest** projected cash vs a minimum buffer (default = 1 month of average outflows, editable): Affordable ≥ buffer; Tight 0–buffer; Not affordable < 0; evaluated for baseline and stress. (2) Compare only end-of-horizon cash. (3) Instalment/financing support.
- **Recommended default:** **1**.
- **Blocks:** Before M4.

### B10 — Dashboard labels: "Risk outlook", "due soon", "upcoming outflows"
- **Why it matters:** Slide 1 shows "Moderate", "2 due soon" and "upcoming outflows ₹92,000" (same figure as payables on slide 4) with no definitions.
- **Options:** (1) "Due soon" = due within 7 days; "Payables due in 30 days" instead of "upcoming outflows"; "Risk outlook" derived from simulator (High: stress shortfall > 0 or < 1 month cash; Moderate: baseline fine, stress below buffer; Low otherwise) — or omitted from P0. (2) Drop these three from the MVP dashboard.
- **Recommended default:** **1**, outlook shown only once the simulator exists.
- **Blocks:** No.

---

## C. Authentication and account model

### C1 — Authentication mode for the prototype
- **Why it matters:** Security surface, demo friction, and the tenancy model are built on it.
- **Options:** (1) Email + password registration/login with hashed passwords and token auth, plus a seeded demo account. (2) Seeded demo login only (no registration). (3) Google/OAuth.
- **Recommended default:** **1** (≈ 0.5 h; matches "login-based access, account-specific data").
- **Blocks:** Yes — M1.

### C2 — One user per business, or multiple users/roles?
- **Why it matters:** Table design and permissions.
- **Options:** (1) 1 user : 1 business now; schema allows extension. (2) Memberships with roles from day one.
- **Recommended default:** **1**.
- **Blocks:** No.

### C3 — State of a brand-new account
- **Why it matters:** First-run experience (every page is empty otherwise).
- **Options:** (1) Empty, with onboarding: opening cash, then *Import CSV · Add record · Load demo data*. (2) Pre-loaded with demo data.
- **Recommended default:** **1**; demo data clearly labelled "synthetic".
- **Blocks:** No.

### C4 — Data deletion and export
- **Why it matters:** Privacy expectations for a finance product.
- **Options:** (1) "Delete all my data" in Settings (P1); export deferred. (2) Both in P1. (3) Neither.
- **Recommended default:** **1**.
- **Blocks:** No.

---

## D. Data import and supported formats

### D1 — Shape of the CSV template
- **Why it matters:** Partial payments and linkage must be expressible; judges may upload a file live.
- **Options:** (1) **One file** `records.csv` with a `type` column (`sale`, `expense`, `receipt`, `payment`), optional `paid_date` shortcut and `reference` linking payments to documents (report §12.1). (2) Separate files for documents and payments. (3) Plain transactions (no receivables/payables) — not recommended, loses partial payments and the delay statistics.
- **Recommended default:** **1**.
- **Blocks:** Yes — M2.

### D2 — Will users or judges upload files exported from other tools (Tally, Zoho Books, bank statements, Excel)?
- **Why it matters:** Parsing arbitrary exports is a project on its own and would displace P0 work.
- **Options:** (1) Only the documented template plus alias headers; a sample CSV is provided to download. (2) Add a column-mapping UI (P1, +0.75 h). (3) Specific tool(s) — name them.
- **Recommended default:** **1**.
- **Blocks:** Yes — M2 scope.

### D3 — Accepted date formats
- **Why it matters:** `03/04/2026` is silently wrong if guessed.
- **Options:** (1) `YYYY-MM-DD` and `DD/MM/YYYY`/`DD-MM-YYYY` only; never `MM/DD`. (2) ISO only.
- **Recommended default:** **1**.
- **Blocks:** No.

### D4 — Contact name matching during import
- **Why it matters:** "ABC Traders" vs "A.B.C. Traders" would split one customer into two sets of statistics.
- **Options:** (1) Exact match after trimming/case-folding; mismatches are shown as warnings listing new contacts so the user can notice. (2) Fuzzy matching with confirmation (P2).
- **Recommended default:** **1**.
- **Blocks:** No.

---

## E. AI provider and retrieval

### E1 — LLM provider, API key and quota
- **Why it matters:** Determines whether live AI is demonstrable; free-tier limits and model names change over time (to be checked at implementation).
- **Options:** (1) Gemini via a free AI Studio key stored only in a server-side `.env`; Copilot fully functional offline without it. (2) Another provider (OpenAI/Groq). (3) No LLM — deterministic "explain" mode only.
- **Recommended default:** **1**. Please tell me whether you already have a key (never paste it into chat or commit it).
- **Blocks:** Only the Copilot milestone.

### E2 — What data may be sent to the external model?
- **Why it matters:** Sending real business financials/contact names to a third party is a disclosure.
- **Options:** (1) Aggregated figures plus contact names, acceptable because demo data is synthetic; Settings shows a privacy note. (2) Pseudonymise contacts ("Customer 1") before sending and map back locally. (3) Never send names.
- **Recommended default:** **1** for the prototype; **2** if real data may ever be used.
- **Blocks:** No.

### E3 — What may the Copilot *do*?
- **Why it matters:** The deck's example question needs it to run a scenario, not just talk.
- **Options:** (1) Read-only explanations of a server-built snapshot **plus** one validated `run_scenario` tool (no writes). (2) Read-only explanations only; scenarios must be run in the Simulator and passed in. (3) Allow actions (create categories, add records) — not recommended for MVP.
- **Recommended default:** **1**.
- **Blocks:** Copilot design only.

### E4 — Is an offline/fallback Copilot acceptable in the demo?
- **Why it matters:** Live API calls can fail on stage.
- **Options:** (1) Yes — template answers from the same figures with an "AI unavailable" banner. (2) No — live only.
- **Recommended default:** **1**.
- **Blocks:** No.

---

## F. Technology and deployment

### F1 — Database for the prototype: SQLite or PostgreSQL?
- **Why it matters:** No PostgreSQL or Docker is installed; setup and credential debugging can consume an hour of an 8-hour day. This also deviates from the deck (slide 8).
- **Options:** (1) **SQLite** now via SQLAlchemy; switch to PostgreSQL later by changing `DATABASE_URL`. (2) Install PostgreSQL locally. (3) Hosted PostgreSQL (e.g. a free cloud tier).
- **Recommended default:** **1**; money stored as integer paise so behaviour is identical on both.
- **Blocks:** Yes — M0.

### F2 — Drop Alembic for the prototype?
- **Why it matters:** Migrations add overhead while the schema changes hourly.
- **Options:** (1) Drop; create tables from models and re-seed. (2) Keep.
- **Recommended default:** **1**; add Alembic with PostgreSQL.
- **Blocks:** No.

### F3 — Python version
- **Why it matters:** Only Python **3.14.6** is installed; compiled dependencies may lack wheels for it (not verified).
- **Options:** (1) You install Python 3.12 or 3.13 and I build the venv on it. (2) Use 3.14 and run a short install check first; fall back if it fails. (3) Avoid compiled dependencies where possible.
- **Recommended default:** **1** (or **2** if installing is inconvenient).
- **Blocks:** Yes — M0.

### F4 — Drop Pandas/NumPy for P0?
- **Why it matters:** Heavy install, float conversion hurts exactness, data volume is small.
- **Options:** (1) Drop; use stdlib `csv`, SQL aggregates, integer arithmetic. (2) Keep as in the deck.
- **Recommended default:** **1**; reintroduce for forecasting (P2).
- **Blocks:** No.

### F5 — Deployment
- **Why it matters:** A hosted URL adds secrets management, CORS, cold starts, free-tier sleeping and possible cost; the deck says "no hosting is claimed".
- **Options:** (1) Local run with a one-command start plus backup screen recording. (2) Hosted demo (backend + static frontend). (3) Decide after hackathon rules are known.
- **Recommended default:** **1** unless the organisers require a public link.
- **Blocks:** Yes, if a public URL is mandatory (G1).

### F6 — GitHub repository
- **Why it matters:** Workspace is not a git repo and no remote exists. Public repos must contain no secrets or real data.
- **Options:** (1) Initialise git locally after approval; create a **private** repo; nothing is pushed without your explicit go-ahead. (2) Public from the start. (3) Existing repo — share the URL.
- **Recommended default:** **1**.
- **Blocks:** No.

---

## G. Hackathon priorities

### G1 — Hackathon facts
- **Why it matters:** Scope sizing. The deck's team fields are blank and no rules were supplied.
- **Please tell me:** date/time and real build duration (8 h assumed); team size and who codes (React / Python experience); demo format (live, recorded, hosted link, repo submission); judging criteria; whether the demo will be shown on a phone.
- **Recommended default:** 8 h, 1–2 people, local live demo with a backup recording, desktop primary with phone-width verified.
- **Blocks:** Yes — M0.

### G2 — Approve the scope
- **Why it matters:** P0 totals ≈ 7.5 h; nothing is left for Copilot, categories or ageing.
- **Options:** (1) Approve P0/P1/P2 and the cut order in report §4 and §15. (2) Change priorities (state which feature moves). 
- **Recommended default:** **1**.
- **Blocks:** Yes — scope.

### G3 — Visual references and palette
- **Why it matters:** I found **no screenshots** in the workspace. The deck uses a saturated blue (`#2160F5`) plus amber/green, which conflicts with your muted-palette direction.
- **Options:** (1) Follow your written direction (muted blue, off-white, red for critical only); deck colours are reference only; I propose a token sheet before building UI. (2) Follow the deck. Also: tell me which files (if any) in `Downloads\` are your visual references — I did not open unidentified files.
- **Recommended default:** **1**.
- **Blocks:** UI work (M2), not the backend.

### G4 — Demo story and dataset
- **Why it matters:** The deck's stress case shows ₹0 shortfall in both columns, which is a weak demonstration of "risk".
- **Options:** (1) Synthetic business (~6 months, ~12 contacts, ~120 records) tuned so that: ratings show Strong/Watch/At risk/Insufficient, baseline is comfortable, and the "largest customer +30 d, ₹50,000 expense, ₹1,00,000 investment" scenario produces a visible shortfall. (2) Reproduce the deck's numbers exactly (₹4,80,000 cash etc.) with no shortfall. (3) Provide your own synthetic dataset.
- **Recommended default:** **1** (while keeping the deck's headline figures such as ₹4,80,000 cash where possible).
- **Blocks:** No (needed before the M2 seed).

