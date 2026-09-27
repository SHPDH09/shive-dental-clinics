import { createId } from "@paralleldrive/cuid2";
import { requireAdminSession } from "@/lib/api-auth";
import { createCrudHandlers } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { getAdminWriteSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { errorMessageFromUnknown, mapSupabaseErrorMessage } from "@/lib/supabase/errors";
import { serviceCategorySchema } from "@/lib/validations";
import { NextResponse } from "next/server";

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
      const sb = await getAdminWriteSupabaseClient();
      const { data: existing } = await sb
        .from("ServiceCategory")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { error: "Category slug already exists — try another name." },
          { status: 409 },
        );
      }

      const now = new Date().toISOString();
      const { data: item, error: insertError } = await sb
        .from("ServiceCategory")
        .insert({
          id: createId(),
          name,
          slug,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (insertError) {
        const msg = mapSupabaseErrorMessage(insertError.message);
        console.error("POST service-category insert:", insertError);
        const status = /permission|RLS|42501/i.test(insertError.message) ? 403 : 400;
        return NextResponse.json({ error: msg }, { status });
      }

      return NextResponse.json(item, { status: 201 });
    } catch (e) {
      const raw = errorMessageFromUnknown(e);
      const msg = mapSupabaseErrorMessage(raw);
      console.error("POST service-category (Supabase):", e);
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
    return NextResponse.json(
      { error: mapSupabaseErrorMessage(errorMessageFromUnknown(e)) },
      { status: 400 },
    );
  }
}
