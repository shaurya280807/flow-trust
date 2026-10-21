# FlowTrust — CSV Import and Validation Specification

**Status:** Approved Authoritative MVP Specification (v1.0)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Authoritative Scope:** Repository Dataset Audit Findings, Dataset Suitability Matrix, 7-Stage CSV Import Workflow, Column Mapping, Validation Rules, Duplicate Detection, Transaction Persistence, Opening-Balance Safeguards, Traceability, and Import Test Cases  
**Related Specifications:** [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](./DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) · [FINANCIAL_FOUNDATION_SPECIFICATION.md](../financial/FINANCIAL_FOUNDATION_SPECIFICATION.md) · [WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](../product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md)

---

## 1. Repository Dataset Inventory & Suitability Matrix

### 1.1 Current Dataset Audit Findings
An audit of the repository root and subdirectories confirms that **no CSV datasets exist in the repository yet**.
* FlowTrust's canonical schemas and required CSV formats (`CSV Format 1: Unified Cash Transactions`, `CSV Format 2: Bank-Style Statement`, and `CSV Format 3: Invoices & Bills Schedule`) have been established from scratch in [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](./DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md).
* Synthetic CSV files will be generated in a subsequent phase following those exact schemas.

### 1.2 Dataset Suitability Matrix Across FlowTrust Capabilities
Not every CSV file contains the information required to power every financial feature. The import UI and calculation engine must enforce the following suitability boundaries and communicate limitations transparently:

| FlowTrust Capability | CSV Format 1: Unified Transactions (`flowtrust_transactions.csv`) | CSV Format 2: Bank Statement (`bank_statement_export.csv`) | CSV Format 3: Invoices & Bills (`flowtrust_documents.csv`) | Format 1 (or 2) + Format 3 Combined |
|---|---|---|---|---|
| **Available Cash & Ledger History** | **Supported** (for post-opening-cutoff rows) | **Supported** (`BANK` account rows) | **Partial** (only via settled payment rows if linked to cash) | **Fully Supported** |
| **Income & Expense Category Breakdowns** | **Supported** (`category` column) | **Limited** (defaults to `Other Income`/`Other Expenses` unless categorized) | **Supported** (for document categories; cash basis uses payment dates) | **Fully Supported** |
| **Customer Receivables (`Unpaid` / `Overdue`)** | **Not Supported** (cash movements only; no open invoices) | **Not Supported** (no open invoices or due dates) | **Fully Supported** (`INVOICE` rows) | **Fully Supported** |
| **Supplier Payables (`Unpaid` / `Due Soon`)** | **Not Supported** (cash movements only; no open bills) | **Not Supported** (no open bills or due dates) | **Fully Supported** (`BILL` rows) | **Fully Supported** |
| **Customer Payment-Delay Metrics & On-Time Rate** | **Not Supported Alone** (lacks invoice `due_date`) | **Not Supported** (lacks invoice `due_date`) | **Supported** (for `PAID` invoices with `due_date` and `settlement_date`) | **Fully Supported** |
| **Risk Simulator Projections** | **Partial** (supports historical operating run-rate only; no scheduled invoices/bills) | **Partial** (supports historical run-rate only) | **Partial** (supports scheduled receivables/payables only; no direct expense run-rate) | **Fully Supported** (hybrid scheduled + run-rate baseline) |
| **Statistical & Risk Overview Reports** | **Supported** (with disclosure that open receivables/payables are ₹0 if no documents exist) | **Supported** (cash-flow sections only; receivables/payables disclosed as unrecorded) | **Partial** (obligations & customer/supplier reports only) | **Fully Supported** |
| **AI Copilot Grounded Q&A** | **Supported** (answers cash/category questions; states limitation on invoice delays) | **Supported** (answers cash flow questions only) | **Supported** (answers receivables/payables questions) | **Fully Supported** |

---

## 2. The 7-Stage MVP Import Workflow

Every CSV import in FlowTrust—whether initiated during onboarding ([WORKSPACE_AND_ONBOARDING_SPECIFICATION.md](../product/WORKSPACE_AND_ONBOARDING_SPECIFICATION.md) §2.2) or from the workspace navigation—follows the mandatory 7-stage pipeline:

$$\text{Upload} \rightarrow \text{Column Mapping} \rightarrow \text{Validation} \rightarrow \text{Preview} \rightarrow \text{Duplicate Review} \rightarrow \text{Confirm} \rightarrow \text{Import Summary}$$

