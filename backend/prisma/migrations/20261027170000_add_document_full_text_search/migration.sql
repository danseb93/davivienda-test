ALTER TABLE "Document"
ADD COLUMN "content" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Document"
ADD COLUMN "searchVector" tsvector;

CREATE FUNCTION update_document_search_vector() RETURNS trigger AS $$
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

CREATE INDEX "Document_searchVector_idx" ON "Document" USING GIN ("searchVector");
