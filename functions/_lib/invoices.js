import { isKnownSelection, selectionLabel } from './billing-catalog.js';

export function parseLineItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Strip $, commas, spaces; parse a numeric string. Invalid → NaN. */
function parseNumericString(value) {
  if (value == null) return NaN;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const s = String(value).trim().replace(/\$/g, '').replace(/,/g, '').replace(/\s/g, '');
  if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Accept cents (number/string) or dollar fields → integer cents. */
export function coerceUnitPriceCents(item) {
  if (!item || typeof item !== 'object') return 0;
  const rawCents = item.unit_price_cents;
  if (rawCents != null && rawCents !== '') {
    // Currency-formatted strings in this field are dollars, not cents.
    if (typeof rawCents === 'string' && /[$,]/.test(rawCents)) {
      const dollars = parseNumericString(rawCents);
      if (Number.isFinite(dollars)) return Math.round(dollars * 100);
    } else {
      const cents = parseNumericString(rawCents);
      if (Number.isFinite(cents)) return Math.round(cents);
    }
  }
  const dollars =
    item.unit_price ?? item.unit_price_dollars ?? item.price ?? item.price_dollars;
  if (dollars != null && dollars !== '') {
    const n = parseNumericString(dollars);
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return 0;
}

export function coerceQuantity(value) {
  const n = parseNumericString(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeLineItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 100).map((item) => {
    const selectionRaw = String(item?.selection || item?.category || 'custom')
      .trim()
      .slice(0, 64);
    const selection = isKnownSelection(selectionRaw) ? selectionRaw : 'custom';
    const catalogLabel = selectionLabel(selection);
    let description = String(item?.description || '').trim().slice(0, 500);
    if (!description && catalogLabel && selection !== 'custom') {
      description = catalogLabel;
    }
    return {
      selection,
      selection_label: catalogLabel || 'Custom',
      description,
      quantity: coerceQuantity(item?.quantity),
      unit_price_cents: coerceUnitPriceCents(item)
    };
  });
}

export function totalsFromItems(items, taxCents = 0) {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unit_price_cents),
    0
  );
  const tax = Math.round(Number(taxCents) || 0);
  return {
    subtotal_cents: subtotal,
    tax_cents: tax,
    total_cents: subtotal + tax
  };
}

export function normalizeComments(body) {
  const raw = body?.comments ?? body?.notes ?? body?.info;
  if (raw == null) return null;
  const text = String(raw).trim().slice(0, 4000);
  return text || null;
}

