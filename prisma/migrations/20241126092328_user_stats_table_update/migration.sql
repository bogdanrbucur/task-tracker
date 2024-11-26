/*
  Warnings:

  - You are about to drop the column `noTasksReviewed` on the `userStats` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_userStats" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "noTasksCompleted" INTEGER,
    "noTasksReviewedClosed" INTEGER,
    "noTasksReviewedReopened" INTEGER,
    "noTasksCreated" INTEGER,
    "noTasksCompletedBeforeOriginalDueDate" INTEGER,
    "noTasksCompletedBetweenDueDates" INTEGER,
    "noTasksCompletedAfterDueDate" INTEGER,
    "totalDaysWorkingOnTasks" INTEGER,
    "totalDaysReviewingTasks" INTEGER
);
INSERT INTO "new_userStats" ("noTasksCompleted", "noTasksCompletedAfterDueDate", "noTasksCompletedBeforeOriginalDueDate", "noTasksCompletedBetweenDueDates", "totalDaysReviewingTasks", "totalDaysWorkingOnTasks", "userId") SELECT "noTasksCompleted", "noTasksCompletedAfterDueDate", "noTasksCompletedBeforeOriginalDueDate", "noTasksCompletedBetweenDueDates", "totalDaysReviewingTasks", "totalDaysWorkingOnTasks", "userId" FROM "userStats";
DROP TABLE "userStats";
ALTER TABLE "new_userStats" RENAME TO "userStats";
CREATE UNIQUE INDEX "userStats_userId_key" ON "userStats"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
