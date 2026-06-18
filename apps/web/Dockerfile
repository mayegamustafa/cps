# ── City Parents Web (Next.js 15, standalone output) ──
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# NEXT_PUBLIC_* must be present at build time (baked into the bundle).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY . .
RUN pnpm install --frozen-lockfile=false \
 && pnpm --filter @cps/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Standalone bundle is self-contained (its own minimal node_modules).
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
