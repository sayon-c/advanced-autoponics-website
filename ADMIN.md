# Admin Control Surface

Internal billing desk + visitor metrics for **Advanced Autoponics** (Cloudflare Worker `advanced-autoponics-website` + D1).

## URLs

| Page | Path |
|------|------|
| Admin unlock (bookmark) | `/admin-invoices.html` |
| Billing desk (after unlock) | `/aa-billing-desk.html#/dashboard` |
| Client invoice portal | `/invoices` (`/invoices.html`) |

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

| Secret | Purpose |
|--------|---------|
| `SESSION_SECRET` | Signs client portal session cookie `aa_inv_session`; salts analytics visitor fallback |
| `ADMIN_SECRET` | Unlock gate + `Authorization: Bearer` / `X-Admin-Secret` for admin APIs + analytics summary |
| `CODE_VAULT_SECRET` | Encrypts access codes for admin reveal (defaults to `ADMIN_SECRET`) |
| `ADMIN_IP_ALLOWLIST` | Optional IP/CIDR gate for admin HTML + admin APIs (skipped when `ENVIRONMENT=dev` or unset) |
| `RESEND_API_KEY` | Server-side invoice email |
| `INVOICE_FROM` | Resend From header |
| `INVOICE_REPLY_TO` | Reply-To (defaults to `billing@advancedautoponics.com`) |

## D1

- Database name: `advanced-autoponics-invoices`
- Binding: `DB`
- Migrations: `migrations/` (`0001`–`0008`)

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
