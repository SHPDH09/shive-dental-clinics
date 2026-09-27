import { crudById } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { supabaseUpdate, useSupabaseCrud } from "@/lib/supabase/crud";
import { ensureServiceCategorySlug } from "@/lib/service-category-slug";
import { z } from "zod";
import { requireAdminSession } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("serviceCategory", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const partialSchema = z
    .object({
      name: z.string().min(2).optional(),
      slug: z.string().optional().nullable(),
      sortOrder: z.coerce.number().optional(),
    })
    .strict();

  const parsed = partialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category data" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name.trim();
  if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;
  if (parsed.data.slug !== undefined || parsed.data.name !== undefined) {
    const baseName = parsed.data.name ?? "";
    updateData.slug = ensureServiceCategorySlug(
      baseName || "category",
      parsed.data.slug ?? undefined,
    );
  }

  if (useSupabaseCrud()) {
    try {
      const item = await supabaseUpdate("serviceCategory", id, updateData);
      return NextResponse.json(item);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
  }

  try {
    const item = await prisma.serviceCategory.update({ where: { id }, data: updateData });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  if (useSupabaseCrud()) {
    try {
      const sb = createSupabaseServiceClient();
      const { count } = await sb
        .from("Service")
        .select("*", { count: "exact", head: true })
        .eq("categoryId", id);
      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { error: "Remove or reassign services in this category before deleting." },
          { status: 400 },
        );
      }
      const result = await crudById("serviceCategory", req, id);
      if (result.error) return result.error;
      return NextResponse.json(result.data);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Delete failed" }, { status: 400 });
    }
  }

  try {
    const inUse = await prisma.service.count({ where: { categoryId: id } });
    if (inUse > 0) {
      return NextResponse.json(
        { error: "Remove or reassign services in this category before deleting." },
        { status: 400 },
      );
    }
    await prisma.serviceCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
