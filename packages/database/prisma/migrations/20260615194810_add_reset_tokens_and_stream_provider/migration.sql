-- CreateEnum
CREATE TYPE "StreamProvider" AS ENUM ('YOUTUBE', 'FACEBOOK', 'ZOOM', 'RTMP');

-- AlterTable
ALTER TABLE "live_streams" ADD COLUMN     "embedUrl" TEXT,
ADD COLUMN     "provider" "StreamProvider" NOT NULL DEFAULT 'RTMP';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" TEXT;
