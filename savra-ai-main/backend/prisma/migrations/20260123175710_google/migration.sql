/*
  Warnings:

  - The `question_type` column on the `questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[subject_id,name,grade]` on the table `chapters` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `question_type` on the `assessment_question_types` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "assessment_question_types" DROP COLUMN "question_type",
ADD COLUMN     "question_type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "grade" INTEGER NOT NULL DEFAULT 6;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "question_type",
ADD COLUMN     "question_type" TEXT NOT NULL DEFAULT 'mcq';

-- DropEnum
DROP TYPE "QuestionType";

-- CreateTable
CREATE TABLE "student_subjects" (
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,

    CONSTRAINT "student_subjects_pkey" PRIMARY KEY ("student_id","subject_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chapters_subject_id_name_grade_key" ON "chapters"("subject_id", "name", "grade");

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
