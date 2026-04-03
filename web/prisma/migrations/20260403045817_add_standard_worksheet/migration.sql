-- CreateTable
CREATE TABLE "StandardWorksheet" (
    "id" TEXT NOT NULL,
    "clusterKey" TEXT NOT NULL,
    "clusterTitle" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "worksheetNum" INTEGER NOT NULL,
    "worksheetType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "standardCodes" TEXT[],
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandardWorksheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StandardWorksheet_grade_subject_idx" ON "StandardWorksheet"("grade", "subject");

-- CreateIndex
CREATE INDEX "StandardWorksheet_clusterKey_idx" ON "StandardWorksheet"("clusterKey");

-- CreateIndex
CREATE UNIQUE INDEX "StandardWorksheet_clusterKey_worksheetNum_key" ON "StandardWorksheet"("clusterKey", "worksheetNum");