```mermaid
flowchart LR
    S1["1. Upload CSV"] --> S2["2. Column Mapping"]
    S2 --> S3["3. Validation"]
    S3 --> S4["4. Preview"]
    S4 --> S5["5. Duplicate Review"]
    S5 --> S6["6. Confirm & Persist"]
    S6 --> S7["7. Import Summary"]
```

### 2.1 Stage 1: Upload
* **Supported File Format:** Standard comma-separated values (`.csv`, MIME types `text/csv`, `application/csv`, `text/plain`), encoded in `UTF-8` (with automatic stripping of `UTF-8 BOM` `\uFEFF`).
* **Import Mode Selection:** The user selects whether they are uploading:
  1. **Cash Transactions / Bank Statement** (creates `transactions` and optional linked `payments`), or
  2. **Invoices & Bills Schedule** (creates `invoices`, `bills`, counterparties, and optional settled `payments`).
* **Single-File Operation:** Each import operation processes **one `.csv` file at a time** in the MVP to keep column mapping, preview, and duplicate resolution unambiguous. Users can run multiple sequential imports at any time.
* **Configurable MVP Limits (`lib/config/import.ts`):**
  * **Maximum File Size:** `5 MB` (`5,242,880 bytes`).
  * **Maximum Data Rows per Batch:** `10,000 rows` (excluding header row and blank trailing lines).
  * *Rationale:* A 10,000-row CSV (~1.5 MB) covers several years of small-business transactions while parsing in `< 300ms` via PapaParse and validating within a single serverless request timeout on Vercel.
* **Empty & Structural File Checks (Immediate Pre-Mapping Rejection):**
  * `0-byte` file $\rightarrow$ Rejected with: `"The selected file is empty (0 bytes). Please upload a valid CSV file with a header row and at least one record."`
  * Header-only file (0 non-blank data rows) $\rightarrow$ Rejected with: `"No data rows were found below the header row."`
  * Binary/non-text file (e.g., renamed `.xlsx` or `.pdf` containing null bytes `\x00`) $\rightarrow$ Rejected with: `"Unsupported binary file format. Please export your spreadsheet as a standard UTF-8 .csv file."`
* **Header Detection:** The first non-blank line is parsed as the header row (`header: true` in PapaParse, with `skipEmptyLines: 'greedy'`). Duplicate blank header columns (`""`) are ignored unless they contain non-empty cell values, in which case a warning is shown.
* **Cancellation:** A prominent **Cancel Import** action is available at Stages 1 through 5. Cancelling before Stage 6 writes zero financial records to the database.

### 2.2 Stage 2: Column Mapping
* **Automatic Alias Matching + Mandatory User Inspection:**
  * Upon parsing headers, FlowTrust normalizes column names (`trim()`, lowercase, replace spaces/hyphens/slashes with `_`) and proposes mappings using the alias tables defined in [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](./DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md) §3.1–3.3.
  * **Never Auto-Commit Mappings:** The user is always shown the Column Mapping screen before validation proceeds so they can verify or override every field mapping.
* **Amount & Sign Mapping Modes (Transactions / Bank Statements):**
  The mapper supports two explicit amount structures:
  1. **Single Amount + Type/Sign Mode (Format 1):** Maps `Amount Column` + `Transaction Type Column` (`INFLOW`/`OUTFLOW`, `INCOME`/`EXPENSE`, `CREDIT`/`DEBIT`, `Dr`/`Cr`). If the file has no `Type` column and uses signed numbers (`+15000` for inflow, `-4500` for outflow), the user must explicitly toggle `"Use positive/negative sign to determine Inflow vs Outflow"`.
  2. **Split Debit / Credit Columns Mode (Format 2 Bank Statement):** Maps `Debit / Withdrawal Column` ($\rightarrow$ `OUTFLOW`) and `Credit / Deposit Column` ($\rightarrow$ `INFLOW`).
* **Handling Missing Optional Columns:**
  * Optional fields (`Category`, `Account`, `External Reference ID`, `Counterparty Name`, `Document Number`, `Due Date`) may be left as `-- Not Mapped --`.
  * Unmapped `Category` defaults to `Other Income` (for inflows) or `Other Expenses` (for outflows), flagged with an informational notice.
  * Unmapped `Account` defaults to `BANK`.
  * Unmapped `Due Date` on an invoice/bill sets `due_date = NULL` (never inventing a 30-day due date unless the user explicitly enables a column or edits the document).
