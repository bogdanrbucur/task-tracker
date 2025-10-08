/*
  Warnings:

  - You are about to drop the column `toEmail` on the `EmailOutbox` table. All the data in the column will be lost.
  - Added the required column `recipient` to the `EmailOutbox` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipient" TEXT NOT NULL,
    "cc" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyPlain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastError" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "nextTryAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME
);
INSERT INTO "new_EmailOutbox" ("attempts", "bodyHtml", "bodyPlain", "createdAt", "id", "idempotencyKey", "lastError", "maxAttempts", "nextTryAt", "sentAt", "status", "subject") SELECT "attempts", "bodyHtml", "bodyPlain", "createdAt", "id", "idempotencyKey", "lastError", "maxAttempts", "nextTryAt", "sentAt", "status", "subject" FROM "EmailOutbox";
DROP TABLE "EmailOutbox";
ALTER TABLE "new_EmailOutbox" RENAME TO "EmailOutbox";
CREATE UNIQUE INDEX "EmailOutbox_idempotencyKey_key" ON "EmailOutbox"("idempotencyKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
