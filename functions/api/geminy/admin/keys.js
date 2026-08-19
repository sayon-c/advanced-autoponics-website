import { json, clean } from '../../../_lib/http.js';
import { requireAdmin, requireDb } from '../../../_lib/auth.js';
import { hashAccessCode } from '../../../_lib/crypto.js';
import { vaultSecret, encryptAccessCode, decryptAccessCode } from '../../../_lib/code-vault.js';
import {
  generateGeminyKey,
  sendGeminyAccessEmail,
  geminyAppUrl
} from '../../../_lib/geminy.js';
import { emailConfigured } from '../../../_lib/email.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

async function revealKey(env, enc) {
  if (!enc) return null;
  return decryptAccessCode(enc, vaultSecret(env));
}

/** List Geminy access requests / keys (admin). */
export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const url = new URL(request.url);
  const status = clean(url.searchParams.get('status'), 32).toLowerCase();

  let sql = `SELECT id, email, company, key_enc, status, created_at, last_sent_at
             FROM geminy_keys`;
  const binds = [];
  if (status === 'active' || status === 'revoked') {
    sql += ' WHERE status = ?';
    binds.push(status);
  }
  sql += ' ORDER BY created_at DESC LIMIT 200';

  const stmt = env.DB.prepare(sql);
  const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();

  const keys = [];
  for (const row of results || []) {
    const access_key = await revealKey(env, row.key_enc);
    keys.push({
      id: row.id,
      email: row.email,
      company: row.company,
      status: row.status,
      created_at: row.created_at,
      last_sent_at: row.last_sent_at || null,
      access_key: access_key || null,
      key_available: Boolean(access_key)
    });
  }

  return json({
    keys,
    app_url: geminyAppUrl(env),
    email_configured: emailConfigured(env),
    note: 'Keys are shown only to authenticated admins (encrypted at rest). Public signup never returns plaintext.'
  });
}

/**
 * PATCH body:
 *   { id, action: 'revoke' | 'resend' | 'reveal' }
 * reveal is noop for GET-style — use GET; resend emails key again; revoke sets status.
 */
export async function onRequestPatch({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const id = clean(body?.id, 80);
  const action = clean(body?.action, 32).toLowerCase();
  if (!id) return json({ error: 'id is required.' }, 400);

  const row = await env.DB.prepare(
    `SELECT id, email, company, key_hash, key_enc, status, created_at, last_sent_at
     FROM geminy_keys WHERE id = ?`
  )
    .bind(id)
    .first();

  if (!row) return json({ error: 'Key not found.' }, 404);

  if (action === 'revoke') {
    await env.DB.prepare(
      `UPDATE geminy_keys SET status = 'revoked' WHERE id = ?`
    )
      .bind(id)
      .run();
    return json({ ok: true, id, status: 'revoked' });
  }

  if (action === 'activate') {
    await env.DB.prepare(
      `UPDATE geminy_keys SET status = 'active' WHERE id = ?`
    )
      .bind(id)
      .run();
    return json({ ok: true, id, status: 'active' });
  }

  if (action === 'resend') {
    if (row.status !== 'active') {
      return json({ error: 'Only active keys can be resent. Activate first.', code: 'revoked' }, 400);
    }
    if (!emailConfigured(env)) {
      return json(
        {
          error: 'RESEND_API_KEY is not configured.',
          code: 'resend_not_configured'
        },
        503
      );
    }

    let accessKey = await revealKey(env, row.key_enc);
    if (!accessKey) {
      accessKey = generateGeminyKey();
      const keyHash = await hashAccessCode(accessKey);
      const secret = vaultSecret(env);
      const keyEnc = secret ? await encryptAccessCode(accessKey, secret) : null;
      await env.DB.prepare(
        `UPDATE geminy_keys SET key_hash = ?, key_enc = ? WHERE id = ?`
      )
        .bind(keyHash, keyEnc, id)
        .run();
    }

    const sent = await sendGeminyAccessEmail(env, {
      to: row.email,
      company: row.company,
      accessKey
    });
    if (!sent.sent) {
      return json({ error: sent.error || 'Email failed.', code: 'email_failed' }, 502);
    }

    const sentAt = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE geminy_keys SET last_sent_at = ? WHERE id = ?`
    )
      .bind(sentAt, id)
      .run();

    return json({
      ok: true,
      id,
      emailed: true,
      last_sent_at: sentAt,
      // Admin may still need the plaintext for support.
      access_key: accessKey
    });
  }

  return json({ error: 'Unknown action. Use revoke, activate, or resend.' }, 400);
}
