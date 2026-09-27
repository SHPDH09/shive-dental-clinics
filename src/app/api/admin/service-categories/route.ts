import { requireAdminSession } from "@/lib/api-auth";
import { createCrudHandlers } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import { serviceCategorySchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const listHandlers = createCrudHandlers("serviceCategory", { searchFields: ["name", "slug"] });

function formatZodError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flat = error.flatten().fieldErrors;
  const first = Object.values(flat).flat()[0];
  return first ?? "Invalid category data";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));

  const { error } = await requireAdminSession();
  if (error) return error;

  if (useSupabaseCrud()) {
    return listHandlers.GET(req);
  }

  try {
    const items = await prisma.serviceCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: limit,
    });
    return NextResponse.json({ items, total: items.length, page: 1, limit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
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

  const parsed = serviceCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { name, slug, sortOrder } = parsed.data;

  if (useSupabaseCrud()) {
    try {
      const sb = createSupabaseServiceClient();
      const { data: existing } = await sb.from("ServiceCategory").select("id").eq("slug", slug).maybeSingle();
      if (existing) {
        return NextResponse.json({ error: "Category slug already exists — try another name." }, { status: 409 });
      }
      const item = await supabaseCreate("serviceCategory", {
        name,
        slug,
        sortOrder,
      });
      return NextResponse.json(item, { status: 201 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create category";
      console.error("POST service-category (Supabase):", e);
      if (/relation|does not exist/i.test(msg)) {
        return NextResponse.json(
          { error: "ServiceCategory table missing — run supabase/migration-services-premium.sql" },
          { status: 503 },
        );
      }
      if (/permission|policy|RLS/i.test(msg)) {
        return NextResponse.json(
          { error: "Database permission denied — run supabase/rls-authenticated-admin.sql (includes ServiceCategory)" },
          { status: 403 },
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  try {
    const item = await prisma.serviceCategory.create({
      data: { name, slug, sortOrder },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST service-category (Prisma):", e);
    return NextResponse.json({ error: "Could not create category (duplicate slug?)" }, { status: 400 });
  }
}
