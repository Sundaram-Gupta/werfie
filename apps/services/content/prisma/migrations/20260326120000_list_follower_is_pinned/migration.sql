-- Per-user pin for followed lists (owner pin remains on List.isPinned)
ALTER TABLE "ListFollower" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
