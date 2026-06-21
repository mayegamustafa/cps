-- AlterTable
ALTER TABLE "admission_applications" ADD COLUMN     "extraData" JSONB;

-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "extraData" JSONB;

-- AlterTable
ALTER TABLE "job_vacancies" ADD COLUMN     "applicationFields" JSONB NOT NULL DEFAULT '[]';
