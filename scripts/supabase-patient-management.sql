-- Shiv Dental Clinic — Patient Management (run in Supabase SQL editor after backup)

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "pinCode" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "preferredBranchId" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "assignedDoctorId" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "commWhatsApp" BOOLEAN DEFAULT true;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "commPhone" BOOLEAN DEFAULT true;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "commEmail" BOOLEAN DEFAULT false;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "allergies" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "dentalHistory" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "diagnosis" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "treatmentPlan" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "followUpInstructions" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "examinationNotes" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "consent" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMPTZ;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "archivedBy" TEXT;

CREATE TABLE IF NOT EXISTS "PatientTreatment" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "treatmentName" TEXT NOT NULL,
  "doctorId" TEXT,
  "doctorName" TEXT,
  "treatmentDate" TIMESTAMPTZ NOT NULL,
  "toothArea" TEXT,
  "diagnosis" TEXT,
  "notes" TEXT,
  "followUpDate" TIMESTAMPTZ,
  "status" TEXT DEFAULT 'COMPLETED',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "PatientDocument" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "category" TEXT DEFAULT 'OTHER',
  "title" TEXT,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "uploadedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "PatientPayment" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "treatmentName" TEXT,
  "amountBilled" NUMERIC(12,2) NOT NULL,
  "amountPaid" NUMERIC(12,2) DEFAULT 0,
  "method" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "invoiceRef" TEXT,
  "notes" TEXT,
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "PatientActivity" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT,
  "at" TIMESTAMPTZ DEFAULT now(),
  "createdBy" TEXT
);

CREATE INDEX IF NOT EXISTS "Patient_phone_idx" ON "Patient"("phone");
CREATE INDEX IF NOT EXISTS "Patient_status_idx" ON "Patient"("status");
