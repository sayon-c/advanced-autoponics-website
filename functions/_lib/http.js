export function json(body, status = 200, headers = {}) {
  const out = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  for (const [key, value] of Object.entries(headers || {})) {
    if (value == null) continue;
    if (key.toLowerCase() === 'set-cookie') {
      const cookies = Array.isArray(value) ? value : [value];
      for (const cookie of cookies) {
        if (cookie) out.append('Set-Cookie', cookie);
      }
      continue;
    }
    out.set(key, String(value));
  }
  return new Response(JSON.stringify(body), { status, headers: out });
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function sessionCookie(value, maxAgeSec, request) {
  const parts = [
    `aa_inv_session=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`
  ];
  if (isHttps(request)) parts.push('Secure');
  const domain = cookieDomain(request);
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join('; ');
}

/** Clears host-only and Domain cookies (returns one string or string[]). */
export function clearSessionCookie(request) {
  const base = [
    'aa_inv_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (isHttps(request)) base.push('Secure');
  const hostOnly = base.join('; ');
  const domain = cookieDomain(request);
  if (!domain) return hostOnly;
  return [hostOnly, `${hostOnly}; Domain=${domain}`];
}

function isHttps(request) {
  if (!request) return true;
  const forwarded = request.headers.get('X-Forwarded-Proto');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim().toLowerCase();
    if (first === 'https') return true;
    if (first === 'http') return false;
  }
  const proto = request.headers.get('CF-Visitor');
  try {
    if (proto) {
      const parsed = JSON.parse(proto);
      if (parsed?.scheme === 'https') return true;
      if (parsed?.scheme === 'http') return false;
    }
  } catch {
    /* ignore */
  }
  const url = new URL(request.url);
  return url.protocol === 'https:';
}

/** Share session across www + apex when both host the app. Skip on localhost. */
function cookieDomain(request) {
  if (!request) return null;
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

export function clientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function clean(value = '', max = 500) {
  return String(value ?? '').trim().slice(0, max);
}
