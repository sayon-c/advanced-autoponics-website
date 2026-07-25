import { json } from '../../../_lib/http.js';
import { requireAdmin, requireDb } from '../../../_lib/auth.js';
import { normalizeAch, parseAch } from '../../../_lib/invoices.js';
import { writeAudit } from '../../../_lib/audit.js';

const ACH_DEFAULT_KEY = 'ach_default';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const row = await env.DB.prepare(
    'SELECT value FROM billing_settings WHERE key = ?'
  )
    .bind(ACH_DEFAULT_KEY)
    .first();

  return json({
    ok: true,
    ach_default: parseAch(row?.value) || null
  });
}

export async function onRequestPut({ request, env }) {
  return onRequestPatch({ request, env });
}

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

  if (!Object.prototype.hasOwnProperty.call(body || {}, 'ach_default')) {
    return json({ error: 'ach_default is required.' }, 400);
  }

  const ach =
    body.ach_default === null ? null : normalizeAch(body.ach_default);
  const now = new Date().toISOString();

  if (ach) {
    await env.DB.prepare(
      `INSERT INTO billing_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
      .bind(ACH_DEFAULT_KEY, JSON.stringify(ach), now)
      .run();
  } else {
    await env.DB.prepare('DELETE FROM billing_settings WHERE key = ?')
      .bind(ACH_DEFAULT_KEY)
      .run();
  }

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'settings.ach_default',
    entityType: 'settings',
    entityId: ACH_DEFAULT_KEY,
    meta: { cleared: !ach }
  });

  return json({ ok: true, ach_default: ach });
}
