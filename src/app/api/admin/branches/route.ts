import { requireAdminSession } from "@/lib/api-auth";
import { branchPayloadFromInput, listAdminBranches } from "@/lib/admin-branches";
import { ensureBranchSlug } from "@/lib/branch-slug";
import { prisma } from "@/lib/prisma";
import { getAdminWriteSupabaseClient } from "@/lib/supabase/data-client";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import { errorMessageFromUnknown, mapSupabaseErrorMessage } from "@/lib/supabase/errors";
import { formatConsultationSummary, parseWeeklySchedule } from "@/lib/doctor-schedule";
import { branchSchema } from "@/lib/validations";
import { firstZodFieldError } from "@/lib/zod-api-error";
import { NextResponse } from "next/server";

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
    const msg = mapSupabaseErrorMessage(errorMessageFromUnknown(e));
    console.error("GET branches:", e);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = branchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodFieldError(parsed.error) }, { status: 400 });
  }

  const data = parsed.data;
  const schedule = data.weeklySchedule ?? parseWeeklySchedule(null);
  const baseSlug = ensureBranchSlug(data.name, data.slug);
  let slug = baseSlug;
  let suffix = 0;

  const payload = branchPayloadFromInput({
    ...data,
    weeklySchedule: schedule,
    openTime: data.openTime ?? formatConsultationSummary(schedule).slice(0, 20),
    closeTime: data.closeTime ?? "7:00 PM",
  });

  if (useSupabaseCrud()) {
    try {
      const sb = await getAdminWriteSupabaseClient();
      while (true) {
        const { data: existing } = await sb.from("Branch").select("id").eq("slug", slug).maybeSingle();
        if (!existing) break;
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }
      const item = await supabaseCreate("branch", { ...payload, slug });
      return NextResponse.json(item, { status: 201 });
    } catch (e) {
      const msg = mapSupabaseErrorMessage(errorMessageFromUnknown(e));
      console.error("POST branch (Supabase):", e);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  try {
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
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    const msg = mapSupabaseErrorMessage(errorMessageFromUnknown(e));
    console.error("POST branch (Prisma):", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
