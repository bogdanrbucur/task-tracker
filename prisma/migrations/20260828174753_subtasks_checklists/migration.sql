-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "completedById" TEXT,
    CONSTRAINT "ChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChecklistItem_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "assignedToUserId" TEXT,
    "source" TEXT,
    "sourceLink" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "statusId" INTEGER NOT NULL DEFAULT 1,
    "dueDate" DATETIME NOT NULL,
    "originalDueDate" DATETIME NOT NULL,
    "completedOn" DATETIME,
    "completionComment" TEXT,
    "closedOn" DATETIME,
    "dueSoonReminderSent" BOOLEAN NOT NULL DEFAULT false,
    "lastOverdueReminderSentOn" DATETIME,
    "lastReadyForReviewSentOn" DATETIME,
    "parentId" INTEGER,
    CONSTRAINT "Task_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assignedToUserId", "closedOn", "completedOn", "completionComment", "createdAt", "createdByUserId", "description", "dueDate", "dueSoonReminderSent", "id", "lastOverdueReminderSentOn", "lastReadyForReviewSentOn", "originalDueDate", "source", "sourceLink", "statusId", "title", "updatedAt") SELECT "assignedToUserId", "closedOn", "completedOn", "completionComment", "createdAt", "createdByUserId", "description", "dueDate", "dueSoonReminderSent", "id", "lastOverdueReminderSentOn", "lastReadyForReviewSentOn", "originalDueDate", "source", "sourceLink", "statusId", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_assignedToUserId_idx" ON "Task"("assignedToUserId");
CREATE INDEX "Task_title_idx" ON "Task"("title");
CREATE INDEX "Task_statusId_idx" ON "Task"("statusId");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");
CREATE INDEX "Task_source_idx" ON "Task"("source");
CREATE INDEX "Task_assignedToUserId_statusId_idx" ON "Task"("assignedToUserId", "statusId");
CREATE INDEX "Task_parentId_idx" ON "Task"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ChecklistItem_taskId_idx" ON "ChecklistItem"("taskId");
