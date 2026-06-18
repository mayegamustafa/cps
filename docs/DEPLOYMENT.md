# Deployment

## Environments

| Concern   | Local            | Production (recommended)                 |
| --------- | ---------------- | ---------------------------------------- |
| Web       | `pnpm dev:web`   | Cloudflare Pages / Vercel (Next.js 15)   |
| API       | `pnpm dev:api`   | Docker container (Railway / Fly / VPS)   |
| Database  | Docker Postgres  | Managed PostgreSQL 16 (Neon / RDS / Railway) |
| Media     | local stub       | Cloudflare R2 bucket                      |
| Streaming | —                | RTMP ingest + HLS edge (own server / Cloudflare Stream) |

## Container build

```bash
pnpm docker:up      # db + api + web
pnpm docker:down
```

Images: `apps/web/Dockerfile` (multi-stage, runs `next start`) and
`apps/api/Dockerfile` (multi-stage, runs the compiled Nest server).

## Database migrations

```bash
pnpm db:migrate            # dev: create + apply a migration
pnpm --filter @cps/database migrate:deploy   # prod: apply committed migrations
```

## Cloudflare deployment notes

- **Web** — deploy `apps/web` to Cloudflare Pages (or Vercel). Set
  `NEXT_PUBLIC_*` env vars and `NEXT_PUBLIC_API_URL`.
- **R2** — create the `cityparents-media` bucket, generate an S3 access key,
  and set `R2_*` vars. Serve via a custom domain (`media.cityparents.sc.ug`).
- **DNS / TLS** — proxy the API and stream subdomains through Cloudflare.

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR: install → Prisma generate →
typecheck → lint → build, against an ephemeral Postgres service. Extend with a
deploy job (Pages/Railway) gated on `main`.

## Pre-launch checklist

- [ ] Rotate all secrets in `.env` (JWT, R2, OAuth, SMTP).
- [ ] Run `db:migrate:deploy` and `db:seed` (then change the admin password).
- [ ] Configure Google Search Console + Indexing API service account.
- [ ] Set Google Maps API key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`).
- [ ] Verify security headers and HTTPS redirect.
- [ ] Smoke-test admissions/careers uploads against R2.