* **Anti-Semantic-Collision Rule:**
  * The auto-mapper must never map `closing_balance` / `running_balance` to `amount`, never map `issue_date` to `due_date`, and never map `customer_code` to `document_number`.

### 2.3 Stage 3: Validation Rules
Every row is validated server-side (and previewed client-side) using shared Zod schemas (`lib/csv/validators.ts`). Issues are classified into three strict severity levels:

#### Level 1: Row-Blocking Errors (`ERROR` — Row Cannot Be Imported)
1. `MISSING_REQUIRED_FIELD`: Missing `transaction_date` (or `issue_date`), `description` (for transactions), `counterparty_name` (for documents), `document_number` (for documents), or `amount`/`total_amount`.
2. `INVALID_DATE`: Unparseable date string or calendar-impossible date (e.g., `2026-02-30`, `2026-13-01`, `abc`).
3. `AMBIGUOUS_DATE_FORMAT`: A slash/hyphen date where the first two components are both `<= 12` (e.g., `03/04/2026`) **unless** the user selects the file's explicit date convention (`DD/MM/YYYY [Indian Standard — Default]` vs `YYYY-MM-DD`) in the mapping bar. (`MM/DD/YYYY` is rejected unless explicitly converted).
4. `INVALID_AMOUNT`: Non-numeric amount after stripping currency symbol (`₹`, `Rs.`, `INR`) and digit-grouping commas, or `amount == 0`, `NaN`, or `Infinity`.
5. `NEGATIVE_UNSIGNED_AMOUNT`: Negative number in a column expected to be unsigned when a separate `Type` or `Debit/Credit` column is mapped (prevents double-negation sign-flip errors).
6. `CONFLICTING_DEBIT_CREDIT`: Both `Debit` and `Credit` columns contain non-zero values on the same row, or both are `0`/blank.
7. `CURRENCY_MISMATCH`: Row explicitly specifies a currency code/symbol (e.g., `USD`, `$`, `EUR`, `€`) that does not match the active workspace's `currency_code` (`INR`).
8. `UNSUPPORTED_TRANSACTION_TYPE`: `type` column contains an unrecognized token not matching any supported inflow/outflow/transfer/opening-balance alias.
9. `INVALID_DOCUMENT_AMOUNTS`: On Format 3 documents, `amount_paid < 0`, `amount_paid > total_amount` (overpayment), or `amount_paid > 0` without a valid `settlement_date`.
10. `INVALID_DATE_ORDER`: On Format 3 documents, `due_date < issue_date` or `settlement_date < issue_date`.

#### Level 2: Reviewable Warnings (`WARNING` — Allowed After User Review)
1. `POSSIBLE_DUPLICATE`: Row matches an existing workspace record or an earlier row in the same file via composite fingerprint `(date, direction, amount, normalized_description)` (see Section 2.5).
2. `SAME_DATE_AMOUNT_DIFFERENT_DESC`: Row shares `(date, direction, amount)` with an existing record, but has a different description (defaults to **Import**, highlighted for user awareness).
3. `PRE_OPENING_CUTOFF`: `transaction_date <= businesses.opening_balance_date`. Row will be imported with `is_pre_opening_cutoff = true` for historical analytics/reports, **without** changing current `Available Cash`.
4. `FUTURE_DATED_TRANSACTION`: `transaction_date > current_date` on an actual cash transaction. Flagged because `transactions` represent settled cash movements; user is warned to exclude scheduled future items or import them as open `invoices`/`bills` instead (blocked by default unless user explicitly confirms it is a same-day timezone difference).
5. `MISSING_DUE_DATE`: Invoice or bill has no `due_date`. Will be imported as an open receivable/payable, but excluded from overdue ageing and payment-delay calculations until a due date is added.
6. `NEW_COUNTERPARTY_WILL_BE_CREATED`: `counterparty_name` does not match any existing customer/supplier (after case-folding and whitespace trimming); a new directory entity will be created upon confirmation. Also warns if a near-match name exists (e.g., `"Sahyadri Foods"` vs `"Sahyadri Foods Pvt Ltd"`).
7. `UNMATCHED_DOCUMENT_REFERENCE`: A transaction row specifies a `document_number` (`INV-999`) that does not exist in `invoices`/`bills`; warns that the row will be recorded as a general customer/supplier receipt/payment without document allocation unless the document is imported first.

