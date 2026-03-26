-- AlterTable: Add avatar column to List (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='List' AND column_name='avatar') THEN
    ALTER TABLE "List" ADD COLUMN "avatar" TEXT;
  END IF;
END $$;
