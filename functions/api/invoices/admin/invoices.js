import { newId } from '../../../_lib/crypto.js';
import { json, clean } from '../../../_lib/http.js';
import { requireAdmin, requireDb } from '../../../_lib/auth.js';
import { writeAudit, listAudit, invoiceTimeline } from '../../../_lib/audit.js';
import {
  invoiceEmailContent,
  sendInvoiceEmail,
  emailConfigured
} from '../../../_lib/email.js';
import {
  normalizeLineItems,
  normalizeComments,
  normalizeAch,
  normalizeStatus,
  totalsFromItems,
  publicInvoice,
  viewStatus,
  clientPortalInvoiceUrl
} from '../../../_lib/invoices.js';

const INVOICE_DETAIL_COLS = `id, client_id, number, issue_date, due_date, status, currency,
              line_items, subtotal_cents, tax_cents, total_cents, notes, ach_json, created_at,
              first_viewed_at, last_viewed_at, view_count, paid_date, sent_at`;

export async function onRequestOptions() {
  return json({ ok: true });
}

async function fetchInvoiceRow(env, id) {
  return env.DB.prepare(`SELECT ${INVOICE_DETAIL_COLS} FROM invoices WHERE id = ?`)
    .bind(id)
    .first();
}

async function invoiceWithExtras(env, row) {
  const auditRows = await listAudit(env, {
    limit: 40,
    entityType: 'invoice',
    entityId: row.id
  });
  return {
    ...publicInvoice(row, { detail: true, includeViews: true }),
    client_id: row.client_id,
    client_link: clientPortalInvoiceUrl(row.id),
    timeline: invoiceTimeline(row, auditRows),
    email_ready: emailConfigured(env)
  };
}

export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const url = new URL(request.url);
  const clientId = clean(url.searchParams.get('client_id'), 64);
  const id = clean(url.searchParams.get('id'), 64);

  if (id) {
    const row = await fetchInvoiceRow(env, id);
    if (!row) return json({ error: 'Not found.' }, 404);
    return json({ ok: true, invoice: await invoiceWithExtras(env, row) });
  }

  const q = clean(url.searchParams.get('q'), 120).toLowerCase();
  const status = clean(url.searchParams.get('status'), 32).toLowerCase();
  const viewed = clean(url.searchParams.get('viewed'), 16).toLowerCase();
  const from = clean(url.searchParams.get('from'), 32);
  const to = clean(url.searchParams.get('to'), 32);

  let sql = `SELECT i.id, i.client_id, i.number, i.issue_date, i.due_date, i.status, i.currency,
              i.subtotal_cents, i.tax_cents, i.total_cents, i.notes,
              i.first_viewed_at, i.last_viewed_at, i.view_count, i.paid_date, i.sent_at,
              c.name AS client_name
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       WHERE 1=1`;
  const binds = [];

  if (clientId) {
    sql += ' AND i.client_id = ?';
    binds.push(clientId);
  }
  if (status && status !== 'all') {
    const norm = normalizeStatus(status, status);
    sql += ' AND lower(i.status) = ?';
    binds.push(norm);
  }
  if (viewed === 'yes' || viewed === 'viewed') {
    sql += ' AND (i.first_viewed_at IS NOT NULL OR COALESCE(i.view_count, 0) > 0)';
  } else if (viewed === 'no' || viewed === 'unviewed') {
    sql += ' AND i.first_viewed_at IS NULL AND COALESCE(i.view_count, 0) = 0';
  }
  if (from) {
    sql += ' AND i.issue_date >= ?';
    binds.push(from);
  }
  if (to) {
    sql += ' AND i.issue_date <= ?';
    binds.push(to);
  }
  if (q) {
    sql += ' AND (lower(i.number) LIKE ? OR lower(COALESCE(c.name, \'\')) LIKE ? OR lower(i.client_id) LIKE ?)';
    const like = `%${q}%`;
    binds.push(like, like, like);
  }

  sql += ' ORDER BY i.issue_date DESC, i.number DESC LIMIT 200';

  const stmt = binds.length
    ? env.DB.prepare(sql).bind(...binds)
    : env.DB.prepare(sql);
  const { results } = await stmt.all();

  return json({
    ok: true,
    email_configured: emailConfigured(env),
    invoices: (results || []).map((row) => ({
      ...publicInvoice(row, { includeViews: true }),
      client_id: row.client_id,
      client_name: row.client_name || null,
      comments: row.notes || null,
      client_link: clientPortalInvoiceUrl(row.id),
      ...viewStatus(row)
    }))
  });
}

