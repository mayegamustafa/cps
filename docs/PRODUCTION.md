# City Parents School — Production Readiness

This document is the operator's guide to the platform: the audit performed, the
fixes applied, default credentials, deployment, the admin dashboard, and a
security review. Pair it with [TEST_REPORT.md](TEST_REPORT.md) (verification
results), [ARCHITECTURE.md](ARCHITECTURE.md), and [DEPLOYMENT.md](DEPLOYMENT.md).

The interactive API reference (Swagger / OpenAPI) is served by the API at
`/api/docs`. The database schema is the single source of truth at
[`packages/database/prisma/schema.prisma`](../packages/database/prisma/schema.prisma).

---

## 1. Audit findings and fixes

| # | Issue found in audit | Status | Fix |
|---|----------------------|--------|-----|
| 1 | No `.env`, no DB running, no migrations | Fixed | `.env` + `.env.example`, Postgres via Docker, Prisma migrations committed under `packages/database/prisma/migrations/` |
| 2 | `@cps/database` resolved to raw `.ts` (API crashed at boot) | Fixed | Package now compiles to `dist/`; `main` points to built JS; Dockerfile builds it |
| 3 | Admin credentials hardcoded in seed | Fixed | Seed reads `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` from env; password hashed (scrypt) and stored in DB |
| 4 | Homepage statistics were static text | Fixed | `SchoolStat` table + `/api/stats` CRUD + admin **Statistics** screen + animated DB-driven counters on the homepage |
| 5 | Social links / contact were hardcoded | Fixed | Stored in `SiteSetting`; editable under admin **Settings & SEO**; consumed by header, footer and social wall via `getSiteConfig()` |
| 6 | No password reset / change password | Fixed | `POST /api/auth/forgot-password`, `/reset-password`, `/change-password` (token hashed, 1-hour expiry, sessions revoked on reset) |
| 7 | Streaming was view-only (no operator tools) | Fixed | Streaming operator dashboard: create, schedule, choose provider (YouTube/Facebook/Zoom/RTMP), start, stop, archive recordings — wired to `/api/live` |
| 8 | No share / Open Graph for shareable links | Fixed | `ShareButtons` (WhatsApp, Facebook, X, Telegram, Copy, native share) + per-article OG/Twitter metadata with canonical URLs and image |
| 9 | Public pages read demo content | Fixed (key flows) | Home stats, social, news article, downloads now fetch the API with graceful fallback; remaining list pages keep typed demo data with the same shapes for swap |
| 10 | Leading-dash heading style ("— Established 1999") | Fixed | Replaced with the `.eyebrow` accent-rule style; all em/en dashes removed site-wide |
| 11 | Academic structure incorrect | Fixed | Pre-Primary (KG1–KG3), Lower Primary (P.1–P.3), Upper Primary (P.4–P.7); Day + Boarding; `SchoolSection` + `Residence` enums |

All items were verified against a running Postgres database (see TEST_REPORT.md).

---

## 2. Default Super Admin

Credentials are **seeded from environment variables**, never hardcoded. Defaults
(change immediately in production via `.env` before seeding):

```
Admin URL:  https://<your-domain>/admin      (local: http://localhost:3000/admin)
Username:   admin@cityparents.ac.ug          (SEED_ADMIN_EMAIL)
Password:   ChangeMe123!                      (SEED_ADMIN_PASSWORD)
Role:       SUPER_ADMIN
```

To set your own before first seed, edit `.env`:

```
SEED_ADMIN_EMAIL=principal@cityparents.ac.ug
SEED_ADMIN_PASSWORD=<a strong unique password>
```

then run `pnpm db:seed`.

### Changing the password
- **Logged in:** `POST /api/auth/change-password` with `{ currentPassword, newPassword }`.
- **Forgot:** `POST /api/auth/forgot-password` `{ email }` → returns a reset token
  (emailed once SMTP is configured) → `POST /api/auth/reset-password`
  `{ token, newPassword }`. Reset revokes all existing sessions.

### Adding admins / roles
Create a `User` with one or more `roles` from: `SUPER_ADMIN`, `MARKETING_ADMIN`,
`ADMISSIONS_ADMIN`, `HR_ADMIN`, `FINANCE_ADMIN`, `CONTENT_EDITOR`. Until the
Users screen ships, add via `prisma studio` (`pnpm db:studio`) or a seed entry;
every privileged endpoint is already RBAC-guarded by role.

