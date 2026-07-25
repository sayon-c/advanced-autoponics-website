# Client invoice portal

Per-client invoice access for Advanced Autoponics (Cloudflare Worker + D1). Billing entity: **Advanced Autoponics, LLC**.

## Multiple customers = unique logins

**Yes — each client has their own access code.** There is no shared password.

- Creating a client (or regenerating/setting) stores a **PBKDF2 hash** (`access_code_hash`) for login verify **and** an **AES-GCM ciphertext** (`access_code_enc`) so admins can view/copy the code later.
- Vault key: `CODE_VAULT_SECRET` if set, otherwise derived from `ADMIN_SECRET`. Client portal APIs never return plaintext.
- **Clients & codes** shows each code in monospace with **Copy**. Older rows without ciphertext show “Code not stored — regenerate or set to reveal”.
- **Copy welcome message** includes the real code when available.
- **Regenerate / set access code** updates hash + vault and clears login rate-limit attempts.
- Login issues an HttpOnly session cookie (`aa_inv_session`) bound to that `client_id`.
- List/detail APIs only return invoices where `invoice.client_id === session.client_id`.

## URLs

| Page | Path |
|------|------|
| Client portal | `/invoices` (`/invoices.html`) |
| Admin gate (bookmark this) | `/admin-invoices.html` |
| Admin app (after unlock) | `/aa-billing-desk.html` then hash routes below |
| Login API | `POST /api/invoices/login` |
| Logout | `POST /api/invoices/logout` |
| Session | `GET /api/invoices/session` |
| List invoices | `GET /api/invoices` |
| Invoice detail | `GET /api/invoices/:id` (`?reveal_ach=1` for full ACH) |
| Admin session ping | `GET /api/invoices/admin/session` |
| Admin catalog | `GET /api/invoices/admin/catalog` |
| Admin clients | `GET/POST/PATCH /api/invoices/admin/clients` |
| Admin invoices | `GET/POST/PATCH/DELETE /api/invoices/admin/invoices` |
| Admin invoice actions | `POST` with `action`: `mark_sent`, `mark_paid`, `duplicate`, `email` |
| Admin settings | `GET/PUT /api/invoices/admin/settings` |
| Admin audit | `GET/DELETE /api/invoices/admin/audit` |
| Reset login attempts | `GET/POST /api/invoices/admin/reset-login-attempts` |
| Client views | `GET/DELETE/POST /api/invoices/admin/views?client_id=` |
| Analytics collect | `POST /api/analytics/collect` |
| Analytics summary | `GET /api/analytics/summary?range=7d\|30d` |

### Admin screens (after unlock)

Unlock at `/admin-invoices.html` → `/aa-billing-desk.html#/dashboard`.

| Screen | Hash | Purpose |
|--------|------|---------|
| Home | `#/dashboard` | Quick stats + **site visitors** (pageviews, uniques, top pages/countries) |
| Create invoice | `#/create` | New / edit invoice form |
| Invoices | `#/invoices` | List, filters, mark sent/paid, PDF, email, duplicate, delete |
| Clients & codes | `#/clients` | Clients, regenerate/set code, welcome copy, reset login attempts |
| Views & activity | `#/activity` | Client views + clear views / audit log |
| Settings | `#/settings` | Company ACH default (routing + account only) |

## Status workflow

Statuses: **draft → sent → viewed → paid** (plus **void**). Legacy `open` rows migrate to `sent`.

## ACH / bank transfer

Company ACH on invoices stores only:

```json
{ "routing_number": "…", "account_number": "…" }
```

Client portal masks both until **Show for payment**; PDF includes full numbers. Company default is set under **Settings**.

## PDF export

**Download PDF / Export PDF** uses vendored `assets/jspdf.umd.min.js` + `assets/invoice-pdf.js` (`AutoponicsInvoicePdf`) and downloads `invoice-<number>.pdf`. Header bills from **Advanced Autoponics, LLC** (Lakewood, CO · `billing@advancedautoponics.com`).

## Audit log + client views

- **Views & activity**: Client | Invoice | First viewed | Last viewed | Views.
- **Clear client views** resets view stats (and `viewed` → `sent`).
- **Audit log**: filter + clear with confirm.

## Login rate limiting

Failed portal logins are counted per IP in D1 `login_attempts` (~18 / 15 minutes). Admins can clear attempts on **Clients & codes**.

## Email invoice

Billing desk **Email** uses Resend when `RESEND_API_KEY` is set; otherwise mailto. Subjects/bodies reference **Advanced Autoponics, LLC**. Default From / Reply-To: `billing@advancedautoponics.com`.

## Admin gate

`/admin-invoices.html` unlocks with `ADMIN_SECRET`, stores it in `sessionStorage` (`aa_admin_secret`), then opens `/aa-billing-desk.html`. **Log out** clears the secret. Leaving the page clears the admin session (same leave signals as Orgenis).

## Site visitor metrics

Public pages load `/assets/analytics.js`, which beacons to `POST /api/analytics/collect`. Cookie: HttpOnly `aa_vid` (or daily HMAC fallback). Totals appear on **Billing home** (`#/dashboard`) for 7d/30d.

## Deploy notes

```bash
npx wrangler d1 migrations apply advanced-autoponics-invoices --remote
npx wrangler deploy
```

See [ADMIN.md](./ADMIN.md) for secrets and Control Surface URLs.
