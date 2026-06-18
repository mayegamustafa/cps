# ── City Parents API (NestJS) ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
RUN pnpm install --frozen-lockfile=false

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @cps/database generate \
 && pnpm --filter @cps/database build \
 && pnpm --filter @cps/api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages ./packages
COPY docker/api-entrypoint.sh /app/docker/api-entrypoint.sh
RUN chmod +x /app/docker/api-entrypoint.sh
EXPOSE 4000
# On boot: apply migrations, seed (idempotent), then start the API.
CMD ["/app/docker/api-entrypoint.sh"]
