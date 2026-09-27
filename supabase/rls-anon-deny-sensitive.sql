-- Defense in depth: block anonymous (publishable key without JWT) access to sensitive tables.
-- The Next.js server uses the service role; public reads go through API routes.
-- Run after rls-authenticated-admin.sql: npm run supabase:apply-rls (includes this file when applied via script update)

ALTER TABLE IF EXISTS "Admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Enquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ClinicSettings" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Admin','Patient','Lead','Enquiry','Appointment','Notification','ClinicSettings'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS deny_anon ON %I', t);
    EXECUTE format(
      'CREATE POLICY deny_anon ON %I FOR ALL TO anon USING (false) WITH CHECK (false)',
      t
    );
  END LOOP;
END $$;
