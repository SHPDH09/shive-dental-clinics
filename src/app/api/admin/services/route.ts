import { requireAdminSession } from "@/lib/api-auth";
import { createCrudHandlers } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { serviceSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

const listHandlers = createCrudHandlers("service", { searchFields: ["name", "slug"] });

export async function GET(req: Request) {
  return listHandlers.GET(req);
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

  while (await prisma.service.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const item = await prisma.service.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      shortDesc: data.shortDesc || null,
      image: data.image || null,
      price: data.price ? new Prisma.Decimal(data.price) : null,
      enabled: data.enabled ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  return NextResponse.json(item);
}
