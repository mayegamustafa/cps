# Deploying to Railway

This monorepo deploys as **three Railway services** in one project:

1. **Postgres** (Railway database plugin)
2. **API** (NestJS) — built from `apps/api/Dockerfile`
3. **Web** (Next.js) — built from `apps/web/Dockerfile`

The API container **runs migrations and seeds the Super Admin automatically on
first boot**, so the platform comes up working.

---

## 1. Create the project and database

1. Railway → **New Project** → **Deploy from GitHub repo** → select
   `mayegamustafa/cps`.
2. In the project, **New → Database → PostgreSQL**. This exposes a
   `DATABASE_URL` variable on the Postgres service.

## 2. API service

- **New → GitHub Repo** (same repo) → name it `api`.
- Settings → **Build**: Builder = **Dockerfile**, Dockerfile Path =
  `apps/api/Dockerfile`. Root Directory = `/` (repo root).
- Variables:
  ```
  DATABASE_URL = ${{Postgres.DATABASE_URL}}
  JWT_ACCESS_SECRET  = <long random string>
  JWT_REFRESH_SECRET = <different long random string>
  CORS_ORIGIN  = https://<your-web-domain>     # fill after step 3
  SEED_ADMIN_EMAIL    = admin@cityparents.ac.ug
  SEED_ADMIN_PASSWORD = <a strong password>
  NODE_ENV = production
  ```
  (Railway injects `PORT` automatically; the API binds to it.)
- Deploy. Under **Settings → Networking → Generate Domain** to get the public API
  URL, e.g. `https://api-production-xxxx.up.railway.app`.

## 3. Web service

- **New → GitHub Repo** (same repo) → name it `web`.
- Settings → **Build**: Builder = **Dockerfile**, Dockerfile Path =
  `apps/web/Dockerfile`. Root Directory = `/`.
- Variables (these are also passed as Docker build args by Railway, so they are
  baked into the bundle):
  ```
  NEXT_PUBLIC_API_URL  = https://<your-api-domain>      # from step 2
  NEXT_PUBLIC_SITE_URL = https://<your-web-domain>      # this service's domain
  ```
- **Settings → Networking → Generate Domain** to get the web URL.
- Go back to the **API** service and set `CORS_ORIGIN` to the web domain, then
  redeploy the API.

## 4. Verify

- Visit `https://<web-domain>` — the site loads with live data.
- Visit `https://<web-domain>/admin` and sign in with `SEED_ADMIN_EMAIL` /
  `SEED_ADMIN_PASSWORD`. **Change the password immediately** (Settings, or the
  `change-password` endpoint).
- API health/docs: `https://<api-domain>/api/docs`.

## Notes

- **Migrations**: applied on every API boot via `prisma migrate deploy`
  (see `docker/api-entrypoint.sh`). New migrations ship by committing them under
  `packages/database/prisma/migrations/`.
- **Seeding**: idempotent; it creates the admin only if missing and never resets
  an existing password.
- **Media/recordings (Cloudflare R2)** and **email (SMTP)** are optional; add the
  `R2_*` / `SMTP_*` variables to the API service to enable uploads and emails.
- If you change `NEXT_PUBLIC_*`, **redeploy the web service** (they are baked at
  build time).
