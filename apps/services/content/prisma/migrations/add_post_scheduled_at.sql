-- Add scheduledAt column for post scheduling
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
