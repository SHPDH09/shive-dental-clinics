import { requireAdminSession } from "@/lib/api-auth";
import { createCrudHandlers } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseCreate } from "@/lib/supabase/crud";
import { testimonialSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

const listHandlers = createCrudHandlers("testimonial", {
  searchFields: ["patientName", "testimonial", "treatment"],
});

export async function GET(req: Request) {
  return listHandlers.GET(req);
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = testimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const payload = {
    patientName: data.patientName,
    patientImage: data.patientImage?.trim() || null,
    rating: data.rating,
    treatment: data.treatment,
    testimonial: data.testimonial,
    testimonialDate: data.testimonialDate ? new Date(data.testimonialDate) : new Date(),
    verifiedPatient: data.verifiedPatient,
    status: data.status,
  };

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseCreate("testimonial", {
        ...payload,
        testimonialDate: payload.testimonialDate.toISOString(),
      });
      return NextResponse.json(item, { status: 201 });
    }

    const item = await prisma.testimonial.create({ data: payload });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST testimonial:", e);
    return NextResponse.json({ error: "Could not create testimonial" }, { status: 500 });
  }
}
