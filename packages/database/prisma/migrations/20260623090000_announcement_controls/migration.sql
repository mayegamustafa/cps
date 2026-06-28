-- Richer, smarter announcements
ALTER TABLE "emergency_alerts" ADD COLUMN     "title" TEXT;
ALTER TABLE "emergency_alerts" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "emergency_alerts" ADD COLUMN     "eventDate" TIMESTAMP(3);
ALTER TABLE "emergency_alerts" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "emergency_alerts" ADD COLUMN     "audience" TEXT NOT NULL DEFAULT 'all';
ALTER TABLE "emergency_alerts" ADD COLUMN     "pages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "emergency_alerts" ADD COLUMN     "device" TEXT NOT NULL DEFAULT 'all';
ALTER TABLE "emergency_alerts" ADD COLUMN     "frequency" TEXT NOT NULL DEFAULT 'session';
