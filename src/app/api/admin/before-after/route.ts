import { requireAdminSession } from "@/lib/api-auth";
import { createCrudHandlers } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseCreate } from "@/lib/supabase/crud";
import { beforeAfterSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

const listHandlers = createCrudHandlers("beforeAfter", {
  searchFields: ["treatment", "description", "caseName"],
});

export async function GET(req: Request) {
  return listHandlers.GET(req);
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = beforeAfterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  if (data.isPublic && data.status === "PUBLISHED" && !data.consentConfirmed) {
    return NextResponse.json(
      { error: "Patient consent is required for public published cases" },
      { status: 400 },
    );
  }

  const payload = {
    caseName: data.caseName,
    treatment: data.treatment,
    category: data.category,
    beforeImage: data.beforeImage,
    afterImage: data.afterImage,
    description: data.description?.trim() || null,
    treatmentDuration: data.treatmentDuration?.trim() || null,
    caseDate: data.caseDate ? new Date(data.caseDate).toISOString() : new Date().toISOString(),
    verifiedCase: data.verifiedCase,
    consentConfirmed: data.consentConfirmed,
    isPublic: data.isPublic,
    featured: data.featured,
    status: data.status,
    sortOrder: data.sortOrder ?? 0,
  };

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseCreate("beforeAfter", payload);
      return NextResponse.json(item, { status: 201 });
    }

    const item = await prisma.beforeAfter.create({
      data: {
        ...payload,
        caseDate: new Date(payload.caseDate as string),
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST before-after:", e);
    return NextResponse.json({ error: "Could not create case" }, { status: 500 });
  }
}
