import {
  isAdminApiPath,
  isAdminHtmlPath,
  requireAdminIp,
  shouldEnforceAdminIpAllowlist
} from './_lib/ip-allowlist.js';

/**
 * Gate admin HTML + API by ADMIN_IP_ALLOWLIST (CF-Connecting-IP).
 * Skipped when allowlist unset or ENVIRONMENT=dev.
 */
export async function onRequest(context) {
  const { request, env, next } = context;
  const path = new URL(request.url).pathname;

  if (
    shouldEnforceAdminIpAllowlist(env) &&
    (isAdminApiPath(path) || isAdminHtmlPath(path))
  ) {
    const check = requireAdminIp(request, env);
    if (check.error) {
      if (isAdminHtmlPath(path)) {
        return new Response('Forbidden', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store'
          }
        });
      }
      return check.error;
    }
  }

  return next();
}
