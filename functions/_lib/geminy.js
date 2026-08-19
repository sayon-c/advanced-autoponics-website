import { clean, clientIp } from './http.js';
import { hashIp, newId, generateAccessCode, normalizeAccessCode, hashAccessCode } from './crypto.js';
import { emailConfigured, sendResendEmail } from './email.js';
import { vaultSecret, encryptAccessCode, decryptAccessCode } from './code-vault.js';

const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const SIGNUP_MAX = 8;
/** Decision links expire after 7 days. */
const DECISION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Placeholder until the GeminyIoT app URL is finalized. Override with GEMINY_APP_URL. */
export const DEFAULT_GEMINY_APP_URL = 'https://app.advancedautoponics.com';

export function geminyAppUrl(env) {
  return clean(env?.GEMINY_APP_URL, 500) || DEFAULT_GEMINY_APP_URL;
}

export function geminyAdminNotifyEmail(env) {
  return (
    clean(env?.GEMINY_ADMIN_EMAIL, 320) ||
    clean(env?.CONTACT_REPLY_TO, 320) ||
    'sayonc@advancedautoponics.com'
  );
}

function geminyMailFrom(env) {
  return (
    clean(env.GEMINY_FROM, 320) ||
    clean(env.CONTACT_FROM, 320) ||
    'Advanced Autoponics <info@advancedautoponics.com>'
  );
}

function geminyMailReplyTo(env) {
  return (
    clean(env.GEMINY_REPLY_TO, 320) ||
    clean(env.CONTACT_REPLY_TO, 320) ||
    'sayonc@advancedautoponics.com'
  );
}

/** Signing secret for approve/reject email links. */
export function geminyDecisionSecret(env) {
  return (
    clean(env?.ADMIN_SECRET, 500) ||
    clean(env?.SESSION_SECRET, 500) ||
    ''
  );
}

/** Login key in the same spirit as invoice codes: GEM-XXXX-XXXX */
export function generateGeminyKey() {
  const code = generateAccessCode().replace(/^ORG-/, 'GEM-');
  return normalizeAccessCode(code);
}

export function normalizeEmail(email) {
  return clean(email, 320).toLowerCase();
}

export function isValidEmail(email) {
  const e = normalizeEmail(email);
  return Boolean(e) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 320;
}

export function geminyAccessEmailContent({ company, accessKey, appUrl } = {}) {
  const subject = 'Your GeminyIoT alpha access key';
  const body = [
    `Hello${company ? ` — ${company}` : ''},`,
    '',
    'Your request for early access to GeminyIoT was approved.',
    '',
    'This is an alpha / early build of the application. Expect rough edges;',
    'we appreciate clear feedback if something breaks.',
    '',
    `Your login key: ${accessKey}`,
    '',
    'Sign in here:',
    appUrl || DEFAULT_GEMINY_APP_URL,
    '',
    'Paste the key when prompted. Keep it private — anyone with the key can access your alpha login.',
    '',
    'Questions? Email sayonc@advancedautoponics.com or call (608) 320-0213.',
    '',
    '— Advanced Autoponics'
  ].join('\n');

  return { subject, body };
}

export function geminyRequestReceivedEmailContent({ company } = {}) {
  const subject = 'GeminyIoT access request received';
  const body = [
    `Hello${company ? ` — ${company}` : ''},`,
    '',
    'We received your request for GeminyIoT alpha access.',
    '',
    'We’ll review it and email a login key only if approved. No key is issued automatically.',
    '',
    'Questions? Email sayonc@advancedautoponics.com or call (608) 320-0213.',
    '',
    '— Advanced Autoponics'
  ].join('\n');
  return { subject, body };
}

export function geminyAdminNotifyEmailContent({
  company,
  email,
  requestId,
  approveUrl,
  rejectUrl,
  deskUrl
} = {}) {
  const subject = `GeminyIoT access request: ${company || email || 'new'}`;
  const body = [
    'New GeminyIoT alpha access request (pending approval).',
    '',
    `Company: ${company || '—'}`,
    `Email: ${email || '—'}`,
    `Request ID: ${requestId || '—'}`,
    '',
    'Approve (issues a login key and emails the applicant):',
    approveUrl || '(unavailable — use billing desk)',
    '',
    'Reject:',
    rejectUrl || '(unavailable — use billing desk)',
    '',
    'Or review in the admin desk:',
    deskUrl || 'https://www.advancedautoponics.com/aa-billing-desk.html#/geminy',
    '',
    'Links expire in 7 days and only work while the request is still pending.',
    '',
    '— Advanced Autoponics site'
  ].join('\n');
  return { subject, body };
}

