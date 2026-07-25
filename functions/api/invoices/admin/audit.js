import { json, clean } from '../../../_lib/http.js';
import { requireAdmin, requireDb } from '../../../_lib/auth.js';
import { listAudit, clearAuditLog } from '../../../_lib/audit.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || 50);
  const entityType = clean(url.searchParams.get('entity_type'), 64) || null;
  const entityId = clean(url.searchParams.get('entity_id'), 80) || null;
  const clientId = clean(url.searchParams.get('client_id'), 64) || null;
  const viewsOnly =
    url.searchParams.get('views') === '1' ||
    url.searchParams.get('views') === 'true';

  const events = await listAudit(env, {
    limit,
    entityType,
    entityId,
    clientId,
    viewsOnly
  });
  return json({ ok: true, events });
}

/** DELETE — wipe audit_log (confirm in UI). Leaves one marker row by default. */
export async function onRequestDelete({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const result = await clearAuditLog(env, { request, writeMarker: true });
  return json({
    ok: true,
    deleted: result.deleted,
    note: 'Audit log cleared. A single admin.clear_audit_log marker was written.'
  });
}
