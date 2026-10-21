# FlowTrust — Workspace, Membership, and Onboarding Specification

**Status:** Approved Product Specification (Area A — Preserved Authoritative Decisions + MVP Implementation Clarifications)  
**Project:** FlowTrust — *Beyond Balance. Into Resilience.*  
**Related Specifications:** [PRODUCT_SCOPE.md](./PRODUCT_SCOPE.md) · [SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md](../architecture/SECURITY_AND_DATA_INTEGRITY_SPECIFICATION.md) · [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md)

---

## 1. Business Management and Membership

### 1.1 Overview

FlowTrust must support users who want to create new businesses or join
existing businesses.

A user may belong to multiple businesses. Each business must maintain
independent financial data and a separate workspace.

The initial implementation will prioritize simple onboarding, shared
member access, and strict business-level data isolation.

### 1.2 User and Business Relationship

- A user may create multiple businesses.
- A user may join multiple existing businesses.
- A business may have multiple authorized members.
- A user must be authenticated before accessing protected business data.
- Business membership must be verified before granting access.
- Users must not access business data merely by knowing a business ID
  or name.

The database must support a many-to-many relationship between users
and businesses through a business membership model.

### 1.3 Business Creation

Users must be able to create a new business after signing up or logging in.

The creation workflow will be:

1. The user selects "Create a Business".
2. The user enters the required business information.
3. FlowTrust creates the business workspace.
4. The user is associated with the newly created business.
5. The application opens the business dashboard.

The exact business information required during onboarding is specified in Section 3.1 below.

### 1.4 Joining an Existing Business

Users must be able to join an existing business using a join code.

The joining workflow will be:

1. The user signs up or logs in.
2. The user selects "Join an Existing Business".
3. The user enters a join code.
4. The server validates the code.
5. If the code is valid, the user is immediately added as a member
   of the corresponding business.
6. The application provides access to that business's workspace.

No separate membership approval step is required in the initial version.

Invalid codes must produce a clear error message without exposing
sensitive business information.

The system must prevent duplicate memberships for the same user
and business.

### 1.5 Join-Code Management

The initial version will use a business-specific join-code mechanism.

- An existing authorized business member can generate a join code.
- An authorized member can regenerate the code when required.
- Join codes do not expire automatically.
- Regenerating a code immediately invalidates the previous code.
- Only a valid join code can be used to join the corresponding business.
- Codes must be sufficiently unpredictable to reduce unauthorized joining.
- The server must validate join codes before creating memberships.

The exact code format, generation mechanism, and storage approach are specified in Section 3.2 below.

### 1.6 Shared Access Model

All authorized members of a business will initially have the same
application-level permissions.

The initial version will not implement separate roles such as:

- Owner
- Admin
- Accountant
- Viewer

All protected operations must still verify the user's business membership.

Shared access within one business must never imply access to other businesses.

### 1.7 Active Business Workspace

FlowTrust will use a single-active-business workspace model.

- A user may belong to multiple businesses.
- One business will be active at a time.
- The dashboard will display data for the active business only.
- Financial records, customers, suppliers, risk simulations, AI Copilot
  context, and reports must use the active business's data.
- Users must be able to switch between businesses using a workspace
  switcher.
- If a user has access to only one business, the application may open
  that workspace automatically.
- If a user has access to multiple businesses, the application must provide
  a way to select the desired workspace.

The initial version will not provide a combined financial dashboard
across multiple businesses.

Switching workspaces must not mix data or grant unauthorized access.

### 1.8 Business Data Isolation

Business-level data isolation is a fundamental security requirement.

- Every business-specific record must be associated with the correct business.
- The server must verify the user's membership before returning or
  modifying business data.
- The selected business in the frontend must not be treated as proof
  of authorization.
- Database policies and server-side authorization checks must enforce
  access restrictions.
- Import operations, simulations, reports, and AI Copilot requests
  must use data belonging to the authorized active business.
- A user must not be able to read or modify another business's records
  by manipulating request parameters or identifiers.

Automated tests must verify that users cannot access another business's
data without authorization.

### 1.9 Future Scope

The following capabilities are not part of the initial implementation:

- Email-based business invitations.
- Separate Owner, Admin, Accountant, and Viewer roles.
- Granular permissions for viewing, creating, editing, and deleting records.
- Advanced membership management.
- More sophisticated business access and approval workflows.

These capabilities may be evaluated in future versions.

The initial architecture should avoid unnecessarily preventing
these capabilities from being introduced later.

---

## 2. Business Data Initialization

### 2.1 Initial Setup Flow

When a user creates a new business, FlowTrust must offer an option to initialize the business's financial data.

The user can choose between:

1. Import financial data using a CSV file.
2. Skip the import and continue to the dashboard.

CSV import is optional. Users must be able to access FlowTrust without uploading any financial data.

### 2.2 Option A — Import Financial Data

Users can upload an existing CSV file containing their business's financial records.

The import workflow must include:

- CSV file upload.
- File format and data validation.
- Preview of the records before importing.
- Identification of invalid records.
- Detection of potential duplicate transactions.
- Clear reporting of import errors.
- Confirmation before final import.

