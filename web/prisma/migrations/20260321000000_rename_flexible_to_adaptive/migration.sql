-- Rename philosophy key "eclectic_flexible" to "adaptive" in all curriculum records.
-- This migration updates the JSONB philosophyScores column in-place.
UPDATE "Curriculum"
SET "philosophyScores" = ("philosophyScores" - 'eclectic_flexible') || jsonb_build_object('adaptive', "philosophyScores" -> 'eclectic_flexible')
WHERE "philosophyScores" ? 'eclectic_flexible';
