ALTER TABLE public."Media" RENAME TO "PostMedia";
ALTER TABLE public."PostMedia" RENAME COLUMN type TO "mediaType";
ALTER TABLE public."PostMedia" RENAME COLUMN url TO "mediaUrl";
ALTER TABLE public."PostMedia" ADD COLUMN IF NOT EXISTS "thumbnailUrl" text;
ALTER TABLE public."PostMedia" ADD COLUMN IF NOT EXISTS width int DEFAULT 0;
ALTER TABLE public."PostMedia" ADD COLUMN IF NOT EXISTS height int DEFAULT 0;
ALTER TABLE public."PostMedia" ADD COLUMN IF NOT EXISTS duration float;
