import { requireAdminSession } from "@/lib/api-auth";
import { branchPayloadFromInput, listAdminBranches } from "@/lib/admin-branches";
import { prisma } from "@/lib/prisma";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import { formatConsultationSummary, parseWeeklySchedule } from "@/lib/doctor-schedule";
import { slugify } from "@/lib/utils";
import { branchSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const q = searchParams.get("q")?.trim();
  const city = searchParams.get("city")?.trim();
  const publishedParam = searchParams.get("published");
  const sortParam = searchParams.get("sort");
  const sort = sortParam === "name" || sortParam === "city" ? sortParam : "newest";
  const published =
    publishedParam === "true" ? true : publishedParam === "false" ? false : undefined;

  try {
    const { items, total } = await listAdminBranches({ page, limit, q, city, published, sort });
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
  const parsed = branchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const schedule = data.weeklySchedule ?? parseWeeklySchedule(null);
  const baseSlug = data.slug?.trim() || slugify(data.name);
  let slug = baseSlug;
  let suffix = 0;

  const payload = branchPayloadFromInput({
    ...data,
    weeklySchedule: schedule,
    openTime: data.openTime ?? formatConsultationSummary(schedule).slice(0, 20),
    closeTime: data.closeTime ?? "7:00 PM",
  });

  if (useSupabaseCrud()) {
    const sb = createSupabaseServiceClient();
    while (true) {
      const { data: existing } = await sb.from("Branch").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    const item = await supabaseCreate("branch", { ...payload, slug });
    return NextResponse.json(item);
  }

  while (await prisma.branch.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const item = await prisma.branch.create({
    data: {
      ...payload,
      slug,
      doctorIds: payload.doctorIds,
      serviceIds: payload.serviceIds,
      weeklySchedule: schedule,
    },
  });
  return NextResponse.json(item);
}
