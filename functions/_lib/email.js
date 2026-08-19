import { clean } from './http.js';
import { clientPortalInvoiceUrl } from './invoices.js';

/** Invoice questions / Reply-To — billing inbox (not necessarily the Resend From address). */
export const INVOICE_FINANCE_EMAIL = 'billing@advancedautoponics.com';

export function invoiceEmailContent({
  invoice,
  clientName,
  toEmail = '',
  fromName = 'Advanced Autoponics, LLC'
} = {}) {
  const number = invoice?.number || 'invoice';
  const portalUrl = clientPortalInvoiceUrl(invoice?.id);
  const due = invoice?.due_date || 'see invoice';
  const total = formatUsd(invoice?.total_cents);
  const subject = `Invoice ${number} from Advanced Autoponics, LLC`;
  const body = [
    `Hello${clientName ? ` ${clientName}` : ''},`,
    '',
    `Your invoice ${number} is ready (${total}${invoice?.due_date ? `, due ${due}` : ''}).`,
    '',
    'View it in the Advanced Autoponics, LLC client portal:',
    portalUrl,
    '',
    'Sign in with the access code Advanced Autoponics, LLC shared with you.',
    '',
    `Questions about this invoice? Email ${INVOICE_FINANCE_EMAIL}.`,
    '',
    'Thank you,',
    fromName
  ].join('\n');

  const mailto = `mailto:${encodeURIComponent(toEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, portalUrl, mailto, to: toEmail || null };
}

function formatUsd(cents) {
  const amount = (Number(cents) || 0) / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Resend keys are ASCII (`re_…`). Notes/Word pastes often wrap them in curly quotes,
 * which makes Authorization non-ASCII and Resend returns 401 — while `emailConfigured`
 * still looks true.
 */
export function resendApiKey(env) {
  let raw = String(env?.RESEND_API_KEY ?? '')
    .replace(/^\uFEFF/, '')
    .trim();
  raw = raw.replace(/^[\u2018\u2019\u201C\u201D"']+|[\u2018\u2019\u201C\u201D"']+$/g, '').trim();
  return raw;
}

function logResendFailure(payload) {
  try {
    console.error(JSON.stringify({ event: 'resend_send_failed', ...payload }));
  } catch {
    console.error('resend_send_failed');
  }
}

/**
 * Low-level Resend send. Callers supply From / Reply-To.
 * Never logs the API key or Authorization header.
 * @returns {{ sent: boolean, id?: string, error?: string, status?: number, mode: 'resend'|'mailto' }}
 */
export async function sendResendEmail(
  env,
  { to, subject, body, from, replyTo, defaultSubject = 'Message from Advanced Autoponics' } = {}
) {
  const apiKey = resendApiKey(env);
  if (!apiKey) {
    return { sent: false, mode: 'mailto', error: 'RESEND_API_KEY is not configured.' };
  }
  const emailTo = clean(to, 320);
  if (!emailTo || !emailTo.includes('@')) {
    return { sent: false, mode: 'resend', error: 'A valid recipient email is required.' };
  }

  const fromHeader = clean(from, 320);
  if (!fromHeader) {
    return { sent: false, mode: 'resend', error: 'From address is not configured.' };
  }

  const payload = {
    from: fromHeader,
    to: [emailTo],
    subject: clean(subject, 200) || defaultSubject,
    text: String(body || '').slice(0, 20000)
  };
  const resolvedReplyTo = clean(replyTo, 320);
  if (resolvedReplyTo) payload.reply_to = resolvedReplyTo;

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    const error = err?.message || 'Network error talking to email service.';
    logResendFailure({ error, from: fromHeader });
    return { sent: false, mode: 'resend', error };
  }

  if (!response.ok) {
    let detail = '';
    let code = '';
    try {
      const errBody = await response.json();
      detail = errBody?.message || errBody?.error || '';
      code = errBody?.name || errBody?.statusCode || '';
    } catch {
      /* ignore */
    }
    const error = detail
      ? `Resend ${response.status}: ${detail}`
      : `Resend ${response.status}: email service rejected the message.`;
    logResendFailure({
      status: response.status,
      code: code || undefined,
      error,
      from: fromHeader
    });
    return { sent: false, mode: 'resend', status: response.status, error };
  }

  let id = null;
  try {
    const data = await response.json();
    id = data?.id || null;
  } catch {
    /* ignore */
  }
  return { sent: true, mode: 'resend', id };
}

/**
 * Send via Resend when RESEND_API_KEY is set.
 * @returns {{ sent: boolean, id?: string, error?: string, mode: 'resend'|'mailto' }}
 */
export async function sendInvoiceEmail(env, { to, subject, body, replyTo } = {}) {
  if (!resendApiKey(env)) {
    return { sent: false, mode: 'mailto', error: 'RESEND_API_KEY is not configured.' };
  }

  // Prefer INVOICE_FROM (advancedautoponics.com must be verified in Resend).
  const from =
    clean(env.INVOICE_FROM, 320) ||
    clean(env.CONTACT_FROM, 320) ||
    'Advanced Autoponics, LLC <billing@advancedautoponics.com>';

  // Reply-To: billing inbox so clients reply there even when From differs.
  const resolvedReplyTo =
    clean(replyTo, 320) ||
    clean(env?.INVOICE_REPLY_TO, 320) ||
    INVOICE_FINANCE_EMAIL;

  return sendResendEmail(env, {
    to,
    subject,
    body,
    from,
    replyTo: resolvedReplyTo,
    defaultSubject: 'Invoice from Advanced Autoponics, LLC'
  });
}

export function emailConfigured(env) {
  return Boolean(resendApiKey(env));
}
