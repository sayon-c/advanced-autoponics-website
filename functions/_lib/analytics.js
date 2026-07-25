import { clientIp, clean, parseCookies } from './http.js';
import { newId } from './crypto.js';

export const VISITOR_COOKIE = 'aa_vid';
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|outbrain|pinterest|vkshare|whatsapp|telegram|discordbot|preview|headless|phantom|selenium|puppeteer|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|monitor|scrapy|curl\/|wget|python-requests|go-http-client|java\/|libwww|httpclient|okhttp|axios\/|node-fetch|cloudflare-health|cf-network/i;

const textEncoder = new TextEncoder();

function toBase64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function isLikelyBot(request) {
  const ua = request.headers.get('User-Agent') || '';
  if (!ua || ua.length < 12) return true;
  if (BOT_UA.test(ua)) return true;
  const purpose = (
    request.headers.get('Sec-Purpose') ||
    request.headers.get('Purpose') ||
    ''
  ).toLowerCase();
  if (purpose.includes('prefetch') || purpose.includes('preview')) return true;
  if (request.headers.get('Sec-Fetch-Dest') === 'serviceworker') return true;
  return false;
}

function isPrivatePath(lower) {
  if (lower.startsWith('/api/')) return true;
  if (lower === '/admin' || lower.startsWith('/admin/') || lower.startsWith('/admin-')) {
    return true;
  }
  if (lower.startsWith('/aa-billing-desk')) return true;
  if (lower.startsWith('/admin-invoices')) return true;
  if (
    lower === '/invoices' ||
    lower.startsWith('/invoices.') ||
    lower.startsWith('/invoices/')
  ) {
    return true;
  }
  return false;
}

/** Normalize path for storage; reject private / invalid paths. */
export function normalizeAnalyticsPath(raw) {
  let path = clean(raw, 500);
  if (!path) return null;
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      path = new URL(path).pathname || '/';
    }
  } catch {
    return null;
  }
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.split('?')[0].split('#')[0];
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  const lower = path.toLowerCase();
  if (isPrivatePath(lower)) return null;
  if (path.includes('..') || path.includes('\\') || /[\x00-\x1f]/.test(path)) return null;
  return path.slice(0, 300) || '/';
}

async function hmacDigest(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(String(secret || 'autoponics')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, textEncoder.encode(String(value)))
  );
  return toBase64Url(sig);
}

export async function hashWithSalt(env, value) {
  const salt = env.SESSION_SECRET || env.ADMIN_SECRET || 'autoponics-analytics';
  return hmacDigest(salt, value);
}

function isHttps(request) {
  const forwarded = request.headers.get('X-Forwarded-Proto');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim().toLowerCase();
    if (first === 'https') return true;
    if (first === 'http') return false;
  }
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return true;
  }
}

function cookieDomain(request) {
  try {
    const host = new URL(request.url).hostname.toLowerCase();
    if (host === 'advancedautoponics.com' || host.endsWith('.advancedautoponics.com')) {
      return 'advancedautoponics.com';
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function visitorCookieHeader(value, request) {
  const parts = [
    `${VISITOR_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${VISITOR_COOKIE_MAX_AGE}`
  ];
  if (isHttps(request)) parts.push('Secure');
  const domain = cookieDomain(request);
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join('; ');
}

/**
 * Durable visitor id: cookie if present, else mint random id (+ Set-Cookie).
 * If Cookie header is sent but our key is missing (blocked / cleared), fall back
 * to a daily HMAC(IP+UA) so uniques stay privacy-safe and don't explode.
 * Returns { visitorId, setCookie }.
 */
export async function resolveVisitorId(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const existing = clean(cookies[VISITOR_COOKIE], 80);
  if (existing && /^[A-Za-z0-9_-]{8,80}$/.test(existing)) {
    return { visitorId: existing, setCookie: null };
  }

  const cookieHeader = request.headers.get('Cookie') || '';
  if (cookieHeader.trim() && !cookieHeader.includes(`${VISITOR_COOKIE}=`)) {
    // Other cookies exist but ours does not — likely blocked; use daily hash.
    const fallback = await dailyVisitorFallback(request, env);
    return { visitorId: fallback, setCookie: null };
  }

  const id = newId('v');
  return { visitorId: id, setCookie: visitorCookieHeader(id, request) };
}

/** Fallback identity when cookies are blocked — daily rotating hash, not stored as IP. */
export async function dailyVisitorFallback(request, env) {
  const ip = clientIp(request);
  const ua = request.headers.get('User-Agent') || '';
  const day = new Date().toISOString().slice(0, 10);
  const digest = await hashWithSalt(env, `vid|${day}|${ip}|${ua}`);
  return `d_${digest.slice(0, 32)}`;
}

export function geoFromRequest(request) {
  const countryRaw =
    request.headers.get('CF-IPCountry') ||
    request.cf?.country ||
    '';
  let country = clean(countryRaw, 8).toUpperCase();
  if (!country || country === 'XX' || country === 'T1') country = '';
  const city = clean(request.cf?.city || '', 80);
  return { country: country || null, city: city || null };
}

export function referrerHost(raw, siteHost) {
  const ref = clean(raw, 500);
  if (!ref) return null;
  try {
    const u = new URL(ref);
    if (siteHost && u.hostname.replace(/^www\./, '') === siteHost.replace(/^www\./, '')) {
      return null; // same-site nav noise
    }
    return clean(u.hostname || ref, 200) || null;
  } catch {
    return clean(ref, 200) || null;
  }
}

export function rangeSince(range) {
  const r = String(range || '7d').toLowerCase();
  const days = r === '30d' ? 30 : 7;
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { range: days === 30 ? '30d' : '7d', since: d.toISOString(), days };
}

export async function recordPageView(env, row) {
  await env.DB.prepare(
    `INSERT INTO page_views (id, at, path, referrer, country, city, visitor_id, ua_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      row.id,
      row.at,
      row.path,
      row.referrer,
      row.country,
      row.city,
      row.visitor_id,
      row.ua_hash
    )
    .run();
}

export async function analyticsSummary(env, { range = '7d' } = {}) {
  const { range: resolved, since } = rangeSince(range);

  const totals = await env.DB.prepare(
    `SELECT COUNT(*) AS pageviews, COUNT(DISTINCT visitor_id) AS uniques
     FROM page_views WHERE at >= ?`
  )
    .bind(since)
    .first();

  const { results: topPaths } = await env.DB.prepare(
    `SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS uniques
     FROM page_views WHERE at >= ?
     GROUP BY path
     ORDER BY views DESC
     LIMIT 15`
  )
    .bind(since)
    .all();

  const { results: topCountries } = await env.DB.prepare(
    `SELECT country, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS uniques
     FROM page_views
     WHERE at >= ? AND country IS NOT NULL AND country != ''
     GROUP BY country
     ORDER BY views DESC
     LIMIT 15`
  )
    .bind(since)
    .all();

  return {
    range: resolved,
    since,
    pageviews: Number(totals?.pageviews) || 0,
    uniques: Number(totals?.uniques) || 0,
    top_paths: (topPaths || []).map((r) => ({
      path: r.path,
      views: Number(r.views) || 0,
      uniques: Number(r.uniques) || 0
    })),
    top_countries: (topCountries || []).map((r) => ({
      country: r.country,
      views: Number(r.views) || 0,
      uniques: Number(r.uniques) || 0
    }))
  };
}
