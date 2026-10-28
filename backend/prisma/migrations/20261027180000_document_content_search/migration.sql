DO $$
BEGIN
    CREATE TYPE "DocumentStatus" AS ENUM ('PROCESSING', 'INDEXED', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "Document" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "author" VARCHAR(120) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "version" VARCHAR(40) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "searchVector" tsvector,
    "fileName" VARCHAR(255) NOT NULL,
    "storageName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Document"
    ADD COLUMN IF NOT EXISTS "content" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Document"
    ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

CREATE UNIQUE INDEX IF NOT EXISTS "Document_storageName_key"
    ON "Document"("storageName");

CREATE INDEX IF NOT EXISTS "Document_createdAt_idx"
    ON "Document"("createdAt");

CREATE OR REPLACE FUNCTION update_document_search_vector() RETURNS trigger AS $$
BEGIN
    NEW."searchVector" :=
        setweight(to_tsvector('simple', coalesce(NEW."title", '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW."author", '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(NEW."category", '')), 'B') ||
        setweight(to_tsvector('simple', array_to_string(NEW."tags", ' ')), 'B') ||
        setweight(to_tsvector('simple', coalesce(NEW."content", '')), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "Document_searchVector_update" ON "Document";

CREATE TRIGGER "Document_searchVector_update"
BEFORE INSERT OR UPDATE OF "title", "author", "category", "tags", "content"
ON "Document"
FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

UPDATE "Document"
SET "searchVector" =
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("author", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("category", '')), 'B') ||
    setweight(to_tsvector('simple', array_to_string("tags", ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce("content", '')), 'C');

CREATE INDEX IF NOT EXISTS "Document_searchVector_idx"
    ON "Document" USING GIN ("searchVector");
