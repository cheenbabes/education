-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "subjectNames" TEXT[] DEFAULT ARRAY[]::TEXT[];
