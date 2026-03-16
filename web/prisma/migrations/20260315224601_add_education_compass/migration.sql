-- CreateTable
CREATE TABLE "CompassResult" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "dimensionScores" JSONB NOT NULL,
    "philosophyBlend" JSONB NOT NULL,
    "part2Preferences" JSONB NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompassResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subjects" TEXT[],
    "gradeRange" TEXT NOT NULL,
    "philosophyScores" JSONB NOT NULL,
    "prepLevel" TEXT NOT NULL,
    "religiousType" TEXT NOT NULL,
    "faithDepth" TEXT NOT NULL,
    "priceRange" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "affiliateUrl" TEXT,
    "settingFit" TEXT[],
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompassCurriculumPick" (
    "id" TEXT NOT NULL,
    "compassResultId" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "subject" TEXT NOT NULL,

    CONSTRAINT "CompassCurriculumPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompassResult_email_idx" ON "CompassResult"("email");

-- CreateIndex
CREATE INDEX "CompassResult_accountId_idx" ON "CompassResult"("accountId");

-- CreateIndex
CREATE INDEX "Curriculum_active_idx" ON "Curriculum"("active");

-- CreateIndex
CREATE INDEX "CompassCurriculumPick_compassResultId_idx" ON "CompassCurriculumPick"("compassResultId");

-- CreateIndex
CREATE INDEX "CompassCurriculumPick_curriculumId_idx" ON "CompassCurriculumPick"("curriculumId");

-- AddForeignKey
ALTER TABLE "CompassResult" ADD CONSTRAINT "CompassResult_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompassCurriculumPick" ADD CONSTRAINT "CompassCurriculumPick_compassResultId_fkey" FOREIGN KEY ("compassResultId") REFERENCES "CompassResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompassCurriculumPick" ADD CONSTRAINT "CompassCurriculumPick_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
