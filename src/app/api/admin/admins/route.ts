import bcrypt from "bcryptjs";
import { requireSuperAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createAdminRow, listAdmins } from "@/lib/supabase/admins-data";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { adminCreateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireSuperAdminSession();
  if (error) return error;

  try {
    if (canUseSupabaseDataLayer()) {
      const items = await listAdmins();
      return NextResponse.json({ items });
    }

    const items = await prisma.admin.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/admin/admins:", e);
    return NextResponse.json({ error: "Could not load admins", items: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireSuperAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = adminCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { loginId, name, email, password, role } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    if (canUseSupabaseDataLayer()) {
      const admin = await createAdminRow({
        loginId,
        name,
        email: email || null,
        passwordHash,
        role,
      });
      return NextResponse.json(admin, { status: 201 });
    }

    const admin = await prisma.admin.create({
      data: {
        loginId,
        name,
        email: email || null,
        passwordHash,
        role,
      },
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json(admin, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    if (msg.includes("Unique constraint") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Admin ID or email already exists" }, { status: 409 });
    }
    console.error("POST /api/admin/admins:", e);
    return NextResponse.json({ error: "Could not create admin" }, { status: 500 });
  }
}
