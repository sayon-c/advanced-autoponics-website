/**
 * Advanced Autoponics Worker — static assets + invoice/analytics API.
 * Adapts Pages Function handlers (onRequest*) for Workers + ASSETS.
 */
import { onRequest as adminGate } from '../functions/_middleware.js';

import * as analyticsCollect from '../functions/api/analytics/collect.js';
import * as analyticsSummary from '../functions/api/analytics/summary.js';

import * as invLogin from '../functions/api/invoices/login.js';
import * as invLogout from '../functions/api/invoices/logout.js';
import * as invSession from '../functions/api/invoices/session.js';
import * as invIndex from '../functions/api/invoices/index.js';
import * as invById from '../functions/api/invoices/[id].js';

import * as adminSession from '../functions/api/invoices/admin/session.js';
import * as adminCatalog from '../functions/api/invoices/admin/catalog.js';
import * as adminClients from '../functions/api/invoices/admin/clients.js';
import * as adminInvoices from '../functions/api/invoices/admin/invoices.js';
import * as adminSettings from '../functions/api/invoices/admin/settings.js';
import * as adminAudit from '../functions/api/invoices/admin/audit.js';
import * as adminViews from '../functions/api/invoices/admin/views.js';
import * as adminResetLogin from '../functions/api/invoices/admin/reset-login-attempts.js';

import * as geminySignup from '../functions/api/geminy/signup.js';
import * as geminyAdminKeys from '../functions/api/geminy/admin/keys.js';

const METHOD_MAP = {
  GET: 'onRequestGet',
  POST: 'onRequestPost',
  PUT: 'onRequestPut',
  PATCH: 'onRequestPatch',
  DELETE: 'onRequestDelete',
  OPTIONS: 'onRequestOptions'
};

/** @type {{ methods?: string[], match: (path: string) => ({ params?: Record<string,string> } | null), mod: object }[]} */
const ROUTES = [
  { match: (p) => (p === '/api/analytics/collect' ? {} : null), mod: analyticsCollect },
  { match: (p) => (p === '/api/analytics/summary' ? {} : null), mod: analyticsSummary },
  { match: (p) => (p === '/api/invoices/login' ? {} : null), mod: invLogin },
  { match: (p) => (p === '/api/invoices/logout' ? {} : null), mod: invLogout },
  { match: (p) => (p === '/api/invoices/session' ? {} : null), mod: invSession },
  { match: (p) => (p === '/api/invoices' || p === '/api/invoices/' ? {} : null), mod: invIndex },
  {
    match: (p) => {
      const m = p.match(/^\/api\/invoices\/([^/]+)$/);
      if (!m) return null;
      const id = m[1];
      if (id === 'login' || id === 'logout' || id === 'session' || id === 'admin') return null;
      return { params: { id } };
    },
    mod: invById
  },
  { match: (p) => (p === '/api/invoices/admin/session' ? {} : null), mod: adminSession },
  { match: (p) => (p === '/api/invoices/admin/catalog' ? {} : null), mod: adminCatalog },
  { match: (p) => (p === '/api/invoices/admin/clients' ? {} : null), mod: adminClients },
  { match: (p) => (p === '/api/invoices/admin/invoices' ? {} : null), mod: adminInvoices },
  { match: (p) => (p === '/api/invoices/admin/settings' ? {} : null), mod: adminSettings },
  { match: (p) => (p === '/api/invoices/admin/audit' ? {} : null), mod: adminAudit },
  { match: (p) => (p === '/api/invoices/admin/views' ? {} : null), mod: adminViews },
  {
    match: (p) => (p === '/api/invoices/admin/reset-login-attempts' ? {} : null),
    mod: adminResetLogin
  },
  { match: (p) => (p === '/api/geminy/signup' ? {} : null), mod: geminySignup },
  { match: (p) => (p === '/api/geminy/admin/keys' ? {} : null), mod: geminyAdminKeys }
];

function pagesContext(request, env, ctx, params = {}) {
  return {
    request,
    env,
    params,
    waitUntil: (p) => ctx.waitUntil(p),
    next: () => env.ASSETS.fetch(request),
    data: {}
  };
}

async function dispatchApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  // Keep trailing-slash-insensitive match but restore original for /api/invoices/
  const pathForMatch = url.pathname.endsWith('/') && url.pathname !== '/'
    ? url.pathname.replace(/\/+$/, '')
    : url.pathname;

  for (const route of ROUTES) {
    const hit = route.match(pathForMatch) || route.match(path);
    if (!hit) continue;

    const methodKey = METHOD_MAP[request.method] || null;
    const handler =
      (methodKey && route.mod[methodKey]) ||
      route.mod.onRequest ||
      null;

    if (!handler) {
      if (request.method === 'OPTIONS' && route.mod.onRequestOptions) {
        return route.mod.onRequestOptions(pagesContext(request, env, ctx, hit.params || {}));
      }
      return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }

    return handler(pagesContext(request, env, ctx, hit.params || {}));
  }

  return new Response(JSON.stringify({ error: 'Not found.' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Admin IP allowlist (HTML + API) via Orgenis-compatible middleware.
    const gated = await adminGate({
      request,
      env,
      next: async () => {
        if (path.startsWith('/api/')) {
          return dispatchApi(request, env, ctx);
        }
        return env.ASSETS.fetch(request);
      }
    });

    return gated;
  }
};