/** Parse ach_json from D1 (string or object) → normalized object or null. */
export function parseAch(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return normalizeAch(raw);
  if (typeof raw !== 'string') return null;
  try {
    return normalizeAch(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Normalize ACH for storage/API. Only routing + account are kept.
 * Extra legacy keys (bank name, etc.) are ignored. Returns null if both empty.
 */
export function normalizeAch(input) {
  if (input == null || typeof input !== 'object') return null;

  const routing_number = String(
    input.routing_number || input.routing || ''
  )
    .replace(/\D/g, '')
    .slice(0, 9);
  const account_number = String(
    input.account_number || input.account || ''
  )
    .replace(/[\s-]+/g, '')
    .replace(/[^\w]/g, '')
    .slice(0, 34);

  if (!routing_number && !account_number) return null;
  return { routing_number, account_number };
}

export function hasAch(ach) {
  return Boolean(normalizeAch(ach));
}

/** Allowed invoice workflow statuses. */
export const INVOICE_STATUSES = new Set(['draft', 'sent', 'viewed', 'paid', 'void']);

/**
 * Normalize status; maps legacy `open` → `sent`.
 * Invalid values fall back to `fallback` (default draft).
 */
export function normalizeStatus(raw, fallback = 'draft') {
  let s = String(raw || '')
    .trim()
    .toLowerCase();
  if (s === 'open') s = 'sent';
  if (!INVOICE_STATUSES.has(s)) return fallback;
  return s;
}

/** Never downgrade paid; never move void except explicitly. */
export function nextStatusOnClientView(current) {
  const s = normalizeStatus(current, 'sent');
  if (s === 'paid' || s === 'void' || s === 'draft') return s;
  if (s === 'sent') return 'viewed';
  return s;
}

export function maskAccountNumber(account) {
  const digits = String(account || '').replace(/\s/g, '');
  if (!digits) return '';
  if (digits.length <= 4) return `••••${digits}`;
  return `••••${digits.slice(-4)}`;
}

export function maskRoutingNumber(routing) {
  const digits = String(routing || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 4) return `••••${digits}`;
  return `${digits.slice(0, 2)}••••${digits.slice(-2)}`;
}

/** Client-safe ACH: masked account/routing; full numbers only when reveal=true. */
export function publicAch(ach, { reveal = false } = {}) {
  const full = normalizeAch(ach);
  if (!full) return null;
  if (reveal) return { ...full, revealed: true, masked: false };
  return {
    routing_number: maskRoutingNumber(full.routing_number),
    account_number: maskAccountNumber(full.account_number),
    revealed: false,
    masked: true,
    has_routing: Boolean(full.routing_number),
    has_account: Boolean(full.account_number)
  };
}

export function viewStatus(row) {
  const first = row.first_viewed_at || null;
  const last = row.last_viewed_at || null;
  const count = Number(row.view_count || 0);
  return {
    viewed: Boolean(first) || count > 0,
    first_viewed_at: first,
    last_viewed_at: last,
    view_count: count
  };
}

/** Absolute www portal URL for client invoice deep links. */
export function clientPortalInvoiceUrl(id) {
  const safe = encodeURIComponent(String(id || '').trim());
  return `https://www.advancedautoponics.com/invoices?id=${safe}`;
}

export function clientPortalHomeUrl() {
  return 'https://www.advancedautoponics.com/invoices';
}

/**
 * Welcome message for sharing with a client (portal URL + access code instructions).
 * When plaintext code is available (create/regenerate), include it; otherwise placeholder.
 */
export function clientWelcomeText({ clientName, accessCode = null } = {}) {
  const name = String(clientName || 'there').trim() || 'there';
  const portal = clientPortalHomeUrl();
  const codeBlock = accessCode
    ? `Your access code: ${accessCode}`
    : 'Your access code: [email billing@advancedautoponics.com for your code]';
  return [
    `Hello ${name},`,
    '',
    'Your Advanced Autoponics, LLC client invoice portal is ready.',
    '',
    `Sign in here: ${portal}`,
    codeBlock,
    '',
    'Keep this code private. If you lose it, email billing@advancedautoponics.com for a new one.',
    '',
    'Invoice questions: billing@advancedautoponics.com',
    '',
    '— Advanced Autoponics, LLC'
  ].join('\n');
}

export function publicInvoice(
  row,
  { detail = false, includeViews = false, maskAch = false, revealAch = false } = {}
) {
  const status = normalizeStatus(row.status, row.status || 'draft');
  const base = {
    id: row.id,
    number: row.number,
    issue_date: row.issue_date,
    due_date: row.due_date,
    status,
    currency: row.currency || 'USD',
    subtotal_cents: row.subtotal_cents,
    tax_cents: row.tax_cents,
    total_cents: row.total_cents,
    paid_date: row.paid_date || null,
    sent_at: row.sent_at || null
  };
  if (includeViews) {
    Object.assign(base, viewStatus(row));
  }
  if (!detail) return base;
  const comments = row.notes || null;
  const achRaw = parseAch(row.ach_json);
  const ach = maskAch ? publicAch(achRaw, { reveal: revealAch }) : achRaw;
  return {
    ...base,
    comments,
    notes: comments,
    ach,
    line_items: normalizeLineItems(parseLineItems(row.line_items)),
    created_at: row.created_at
  };
}