export async function sendGeminyAccessEmail(env, { to, company, accessKey } = {}) {
  if (!emailConfigured(env)) {
    return {
      sent: false,
      mode: 'resend',
      error: 'RESEND_API_KEY is not configured. Set it with: npx wrangler secret put RESEND_API_KEY'
    };
  }

  const appUrl = geminyAppUrl(env);
  const { subject, body } = geminyAccessEmailContent({ company, accessKey, appUrl });
  return sendResendEmail(env, {
    to,
    subject,
    body,
    from: geminyMailFrom(env),
    replyTo: geminyMailReplyTo(env)
  });
}

export async function sendGeminyRequestReceivedEmail(env, { to, company } = {}) {
  if (!emailConfigured(env)) {
    return { sent: false, mode: 'resend', error: 'RESEND_API_KEY is not configured.' };
  }
  const { subject, body } = geminyRequestReceivedEmailContent({ company });
  return sendResendEmail(env, {
    to,
    subject,
    body,
    from: geminyMailFrom(env),
    replyTo: geminyMailReplyTo(env)
  });
}

export async function sendGeminyAdminNotifyEmail(env, payload = {}) {
  if (!emailConfigured(env)) {
    return { sent: false, mode: 'resend', error: 'RESEND_API_KEY is not configured.' };
  }
  const to = geminyAdminNotifyEmail(env);
  const { subject, body } = geminyAdminNotifyEmailContent(payload);
  return sendResendEmail(env, {
    to,
    subject,
    body,
    from: geminyMailFrom(env),
    replyTo: geminyMailReplyTo(env)
  });
}

/**
 * HMAC decision token (approve|reject). Reuses session-style signing;
 * payload uses rid + act + exp (verifySession checks cid — use custom verify).
 */
export async function signGeminyDecision({ id, action, secret, ttlMs = DECISION_TTL_MS } = {}) {
  if (!secret || !id || !action) return null;
  const exp = Date.now() + ttlMs;
  const bodyPayload = { rid: id, act: action, exp };
  // signSession requires cid in verify — sign raw the same way:
  return signRaw(bodyPayload, secret);
}

async function signRaw(payload, secret) {
  // Mirror crypto.signSession without cid requirement.
  const textEncoder = new TextEncoder();
  const json = JSON.stringify(payload);
  let bin = '';
  const bytes = textEncoder.encode(json);
  for (const b of bytes) bin += String.fromCharCode(b);
  const body = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, textEncoder.encode(body)));
  let sigBin = '';
  for (const b of sig) sigBin += String.fromCharCode(b);
  const sigB64 = btoa(sigBin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${body}.${sigB64}`;
}

export async function verifyGeminyDecision(token, secret) {
  if (!token || !secret) return null;
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;

  const pad = '='.repeat((4 - (sig.length % 4)) % 4);
  const b64 = (sig + pad).replace(/-/g, '+').replace(/_/g, '/');
  const sigBin = atob(b64);
  const sigBytes = new Uint8Array(sigBin.length);
  for (let i = 0; i < sigBin.length; i++) sigBytes[i] = sigBin.charCodeAt(i);

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const ok = await crypto.subtle.verify('HMAC', key, sigBytes, textEncoder.encode(body));
  if (!ok) return null;

  try {
    const padB = '='.repeat((4 - (body.length % 4)) % 4);
    const b64b = (body + padB).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64b);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    const payload = JSON.parse(textDecoder.decode(out));
    if (!payload?.rid || !payload?.act || !payload?.exp) return null;
    if (Date.now() > Number(payload.exp)) return null;
    const act = String(payload.act).toLowerCase();
    if (act !== 'approve' && act !== 'reject') return null;
    return { id: String(payload.rid), action: act, exp: Number(payload.exp) };
  } catch {
    return null;
  }
}

export function siteOriginFromRequest(request) {
  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'https://www.advancedautoponics.com';
  }
}

export function geminyDecisionUrls(origin, approveToken, rejectToken) {
  const base = String(origin || '').replace(/\/+$/, '');
  return {
    approveUrl: `${base}/api/geminy/decide?token=${encodeURIComponent(approveToken)}`,
    rejectUrl: `${base}/api/geminy/decide?token=${encodeURIComponent(rejectToken)}`,
    deskUrl: `${base}/aa-billing-desk.html#/geminy`
  };
}

