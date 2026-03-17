UPDATE public."PostMedia" SET width = 0 WHERE width IS NULL;
UPDATE public."PostMedia" SET height = 0 WHERE height IS NULL;
ALTER TABLE public."PostMedia" ALTER COLUMN width SET NOT NULL;
ALTER TABLE public."PostMedia" ALTER COLUMN height SET NOT NULL;
