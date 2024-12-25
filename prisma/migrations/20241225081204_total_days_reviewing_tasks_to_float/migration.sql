/*
  Warnings:

  - You are about to alter the column `totalDaysReviewingTasks` on the `userStats` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

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
    "noTasksCancelled" INTEGER,
    "noTasksCompletedBeforeOriginalDueDate" INTEGER,
    "noTasksCompletedBetweenDueDates" INTEGER,
    "noTasksCompletedAfterDueDate" INTEGER,
    "totalDaysWorkingOnTasks" INTEGER,
    "totalDaysReviewingTasks" REAL
);
INSERT INTO "new_userStats" ("noTasksCancelled", "noTasksCompleted", "noTasksCompletedAfterDueDate", "noTasksCompletedBeforeOriginalDueDate", "noTasksCompletedBetweenDueDates", "noTasksCreated", "noTasksReviewedClosed", "noTasksReviewedReopened", "totalDaysReviewingTasks", "totalDaysWorkingOnTasks", "userId") SELECT "noTasksCancelled", "noTasksCompleted", "noTasksCompletedAfterDueDate", "noTasksCompletedBeforeOriginalDueDate", "noTasksCompletedBetweenDueDates", "noTasksCreated", "noTasksReviewedClosed", "noTasksReviewedReopened", "totalDaysReviewingTasks", "totalDaysWorkingOnTasks", "userId" FROM "userStats";
DROP TABLE "userStats";
ALTER TABLE "new_userStats" RENAME TO "userStats";
CREATE UNIQUE INDEX "userStats_userId_key" ON "userStats"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
