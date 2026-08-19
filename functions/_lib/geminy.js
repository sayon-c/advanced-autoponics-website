import { clean, clientIp } from './http.js';
import { hashIp, newId, generateAccessCode, normalizeAccessCode } from './crypto.js';
import { emailConfigured, sendResendEmail } from './email.js';

const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const SIGNUP_MAX = 8;

/** Placeholder until the GeminyIoT app URL is finalized. Override with GEMINY_APP_URL. */
export const DEFAULT_GEMINY_APP_URL = 'https://app.advancedautoponics.com';

export function geminyAppUrl(env) {
  return clean(env?.GEMINY_APP_URL, 500) || DEFAULT_GEMINY_APP_URL;
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
  // Practical check — not RFC-perfect; HTML type=email is the first line.
  return Boolean(e) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 320;
}

export function geminyAccessEmailContent({ company, accessKey, appUrl } = {}) {
  const subject = 'Your GeminyIoT alpha access key';
  const body = [
    `Hello${company ? ` — ${company}` : ''},`,
    '',
    'Thanks for requesting early access to GeminyIoT.',
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
    'Questions? Email info@advancedautoponics.com or call (608) 320-0213.',
    '',
    '— Advanced Autoponics'
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

  const from =
    clean(env.GEMINY_FROM, 320) ||
    clean(env.CONTACT_FROM, 320) ||
    'Advanced Autoponics <info@advancedautoponics.com>';

  const replyTo =
    clean(env.GEMINY_REPLY_TO, 320) ||
    clean(env.CONTACT_REPLY_TO, 320) ||
    'info@advancedautoponics.com';

  return sendResendEmail(env, { to, subject, body, from, replyTo });
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
