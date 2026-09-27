import { requireAdminSession } from "@/lib/api-auth";
import { listAdminServices, servicePayloadFromInput } from "@/lib/admin-services";
import { prisma } from "@/lib/prisma";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import { slugify } from "@/lib/utils";
import { serviceSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const q = searchParams.get("q")?.trim();
  const categoryId = searchParams.get("categoryId")?.trim() || undefined;
  const enabledParam = searchParams.get("enabled");
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const enabled =
    enabledParam === "true" ? true : enabledParam === "false" ? false : undefined;

  try {
    const { items, total } = await listAdminServices({
      page,
      limit,
      q,
      categoryId,
      enabled,
      sort,
    });
    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error("List services error:", e);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const baseSlug = data.slug?.trim() || slugify(data.name);
  let slug = baseSlug;
  let suffix = 0;
  const payload = servicePayloadFromInput(data);

  if (useSupabaseCrud()) {
    const sb = createSupabaseServiceClient();
    while (true) {
      const { data: existing } = await sb.from("Service").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    const item = await supabaseCreate("service", { ...payload, slug });
    return NextResponse.json(item);
  }

  while (await prisma.service.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const item = await prisma.service.create({
    data: {
      ...payload,
      slug,
      price: payload.price ? new Prisma.Decimal(payload.price) : null,
      benefits: payload.benefits,
      treatmentSteps: payload.treatmentSteps,
      faqs: payload.faqs,
    },
  });

  return NextResponse.json(item);
}
