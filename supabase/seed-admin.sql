-- Run once in Supabase Dashboard → SQL Editor (creates Admin + super admin login).
DO $$ BEGIN
  CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'STAFF');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Admin" (
  id TEXT PRIMARY KEY,
  "loginId" TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  "passwordHash" TEXT NOT NULL,
  role "AdminRole" NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DELETE FROM "Admin" WHERE "loginId" = 'rk331159@gmail.com' OR email = 'rk331159@gmail.com';

INSERT INTO "Admin" (id, "loginId", name, email, "passwordHash", role, "createdAt", "updatedAt")
VALUES (
  'clshivadmin001',
  'rk331159@gmail.com',
  'Shiv Dental Admin',
  'rk331159@gmail.com',
  '$2b$12$svUu7j0Khulaq9hpHChUFuBeBz0LOsnrrLFeMdTVwAO.sZUnzsoCC',
  'SUPER_ADMIN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
