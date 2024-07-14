-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isAdmin" BOOLEAN DEFAULT false,
    "departmentId" INTEGER,
    "hashedPassword" TEXT,
    "managerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unverified',
    "lastWelcomeEmailSent" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("departmentId", "email", "firstName", "hashedPassword", "id", "isAdmin", "lastName", "lastWelcomeEmailSent", "managerId", "position", "status") SELECT "departmentId", "email", "firstName", "hashedPassword", "id", "isAdmin", "lastName", "lastWelcomeEmailSent", "managerId", "position", "status" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
