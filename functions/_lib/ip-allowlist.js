import { clientIp, json } from './http.js';

/**
 * Parse ADMIN_IP_ALLOWLIST (comma-separated IPs / CIDRs).
 * Empty / unset → no restriction.
 * Skipped when ENVIRONMENT=dev (local wrangler pages dev).
 */
export function parseAllowlist(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const entries = String(raw)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return entries.length ? entries : null;
}

export function shouldEnforceAdminIpAllowlist(env) {
  const envName = String(env?.ENVIRONMENT || '').toLowerCase();
  if (envName === 'dev' || envName === 'development' || envName === 'local') {
    return false;
  }
  return Boolean(parseAllowlist(env?.ADMIN_IP_ALLOWLIST));
}

function ipv4ToInt(ip) {
  const parts = String(ip).split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v < 0 || v > 255) return null;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

function matchCidrOrIp(ip, entry) {
  const target = String(ip || '').trim();
  const rule = String(entry || '').trim();
  if (!target || !rule || target === 'unknown') return false;

  // Exact match (IPv4 or IPv6)
  if (target === rule) return true;

  if (rule.includes('/')) {
    const [base, bitsRaw] = rule.split('/');
    const bits = Number(bitsRaw);
    const tip = ipv4ToInt(target);
    const bip = ipv4ToInt(base);
    if (tip == null || bip == null || !Number.isInteger(bits) || bits < 0 || bits > 32) {
      return false;
    }
    if (bits === 0) return true;
    const mask = bits === 32 ? 0xffffffff : (~((1 << (32 - bits)) - 1)) >>> 0;
    return (tip & mask) === (bip & mask);
  }

  return false;
}

export function ipAllowed(ip, allowlist) {
  if (!allowlist || !allowlist.length) return true;
  return allowlist.some((entry) => matchCidrOrIp(ip, entry));
}

/**
 * @returns {{ ok: true } | { error: Response }}
 */
export function requireAdminIp(request, env) {
  if (!shouldEnforceAdminIpAllowlist(env)) return { ok: true };
  const allowlist = parseAllowlist(env.ADMIN_IP_ALLOWLIST);
  const ip = clientIp(request);
  if (ipAllowed(ip, allowlist)) return { ok: true };
  return { error: json({ error: 'Forbidden.', code: 'ip_not_allowed' }, 403) };
}

export function isAdminHtmlPath(pathname) {
  const p = String(pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  return (
    p === '/admin-invoices' ||
    p === '/admin-invoices.html' ||
    p === '/aa-billing-desk' ||
    p === '/aa-billing-desk.html' ||
    p === '/admin' ||
    p.startsWith('/admin/')
  );
}

export function isAdminApiPath(pathname) {
  const p = String(pathname || '');
  return p.startsWith('/api/invoices/admin') || p.startsWith('/api/analytics/summary');
}
