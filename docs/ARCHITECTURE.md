# Architecture

## Overview

The platform is a pnpm monorepo with three deployable/shared units:

- **`apps/web`** — Next.js 15 App Router. Public website + admin dashboard.
  Server Components by default; client components only where interactivity is
  required (e.g. the header drawer). SEO is first-class: dynamic metadata,
  `sitemap.ts`, `robots.ts`, JSON-LD structured data, PWA manifest.
- **`apps/api`** — NestJS 11 REST API. Modular by domain, guarded by JWT + RBAC,
  rate-limited, documented via Swagger at `/api/docs`.
- **`packages/database`** — Prisma schema + generated client, shared by the API
  (and by Next.js server actions where direct DB access is appropriate).

```
Browser ──► Next.js (SSR/RSC, edge-cacheable)
                │
                ├─ public content  ──► NestJS API ──► PostgreSQL (Prisma)
                │                          │
                │                          ├─► Cloudflare R2 (media, docs, recordings)
                │                          ├─► RTMP/HLS streaming service
                │                          └─► Social APIs (YouTube/IG/TikTok/FB/LinkedIn)
                └─ admin dashboard ─► NestJS API (JWT + RBAC + 2FA)
```

## Request & auth flow

1. Admin signs in (`POST /api/auth/login`); if 2FA is enabled, a TOTP code is
   required as a second factor.
2. API returns a short-lived **access JWT** and an opaque **refresh token**
   (hashed at rest in `refresh_tokens`).
3. Protected routes use `JwtAuthGuard` then `RolesGuard`, which reads required
   roles from the `@Roles()` decorator metadata.
4. Every privileged mutation writes to `audit_logs`.

## API module map

Each public/admin domain is a NestJS module following the reference `news`
module (`controller` → `service` → Prisma), with public read endpoints and
RBAC-guarded write endpoints:

`auth` · `users` · `cms` (pages/nav/seo/settings) · `news` · `events` ·
`gallery` · `media` (R2 uploads) · `social` (aggregation + moderation) ·
`careers` (vacancies/applications/interviews) · `admissions` ·
`live` (streams/chat/recordings) · `staff` · `downloads` · `testimonials` ·
`alumni` (profiles/stories/donations) · `stats` · `achievements` · `houses` ·
`magazine` · `alerts` · `contact` · `newsletter` · `academics`.

## Frontend structure

```
apps/web/src/
├── app/                 routes, layout, sitemap/robots/manifest, globals.css
├── components/
│   ├── Icon.tsx         dependency-free SVG icon set (no emojis)
│   ├── Logo.tsx
│   ├── layout/          Header, Footer
│   ├── sections/        page sections (Hero, …)
│   └── ui/              primitives (Button, SectionHeading, …)
└── lib/                 site config, API client, helpers
```

## Cross-cutting concerns

- **Security** — Helmet headers, strict CORS, validation pipe with whitelist,
  throttling, scrypt password hashing, hashed refresh tokens, audit logging,
  security headers in `next.config.ts`.
- **SEO** — dynamic metadata per route, structured data, auto image `alt`
  (stored on `MediaAsset.alt`), sitemap, indexing-API hooks.
- **Accessibility** — semantic landmarks, skip link, visible focus rings,
  `prefers-reduced-motion`, AA contrast on the maroon/gold/white palette.
- **Performance** — RSC, AVIF/WebP images, font preconnect, blurhash placeholders.

## Roadmap beyond Phase 1

1. Remaining public pages (About, Academics, Admissions, News, Gallery,
   Careers, Live, Contact, Alumni, Downloads, Virtual Tour).
2. Admin dashboard shell + CRUD screens per module.
3. Media uploads to R2 + signed URLs.
4. Live streaming control plane (create event → ingest key → HLS → recording).
5. Social aggregation workers + moderation queue.
6. Careers ATS & Admissions portal workflows end-to-end.
7. Parent/Student portals (data model already in place).
