-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Demande" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "currentPack" TEXT NOT NULL,
    "selectedModules" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "need" TEXT NOT NULL,
    "pricing" TEXT NOT NULL,
    "roiAdai" TEXT NOT NULL,
    "roiClient" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "RoiSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "resourcePool" REAL NOT NULL,
    "structureCost" REAL NOT NULL,
    "directionCost" REAL NOT NULL,
    "externalCosts" REAL NOT NULL,
    "licenseCosts" REAL NOT NULL,
    "otherCosts" REAL NOT NULL,
    "minMarkup" REAL NOT NULL,
    "allocationMode" TEXT NOT NULL,
    "productiveDays" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Demande_publicToken_key" ON "Demande"("publicToken");

-- CreateIndex
CREATE INDEX "Demande_status_idx" ON "Demande"("status");