#### Level 3: Informational Notices (`INFO` — No Action Required)
1. `BLANK_ROWS_SKIPPED`: Count of completely empty rows ignored during parsing.
2. `DEFAULT_CATEGORY_APPLIED`: Rows with blank category assigned to `Other Income` / `Other Expenses`.
3. `CLOSING_BALANCE_COLUMN_IGNORED`: Confirms that a bank statement's `closing_balance` column was ignored for transaction creation.

### 2.4 Stage 4: Preview
Before committing any records, the Preview screen must display:
* **Batch Counter Strip:**
  * `Total Data Rows Parsed`
  * `Valid & Ready to Import`
  * `Warnings (Review Recommended)`
  * `Errors (Will Not Be Imported)`
* **Active Parsing Assumptions Banner:** Explicitly states the applied date format (`DD/MM/YYYY`), currency (`INR ₹`), sign/column mapping rule, and opening-balance cutoff date (`opening_balance_date`, if configured).
* **Interactive Filterable Table (`All Rows` | `Errors Only` | `Warnings Only` | `Ready`):**
  * Shows source row number (`#`), parsed date (`14 Oct 2026`), description, counterparty, interpreted direction badge (`+ INFLOW` / `- OUTFLOW`), normalized amount (`₹25,000.00`), category, and validation badge/message.
  * Never silently discards invalid rows—every rejected row is visible in the `Errors Only` tab with its exact column and reason.

### 2.5 Stage 5: Duplicate Review
FlowTrust implements a **two-layer deterministic duplicate-detection strategy** (`lib/csv/deduplicator.ts`):

#### Layer 1: Exact File or External Reference Match (`CONFIRMED_DUPLICATE`)
1. **Whole-File Re-Import Detection:** Computes the SHA-256 hash (`file_sha256`) of the uploaded CSV file and checks `import_batches` for the active `business_id`. If an identical file was already imported (`status IN ('COMPLETED', 'PARTIAL_COMPLETED')`), displays a prominent top-level alert: `"This exact file (filename.csv) was already imported on [Date]."`
2. **External Identifier Match:**
   * For `transactions`: Non-empty `external_reference` (`UTR`/`reference_id`) matches an existing `ACTIVE` transaction in the same `business_id` (or an earlier row in the same CSV file).
   * For `invoices` / `bills`: `document_number` matches an existing document in the same `business_id` (or an earlier row in the same CSV file).
   * **Default Resolution:** Automatically set to **`Skip (Do Not Import)`** (`CONFIRMED_DUPLICATE`). Cannot be imported as a duplicate `document_number` due to unique constraints.

#### Layer 2: Composite Fingerprint Match (`POSSIBLE_DUPLICATE`)
When `external_reference` is blank, FlowTrust computes a deterministic `dedup_fingerprint`:
$$\text{dedup\_fingerprint} = \text{SHA256}\left(\text{business\_id} \,\|\, \text{YYYY-MM-DD} \,\|\, \text{direction} \,\|\, \text{amount\_paise} \,\|\, \text{normalize}(\text{description})\right)$$
where `normalize(description)` converts to lowercase, collapses multiple spaces, and strips punctuation.

| Match Condition | Classification | Default Action in UI | User Override Allowed? |
|---|---|---|---|
| Same `date` + `direction` + `amount` + `normalized_description` (and same `counterparty` if present) | `POSSIBLE_DUPLICATE (High Confidence)` | **Skip (Excluded by Default)** | Yes — user can toggle `"Import Anyway"` per row if two identical payments genuinely occurred on the same day. |
| Same `date` + `direction` + `amount`, **different** `normalized_description` | `SAME_DATE_AMOUNT_DIFFERENT_DESC (Low Confidence Notice)` | **Import (Included by Default)** | Yes — user can toggle `"Skip"` if they recognize it as a duplicate entry with reworded narration. |

### 2.6 Stage 6: Confirmation and Transactional Persistence
* **Explicit Confirmation Action:** The user clicks **`Confirm & Import [N] Records`**, where `[N]` is the exact count of valid rows plus user-approved warning rows (excluding all `ERROR` rows and all `Skip`-selected duplicate rows).
* **Partial Import Policy (Finalized MVP Decision):**
  * If a 200-row CSV contains 195 valid rows, 3 skipped duplicates, and 2 error rows, the user may either:
    1. **Import the 195 Valid Rows Now** (recording the 2 rejected rows and 3 skipped duplicates in `import_batch_rows` so the summary and downloadable error report identify them clearly), OR
    2. **Cancel Import**, fix the 2 rows in their CSV file, and re-upload.
