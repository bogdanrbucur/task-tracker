-- CreateTable
CREATE TABLE "userStats" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "noTasksCompleted" INTEGER,
    "noTasksReviewed" INTEGER,
    "noTasksCompletedBeforeOriginalDueDate" INTEGER,
    "noTasksCompletedBetweenDueDates" INTEGER,
    "noTasksCompletedAfterDueDate" INTEGER,
    "totalDaysWorkingOnTasks" INTEGER,
    "totalDaysReviewingTasks" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "userStats_userId_key" ON "userStats"("userId");
