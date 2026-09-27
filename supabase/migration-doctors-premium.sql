ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "slug" TEXT;
UPDATE "Doctor" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
  WHERE "slug" IS NULL OR "slug" = '';
ALTER TABLE "Doctor" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Doctor_slug_key" ON "Doctor"("slug");

ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "areasOfExpertise" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "languagesSpoken" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "weeklySchedule" JSONB;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "doctorId" TEXT REFERENCES "Doctor"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "Appointment_doctorId_appointmentDate_appointmentTime_idx"
  ON "Appointment"("doctorId", "appointmentDate", "appointmentTime");
