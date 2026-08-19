# Admin Control Surface

Internal billing desk + visitor metrics for **Advanced Autoponics** (Cloudflare Worker `advanced-autoponics-website` + D1).

## URLs

| Page | Path |
|------|------|
| Admin unlock (bookmark) | `/admin-invoices.html` |
| Billing desk (after unlock) | `/aa-billing-desk.html#/dashboard` |
| Geminy access (admin) | `/aa-billing-desk.html#/geminy` |
| Client invoice portal | `/invoices` (`/invoices.html`) |
| Geminy alpha signup (public) | `/#geminy-access` |

Production: `https://www.advancedautoponics.com/admin-invoices.html`

## Secrets

Set on the Worker (never commit):

```bash
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_SECRET
# optional:
npx wrangler secret put CODE_VAULT_SECRET
npx wrangler secret put ADMIN_IP_ALLOWLIST
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put INVOICE_FROM
# value example: Advanced Autoponics, LLC <billing@advancedautoponics.com>
npx wrangler secret put INVOICE_REPLY_TO
# value: billing@advancedautoponics.com
```

Local: copy `.dev.vars.example` → `.dev.vars`.

| Secret / var | Purpose |
|--------------|---------|
| `SESSION_SECRET` | Signs client portal session cookie `aa_inv_session`; salts analytics visitor fallback |
| `ADMIN_SECRET` | Unlock gate + admin APIs; also signs Geminy approve/reject email link tokens |
| `CODE_VAULT_SECRET` | Encrypts access codes / Geminy keys for admin reveal (defaults to `ADMIN_SECRET`) |
| `ADMIN_IP_ALLOWLIST` | Optional IP/CIDR gate for admin HTML + admin APIs (skipped when `ENVIRONMENT=dev` or unset) |
| `RESEND_API_KEY` | Invoice email, Geminy admin notify, applicant confirmation, and **key email after approval** |
| `INVOICE_FROM` | Resend From header (invoices) |
| `INVOICE_REPLY_TO` | Reply-To (defaults to `billing@advancedautoponics.com`) |
| `GEMINY_APP_URL` | Login URL in approved-key emails (wrangler `vars`; default `https://geminyiot.advancedautoponics.com`) |
| `GEMINY_FROM` | Resend From for Geminy emails (defaults to `info@`) |
| `GEMINY_ADMIN_EMAIL` | Where pending-request notifications go (default `sayonc@advancedautoponics.com`) |
| `GEMINY_REPLY_TO` | Reply-To for Geminy emails (default `sayonc@advancedautoponics.com`) |

## GeminyIoT alpha signup (approval required)

Public form on the marketing homepage (`/#geminy-access`) posts to `POST /api/geminy/signup` with `{ email, company }`.

Flow:

1. Rate-limit by hashed IP (~8 / 15 minutes).
2. Store a **pending** row in D1 `geminy_keys` — **no login key generated yet**.
3. Optionally email the applicant a confirmation (“request received — we’ll review”).
4. Notify admin (`GEMINY_ADMIN_EMAIL`) with HMAC-signed Approve / Reject links (`GET /api/geminy/decide?token=…`, 7-day expiry, single-use while still pending) **and** desk instructions.
5. On **Approve** (email link or desk): generate `GEM-XXXX-XXXX`, store PBKDF2 hash + AES-GCM vault, email the key to the applicant. Public responses never include the key.
6. On **Reject**: mark `rejected`; no key sent.

If `RESEND_API_KEY` is missing, signup still stores pending (admin can approve in desk), but approval cannot email a key until Resend is configured (`503` / `resend_not_configured`).

Admin desk: **Geminy access** (`#/geminy`) — Approve / Reject pending; Resend / Revoke active keys (`GET` / `PATCH /api/geminy/admin/keys`).

The GeminyIoT app verifies an emailed key with `POST /api/geminy/verify` `{ email, key }` (aliases: `access_key`, `code`, `password`). Success returns `{ ok, valid, email, company, access_id, status }` and never a cookie — the app owns its own session. Failures are always generic `401 invalid_credentials` (no email-exists leak). Rate-limited via the same hashed-IP login table as the invoice portal (~18 / 15 min). Live: `https://www.advancedautoponics.com/api/geminy/verify`. CORS allows `https://geminyiot.advancedautoponics.com`, `https://www.advancedautoponics.com`, `https://advancedautoponics.com`, the configured `GEMINY_APP_URL` origin, and localhost (OPTIONS preflight handled).

## D1

- Database name: `advanced-autoponics-invoices`
- Binding: `DB`
- Migrations: `migrations/` (`0001`–`0009`; pending status uses existing `geminy_keys`)

```bash
npx wrangler d1 migrations apply advanced-autoponics-invoices --local
npx wrangler d1 migrations apply advanced-autoponics-invoices --remote
```

## Deploy

```bash
npx wrangler deploy
```

Architecture: Worker entry `worker/index.js` routes `/api/*` (and admin HTML for IP allowlist) with `assets.run_worker_first`; marketing site remains static assets. Source under `functions/` mirrors the Orgenis Pages Functions layout and is bundled by the Worker (not publicly served — listed in `.assetsignore`).

## Contact on invoices

- Phone (site): `(608) 320-0213`
- General: `info@advancedautoponics.com`
- Billing: `billing@advancedautoponics.com`

See [INVOICES.md](./INVOICES.md) for portal workflow, screens, and analytics.