export async function onRequestPost({ request, env }) {
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

  const action = clean(body?.action, 40).toLowerCase();

  if (action === 'duplicate' || body?.duplicate_from) {
    return duplicateInvoice(request, env, body);
  }
  if (action === 'mark_sent') {
    return markSent(request, env, body);
  }
  if (action === 'mark_paid') {
    return markPaid(request, env, body);
  }
  if (action === 'email' || action === 'send_email') {
    return emailInvoice(request, env, body);
  }

  return createInvoice(request, env, body);
}

async function createInvoice(request, env, body) {
  const clientId = clean(body?.client_id, 64);
  const number = clean(body?.number, 64);
  const issueDate = clean(body?.issue_date, 32);
  const dueDate = clean(body?.due_date, 32) || null;
  const status = normalizeStatus(body?.status, 'draft');
  const currency = clean(body?.currency, 8) || 'USD';
  const comments = normalizeComments(body);
  const ach =
    body?.ach === undefined ? null : normalizeAch(body.ach === null ? null : body.ach);
  const lineItems = normalizeLineItems(body?.line_items);
  const totals = totalsFromItems(lineItems, body?.tax_cents);
  const paidDate =
    status === 'paid'
      ? clean(body?.paid_date, 32) || new Date().toISOString().slice(0, 10)
      : null;
  const sentAt =
    status === 'sent' || status === 'viewed' || status === 'paid'
      ? new Date().toISOString()
      : null;

  if (!clientId || !number || !issueDate) {
    return json({ error: 'client_id, number, and issue_date are required.' }, 400);
  }
  if (!lineItems.length) {
    return json({ error: 'At least one line item is required.' }, 400);
  }

  const client = await env.DB.prepare('SELECT id FROM clients WHERE id = ?')
    .bind(clientId)
    .first();
  if (!client) return json({ error: 'Client not found.' }, 404);

  const id = clean(body?.id, 64) || newId('inv');

  try {
    await env.DB.prepare(
      `INSERT INTO invoices (
         id, client_id, number, issue_date, due_date, status, currency,
         line_items, subtotal_cents, tax_cents, total_cents, notes, ach_json,
         paid_date, sent_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        clientId,
        number,
        issueDate,
        dueDate,
        status,
        currency,
        JSON.stringify(lineItems),
        totals.subtotal_cents,
        totals.tax_cents,
        totals.total_cents,
        comments,
        ach ? JSON.stringify(ach) : null,
        paidDate,
        sentAt
      )
      .run();
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('UNIQUE')) {
      return json({ error: 'Invoice number already exists for this client.' }, 409);
    }
    return json({ error: 'Failed to create invoice.' }, 500);
  }

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'invoice.create',
    entityType: 'invoice',
    entityId: id,
    meta: { number, client_id: clientId, status }
  });

  const row = await fetchInvoiceRow(env, id);
  return json({ ok: true, invoice: await invoiceWithExtras(env, row) }, 201);
}

async function duplicateInvoice(request, env, body) {
  const sourceId = clean(body?.duplicate_from || body?.id, 64);
  if (!sourceId) return json({ error: 'duplicate_from is required.' }, 400);

  const source = await fetchInvoiceRow(env, sourceId);
  if (!source) return json({ error: 'Source invoice not found.' }, 404);

  const newNumber =
    clean(body?.number, 64) || `${clean(source.number, 50)}-COPY`.slice(0, 64);
  const id = newId('inv');
  const issueDate =
    clean(body?.issue_date, 32) || new Date().toISOString().slice(0, 10);

  try {
    await env.DB.prepare(
      `INSERT INTO invoices (
         id, client_id, number, issue_date, due_date, status, currency,
         line_items, subtotal_cents, tax_cents, total_cents, notes, ach_json,
         paid_date, sent_at
       ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
    )
      .bind(
        id,
        source.client_id,
        newNumber,
        issueDate,
        source.due_date || null,
        source.currency || 'USD',
        source.line_items,
        source.subtotal_cents,
        source.tax_cents,
        source.total_cents,
        source.notes,
        source.ach_json
      )
      .run();
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('UNIQUE')) {
      return json(
        { error: 'Invoice number already exists for this client. Choose another number.' },
        409
      );
    }
    return json({ error: 'Failed to duplicate invoice.' }, 500);
  }

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'invoice.duplicate',
    entityType: 'invoice',
    entityId: id,
    meta: { from: sourceId, number: newNumber }
  });

  const row = await fetchInvoiceRow(env, id);
  return json({ ok: true, invoice: await invoiceWithExtras(env, row) }, 201);
}

