# ── City Parents API (NestJS) ──
# Single-stage build: install the whole pnpm workspace in-image so per-package
# binaries (prisma, nest) and workspace links (@cps/database) all resolve.
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile=false \
 && pnpm --filter @cps/database generate \
 && pnpm --filter @cps/database build \
 && pnpm --filter @cps/api build

ENV NODE_ENV=production
EXPOSE 4000
# On boot: apply migrations, seed (idempotent), then start the API.
CMD ["sh", "docker/api-entrypoint.sh"]
