-- Add missing columns for Prisma schema compatibility
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "institutionType" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN DEFAULT false;
