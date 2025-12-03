/*
  Warnings:

  - You are about to drop the column `answer` on the `InterviewQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `intention` on the `InterviewQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `InterviewQuestion` table. All the data in the column will be lost.
  - Added the required column `answerContent` to the `InterviewQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionBody` to the `InterviewQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionTitle` to the `InterviewQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InterviewQuestion" DROP COLUMN "answer",
DROP COLUMN "intention",
DROP COLUMN "question",
ADD COLUMN     "answerContent" TEXT NOT NULL,
ADD COLUMN     "questionBody" TEXT NOT NULL,
ADD COLUMN     "questionTitle" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT[];
