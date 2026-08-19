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
| `ADMIN_SECRET` | Unlock gate + `Authorization: Bearer` / `X-Admin-Secret` for admin APIs + analytics summary |
| `CODE_VAULT_SECRET` | Encrypts access codes / Geminy keys for admin reveal (defaults to `ADMIN_SECRET`) |
| `ADMIN_IP_ALLOWLIST` | Optional IP/CIDR gate for admin HTML + admin APIs (skipped when `ENVIRONMENT=dev` or unset) |
| `RESEND_API_KEY` | Server-side invoice email **and** Geminy access-key email (**required** for public Geminy signup) |
| `INVOICE_FROM` | Resend From header (invoices) |
| `INVOICE_REPLY_TO` | Reply-To (defaults to `billing@advancedautoponics.com`) |
| `GEMINY_APP_URL` | Login URL included in Geminy access emails (wrangler `vars`; default `https://app.advancedautoponics.com`) |
| `GEMINY_FROM` | Optional Resend From for Geminy emails (defaults to `Advanced Autoponics <info@advancedautoponics.com>`) |

## GeminyIoT alpha signup

Public form on the marketing homepage (`/#geminy-access`) posts to `POST /api/geminy/signup` with `{ email, company }`.

Flow:

1. Rate-limit by hashed IP (~8 requests / 15 minutes).
2. Generate a `GEM-XXXX-XXXX` key (same spirit as invoice codes), store **PBKDF2 hash** + optional **AES-GCM vault** ciphertext in D1 table `geminy_keys`.
3. Email the key via Resend. The HTTP response is only a success message (“Check your email”) — **no key in the JSON/HTML**.
4. If the same email requests again while active, the existing vault key is resent (or regenerated if vault decrypt fails).

If `RESEND_API_KEY` is missing, signup returns `503` with `code: resend_not_configured`.

Admin: open **Geminy access** in the billing desk (`#/geminy`) to list, copy, resend, revoke, or re-activate keys (`GET` / `PATCH /api/geminy/admin/keys`).

## D1

- Database name: `advanced-autoponics-invoices`
- Binding: `DB`
- Migrations: `migrations/` (`0001`–`0009`)

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
