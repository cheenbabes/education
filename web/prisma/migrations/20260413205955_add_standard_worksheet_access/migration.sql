-- CreateTable
CREATE TABLE "StandardWorksheetAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "standardWorksheetId" TEXT NOT NULL,
    "lessonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandardWorksheetAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StandardWorksheetAccess_userId_createdAt_idx" ON "StandardWorksheetAccess"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StandardWorksheetAccess_lessonId_createdAt_idx" ON "StandardWorksheetAccess"("lessonId", "createdAt");

-- CreateIndex
CREATE INDEX "StandardWorksheetAccess_standardWorksheetId_createdAt_idx" ON "StandardWorksheetAccess"("standardWorksheetId", "createdAt");

-- AddForeignKey
ALTER TABLE "StandardWorksheetAccess" ADD CONSTRAINT "StandardWorksheetAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardWorksheetAccess" ADD CONSTRAINT "StandardWorksheetAccess_standardWorksheetId_fkey" FOREIGN KEY ("standardWorksheetId") REFERENCES "StandardWorksheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardWorksheetAccess" ADD CONSTRAINT "StandardWorksheetAccess_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
