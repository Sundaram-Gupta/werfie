-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "BusinessProfile"
SET "onboardingCompleted" = true
WHERE trim("companyName") <> '';
