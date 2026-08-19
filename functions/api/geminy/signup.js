import { json, clean } from '../../_lib/http.js';
import { requireDb } from '../../_lib/auth.js';
import {
  checkGeminySignupRateLimit,
  recordGeminySignupAttempt,
  isValidEmail,
  normalizeEmail,
  newGeminyKeyId,
  geminyDecisionSecret,
  signGeminyDecision,
  siteOriginFromRequest,
  geminyDecisionUrls,
  sendGeminyAdminNotifyEmail,
  sendGeminyRequestReceivedEmail
} from '../../_lib/geminy.js';
import { emailConfigured } from '../../_lib/email.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;

  const rate = await checkGeminySignupRateLimit(request, env);
  if (rate.limited) {
    const mins = Math.max(1, Math.ceil(rate.retryAfterSec / 60));
    return json(
      {
        error: `Too many access requests from this network. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`,
        code: 'rate_limited'
      },
      429,
      { 'Retry-After': String(rate.retryAfterSec) }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.', code: 'bad_request' }, 400);
  }

  const email = normalizeEmail(body?.email);
  const company = clean(body?.company, 200);

  if (!isValidEmail(email)) {
    await recordGeminySignupAttempt(env, rate.ipHash);
    return json({ error: 'Enter a valid work email.', code: 'invalid_email' }, 400);
  }
  if (!company || company.length < 2) {
    await recordGeminySignupAttempt(env, rate.ipHash);
    return json({ error: 'Enter your company name.', code: 'invalid_company' }, 400);
  }

  await recordGeminySignupAttempt(env, rate.ipHash);

  const existingActive = await env.DB.prepare(
    `SELECT id, status FROM geminy_keys
     WHERE email = ? COLLATE NOCASE AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`
  )
    .bind(email)
    .first();

  if (existingActive) {
    // Do not reveal key; do not auto-resend. Ask them to wait / contact.
    return json({
      ok: true,
      message:
        'You already have GeminyIoT access on file. If you need your key resent, email sayonc@advancedautoponics.com.'
    });
  }

  const existingPending = await env.DB.prepare(
    `SELECT id, email, company, status FROM geminy_keys
     WHERE email = ? COLLATE NOCASE AND status = 'pending'
     ORDER BY created_at DESC LIMIT 1`
  )
    .bind(email)
    .first();

  const now = new Date().toISOString();
  let rowId = existingPending?.id || null;

  if (existingPending?.id) {
    await env.DB.prepare(
      `UPDATE geminy_keys SET company = ?, ip_hash = ? WHERE id = ?`
    )
      .bind(company, rate.ipHash, existingPending.id)
      .run();
  } else {
    rowId = newGeminyKeyId();
    // Pending: no key yet. Empty key_hash satisfies NOT NULL from migration 0009.
    await env.DB.prepare(
      `INSERT INTO geminy_keys
        (id, email, company, key_hash, key_enc, status, created_at, last_sent_at, ip_hash)
       VALUES (?, ?, ?, '', NULL, 'pending', ?, NULL, ?)`
    )
      .bind(rowId, email, company, now, rate.ipHash)
      .run();
  }

  const origin = siteOriginFromRequest(request);
  const secret = geminyDecisionSecret(env);
  let adminEmailed = false;
  let confirmEmailed = false;

  if (emailConfigured(env) && secret) {
    const approveToken = await signGeminyDecision({ id: rowId, action: 'approve', secret });
    const rejectToken = await signGeminyDecision({ id: rowId, action: 'reject', secret });
    const urls = geminyDecisionUrls(origin, approveToken, rejectToken);

    const adminSend = await sendGeminyAdminNotifyEmail(env, {
      company,
      email,
      requestId: rowId,
      ...urls
    });
    adminEmailed = Boolean(adminSend.sent);

    const confirmSend = await sendGeminyRequestReceivedEmail(env, { to: email, company });
    confirmEmailed = Boolean(confirmSend.sent);
  }

  // Never return a key. Success even if Resend is unset — admin can approve in desk.
  return json({
    ok: true,
    message:
      'Request received. We’ll review it and email a login key only if approved — nothing is issued automatically.',
    notified_admin: adminEmailed,
    confirmation_emailed: confirmEmailed,
    email_configured: emailConfigured(env)
  });
}
