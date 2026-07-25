import { json } from '../../_lib/http.js';
import { requireDb } from '../../_lib/auth.js';
import { newId } from '../../_lib/crypto.js';
import {
  isLikelyBot,
  normalizeAnalyticsPath,
  resolveVisitorId,
  hashWithSalt,
  geoFromRequest,
  referrerHost,
  recordPageView
} from '../../_lib/analytics.js';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    }
  });
}

function ok(setCookie) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  if (setCookie) headers.append('Set-Cookie', setCookie);
  return new Response(null, { status: 204, headers });
}

async function parseBody(request) {
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  try {
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const form = await request.formData();
      return { path: form.get('path'), referrer: form.get('referrer') };
    }
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * POST /api/analytics/collect
 * Body JSON: { path?, referrer? } — first-party pageview beacon.
 * Skips bots, admin/invoice paths. Sets HttpOnly visitor cookie (no raw IP stored).
 */
export async function onRequestPost({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;
  if (isLikelyBot(request)) return ok(null);

  const body = await parseBody(request);
  if (body == null) return json({ error: 'Invalid payload.' }, 400);

  const url = new URL(request.url);
  const path = normalizeAnalyticsPath(body?.path);
  if (!path) return ok(null);

  const { visitorId, setCookie } = await resolveVisitorId(request, env);
  const ua = request.headers.get('User-Agent') || '';
  const uaHash = await hashWithSalt(env, `ua|${ua}`);
  const { country, city } = geoFromRequest(request);
  const ref = referrerHost(
    body?.referrer || request.headers.get('Referer') || '',
    url.hostname
  );

  try {
    await recordPageView(env, {
      id: newId('pv'),
      at: new Date().toISOString(),
      path,
      referrer: ref,
      country,
      city,
      visitor_id: visitorId,
      ua_hash: uaHash
    });
  } catch (err) {
    console.error('analytics collect failed', err?.message || err);
    return json({ error: 'Unable to record view.' }, 500);
  }

  return ok(setCookie);
}

/** GET not used by the beacon — keep OPTIONS/POST only. */
export async function onRequestGet() {
  return json({ error: 'Use POST.' }, 405);
}
