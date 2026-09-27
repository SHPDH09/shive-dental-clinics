import { requireAdminSession } from "@/lib/api-auth";
import { createCrudHandlers } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import { slugify } from "@/lib/utils";
import { serviceCategorySchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const listHandlers = createCrudHandlers("serviceCategory", { searchFields: ["name", "slug"] });

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

  const body = await req.json();
  const parsed = serviceCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.name);

  if (useSupabaseCrud()) {
    const sb = createSupabaseServiceClient();
    const { data: existing } = await sb.from("ServiceCategory").select("id").eq("slug", slug).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Category slug already exists" }, { status: 400 });
    }
    const item = await supabaseCreate("serviceCategory", {
      name: data.name,
      slug,
      sortOrder: data.sortOrder ?? 0,
    });
    return NextResponse.json(item);
  }

  try {
    const item = await prisma.serviceCategory.create({
      data: { name: data.name, slug, sortOrder: data.sortOrder ?? 0 },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Could not create category" }, { status: 400 });
  }
}
