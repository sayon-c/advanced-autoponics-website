import { json, clean } from '../../_lib/http.js';
import { requireDb, requireSession } from '../../_lib/auth.js';
import {
  publicInvoice,
  normalizeStatus,
  nextStatusOnClientView
} from '../../_lib/invoices.js';
import { writeAudit } from '../../_lib/audit.js';

export async function onRequestGet({ request, env, params }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;

  const auth = await requireSession(request, env);
  if (auth.error) return auth.error;

  const id = clean(params?.id, 80);
  if (!id) return json({ error: 'Not found.' }, 404);

  const url = new URL(request.url);
  const revealAch =
    url.searchParams.get('reveal_ach') === '1' ||
    url.searchParams.get('reveal_ach') === 'true';

  // Strict isolation: invoice must belong to the session client.
  const row = await env.DB.prepare(
    `SELECT id, client_id, number, issue_date, due_date, status, currency,
            line_items, subtotal_cents, tax_cents, total_cents, notes, ach_json, created_at,
            first_viewed_at, last_viewed_at, view_count, paid_date, sent_at
     FROM invoices
     WHERE id = ? AND client_id = ?`
  )
    .bind(id, auth.session.clientId)
    .first();

  if (!row) {
    return json({ error: 'Not found.' }, 404);
  }

  const now = new Date().toISOString();
  const wasFirstView = !row.first_viewed_at;
  const currentStatus = normalizeStatus(row.status, 'sent');
  const nextStatus = nextStatusOnClientView(currentStatus);

  // Count client portal views only (this endpoint is session-authenticated).
  if (nextStatus !== currentStatus) {
    await env.DB.prepare(
      `UPDATE invoices
       SET first_viewed_at = COALESCE(first_viewed_at, ?),
           last_viewed_at = ?,
           view_count = COALESCE(view_count, 0) + 1,
           status = ?
       WHERE id = ? AND client_id = ?`
    )
      .bind(now, now, nextStatus, id, auth.session.clientId)
      .run();
    row.status = nextStatus;
  } else {
    await env.DB.prepare(
      `UPDATE invoices
       SET first_viewed_at = COALESCE(first_viewed_at, ?),
           last_viewed_at = ?,
           view_count = COALESCE(view_count, 0) + 1
       WHERE id = ? AND client_id = ?`
    )
      .bind(now, now, id, auth.session.clientId)
      .run();
  }

  if (!row.first_viewed_at) row.first_viewed_at = now;
  row.last_viewed_at = now;
  row.view_count = Number(row.view_count || 0) + 1;

  await writeAudit(env, {
    request,
    actor: `client:${auth.session.clientId}`,
    action: wasFirstView ? 'invoice.first_view' : 'invoice.view',
    entityType: 'invoice',
    entityId: id,
    meta: { number: row.number, status: row.status }
  });

  return json({
    ok: true,
    client: {
      id: auth.session.clientId,
      name: auth.session.clientName
    },
    invoice: publicInvoice(row, {
      detail: true,
      maskAch: true,
      revealAch
    })
  });
}
