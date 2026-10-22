#!/usr/bin/env node
/**
 * FlowTrust — Deterministic Synthetic Dataset Generator
 *
 * Generates realistic, internally consistent synthetic demonstration datasets,
 * CSV import files (Formats 1, 2, and 3), structured JSON workspace bundles,
 * and isolated edge-case/invalid validation fixtures in strict accordance with:
 *   - docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md
 *   - docs/data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md
 *   - docs/financial/FINANCIAL_FOUNDATION_SPECIFICATION.md
 *   - docs/features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md
 *   - docs/features/RISK_SIMULATOR_SPECIFICATION.md
 *   - docs/features/REPORTS_SPECIFICATION.md
 *
 * Usage:
 *   node datasets/synthetic/scripts/generate_datasets.mjs
 *
 * All identifiers, dates, amounts, and SHA-256 checksums are 100% deterministic
 * across runs (anchored to evaluation date 2026-10-22).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SYNTHETIC_ROOT = path.resolve(__dirname, '..');

const ANCHOR_DATE = '2026-10-22';
const ANCHOR_TIMESTAMP = '2026-10-22T09:00:00.000Z';

// ============================================================================
// 1. DETERMINISTIC HELPERS (UUIDv5-like, Paise Arithmetic, Date Math, CSV)
// ============================================================================

function detUuid(namespace, key) {
  const hash = crypto.createHash('sha256').update(`flowtrust:${namespace}:${key}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

function fromPaise(paise) {
  return Number((paise / 100).toFixed(2));
}

function formatAmountStr(paise) {
  return (paise / 100).toFixed(2);
}

function normalizeDescription(desc) {
  return String(desc || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeDedupFingerprint(businessId, dateStr, direction, amountPaise, description) {
  const raw = `${businessId}|${dateStr}|${direction}|${amountPaise}|${normalizeDescription(description)}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function daysBetween(startDateStr, endDateStr) {
  const d1 = new Date(`${startDateStr}T00:00:00Z`);
  const d2 = new Date(`${endDateStr}T00:00:00Z`);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function toDdMmYyyy(isoDateStr) {
  const [y, m, d] = isoDateStr.split('-');
  return `${d}/${m}/${y}`;
}

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers, rows) {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(','));
  return [headerLine, ...dataLines].join('\n') + '\n';
}

function sha256Text(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// Standard Categories per docs/financial/FINANCIAL_FOUNDATION_SPECIFICATION.md §5
const STANDARD_CATEGORIES = [
  { name: 'Sales', direction: 'INFLOW', is_system_default: true },
  { name: 'Service Revenue', direction: 'INFLOW', is_system_default: true },
  { name: 'Other Income', direction: 'INFLOW', is_system_default: true },
  { name: 'Rent', direction: 'OUTFLOW', is_system_default: true },
  { name: 'Salaries', direction: 'OUTFLOW', is_system_default: true },
  { name: 'Utilities', direction: 'OUTFLOW', is_system_default: true },
  { name: 'Inventory Purchases', direction: 'OUTFLOW', is_system_default: true },
  { name: 'Marketing', direction: 'OUTFLOW', is_system_default: true },
  { name: 'Transportation', direction: 'OUTFLOW', is_system_default: true },
  { name: 'Software & Subscriptions', direction: 'OUTFLOW', is_system_default: true },
  { name: 'Taxes', direction: 'OUTFLOW', is_system_default: true },
  { name: 'Other Expenses', direction: 'OUTFLOW', is_system_default: true },
];

// ============================================================================
// 2. CANONICAL WORKSPACE BUILDER & DETERMINISTIC FINANCE ENGINE
// ============================================================================

function buildWorkspaceBundle(config) {
  const bizId = detUuid('business', config.slug);
  const business = {
    id: bizId,
    slug: config.slug,
    scenario_title: config.scenario_title,
    scenario_summary: config.scenario_summary,
    demonstrated_capabilities: config.demonstrated_capabilities,
    name: config.name,
    currency_code: 'INR',
    timezone: 'Asia/Kolkata',
    join_code: config.join_code,
    join_code_generated_at: ANCHOR_TIMESTAMP,
    opening_cash_balance: fromPaise(toPaise(config.opening_cash_balance)),
    opening_balance_date: config.opening_balance_date,
    opening_receivables_balance: fromPaise(toPaise(config.opening_receivables_balance || 0)),
    opening_payables_balance: fromPaise(toPaise(config.opening_payables_balance || 0)),
    target_cash_buffer:
      config.target_cash_buffer !== null && config.target_cash_buffer !== undefined
        ? fromPaise(toPaise(config.target_cash_buffer))
        : null,
    is_demo: true,
    as_of_date: ANCHOR_DATE,
    created_at: ANCHOR_TIMESTAMP,
    updated_at: ANCHOR_TIMESTAMP,
  };

  // Categories
  const categoryDefs = [...STANDARD_CATEGORIES, ...(config.custom_categories || [])];
  const categories = categoryDefs.map((c) => ({
    id: detUuid(`${config.slug}:category`, `${c.direction}:${c.name.toLowerCase()}`),
    business_id: bizId,
    name: c.name,
    direction: c.direction,
    is_system_default: Boolean(c.is_system_default),
    is_archived: false,
  }));
  const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

  // Customers
  const customers = config.customers.map((c) => ({
    id: detUuid(`${config.slug}:customer`, c.external_code),
    business_id: bizId,
    external_code: c.external_code,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    notes: c.notes || null,
    status: c.status || 'ACTIVE',
    created_at: ANCHOR_TIMESTAMP,
    updated_at: ANCHOR_TIMESTAMP,
  }));
  const custByCode = new Map(customers.map((c) => [c.external_code, c]));

  // Suppliers
  const suppliers = config.suppliers.map((s) => ({
    id: detUuid(`${config.slug}:supplier`, s.external_code),
    business_id: bizId,
    external_code: s.external_code,
    name: s.name,
    email: s.email,
    phone: s.phone,
    address: s.address,
    notes: s.notes || null,
    status: s.status || 'ACTIVE',
    created_at: ANCHOR_TIMESTAMP,
    updated_at: ANCHOR_TIMESTAMP,
  }));
  const supByCode = new Map(suppliers.map((s) => [s.external_code, s]));

  const invoices = [];
  const bills = [];
  const transactions = [];
  const payments = [];

  // Process Invoices & linked payments
  for (const invSpec of config.invoices) {
    const cust = custByCode.get(invSpec.customer_code);
    if (!cust) throw new Error(`Unknown customer_code ${invSpec.customer_code} in ${config.slug}`);
    const cat = catByName.get((invSpec.category || 'Sales').toLowerCase());
    const invId = detUuid(`${config.slug}:invoice`, invSpec.document_number);
    const totalPaise = toPaise(invSpec.total_amount);

    const paymentSpecs = invSpec.payments || [];
    let paidPaise = 0;
    for (let idx = 0; idx < paymentSpecs.length; idx++) {
      const pSpec = paymentSpecs[idx];
      const pPaise = toPaise(pSpec.amount);
      paidPaise += pPaise;

      const txnId = detUuid(`${config.slug}:txn`, pSpec.reference_id);
      const payId = detUuid(`${config.slug}:payment`, `${invSpec.document_number}:${idx + 1}:${pSpec.reference_id}`);
      const isPreCutoff =
        business.opening_balance_date !== null && pSpec.payment_date <= business.opening_balance_date;
      const desc =
        pSpec.description || `Payment received against ${invSpec.document_number} - ${cust.name}`;

      transactions.push({
        id: txnId,
        business_id: bizId,
        transaction_date: pSpec.payment_date,
        direction: 'INFLOW',
        transaction_kind: 'INVOICE_PAYMENT',
        amount: fromPaise(pPaise),
        payment_account: pSpec.account || 'BANK',
        category_id: cat ? cat.id : null,
        category_name: cat ? cat.name : 'Sales',
        description: desc,
        counterparty_type: 'CUSTOMER',
        customer_id: cust.id,
        supplier_id: null,
        counterparty_name: cust.name,
        counterparty_code: cust.external_code,
        document_number: invSpec.document_number,
        external_reference: pSpec.reference_id,
        is_pre_opening_cutoff: isPreCutoff,
        dedup_fingerprint: computeDedupFingerprint(bizId, pSpec.payment_date, 'INFLOW', pPaise, desc),
        status: 'ACTIVE',
        created_at: ANCHOR_TIMESTAMP,
      });

      payments.push({
        id: payId,
        business_id: bizId,
        transaction_id: txnId,
        target_type: 'INVOICE',
        invoice_id: invId,
        bill_id: null,
        document_number: invSpec.document_number,
        payment_date: pSpec.payment_date,
        allocated_amount: fromPaise(pPaise),
        payment_reference: pSpec.reference_id,
        status: 'ACTIVE',
        created_at: ANCHOR_TIMESTAMP,
      });
    }

    let status = 'UNPAID';
    if (invSpec.is_cancelled) {
      status = 'CANCELLED';
    } else if (paidPaise === 0) {
      status = 'UNPAID';
    } else if (paidPaise < totalPaise) {
      status = 'PARTIALLY_PAID';
    } else if (paidPaise === totalPaise) {
      status = 'PAID';
    } else {
      throw new Error(`Overpayment on invoice ${invSpec.document_number}`);
    }

    const outstandingPaise = status === 'CANCELLED' ? 0 : totalPaise - paidPaise;
    const isOverdue =
      (status === 'UNPAID' || status === 'PARTIALLY_PAID') &&
      invSpec.due_date !== null &&
      invSpec.due_date < ANCHOR_DATE;
    const daysOverdue = isOverdue ? daysBetween(invSpec.due_date, ANCHOR_DATE) : 0;

    invoices.push({
      id: invId,
      business_id: bizId,
      customer_id: cust.id,
      customer_code: cust.external_code,
      customer_name: cust.name,
      document_number: invSpec.document_number,
      issue_date: invSpec.issue_date,
      due_date: invSpec.due_date,
      category_id: cat ? cat.id : null,
      category_name: cat ? cat.name : 'Sales',
      total_amount: fromPaise(totalPaise),
      amount_paid: fromPaise(paidPaise),
      outstanding_amount: fromPaise(outstandingPaise),
      status,
      is_overdue: isOverdue,
      days_overdue: daysOverdue,
      cancelled_at: invSpec.is_cancelled ? `${invSpec.issue_date}T12:00:00.000Z` : null,
      cancellation_reason: invSpec.cancellation_reason || null,
      description: invSpec.description,
      created_at: ANCHOR_TIMESTAMP,
      updated_at: ANCHOR_TIMESTAMP,
    });
  }

  // Process Bills & linked payments
  for (const billSpec of config.bills) {
    const sup = supByCode.get(billSpec.supplier_code);
    if (!sup) throw new Error(`Unknown supplier_code ${billSpec.supplier_code} in ${config.slug}`);
    const cat = catByName.get((billSpec.category || 'Inventory Purchases').toLowerCase());
    const billId = detUuid(`${config.slug}:bill`, billSpec.document_number);
    const totalPaise = toPaise(billSpec.total_amount);

    const paymentSpecs = billSpec.payments || [];
    let paidPaise = 0;
    for (let idx = 0; idx < paymentSpecs.length; idx++) {
      const pSpec = paymentSpecs[idx];
      const pPaise = toPaise(pSpec.amount);
      paidPaise += pPaise;

      const txnId = detUuid(`${config.slug}:txn`, pSpec.reference_id);
      const payId = detUuid(`${config.slug}:payment`, `${billSpec.document_number}:${idx + 1}:${pSpec.reference_id}`);
      const isPreCutoff =
        business.opening_balance_date !== null && pSpec.payment_date <= business.opening_balance_date;
      const desc =
        pSpec.description || `Supplier payment against ${billSpec.document_number} - ${sup.name}`;

      transactions.push({
        id: txnId,
        business_id: bizId,
        transaction_date: pSpec.payment_date,
        direction: 'OUTFLOW',
        transaction_kind: 'BILL_PAYMENT',
        amount: fromPaise(pPaise),
        payment_account: pSpec.account || 'BANK',
        category_id: cat ? cat.id : null,
        category_name: cat ? cat.name : 'Inventory Purchases',
        description: desc,
        counterparty_type: 'SUPPLIER',
        customer_id: null,
        supplier_id: sup.id,
        counterparty_name: sup.name,
        counterparty_code: sup.external_code,
        document_number: billSpec.document_number,
        external_reference: pSpec.reference_id,
        is_pre_opening_cutoff: isPreCutoff,
        dedup_fingerprint: computeDedupFingerprint(bizId, pSpec.payment_date, 'OUTFLOW', pPaise, desc),
        status: 'ACTIVE',
        created_at: ANCHOR_TIMESTAMP,
      });

      payments.push({
        id: payId,
        business_id: bizId,
        transaction_id: txnId,
        target_type: 'BILL',
        invoice_id: null,
        bill_id: billId,
        document_number: billSpec.document_number,
        payment_date: pSpec.payment_date,
        allocated_amount: fromPaise(pPaise),
        payment_reference: pSpec.reference_id,
        status: 'ACTIVE',
        created_at: ANCHOR_TIMESTAMP,
      });
    }

    let status = 'UNPAID';
    if (billSpec.is_cancelled) {
      status = 'CANCELLED';
    } else if (paidPaise === 0) {
      status = 'UNPAID';
    } else if (paidPaise < totalPaise) {
      status = 'PARTIALLY_PAID';
    } else if (paidPaise === totalPaise) {
      status = 'PAID';
    } else {
      throw new Error(`Overpayment on bill ${billSpec.document_number}`);
    }

    const outstandingPaise = status === 'CANCELLED' ? 0 : totalPaise - paidPaise;
    const isOverdue =
      (status === 'UNPAID' || status === 'PARTIALLY_PAID') &&
      billSpec.due_date !== null &&
      billSpec.due_date < ANCHOR_DATE;
    const daysOverdue = isOverdue ? daysBetween(billSpec.due_date, ANCHOR_DATE) : 0;
    const isDueWithin7Days =
      (status === 'UNPAID' || status === 'PARTIALLY_PAID') &&
      billSpec.due_date !== null &&
      billSpec.due_date >= ANCHOR_DATE &&
      daysBetween(ANCHOR_DATE, billSpec.due_date) <= 7;

    bills.push({
      id: billId,
      business_id: bizId,
      supplier_id: sup.id,
      supplier_code: sup.external_code,
      supplier_name: sup.name,
      document_number: billSpec.document_number,
      issue_date: billSpec.issue_date,
      due_date: billSpec.due_date,
      category_id: cat ? cat.id : null,
      category_name: cat ? cat.name : 'Inventory Purchases',
      total_amount: fromPaise(totalPaise),
      amount_paid: fromPaise(paidPaise),
      outstanding_amount: fromPaise(outstandingPaise),
      status,
      is_overdue: isOverdue,
      days_overdue: daysOverdue,
      is_due_soon_7d: isDueWithin7Days,
      cancelled_at: billSpec.is_cancelled ? `${billSpec.issue_date}T12:00:00.000Z` : null,
      cancellation_reason: billSpec.cancellation_reason || null,
      description: billSpec.description,
      created_at: ANCHOR_TIMESTAMP,
      updated_at: ANCHOR_TIMESTAMP,
    });
  }

  // Process Direct Transactions (DIRECT_INCOME, DIRECT_EXPENSE)
  for (const dSpec of config.direct_transactions) {
    const tPaise = toPaise(dSpec.amount);
    const cat = catByName.get(dSpec.category.toLowerCase());
    if (!cat) throw new Error(`Unknown category ${dSpec.category} in ${config.slug}`);
    const txnId = detUuid(`${config.slug}:txn`, dSpec.reference_id);
    const isPreCutoff =
      business.opening_balance_date !== null && dSpec.transaction_date <= business.opening_balance_date;
    let cust = null;
    let sup = null;
    if (dSpec.customer_code) cust = custByCode.get(dSpec.customer_code);
    if (dSpec.supplier_code) sup = supByCode.get(dSpec.supplier_code);

    transactions.push({
      id: txnId,
      business_id: bizId,
      transaction_date: dSpec.transaction_date,
      direction: dSpec.direction,
      transaction_kind: dSpec.direction === 'INFLOW' ? 'DIRECT_INCOME' : 'DIRECT_EXPENSE',
      amount: fromPaise(tPaise),
      payment_account: dSpec.account || 'BANK',
      category_id: cat.id,
      category_name: cat.name,
      description: dSpec.description,
      counterparty_type: cust ? 'CUSTOMER' : sup ? 'SUPPLIER' : null,
      customer_id: cust ? cust.id : null,
      supplier_id: sup ? sup.id : null,
      counterparty_name: cust ? cust.name : sup ? sup.name : null,
      counterparty_code: cust ? cust.external_code : sup ? sup.external_code : null,
      document_number: null,
      external_reference: dSpec.reference_id,
      is_pre_opening_cutoff: isPreCutoff,
      dedup_fingerprint: computeDedupFingerprint(
        bizId,
        dSpec.transaction_date,
        dSpec.direction,
        tPaise,
        dSpec.description
      ),
      status: 'ACTIVE',
      created_at: ANCHOR_TIMESTAMP,
    });
  }

  // Sort transactions chronologically
  transactions.sort((a, b) =>
    a.transaction_date === b.transaction_date
      ? a.external_reference.localeCompare(b.external_reference)
      : a.transaction_date.localeCompare(b.transaction_date)
  );

  // Compute Ground-Truth Financial Summaries using authoritative formulas
  const groundTruth = computeGroundTruthAnalytics(
    business,
    customers,
    suppliers,
    invoices,
    bills,
    transactions,
    payments
  );

  return {
    metadata: {
      generator_version: '1.0.0',
      anchor_date: ANCHOR_DATE,
      synthetic_disclaimer:
        'SYNTHETIC DEMONSTRATION DATASET — Fictional business and financial records generated for FlowTrust demonstration and automated testing. Contains zero real personal or business data.',
    },
    business,
    categories,
    customers,
    suppliers,
    invoices,
    bills,
    transactions,
    payments,
    expected_ground_truth: groundTruth,
  };
}

function computeGroundTruthAnalytics(
  business,
  customers,
  suppliers,
  invoices,
  bills,
  transactions,
  payments
) {
  const openingPaise = toPaise(business.opening_cash_balance);
  let postOpeningInflowsPaise = 0;
  let postOpeningOutflowsPaise = 0;
  let preOpeningInflowsPaise = 0;
  let preOpeningOutflowsPaise = 0;
  let postOpeningBankDeltaPaise = 0;
  let postOpeningCashDeltaPaise = 0;

  for (const tx of transactions) {
    if (tx.status !== 'ACTIVE') continue;
    if (tx.transaction_kind === 'INTERNAL_TRANSFER' || tx.transaction_kind === 'OPENING_BALANCE_MARKER') {
      continue;
    }
    const amtPaise = toPaise(tx.amount);
    if (tx.is_pre_opening_cutoff) {
      if (tx.direction === 'INFLOW') preOpeningInflowsPaise += amtPaise;
      else preOpeningOutflowsPaise += amtPaise;
    } else {
      if (tx.direction === 'INFLOW') {
        postOpeningInflowsPaise += amtPaise;
        if (tx.payment_account === 'BANK') postOpeningBankDeltaPaise += amtPaise;
        else postOpeningCashDeltaPaise += amtPaise;
      } else {
        postOpeningOutflowsPaise += amtPaise;
        if (tx.payment_account === 'BANK') postOpeningBankDeltaPaise -= amtPaise;
        else postOpeningCashDeltaPaise -= amtPaise;
      }
    }
  }

  const availableCashPaise = openingPaise + postOpeningInflowsPaise - postOpeningOutflowsPaise;

  // Receivables & Payables
  let totalReceivablesPaise = toPaise(business.opening_receivables_balance);
  let overdueReceivablesPaise = 0;
  let missingDueDateReceivablesPaise = 0;
  let openInvoicesCount = 0;
  let overdueInvoicesCount = 0;

  for (const inv of invoices) {
    if (inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID') {
      const outPaise = toPaise(inv.outstanding_amount);
      totalReceivablesPaise += outPaise;
      openInvoicesCount++;
      if (inv.due_date === null) {
        missingDueDateReceivablesPaise += outPaise;
      } else if (inv.is_overdue) {
        overdueReceivablesPaise += outPaise;
        overdueInvoicesCount++;
      }
    }
  }

  let totalPayablesPaise = toPaise(business.opening_payables_balance);
  let overduePayablesPaise = 0;
  let billsDueSoon7dPaise = 0;
  let billsDue8To30dPaise = 0;
  let openBillsCount = 0;
  let overdueBillsCount = 0;
  let billsDueSoon7dCount = 0;

  for (const b of bills) {
    if (b.status === 'UNPAID' || b.status === 'PARTIALLY_PAID') {
      const outPaise = toPaise(b.outstanding_amount);
      totalPayablesPaise += outPaise;
      openBillsCount++;
      if (b.due_date !== null) {
        const diff = daysBetween(ANCHOR_DATE, b.due_date);
        if (diff < 0) {
          overduePayablesPaise += outPaise;
          overdueBillsCount++;
        } else if (diff <= 7) {
          billsDueSoon7dPaise += outPaise;
          billsDueSoon7dCount++;
        } else if (diff <= 30) {
          billsDue8To30dPaise += outPaise;
        }
      }
    }
  }

  // Customer Intelligence per Customer (docs/features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md)
  const customerIntelligence = customers.map((cust) => {
    const custInvoices = invoices.filter((i) => i.customer_id === cust.id && i.status !== 'CANCELLED');
    const totalInvoicedPaise = custInvoices.reduce((s, i) => s + toPaise(i.total_amount), 0);
    const totalReceivedPaise = custInvoices.reduce((s, i) => s + toPaise(i.amount_paid), 0);
    const outstandingPaise = custInvoices.reduce((s, i) => s + toPaise(i.outstanding_amount), 0);
    const overdueList = custInvoices.filter((i) => i.is_overdue);
    const overduePaise = overdueList.reduce((s, i) => s + toPaise(i.outstanding_amount), 0);
    const maxDaysOverdue = overdueList.reduce((m, i) => Math.max(m, i.days_overdue), 0);

    // Completed eligible invoices: PAID + non-null due_date
    const eligiblePaid = custInvoices
      .filter((i) => i.status === 'PAID' && i.due_date !== null)
      .sort((a, b) => a.issue_date.localeCompare(b.issue_date));

    const invoiceDelays = eligiblePaid.map((inv) => {
      const linkedPays = payments.filter((p) => p.invoice_id === inv.id && p.status === 'ACTIVE');
      const invTotalPaise = toPaise(inv.total_amount);
      let weightedSum = 0;
      let finalSettlementDate = inv.issue_date;
      for (const p of linkedPays) {
        const pPaise = toPaise(p.allocated_amount);
        const delayDays = daysBetween(inv.due_date, p.payment_date);
        weightedSum += pPaise * delayDays;
        if (p.payment_date > finalSettlementDate) finalSettlementDate = p.payment_date;
      }
      const weightedDelay = weightedSum / invTotalPaise;
      const finalDelay = daysBetween(inv.due_date, finalSettlementDate);
      const isOnTime = finalDelay <= 0;
      return {
        document_number: inv.document_number,
        weighted_delay_days: Number(weightedDelay.toFixed(2)),
        final_settlement_date: finalSettlementDate,
        final_delay_days: finalDelay,
        is_on_time: isOnTime,
      };
    });

    const nEligible = invoiceDelays.length;
    let avgDelayDays = null;
    let medianDelayDays = null;
    let onTimeRatePct = null;
    let recentTrend = 'INSUFFICIENT_HISTORY';

    if (nEligible >= 3) {
      const rawDelays = invoiceDelays.map((d) => d.weighted_delay_days);
      const sumD = rawDelays.reduce((a, b) => a + b, 0);
      avgDelayDays = Number((sumD / nEligible).toFixed(1));
      const sortedD = [...rawDelays].sort((a, b) => a - b);
      medianDelayDays =
        nEligible % 2 === 1
          ? Number(sortedD[(nEligible - 1) / 2].toFixed(1))
          : Number(((sortedD[nEligible / 2 - 1] + sortedD[nEligible / 2]) / 2).toFixed(1));
      const onTimeCount = invoiceDelays.filter((d) => d.is_on_time).length;
      onTimeRatePct = Number(((onTimeCount / nEligible) * 100).toFixed(1));
    }

    if (nEligible >= 6) {
      const recent3 = invoiceDelays.slice(-3).map((d) => d.weighted_delay_days).sort((a, b) => a - b);
      const prior = invoiceDelays.slice(0, -3).map((d) => d.weighted_delay_days).sort((a, b) => a - b);
      const medRecent3 = recent3[1];
      const medPrior =
        prior.length % 2 === 1
          ? prior[(prior.length - 1) / 2]
          : (prior[prior.length / 2 - 1] + prior[prior.length / 2]) / 2;
      const delta = medRecent3 - medPrior;
      if (delta >= 5.0) recentTrend = 'DELAYS_INCREASING';
      else if (delta <= -5.0) recentTrend = 'TIMING_IMPROVING';
      else recentTrend = 'STABLE';
    }

    // 4-Tier Risk Indicator Matrix
    let riskIndicator = 'Insufficient Data';
    if (
      (overduePaise > 0 && maxDaysOverdue > 30) ||
      (overduePaise > 0 && nEligible >= 3 && (medianDelayDays > 15 || onTimeRatePct < 50))
    ) {
      riskIndicator = 'Elevated Overdue Exposure';
    } else if (
      (overduePaise > 0 && maxDaysOverdue <= 30) ||
      (overduePaise === 0 && nEligible >= 3 && (medianDelayDays > 7 || onTimeRatePct < 75))
    ) {
      riskIndicator = 'Watch — Payment Delays';
    } else if (overduePaise === 0 && nEligible >= 3 && onTimeRatePct >= 75 && medianDelayDays <= 7) {
      riskIndicator = 'Regular Payer';
    }

    return {
      customer_code: cust.external_code,
      customer_name: cust.name,
      status: cust.status,
      total_invoiced: fromPaise(totalInvoicedPaise),
      total_received: fromPaise(totalReceivedPaise),
      outstanding_receivable: fromPaise(outstandingPaise),
      overdue_receivable: fromPaise(overduePaise),
      max_days_overdue: maxDaysOverdue,
      completed_eligible_invoices_count: nEligible,
      average_delay_days: avgDelayDays,
      median_delay_days: medianDelayDays,
      on_time_payment_rate_pct: onTimeRatePct,
      recent_delay_trend: recentTrend,
      collection_risk_indicator: riskIndicator,
    };
  });

  // Supplier Intelligence per Supplier
  const supplierIntelligence = suppliers.map((sup) => {
    const supBills = bills.filter((b) => b.supplier_id === sup.id && b.status !== 'CANCELLED');
    const totalBilledPaise = supBills.reduce((s, b) => s + toPaise(b.total_amount), 0);
    const totalPaidPaise = supBills.reduce((s, b) => s + toPaise(b.amount_paid), 0);
    const outstandingPaise = supBills.reduce((s, b) => s + toPaise(b.outstanding_amount), 0);
    const overduePaise = supBills
      .filter((b) => b.is_overdue)
      .reduce((s, b) => s + toPaise(b.outstanding_amount), 0);
    const dueSoon7dPaise = supBills
      .filter((b) => b.is_due_soon_7d)
      .reduce((s, b) => s + toPaise(b.outstanding_amount), 0);

    return {
      supplier_code: sup.external_code,
      supplier_name: sup.name,
      total_billed: fromPaise(totalBilledPaise),
      total_paid: fromPaise(totalPaidPaise),
      outstanding_payable: fromPaise(outstandingPaise),
      overdue_payable: fromPaise(overduePaise),
      bills_due_soon_7d: fromPaise(dueSoon7dPaise),
    };
  });

  // Period Summaries for Reports (October 2026, September 2026, Week 12-18 Oct 2026, FY 2026-27)
  function summarizePeriod(startDate, endDate) {
    let inPaise = 0;
    let outPaise = 0;
    let txCount = 0;
    for (const tx of transactions) {
      if (tx.status !== 'ACTIVE') continue;
      if (tx.transaction_kind === 'INTERNAL_TRANSFER' || tx.transaction_kind === 'OPENING_BALANCE_MARKER') {
        continue;
      }
      if (tx.transaction_date >= startDate && tx.transaction_date <= endDate) {
        const p = toPaise(tx.amount);
        if (tx.direction === 'INFLOW') inPaise += p;
        else outPaise += p;
        txCount++;
      }
    }
    return {
      start_date: startDate,
      end_date: endDate,
      transaction_count: txCount,
      cash_inflows: fromPaise(inPaise),
      cash_outflows: fromPaise(outPaise),
      net_cash_flow: fromPaise(inPaise - outPaise),
    };
  }

  // Risk Simulator Baseline & Stress Verification (30-day horizon from 2026-10-22)
  const simulator30d = computeSimulatorVerification(
    business,
    availableCashPaise,
    invoices,
    bills,
    transactions,
    customerIntelligence,
    30
  );

  return {
    as_of_date: ANCHOR_DATE,
    opening_cash_balance: fromPaise(openingPaise),
    opening_balance_date: business.opening_balance_date,
    post_opening_inflows: fromPaise(postOpeningInflowsPaise),
    post_opening_outflows: fromPaise(postOpeningOutflowsPaise),
    pre_opening_historical_inflows: fromPaise(preOpeningInflowsPaise),
    pre_opening_historical_outflows: fromPaise(preOpeningOutflowsPaise),
    available_cash: fromPaise(availableCashPaise),
    total_outstanding_receivables: fromPaise(totalReceivablesPaise),
    overdue_receivables: fromPaise(overdueReceivablesPaise),
    missing_due_date_receivables: fromPaise(missingDueDateReceivablesPaise),
    open_invoices_count: openInvoicesCount,
    overdue_invoices_count: overdueInvoicesCount,
    total_outstanding_payables: fromPaise(totalPayablesPaise),
    overdue_payables: fromPaise(overduePayablesPaise),
    bills_due_soon_7d: fromPaise(billsDueSoon7dPaise),
    bills_due_8_to_30d: fromPaise(billsDue8To30dPaise),
    open_bills_count: openBillsCount,
    overdue_bills_count: overdueBillsCount,
    bills_due_soon_7d_count: billsDueSoon7dCount,
    cash_coverage_warning_active:
      overduePayablesPaise + billsDueSoon7dPaise > availableCashPaise &&
      overduePayablesPaise + billsDueSoon7dPaise > 0,
    reporting_periods: {
      weekly_oct_12_to_18_2026: summarizePeriod('2026-10-12', '2026-10-18'),
      weekly_oct_05_to_11_2026: summarizePeriod('2026-10-05', '2026-10-11'),
      monthly_october_2026: summarizePeriod('2026-10-01', '2026-10-31'),
      monthly_september_2026: summarizePeriod('2026-09-01', '2026-09-30'),
      fy_2026_27_ytd: summarizePeriod('2026-04-01', '2027-03-31'),
      fy_2025_26_full: summarizePeriod('2025-04-01', '2026-03-31'),
    },
    customer_intelligence: customerIntelligence,
    supplier_intelligence: supplierIntelligence,
    risk_simulator_30d: simulator30d,
  };
}

function computeSimulatorVerification(
  business,
  startingCashPaise,
  invoices,
  bills,
  transactions,
  customerIntelligence,
  horizonDays
) {
  // Determine historical lookback span up to ANCHOR_DATE
  const activeTx = transactions.filter(
    (t) =>
      t.status === 'ACTIVE' &&
      t.transaction_date <= ANCHOR_DATE &&
      t.transaction_kind !== 'INTERNAL_TRANSFER' &&
      t.transaction_kind !== 'OPENING_BALANCE_MARKER'
  );
  let historySpanDays = 0;
  if (activeTx.length > 0) {
    const earliest = activeTx[0].transaction_date;
    historySpanDays = daysBetween(earliest, ANCHOR_DATE) + 1;
  }
  const hasSufficientHistoryForRunRate = historySpanDays >= 14 && activeTx.length >= 3;
  const lookbackDays = Math.min(90, historySpanDays);
  const lookbackStart = addDays(ANCHOR_DATE, -(lookbackDays - 1));

  let directIncomeLookbackPaise = 0;
  let directExpenseLookbackPaise = 0;
  for (const tx of activeTx) {
    if (tx.transaction_date >= lookbackStart && tx.transaction_date <= ANCHOR_DATE) {
      if (tx.transaction_kind === 'DIRECT_INCOME') directIncomeLookbackPaise += toPaise(tx.amount);
      if (tx.transaction_kind === 'DIRECT_EXPENSE') directExpenseLookbackPaise += toPaise(tx.amount);
    }
  }

  const dailyRunInflowPaise = hasSufficientHistoryForRunRate
    ? Math.round(directIncomeLookbackPaise / lookbackDays)
    : 0;
  const dailyRunOutflowPaise = hasSufficientHistoryForRunRate
    ? Math.round(directExpenseLookbackPaise / lookbackDays)
    : 0;

  const custMedMap = new Map(
    customerIntelligence.map((c) => [c.customer_code, c.median_delay_days ?? 14])
  );

  // Build baseline scheduled items (day offset 1..horizonDays)
  const scheduledReceivables = [];
  let excludedOverdueOver90dPaise = 0;
  let excludedMissingDueDatePaise = 0;

  for (const inv of invoices) {
    if (inv.status !== 'UNPAID' && inv.status !== 'PARTIALLY_PAID') continue;
    const outPaise = toPaise(inv.outstanding_amount);
    if (inv.due_date === null) {
      excludedMissingDueDatePaise += outPaise;
      continue;
    }
    const diffFromAnchor = daysBetween(ANCHOR_DATE, inv.due_date);
    if (diffFromAnchor >= 0) {
      const dayOffset = Math.max(1, diffFromAnchor);
      if (dayOffset <= horizonDays) {
        scheduledReceivables.push({
          document_number: inv.document_number,
          amount_paise: outPaise,
          baseline_day: dayOffset,
        });
      }
    } else {
      const overdueDays = Math.abs(diffFromAnchor);
      if (overdueDays <= 90) {
        const med = custMedMap.get(inv.customer_code) || 14;
        const recoveryDay = Math.min(90, Math.max(14, Math.ceil(med)));
        if (recoveryDay <= horizonDays) {
          scheduledReceivables.push({
            document_number: inv.document_number,
            amount_paise: outPaise,
            baseline_day: recoveryDay,
          });
        }
      } else {
        excludedOverdueOver90dPaise += outPaise;
      }
    }
  }

  const scheduledPayables = [];
  for (const b of bills) {
    if (b.status !== 'UNPAID' && b.status !== 'PARTIALLY_PAID') continue;
    if (b.due_date === null) continue;
    const outPaise = toPaise(b.outstanding_amount);
    const diffFromAnchor = daysBetween(ANCHOR_DATE, b.due_date);
    const dayOffset = diffFromAnchor < 0 ? 1 : Math.max(1, diffFromAnchor);
    if (dayOffset <= horizonDays) {
      scheduledPayables.push({
        document_number: b.document_number,
        amount_paise: outPaise,
        baseline_day: dayOffset,
      });
    }
  }

  function simulate({
    revenueDeclinePct = 0,
    customerDelayDays = 0,
    unexpectedExpenseRupees = 0,
    unexpectedExpenseDay = 1,
    investmentRupees = 0,
    investmentDay = 1,
  }) {
    let bal = startingCashPaise;
    let minBal = startingCashPaise;
    let minDay = 0;
    let firstShortfallDay = null;
    let shiftedBeyondHorizonPaise = 0;
    let shiftedCount = 0;

    for (const r of scheduledReceivables) {
      if (r.baseline_day <= horizonDays && r.baseline_day + customerDelayDays > horizonDays) {
        shiftedBeyondHorizonPaise += r.amount_paise;
        shiftedCount++;
      }
    }

    for (let d = 1; d <= horizonDays; d++) {
      const runIn = Math.round(dailyRunInflowPaise * (1 - revenueDeclinePct / 100));
      const schedIn = scheduledReceivables
        .filter((r) => r.baseline_day + customerDelayDays === d)
        .reduce((s, r) => s + r.amount_paise, 0);
      const schedOut = scheduledPayables
        .filter((p) => p.baseline_day === d)
        .reduce((s, p) => s + p.amount_paise, 0);
      const unexpOut = d === unexpectedExpenseDay ? toPaise(unexpectedExpenseRupees) : 0;
      const invOut = d === investmentDay ? toPaise(investmentRupees) : 0;

      bal = bal + runIn + schedIn - schedOut - dailyRunOutflowPaise - unexpOut - invOut;
      if (bal < minBal) {
        minBal = bal;
        minDay = d;
      }
      if (bal < 0 && firstShortfallDay === null) {
        firstShortfallDay = d;
      }
    }

    return {
      ending_cash: fromPaise(bal),
      minimum_projected_cash: fromPaise(minBal),
      minimum_cash_day_offset: minDay,
      projected_shortfall_amount: minBal < 0 ? fromPaise(Math.abs(minBal)) : 0,
      first_shortfall_day_offset: firstShortfallDay,
      receivables_shifted_beyond_horizon: fromPaise(shiftedBeyondHorizonPaise),
      receivables_shifted_count: shiftedCount,
    };
  }

  return {
    horizon_days: horizonDays,
    history_span_days: historySpanDays,
    has_sufficient_history_for_run_rate: hasSufficientHistoryForRunRate,
    daily_operating_inflow_run_rate: fromPaise(dailyRunInflowPaise),
    daily_operating_outflow_run_rate: fromPaise(dailyRunOutflowPaise),
    excluded_overdue_over_90d_receivables: fromPaise(excludedOverdueOver90dPaise),
    excluded_missing_due_date_receivables: fromPaise(excludedMissingDueDatePaise),
    baseline_projection: simulate({}),
    combined_stress_scenario: simulate({
      revenueDeclinePct: 25,
      customerDelayDays: 30,
      unexpectedExpenseRupees: 75000,
      unexpectedExpenseDay: 1,
      investmentRupees: 150000,
      investmentDay: 1,
    }),
  };
}


// ============================================================================
// 3. SYNTHETIC BUSINESS SCENARIO DEFINITIONS (PROFILES A, B, C, D)
// ============================================================================

/**
 * PROFILE A: Kaveri Packaging Solutions (`profile_a_kaveri_packaging`)
 * Primary Demo Workspace & Comprehensive Baseline
 * - Opening Cash Balance: ₹3,40,000.00 as of 2026-04-30
 * - Post-Opening Inflows (May-Oct 2026): ₹12,85,000.00
 * - Post-Opening Outflows (May-Oct 2026): ₹11,45,000.00
 * - Available Cash (as of 2026-10-22): ₹4,80,000.00 (₹4,45,000.00 Bank + ₹35,000.00 Cash)
 * - Total Outstanding Receivables: ₹3,15,000.00 across 6 open invoices (₹75,000.00 overdue across 2 invoices)
 * - Total Outstanding Payables: ₹1,95,000.00 across 4 open bills (₹85,000.00 due within 7 days, ₹1,10,000.00 due in 8-30 days)
 * - Pre-opening historical records in FY 2025-26 and April 2026 to test `is_pre_opening_cutoff = true` non-double-counting and full-year reports.
 * - Covers all 4 Customer Risk Indicator states + all 3 delay trends (N >= 6) + archived customer + cancelled invoice.
 */
