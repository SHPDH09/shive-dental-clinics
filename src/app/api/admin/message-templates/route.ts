import { requireAdminSession } from "@/lib/api-auth";
import { createCrudHandlers } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import { slugify } from "@/lib/utils";
import { messageTemplateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

const listHandlers = createCrudHandlers("messageTemplate", { searchFields: ["name", "subject"] });

export async function GET(req: Request) {
  return listHandlers.GET(req);
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = messageTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.name);

  if (useSupabaseCrud()) {
    const item = await supabaseCreate("messageTemplate", {
      name: data.name,
      slug,
      subject: data.subject,
      body: data.body,
      sortOrder: data.sortOrder ?? 0,
    });
    return NextResponse.json(item);
  }

  const item = await prisma.messageTemplate.create({
    data: {
      name: data.name,
      slug,
      subject: data.subject,
      body: data.body,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  return NextResponse.json(item);
}
