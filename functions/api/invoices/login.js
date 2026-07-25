import {
  hashAccessCode,
  normalizeAccessCode,
  verifyAccessCode,
  signSession,
  newId
} from '../../_lib/crypto.js';
import { json, sessionCookie } from '../../_lib/http.js';
import { requireDb, SESSION_TTL_SEC } from '../../_lib/auth.js';
import { checkLoginRateLimit, recordLoginAttempt } from '../../_lib/rate-limit.js';
import { writeAudit } from '../../_lib/audit.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  if (!env.SESSION_SECRET) {
    return json({ error: 'Session signing is not configured.' }, 503);
  }

  const rate = await checkLoginRateLimit(request, env);
  if (rate.limited) {
    const mins = Math.max(1, Math.ceil(rate.retryAfterSec / 60));
    return json(
      {
        error: `Too many failed sign-in attempts. Wait about ${mins} minute${mins === 1 ? '' : 's'}, then try again with the access code Advanced Autoponics, LLC shared with you — do not guess.`,
        code: 'rate_limited',
        retry_after_sec: rate.retryAfterSec
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

  // Accept `code` (portal) or `access_code` (admin naming).
  const code = normalizeAccessCode(body?.code ?? body?.access_code ?? '').slice(0, 128);
  if (!code || code.length < 6) {
    await recordLoginAttempt(env, rate.ipHash);
    return json(
      { error: 'That access code is not valid. Check the code and try again.', code: 'invalid_code' },
      401
    );
  }

  // Load candidates; verify with constant-time compare against each hash.
  // Client count is small for this business.
  const { results } = await env.DB.prepare(
    'SELECT id, name, access_code_hash FROM clients'
  ).all();

  let matched = null;
  for (const client of results || []) {
    if (await verifyAccessCode(code, client.access_code_hash)) {
      matched = client;
      break;
    }
  }

  if (!matched) {
    await recordLoginAttempt(env, rate.ipHash);
    // Touch hashAccessCode so failed paths spend similar crypto time as success setup.
    await hashAccessCode(code).catch(() => {});
    return json(
      { error: 'That access code is not valid. Check the code and try again.', code: 'invalid_code' },
      401
    );
  }

  const exp = Date.now() + SESSION_TTL_SEC * 1000;
  const token = await signSession(
    { cid: matched.id, name: matched.name, exp, jti: newId() },
    env.SESSION_SECRET
  );

  await writeAudit(env, {
    request,
    actor: `client:${matched.id}`,
    action: 'client.login',
    entityType: 'client',
    entityId: matched.id,
    meta: { name: matched.name }
  });

  return json(
    { ok: true, client: { id: matched.id, name: matched.name } },
    200,
    { 'Set-Cookie': sessionCookie(token, SESSION_TTL_SEC, request) }
  );
}
