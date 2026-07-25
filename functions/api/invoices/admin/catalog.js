import { json } from '../../../_lib/http.js';
import { requireAdmin } from '../../../_lib/auth.js';
import { BILLING_SELECTIONS } from '../../../_lib/billing-catalog.js';

export async function onRequestGet({ request, env }) {
  const admin = requireAdmin(request, env);
  if (admin.error) return admin.error;
  return json({ ok: true, selections: BILLING_SELECTIONS });
}
