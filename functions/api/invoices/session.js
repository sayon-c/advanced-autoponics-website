import { json } from '../../_lib/http.js';
import { requireDb, requireSession } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;

  const auth = await requireSession(request, env);
  if (auth.error) return auth.error;

  const client = await env.DB.prepare(
    'SELECT id, name FROM clients WHERE id = ?'
  )
    .bind(auth.session.clientId)
    .first();

  if (!client) {
    return json({ error: 'Authentication required.' }, 401);
  }

  return json({
    ok: true,
    client: { id: client.id, name: client.name }
  });
}