/**
 * Issue key + mark active + email applicant.
 * @returns {{ ok: true, accessKey: string, sent: boolean, emailError?: string } | { ok: false, error: string, code?: string }}
 */
export async function approveGeminyRequest(env, row) {
  if (!row?.id) return { ok: false, error: 'Missing request.', code: 'bad_request' };
  if (row.status !== 'pending') {
    return { ok: false, error: `Request is already ${row.status}.`, code: 'not_pending' };
  }
  if (!emailConfigured(env)) {
    return {
      ok: false,
      error: 'RESEND_API_KEY is not configured — cannot email the applicant their key.',
      code: 'resend_not_configured'
    };
  }

  let accessKey = null;
  if (row.key_enc) {
    accessKey = await decryptAccessCode(row.key_enc, vaultSecret(env));
  }
  if (!accessKey) {
    accessKey = generateGeminyKey();
  }
  const keyHash = await hashAccessCode(accessKey);
  const secret = vaultSecret(env);
  const keyEnc = secret ? await encryptAccessCode(accessKey, secret) : null;
  const sentAt = new Date().toISOString();

  const updated = await env.DB.prepare(
    `UPDATE geminy_keys
     SET status = 'active', key_hash = ?, key_enc = ?, last_sent_at = ?
     WHERE id = ? AND status = 'pending'`
  )
    .bind(keyHash, keyEnc, sentAt, row.id)
    .run();

  if (!updated?.meta?.changes) {
    return { ok: false, error: 'Request was no longer pending.', code: 'not_pending' };
  }

  const sent = await sendGeminyAccessEmail(env, {
    to: row.email,
    company: row.company,
    accessKey
  });

  if (!sent.sent) {
    return {
      ok: true,
      accessKey,
      sent: false,
      emailError: sent.error || 'Email failed after approval.'
    };
  }

  return { ok: true, accessKey, sent: true };
}

export async function rejectGeminyRequest(env, row) {
  if (!row?.id) return { ok: false, error: 'Missing request.', code: 'bad_request' };
  if (row.status !== 'pending') {
    return { ok: false, error: `Request is already ${row.status}.`, code: 'not_pending' };
  }
  const result = await env.DB.prepare(
    `UPDATE geminy_keys SET status = 'rejected' WHERE id = ? AND status = 'pending'`
  )
    .bind(row.id)
    .run();
  if (!result?.meta?.changes) {
    return { ok: false, error: 'Request was no longer pending.', code: 'not_pending' };
  }
  return { ok: true };
}

export async function checkGeminySignupRateLimit(request, env) {
  const ip = clientIp(request);
  const ipHash = await hashIp(ip);
  const now = Date.now();
  const since = now - SIGNUP_WINDOW_MS;

  await env.DB.prepare(
    'DELETE FROM geminy_signup_attempts WHERE attempted_at < ?'
  )
    .bind(since)
    .run();

  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS c, MIN(attempted_at) AS oldest
     FROM geminy_signup_attempts WHERE ip_hash = ? AND attempted_at >= ?`
  )
    .bind(ipHash, since)
    .first();

  const count = Number(row?.c || 0);
  if (count >= SIGNUP_MAX) {
    const oldest = Number(row?.oldest || now);
    const retryAfterSec = Math.max(30, Math.ceil((oldest + SIGNUP_WINDOW_MS - now) / 1000));
    return { limited: true, retryAfterSec, ipHash };
  }
  return { limited: false, ipHash };
}

export async function recordGeminySignupAttempt(env, ipHash) {
  await env.DB.prepare(
    'INSERT INTO geminy_signup_attempts (ip_hash, attempted_at) VALUES (?, ?)'
  )
    .bind(ipHash, Date.now())
    .run();
}

export function newGeminyKeyId() {
  return newId('gem');
}
