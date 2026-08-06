-- DropIndex
DROP INDEX "Task_description_idx";

-- CreateTable
CREATE TABLE "DescriptionImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" INTEGER,
    "path" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "DescriptionImage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DescriptionImage_taskId_idx" ON "DescriptionImage"("taskId");

-- CreateIndex
CREATE INDEX "DescriptionImage_createdAt_idx" ON "DescriptionImage"("createdAt");
