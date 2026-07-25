import { json } from '../../_lib/http.js';
import { requireDb, requireSession } from '../../_lib/auth.js';
import { publicInvoice } from '../../_lib/invoices.js';

export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;

  const auth = await requireSession(request, env);
  if (auth.error) return auth.error;

  const { results } = await env.DB.prepare(
    `SELECT id, number, issue_date, due_date, status, currency,
            subtotal_cents, tax_cents, total_cents
     FROM invoices
     WHERE client_id = ?
     ORDER BY issue_date DESC, number DESC`
  )
    .bind(auth.session.clientId)
    .all();

  return json({
    ok: true,
    client: {
      id: auth.session.clientId,
      name: auth.session.clientName
    },
    invoices: (results || []).map((row) => publicInvoice(row))
  });
}
