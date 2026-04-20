ALTER TABLE "CompassResult" ADD COLUMN "scoringVersion" TEXT NOT NULL DEFAULT 'v1';
CREATE INDEX "CompassResult_scoringVersion_idx" ON "CompassResult" ("scoringVersion");
