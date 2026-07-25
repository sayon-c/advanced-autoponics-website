import { json } from '../../../_lib/http.js';
import { requireAdmin } from '../../../_lib/auth.js';

/** Lightweight admin auth ping — verifies Bearer / X-Admin-Secret. */
export async function onRequestGet({ request, env }) {
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;
  return json({ ok: true });
}
