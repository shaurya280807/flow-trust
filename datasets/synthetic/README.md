# FlowTrust Synthetic Demonstration & Verification Datasets

> **100% Synthetic Data Disclaimer:** Every business, customer, supplier, email address (`@example.com`), phone number (`+91-90000-00XXX`), invoice/bill number, and bank reference (`UTR-SYNTH-*`, `CASH-SYNTH-*`) in this directory is completely fictional and deterministically generated for demonstrating and testing FlowTrust's financial intelligence features.

---

## 1. Authoritative Specifications Followed

All datasets in `datasets/synthetic/` strictly conform to the approved schemas, column names, status enums, and financial formulas defined in:

1. [DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md](../../docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md)
2. [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../../docs/data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md)
3. [FINANCIAL_FOUNDATION_SPECIFICATION.md](../../docs/financial/FINANCIAL_FOUNDATION_SPECIFICATION.md)
4. [CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md](../../docs/features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md)
5. [RISK_SIMULATOR_SPECIFICATION.md](../../docs/features/RISK_SIMULATOR_SPECIFICATION.md)
6. [REPORTS_SPECIFICATION.md](../../docs/features/REPORTS_SPECIFICATION.md)

* **Evaluation Anchor Date (`as_of_date`):** `2026-10-22` (`Asia/Kolkata`, `INR`)

---

## 2. Directory Structure & Separation of Valid vs. Invalid Datasets

```text
datasets/synthetic/
├── README.md                                  # This documentation file
├── manifest.json                              # Master inventory, SHA-256 checksums & ground-truth figures
├── scripts/
│   ├── generate_datasets.mjs                  # Deterministic generator script (zero external npm dependencies)
│   └── validate_datasets.mjs                  # 15-check programmatic verification suite
├── business_scenarios/                        # VALID structured workspace bundles + entity CSVs
│   ├── profile_a_kaveri_packaging/            # Primary Demo Workspace: Healthy & Mixed Payment Behaviour
│   ├── profile_b_vindhya_electricals/         # Delayed Customer Payments & Severe Cash-Flow Pressure
│   ├── profile_c_sahyadri_fab_irregular/      # Irregular Milestone Income & Volatile Expenses
│   └── profile_d_narmada_sparse/              # Sparse History (<14 days), N<3 Customers & NULL Due Date
├── csv_import/                                # VALID user-facing CSV import files (Formats 1, 2, and 3)
│   ├── templates/                             # Downloadable blank CSV header templates
│   │   ├── flowtrust_transactions_template.csv
│   │   ├── bank_statement_export_template.csv
│   │   └── flowtrust_documents_template.csv
│   ├── profile_a_kaveri_packaging_transactions.csv
│   ├── profile_a_kaveri_packaging_bank_statement.csv
│   ├── profile_a_kaveri_packaging_documents.csv
│   ├── profile_b_vindhya_electricals_transactions.csv
│   ├── profile_b_vindhya_electricals_bank_statement.csv
│   ├── profile_b_vindhya_electricals_documents.csv
│   ├── profile_c_sahyadri_fab_transactions.csv
│   ├── profile_c_sahyadri_fab_documents.csv
│   ├── profile_d_narmada_sparse_transactions.csv
│   └── profile_d_narmada_sparse_documents.csv
└── edge_cases/                                # ISOLATED invalid & edge-case CSV validation test fixtures
    ├── expected_validation_outcomes.json      # Machine-verifiable expected error/warning assertions
    ├── fixture_01_empty_file.csv
    ├── fixture_02_headers_only.csv
    ├── fixture_03_missing_required_columns.csv
    ├── fixture_04_malformed_dates_and_amounts.csv
    ├── fixture_05_bank_debit_credit_conflict_and_markers.csv
    ├── fixture_06_mixed_date_formats.csv
    ├── fixture_07_duplicates_and_reimport.csv
    └── fixture_08_inconsistent_documents.csv
```

> **Strict Separation Rule:** Valid demonstration datasets (`business_scenarios/` and `csv_import/`) are completely isolated from deliberately malformed/edge-case test fixtures (`edge_cases/`). Invalid fixtures are never loaded into demonstration workspaces.

---

## 3. Business Scenarios & Ground-Truth Financial Figures (as of `2026-10-22`)

Each folder under `datasets/synthetic/business_scenarios/<slug>/` contains:
* `workspace_bundle.json`: Complete canonical workspace bundle (`business`, `categories`, `customers`, `suppliers`, `invoices`, `bills`, `transactions`, `payments`, and `expected_ground_truth`).
* `customers.csv`, `suppliers.csv`, `invoices.csv`, `bills.csv`, `transactions.csv`, `payments.csv`: Relational entity tables with matching UUID foreign keys.

