import { json, clearSessionCookie } from '../../_lib/http.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request }) {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) });
}

export async function onRequestGet({ request }) {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) });
}
