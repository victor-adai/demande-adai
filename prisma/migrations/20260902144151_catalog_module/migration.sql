-- CreateTable
CREATE TABLE "CatalogModule" (
    "moduleId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "build" REAL NOT NULL,
    "maint" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);
