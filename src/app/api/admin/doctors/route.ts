import { requireAdminSession } from "@/lib/api-auth";
import { doctorPayloadFromInput, listAdminDoctors } from "@/lib/admin-doctors";
import { prisma } from "@/lib/prisma";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import { slugify } from "@/lib/utils";
import { doctorSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { formatConsultationSummary, parseWeeklySchedule } from "@/lib/doctor-schedule";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const q = searchParams.get("q")?.trim();
  const specialization = searchParams.get("specialization")?.trim();
  const enabledParam = searchParams.get("enabled");
  const sortParam = searchParams.get("sort");
  const sort =
    sortParam === "experience" || sortParam === "name" ? sortParam : "newest";
  const enabled =
    enabledParam === "true" ? true : enabledParam === "false" ? false : undefined;

  try {
    const { items, total } = await listAdminDoctors({
      page,
      limit,
      q,
      specialization,
      enabled,
      sort,
    });
    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = doctorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const baseSlug = data.slug?.trim() || slugify(data.name);
  let slug = baseSlug;
  let suffix = 0;

  const schedule = data.weeklySchedule ?? parseWeeklySchedule(null);
  const payload = {
    ...doctorPayloadFromInput({
      ...data,
      weeklySchedule: schedule,
      consultationHours: data.consultationHours || formatConsultationSummary(schedule),
    }),
  };

  if (useSupabaseCrud()) {
    const sb = createSupabaseServiceClient();
    while (true) {
      const { data: existing } = await sb.from("Doctor").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    const item = await supabaseCreate("doctor", { ...payload, slug });
    return NextResponse.json(item);
  }

  while (await prisma.doctor.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const item = await prisma.doctor.create({
    data: {
      ...payload,
      slug,
      areasOfExpertise: payload.areasOfExpertise,
      weeklySchedule: schedule,
    },
  });

  return NextResponse.json(item);
}
