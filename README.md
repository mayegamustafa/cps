# City Parents School — Digital Experience Platform

A production-grade, enterprise web platform for **City Parents School**, Kampala —
not a brochure website but a full school digital ecosystem: public site, content
management, admissions & careers portals, self-owned live streaming, social
aggregation, alumni community, and an admin control plane.

Brand: **Maroon · Gold · White**. Premium, editorial, accessible (WCAG AA),
mobile-first, SEO-first. No emojis — professional SVG iconography only.

---

## Monorepo layout

```
city-parents/
├── apps/
│   ├── web/            Next.js 15 · React 19 · Tailwind v4 (public site + admin)
│   └── api/            NestJS 11 · JWT/RBAC/2FA · Swagger
├── packages/
│   └── database/       Prisma schema, client, migrations, seed
├── docs/               Architecture, database, deployment
├── docker-compose.yml  Local full-stack (db + api + web)
└── .github/workflows/  CI pipeline
```

## Tech stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind v4 |
| Backend  | NestJS 11, PostgreSQL 16, Prisma ORM 6                 |
| Auth     | JWT (access/refresh), RBAC, TOTP 2FA, OAuth-ready      |
| Storage  | Cloudflare R2 (S3-compatible)                          |
| Streaming| RTMP ingest + HLS delivery, automatic recording        |
| Infra    | Docker, GitHub Actions CI, Cloudflare deploy           |

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env        # fill in secrets

# 3. Start PostgreSQL (Docker)
docker compose up -d db

# 4. Set up the database
pnpm db:generate
pnpm db:migrate
pnpm db:seed                 # creates admin@cityparents.sc.ug / ChangeMe!2026

# 5. Run the apps
pnpm dev:web                 # http://localhost:3000
pnpm dev:api                 # http://localhost:4000/api  (Swagger: /api/docs)
```

Run the full stack in containers with `pnpm docker:up`.

## Roles (RBAC)

`SUPER_ADMIN` · `MARKETING_ADMIN` · `ADMISSIONS_ADMIN` · `HR_ADMIN` ·
`FINANCE_ADMIN` · `CONTENT_EDITOR` — plus phase-2 self-service roles `PARENT`,
`ALUMNUS`, `STUDENT`.

## Build status

| Deliverable | State |
| --- | --- |
| Database schema (all modules + phase-2 portals) | Complete |
| Prisma models & seed | Complete |
| Brand design system & UI primitives | Complete |
| Public website — all 12 modules + dynamic detail pages | Complete |
| Interactive forms (contact, admissions, careers) | Complete |
| Admin dashboard (login + 10 module screens, RBAC shell) | Complete |
| Auth: JWT + RBAC + 2FA | Complete |
| API modules: news, contact, admissions, events, careers, live, social, downloads | Complete |
| Docker, CI, deployment scaffolding, docs | Complete |
| Phase 3: R2 upload wiring, RTMP/HLS plumbing, social workers, live-data swap, tests | Roadmapped — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |

> Build verified: `pnpm build` generates 29 web routes and compiles the API; all
> sampled routes serve HTTP 200. Public pages currently read demo content from
> `apps/web/src/lib/content.ts` (shapes mirror the DB) — swap to live API calls
> per module.

See [docs/](docs/) for architecture, the data model, and deployment.
