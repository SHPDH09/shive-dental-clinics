CREATE TABLE IF NOT EXISTS "HeroSlide" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "imageUrl" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT ALL ON TABLE "HeroSlide" TO authenticated;
GRANT ALL ON TABLE "HeroSlide" TO service_role;

NOTIFY pgrst, 'reload schema';