| Scenario Slug | Business Name | Opening Cash (`opening_balance_date`) | Post-Cutoff Inflows | Post-Cutoff Outflows | Available Cash | Outstanding Receivables (Overdue) | Outstanding Payables (Due $\le 7\text{d}$ / Overdue) | Cash Coverage Warning |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `profile_a_kaveri_packaging` | **Kaveri Packaging Solutions Pvt Ltd** | `₹3,40,000.00` (`2026-04-30`) | `₹12,85,000.00` | `₹11,45,000.00` | **`₹4,80,000.00`** (`₹4,45,000` Bank + `₹35,000` Cash) | **`₹3,15,000.00`** (`₹75,000.00` overdue) | **`₹1,95,000.00`** (`₹85,000.00` due $\le 7\text{d}$; `₹0` overdue) | `false` |
| `profile_b_vindhya_electricals` | **Vindhya Electricals & Switchgear Co** | `₹1,80,000.00` (`2026-06-30`) | `₹6,23,450.00` | `₹6,91,000.00` | **`₹1,12,450.00`** | **`₹4,85,000.00`** (`₹3,70,000.00` overdue) | **`₹2,67,000.00`** (`₹1,30,000.00` due $\le 7\text{d}$; `₹95,000.00` overdue) | **`true`** (`₹2,25,000 > ₹1,12,450`) |
| `profile_c_sahyadri_fab_irregular` | **Sahyadri Fab & Engineering Works** | `₹1,35,000.00` (`2026-07-15`) | `₹3,84,120.00` | `₹4,40,500.00` | **`₹78,620.00`** | **`₹2,65,000.00`** (`₹1,25,000.00` overdue) | **`₹94,000.00`** (`₹68,000.00` due $\le 7\text{d}$; `₹0` overdue) | `false` |
| `profile_d_narmada_sparse` | **Narmada General Traders** | `₹50,000.00` (`null`) | `₹22,200.00` | `₹6,500.00` | **`₹65,700.00`** | **`₹24,000.00`** (`₹0.00` overdue; `₹24,000` missing `due_date`) | **`₹15,000.00`** (`₹15,000.00` due $\le 7\text{d}$; `₹0` overdue) | `false` |

---

## 4. Feature Coverage Matrix Across Profiles

### 4.1 Customer Intelligence (`profile_a_kaveri_packaging`)
| Customer Code | Customer Name | Completed Eligible Invoices ($N_{\text{eligible}}$) | On-Time Rate | Avg / Median Delay (Days) | Recent Delay Trend ($N \ge 6$) | Current Overdue Exposure | Collection Risk Indicator |
|---|---|---:|---:|---:|---|---:|---|
| `CUST-001` | Sahyadri Foods Pvt Ltd | `6` | `100.0%` | `-1.5` / `-1.5` | `STABLE` | `₹0.00` | **`Regular Payer`** |
| `CUST-002` | Deccan Beverages LLP | `6` | `50.0%` | `+5.7` / `+4.5` | `DELAYS_INCREASING` | `₹25,000.00` (`12d` overdue) | **`Watch — Payment Delays`** |
| `CUST-003` | Malwa Agro Exports Pvt Ltd | `4` | `25.0%` | `+18.3` / `+22.5` | `INSUFFICIENT_HISTORY` | `₹50,000.00` (`38d` overdue; partial on `₹80,000`) | **`Elevated Overdue Exposure`** |
| `CUST-004` | Konkan Spices Co | `1` | `null` | `null` / `null` | `INSUFFICIENT_HISTORY` | `₹0.00` | **`Insufficient Data`** |
| `CUST-005` | Vidarbha Textile Mills Ltd | `6` | `83.3%` | `-2.0` / `-2.5` | `TIMING_IMPROVING` | `₹0.00` | **`Regular Payer`** |
| `CUST-006` | Narmada Organic Retail Hub | `2` | `null` | `null` / `null` | `INSUFFICIENT_HISTORY` | `₹0.00` (plus 1 `CANCELLED` invoice) | **`Insufficient Data`** |
| `CUST-007` | Aravalli Home Care Boutique | `0` | `null` | `null` / `null` | `INSUFFICIENT_HISTORY` | `₹0.00` (`₹45,000` current open) | **`Insufficient Data`** |
| `CUST-008` | Satpura Legacy Traders (Archived) | `1` | `null` | `null` / `null` | `INSUFFICIENT_HISTORY` | `₹0.00` (`status = ARCHIVED`) | **`Insufficient Data`** |

### 4.2 Risk Simulator Verification (30-Day Horizon from `2026-10-22`)
* **Profile A (`Kaveri Packaging Solutions`):**
  * **Baseline Projection:** Starting Cash `₹4,80,000.00` $\rightarrow$ Ending Cash **`₹5,00,666.40`**, Minimum Projected Cash **`₹4,16,755.52`** on Day 4 (`₹0.00` shortfall).
  * **Combined Stress Scenario (`25%` Revenue Decline + `30d` Customer Delay + `₹75,000` Unexpected Expense + `₹1,50,000` Proposed Investment):** Shifts all `6` open invoices (`₹3,15,000.00`) beyond the 30-day horizon and drives Minimum Projected Cash to **`-₹48,666.90`** (`Projected Shortfall = ₹48,666.90`, first shortfall on Day `23`).
* **Profile B (`Vindhya Electricals & Switchgear`):**
  * Exercises `> 90 days` aged receivable exclusion (`INV-B26-004`, `₹1,40,000.00`, `102 days` overdue is excluded from baseline 30-day recovery) and immediate cash shortfall under heavy near-term supplier obligations.
* **Profile D (`Narmada General Traders`):**
  * Exercises `< 14 days` transaction history (`history_span_days = 11`, `has_sufficient_history_for_run_rate = false`) and `excluded_missing_due_date_receivables = ₹24,000.00` (`INV-D26-002` has `due_date = null`).

---

## 5. Regenerating and Validating the Datasets

Both scripts use standard Node.js built-in modules (`node:fs`, `node:path`, `node:crypto`) and require zero external packages.

```bash
# 1. Deterministically regenerate all 50 dataset files and manifest.json
node datasets/synthetic/scripts/generate_datasets.mjs

# 2. Run the 15-check programmatic verification suite
node datasets/synthetic/scripts/validate_datasets.mjs
```