const PROFILE_A_CONFIG = {
  slug: 'profile_a_kaveri_packaging',
  scenario_title: 'Healthy & Stable Business with Mixed Customer Payment Behaviour (Primary Demo Workspace)',
  scenario_summary:
    'B2B corrugated packaging manufacturer in Pune with ₹4,80,000.00 available cash, ₹3,15,000.00 outstanding receivables (₹75,000.00 overdue), ₹1,95,000.00 outstanding payables (₹85,000.00 due within 7 days), full FY 2025-26 & FY 2026-27 YTD history, and all four Customer Collection Indicator tiers.',
  demonstrated_capabilities: [
    'Healthy baseline cash position (₹4,80,000.00 Available Cash = ₹3,40,000.00 Opening + ₹11,85,000.00 Post-Cutoff Inflows - ₹10,45,000.00 Post-Cutoff Outflows)',
    'Pre-opening historical transactions (FY 2025-26 and April 2026) preserved for Reports without double-counting Available Cash',
    'All 4 Customer Risk Indicator tiers: Regular Payer, Watch — Payment Delays, Elevated Overdue Exposure, and Insufficient Data',
    'All 3 recent payment delay trends (N >= 6): TIMING_IMPROVING, STABLE, and DELAYS_INCREASING',
    'Multi-instalment partial invoice settlement and amount-weighted invoice delay calculation',
    '30-day Risk Simulator: positive baseline ending cash (~₹5,13,000) turning negative under combined stress scenario',
    'Weekly, Monthly, Financial Year (FY 2025-26 full & FY 2026-27 YTD), and Custom Date Range reporting periods',
  ],
  name: 'Kaveri Packaging Solutions Pvt Ltd',
  join_code: 'KVR-2026-DEMO',
  opening_cash_balance: 340000.0,
  opening_balance_date: '2026-04-30',
  opening_receivables_balance: 0.0,
  opening_payables_balance: 0.0,
  target_cash_buffer: 150000.0,
  custom_categories: [
    { name: 'Packaging Design & Tooling', direction: 'INFLOW', is_system_default: false },
    { name: 'Machine Maintenance', direction: 'OUTFLOW', is_system_default: false },
  ],
  customers: [
    {
      external_code: 'CUST-001',
      name: 'Sahyadri Foods Pvt Ltd',
      email: 'accounts.sahyadri@example.com',
      phone: '+91-90000-00001',
      address: 'Plot 14, MIDC Bhosari, Pune, Maharashtra 411026',
      notes: 'Long-standing FMCG carton buyer; pays reliably on or before due date.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-002',
      name: 'Deccan Beverages LLP',
      email: 'finance.deccanbev@example.com',
      phone: '+91-90000-00002',
      address: 'Sector 7, Chakan Industrial Area, Pune, Maharashtra 410501',
      notes: 'Regular beverage shipper carton buyer; recent invoices experiencing 9-14 day delays.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-003',
      name: 'Malwa Agro Exports Pvt Ltd',
      email: 'payables.malwaagro@example.com',
      phone: '+91-90000-00003',
      address: '204 Trade Centre, Nashik Highway, Pune, Maharashtra 411039',
      notes: 'Export-grade fruit box buyer; chronic slow payer with partial settlements.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-004',
      name: 'Konkan Spices Co',
      email: 'billing.konkanspices@example.com',
      phone: '+91-90000-00004',
      address: '88 Market Yard, Gultekdi, Pune, Maharashtra 411037',
      notes: 'Recently onboarded retail spice brand (only 1 completed invoice).',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-005',
      name: 'Vidarbha Textile Mills Ltd',
      email: 'ap.vidarbhatextiles@example.com',
      phone: '+91-90000-00005',
      address: 'Phase II, Hinjewadi Industrial Park, Pune, Maharashtra 411057',
      notes: 'Consistent payer across 6 historical invoices with improving settlement speed.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-006',
      name: 'Narmada Organic Retail Hub',
      email: 'orders.narmadaorganic@example.com',
      phone: '+91-90000-00006',
      address: '19 Baner High Street, Pune, Maharashtra 411045',
      notes: 'Boutique organic distributor (2 completed invoices; below N=3 threshold).',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-007',
      name: 'Aravalli Home Care Boutique',
      email: 'procurement.aravallihome@example.com',
      phone: '+91-90000-00007',
      address: '42 Koregaon Park Annex, Pune, Maharashtra 411001',
      notes: 'New D2C customer with first open invoice due in November 2026.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-008',
      name: 'Satpura Legacy Traders (Archived)',
      email: 'archive.satpuratraders@example.com',
      phone: '+91-90000-00008',
      address: '11 Old Mumbai Road, Pimpri, Pune, Maharashtra 411018',
      notes: 'Inactive customer from FY 2025-26 retained for historical audit trail.',
      status: 'ARCHIVED',
    },
  ],
  suppliers: [
    {
      external_code: 'SUP-001',
      name: 'Shree Kraft Paper Mills Pvt Ltd',
      email: 'billing.shreekraft@example.com',
      phone: '+91-90000-00101',
      address: 'GIDC Vapi Industrial Estate, Valsad, Gujarat 396195',
      notes: 'Primary virgin and recycled kraft paper reel supplier.',
      status: 'ACTIVE',
    },
    {
      external_code: 'SUP-002',
      name: 'Bharat Adhesives & Inks LLP',
      email: 'ar.bharatadhesives@example.com',
      phone: '+91-90000-00102',
      address: 'Plot 55, Taloja MIDC, Navi Mumbai, Maharashtra 410208',
      notes: 'Starch gum, stitching wire, and flexographic printing ink supplier.',
      status: 'ACTIVE',
    },
    {
      external_code: 'SUP-003',
      name: 'Godavari Corrugation Machinery Services',
      email: 'service.godavarimachines@example.com',
      phone: '+91-90000-00103',
      address: 'Block C, Peenya Industrial Area, Bengaluru, Karnataka 560058',
      notes: 'Die-cutting consumables and annual corrugation roller maintenance.',
      status: 'ACTIVE',
    },
    {
      external_code: 'SUP-004',
      name: 'Pune Industrial Logistics Co',
      email: 'dispatch.punelogistics@example.com',
      phone: '+91-90000-00104',
      address: 'Transport Nagar, Nigdi, Pune, Maharashtra 411044',
      notes: 'Dedicated fleet transport for B2B pallet deliveries.',
      status: 'ACTIVE',
    },
    {
      external_code: 'SUP-005',
      name: 'MahaTech Cloud & ERP Solutions',
      email: 'billing.mahatech@example.com',
      phone: '+91-90000-00105',
      address: 'Cybercity Magarpatta, Hadapsar, Pune, Maharashtra 411028',
      notes: 'Accounting, barcode, and warehouse software vendor.',
      status: 'ACTIVE',
    },
  ],
  invoices: [
    // --- CUST-001: Sahyadri Foods Pvt Ltd (6 PAID invoices, 100% on-time, STABLE trend, Regular Payer + 1 OPEN current) ---
    // Pre-opening (<= 2026-04-30):
    {
      document_number: 'INV-2025-001',
      customer_code: 'CUST-001',
      issue_date: '2025-06-10',
      due_date: '2025-06-25',
      category: 'Sales',
      total_amount: 80000.0,
      description: '5-ply corrugated master cartons (Batch FY25-Q1)',
      payments: [{ payment_date: '2025-06-24', amount: 80000.0, reference_id: 'UTR-SYNTH-A2501', account: 'BANK' }],
    },
    {
      document_number: 'INV-2025-002',
      customer_code: 'CUST-001',
      issue_date: '2025-10-05',
      due_date: '2025-10-20',
      category: 'Sales',
      total_amount: 95000.0,
      description: 'Festive snack display boxes (Batch FY25-Q3)',
      payments: [{ payment_date: '2025-10-18', amount: 95000.0, reference_id: 'UTR-SYNTH-A2502', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-001',
      customer_code: 'CUST-001',
      issue_date: '2026-04-02',
      due_date: '2026-04-17',
      category: 'Sales',
      total_amount: 75000.0,
      description: 'Printed laminated food cartons (April lot)',
      payments: [{ payment_date: '2026-04-16', amount: 75000.0, reference_id: 'UTR-SYNTH-A2601', account: 'BANK' }],
    },
    // Post-opening (> 2026-04-30):
    {
      document_number: 'INV-2026-005',
      customer_code: 'CUST-001',
      issue_date: '2026-05-15',
      due_date: '2026-05-30',
      category: 'Sales',
      total_amount: 90000.0,
      description: 'Corrugated shipper boxes 12000 units',
      payments: [{ payment_date: '2026-05-28', amount: 90000.0, reference_id: 'UTR-SYNTH-A2605', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-010',
      customer_code: 'CUST-001',
      issue_date: '2026-07-18',
      due_date: '2026-08-02',
      category: 'Sales',
      total_amount: 110000.0,
      description: 'Moisture-resistant export cartons',
      payments: [{ payment_date: '2026-08-01', amount: 110000.0, reference_id: 'UTR-SYNTH-A2610', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-016',
      customer_code: 'CUST-001',
      issue_date: '2026-09-12',
      due_date: '2026-09-27',
      category: 'Sales',
      total_amount: 105000.0,
      description: 'Diwali gift pack outer cartons',
      payments: [{ payment_date: '2026-09-25', amount: 105000.0, reference_id: 'UTR-SYNTH-A2616', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-021',
      customer_code: 'CUST-001',
      issue_date: '2026-10-12',
      due_date: '2026-10-27',
      category: 'Sales',
      total_amount: 75000.0,
      description: 'Q3 replenishment corrugated trays (Open - Due in 5d)',
      payments: [],
    },

    // --- CUST-002: Deccan Beverages LLP (6 PAID invoices with DELAYS_INCREASING trend + 1 OVERDUE 12d ₹25,000 -> Watch — Payment Delays) ---
    {
      document_number: 'INV-2025-003',
      customer_code: 'CUST-002',
      issue_date: '2025-08-10',
      due_date: '2025-08-25',
      category: 'Sales',
      total_amount: 65000.0,
      description: '24-bottle partition cartons (FY25)',
      payments: [{ payment_date: '2025-08-25', amount: 65000.0, reference_id: 'UTR-SYNTH-A2503', account: 'BANK' }],
    },
    {
      document_number: 'INV-2025-004',
      customer_code: 'CUST-002',
      issue_date: '2025-12-05',
      due_date: '2025-12-20',
      category: 'Sales',
      total_amount: 70000.0,
      description: 'Beverage wrap-around trays (FY25)',
      payments: [{ payment_date: '2025-12-20', amount: 70000.0, reference_id: 'UTR-SYNTH-A2504', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-002',
      customer_code: 'CUST-002',
      issue_date: '2026-04-04',
      due_date: '2026-04-19',
      category: 'Sales',
      total_amount: 60000.0,
      description: 'Summer beverage bottle carriers',
      payments: [{ payment_date: '2026-04-19', amount: 60000.0, reference_id: 'UTR-SYNTH-A2602', account: 'BANK' }],
    },
    // Post-opening paid (delays +9d, +11d, +14d -> DELAYS_INCREASING):
    {
      document_number: 'INV-2026-006',
      customer_code: 'CUST-002',
      issue_date: '2026-05-20',
      due_date: '2026-06-04',
      category: 'Sales',
      total_amount: 85000.0,
      description: 'Heavy-duty bottle crate dividers',
      payments: [{ payment_date: '2026-06-13', amount: 85000.0, reference_id: 'UTR-SYNTH-A2606', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-011',
      customer_code: 'CUST-002',
      issue_date: '2026-07-22',
      due_date: '2026-08-06',
      category: 'Sales',
      total_amount: 95000.0,
      description: 'Monsoon batch corrugated cases (settled in 2 instalments)',
      payments: [
        { payment_date: '2026-08-14', amount: 47500.0, reference_id: 'UTR-SYNTH-A2611A', account: 'BANK' },
        { payment_date: '2026-08-20', amount: 47500.0, reference_id: 'UTR-SYNTH-A2611B', account: 'BANK' },
      ],
    },
    {
      document_number: 'INV-2026-017',
      customer_code: 'CUST-002',
      issue_date: '2026-08-28',
      due_date: '2026-09-12',
      category: 'Sales',
      total_amount: 80000.0,
      description: 'PET bottle multipack cartons',
      payments: [{ payment_date: '2026-09-26', amount: 80000.0, reference_id: 'UTR-SYNTH-A2617', account: 'BANK' }],
    },
    // Overdue 12 days (due 2026-10-10, ₹25,000 unpaid):
    {
      document_number: 'INV-2026-022',
      customer_code: 'CUST-002',
      issue_date: '2026-09-25',
      due_date: '2026-10-10',
      category: 'Sales',
      total_amount: 25000.0,
      description: 'Custom die-cut promotional neck-hangers (12 days overdue)',
      payments: [],
    },

    // --- CUST-003: Malwa Agro Exports Pvt Ltd (4 PAID invoices with heavy delays + 1 PARTIALLY_PAID ₹80k total / ₹30k paid / ₹50k overdue 38d -> Elevated Overdue Exposure) ---
    {
      document_number: 'INV-2025-005',
      customer_code: 'CUST-003',
      issue_date: '2025-11-10',
      due_date: '2025-11-25',
      category: 'Sales',
      total_amount: 70000.0,
      description: 'Ventilated pomegranate export boxes (FY25)',
      payments: [{ payment_date: '2025-12-15', amount: 70000.0, reference_id: 'UTR-SYNTH-A2505', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-003',
      customer_code: 'CUST-003',
      issue_date: '2026-03-10',
      due_date: '2026-03-25',
      category: 'Sales',
      total_amount: 60000.0,
      description: 'Grapes export telescopic cartons (FY25-Q4)',
      payments: [{ payment_date: '2026-03-25', amount: 60000.0, reference_id: 'UTR-SYNTH-A2603', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-007',
      customer_code: 'CUST-003',
      issue_date: '2026-05-25',
      due_date: '2026-06-09',
      category: 'Sales',
      total_amount: 85000.0,
      description: 'Alphonso mango export crates',
      payments: [{ payment_date: '2026-07-04', amount: 85000.0, reference_id: 'UTR-SYNTH-A2607', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-012',
      customer_code: 'CUST-003',
      issue_date: '2026-07-05',
      due_date: '2026-07-20',
      category: 'Sales',
      total_amount: 75000.0,
      description: 'Cold-storage wax-coated cartons',
      payments: [{ payment_date: '2026-08-17', amount: 75000.0, reference_id: 'UTR-SYNTH-A2612', account: 'BANK' }],
    },
    // Partially paid & 38 days overdue (due 2026-09-14, total 80,000, paid 30,000 on 2026-10-03, outstanding 50,000):
    {
      document_number: 'INV-2026-018',
      customer_code: 'CUST-003',
      issue_date: '2026-08-30',
      due_date: '2026-09-14',
      category: 'Sales',
      total_amount: 80000.0,
      description: 'Heavy-duty export pallet liners (Partially paid ₹30,000; ₹50,000 overdue 38 days)',
      payments: [{ payment_date: '2026-10-03', amount: 30000.0, reference_id: 'UTR-SYNTH-A2618P', account: 'BANK' }],
    },

    // --- CUST-004: Konkan Spices Co (1 PAID invoice -> Insufficient Data) ---
    {
      document_number: 'INV-2026-019',
      customer_code: 'CUST-004',
      issue_date: '2026-09-18',
      due_date: '2026-10-03',
      category: 'Sales',
      total_amount: 45000.0,
      description: 'Printed spice pouch dispenser cartons (First order)',
      payments: [{ payment_date: '2026-10-02', amount: 45000.0, reference_id: 'UTR-SYNTH-A2619', account: 'BANK' }],
    },

    // --- CUST-005: Vidarbha Textile Mills Ltd (6 PAID invoices with TIMING_IMPROVING trend -> Regular Payer + 1 OPEN current) ---
    {
      document_number: 'INV-2025-006',
      customer_code: 'CUST-005',
      issue_date: '2025-07-12',
      due_date: '2025-07-27',
      category: 'Sales',
      total_amount: 60000.0,
      description: 'Yarn cone packaging boxes (FY25)',
      payments: [{ payment_date: '2025-07-31', amount: 60000.0, reference_id: 'UTR-SYNTH-A2506', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-004',
      customer_code: 'CUST-005',
      issue_date: '2026-01-15',
      due_date: '2026-01-30',
      category: 'Sales',
      total_amount: 70000.0,
      description: 'Fabric roll octagonal drums (FY25-Q4)',
      payments: [{ payment_date: '2026-01-30', amount: 70000.0, reference_id: 'UTR-SYNTH-A2604', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-008',
      customer_code: 'CUST-005',
      issue_date: '2026-04-08',
      due_date: '2026-04-23',
      category: 'Sales',
      total_amount: 55000.0,
      description: 'Apparel export master cartons (April)',
      payments: [{ payment_date: '2026-04-23', amount: 55000.0, reference_id: 'UTR-SYNTH-A2608', account: 'BANK' }],
    },
    // Post-opening paid (delays -5d, -5d, -6d -> TIMING_IMPROVING vs prior median 0d):
    {
      document_number: 'INV-2026-009',
      customer_code: 'CUST-005',
      issue_date: '2026-06-10',
      due_date: '2026-06-25',
      category: 'Sales',
      total_amount: 80000.0,
      description: 'Spun yarn corrugated boxes (June lot)',
      payments: [{ payment_date: '2026-06-20', amount: 80000.0, reference_id: 'UTR-SYNTH-A2609', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-013',
      customer_code: 'CUST-005',
      issue_date: '2026-08-05',
      due_date: '2026-08-20',
      category: 'Sales',
      total_amount: 90000.0,
      description: 'Heavy GSM textile export cartons',
      payments: [{ payment_date: '2026-08-15', amount: 90000.0, reference_id: 'UTR-SYNTH-A2613', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-020',
      customer_code: 'CUST-005',
      issue_date: '2026-10-01',
      due_date: '2026-10-16',
      category: 'Sales',
      total_amount: 85000.0,
      description: 'Festive garment dispatch boxes (settled early)',
      payments: [{ payment_date: '2026-10-10', amount: 85000.0, reference_id: 'UTR-SYNTH-A2620', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-023',
      customer_code: 'CUST-005',
      issue_date: '2026-10-16',
      due_date: '2026-11-05',
      category: 'Sales',
      total_amount: 65000.0,
      description: 'Winter batch textile cartons (Open - Due in 14d)',
      payments: [],
    },

    // --- CUST-006: Narmada Organic Retail Hub (2 PAID invoices -> Insufficient Data + 1 OPEN current + 1 CANCELLED) ---
    {
      document_number: 'INV-2026-014',
      customer_code: 'CUST-006',
      issue_date: '2026-08-18',
      due_date: '2026-09-02',
      category: 'Sales',
      total_amount: 40000.0,
      description: 'Eco-kraft retail mailer boxes',
      payments: [{ payment_date: '2026-09-01', amount: 40000.0, reference_id: 'UTR-SYNTH-A2614', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-015',
      customer_code: 'CUST-006',
      issue_date: '2026-09-20',
      due_date: '2026-10-05',
      category: 'Packaging Design & Tooling',
      total_amount: 35000.0,
      description: 'Custom structural die-line and sample tooling',
      payments: [{ payment_date: '2026-10-04', amount: 35000.0, reference_id: 'UTR-SYNTH-A2615', account: 'BANK' }],
    },
    {
      document_number: 'INV-2026-024',
      customer_code: 'CUST-006',
      issue_date: '2026-10-18',
      due_date: '2026-11-09',
      category: 'Sales',
      total_amount: 55000.0,
      description: 'Organic hamper gift boxes (Open - Due in 18d)',
      payments: [],
    },
    {
      document_number: 'INV-2026-025',
      customer_code: 'CUST-006',
      issue_date: '2026-10-18',
      due_date: '2026-11-02',
      category: 'Sales',
      total_amount: 25000.0,
      is_cancelled: true,
      cancellation_reason: 'Duplicate order entry superseded by INV-2026-024',
      description: 'Cancelled duplicate entry (excluded from receivables and analytics)',
      payments: [],
    },

    // --- CUST-007: Aravalli Home Care Boutique (0 PAID invoices, 1 OPEN current) ---
    {
      document_number: 'INV-2026-026',
      customer_code: 'CUST-007',
      issue_date: '2026-10-20',
      due_date: '2026-11-16',
      category: 'Sales',
      total_amount: 45000.0,
      description: 'Rigid candle & diffuser packaging sleeves (Open - Due in 25d)',
      payments: [],
    },

    // --- CUST-008: Satpura Legacy Traders (Archived customer from FY 2025-26) ---
    {
      document_number: 'INV-2025-007',
      customer_code: 'CUST-008',
      issue_date: '2025-05-12',
      due_date: '2025-05-27',
      category: 'Sales',
      total_amount: 45000.0,
      description: 'Standard brown shipping cartons (FY25 archived account)',
      payments: [{ payment_date: '2025-05-26', amount: 45000.0, reference_id: 'UTR-SYNTH-A2507', account: 'BANK' }],
    },
  ],
  bills: [
    // --- Pre-opening Supplier Bills (<= 2026-04-30) ---
    {
      document_number: 'BILL-2025-001',
      supplier_code: 'SUP-001',
      issue_date: '2025-06-02',
      due_date: '2025-06-17',
      category: 'Inventory Purchases',
      total_amount: 140000.0,
      description: '180 GSM Kraft paper reels 4 tonnes (FY25)',
      payments: [{ payment_date: '2025-06-16', amount: 140000.0, reference_id: 'UTR-SYNTH-AB2501', account: 'BANK' }],
    },
    {
      document_number: 'BILL-2025-002',
      supplier_code: 'SUP-002',
      issue_date: '2025-10-10',
      due_date: '2025-10-25',
      category: 'Inventory Purchases',
      total_amount: 55000.0,
      description: 'Corrugation starch adhesive & flexo inks (FY25)',
      payments: [{ payment_date: '2025-10-24', amount: 55000.0, reference_id: 'UTR-SYNTH-AB2502', account: 'BANK' }],
    },
    {
      document_number: 'BILL-2026-001',
      supplier_code: 'SUP-001',
      issue_date: '2026-04-03',
      due_date: '2026-04-18',
      category: 'Inventory Purchases',
      total_amount: 110000.0,
      description: '150 GSM fluting medium paper reels (April)',
      payments: [{ payment_date: '2026-04-17', amount: 110000.0, reference_id: 'UTR-SYNTH-AB2601', account: 'BANK' }],
    },

    // --- Post-opening Paid Supplier Bills (> 2026-04-30, sum = ₹5,60,000.00) ---
    {
      document_number: 'BILL-2026-002',
      supplier_code: 'SUP-001',
      issue_date: '2026-05-10',
      due_date: '2026-05-25',
      category: 'Inventory Purchases',
      total_amount: 145000.0,
      description: 'Virgin kraft liner reels - May production batch',
      payments: [{ payment_date: '2026-05-24', amount: 145000.0, reference_id: 'UTR-SYNTH-AB2602', account: 'BANK' }],
    },
    {
      document_number: 'BILL-2026-003',
      supplier_code: 'SUP-002',
      issue_date: '2026-06-08',
      due_date: '2026-06-23',
      category: 'Inventory Purchases',
      total_amount: 60000.0,
      description: 'Water-resistant bonding resin & stitching wire coils',
      payments: [{ payment_date: '2026-06-22', amount: 60000.0, reference_id: 'UTR-SYNTH-AB2603', account: 'BANK' }],
    },
    {
      document_number: 'BILL-2026-004',
      supplier_code: 'SUP-001',
      issue_date: '2026-07-12',
      due_date: '2026-07-27',
      category: 'Inventory Purchases',
      total_amount: 155000.0,
      description: 'High-BF kraft paper reels - Q2 bulk supply',
      payments: [{ payment_date: '2026-07-26', amount: 155000.0, reference_id: 'UTR-SYNTH-AB2604', account: 'BANK' }],
    },
    {
      document_number: 'BILL-2026-005',
      supplier_code: 'SUP-003',
      issue_date: '2026-08-14',
      due_date: '2026-08-29',
      category: 'Machine Maintenance',
      total_amount: 45000.0,
      description: 'Single-facer corrugation roller re-grooving & bearings',
      payments: [{ payment_date: '2026-08-28', amount: 45000.0, reference_id: 'UTR-SYNTH-AB2605', account: 'BANK' }],
    },
    {
      document_number: 'BILL-2026-006',
      supplier_code: 'SUP-004',
      issue_date: '2026-09-05',
      due_date: '2026-09-20',
      category: 'Transportation',
      total_amount: 50000.0,
      description: 'Monthly B2B fleet freight charges (August-September)',
      payments: [{ payment_date: '2026-09-19', amount: 50000.0, reference_id: 'UTR-SYNTH-AB2606', account: 'BANK' }],
    },
    {
      document_number: 'BILL-2026-007',
      supplier_code: 'SUP-001',
      issue_date: '2026-09-22',
      due_date: '2026-10-07',
      category: 'Inventory Purchases',
      total_amount: 85000.0,
      description: 'Festive season duplex board sheets',
      payments: [{ payment_date: '2026-10-06', amount: 85000.0, reference_id: 'UTR-SYNTH-AB2607', account: 'BANK' }],
    },

    // --- 4 Open Supplier Bills totaling ₹1,95,000.00 (₹85,000.00 due in <= 7 days, ₹1,10,000.00 due in 8-30 days) ---
    {
      document_number: 'BILL-2026-008',
      supplier_code: 'SUP-001',
      issue_date: '2026-10-10',
      due_date: '2026-10-25',
      category: 'Inventory Purchases',
      total_amount: 50000.0,
      description: 'Kraft liner top-up reels (Due in 3 days)',
      payments: [],
    },
    {
      document_number: 'BILL-2026-009',
      supplier_code: 'SUP-002',
      issue_date: '2026-10-13',
      due_date: '2026-10-28',
      category: 'Inventory Purchases',
      total_amount: 35000.0,
      description: 'Four-colour flexo ink drums (Due in 6 days)',
      payments: [],
    },
    {
      document_number: 'BILL-2026-010',
      supplier_code: 'SUP-003',
      issue_date: '2026-10-17',
      due_date: '2026-11-06',
      category: 'Machine Maintenance',
      total_amount: 60000.0,
      description: 'Rotary die-cutter anvil cover replacement (Due in 15 days)',
      payments: [],
    },
    {
      document_number: 'BILL-2026-011',
      supplier_code: 'SUP-004',
      issue_date: '2026-10-14',
      due_date: '2026-11-14',
      category: 'Transportation',
      total_amount: 70000.0,
      description: 'October regional dispatch contract (₹20,000 advance paid; ₹50,000 due in 23 days)',
      payments: [{ payment_date: '2026-10-15', amount: 20000.0, reference_id: 'UTR-SYNTH-AB2611P', account: 'BANK' }],
    },
  ],
  direct_transactions: [
    // --- Pre-opening Direct Transactions (<= 2026-04-30; historical for FY25-26 & Apr 2026 reports) ---
    {
      transaction_date: '2025-09-15',
      direction: 'INFLOW',
      amount: 22000.0,
      account: 'CASH',
      category: 'Other Income',
      description: 'Corrugated trimmings & kraft scrap sale (FY25 Q2)',
      reference_id: 'UTR-SYNTH-AD2501',
    },
    {
      transaction_date: '2025-11-28',
      direction: 'OUTFLOW',
      amount: 120000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Factory & office payroll - November 2025',
      reference_id: 'UTR-SYNTH-AD2502',
    },
    {
      transaction_date: '2026-02-28',
      direction: 'OUTFLOW',
      amount: 120000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Factory & office payroll - February 2026',
      reference_id: 'UTR-SYNTH-AD2601',
    },
    {
      transaction_date: '2026-04-28',
      direction: 'OUTFLOW',
      amount: 65000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Factory staff wages - April 2026 (pre-cutoff)',
      reference_id: 'UTR-SYNTH-AD2602',
    },

    // --- Post-opening Direct Inflows (> 2026-04-30, sum = ₹1,55,000.00 so total post-opening inflows = 10,30,000 + 1,55,000 = ₹11,85,000.00) ---
    // Note: Cash inflows total ₹50,000.00 and Cash outflows total ₹15,000.00 -> net Cash account = ₹35,000.00!
    {
      transaction_date: '2026-05-22',
      direction: 'INFLOW',
      amount: 18000.0,
      account: 'CASH',
      category: 'Other Income',
      description: 'Walk-in counter sale of stock moving boxes & bubble wrap',
      reference_id: 'CASH-SYNTH-A001',
    },
    {
      transaction_date: '2026-06-26',
      direction: 'INFLOW',
      amount: 25000.0,
      account: 'BANK',
      category: 'Service Revenue',
      description: 'Express sample prototyping & burst-strength lab testing fee',
      reference_id: 'UTR-SYNTH-AD2603',
    },
    {
      transaction_date: '2026-07-29',
      direction: 'INFLOW',
      amount: 16000.0,
      account: 'CASH',
      category: 'Other Income',
      description: 'Baled kraft paper offcut scrap sale to recycler',
      reference_id: 'CASH-SYNTH-A002',
    },
    {
      transaction_date: '2026-08-24',
      direction: 'INFLOW',
      amount: 35000.0,
      account: 'BANK',
      category: 'Packaging Design & Tooling',
      description: 'Die-punch tooling & CAD layout consultancy fee',
      reference_id: 'UTR-SYNTH-AD2604',
    },
    {
      transaction_date: '2026-09-16',
      direction: 'INFLOW',
      amount: 16000.0,
      account: 'CASH',
      category: 'Other Income',
      description: 'Counter cash sale of stock corrugated rolls',
      reference_id: 'CASH-SYNTH-A003',
    },
    {
      transaction_date: '2026-10-08',
      direction: 'INFLOW',
      amount: 25000.0,
      account: 'BANK',
      category: 'Service Revenue',
      description: 'Urgent festive box lamination job-work charges',
      reference_id: 'UTR-SYNTH-AD2605',
    },
    {
      transaction_date: '2026-10-16',
      direction: 'INFLOW',
      amount: 20000.0,
      account: 'BANK',
      category: 'Other Income',
      description: 'Quarterly kraft waste recycling rebate',
      reference_id: 'UTR-SYNTH-AD2606',
    },

    // --- Post-opening Direct Outflows (> 2026-04-30, sum = ₹4,85,000.00 so total post-opening outflows = 5,60,000 + 4,85,000 = ₹10,45,000.00) ---
    {
      transaction_date: '2026-05-05',
      direction: 'OUTFLOW',
      amount: 25000.0,
      account: 'BANK',
      category: 'Rent',
      description: 'MIDC Bhosari shed rent - May 2026',
      reference_id: 'UTR-SYNTH-AE2601',
    },
    {
      transaction_date: '2026-05-29',
      direction: 'OUTFLOW',
      amount: 50000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Factory operators & office payroll - May 2026',
      reference_id: 'UTR-SYNTH-AE2602',
    },
    {
      transaction_date: '2026-06-05',
      direction: 'OUTFLOW',
      amount: 25000.0,
      account: 'BANK',
      category: 'Rent',
      description: 'MIDC Bhosari shed rent - June 2026',
      reference_id: 'UTR-SYNTH-AE2603',
    },
    {
      transaction_date: '2026-06-29',
      direction: 'OUTFLOW',
      amount: 50000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Factory operators & office payroll - June 2026',
      reference_id: 'UTR-SYNTH-AE2604',
    },
    {
      transaction_date: '2026-07-05',
      direction: 'OUTFLOW',
      amount: 25000.0,
      account: 'BANK',
      category: 'Rent',
      description: 'MIDC Bhosari shed rent - July 2026',
      reference_id: 'UTR-SYNTH-AE2605',
    },
    {
      transaction_date: '2026-07-29',
      direction: 'OUTFLOW',
      amount: 50000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Factory operators & office payroll - July 2026',
      reference_id: 'UTR-SYNTH-AE2606',
    },
    {
      transaction_date: '2026-08-05',
      direction: 'OUTFLOW',
      amount: 25000.0,
      account: 'BANK',
      category: 'Rent',
      description: 'MIDC Bhosari shed rent - August 2026',
      reference_id: 'UTR-SYNTH-AE2607',
    },
    {
      transaction_date: '2026-08-18',
      direction: 'OUTFLOW',
      amount: 15000.0,
      account: 'BANK',
      category: 'Utilities',
      description: 'MSEDCL three-phase industrial power bill - August 2026',
      reference_id: 'UTR-SYNTH-AE2608',
    },
    {
      transaction_date: '2026-08-29',
      direction: 'OUTFLOW',
      amount: 85000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Factory operators & office payroll - August 2026',
      reference_id: 'UTR-SYNTH-AE2609',
    },
    {
      transaction_date: '2026-09-05',
      direction: 'OUTFLOW',
      amount: 25000.0,
      account: 'BANK',
      category: 'Rent',
      description: 'MIDC Bhosari shed rent - September 2026',
      reference_id: 'UTR-SYNTH-AE2610',
    },
    {
      transaction_date: '2026-09-14',
      direction: 'OUTFLOW',
      amount: 30000.0,
      account: 'BANK',
      category: 'Utilities',
      description: 'MSEDCL three-phase industrial power bill - September 2026',
      reference_id: 'UTR-SYNTH-AE2611',
    },
    {
      transaction_date: '2026-09-22',
      direction: 'OUTFLOW',
      amount: 10000.0,
      account: 'CASH',
      category: 'Other Expenses',
      description: 'Petty cash factory tea, strapping consumables & loading labour',
      reference_id: 'CASH-SYNTH-A004',
    },
    {
      transaction_date: '2026-09-29',
      direction: 'OUTFLOW',
      amount: 85000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Factory operators & office payroll - September 2026',
      reference_id: 'UTR-SYNTH-AE2612',
    },
    {
      transaction_date: '2026-10-05',
      direction: 'OUTFLOW',
      amount: 25000.0,
      account: 'BANK',
      category: 'Rent',
      description: 'MIDC Bhosari shed rent - October 2026',
      reference_id: 'UTR-SYNTH-AE2613',
    },
    {
      transaction_date: '2026-10-09',
      direction: 'OUTFLOW',
      amount: 12000.0,
      account: 'BANK',
      category: 'Software & Subscriptions',
      description: 'Annual barcode & ERP cloud subscription renewal',
      speaker_supplier: 'SUP-005',
      supplier_code: 'SUP-005',
      reference_id: 'UTR-SYNTH-AE2614',
    },
    {
      transaction_date: '2026-10-13',
      direction: 'OUTFLOW',
      amount: 33000.0,
      account: 'BANK',
      category: 'Taxes',
      description: 'Monthly GST net challan payment',
      reference_id: 'UTR-SYNTH-AE2615',
    },
    {
      transaction_date: '2026-10-15',
      direction: 'OUTFLOW',
      amount: 10000.0,
      account: 'BANK',
      category: 'Marketing',
      description: 'B2B packaging expo brochure printing & trade directory listing',
      reference_id: 'UTR-SYNTH-AE2616',
    },
    {
      transaction_date: '2026-10-17',
      direction: 'OUTFLOW',
      amount: 5000.0,
      account: 'CASH',
      category: 'Other Expenses',
      description: 'Local tempo unloading & shopfloor safety gloves (Cash)',
      reference_id: 'CASH-SYNTH-A005',
    },
  ],
};

/**
 * PROFILE B: Vindhya Electricals & Switchgear (`profile_b_vindhya_electricals`)
 * Delayed Customer Payments & Severe Cash-Flow Pressure
 * - Demonstrates low available cash (₹1,12,450.00), heavy overdue receivables (including >90d overdue excluded from simulator baseline),
 *   and immediate Cash Coverage Warning where Overdue Payables + 7-Day Bills (₹2,25,000.00) > Available Cash (₹1,12,450.00).
 */
const PROFILE_B_CONFIG = {
  slug: 'profile_b_vindhya_electricals',
  scenario_title: 'Delayed Customer Payments & Acute Cash-Flow Pressure',
  scenario_summary:
    'Electrical switchgear distributor facing severe working-capital lockup: ₹1,12,450.00 available cash against ₹2,25,000.00 in urgent supplier bills (overdue + due within 7 days) and ₹4,85,000.00 in outstanding receivables (including a >90-day overdue invoice excluded from baseline simulator recovery).',
  demonstrated_capabilities: [
    'Active Cash Coverage Warning (`Overdue Payables + 7-Day Bills > Available Cash`)',
    'Severe customer payment delays across multiple risk tiers and >90-day aged receivable exclusion in Risk Simulator',
    'Immediate baseline cash shortfall within the 30-day Risk Simulator horizon even before stress sliders are applied',
    'Multi-instalment partial supplier bill payments and overdue supplier obligations',
  ],
  name: 'Vindhya Electricals & Switchgear Co',
  join_code: 'VND-2026-STRS',
  opening_cash_balance: 180000.0,
  opening_balance_date: '2026-06-30',
  opening_receivables_balance: 0.0,
  opening_payables_balance: 0.0,
  target_cash_buffer: 125000.0,
  custom_categories: [],
  customers: [
    {
      external_code: 'CUST-B01',
      name: 'Bundelkhand Infra Projects Ltd',
      email: 'ap.bundelkhandinfra@example.com',
      phone: '+91-90000-00201',
      address: 'Civil Lines, Jhansi, Uttar Pradesh 284001',
      notes: 'EPC contractor with chronic 30-55 day payment delays and >90d aged invoice.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-B02',
      name: 'Chambal Solar & Power Systems',
      email: 'accounts.chambalsolar@example.com',
      phone: '+91-90000-00202',
      address: 'Industrial Area, Gwalior, Madhya Pradesh 474005',
      notes: 'Solar integrator paying in delayed partial instalments.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-B03',
      name: 'Rewa Commercial Builders LLP',
      email: 'finance.rewabuilders@example.com',
      phone: '+91-90000-00203',
      address: 'Station Road, Rewa, Madhya Pradesh 486001',
      notes: 'Moderate delays (10-18 days) on distribution panel supplies.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-B04',
      name: 'Mahakoshal Hospitalities Pvt Ltd',
      email: 'purchase.mahakoshal@example.com',
      phone: '+91-90000-00204',
      address: 'Napier Town, Jabalpur, Madhya Pradesh 482001',
      notes: 'Reliable commercial buyer paying on time.',
      status: 'ACTIVE',
    },
  ],
  suppliers: [
    {
      external_code: 'SUP-B01',
      name: 'VoltGuard Switchgear OEM Ltd',
      email: 'collections.voltguard@example.com',
      phone: '+91-90000-00301',
      address: 'Makarpura GIDC, Vadodara, Gujarat 390010',
      notes: 'Primary MCCB/ACB breaker manufacturer; strict 15-day credit terms.',
      status: 'ACTIVE',
    },
    {
      external_code: 'SUP-B02',
      name: 'Kaveri Copper Cables Pvt Ltd',
      email: 'billing.kavericables@example.com',
      phone: '+91-90000-00302',
      address: 'Sanand Industrial Estate, Ahmedabad, Gujarat 382110',
      notes: 'Armoured industrial cable supplier.',
      status: 'ACTIVE',
    },
    {
      external_code: 'SUP-B03',
      name: 'Central Freight & Warehousing',
      email: 'accounts.centralfreight@example.com',
      phone: '+91-90000-00303',
      address: 'Katni Bypass Road, Jabalpur, Madhya Pradesh 482002',
      notes: 'Line-haul logistics vendor.',
      status: 'ACTIVE',
    },
  ],
  invoices: [
    // CUST-B01: 3 PAID late invoices + 1 >90d overdue (102 days overdue, due 2026-07-12) + 1 40d overdue
    {
      document_number: 'INV-B26-001',
      customer_code: 'CUST-B01',
      issue_date: '2026-07-02',
      due_date: '2026-07-17',
      category: 'Sales',
      total_amount: 90000.0,
      description: 'HT breaker panels lot 1',
      payments: [{ payment_date: '2026-08-14', amount: 90000.0, reference_id: 'UTR-SYNTH-B001', account: 'BANK' }],
    },
    {
      document_number: 'INV-B26-002',
      customer_code: 'CUST-B01',
      issue_date: '2026-07-20',
      due_date: '2026-08-04',
      category: 'Sales',
      total_amount: 85000.0,
      description: 'Industrial capacitor banks',
      payments: [{ payment_date: '2026-09-08', amount: 85000.0, reference_id: 'UTR-SYNTH-B002', account: 'BANK' }],
    },
    {
      document_number: 'INV-B26-003',
      customer_code: 'CUST-B01',
      issue_date: '2026-08-10',
      due_date: '2026-08-25',
      category: 'Sales',
      total_amount: 75000.0,
      description: 'Substation isolator switches',
      payments: [{ payment_date: '2026-09-28', amount: 75000.0, reference_id: 'UTR-SYNTH-B003', account: 'BANK' }],
    },
    {
      document_number: 'INV-B26-004',
      customer_code: 'CUST-B01',
      issue_date: '2026-06-27',
      due_date: '2026-07-12',
      category: 'Sales',
      total_amount: 140000.0,
      description: 'Feeder pillar assemblies (>90 days overdue: 102 days past due, excluded from baseline 30d recovery)',
      payments: [],
    },
    {
      document_number: 'INV-B26-005',
      customer_code: 'CUST-B01',
      issue_date: '2026-08-28',
      due_date: '2026-09-12',
      category: 'Sales',
      total_amount: 120000.0,
      description: 'Armoured underground cable drums (40 days overdue)',
      payments: [],
    },

    // CUST-B02: 3 PAID invoices + 1 PARTIALLY_PAID overdue (20 days overdue)
    {
      document_number: 'INV-B26-006',
      customer_code: 'CUST-B02',
      issue_date: '2026-07-08',
      due_date: '2026-07-23',
      category: 'Sales',
      total_amount: 60000.0,
      description: 'DC combiner boxes',
      payments: [{ payment_date: '2026-08-05', amount: 60000.0, reference_id: 'UTR-SYNTH-B006', account: 'BANK' }],
    },
    {
      document_number: 'INV-B26-007',
      customer_code: 'CUST-B02',
      issue_date: '2026-08-02',
      due_date: '2026-08-17',
      category: 'Sales',
      total_amount: 70000.0,
      description: 'Solar ACDB switchgear units',
      payments: [{ payment_date: '2026-09-02', amount: 70000.0, reference_id: 'UTR-SYNTH-B007', account: 'BANK' }],
    },
    {
      document_number: 'INV-B26-008',
      customer_code: 'CUST-B02',
      issue_date: '2026-08-22',
      due_date: '2026-09-06',
      category: 'Sales',
      total_amount: 65000.0,
      description: 'Surge protection devices',
      payments: [{ payment_date: '2026-09-24', amount: 65000.0, reference_id: 'UTR-SYNTH-B008', account: 'BANK' }],
    },
    {
      document_number: 'INV-B26-009',
      customer_code: 'CUST-B02',
      issue_date: '2026-09-17',
      due_date: '2026-10-02',
      category: 'Sales',
      total_amount: 150000.0,
      description: 'Inverter LT panels (₹40,000 paid; ₹1,10,000 overdue 20 days)',
      payments: [{ payment_date: '2026-10-08', amount: 40000.0, reference_id: 'UTR-SYNTH-B009P', account: 'BANK' }],
    },

    // CUST-B03: 1 OPEN current invoice due Day +12
    {
      document_number: 'INV-B26-010',
      customer_code: 'CUST-B03',
      issue_date: '2026-10-14',
      due_date: '2026-11-03',
      category: 'Sales',
      total_amount: 115000.0,
      description: 'Commercial meter boards (Open - Due in 12d)',
      payments: [],
    },

    // CUST-B04: 3 PAID on-time invoices (Regular Payer)
    {
      document_number: 'INV-B26-011',
      customer_code: 'CUST-B04',
      issue_date: '2026-07-15',
      due_date: '2026-07-30',
      category: 'Sales',
      total_amount: 45000.0,
      description: 'LED industrial high-bay luminaires',
      payments: [{ payment_date: '2026-07-29', amount: 45000.0, reference_id: 'UTR-SYNTH-B011', account: 'BANK' }],
    },
    {
      document_number: 'INV-B26-012',
      customer_code: 'CUST-B04',
      issue_date: '2026-08-18',
      due_date: '2026-09-02',
      category: 'Sales',
      total_amount: 50000.0,
      description: 'Automatic transfer switch module',
      payments: [{ payment_date: '2026-09-01', amount: 50000.0, reference_id: 'UTR-SYNTH-B012', account: 'BANK' }],
    },
    {
      document_number: 'INV-B26-013',
      customer_code: 'CUST-B04',
      issue_date: '2026-09-25',
      due_date: '2026-10-10',
      category: 'Sales',
      total_amount: 55000.0,
      description: 'Distribution MCB enclosures',
      payments: [{ payment_date: '2026-10-09', amount: 55000.0, reference_id: 'UTR-SYNTH-B013', account: 'BANK' }],
    },
  ],
  bills: [
    // Paid supplier bills
    {
      document_number: 'BILL-B26-001',
      supplier_code: 'SUP-B01',
      issue_date: '2026-07-05',
      due_date: '2026-07-20',
      category: 'Inventory Purchases',
      total_amount: 210000.0,
      description: 'OEM breaker consignment Q2-1',
      payments: [{ payment_date: '2026-07-20', amount: 210000.0, reference_id: 'UTR-SYNTH-BB001', account: 'BANK' }],
    },
    {
      document_number: 'BILL-B26-002',
      supplier_code: 'SUP-B02',
      issue_date: '2026-08-08',
      due_date: '2026-08-23',
      category: 'Inventory Purchases',
      total_amount: 195000.0,
      description: 'Copper multi-core cables lot',
      payments: [{ payment_date: '2026-08-25', amount: 195000.0, reference_id: 'UTR-SYNTH-BB002', account: 'BANK' }],
    },
    // Overdue supplier bill (₹95,000 overdue 7 days)
    {
      document_number: 'BILL-B26-003',
      supplier_code: 'SUP-B01',
      issue_date: '2026-09-30',
      due_date: '2026-10-15',
      category: 'Inventory Purchases',
      total_amount: 145000.0,
      description: 'MCCB switchgear stock replenishment (₹50,000 paid; ₹95,000 OVERDUE 7 days)',
      payments: [{ payment_date: '2026-10-14', amount: 50000.0, reference_id: 'UTR-SYNTH-BB003P', account: 'BANK' }],
    },
    // Due within 7 days (₹1,30,000 due in 4 days -> total urgent payables = 95,000 + 1,30,000 = ₹2,25,000 > ₹1,12,450 Available Cash!)
    {
      document_number: 'BILL-B26-004',
      supplier_code: 'SUP-B02',
      issue_date: '2026-10-11',
      due_date: '2026-10-26',
      category: 'Inventory Purchases',
      total_amount: 130000.0,
      description: 'XLPE power cable drums (Due in 4 days)',
      payments: [],
    },
    // Due in 18 days
    {
      document_number: 'BILL-B26-005',
      supplier_code: 'SUP-B03',
      issue_date: '2026-10-18',
      due_date: '2026-11-09',
      category: 'Transportation',
      total_amount: 42000.0,
      description: 'Heavy crane & line-haul transport charges (Due in 18 days)',
      payments: [],
    },
  ],
  direct_transactions: [
    {
      transaction_date: '2026-07-28',
      direction: 'OUTFLOW',
      amount: 62000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Warehouse & sales staff salaries - July 2026',
      reference_id: 'UTR-SYNTH-BD001',
    },
    {
      transaction_date: '2026-08-28',
      direction: 'OUTFLOW',
      amount: 62000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Warehouse & sales staff salaries - August 2026',
      reference_id: 'UTR-SYNTH-BD002',
    },
    {
      transaction_date: '2026-09-10',
      direction: 'OUTFLOW',
      amount: 28000.0,
      account: 'BANK',
      category: 'Rent',
      description: 'Showroom & godown rent - September 2026',
      reference_id: 'UTR-SYNTH-BD003',
    },
    {
      transaction_date: '2026-09-28',
      direction: 'OUTFLOW',
      amount: 62000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Warehouse & sales staff salaries - September 2026',
      reference_id: 'UTR-SYNTH-BD004',
    },
    {
      transaction_date: '2026-10-06',
      direction: 'OUTFLOW',
      amount: 28000.0,
      account: 'BANK',
      category: 'Rent',
      description: 'Showroom & godown rent - October 2026',
      reference_id: 'UTR-SYNTH-BD005',
    },
    {
      transaction_date: '2026-10-12',
      direction: 'INFLOW',
      amount: 18450.0,
      account: 'CASH',
      category: 'Sales',
      description: 'Counter cash sale of MCBs, lugs & gland kits',
      reference_id: 'CASH-SYNTH-B001',
    },
    {
      transaction_date: '2026-10-16',
      direction: 'OUTFLOW',
      amount: 24000.0,
      account: 'BANK',
      category: 'Taxes',
      description: 'September GST challan payment',
      reference_id: 'UTR-SYNTH-BD006',
    },
  ],
};

/**
 * PROFILE C: Sahyadri Fab & Engineering Works (`profile_c_sahyadri_fab_irregular`)
 * Irregular Income, Variable Expenses & Limited Cash Reserves
 * - Demonstrates lumpy milestone-based custom fabrication inflows, uneven transaction intervals,
 *   high-variance raw steel/machining expenses, and a thin cash reserve (₹78,620.00).
 */
const PROFILE_C_CONFIG = {
  slug: 'profile_c_sahyadri_fab_irregular',
  scenario_title: 'Irregular Milestone Income & Variable Expenses with Thin Cash Buffer',
  scenario_summary:
    'Custom structural fabrication workshop with lumpy, irregular project milestone inflows, volatile steel procurement and equipment repair outflows, and a modest ₹78,620.00 cash cushion.',
  demonstrated_capabilities: [
    'Lumpy, non-uniform inflow intervals (project mobilization advances and milestone settlements)',
    'Volatile operating expenses (spiky raw metal purchases, crane hire, and urgent welding machine repairs)',
    'Thin cash reserve (₹78,620.00) highly sensitive to a single milestone delay or unexpected ₹50,000 repair in the Risk Simulator',
  ],
  name: 'Sahyadri Fab & Engineering Works',
  join_code: 'SHY-2026-LUMP',
  opening_cash_balance: 135000.0,
  opening_balance_date: '2026-07-15',
  opening_receivables_balance: 0.0,
  opening_payables_balance: 0.0,
  target_cash_buffer: 100000.0,
  custom_categories: [{ name: 'Fabrication Job-Work', direction: 'INFLOW', is_system_default: false }],
  customers: [
    {
      external_code: 'CUST-C01',
      name: 'Western Sugar & Distillery Ltd',
      email: 'projects.westernsugar@example.com',
      phone: '+91-90000-00401',
      address: 'Kolhapur Industrial Belt, Maharashtra 416005',
      notes: 'Large boiler & hopper fabrication client; lumpy milestone billing.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-C02',
      name: 'Koyna Hydro Mechanicals Pvt Ltd',
      email: 'procurement.koynahydro@example.com',
      phone: '+91-90000-00402',
      address: 'Satara MIDC, Maharashtra 415004',
      notes: 'Custom sluice-gate & structural frame buyer.',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-C03',
      name: 'Sahyadri Cold Chain Warehousing',
      email: 'admin.sahyadricold@example.com',
      phone: '+91-90000-00403',
      address: 'Sangli Bypass, Maharashtra 416416',
      notes: 'Mezzanine racking project client.',
      status: 'ACTIVE',
    },
  ],
  suppliers: [
    {
      external_code: 'SUP-C01',
      name: 'Ratnagiri Steel & Plates Traders',
      email: 'sales.ratnagiristeel@example.com',
      phone: '+91-90000-00501',
      address: 'Shiroli MIDC, Kolhapur, Maharashtra 416122',
      notes: 'MS plate, channel, and I-beam supplier.',
      status: 'ACTIVE',
    },
    {
      external_code: 'SUP-C02',
      name: 'ArcWeld Industrial Gases & Consumables',
      email: 'orders.arcweld@example.com',
      phone: '+91-90000-00502',
      address: 'Kupwad MIDC, Sangli, Maharashtra 416436',
      notes: 'Argon/CO2 cylinders, MIG wire, and grinding discs.',
      status: 'ACTIVE',
    },
  ],
  invoices: [
    {
      document_number: 'INV-C26-001',
      customer_code: 'CUST-C01',
      issue_date: '2026-07-22',
      due_date: '2026-08-06',
      category: 'Fabrication Job-Work',
      total_amount: 165000.0,
      description: 'Bagasse hopper structural fabrication - Milestone 1',
      payments: [{ payment_date: '2026-08-12', amount: 165000.0, reference_id: 'UTR-SYNTH-C001', account: 'BANK' }],
    },
    {
      document_number: 'INV-C26-002',
      customer_code: 'CUST-C01',
      issue_date: '2026-08-25',
      due_date: '2026-09-09',
      category: 'Fabrication Job-Work',
      total_amount: 95000.0,
      description: 'Conveyor gantry support trusses - Milestone 2',
      payments: [{ payment_date: '2026-09-14', amount: 95000.0, reference_id: 'UTR-SYNTH-C002', account: 'BANK' }],
    },
    {
      document_number: 'INV-C26-003',
      customer_code: 'CUST-C01',
      issue_date: '2026-09-20',
      due_date: '2026-10-05',
      category: 'Fabrication Job-Work',
      total_amount: 110000.0,
      description: 'Chimney ducting sections - Milestone 3',
      payments: [{ payment_date: '2026-10-09', amount: 110000.0, reference_id: 'UTR-SYNTH-C003', account: 'BANK' }],
    },
    {
      document_number: 'INV-C26-004',
      customer_code: 'CUST-C02',
      issue_date: '2026-10-04',
      due_date: '2026-10-19',
      category: 'Fabrication Job-Work',
      total_amount: 125000.0,
      description: 'Heavy sluice valve baseframes (Overdue 3 days)',
      payments: [],
    },
    {
      document_number: 'INV-C26-005',
      customer_code: 'CUST-C03',
      issue_date: '2026-10-18',
      due_date: '2026-11-08',
      category: 'Fabrication Job-Work',
      total_amount: 140000.0,
      description: 'Cold-room mezzanine structural columns (Due in 17d)',
      payments: [],
    },
  ],
  bills: [
    {
      document_number: 'BILL-C26-001',
      supplier_code: 'SUP-C01',
      issue_date: '2026-07-26',
      due_date: '2026-08-10',
      category: 'Inventory Purchases',
      total_amount: 148000.0,
      description: '12mm MS boiler plates & ISMB beams',
      payments: [{ payment_date: '2026-08-14', amount: 148000.0, reference_id: 'UTR-SYNTH-CB001', account: 'BANK' }],
    },
    {
      document_number: 'BILL-C26-002',
      supplier_code: 'SUP-C02',
      issue_date: '2026-09-02',
      due_date: '2026-09-17',
      category: 'Inventory Purchases',
      total_amount: 44000.0,
      description: 'Shielding gas cylinders & flux-cored welding spools',
      payments: [{ payment_date: '2026-09-18', amount: 44000.0, reference_id: 'UTR-SYNTH-CB002', account: 'BANK' }],
    },
    {
      document_number: 'BILL-C26-003',
      supplier_code: 'SUP-C01',
      issue_date: '2026-10-12',
      due_date: '2026-10-27',
      category: 'Inventory Purchases',
      total_amount: 68000.0,
      description: 'Structural hollow sections for cold-room mezzanine (Due in 5d)',
      payments: [],
    },
    {
      document_number: 'BILL-C26-004',
      supplier_code: 'SUP-C02',
      issue_date: '2026-10-19',
      due_date: '2026-11-04',
      category: 'Inventory Purchases',
      total_amount: 26000.0,
      description: 'Plasma torch consumables & grinding wheels (Due in 13d)',
      payments: [],
    },
  ],
  direct_transactions: [
    {
      transaction_date: '2026-08-03',
      direction: 'OUTFLOW',
      amount: 48000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Welders & fitters wages - July 2026',
      reference_id: 'UTR-SYNTH-CD001',
    },
    {
      transaction_date: '2026-08-21',
      direction: 'OUTFLOW',
      amount: 31500.0,
      account: 'BANK',
      category: 'Other Expenses',
      description: 'Mobile hydra crane rental for hopper erection',
      reference_id: 'UTR-SYNTH-CD002',
    },
    {
      transaction_date: '2026-09-04',
      direction: 'OUTFLOW',
      amount: 52000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Welders & fitters wages + overtime - August 2026',
      reference_id: 'UTR-SYNTH-CD003',
    },
    {
      transaction_date: '2026-09-25',
      direction: 'INFLOW',
      amount: 14120.0,
      account: 'CASH',
      category: 'Other Income',
      description: 'Heavy MS plate offcut & turning scrap sale',
      reference_id: 'CASH-SYNTH-C001',
    },
    {
      transaction_date: '2026-10-03',
      direction: 'OUTFLOW',
      amount: 49000.0,
      account: 'BANK',
      category: 'Salaries',
      description: 'Welders & fitters wages - September 2026',
      reference_id: 'UTR-SYNTH-CD004',
    },
    {
      transaction_date: '2026-10-11',
      direction: 'OUTFLOW',
      amount: 38000.0,
      account: 'BANK',
      category: 'Other Expenses',
      description: 'Emergency 400A MIG rectifier transformer rewinding & repair',
      reference_id: 'UTR-SYNTH-CD005',
    },
    {
      transaction_date: '2026-10-16',
      direction: 'OUTFLOW',
      amount: 30000.0,
      account: 'BANK',
      category: 'Utilities',
      description: 'High-load industrial power bill & diesel generator fuel',
      reference_id: 'UTR-SYNTH-CD006',
    },
  ],
};

/**
 * PROFILE D: Narmada General Traders (`profile_d_narmada_sparse`)
 * Sparse / Incomplete History Edge-Case Workspace (< 14 days history, N < 3 customers, missing due_date)
 */
const PROFILE_D_CONFIG = {
  slug: 'profile_d_narmada_sparse',
  scenario_title: 'Sparse / Newly Onboarded Business (< 14 Days History & Missing Due Dates)',
  scenario_summary:
    'Newly onboarded wholesale trader with only 11 days of transaction history (2026-10-12 to 2026-10-22), unset opening_balance_date, customers below the N=3 completed-invoice threshold, and an open invoice with due_date = NULL.',
  demonstrated_capabilities: [
    'Sparse history (< 14 days) triggering honest Insufficient Data states in Risk Simulator run-rate and Reports prior-period comparisons',
    'Customer Intelligence N < 3 sample-size gating (`average_delay_days = null`, `collection_risk_indicator = "Insufficient Data"`)',
    'Open invoice with `due_date = null` included in `Total Outstanding Receivables` but excluded from `Overdue Receivables` and Risk Simulator scheduled inflows with explicit disclosure',
  ],
  name: 'Narmada General Traders',
  join_code: 'NRM-2026-NEWB',
  opening_cash_balance: 50000.0,
  opening_balance_date: null,
  opening_receivables_balance: 0.0,
  opening_payables_balance: 0.0,
  target_cash_buffer: null,
  custom_categories: [],
  customers: [
    {
      external_code: 'CUST-D01',
      name: 'Tapi Kirana & Provision Store',
      email: 'orders.tapikirana@example.com',
      phone: '+91-90000-00601',
      address: 'Main Bazaar, Burhanpur, Madhya Pradesh 450331',
      notes: 'Only 1 completed invoice (N=1 < 3).',
      status: 'ACTIVE',
    },
    {
      external_code: 'CUST-D02',
      name: 'Maheshwar Handloom Emporium',
      email: 'accounts.maheshwar@example.com',
      phone: '+91-90000-00602',
      address: 'Fort Road, Maheshwar, Madhya Pradesh 451224',
      notes: '0 completed invoices (N=0); 1 open invoice missing a contractual due_date.',
      status: 'ACTIVE',
    },
  ],
  suppliers: [
    {
      external_code: 'SUP-D01',
      name: 'Indore Wholesale Staples Mart',
      email: 'billing.indorestaples@example.com',
      phone: '+91-90000-00701',
      address: 'Siyaganj Wholesale Market, Indore, Madhya Pradesh 452007',
      notes: 'Initial inventory supplier.',
      status: 'ACTIVE',
    },
  ],
  invoices: [
    {
      document_number: 'INV-D26-001',
      customer_code: 'CUST-D01',
      issue_date: '2026-10-12',
      due_date: '2026-10-19',
      category: 'Sales',
      total_amount: 18000.0,
      description: 'Initial wholesale carton supply (Settled; N=1 < 3 threshold)',
      payments: [{ payment_date: '2026-10-18', amount: 18000.0, reference_id: 'UTR-SYNTH-D001', account: 'BANK' }],
    },
    {
      document_number: 'INV-D26-002',
      customer_code: 'CUST-D02',
      issue_date: '2026-10-19',
      due_date: null,
      category: 'Sales',
      total_amount: 24000.0,
      description: 'Open invoice with missing due_date (tests NULL due_date handling)',
      payments: [],
    },
  ],
  bills: [
    {
      document_number: 'BILL-D26-001',
      supplier_code: 'SUP-D01',
      issue_date: '2026-10-15',
      due_date: '2026-10-27',
      category: 'Inventory Purchases',
      total_amount: 15000.0,
      description: 'Initial stock purchase bill (Due in 5d)',
      payments: [],
    },
  ],
  direct_transactions: [
    {
      transaction_date: '2026-10-14',
      direction: 'OUTFLOW',
      amount: 6500.0,
      account: 'BANK',
      category: 'Rent',
      description: 'Shop advance rent - October 2026',
      reference_id: 'UTR-SYNTH-DD001',
    },
    {
      transaction_date: '2026-10-22',
      direction: 'INFLOW',
      amount: 4200.0,
      account: 'CASH',
      category: 'Sales',
      description: 'Counter cash sales',
      reference_id: 'CASH-SYNTH-D001',
    },
  ],
};

// ============================================================================
// 4. CSV EXPORT SERIALIZERS (SCENARIO BUNDLES + CSV FORMATS 1, 2, AND 3)
// ============================================================================

function serializeScenarioCsvFiles(bundle) {
  const customersHeaders = [
    'id',
    'business_id',
    'external_code',
    'name',
    'email',
    'phone',
    'address',
    'notes',
    'status',
    'created_at',
    'updated_at',
  ];
  const suppliersHeaders = customersHeaders;

  const invoicesHeaders = [
    'id',
    'business_id',
    'customer_id',
    'customer_code',
    'customer_name',
    'document_number',
    'issue_date',
    'due_date',
    'category_id',
    'category_name',
    'total_amount',
    'amount_paid',
    'outstanding_amount',
    'status',
    'is_overdue',
    'days_overdue',
    'cancelled_at',
    'cancellation_reason',
    'description',
    'created_at',
    'updated_at',
  ];

  const billsHeaders = [
    'id',
    'business_id',
    'supplier_id',
    'supplier_code',
    'supplier_name',
    'document_number',
    'issue_date',
    'due_date',
    'category_id',
    'category_name',
    'total_amount',
    'amount_paid',
    'outstanding_amount',
    'status',
    'is_overdue',
    'days_overdue',
    'is_due_soon_7d',
    'cancelled_at',
    'cancellation_reason',
    'description',
    'created_at',
    'updated_at',
  ];

  const transactionsHeaders = [
    'id',
    'business_id',
    'transaction_date',
    'direction',
    'transaction_kind',
    'amount',
    'payment_account',
    'category_id',
    'category_name',
    'description',
    'counterparty_type',
    'customer_id',
    'supplier_id',
    'counterparty_name',
    'counterparty_code',
    'document_number',
    'external_reference',
    'is_pre_opening_cutoff',
    'dedup_fingerprint',
    'status',
    'created_at',
  ];

  const paymentsHeaders = [
    'id',
    'business_id',
    'transaction_id',
    'target_type',
    'invoice_id',
    'bill_id',
    'document_number',
    'payment_date',
    'allocated_amount',
    'payment_reference',
    'status',
    'created_at',
  ];

  return {
    'customers.csv': toCsv(customersHeaders, bundle.customers),
    'suppliers.csv': toCsv(suppliersHeaders, bundle.suppliers),
    'invoices.csv': toCsv(
      invoicesHeaders,
      bundle.invoices.map((r) => ({
        ...r,
        total_amount: formatAmountStr(toPaise(r.total_amount)),
        amount_paid: formatAmountStr(toPaise(r.amount_paid)),
        outstanding_amount: formatAmountStr(toPaise(r.outstanding_amount)),
      }))
    ),
    'bills.csv': toCsv(
      billsHeaders,
      bundle.bills.map((r) => ({
        ...r,
        total_amount: formatAmountStr(toPaise(r.total_amount)),
        amount_paid: formatAmountStr(toPaise(r.amount_paid)),
        outstanding_amount: formatAmountStr(toPaise(r.outstanding_amount)),
      }))
    ),
    'transactions.csv': toCsv(
      transactionsHeaders,
      bundle.transactions.map((r) => ({
        ...r,
        amount: formatAmountStr(toPaise(r.amount)),
      }))
    ),
    'payments.csv': toCsv(
      paymentsHeaders,
      bundle.payments.map((r) => ({
        ...r,
        allocated_amount: formatAmountStr(toPaise(r.allocated_amount)),
      }))
    ),
  };
}

/**
 * CSV Format 1: FlowTrust Standard Transaction CSV (`flowtrust_transactions.csv`)
 * Columns per docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md §3.1:
 *   transaction_date,description,amount,type,category,account,reference_id,counterparty_name,counterparty_role,document_number
 */
const FORMAT_1_HEADERS = [
  'transaction_date',
  'description',
  'amount',
  'type',
  'category',
  'account',
  'reference_id',
  'counterparty_name',
  'counterparty_role',
  'document_number',
];

function serializeFormat1TransactionsCsv(bundle, { postCutoffOnly = false } = {}) {
  const rows = bundle.transactions
    .filter((t) => t.status === 'ACTIVE' && (!postCutoffOnly || !t.is_pre_opening_cutoff))
    .map((t) => ({
      transaction_date: t.transaction_date,
      description: t.description,
      amount: formatAmountStr(toPaise(t.amount)),
      type: t.direction,
      category: t.category_name || (t.direction === 'INFLOW' ? 'Other Income' : 'Other Expenses'),
      account: t.payment_account,
      reference_id: t.external_reference || '',
      counterparty_name: t.counterparty_name || '',
      counterparty_role: t.counterparty_type || '',
      document_number: t.document_number || '',
    }));
  return toCsv(FORMAT_1_HEADERS, rows);
}

/**
 * CSV Format 2: Indian SME Bank Statement CSV (`bank_statement_export.csv`)
 * Columns per docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md §3.2:
 *   date,narration,debit,credit,chq_ref_no,closing_balance
 */
const FORMAT_2_HEADERS = ['date', 'narration', 'debit', 'credit', 'chq_ref_no', 'closing_balance'];

function serializeFormat2BankStatementCsv(bundle, { useDdMmYyyy = false } = {}) {
  let runningPaise = toPaise(bundle.business.opening_cash_balance);
  const bankTxns = bundle.transactions.filter(
    (t) => t.status === 'ACTIVE' && !t.is_pre_opening_cutoff && t.payment_account === 'BANK'
  );
  const rows = bankTxns.map((t) => {
    const p = toPaise(t.amount);
    if (t.direction === 'INFLOW') runningPaise += p;
    else runningPaise -= p;
    return {
      date: useDdMmYyyy ? toDdMmYyyy(t.transaction_date) : t.transaction_date,
      narration: t.description,
      debit: t.direction === 'OUTFLOW' ? formatAmountStr(p) : '',
      credit: t.direction === 'INFLOW' ? formatAmountStr(p) : '',
      chq_ref_no: t.external_reference || '',
      closing_balance: formatAmountStr(runningPaise),
    };
  });
  return toCsv(FORMAT_2_HEADERS, rows);
}

/**
 * CSV Format 3: Invoices, Bills & Settlement Schedule CSV (`flowtrust_documents.csv`)
 * Columns per docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md §3.3:
 *   document_type,document_number,counterparty_name,counterparty_code,issue_date,due_date,total_amount,amount_paid,settlement_date,payment_reference,category,status,description
 */
const FORMAT_3_HEADERS = [
  'document_type',
  'document_number',
  'counterparty_name',
  'counterparty_code',
  'issue_date',
  'due_date',
  'total_amount',
  'amount_paid',
  'settlement_date',
  'payment_reference',
  'category',
  'status',
  'description',
];

function serializeFormat3DocumentsCsv(bundle) {
  const rows = [];

  for (const inv of bundle.invoices) {
    const linkedPays = bundle.payments
      .filter((p) => p.invoice_id === inv.id && p.status === 'ACTIVE')
      .sort((a, b) => a.payment_date.localeCompare(b.payment_date));
    const lastPay = linkedPays.length > 0 ? linkedPays[linkedPays.length - 1] : null;
    rows.push({
      document_type: 'INVOICE',
      document_number: inv.document_number,
      counterparty_name: inv.customer_name,
      counterparty_code: inv.customer_code,
      issue_date: inv.issue_date,
      due_date: inv.due_date || '',
      total_amount: formatAmountStr(toPaise(inv.total_amount)),
      amount_paid: formatAmountStr(toPaise(inv.amount_paid)),
      settlement_date: lastPay ? lastPay.payment_date : '',
      payment_reference: linkedPays.map((p) => p.payment_reference).join(';'),
      category: inv.category_name,
      status: inv.status,
      description: inv.description || '',
    });
  }

  for (const b of bundle.bills) {
    const linkedPays = bundle.payments
      .filter((p) => p.bill_id === b.id && p.status === 'ACTIVE')
      .sort((a, b) => a.payment_date.localeCompare(b.payment_date));
    const lastPay = linkedPays.length > 0 ? linkedPays[linkedPays.length - 1] : null;
    rows.push({
      document_type: 'BILL',
      document_number: b.document_number,
      counterparty_name: b.supplier_name,
      counterparty_code: b.supplier_code,
      issue_date: b.issue_date,
      due_date: b.due_date || '',
      total_amount: formatAmountStr(toPaise(b.total_amount)),
      amount_paid: formatAmountStr(toPaise(b.amount_paid)),
      settlement_date: lastPay ? lastPay.payment_date : '',
      payment_reference: linkedPays.map((p) => p.payment_reference).join(';'),
      category: b.category_name,
      status: b.status,
      description: b.description || '',
    });
  }

  return toCsv(FORMAT_3_HEADERS, rows);
}

// ============================================================================
// 5. EDGE-CASE & DELIBERATELY INVALID TEST FIXTURES (`datasets/synthetic/edge_cases/`)
// ============================================================================

function buildEdgeCaseFixtures() {
  const fixtures = {};

  // Fixture 1: Empty file (0 bytes)
  fixtures['fixture_01_empty_file.csv'] = '';

  // Fixture 2: Headers only (0 data rows)
  fixtures['fixture_02_headers_only.csv'] = FORMAT_1_HEADERS.join(',') + '\n';

  // Fixture 3: Missing required columns (missing `amount` and `transaction_date`)
  fixtures['fixture_03_missing_required_columns.csv'] = [
    'description,category,account,reference_id',
    'Corrugated carton sale,Sales,BANK,UTR-SYNTH-ERR301',
    'Factory electricity bill,Utilities,BANK,UTR-SYNTH-ERR302',
    '',
  ].join('\n');

  // Fixture 4: Malformed dates, non-numeric/zero amounts, and invalid direction enums
  fixtures['fixture_04_malformed_dates_and_amounts.csv'] = [
    FORMAT_1_HEADERS.join(','),
    // Row 2: Valid row (control)
    '2026-10-05,Valid corrugated carton receipt,45000.00,INFLOW,Sales,BANK,UTR-SYNTH-ERR401,Sahyadri Foods Pvt Ltd,CUSTOMER,',
    // Row 3: Impossible calendar date (2026-02-30) -> ERR_DATE_INVALID
    '2026-02-30,Invalid February 30 date row,12000.00,OUTFLOW,Rent,BANK,UTR-SYNTH-ERR402,,,',
    // Row 4: Non-numeric amount (₹12,abc.00) -> ERR_AMOUNT_INVALID
    '2026-10-08,Corrupted alphanumeric amount,"₹12,abc.00",INFLOW,Sales,BANK,UTR-SYNTH-ERR403,,,',
    // Row 5: Zero amount (0.00) -> ERR_AMOUNT_ZERO
    '2026-10-09,Zero rupee entry not allowed,0.00,OUTFLOW,Other Expenses,CASH,UTR-SYNTH-ERR404,,,',
    // Row 6: Missing direction with positive amount -> ERR_DIRECTION_MISSING
    '2026-10-10,Missing direction enum row,8500.00,,Sales,BANK,UTR-SYNTH-ERR405,,,',
    // Row 7: Missing required description -> ERR_DESCRIPTION_EMPTY
    '2026-10-11,,15000.00,OUTFLOW,Utilities,BANK,UTR-SYNTH-ERR406,,,',
    '',
  ].join('\n');

  // Fixture 5: Bank statement format conflicts (both Debit & Credit populated, plus Opening Balance B/F marker)
  fixtures['fixture_05_bank_debit_credit_conflict_and_markers.csv'] = [
    FORMAT_2_HEADERS.join(','),
    // Row 2: Opening balance brought forward marker -> WARN_OPENING_BALANCE_ROW
    '01/10/2026,Opening Balance B/F,,,OB-2026-10,340000.00',
    // Row 3: Valid credit row
    '05/10/2026,NEFT Cr Sahyadri Foods Pvt Ltd,,85000.00,UTR-SYNTH-ERR501,425000.00',
    // Row 4: Both Debit and Credit non-zero -> ERR_DEBIT_CREDIT_CONFLICT
    '07/10/2026,Conflicting debit and credit row,15000.00,15000.00,UTR-SYNTH-ERR502,425000.00',
    // Row 5: Self-transfer / cash withdrawal -> WARN_INTERNAL_TRANSFER
    '10/10/2026,Self Cash Withdrawal ATM MIDC Bhosari,10000.00,,UTR-SYNTH-ERR503,415000.00',
    '',
  ].join('\n');

  // Fixture 6: Mixed ambiguous date formats (MM/DD/YYYY mixed with DD/MM/YYYY)
  fixtures['fixture_06_mixed_date_formats.csv'] = [
    FORMAT_1_HEADERS.join(','),
    // Row 2: DD/MM/YYYY (25/09/2026)
    '25/09/2026,Standard Indian DD/MM/YYYY date,32000.00,INFLOW,Sales,BANK,UTR-SYNTH-ERR601,,,',
    // Row 3: US MM/DD/YYYY (09/28/2026 -> month=28 invalid under DD/MM/YYYY) -> ERR_DATE_INVALID
    '09/28/2026,Conflicting US MM/DD/YYYY date row,18500.00,OUTFLOW,Utilities,BANK,UTR-SYNTH-ERR602,,,',
    '',
  ].join('\n');

  // Fixture 7: Duplicate transactions & re-import test (exact reference_id duplicate, fuzzy fingerprint duplicate, and legitimate distinct transaction on same date/amount)
  fixtures['fixture_07_duplicates_and_reimport.csv'] = [
    FORMAT_1_HEADERS.join(','),
    // Row 2: Original valid transaction
    '2026-10-12,NEFT Receipt from Sahyadri Foods Pvt Ltd against INV-2026-016,105000.00,INFLOW,Sales,BANK,UTR-SYNTH-A2616,Sahyadri Foods Pvt Ltd,CUSTOMER,INV-2026-016',
    // Row 3: Exact reference_id duplicate of Row 2 -> WARN_CONFIRMED_DUPLICATE
    '2026-10-12,NEFT Receipt from Sahyadri Foods Pvt Ltd against INV-2026-016,105000.00,INFLOW,Sales,BANK,UTR-SYNTH-A2616,Sahyadri Foods Pvt Ltd,CUSTOMER,INV-2026-016',
    // Row 4: Fuzzy duplicate (missing reference_id, identical date + direction + amount + normalized description) -> WARN_POSSIBLE_DUPLICATE
    '2026-10-12,neft receipt from sahyadri foods pvt ltd against inv 2026 016,105000.00,INFLOW,Sales,BANK,,Sahyadri Foods Pvt Ltd,CUSTOMER,',
    // Row 5: Legitimate distinct transaction on same date & amount but different description/counterparty -> VALID (must NOT be auto-rejected)
    '2026-10-12,NEFT Receipt from Deccan Beverages LLP advance order,105000.00,INFLOW,Sales,BANK,UTR-SYNTH-LEGIT01,Deccan Beverages LLP,CUSTOMER,',
    '',
  ].join('\n');

  // Fixture 8: Document CSV consistency errors (due_date < issue_date, amount_paid > total_amount, missing settlement_date when amount_paid > 0, status mismatch)
  fixtures['fixture_08_inconsistent_documents.csv'] = [
    FORMAT_3_HEADERS.join(','),
    // Row 2: Valid invoice (control)
    'INVOICE,INV-ERR-001,Sahyadri Foods Pvt Ltd,CUST-001,2026-10-01,2026-10-16,50000.00,50000.00,2026-10-15,UTR-SYNTH-DOC01,Sales,PAID,Valid paid invoice',
    // Row 3: due_date < issue_date -> ERR_DOC_DUE_BEFORE_ISSUE
    'INVOICE,INV-ERR-002,Deccan Beverages LLP,CUST-002,2026-10-15,2026-10-01,40000.00,0.00,,,Sales,UNPAID,Due date earlier than issue date',
    // Row 4: amount_paid > total_amount -> ERR_DOC_OVERPAID
    'INVOICE,INV-ERR-003,Malwa Agro Exports Pvt Ltd,CUST-003,2026-09-10,2026-09-25,60000.00,75000.00,2026-09-24,UTR-SYNTH-DOC03,Sales,PAID,Amount paid exceeds total amount',
    // Row 5: amount_paid > 0 but settlement_date is blank -> ERR_DOC_SETTLEMENT_DATE_MISSING
    'BILL,BILL-ERR-001,Shree Kraft Paper Mills Pvt Ltd,SUP-001,2026-09-12,2026-09-27,85000.00,40000.00,,UTR-SYNTH-DOC04,Inventory Purchases,PARTIALLY_PAID,Missing settlement date on paid bill',
    // Row 6: status = PAID when amount_paid = 0 -> ERR_DOC_STATUS_MISMATCH
    'BILL,BILL-ERR-002,Bharat Adhesives & Inks LLP,SUP-002,2026-10-02,2026-10-17,35000.00,0.00,,,Inventory Purchases,PAID,Status claims PAID when amount_paid is 0',
    '',
  ].join('\n');

  const expectedOutcomes = {
    specification_reference: 'docs/data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md',
    isolated_from_demo_workspaces: true,
    fixtures: [
      {
        file: 'fixture_01_empty_file.csv',
        format: 'FORMAT_1_TRANSACTIONS',
        file_level_error: 'ERR_FILE_EMPTY',
        valid_rows: 0,
        error_rows: 0,
        warning_rows: 0,
      },
      {
        file: 'fixture_02_headers_only.csv',
        format: 'FORMAT_1_TRANSACTIONS',
        file_level_error: 'ERR_NO_DATA_ROWS',
        valid_rows: 0,
        error_rows: 0,
        warning_rows: 0,
      },
      {
        file: 'fixture_03_missing_required_columns.csv',
        format: 'FORMAT_1_TRANSACTIONS',
        file_level_error: 'ERR_MISSING_REQUIRED_COLUMNS',
        missing_columns: ['transaction_date', 'amount'],
        valid_rows: 0,
        error_rows: 0,
        warning_rows: 0,
      },
      {
        file: 'fixture_04_malformed_dates_and_amounts.csv',
        format: 'FORMAT_1_TRANSACTIONS',
        file_level_error: null,
        valid_rows: 1,
        error_rows: 5,
        warning_rows: 0,
        row_assertions: [
          { row_number: 2, outcome: 'VALID' },
          { row_number: 3, outcome: 'ERROR', code: 'ERR_DATE_INVALID' },
          { row_number: 4, outcome: 'ERROR', code: 'ERR_AMOUNT_INVALID' },
          { row_number: 5, outcome: 'ERROR', code: 'ERR_AMOUNT_ZERO' },
          { row_number: 6, outcome: 'ERROR', code: 'ERR_DIRECTION_MISSING' },
          { row_number: 7, outcome: 'ERROR', code: 'ERR_DESCRIPTION_EMPTY' },
        ],
      },
      {
        file: 'fixture_05_bank_debit_credit_conflict_and_markers.csv',
        format: 'FORMAT_2_BANK_STATEMENT',
        file_level_error: null,
        valid_rows: 1,
        error_rows: 1,
        warning_rows: 2,
        row_assertions: [
          { row_number: 2, outcome: 'WARNING', code: 'WARN_OPENING_BALANCE_ROW' },
          { row_number: 3, outcome: 'VALID' },
          { row_number: 4, outcome: 'ERROR', code: 'ERR_DEBIT_CREDIT_CONFLICT' },
          { row_number: 5, outcome: 'WARNING', code: 'WARN_INTERNAL_TRANSFER' },
        ],
      },
      {
        file: 'fixture_06_mixed_date_formats.csv',
        format: 'FORMAT_1_TRANSACTIONS',
        file_level_error: null,
        valid_rows: 1,
        error_rows: 1,
        warning_rows: 0,
        row_assertions: [
          { row_number: 2, outcome: 'VALID' },
          { row_number: 3, outcome: 'ERROR', code: 'ERR_DATE_INVALID' },
        ],
      },
      {
        file: 'fixture_07_duplicates_and_reimport.csv',
        format: 'FORMAT_1_TRANSACTIONS',
        file_level_error: null,
        valid_rows: 2,
        error_rows: 0,
        warning_rows: 2,
        row_assertions: [
          { row_number: 2, outcome: 'VALID' },
          { row_number: 3, outcome: 'WARNING', code: 'WARN_CONFIRMED_DUPLICATE' },
          { row_number: 4, outcome: 'WARNING', code: 'WARN_POSSIBLE_DUPLICATE' },
          { row_number: 5, outcome: 'VALID', note: 'Same date & amount but distinct description/counterparty' },
        ],
      },
      {
        file: 'fixture_08_inconsistent_documents.csv',
        format: 'FORMAT_3_DOCUMENTS',
        file_level_error: null,
        valid_rows: 1,
        error_rows: 4,
        warning_rows: 0,
        row_assertions: [
          { row_number: 2, outcome: 'VALID' },
          { row_number: 3, outcome: 'ERROR', code: 'ERR_DOC_DUE_BEFORE_ISSUE' },
          { row_number: 4, outcome: 'ERROR', code: 'ERR_DOC_OVERPAID' },
          { row_number: 5, outcome: 'ERROR', code: 'ERR_DOC_SETTLEMENT_DATE_MISSING' },
          { row_number: 6, outcome: 'ERROR', code: 'ERR_DOC_STATUS_MISMATCH' },
        ],
      },
    ],
  };

  return { fixtures, expectedOutcomes };
}

// ============================================================================
// 6. MAIN GENERATION PIPELINE & MANIFEST WRITER
// ============================================================================

function writeFileTracked(relPath, content, manifestFiles) {
  const absPath = path.join(SYNTHETIC_ROOT, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, 'utf8');
  manifestFiles.push({
    path: `datasets/synthetic/${relPath.replace(/\\/g, '/')}`,
    bytes: Buffer.byteLength(content, 'utf8'),
    sha256: sha256Text(content),
  });
}

function main() {
  const configs = [PROFILE_A_CONFIG, PROFILE_B_CONFIG, PROFILE_C_CONFIG, PROFILE_D_CONFIG];
  const manifestFiles = [];
  const scenarioManifestSummaries = [];

  const bundlesBySlug = new Map();

  // 1. Generate Business Scenario Bundles & Entity CSVs
  for (const cfg of configs) {
    const bundle = buildWorkspaceBundle(cfg);
    bundlesBySlug.set(cfg.slug, bundle);

    const scenarioDir = `business_scenarios/${cfg.slug}`;
    writeFileTracked(
      `${scenarioDir}/workspace_bundle.json`,
      JSON.stringify(bundle, null, 2) + '\n',
      manifestFiles
    );

    const entityCsvs = serializeScenarioCsvFiles(bundle);
    for (const [fileName, csvContent] of Object.entries(entityCsvs)) {
      writeFileTracked(`${scenarioDir}/${fileName}`, csvContent, manifestFiles);
    }

    scenarioManifestSummaries.push({
      slug: cfg.slug,
      business_id: bundle.business.id,
      business_name: bundle.business.name,
      scenario_title: cfg.scenario_title,
      as_of_date: ANCHOR_DATE,
      record_counts: {
        categories: bundle.categories.length,
        customers: bundle.customers.length,
        suppliers: bundle.suppliers.length,
        invoices: bundle.invoices.length,
        bills: bundle.bills.length,
        transactions: bundle.transactions.length,
        payments: bundle.payments.length,
      },
      expected_ground_truth: bundle.expected_ground_truth,
    });
  }

  // 2. Generate Valid CSV Import Files (`datasets/synthetic/csv_import/`)
  const bundleA = bundlesBySlug.get('profile_a_kaveri_packaging');
  const bundleB = bundlesBySlug.get('profile_b_vindhya_electricals');
  const bundleC = bundlesBySlug.get('profile_c_sahyadri_fab_irregular');
  const bundleD = bundlesBySlug.get('profile_d_narmada_sparse');

  // Empty import templates (for user download in UI)
  writeFileTracked(
    'csv_import/templates/flowtrust_transactions_template.csv',
    FORMAT_1_HEADERS.join(',') + '\n',
    manifestFiles
  );
  writeFileTracked(
    'csv_import/templates/bank_statement_export_template.csv',
    FORMAT_2_HEADERS.join(',') + '\n',
    manifestFiles
  );
  writeFileTracked(
    'csv_import/templates/flowtrust_documents_template.csv',
    FORMAT_3_HEADERS.join(',') + '\n',
    manifestFiles
  );

  // Profile A CSV Imports (Format 1 full + post-cutoff, Format 2 ISO + DD/MM/YYYY, Format 3 Documents)
  writeFileTracked(
    'csv_import/profile_a_kaveri_packaging_transactions.csv',
    serializeFormat1TransactionsCsv(bundleA, { postCutoffOnly: false }),
    manifestFiles
  );
  writeFileTracked(
    'csv_import/profile_a_kaveri_packaging_bank_statement.csv',
    serializeFormat2BankStatementCsv(bundleA, { useDdMmYyyy: true }),
    manifestFiles
  );
  writeFileTracked(
    'csv_import/profile_a_kaveri_packaging_documents.csv',
    serializeFormat3DocumentsCsv(bundleA),
    manifestFiles
  );

  // Profile B CSV Imports
  writeFileTracked(
    'csv_import/profile_b_vindhya_electricals_transactions.csv',
    serializeFormat1TransactionsCsv(bundleB, { postCutoffOnly: false }),
    manifestFiles
  );
  writeFileTracked(
    'csv_import/profile_b_vindhya_electricals_bank_statement.csv',
    serializeFormat2BankStatementCsv(bundleB, { useDdMmYyyy: false }),
    manifestFiles
  );
  writeFileTracked(
    'csv_import/profile_b_vindhya_electricals_documents.csv',
    serializeFormat3DocumentsCsv(bundleB),
    manifestFiles
  );

  // Profile C CSV Imports
  writeFileTracked(
    'csv_import/profile_c_sahyadri_fab_transactions.csv',
    serializeFormat1TransactionsCsv(bundleC, { postCutoffOnly: false }),
    manifestFiles
  );
  writeFileTracked(
    'csv_import/profile_c_sahyadri_fab_documents.csv',
    serializeFormat3DocumentsCsv(bundleC),
    manifestFiles
  );

  // Profile D CSV Imports
  writeFileTracked(
    'csv_import/profile_d_narmada_sparse_transactions.csv',
    serializeFormat1TransactionsCsv(bundleD, { postCutoffOnly: false }),
    manifestFiles
  );
  writeFileTracked(
    'csv_import/profile_d_narmada_sparse_documents.csv',
    serializeFormat3DocumentsCsv(bundleD),
    manifestFiles
  );

  // 3. Generate Isolated Edge-Case / Invalid Validation Fixtures (`datasets/synthetic/edge_cases/`)
  const { fixtures, expectedOutcomes } = buildEdgeCaseFixtures();
  for (const [fileName, content] of Object.entries(fixtures)) {
    writeFileTracked(`edge_cases/${fileName}`, content, manifestFiles);
  }
  writeFileTracked(
    'edge_cases/expected_validation_outcomes.json',
    JSON.stringify(expectedOutcomes, null, 2) + '\n',
    manifestFiles
  );

  // 4. Write Master Manifest (`datasets/synthetic/manifest.json`)
  const manifest = {
    generator: 'datasets/synthetic/scripts/generate_datasets.mjs',
    generator_version: '1.0.0',
    anchor_date: ANCHOR_DATE,
    synthetic_disclaimer:
      '100% SYNTHETIC DEMONSTRATION & TEST DATASETS. All businesses, counterparties, contact details (@example.com, +91-90000-000XX), and payment references (UTR-SYNTH-*) are fictional.',
    authoritative_specifications: [
      'docs/data/DATASET_STRATEGY_AND_SYNTHETIC_DATA_SPECIFICATION.md',
      'docs/data/CSV_IMPORT_AND_VALIDATION_SPECIFICATION.md',
      'docs/financial/FINANCIAL_FOUNDATION_SPECIFICATION.md',
      'docs/features/CUSTOMER_SUPPLIER_INTELLIGENCE_SPECIFICATION.md',
      'docs/features/RISK_SIMULATOR_SPECIFICATION.md',
      'docs/features/REPORTS_SPECIFICATION.md',
    ],
    scenarios: scenarioManifestSummaries,
    generated_files: manifestFiles,
  };

  const manifestPath = path.join(SYNTHETIC_ROOT, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`Successfully generated ${manifestFiles.length} synthetic dataset files and manifest.json.`);
  for (const s of scenarioManifestSummaries) {
    console.log(
      `  - ${s.slug}: Available Cash = ₹${s.expected_ground_truth.available_cash.toFixed(2)}, ` +
        `Receivables = ₹${s.expected_ground_truth.total_outstanding_receivables.toFixed(2)} (Overdue ₹${s.expected_ground_truth.overdue_receivables.toFixed(2)}), ` +
        `Payables = ₹${s.expected_ground_truth.total_outstanding_payables.toFixed(2)} (Due <=7d ₹${s.expected_ground_truth.bills_due_soon_7d.toFixed(2)})`
    );
  }
}

main();
