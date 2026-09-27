import bcrypt from "bcryptjs";
import { requireSuperAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { adminUpdateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireSuperAdminSession();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = adminUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.admin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: {
    name?: string;
    email?: string | null;
    role?: "SUPER_ADMIN" | "STAFF";
    passwordHash?: string;
  } = {};

  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  try {
    const admin = await prisma.admin.update({
      where: { id },
      data,
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(admin);
  } catch {
    return NextResponse.json({ error: "Update failed (duplicate email?)" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { session, error } = await requireSuperAdminSession();
  if (error) return error;

  const { id } = await params;
  if (session!.user.id === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.admin.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (target.role === "SUPER_ADMIN") {
    const superCount = await prisma.admin.count({ where: { role: "SUPER_ADMIN" } });
    if (superCount <= 1) {
      return NextResponse.json({ error: "Cannot delete the only super admin" }, { status: 400 });
    }
  }

  await prisma.admin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