* **Atomic Database Transaction & Failure Recovery:**
  * All database inserts for Stage 6 (`import_batches`, new `customers`/`suppliers`, `invoices`/`bills`, `transactions`, `payments`, and `import_batch_rows`) execute inside a **single atomic PostgreSQL transaction** via a server-side RPC / transaction block.
  * If any database error, network drop, or constraint violation occurs halfway through writing the batch, **PostgreSQL rolls back the entire transaction** so zero partial or orphaned records are written.
  * The UI never shows a false success screen on failure; it displays an actionable error banner and allows safe retry without creating duplicates.

### 2.7 Stage 7: Import Summary
Immediately after Stage 6 commits, FlowTrust displays the **Import Summary Card** containing:
1. **Batch Metadata:** File name, import timestamp, and Batch ID (`import_batch_id`).
2. **Row Breakdown:**
   * `Successfully Imported:` $N_{\text{imported}}$ records
   * `Skipped Duplicates:` $N_{\text{duplicates}}$ records
   * `Rejected (Validation Errors):` $N_{\text{errors}}$ records (with a `"Download Rejected Rows CSV"` button if $N_{\text{errors}} > 0$)
3. **Financial & Opening-Balance Impact Summary:**
   * `Post-Opening Cash Inflows Added:` `+₹X` ($count$ rows)
   * `Post-Opening Cash Outflows Added:` `-₹Y` ($count$ rows)
   * `Historical Pre-Opening Rows Recorded:` $count$ rows *(explicitly noting: `"Dated on or before your Opening Balance cutoff date [Date]; included in historical analytics and reports, excluded from current Available Cash to prevent double-counting."`)*
   * `Internal Transfers / Opening Markers Ignored for Income/Expense:` $count$ rows
4. **Next-Step Links:** Direct buttons to `View Imported Transactions`, `Go to Dashboard`, or `Import Another File`.

---

## 3. Opening Balances and Historical Data Safeguards

To prevent the most common financial error in small-business tools—double-counting opening balances alongside historical bank exports—FlowTrust enforces four rules:

1. **Cutoff Date Comparison on Every Imported Row:**
   * If `businesses.opening_balance_date` is set (e.g., `2026-04-30` with `opening_cash_balance = ₹3,40,000`), any imported transaction with `transaction_date <= 2026-04-30` is automatically tagged `is_pre_opening_cutoff = true`.
   * If `businesses.opening_balance_date` is `NULL` (user has not set an opening balance), all imported transactions have `is_pre_opening_cutoff = false`, and the Import Summary reminds the user: `"No Opening Cash Balance is configured yet. Available Cash currently reflects the net sum of imported transactions only. You can set an Opening Balance and cutoff date in Settings."`
2. **Updating the Opening Balance Cutoff Date Later:**
   * Whenever a user sets or changes `opening_balance_date` in Settings, the server atomically recomputes `is_pre_opening_cutoff = (transaction_date <= new_opening_balance_date)` across all workspace `transactions` so `Available Cash` remains 100% consistent regardless of whether the user configured their opening balance before or after importing a CSV.
3. **Detection of `"Opening Balance"` Rows Inside Bank CSVs:**
   * Many Indian bank and accounting exports include a first row with description `"Opening Balance"`, `"B/F"`, or `"Balance Brought Forward"`.
   * If a row's `type` is `OPENING_BALANCE` or its description matches `/^(opening\s+balance|balance\s+b\/f|b\/f\s+balance)$/i`, the validator flags it as `OPENING_BALANCE_MARKER` (`transaction_kind = 'OPENING_BALANCE_MARKER'`) so it is **never** added as an operating cash inflow on top of `businesses.opening_cash_balance`.
4. **Receivables & Payables Reconciliation:**
   * If a workspace has a non-zero aggregate `opening_receivables_balance` (or `opening_payables_balance`) and subsequently imports itemized historical invoices/bills dated on or before `opening_balance_date`, the Import Summary displays a reconciliation warning prompting the user to zero out or adjust their unitemized aggregate opening receivable/payable balance so open obligations are not counted twice.

---

## 4. Import Traceability Requirements

Every imported financial record (`transactions`, `invoices`, `bills`) stores:
* `import_batch_id` (`UUID`, foreign key to `import_batches.id`)
* `import_row_number` (`INTEGER`, 1-based line number from the uploaded CSV)
* `external_reference` (where provided in the source file)

