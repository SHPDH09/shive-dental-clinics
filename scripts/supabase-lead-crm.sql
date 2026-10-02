-- Shiv Dental Clinic — Lead CRM (run in Supabase SQL editor after backup)

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "leadCode" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "whatsAppNumber" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "age" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "sourceCustom" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "preferredBranchId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "preferredDoctorId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'MEDIUM';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "followUpTime" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastContactAt" TIMESTAMPTZ;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "patientId" TEXT;

UPDATE "Lead" SET "leadCode" = 'LEAD-' || LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt")::text, 6, '0')
WHERE "leadCode" IS NULL OR "leadCode" = '';

CREATE UNIQUE INDEX IF NOT EXISTS "Lead_leadCode_key" ON "Lead"("leadCode");

CREATE TABLE IF NOT EXISTS "LeadActivity" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT,
  "at" TIMESTAMPTZ DEFAULT now(),
  "createdBy" TEXT
);

CREATE INDEX IF NOT EXISTS "Lead_followUpDate_idx" ON "Lead"("followUpDate");
CREATE INDEX IF NOT EXISTS "Lead_phone_idx" ON "Lead"("phone");
