import { json, clean } from '../../../_lib/http.js';
import { requireAdmin, requireDb } from '../../../_lib/auth.js';
import { listClientViews, clearClientViews } from '../../../_lib/audit.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

/**
 * GET /api/invoices/admin/views?client_id=&limit=
 * Invoice portal view stats: client, invoice number, first/last viewed, count.
 */
export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const url = new URL(request.url);
  const clientId = clean(url.searchParams.get('client_id'), 64) || null;
  const limit = Number(url.searchParams.get('limit') || 100);

  const views = await listClientViews(env, { clientId, limit });
  return json({ ok: true, views });
}

/**
 * DELETE /api/invoices/admin/views?client_id=
 * POST /api/invoices/admin/views  body: { client_id?, clear_audit_views? }
 * Reset portal view stats (optionally scoped to one client). Confirm in UI.
 */
async function clearViewsHandler({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const url = new URL(request.url);
  let clientId = clean(url.searchParams.get('client_id'), 64) || null;
  let clearAuditViews = true;

  if (request.method === 'POST' || request.method === 'DELETE') {
    try {
      const body = await request.json();
      if (body && typeof body === 'object') {
        if (!clientId) clientId = clean(body.client_id, 64) || null;
        if (body.clear_audit_views === false || body.clear_audit_views === 0) {
          clearAuditViews = false;
        }
      }
    } catch {
      /* no body */
    }
  }

  if (clientId) {
    const client = await env.DB.prepare('SELECT id FROM clients WHERE id = ?')
      .bind(clientId)
      .first();
    if (!client) return json({ error: 'Client not found.' }, 404);
  }

  const result = await clearClientViews(env, {
    request,
    clientId,
    clearAuditViews,
    writeMarker: true
  });

  const scope = clientId ? 'for that client' : 'across all invoices';
  return json({
    ok: true,
    reset: result.reset,
    audit_deleted: result.auditDeleted,
    client_id: clientId,
    note: `Client views cleared ${scope}. Invoices show as Unviewed again.`
  });
}

export async function onRequestDelete(ctx) {
  return clearViewsHandler(ctx);
}

export async function onRequestPost(ctx) {
  return clearViewsHandler(ctx);
}
