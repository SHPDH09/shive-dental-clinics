import { requireAdminSession } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseCreate, supabaseList } from "@/lib/supabase/crud";
import { patientSchema } from "@/lib/validations";
import { generateCode } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const q = searchParams.get("q")?.trim();

  try {
    if (canUseSupabaseDataLayer()) {
      const { items, total } = await supabaseList("patient", {
        page,
        limit,
        q,
        searchFields: q ? ["name", "phone", "email", "patientCode"] : undefined,
      });
      return NextResponse.json({ items, total, page, limit });
    }

    const skip = (page - 1) * limit;
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { patientCode: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error("GET /api/admin/patients:", e);
    return NextResponse.json({ items: [], total: 0, page, limit });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = patientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    let patient: { id: string; name: string; patientCode: string };

    if (canUseSupabaseDataLayer()) {
      patient = (await supabaseCreate("patient", {
        patientCode: generateCode("PAT"),
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        gender: data.gender || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
        address: data.address || null,
        medicalNotes: data.medicalNotes || null,
        treatmentHistory: data.treatmentHistory || null,
      })) as { id: string; name: string; patientCode: string };
    } else {
      patient = await prisma.patient.create({
        data: {
          patientCode: generateCode("PAT"),
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          gender: data.gender || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          address: data.address || null,
          medicalNotes: data.medicalNotes || null,
          treatmentHistory: data.treatmentHistory || null,
        },
      });
    }

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