#### Duplicate Transaction Handling

FlowTrust must attempt to identify potential duplicate transactions during CSV imports.

- Potential duplicates must be highlighted before the final import.
- Users must be informed about potential duplicates and allowed to review them.
- Duplicate detection must not rely exclusively on matching amounts and dates, because legitimate transactions may share the same amount and date.
- The import process must avoid silently creating duplicate records when they can be reliably identified.
- The user must receive a clear summary of successfully imported records and any records that could not be imported.

The complete duplicate-detection logic and CSV column mapping rules are finalized in [CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md](../data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md).

### 2.3 Option B — Skip for Now

Users may skip CSV import during initial business setup.

When the user selects this option:

- The business is created without imported financial records.
- The user is redirected to the dashboard.
- The dashboard displays an informative empty state.
- The empty state explains how the user can get started by adding financial records or importing a CSV file later.
- Skipping the import must not restrict access to the available application features.

FlowTrust must not generate fictional financial figures to populate an empty dashboard.

Financial calculations, insights, and reports must reflect the actual data available for the selected business.

### 2.4 Manual Financial Record Entry

Manual entry is a core feature of FlowTrust.

However, manual entry will not be included as a separate option in the initial business setup flow.

Instead:

- Users can manually add financial records after reaching the dashboard.
- Users can add income and expense records without importing a CSV file.
- Users can import additional financial records at any time.
- Manual entry and CSV import must work together without compromising data accuracy.

### 2.5 Synthetic Demo Dataset

FlowTrust will provide an optional synthetic demo dataset so users can explore the application's capabilities without uploading real financial information.

The demo dataset must:

- Contain clearly labelled synthetic financial records.
- Allow users to explore the dashboard, financial visualizations, and supported analytical features.
- Be distinguishable from real business financial records.
- Never be presented as actual financial activity belonging to the user's business.

### 2.6 Core Requirements

- CSV import is optional.
- Manual financial record entry is supported.
- Users can skip importing data during initial setup.
- CSV import remains available after initial setup.
- Imported data must be validated before being saved.
- Potential duplicate transactions must be handled carefully.
- Empty dashboards must display helpful guidance instead of fabricated figures.
- All financial calculations must use the actual records available to the application.
- Synthetic demo data must be clearly identified as sample data.

---

## 3. Implementation Clarifications (Finalized for MVP)

The following technical and UX defaults resolve implementation details noted in Sections 1 and 2 while preserving every established decision above:

### 3.1 Required Business Creation Information
* **Mandatory Field:** `Business Name` (trimmed non-empty string, 2–120 characters).
* **Default Workspace Configuration:**
  * `currency_code`: Defaults to `'INR'` (`₹`, formatted with `en-IN` digit grouping).
  * `timezone`: Defaults to `'Asia/Kolkata'`.
  * `opening_cash_balance`: Defaults to `0.00` (with `opening_balance_date = NULL` until established by the user in Settings or during opening-position setup).
* **Rationale:** Keeps initial business creation frictionless (`Business Name` only) while ensuring deterministic currency and date formatting from the first screen. Richer onboarding fields (GST/tax ID, business size, physical address, configurable FY start) remain deferred to future scope.

### 3.2 Join-Code Format, Generation, and Validation
* **Format:** 10-character uppercase alphanumeric string grouped as `XXXX-XXXXXX` in the UI (stored normalized without hyphens as a 10-character string) drawn from the unambiguous 32-character alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excluding `0`, `O`, `1`, `I` to prevent transcription errors).
* **Entropy & Unpredictability:** Generated server-side using a cryptographically secure pseudorandom number generator (`crypto.randomBytes`), providing $32^{10} = 2^{50}$ possible combinations.
* **Uniqueness & Regeneration:** Stored in `businesses.join_code` with a `UNIQUE` database constraint. When any authorized business member triggers **Regenerate Join Code**, the server atomically replaces `businesses.join_code` and updates `join_code_generated_at`, immediately invalidating the old code for future join attempts without revoking existing members.
* **Rate Limiting & Error Handling:** Join-code lookup runs exclusively on the server, normalizes case/hyphens, checks `UNIQUE (business_id, user_id)` in `business_memberships` (returning a friendly `"You are already a member of this business"` redirect if already joined), and returns a generic `"Invalid join code. Please check the code with a workspace member."` message on failure without leaking business names or IDs.

### 3.3 Synthetic Demo Dataset Activation Workflow
* **Isolation from Real Workspaces:** To ensure synthetic records are never mixed into a user's real business ledger, FlowTrust supports synthetic demonstration data via a dedicated **`is_demo = true` Demo Workspace** (accessible from the Workspace Switcher / Onboarding hub via **"Explore Synthetic Demo Workspace"**, or loaded into a newly created empty workspace only when the user explicitly confirms converting/seeding it as a demo workspace).
* **Visual Identification & Reset:** Any workspace with `is_demo = true` displays a persistent top banner (`"Synthetic Demo Workspace — Sample records for product exploration"`) and provides a one-click **"Reset / Delete Demo Workspace"** action in Settings.

