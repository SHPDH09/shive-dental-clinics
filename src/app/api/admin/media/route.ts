import { requireAdminSession } from "@/lib/api-auth";
import { createCrudHandlers } from "@/lib/crud-route";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { supabaseCreate } from "@/lib/supabase/crud";
import { isPatientRelatedCategory } from "@/lib/gallery-categories";
import { galleryMediaSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

const listHandlers = createCrudHandlers("media", {
  searchFields: ["title", "description", "category"],
});

export async function GET(req: Request) {
  return listHandlers.GET(req);
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = galleryMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  let isPublic = data.isPublic;
  if (isPatientRelatedCategory(data.category) && isPublic && data.status === "PUBLISHED") {
    /* allowed if admin explicitly set both */
  } else if (isPatientRelatedCategory(data.category) && !isPublic) {
    isPublic = false;
  }

  const payload = {
    title: data.title,
    description: data.description?.trim() || null,
    mediaType: data.mediaType,
    mediaUrl: data.mediaUrl,
    category: data.category,
    isPublic,
    status: data.status,
  };

  try {
    if (canUseSupabaseDataLayer()) {
      const item = await supabaseCreate("media", payload);
      return NextResponse.json(item, { status: 201 });
    }

    const item = await prisma.media.create({ data: payload });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST media:", e);
    return NextResponse.json({ error: "Could not save media" }, { status: 500 });
  }
}
