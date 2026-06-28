-- Extend audit_logs with actor/email/status/user-agent for a richer trail
ALTER TABLE "audit_logs" ADD COLUMN     "actorEmail" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ok';
ALTER TABLE "audit_logs" ADD COLUMN     "userAgent" TEXT;
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- First-party visitor analytics
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "device" TEXT NOT NULL DEFAULT 'desktop',
    "browser" TEXT NOT NULL DEFAULT 'Unknown',
    "os" TEXT NOT NULL DEFAULT 'Unknown',
    "country" TEXT,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isNewVisitor" BOOLEAN NOT NULL DEFAULT true,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");
CREATE INDEX "page_views_path_idx" ON "page_views"("path");
CREATE INDEX "page_views_sessionId_idx" ON "page_views"("sessionId");
