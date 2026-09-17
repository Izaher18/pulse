-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Monitor" ADD COLUMN "slug" TEXT;

-- Backfill from existing names so the column can become NOT NULL.
UPDATE "Monitor"
SET "slug" = trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'));

-- A name with no usable characters leaves an empty slug; fall back to the id.
UPDATE "Monitor"
SET "slug" = "id"
WHERE "slug" IS NULL OR "slug" = '';

-- Two monitors can share a name, which the unique index below would reject.
UPDATE "Monitor" m
SET "slug" = m."slug" || '-' || m."id"
WHERE EXISTS (
  SELECT 1
  FROM "Monitor" other
  WHERE other."slug" = m."slug"
    AND other."id" <> m."id"
);

ALTER TABLE "Monitor" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Monitor_slug_key" ON "Monitor"("slug");
