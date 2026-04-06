-- Remove dead worksheet counter fields from User table.
-- Usage is now counted dynamically via prisma.worksheet.count() in /api/user/tier.
ALTER TABLE "User" DROP COLUMN IF EXISTS "worksheetsUsed";
ALTER TABLE "User" DROP COLUMN IF EXISTS "worksheetsResetAt";
