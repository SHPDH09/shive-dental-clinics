-- Admin email inbox/sent archive (Gmail sync + outbound copies)
CREATE TABLE IF NOT EXISTS "MailboxMessage" (
  "id" TEXT PRIMARY KEY,
  "folder" TEXT NOT NULL DEFAULT 'inbox',
  "imapUid" BIGINT,
  "fromAddress" TEXT NOT NULL,
  "toAddresses" JSONB NOT NULL DEFAULT '[]',
  "ccAddresses" JSONB NOT NULL DEFAULT '[]',
  "subject" TEXT NOT NULL DEFAULT '',
  "bodyText" TEXT,
  "bodyHtml" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "starred" BOOLEAN NOT NULL DEFAULT false,
  "sentAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "MailboxMessage_folder_sentAt_idx" ON "MailboxMessage" ("folder", "sentAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "MailboxMessage_imapUid_folder_key" ON "MailboxMessage" ("folder", "imapUid") WHERE "imapUid" IS NOT NULL;

ALTER TABLE "MailboxMessage" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_anon ON "MailboxMessage";
CREATE POLICY deny_anon ON "MailboxMessage" FOR ALL TO anon USING (false) WITH CHECK (false);
