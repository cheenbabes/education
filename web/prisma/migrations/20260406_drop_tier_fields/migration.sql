-- Billing state now read directly from Clerk API. These fields are no longer needed.
ALTER TABLE "User" DROP COLUMN IF EXISTS "tier";
ALTER TABLE "User" DROP COLUMN IF EXISTS "billingCycleStart";
ALTER TABLE "User" DROP COLUMN IF EXISTS "tierExpiresAt";
