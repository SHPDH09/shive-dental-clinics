import { requirePermission } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { findDuplicatePatients, listPatientsEnriched } from "@/lib/patients/build-patient-dashboard";
import { logPatientActivity } from "@/lib/patients/patient-activity";
import { generatePatientCode } from "@/lib/patients/patient-code";
import { canViewPatientClinical } from "@/lib/patients/patient-access";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseCreate, supabaseList } from "@/lib/supabase/crud";
import { patientSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

function mapPatientCreateData(data: ReturnType<typeof patientSchema.parse>) {
  return {
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    gender: data.gender || null,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    profilePhoto: data.profilePhoto || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    pinCode: data.pinCode || null,
    emergencyContactName: data.emergencyContactName || null,
    emergencyContactPhone: data.emergencyContactPhone || null,
    preferredBranchId: data.preferredBranchId || null,
    assignedDoctorId: data.assignedDoctorId || null,
    commWhatsApp: data.commWhatsApp ?? true,
    commPhone: data.commPhone ?? true,
    commEmail: data.commEmail ?? false,
    status: data.status ?? "ACTIVE",
    medicalNotes: data.medicalNotes || null,
    treatmentHistory: data.treatmentHistory || null,
    allergies: data.allergies || null,
    dentalHistory: data.dentalHistory || null,
    diagnosis: data.diagnosis || null,
    treatmentPlan: data.treatmentPlan || null,
    followUpInstructions: data.followUpInstructions || null,
    examinationNotes: data.examinationNotes || null,
    consent: data.consent ?? {},
  };
}

export async function GET(req: Request) {
  const { error } = await requirePermission("patients", "view");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const filter = searchParams.get("filter")?.trim();

  try {
    if (!canUseSupabaseDataLayer()) {
      const { items, total } = await listPatientsEnriched({
        page,
        limit,
        q,
        status: status || undefined,
        filter: filter || undefined,
        branchId: searchParams.get("branchId") ?? undefined,
        doctorId: searchParams.get("doctorId") ?? undefined,
      });
      return NextResponse.json({ items, total, page, limit });
    }

    const { items, total } = await supabaseList("patient", {
      page,
      limit,
      q,
      searchFields: q ? ["name", "phone", "email", "patientCode"] : undefined,
    });
    const mapped = (items as Record<string, unknown>[]).map((p) => ({
      id: String(p.id),
      patientCode: String(p.patientCode ?? ""),
      name: String(p.name ?? ""),
      profilePhoto: (p.profilePhoto as string | null) ?? null,
      age: null,
      gender: (p.gender as string | null) ?? null,
      phone: String(p.phone ?? ""),
      email: (p.email as string | null) ?? null,
      branchName: null,
      lastVisit: null,
      nextAppointment: null,
      status: String(p.status ?? "ACTIVE"),
    }));
    return NextResponse.json({ items: mapped, total, page, limit });
  } catch (e) {
    console.error("GET /api/admin/patients:", e);
    return NextResponse.json({ items: [], total: 0, page, limit });
  }
}

export async function POST(req: Request) {
  const { session, error } = await requirePermission("patients", "create");
  if (error) return error;

  const body = await req.json();
  const parsed = patientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const clinical = canViewPatientClinical(session!.user.role);

  if (!data.forceCreate) {
    const duplicates = await findDuplicatePatients(data.phone, data.email);
    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          error: "duplicate",
          message: "A patient with this phone number may already exist.",
          duplicates,
        },
        { status: 409 },
      );
    }
  }

  const patientCode = await generatePatientCode();
  const createPayload = mapPatientCreateData(data);

  if (!clinical) {
    createPayload.allergies = null;
    createPayload.dentalHistory = null;
    createPayload.diagnosis = null;
    createPayload.treatmentPlan = null;
    createPayload.followUpInstructions = null;
    createPayload.examinationNotes = null;
  }

  try {
    let patient: { id: string; name: string; patientCode: string };

    if (canUseSupabaseDataLayer()) {
      patient = (await supabaseCreate("patient", {
        patientCode,
        ...createPayload,
        dateOfBirth: createPayload.dateOfBirth?.toISOString() ?? null,
      })) as { id: string; name: string; patientCode: string };
    } else {
      patient = await prisma.patient.create({
        data: {
          patientCode,
          ...createPayload,
        },
      });
    }

    await logPatientActivity({
      patientId: patient.id,
      kind: "created",
      title: "Patient created",
      createdBy: session!.user.id,
    });

    await createNotification({
      type: "NEW_PATIENT",
      title: "New patient registered",
      message: `${patient.name} (${patient.patientCode}) was added`,
      link: "/admin/patients",
    });

    return NextResponse.json(patient);
  } catch (e) {
    console.error("POST /api/admin/patients:", e);
    return NextResponse.json({ error: "Could not create patient" }, { status: 500 });
  }
}
