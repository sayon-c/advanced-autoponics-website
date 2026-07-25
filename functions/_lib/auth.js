import { verifySession } from './crypto.js';
import { parseCookies, json } from './http.js';
import { requireAdminIp } from './ip-allowlist.js';

export const SESSION_COOKIE = 'aa_inv_session';
export const SESSION_TTL_SEC = 60 * 60 * 8; // 8 hours

export async function requireSession(request, env) {
  if (!env.SESSION_SECRET) {
    return { error: json({ error: 'Session signing is not configured.' }, 503) };
  }
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const token = cookies[SESSION_COOKIE];
  const payload = await verifySession(token, env.SESSION_SECRET);
  if (!payload?.cid) {
    return { error: json({ error: 'Authentication required.' }, 401) };
  }
  return {
    session: {
      clientId: String(payload.cid),
      clientName: payload.name ? String(payload.name) : null
    }
  };
}

export function requireAdmin(request, env) {
  const ipCheck = requireAdminIp(request, env);
  if (ipCheck.error) return ipCheck;

  if (!env.ADMIN_SECRET) {
    return { error: json({ error: 'Admin access is not configured.' }, 503) };
  }
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const alt = request.headers.get('X-Admin-Secret') || '';
  const provided = token || alt;
  if (!provided || provided !== env.ADMIN_SECRET) {
    return { error: json({ error: 'Unauthorized.' }, 401) };
  }
  return { ok: true, actor: 'admin' };
}

export function requireDb(env) {
  if (!env.DB) {
    return { error: json({ error: 'Invoice database is not bound.' }, 503) };
  }
  return { ok: true };
}
