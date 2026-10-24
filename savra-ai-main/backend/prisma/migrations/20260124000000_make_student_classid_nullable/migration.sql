-- AlterTable: Make classId nullable for students
-- This allows students to register without a class assignment

ALTER TABLE "students" ALTER COLUMN "class_id" DROP NOT NULL;