async function markSent(request, env, body) {
  const id = clean(body?.id, 64);
  if (!id) return json({ error: 'id is required.' }, 400);
  const row = await fetchInvoiceRow(env, id);
  if (!row) return json({ error: 'Not found.' }, 404);

  const current = normalizeStatus(row.status, 'draft');
  if (current === 'paid') {
    return json({ error: 'Paid invoices cannot be marked sent.' }, 400);
  }
  if (current === 'void') {
    return json({ error: 'Void invoices cannot be marked sent.' }, 400);
  }

  const now = new Date().toISOString();
  const next = current === 'viewed' ? 'viewed' : 'sent';
  await env.DB.prepare(
    `UPDATE invoices
     SET status = ?, sent_at = COALESCE(sent_at, ?)
     WHERE id = ?`
  )
    .bind(next, now, id)
    .run();

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'invoice.mark_sent',
    entityType: 'invoice',
    entityId: id,
    meta: { number: row.number, from: current, to: next }
  });

  const updated = await fetchInvoiceRow(env, id);
  return json({ ok: true, invoice: await invoiceWithExtras(env, updated) });
}

async function markPaid(request, env, body) {
  const id = clean(body?.id, 64);
  if (!id) return json({ error: 'id is required.' }, 400);
  const row = await fetchInvoiceRow(env, id);
  if (!row) return json({ error: 'Not found.' }, 404);

  const paidDate =
    clean(body?.paid_date, 32) || new Date().toISOString().slice(0, 10);

  await env.DB.prepare(
    `UPDATE invoices SET status = 'paid', paid_date = ? WHERE id = ?`
  )
    .bind(paidDate, id)
    .run();

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'invoice.mark_paid',
    entityType: 'invoice',
    entityId: id,
    meta: { number: row.number, paid_date: paidDate }
  });

  const updated = await fetchInvoiceRow(env, id);
  return json({ ok: true, invoice: await invoiceWithExtras(env, updated) });
}

async function emailInvoice(request, env, body) {
  const id = clean(body?.id, 64);
  if (!id) return json({ error: 'id is required.' }, 400);
  const row = await fetchInvoiceRow(env, id);
  if (!row) return json({ error: 'Not found.' }, 404);

  const client = await env.DB.prepare('SELECT id, name FROM clients WHERE id = ?')
    .bind(row.client_id)
    .first();

  const to = clean(body?.to || body?.email, 320);
  const content = invoiceEmailContent({
    invoice: row,
    clientName: client?.name,
    toEmail: to
  });

  const result = await sendInvoiceEmail(env, {
    to,
    subject: content.subject,
    body: content.body,
    replyTo: clean(env.INVOICE_REPLY_TO, 320) || 'billing@advancedautoponics.com'
  });

  if (result.mode === 'mailto' || !result.sent) {
    if (result.error) {
      return json(
        {
          ok: false,
          error: result.error,
          mode: 'mailto',
          email: content
        },
        400
      );
    }
    return json({
      ok: true,
      mode: 'mailto',
      email: content,
      note: 'RESEND_API_KEY not set — open the mailto link or copy the body.'
    });
  }

  const now = new Date().toISOString();
  const current = normalizeStatus(row.status, 'draft');
  if (current === 'draft') {
    await env.DB.prepare(
      `UPDATE invoices
       SET status = 'sent', sent_at = COALESCE(sent_at, ?)
       WHERE id = ? AND lower(status) = 'draft'`
    )
      .bind(now, id)
      .run();
  } else if (!row.sent_at) {
    await env.DB.prepare(
      `UPDATE invoices SET sent_at = COALESCE(sent_at, ?) WHERE id = ?`
    )
      .bind(now, id)
      .run();
  }

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'invoice.send_email',
    entityType: 'invoice',
    entityId: id,
    meta: { number: row.number, to, provider_id: result.id || null }
  });

  const updated = await fetchInvoiceRow(env, id);
  return json({
    ok: true,
    mode: 'resend',
    sent: true,
    provider_id: result.id || null,
    email: content,
    invoice: await invoiceWithExtras(env, updated)
  });
}

