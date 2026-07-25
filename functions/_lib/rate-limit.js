import { hashIp } from './crypto.js';
import { clientIp } from './http.js';

const WINDOW_MS = 15 * 60 * 1000;
/** Slightly higher than before — still blocks guessing, less friction for typos. */
const MAX_ATTEMPTS = 18;

export async function checkLoginRateLimit(request, env) {
  const ip = clientIp(request);
  const ipHash = await hashIp(ip);
  const now = Date.now();
  const since = now - WINDOW_MS;

  await env.DB.prepare(
    'DELETE FROM login_attempts WHERE attempted_at < ?'
  )
    .bind(since)
    .run();

  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS c, MIN(attempted_at) AS oldest
     FROM login_attempts WHERE ip_hash = ? AND attempted_at >= ?`
  )
    .bind(ipHash, since)
    .first();

  const count = Number(row?.c || 0);
  if (count >= MAX_ATTEMPTS) {
    const oldest = Number(row?.oldest || now);
    const retryAfterSec = Math.max(30, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    return { limited: true, retryAfterSec, ipHash };
  }
  return { limited: false, ipHash };
}

export async function recordLoginAttempt(env, ipHash) {
  await env.DB.prepare(
    'INSERT INTO login_attempts (ip_hash, attempted_at) VALUES (?, ?)'
  )
    .bind(ipHash, Date.now())
    .run();
}

/** Wipe all attempts (e.g. after admin regenerates a code so the client can retry). */
export async function clearLoginAttempts(env) {
  const before = await env.DB.prepare('SELECT COUNT(*) AS c FROM login_attempts').first();
  await env.DB.prepare('DELETE FROM login_attempts').run();
  return { deleted: Number(before?.c || 0) };
}

/** Clear attempts for one client IP (hashed the same way as login). */
export async function clearLoginAttemptsForIp(env, ip) {
  const ipHash = await hashIp(String(ip || '').trim());
  const before = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM login_attempts WHERE ip_hash = ?'
  )
    .bind(ipHash)
    .first();
  await env.DB.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').bind(ipHash).run();
  return { deleted: Number(before?.c || 0), ipHash };
}

/** Admin summary of current rate-limit rows. */
export async function countLoginAttempts(env) {
  const totalRow = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM login_attempts'
  ).first();
  const distinctRow = await env.DB.prepare(
    'SELECT COUNT(DISTINCT ip_hash) AS c FROM login_attempts'
  ).first();
  const { results } = await env.DB.prepare(
    `SELECT ip_hash, COUNT(*) AS attempts, MAX(attempted_at) AS last_attempted_at
     FROM login_attempts
     GROUP BY ip_hash
     ORDER BY last_attempted_at DESC
     LIMIT 25`
  ).all();
  return {
    total: Number(totalRow?.c || 0),
    distinct_ips: Number(distinctRow?.c || 0),
    by_ip: (results || []).map((r) => ({
      ip_hash: r.ip_hash,
      attempts: Number(r.attempts || 0),
      last_attempted_at: r.last_attempted_at != null ? Number(r.last_attempted_at) : null
    }))
  };
}
