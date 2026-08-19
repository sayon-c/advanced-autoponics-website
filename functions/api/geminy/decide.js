import { clean } from '../../_lib/http.js';
import { requireDb } from '../../_lib/auth.js';
import {
  geminyDecisionSecret,
  verifyGeminyDecision,
  approveGeminyRequest,
  rejectGeminyRequest
} from '../../_lib/geminy.js';

function htmlPage(title, bodyHtml, status = 200) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${escapeHtml(title)} · Advanced Autoponics</title>
  <style>
    :root { --off-black:#080808; --off-white:#f8f8f8; --accent:#6ec177; --mute:#686868; }
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
      font-family: Barlow, "Helvetica Neue", Helvetica, Arial, sans-serif;
      background: linear-gradient(160deg, #0c0c0c 0%, #141414 45%, #0a1a10 100%);
      color: var(--off-white); padding: 24px; }
    .card { max-width: 28rem; width:100%; padding: 2rem 1.75rem;
      border: 1px solid rgba(248,248,248,0.12); background: rgba(8,8,8,0.72); }
    .eyebrow { color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em;
      font-size: 0.75rem; margin: 0 0 0.75rem; }
    h1 { font-family: "Barlow Condensed", "Arial Narrow", sans-serif; font-weight: 500;
      font-size: 1.85rem; line-height: 1.15; margin: 0 0 0.75rem; }
    p { color: #bdbdbd; line-height: 1.5; margin: 0 0 1rem; font-weight: 300; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <main class="card">
    <p class="eyebrow">GeminyIoT access</p>
    <h1>${escapeHtml(title)}</h1>
    ${bodyHtml}
  </main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function onRequestGet({ request, env }) {
  const dbOk = requireDb(env);
  if (dbOk.error) {
    return htmlPage('Unavailable', '<p>Database is not configured.</p>', 503);
  }

  const url = new URL(request.url);
  const token = clean(url.searchParams.get('token'), 2000);
  const secret = geminyDecisionSecret(env);
  if (!token || !secret) {
    return htmlPage(
      'Invalid link',
      '<p>This approval link is missing or the server is not configured for decisions.</p>',
      400
    );
  }

  const decision = await verifyGeminyDecision(token, secret);
  if (!decision) {
    return htmlPage(
      'Link expired or invalid',
      '<p>Request a new notification from the billing desk, or open <a href="/aa-billing-desk.html#/geminy">Geminy access</a> while signed in as admin.</p>',
      400
    );
  }

  const row = await env.DB.prepare(
    `SELECT id, email, company, key_hash, key_enc, status, created_at, last_sent_at
     FROM geminy_keys WHERE id = ?`
  )
    .bind(decision.id)
    .first();

  if (!row) {
    return htmlPage('Not found', '<p>That access request no longer exists.</p>', 404);
  }

  if (row.status !== 'pending') {
    return htmlPage(
      'Already decided',
      `<p>This request is already <strong>${escapeHtml(row.status)}</strong> for ${escapeHtml(row.email)}.</p>
       <p><a href="/aa-billing-desk.html#/geminy">Open Geminy access desk</a></p>`
    );
  }

  if (decision.action === 'reject') {
    const result = await rejectGeminyRequest(env, row);
    if (!result.ok) {
      return htmlPage('Could not reject', `<p>${escapeHtml(result.error)}</p>`, 409);
    }
    return htmlPage(
      'Request rejected',
      `<p>Rejected access for <strong>${escapeHtml(row.company)}</strong> (${escapeHtml(row.email)}). No login key was sent.</p>`
    );
  }

  // approve
  const result = await approveGeminyRequest(env, row);
  if (!result.ok) {
    return htmlPage(
      'Could not approve',
      `<p>${escapeHtml(result.error)}</p>
       <p>You can also approve from <a href="/aa-billing-desk.html#/geminy">the billing desk</a>.</p>`,
      result.code === 'resend_not_configured' ? 503 : 409
    );
  }

  const emailNote = result.sent
    ? `A login key was emailed to <strong>${escapeHtml(row.email)}</strong>.`
    : `Approved, but the key email failed${result.emailError ? `: ${escapeHtml(result.emailError)}` : ''}. Resend from the desk.`;

  return htmlPage(
    'Request approved',
    `<p>Approved <strong>${escapeHtml(row.company)}</strong>.</p><p>${emailNote}</p>
     <p><a href="/aa-billing-desk.html#/geminy">Open Geminy access desk</a></p>`
  );
}
