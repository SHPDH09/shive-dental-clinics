-- Communications v2: threads, extended logs, template enabled, automation runs

ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN DEFAULT true;

ALTER TABLE "CommunicationLog" ADD COLUMN IF NOT EXISTS "messageType" TEXT DEFAULT 'GENERAL';
ALTER TABLE "CommunicationLog" ADD COLUMN IF NOT EXISTS "threadId" TEXT;
ALTER TABLE "CommunicationLog" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "CommunicationLog" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;
ALTER TABLE "CommunicationLog" ADD COLUMN IF NOT EXISTS "sentByStaffName" TEXT;

CREATE INDEX IF NOT EXISTS "CommunicationLog_thread_idx" ON "CommunicationLog"("threadId");
CREATE INDEX IF NOT EXISTS "CommunicationLog_campaign_idx" ON "CommunicationLog"("campaignId");

CREATE TABLE IF NOT EXISTS "CommunicationThread" (
  "id" TEXT PRIMARY KEY,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "contactName" TEXT NOT NULL,
  "contactPhone" TEXT,
  "contactEmail" TEXT,
  "patientId" TEXT,
  "leadId" TEXT,
  "enquiryId" TEXT,
  "branchId" TEXT,
  "assignedAdminId" TEXT,
  "assignedStaffName" TEXT,
  "unreadCount" INTEGER DEFAULT 0,
  "important" BOOLEAN DEFAULT false,
  "lastMessage" TEXT,
  "lastMessageAt" TIMESTAMPTZ DEFAULT now(),
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "CommunicationThread_list_idx" ON "CommunicationThread"("lastMessageAt" DESC);
CREATE INDEX IF NOT EXISTS "CommunicationThread_channel_status_idx" ON "CommunicationThread"("channel", "status");
CREATE INDEX IF NOT EXISTS "CommunicationThread_patient_idx" ON "CommunicationThread"("patientId");
CREATE INDEX IF NOT EXISTS "CommunicationThread_lead_idx" ON "CommunicationThread"("leadId");

CREATE TABLE IF NOT EXISTS "CommunicationThreadMessage" (
  "id" TEXT PRIMARY KEY,
  "threadId" TEXT NOT NULL REFERENCES "CommunicationThread"("id") ON DELETE CASCADE,
  "direction" TEXT NOT NULL,
  "channel" TEXT,
  "body" TEXT NOT NULL,
  "senderLabel" TEXT,
  "sentByAdminId" TEXT,
  "communicationLogId" TEXT,
  "readAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "CommunicationThreadMessage_thread_idx" ON "CommunicationThreadMessage"("threadId", "createdAt");

CREATE TABLE IF NOT EXISTS "CommunicationAutomationRun" (
  "id" TEXT PRIMARY KEY,
  "automationId" TEXT NOT NULL REFERENCES "CommunicationAutomation"("id") ON DELETE CASCADE,
  "status" TEXT DEFAULT 'SUCCESS',
  "detail" TEXT,
  "recipientCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "CommunicationAutomationRun_auto_idx" ON "CommunicationAutomationRun"("automationId", "createdAt" DESC);

NOTIFY pgrst, 'reload schema';
