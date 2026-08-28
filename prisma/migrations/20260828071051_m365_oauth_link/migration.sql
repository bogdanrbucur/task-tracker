-- AlterTable
ALTER TABLE "User" ADD COLUMN "entraLinkedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "entraOid" TEXT;
ALTER TABLE "User" ADD COLUMN "entraUpn" TEXT;

-- CreateIndex
-- SQLite treats NULLs as distinct, so unlinked users all keep a NULL entraOid.
CREATE UNIQUE INDEX "User_entraOid_key" ON "User"("entraOid");
