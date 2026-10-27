CREATE TYPE "DocumentStatus" AS ENUM ('PROCESSING', 'INDEXED', 'ERROR');

CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "author" VARCHAR(120) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" VARCHAR(40) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "storageName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Document_storageName_key" ON "Document"("storageName");
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");
