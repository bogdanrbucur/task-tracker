/*
  Warnings:

  - Made the column `displayName` on table `Status` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Status" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "color" TEXT NOT NULL
);
INSERT INTO "new_Status" ("color", "displayName", "id", "name") SELECT "color", "displayName", "id", "name" FROM "Status";
DROP TABLE "Status";
ALTER TABLE "new_Status" RENAME TO "Status";
CREATE UNIQUE INDEX "Status_name_key" ON "Status"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