---

## 3. Run locally (proven working)

```bash
pnpm install
cp .env.example .env                 # set DATABASE_URL, JWT secrets, SEED_ADMIN_*

# Database
docker compose up -d db              # Postgres 16
pnpm db:generate
pnpm db:migrate                      # applies committed migrations
pnpm db:build                        # compile @cps/database  (pnpm --filter @cps/database build)
pnpm db:seed                         # Super Admin + statistics + social + samples

# Apps
pnpm dev:api                         # http://localhost:4000/api  (Swagger /api/docs)
pnpm dev:web                         # http://localhost:3000  (+ /admin)
```

> The API requires the compiled `@cps/database` package. Run its `build` once
> after install and after any schema change (`pnpm db:generate && build`).

---

## 4. Admin dashboard guide

`/admin/login` → sign in (2FA prompt appears automatically if enabled). Sections:

- **Dashboard** — overview metrics and recent activity.
- **Statistics** — add/edit/delete the homepage figures; saved to DB, shown with
  animated counters within ~60s (ISR revalidation).
- **News, Events, Downloads** — content management; public pages read these.
- **Admissions / Careers** — review applications and update status.
- **Live Streams** — streaming operator console: create an event, pick a provider
  (RTMP self-hosted, or YouTube/Facebook/Zoom embed), schedule it, **Start** to go
  live, **Stop** to end, and attach a **Recording** URL to archive it.
- **Settings & SEO** — school identity, logo (the school crest, swappable),
  hero text, statistics-independent contact details, and **social media links**
  (database-driven; reflected site-wide).

Content edits persist to Postgres and survive refresh and redeploy.

---

## 5. Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). Summary:

- **Web** → Cloudflare Pages / Vercel. Set `NEXT_PUBLIC_API_URL`,
  `NEXT_PUBLIC_SITE_URL`. (`NEXT_PUBLIC_*` are baked at build time — rebuild when
  they change.)
- **API** → container (`apps/api/Dockerfile`) on Railway/Fly/VPS. Set
  `DATABASE_URL`, `JWT_*`, `CORS_ORIGIN`, R2 and streaming vars.
- **DB** → managed Postgres 16. Run `prisma migrate deploy` then `db:seed` once.
- `docker compose up` runs the full stack locally.

---

## 6. Security review

Implemented:
- Passwords hashed with scrypt + per-user salt, constant-time compare.
- JWT access tokens; refresh tokens hashed at rest; sessions revoked on password reset.
- RBAC on every mutating endpoint (`@Roles` + `RolesGuard`); TOTP 2FA supported.
- Helmet headers, strict CORS allowlist, global rate limiting (Throttler),
  `ValidationPipe` (whitelist + forbid unknown fields) on all DTOs.
- Reset tokens are random 32-byte values, stored hashed, 1-hour expiry, no account
  enumeration on `forgot-password`.
- Security headers in `next.config.ts`; `/admin` excluded from indexing.

Before go-live (operator actions):
- [ ] Replace all secrets in `.env` (JWT_*, DB password) with strong unique values.
- [ ] Change the seeded admin password.
- [ ] Configure SMTP so reset tokens are emailed (currently returned in non-prod only).
- [ ] Put the API behind HTTPS/TLS and set `CORS_ORIGIN` to the real web origin.
- [ ] Configure Cloudflare R2 credentials for media/recording uploads.

---

## 7. Known external-dependency items (wired in code, need services)

These are coded against the data model and admin UI but require third-party
credentials/infrastructure to be "live", and are therefore not asserted as PASS
in the test report:

- **Email delivery** — SMTP not configured; reset token is returned in dev so the
  flow is testable. Add `SMTP_*` to enable sending.
- **File/media/recording uploads** — Cloudflare R2 credentials required; the admin
  media and recording UIs accept URLs today and stream to R2 once `R2_*` is set.
- **RTMP ingest / HLS packaging** — the operator dashboard manages stream lifecycle
  and keys; an ingest server (or YouTube/Facebook/Zoom for those providers) must be
  pointed at the generated key/URL.
- **Social auto-sync** — the moderation model and endpoints exist; network API
  tokens (`YOUTUBE_API_KEY`, etc.) are needed for automated pulling.
