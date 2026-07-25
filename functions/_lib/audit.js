import { newId } from './crypto.js';
import { clientIp, clean } from './http.js';

/**
 * Append an audit_log row. Failures are swallowed so business ops still succeed.
 */
export async function writeAudit(env, {
  request,
  actor,
  action,
  entityType = null,
  entityId = null,
  meta = null,
  ip = null
} = {}) {
  if (!env?.DB) return;
  try {
    const id = newId('aud');
    const at = new Date().toISOString();
    const actorSafe = clean(actor || 'unknown', 120) || 'unknown';
    const actionSafe = clean(action || 'unknown', 120) || 'unknown';
    const entityTypeSafe = entityType ? clean(entityType, 64) : null;
    const entityIdSafe = entityId ? clean(entityId, 80) : null;
    let metaJson = null;
    if (meta != null) {
      try {
        metaJson = JSON.stringify(meta).slice(0, 4000);
      } catch {
        metaJson = null;
      }
    }
    const ipSafe = clean(ip || (request ? clientIp(request) : '') || '', 80) || null;
    await env.DB.prepare(
      `INSERT INTO audit_log (id, at, actor, action, entity_type, entity_id, meta_json, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, at, actorSafe, actionSafe, entityTypeSafe, entityIdSafe, metaJson, ipSafe)
      .run();
  } catch {
    /* ignore audit write failures */
  }
}

export async function listAudit(
  env,
  {
    limit = 50,
    entityType = null,
    entityId = null,
    clientId = null,
    viewsOnly = false
  } = {}
) {
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const clauses = [];
  const binds = [];

  if (entityType && entityId) {
    clauses.push('entity_type = ? AND entity_id = ?');
    binds.push(entityType, entityId);
  }
  if (clientId) {
    clauses.push(
      `(actor = ? OR (entity_type = 'client' AND entity_id = ?) OR (entity_type = 'invoice' AND entity_id IN (SELECT id FROM invoices WHERE client_id = ?)))`
    );
    const actor = `client:${clientId}`;
    binds.push(actor, clientId, clientId);
  }
  if (viewsOnly) {
    clauses.push(`action IN ('invoice.view', 'invoice.first_view')`);
  }

  let sql = `SELECT id, at, actor, action, entity_type, entity_id, meta_json, ip
             FROM audit_log`;
  if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
  sql += ' ORDER BY at DESC LIMIT ?';
  binds.push(lim);

  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return (results || []).map((row) => {
    let meta = null;
    if (row.meta_json) {
      try {
        meta = JSON.parse(row.meta_json);
      } catch {
        meta = null;
      }
    }
    return {
      id: row.id,
      at: row.at,
      actor: row.actor,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      meta,
      ip: row.ip
    };
  });
}

/** Delete all audit_log rows. Optionally writes a single fresh "cleared" event. */
export async function clearAuditLog(env, { request, writeMarker = true } = {}) {
  const before = await env.DB.prepare('SELECT COUNT(*) AS c FROM audit_log').first();
  const deleted = Number(before?.c || 0);
  await env.DB.prepare('DELETE FROM audit_log').run();
  if (writeMarker) {
    await writeAudit(env, {
      request,
      actor: 'admin',
      action: 'admin.clear_audit_log',
      entityType: 'audit_log',
      entityId: 'all',
      meta: { deleted }
    });
  }
  return { deleted };
}

/**
 * Reset portal view stats on invoices (and optionally related audit view events).
 * When status is `viewed`, rolls it back to `sent` so invoices show as Unviewed again.
 */
export async function clearClientViews(
  env,
  {
    request,
    clientId = null,
    clearAuditViews = true,
    writeMarker = true
  } = {}
) {
  const whereViewed =
    `(first_viewed_at IS NOT NULL OR COALESCE(view_count, 0) > 0 OR status = 'viewed')`;
  const clientFilter = clientId ? ' AND client_id = ?' : '';

  const countSql = `SELECT COUNT(*) AS c FROM invoices WHERE ${whereViewed}${clientFilter}`;
  const countStmt = clientId
    ? env.DB.prepare(countSql).bind(clientId)
    : env.DB.prepare(countSql);
  const before = await countStmt.first();
  const reset = Number(before?.c || 0);

  const updateSql = `UPDATE invoices
     SET first_viewed_at = NULL,
         last_viewed_at = NULL,
         view_count = 0,
         status = CASE WHEN status = 'viewed' THEN 'sent' ELSE status END
     WHERE ${whereViewed}${clientFilter}`;
  const updateStmt = clientId
    ? env.DB.prepare(updateSql).bind(clientId)
    : env.DB.prepare(updateSql);
  await updateStmt.run();

  let auditDeleted = 0;
  if (clearAuditViews) {
    if (clientId) {
      const audBefore = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM audit_log
         WHERE action IN ('invoice.view', 'invoice.first_view')
           AND (
             actor = ?
             OR (entity_type = 'invoice' AND entity_id IN (SELECT id FROM invoices WHERE client_id = ?))
           )`
      )
        .bind(`client:${clientId}`, clientId)
        .first();
      auditDeleted = Number(audBefore?.c || 0);
      await env.DB.prepare(
        `DELETE FROM audit_log
         WHERE action IN ('invoice.view', 'invoice.first_view')
           AND (
             actor = ?
             OR (entity_type = 'invoice' AND entity_id IN (SELECT id FROM invoices WHERE client_id = ?))
           )`
      )
        .bind(`client:${clientId}`, clientId)
        .run();
    } else {
      const audBefore = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM audit_log
         WHERE action IN ('invoice.view', 'invoice.first_view')`
      ).first();
      auditDeleted = Number(audBefore?.c || 0);
      await env.DB.prepare(
        `DELETE FROM audit_log
         WHERE action IN ('invoice.view', 'invoice.first_view')`
      ).run();
    }
  }

  if (writeMarker) {
    await writeAudit(env, {
      request,
      actor: 'admin',
      action: 'admin.clear_client_views',
      entityType: clientId ? 'client' : 'invoice',
      entityId: clientId || 'all',
      meta: { reset, audit_deleted: auditDeleted, client_id: clientId || null }
    });
  }

  return { reset, auditDeleted };
}

/** Invoice portal view stats joined with client (for admin Client views table). */
export async function listClientViews(env, { clientId = null, limit = 100 } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 100, 1), 300);
  let stmt;
  if (clientId) {
    stmt = env.DB.prepare(
      `SELECT i.id, i.number, i.status, i.first_viewed_at, i.last_viewed_at,
              COALESCE(i.view_count, 0) AS view_count,
              c.id AS client_id, c.name AS client_name
       FROM invoices i
       JOIN clients c ON c.id = i.client_id
       WHERE i.client_id = ?
         AND (i.first_viewed_at IS NOT NULL OR COALESCE(i.view_count, 0) > 0)
       ORDER BY COALESCE(i.last_viewed_at, i.first_viewed_at, '') DESC
       LIMIT ?`
    ).bind(clientId, lim);
  } else {
    stmt = env.DB.prepare(
      `SELECT i.id, i.number, i.status, i.first_viewed_at, i.last_viewed_at,
              COALESCE(i.view_count, 0) AS view_count,
              c.id AS client_id, c.name AS client_name
       FROM invoices i
       JOIN clients c ON c.id = i.client_id
       WHERE i.first_viewed_at IS NOT NULL OR COALESCE(i.view_count, 0) > 0
       ORDER BY COALESCE(i.last_viewed_at, i.first_viewed_at, '') DESC
       LIMIT ?`
    ).bind(lim);
  }
  const { results } = await stmt.all();
  return (results || []).map((r) => ({
    id: r.id,
    number: r.number,
    status: r.status,
    first_viewed_at: r.first_viewed_at || null,
    last_viewed_at: r.last_viewed_at || null,
    view_count: Number(r.view_count || 0),
    client_id: r.client_id,
    client_name: r.client_name
  }));
}

/** Build a simple activity timeline for an invoice from fields + audit rows. */
export function invoiceTimeline(invoiceRow, auditRows = []) {
  const events = [];
  if (invoiceRow?.created_at) {
    events.push({
      kind: 'created',
      at: invoiceRow.created_at,
      label: 'Created'
    });
  }
  if (invoiceRow?.sent_at) {
    events.push({
      kind: 'sent',
      at: invoiceRow.sent_at,
      label: 'Sent'
    });
  }
  if (invoiceRow?.first_viewed_at) {
    events.push({
      kind: 'viewed',
      at: invoiceRow.first_viewed_at,
      label: 'First viewed'
    });
  }
  if (invoiceRow?.paid_date || String(invoiceRow?.status || '').toLowerCase() === 'paid') {
    events.push({
      kind: 'paid',
      at: invoiceRow.paid_date || invoiceRow.last_viewed_at || invoiceRow.created_at,
      label: 'Paid',
      paid_date: invoiceRow.paid_date || null
    });
  }

  // Fill gaps from audit if field timestamps missing.
  const kinds = new Set(events.map((e) => e.kind));
  for (const row of auditRows) {
    const action = String(row.action || '');
    if (action === 'invoice.create' && !kinds.has('created')) {
      events.push({ kind: 'created', at: row.at, label: 'Created' });
      kinds.add('created');
    }
    if ((action === 'invoice.mark_sent' || action === 'invoice.send_email') && !kinds.has('sent')) {
      events.push({ kind: 'sent', at: row.at, label: 'Sent' });
      kinds.add('sent');
    }
    if ((action === 'invoice.view' || action === 'invoice.first_view') && !kinds.has('viewed')) {
      events.push({ kind: 'viewed', at: row.at, label: 'First viewed' });
      kinds.add('viewed');
    }
    if (action === 'invoice.mark_paid' && !kinds.has('paid')) {
      events.push({
        kind: 'paid',
        at: row.at,
        label: 'Paid',
        paid_date: row.meta?.paid_date || null
      });
      kinds.add('paid');
    }
  }

  events.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
  return events;
}
