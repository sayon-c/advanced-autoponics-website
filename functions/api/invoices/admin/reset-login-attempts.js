import { json, clean, clientIp } from '../../../_lib/http.js';
import { requireAdmin, requireDb } from '../../../_lib/auth.js';
import {
  countLoginAttempts,
  clearLoginAttempts,
  clearLoginAttemptsForIp
} from '../../../_lib/rate-limit.js';
import { writeAudit } from '../../../_lib/audit.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

/** GET — current failed-login attempt counts (for admin UI). */
export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const stats = await countLoginAttempts(env);
  return json({ ok: true, ...stats });
}

/**
 * POST — clear login_attempts globally or for one IP.
 * Body: {} | { "all": true } | { "ip": "1.2.3.4" }
 */
export async function onRequestPost({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  let body = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return json({ error: 'Invalid JSON body.', code: 'bad_request' }, 400);
  }

  const ipRaw = clean(body?.ip, 80);
  let cleared;
  let scope = 'all';

  if (ipRaw) {
    cleared = await clearLoginAttemptsForIp(env, ipRaw);
    scope = 'ip';
  } else {
    cleared = await clearLoginAttempts(env);
  }

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'admin.reset_login_attempts',
    entityType: 'login_attempts',
    entityId: scope === 'ip' ? ipRaw : 'all',
    meta: { scope, deleted: cleared.deleted, ip: ipRaw || null },
    ip: clientIp(request)
  });

  const stats = await countLoginAttempts(env);
  return json({
    ok: true,
    scope,
    deleted: cleared.deleted,
    remaining: stats.total,
    distinct_ips: stats.distinct_ips
  });
}
