import { json, clean } from '../../_lib/http.js';
import { requireDb } from '../../_lib/auth.js';
import { checkLoginRateLimit, recordLoginAttempt } from '../../_lib/rate-limit.js';
import {
  geminyCorsHeaders,
  verifyGeminyLogin,
  geminyVerifyInvalidBody
} from '../../_lib/geminy.js';

function withCors(request, env, body, status = 200, extraHeaders = {}) {
  return json(body, status, { ...geminyCorsHeaders(request, env), ...extraHeaders });
}

export async function onRequestOptions({ request, env }) {
  return new Response(null, {
    status: 204,
    headers: {
      ...geminyCorsHeaders(request, env),
      'Cache-Control': 'no-store'
    }
  });
}

/**
 * POST /api/geminy/verify
 * Body: { email, key }  (aliases: access_key, code, password)
 * Public: D1 lookup + PBKDF2 compare. Never returns the key or whether the email exists.
 */
export async function onRequestPost({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) return dbOk.error;

  const rate = await checkLoginRateLimit(request, env);
  if (rate.limited) {
    const mins = Math.max(1, Math.ceil(rate.retryAfterSec / 60));
    return withCors(
      request,
      env,
      {
        error: `Too many sign-in attempts. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`,
        code: 'rate_limited',
        retry_after_sec: rate.retryAfterSec
      },
      429,
      { 'Retry-After': String(rate.retryAfterSec) }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    await recordLoginAttempt(env, rate.ipHash);
    return withCors(request, env, geminyVerifyInvalidBody(), 401);
  }

  const email = clean(body?.email, 320);
  const key = clean(body?.key ?? body?.access_key ?? body?.code ?? body?.password, 128);

  const result = await verifyGeminyLogin(env, { email, key });
  if (!result.ok) {
    await recordLoginAttempt(env, rate.ipHash);
    console.log(JSON.stringify({ event: 'geminy_verify', ok: false }));
    return withCors(request, env, geminyVerifyInvalidBody(), 401);
  }

  console.log(JSON.stringify({ event: 'geminy_verify', ok: true, access_id: result.access_id }));
  return withCors(request, env, {
    ok: true,
    valid: true,
    email: result.email,
    company: result.company,
    access_id: result.access_id,
    status: 'active'
  });
}
