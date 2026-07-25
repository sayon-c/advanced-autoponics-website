import {
  hashAccessCode,
  normalizeAccessCode,
  generateAccessCode,
  newId
} from '../../../_lib/crypto.js';
import {
  vaultSecret,
  encryptAccessCode,
  decryptAccessCode
} from '../../../_lib/code-vault.js';
import { json, clean } from '../../../_lib/http.js';
import { requireAdmin, requireDb } from '../../../_lib/auth.js';
import { clearLoginAttempts } from '../../../_lib/rate-limit.js';
import { writeAudit } from '../../../_lib/audit.js';
import { clientWelcomeText } from '../../../_lib/invoices.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

async function storeCodeArtifacts(env, code) {
  const access_code_hash = await hashAccessCode(code);
  const secret = vaultSecret(env);
  const access_code_enc = secret ? await encryptAccessCode(code, secret) : null;
  return { access_code_hash, access_code_enc };
}

async function revealCode(env, enc) {
  if (!enc) return null;
  return decryptAccessCode(enc, vaultSecret(env));
}

export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const { results } = await env.DB.prepare(
    `SELECT c.id, c.name, c.created_at, c.access_code_rotated_at, c.access_code_enc,
            (SELECT COUNT(*) FROM invoices i WHERE i.client_id = c.id) AS invoice_count
     FROM clients c
     ORDER BY c.name COLLATE NOCASE ASC`
  ).all();

  const clients = [];
  for (const c of results || []) {
    const access_code = await revealCode(env, c.access_code_enc);
    clients.push({
      id: c.id,
      name: c.name,
      created_at: c.created_at,
      access_code_rotated_at: c.access_code_rotated_at || null,
      invoice_count: Number(c.invoice_count || 0),
      access_code: access_code || null,
      code_available: Boolean(access_code)
    });
  }

  return json({
    ok: true,
    note: 'Access codes are shown only to authenticated admins (encrypted at rest). Client login APIs never receive plaintext.',
    clients
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

  const name = clean(body?.name, 200);
  let code = normalizeAccessCode(body?.access_code).slice(0, 128);
  if (!name) return json({ error: 'name is required.' }, 400);
  if (!code) code = generateAccessCode();
  if (code.length < 8) {
    return json({ error: 'access_code must be at least 8 characters.' }, 400);
  }

  const id = clean(body?.id, 64) || newId('cli');
  const { access_code_hash, access_code_enc } = await storeCodeArtifacts(env, code);
  const rotatedAt = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO clients (id, name, access_code_hash, access_code_rotated_at, access_code_enc)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(id, name, access_code_hash, rotatedAt, access_code_enc)
      .run();
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('UNIQUE') || msg.includes('PRIMARY')) {
      return json({ error: 'Client id already exists.' }, 409);
    }
    return json({ error: 'Failed to create client.' }, 500);
  }

  await writeAudit(env, {
    request,
    actor: 'admin',
    action: 'client.create',
    entityType: 'client',
    entityId: id,
    meta: { name }
  });

  return json(
    {
      ok: true,
      client: {
        id,
        name,
        access_code_rotated_at: rotatedAt,
        access_code: code,
        code_available: true
      },
      access_code: code,
      once: false,
      welcome_text: clientWelcomeText({ clientName: name, accessCode: code })
    },
    201
  );
}

/**
 * Regenerate or set access code: updates hash + encrypted vault, returns plaintext,
 * clears login rate limit. Body: { id, access_code? } — omit access_code to auto-generate.
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

  const id = clean(body?.id, 64);
  if (!id) return json({ error: 'id is required.' }, 400);

  const client = await env.DB.prepare(
    'SELECT id, name FROM clients WHERE id = ?'
  )
    .bind(id)
    .first();
  if (!client) return json({ error: 'Client not found.' }, 404);

  const provided = body?.access_code != null && String(body.access_code).trim() !== '';
  let code = normalizeAccessCode(body?.access_code).slice(0, 128);
  if (!code) code = generateAccessCode();
  if (code.length < 8) {
    return json({ error: 'access_code must be at least 8 characters.' }, 400);
  }

  const { access_code_hash, access_code_enc } = await storeCodeArtifacts(env, code);
  const rotatedAt = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE clients
     SET access_code_hash = ?, access_code_rotated_at = ?, access_code_enc = ?
     WHERE id = ?`
  )
    .bind(access_code_hash, rotatedAt, access_code_enc, id)
    .run();

  await clearLoginAttempts(env);

  const action = provided ? 'client.set_code' : 'client.regenerate_code';
  await writeAudit(env, {
    request,
    actor: 'admin',
    action,
    entityType: 'client',
    entityId: id,
    meta: { name: client.name, mode: provided ? 'set' : 'regenerate' }
  });

  return json({
    ok: true,
    client: {
      id: client.id,
      name: client.name,
      access_code_rotated_at: rotatedAt,
      access_code: code,
      code_available: true
    },
    access_code: code,
    once: false,
    mode: provided ? 'set' : 'regenerate',
    welcome_text: clientWelcomeText({ clientName: client.name, accessCode: code }),
    note: 'Code updated. It remains visible in admin (encrypted at rest).'
  });
}
