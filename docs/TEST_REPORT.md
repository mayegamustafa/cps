# Test Report

Environment: local verification against **PostgreSQL 16** (Docker), NestJS API
(compiled `dist`), Next.js 15 (production build). The API was exercised with real
HTTP requests and a real database; the web was built against the live API so
server-rendered pages contain live data.

> Note on ports: in this shared environment ports 4000/3000 were occupied by
> unrelated apps, so verification used API `:4100` and web `:3100`. The committed
> defaults remain 4000/3000.

## Backend / database (verified with curl against Postgres)

| Feature | Test | Result |
|---|---|---|
| Database migrations | `prisma migrate dev` applies `init` + `add_reset_tokens_and_stream_provider` | PASS |
| Seed (env-driven admin) | `pnpm db:seed` creates `admin@cityparents.ac.ug` (SUPER_ADMIN) | PASS |
| API boot + Swagger | `GET /api/docs` → 200 | PASS |
| Admin login (JWT) | `POST /api/auth/login` → access token (len 251) | PASS |
| Auth guard | `GET /api/auth/me` with token → `{ SUPER_ADMIN }` | PASS |
| News read | `GET /api/news` → seeded article | PASS |
| News create (RBAC) | `POST /api/news` with token → persisted row | PASS |
| Settings (DB-driven) | `GET /api/settings` → seeded social + contact | PASS |
| Downloads read | `GET /api/downloads` → seeded documents | PASS |
| Statistics read | `GET /api/stats` → seeded ordered stats | PASS |
| Statistics create (RBAC) | `POST /api/stats` with token → persisted | PASS |
| Live create (operator) | `POST /api/live` (provider YOUTUBE) → created | PASS |
| Live manage list (RBAC) | `GET /api/live/manage/list` → all streams | PASS |
| Live start | `POST /api/live/:id/start` → `status=LIVE` | PASS |
| Forgot password | `POST /api/auth/forgot-password` → reset token (len 64) | PASS |
| Reset password | `POST /api/auth/reset-password` → `{ ok: true }` | PASS |
| Login with new password | `POST /api/auth/login` (new password) → token | PASS |

## Frontend (production build + live render)

| Feature | Test | Result |
|---|---|---|
| Web production build | `next build` → all routes compiled, 0 errors | PASS |
| API typecheck | `tsc --noEmit` → exit 0 | PASS |
| Homepage serves | `GET /` → 200 | PASS |
| Dynamic statistics render | Homepage HTML contains seeded `Modern classrooms`, `Proud alumni` | PASS |
| DB-driven social links | Footer HTML contains `youtube.com/@cityparents` (from DB) | PASS |
| School badge renders | Homepage references `/cps.png` crest | PASS |
| No em/en dashes | 0 dash characters in rendered home HTML | PASS |
| Admin screens build | `/admin`, `/admin/statistics`, `/admin/live`, `/admin/settings`, etc. | PASS |

## Not asserted (require external services — see PRODUCTION.md §7)

| Feature | Reason |
|---|---|
| Transactional email delivery | SMTP not configured (reset token returned in dev instead) |
| Binary file upload to R2 | Cloudflare R2 credentials required |
| RTMP ingest → HLS playback | Streaming ingest server required (lifecycle/keys are managed) |
| Social auto-sync pulling | Network API tokens required |
| Mobile device matrix | Responsive layout built mobile-first; not run on a device farm |

## How to reproduce

```bash
docker compose up -d db
pnpm db:generate && pnpm db:build && pnpm db:migrate && pnpm db:seed
pnpm dev:api      # then curl http://localhost:4000/api/docs, /api/stats, etc.
pnpm dev:web      # open http://localhost:3000 and /admin
```