export async function onRequestPut(context) {
  return onRequestPatch(context);
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

  const action = clean(body?.action, 40).toLowerCase();
  if (action === 'mark_sent') return markSent(request, env, body);
  if (action === 'mark_paid') return markPaid(request, env, body);
  if (action === 'email' || action === 'send_email') {
    return emailInvoice(request, env, body);
  }
  if (action === 'duplicate') return duplicateInvoice(request, env, body);

  const id = clean(body?.id, 64);
  if (!id) return json({ error: 'id is required.' }, 400);

  const existing = await fetchInvoiceRow(env, id);
  if (!existing) return json({ error: 'Not found.' }, 404);

  const clientId = clean(body?.client_id, 64) || undefined;
  if (clientId) {
    const client = await env.DB.prepare('SELECT id FROM clients WHERE id = ?')
      .bind(clientId)
      .first();
    if (!client) return json({ error: 'Client not found.' }, 404);
  }

  const number = clean(body?.number, 64);
  const issueDate = clean(body?.issue_date, 32);
  const dueDate =
    body?.due_date === null ? null : clean(body?.due_date, 32) || undefined;
  const statusRaw = clean(body?.status, 32);
  const status = statusRaw ? normalizeStatus(statusRaw, statusRaw) : undefined;
  const currency = clean(body?.currency, 8) || undefined;
  const hasComments =
    body?.comments !== undefined ||
    body?.notes !== undefined ||
    body?.info !== undefined;
  const comments = hasComments ? normalizeComments(body) : undefined;
  const hasAchField = Object.prototype.hasOwnProperty.call(body || {}, 'ach');
  const ach = hasAchField
    ? body.ach === null
      ? null
      : normalizeAch(body.ach)
    : undefined;
  const hasLines = Array.isArray(body?.line_items);
  const lineItems = hasLines ? normalizeLineItems(body.line_items) : undefined;
  if (hasLines && !lineItems.length) {
    return json({ error: 'At least one line item is required.' }, 400);
  }

  const paidDate =
    body?.paid_date === null
      ? null
      : clean(body?.paid_date, 32) || undefined;

  const sets = [];
  const binds = [];
  if (clientId) {
    sets.push('client_id = ?');
    binds.push(clientId);
  }
  if (number) {
    sets.push('number = ?');
    binds.push(number);
  }
  if (issueDate) {
    sets.push('issue_date = ?');
    binds.push(issueDate);
  }
  if (dueDate !== undefined) {
    sets.push('due_date = ?');
    binds.push(dueDate);
  }
  if (status) {
    sets.push('status = ?');
    binds.push(status);
    if (status === 'sent' || status === 'viewed') {
      sets.push('sent_at = COALESCE(sent_at, ?)');
      binds.push(new Date().toISOString());
    }
    if (status === 'paid') {
      sets.push('paid_date = COALESCE(?, paid_date, ?)');
      binds.push(paidDate || null, new Date().toISOString().slice(0, 10));
    }
  }
  if (paidDate !== undefined && !status) {
    sets.push('paid_date = ?');
    binds.push(paidDate);
  }
  if (currency) {
    sets.push('currency = ?');
    binds.push(currency);
  }
  if (hasComments) {
    sets.push('notes = ?');
    binds.push(comments);
  }
  if (hasAchField) {
    sets.push('ach_json = ?');
    binds.push(ach ? JSON.stringify(ach) : null);
  }
  if (hasLines) {
    const t = totalsFromItems(lineItems, body?.tax_cents);
    sets.push('line_items = ?');
    binds.push(JSON.stringify(lineItems));
    sets.push('subtotal_cents = ?');
    binds.push(t.subtotal_cents);
    sets.push('tax_cents = ?');
    binds.push(t.tax_cents);
    sets.push('total_cents = ?');
    binds.push(t.total_cents);
  } else if (body?.tax_cents !== undefined) {
    const tax = Math.round(Number(body.tax_cents) || 0);
    sets.push('tax_cents = ?');
    binds.push(tax);
    sets.push('total_cents = ?');
    binds.push(Number(existing.subtotal_cents || 0) + tax);
  }

  if (!sets.length) {
    return json({ error: 'No fields to update.' }, 400);
  }

  binds.push(id);
  try {
    await env.DB.prepare(`UPDATE invoices SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...binds)
      .run();
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('UNIQUE')) {
      return json({ error: 'Invoice number already exists for this client.' }, 409);
    }
    return json({ error: 'Failed to update invoice.' }, 500);
  }

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'invoice.edit',
    entityType: 'invoice',
    entityId: id,
    meta: {
      number: number || existing.number,
      status: status || existing.status,
      fields: sets.map((s) => s.split('=')[0].trim())
    }
  });

  const row = await fetchInvoiceRow(env, id);
  return json({ ok: true, invoice: await invoiceWithExtras(env, row) });
}

export async function onRequestDelete({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const url = new URL(request.url);
  let id = clean(url.searchParams.get('id'), 64);
  if (!id) {
    try {
      const body = await request.json();
      id = clean(body?.id, 64);
    } catch {
      /* no body */
    }
  }
  if (!id) return json({ error: 'id is required.' }, 400);

  const existing = await env.DB.prepare(
    'SELECT id, number, client_id FROM invoices WHERE id = ?'
  )
    .bind(id)
    .first();
  if (!existing) return json({ error: 'Not found.' }, 404);

  try {
    await env.DB.prepare('DELETE FROM invoices WHERE id = ?').bind(id).run();
  } catch {
    return json({ error: 'Failed to delete invoice.' }, 500);
  }

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'invoice.delete',
    entityType: 'invoice',
    entityId: id,
    meta: { number: existing.number, client_id: existing.client_id }
  });

  return json({ ok: true, deleted: { id: existing.id, number: existing.number } });
}
