-- Shiv Dental Clinic — Communications CRM (run in Supabase SQL editor after backup)

ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "channel" TEXT DEFAULT 'EMAIL';
ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'GENERAL';
ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "variables" JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS "CommunicationLog" (
  "id" TEXT PRIMARY KEY,
  "channel" TEXT NOT NULL,
  "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "recipientName" TEXT,
  "recipientPhone" TEXT,
  "recipientEmail" TEXT,
  "patientId" TEXT,
  "leadId" TEXT,
  "enquiryId" TEXT,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "templateSlug" TEXT,
  "failureReason" TEXT,
  "externalId" TEXT,
  "sentByAdminId" TEXT,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "CommunicationLog_channel_status_idx" ON "CommunicationLog"("channel", "status");
CREATE INDEX IF NOT EXISTS "CommunicationLog_patient_idx" ON "CommunicationLog"("patientId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CommunicationLog_lead_idx" ON "CommunicationLog"("leadId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CommunicationLog_created_idx" ON "CommunicationLog"("createdAt" DESC);

CREATE TABLE IF NOT EXISTS "CommunicationAutomation" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "enabled" BOOLEAN DEFAULT true,
  "timingLabel" TEXT,
  "offsetMinutes" INTEGER,
  "templateSlug" TEXT,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("trigger", "channel")
);

CREATE TABLE IF NOT EXISTS "CommunicationCampaign" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT DEFAULT 'DRAFT',
  "audienceFilter" JSONB DEFAULT '{}'::jsonb,
  "messageBody" TEXT,
  "templateSlug" TEXT,
  "recipientCount" INTEGER DEFAULT 0,
  "scheduledAt" TIMESTAMPTZ,
  "sentCount" INTEGER DEFAULT 0,
  "failedCount" INTEGER DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "CommunicationCampaign_status_idx" ON "CommunicationCampaign"("status");

NOTIFY pgrst, 'reload schema';
