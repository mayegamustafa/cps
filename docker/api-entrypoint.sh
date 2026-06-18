#!/bin/sh
set -e

# Apply pending migrations and seed baseline data (idempotent), then start.
echo "[entrypoint] Applying database migrations..."
pnpm --filter @cps/database exec prisma migrate deploy

echo "[entrypoint] Seeding baseline data (idempotent)..."
pnpm --filter @cps/database seed || echo "[entrypoint] Seed skipped/failed (continuing)"

echo "[entrypoint] Starting API..."
cd /app/apps/api
exec node dist/main.js
