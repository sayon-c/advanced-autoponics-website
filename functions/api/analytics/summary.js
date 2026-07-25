import { json, clean } from '../../_lib/http.js';
import { requireAdmin, requireDb } from '../../_lib/auth.js';
import { analyticsSummary } from '../../_lib/analytics.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

/**
 * GET /api/analytics/summary?range=7d|30d
 * Admin-only site visitor metrics (ADMIN_SECRET).
 */
export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;

  const url = new URL(request.url);
  const range = clean(url.searchParams.get('range'), 8) || '7d';
  const summary = await analyticsSummary(env, { range });
  return json({ ok: true, ...summary });
}
