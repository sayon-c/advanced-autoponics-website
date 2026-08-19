import { json, clean } from '../../_lib/http.js';
import { requireDb } from '../../_lib/auth.js';
import { hashAccessCode } from '../../_lib/crypto.js';
import { vaultSecret, encryptAccessCode, decryptAccessCode } from '../../_lib/code-vault.js';
import {
  checkGeminySignupRateLimit,
  recordGeminySignupAttempt,
  generateGeminyKey,
  isValidEmail,
  normalizeEmail,
  newGeminyKeyId,
  sendGeminyAccessEmail
} from '../../_lib/geminy.js';
import { emailConfigured } from '../../_lib/email.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;

  if (!emailConfigured(env)) {
    return json(
      {
        error:
          'Email delivery is not configured. An administrator must set RESEND_API_KEY on the Worker.',
        code: 'resend_not_configured'
      },
      503
    );
  }

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

  // Count this attempt for abuse protection (success and failure share the window).
  await recordGeminySignupAttempt(env, rate.ipHash);

  const existing = await env.DB.prepare(
    `SELECT id, email, company, key_enc, status
     FROM geminy_keys
     WHERE email = ? COLLATE NOCASE AND status = 'active'
     ORDER BY created_at DESC
     LIMIT 1`
  )
    .bind(email)
    .first();

  let accessKey = null;
  let rowId = existing?.id || null;

  if (existing?.key_enc) {
    accessKey = await decryptAccessCode(existing.key_enc, vaultSecret(env));
  }

  if (!accessKey) {
    accessKey = generateGeminyKey();
    const keyHash = await hashAccessCode(accessKey);
    const secret = vaultSecret(env);
    const keyEnc = secret ? await encryptAccessCode(accessKey, secret) : null;
    const now = new Date().toISOString();

    if (existing?.id) {
      await env.DB.prepare(
        `UPDATE geminy_keys
         SET company = ?, key_hash = ?, key_enc = ?, ip_hash = ?
         WHERE id = ?`
      )
        .bind(company, keyHash, keyEnc, rate.ipHash, existing.id)
        .run();
      rowId = existing.id;
    } else {
      rowId = newGeminyKeyId();
      await env.DB.prepare(
        `INSERT INTO geminy_keys
          (id, email, company, key_hash, key_enc, status, created_at, last_sent_at, ip_hash)
         VALUES (?, ?, ?, ?, ?, 'active', ?, NULL, ?)`
      )
        .bind(rowId, email, company, keyHash, keyEnc, now, rate.ipHash)
        .run();
    }
  } else {
    // Keep company fresh; refresh last_sent after successful send below.
    await env.DB.prepare(
      `UPDATE geminy_keys SET company = ?, ip_hash = ? WHERE id = ?`
    )
      .bind(company, rate.ipHash, existing.id)
      .run();
  }

  const sent = await sendGeminyAccessEmail(env, {
    to: email,
    company,
    accessKey
  });

  if (!sent.sent) {
    return json(
      {
        error: sent.error || 'Could not send the access email. Try again later.',
        code: 'email_failed'
      },
      502
    );
  }

  const sentAt = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE geminy_keys SET last_sent_at = ? WHERE id = ?`
  )
    .bind(sentAt, rowId)
    .run();

  // Never return the key in the public response.
  return json({
    ok: true,
    message: 'Check your email for your GeminyIoT alpha login key.'
  });
}