This allows:
1. Filtering the Transactions, Invoices, or Bills table by `Import Batch` to inspect every record created by a specific CSV upload.
2. Displaying provenance in the Transaction/Document detail view (`"Imported from kaveri_oct_transactions.csv (Row #42) on 22 Oct 2026"`).
3. Rolling back an entire erroneous import batch cleanly if no subsequent payments have been linked to its documents.

---

## 5. Required CSV Import Test Cases

All implementations of `lib/csv/` and the import API must pass the following deterministic test suite (also cross-referenced in [TESTING_AND_DEFINITION_OF_DONE.md](../quality/TESTING_AND_DEFINITION_OF_DONE.md)):

| Test ID | Scenario | Input Fixture / Condition | Expected Outcome |
|---|---|---|---|
| `CSV-T01` | Valid Format 1 Transactions Import | 50 valid inflow/outflow rows (`YYYY-MM-DD` & `DD/MM/YYYY`) | All 50 rows pass validation; `Available Cash`, `Cash Inflows`, and `Cash Outflows` match exact expected totals. |
| `CSV-T02` | Valid Format 2 Bank Statement Import | 30 rows with split `Debit` and `Credit` columns + `Closing Balance` column | `Debit` rows map to `OUTFLOW`, `Credit` rows map to `INFLOW`, `Closing Balance` column is ignored for transaction creation. |
| `CSV-T03` | Valid Format 3 Invoices & Bills Import | 10 customer invoices (paid, partially paid, unpaid, overdue) + 5 supplier bills | Creates/links `customers` and `suppliers` by ID, sets `UNPAID`/`PARTIALLY_PAID`/`PAID` statuses accurately, creates linked `payments` for `amount_paid > 0`. |
| `CSV-T04` | Empty & Header-Only Files | `0-byte` file and `1-line` header-only file | Rejected at Stage 1 Upload with actionable error message; zero DB writes. |
| `CSV-T05` | Missing Required Columns | CSV missing `amount` column | Blocked at Stage 2 Column Mapping until `amount` (or `debit`/`credit`) is mapped. |
| `CSV-T06` | Invalid & Ambiguous Dates | Rows with `2026-02-30`, `not-a-date`, and ambiguous `03/04/2026` without format selection | Flagged with `INVALID_DATE` / `AMBIGUOUS_DATE_FORMAT` (`ERROR`); blocked from import while valid sibling rows remain selectable. |
| `CSV-T07` | Malformed & Conflicting Amounts | Rows with `amount = 0`, `amount = "₹12,abc"`, and bank row with both `Debit = 500` and `Credit = 500` | Flagged with `INVALID_AMOUNT` / `CONFLICTING_DEBIT_CREDIT` (`ERROR`); blocked from import. |
| `CSV-T08` | Layer-1 Exact Duplicate Re-Import | Re-uploading the exact same CSV file or rows with existing `reference_id` / `document_number` | File SHA-256 warning displayed; rows with matching `reference_id` / `document_number` flagged `CONFIRMED_DUPLICATE` and skipped by default. |
| `CSV-T09` | Layer-2 Fuzzy Duplicate vs Legitimate Same-Day Same-Amount | Row A shares `(date, direction, amount, description)` with existing txn; Row B shares `(date, direction, amount)` but has a distinct `description` | Row A flagged `POSSIBLE_DUPLICATE` (Default: `Skip`); Row B flagged `SAME_DATE_AMOUNT_DIFFERENT_DESC` (Default: `Import`). |
| `CSV-T10` | Opening Balance Cutoff Safeguard | Business has `opening_cash_balance = ₹1,00,000` at `2026-04-30`; CSV has `-₹15,000` on `2026-04-20` and `+₹20,000` on `2026-05-05` | `2026-04-20` row imported with `is_pre_opening_cutoff = true`; resulting `Available Cash` is `₹1,20,000.00` (not `₹1,05,000.00`). |
| `CSV-T11` | Cross-File Invoice Payment Deduplication | Invoice `INV-101` (`amount_paid = ₹10,000`, `payment_reference = 'UTR-55'`) imported in Format 3, then `UTR-55` imported in Format 1 | Recognizes existing `UTR-55` transaction/payment; does not double-count `₹10,000` in `Available Cash` or `INV-101.amount_paid`. |
| `CSV-T12` | Mid-Import Failure & Atomic Rollback | Simulated database constraint error on row 45 of a 50-row batch during Stage 6 | Entire PostgreSQL transaction rolls back; `0` rows remain in `transactions`; batch marked `FAILED`; safe retry succeeds. |

