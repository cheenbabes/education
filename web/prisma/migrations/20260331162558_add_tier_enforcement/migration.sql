-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'compass',
ADD COLUMN     "tierExpiresAt" TIMESTAMP(3),
ADD COLUMN     "worksheetsResetAt" TIMESTAMP(3),
ADD COLUMN     "worksheetsUsed" INTEGER NOT NULL DEFAULT 0;
