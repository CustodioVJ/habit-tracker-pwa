-- Convert check_ins.date from TIMESTAMP(3) to a plain YYYY-MM-DD string.
-- This eliminates timezone conversion issues between the server and the DB,
-- so a check-in stored for the user's local date always matches that date.

-- Drop the existing unique index and index that reference the old column.
DROP INDEX IF EXISTS "check_ins_habit_id_date_key";
DROP INDEX IF EXISTS "check_ins_habit_id_date_idx";

-- Add a temporary string column and backfill it from the timestamp column.
ALTER TABLE "check_ins" ADD COLUMN "date_str" TEXT;
UPDATE "check_ins" SET "date_str" = to_char("date", 'YYYY-MM-DD');
ALTER TABLE "check_ins" ALTER COLUMN "date_str" SET NOT NULL;

-- Drop the old timestamp column.
ALTER TABLE "check_ins" DROP COLUMN "date";

-- Rename the new column to "date".
ALTER TABLE "check_ins" RENAME COLUMN "date_str" TO "date";

-- Recreate the unique index and index on the new string column.
CREATE UNIQUE INDEX "check_ins_habit_id_date_key" ON "check_ins"("habit_id", "date");
CREATE INDEX "check_ins_habit_id_date_idx" ON "check_ins"("habit_id", "date");
