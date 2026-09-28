-- Ensure core admin list tables/columns exist (Leads, Patients, Notifications, etc.)

CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "source" TEXT NOT NULL DEFAULT 'WEBSITE',
  "interestedService" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "followUpDate" TIMESTAMPTZ,
  "notes" TEXT,
  "assignedStaff" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "interestedService" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "followUpDate" TIMESTAMPTZ;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignedStaff" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS "Patient" (
  "id" TEXT PRIMARY KEY,
  "patientCode" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "gender" TEXT,
  "dateOfBirth" TIMESTAMPTZ,
  "address" TEXT,
  "medicalNotes" TEXT,
  "treatmentHistory" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead" ("status");
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead" ("createdAt");
