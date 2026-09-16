-- Image-only announcements: the picture alone, with no badge, heading or buttons
ALTER TABLE "emergency_alerts" ADD COLUMN     "layout" TEXT NOT NULL DEFAULT 'card';
ALTER TABLE "emergency_alerts" ADD COLUMN     "showInBanner" BOOLEAN NOT NULL DEFAULT true;
-- A poster carries no words, so the message is no longer required
ALTER TABLE "emergency_alerts" ALTER COLUMN "message" SET DEFAULT '';
