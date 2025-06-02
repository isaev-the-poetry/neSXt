/*
  Warnings:

  - You are about to drop the `auth_providers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `providerId` on the `user_providers` table. All the data in the column will be lost.
  - Added the required column `provider` to the `user_providers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "auth_providers_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "auth_providers";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerData" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_providers" ("createdAt", "id", "isActive", "lastUsed", "providerData", "providerUserId", "updatedAt", "userId") SELECT "createdAt", "id", "isActive", "lastUsed", "providerData", "providerUserId", "updatedAt", "userId" FROM "user_providers";
DROP TABLE "user_providers";
ALTER TABLE "new_user_providers" RENAME TO "user_providers";
CREATE UNIQUE INDEX "user_providers_provider_providerUserId_key" ON "user_providers"("provider", "providerUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
