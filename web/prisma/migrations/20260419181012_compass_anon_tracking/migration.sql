-- Make email optional and add sessionId for anonymous quiz tracking + later backfill.
ALTER TABLE "CompassResult" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "CompassResult" ADD COLUMN "sessionId" TEXT;

CREATE INDEX "CompassResult_sessionId_idx" ON "CompassResult"("sessionId");
