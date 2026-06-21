-- AlterTable
ALTER TABLE "emergency_alerts" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "linkLabel" TEXT,
ADD COLUMN     "popup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "galleries" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
