DO $$ BEGIN
  CREATE TYPE "EnquirySource" AS ENUM (
    'WEBSITE', 'APPOINTMENT', 'WHATSAPP', 'PHONE', 'GOOGLE', 'INSTAGRAM', 'FACEBOOK', 'REFERRAL', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "subject" TEXT NOT NULL DEFAULT 'General enquiry';
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'WEBSITE';
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "important" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "assignedStaff" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "patientId" TEXT REFERENCES "Patient"("id") ON DELETE SET NULL;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "conversation" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "auditLog" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "Enquiry" SET "status" = 'NEW' WHERE "status" IN ('UNREAD', 'NEW');
UPDATE "Enquiry" SET "status" = 'REPLIED' WHERE "status" = 'READ';

CREATE TABLE IF NOT EXISTS "MessageTemplate" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Enquiry_status_idx" ON "Enquiry"("status");
CREATE INDEX IF NOT EXISTS "Enquiry_source_idx" ON "Enquiry"("source");
CREATE INDEX IF NOT EXISTS "Enquiry_assignedStaff_idx" ON "Enquiry"("assignedStaff");
