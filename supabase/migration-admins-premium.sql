-- Premium admin management: roles, branch scope, permissions, activity log
-- Run in Supabase SQL editor after backup.

ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'RECEPTIONIST';

ALTER TABLE "Admin"
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "branchId" TEXT REFERENCES "Branch"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "permissions" JSONB,
  ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "Admin_branchId_idx" ON "Admin"("branchId");
CREATE INDEX IF NOT EXISTS "Admin_active_idx" ON "Admin"("active");

CREATE TABLE IF NOT EXISTS "AdminActivityLog" (
  "id" TEXT PRIMARY KEY,
  "adminId" TEXT REFERENCES "Admin"("id") ON DELETE SET NULL,
  "adminName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "entityLabel" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AdminActivityLog_adminId_idx" ON "AdminActivityLog"("adminId");
CREATE INDEX IF NOT EXISTS "AdminActivityLog_createdAt_idx" ON "AdminActivityLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AdminActivityLog_action_idx" ON "AdminActivityLog"("action");
