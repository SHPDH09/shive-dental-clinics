import bcrypt from "bcryptjs";
import { requireSuperAdminSession } from "@/lib/api-auth";
import { writeAdminAudit } from "@/lib/admin-audit";
import { mergePermissions } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import {
  countSuperAdmins,
  deleteAdminRow,
  findAdminById,
  updateAdminRow,
} from "@/lib/supabase/admins-data";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { adminUpdateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requireSuperAdminSession();
  if (error) return error;

  const { id } = await params;

  try {
    if (canUseSupabaseDataLayer()) {
      const admin = await findAdminById(id);
      if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({
        ...admin,
        permissionsMatrix: mergePermissions(admin.role as string, admin.permissions as object),
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { passwordHash: _, ...safe } = admin;
    return NextResponse.json({
      ...safe,
      permissionsMatrix: mergePermissions(admin.role, admin.permissions as object),
    });
  } catch (e) {
    console.error("GET admin:", e);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireSuperAdminSession();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = adminUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.role === "SUPER_ADMIN" && session!.user.id !== id) {
    const superCount = canUseSupabaseDataLayer()
      ? await countSuperAdmins()
      : await prisma.admin.count({ where: { role: "SUPER_ADMIN" } });
    if (superCount >= 5 && parsed.data.role === "SUPER_ADMIN") {
      // soft limit — still allow but audit
    }
  }

  try {
    if (canUseSupabaseDataLayer()) {
      const existing = await findAdminById(id);
      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const data: Record<string, unknown> = {};
      if (parsed.data.name !== undefined) data.name = parsed.data.name;
      if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
      if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
      if (parsed.data.profilePhotoUrl !== undefined) {
        data.profilePhotoUrl = parsed.data.profilePhotoUrl || null;
      }
      if (parsed.data.role !== undefined) data.role = parsed.data.role;
      if (parsed.data.branchId !== undefined) data.branchId = parsed.data.branchId || null;
      if (parsed.data.active !== undefined) data.active = parsed.data.active;
      if (parsed.data.permissions !== undefined) data.permissions = parsed.data.permissions;
      if (parsed.data.password) {
        data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
      }

      const admin = await updateAdminRow(id, data);

      await writeAdminAudit({
        adminId: session!.user.id,
        adminName: session!.user.name ?? "Admin",
        action: parsed.data.active === false ? "DEACTIVATE" : parsed.data.active ? "ACTIVATE" : "UPDATE",
        entityType: "admin",
        entityId: id,
        entityLabel: String(existing.name),
      });

      return NextResponse.json(admin);
    }

    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
    if (parsed.data.profilePhotoUrl !== undefined) {
      data.profilePhotoUrl = parsed.data.profilePhotoUrl || null;
    }
    if (parsed.data.role !== undefined) data.role = parsed.data.role;
    if (parsed.data.branchId !== undefined) data.branchId = parsed.data.branchId || null;
    if (parsed.data.active !== undefined) data.active = parsed.data.active;
    if (parsed.data.permissions !== undefined) data.permissions = parsed.data.permissions;
    if (parsed.data.password) {
      data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }

    const admin = await prisma.admin.update({
      where: { id },
      data,
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        phone: true,
        profilePhotoUrl: true,
        role: true,
        branchId: true,
        active: true,
        updatedAt: true,
      },
    });

    await writeAdminAudit({
      adminId: session!.user.id,
      adminName: session!.user.name ?? "Admin",
      action: parsed.data.active === false ? "DEACTIVATE" : parsed.data.active ? "ACTIVATE" : "UPDATE",
      entityType: "admin",
      entityId: id,
      entityLabel: existing.name,
    });

    return NextResponse.json(admin);
  } catch (e) {
    console.error("PATCH /api/admin/admins:", e);
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

  try {
    if (canUseSupabaseDataLayer()) {
      const target = await findAdminById(id);
      if (!target) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (target.role === "SUPER_ADMIN") {
        const superCount = await countSuperAdmins();
        if (superCount <= 1) {
          return NextResponse.json({ error: "Cannot delete the only super admin" }, { status: 400 });
        }
      }

      await deleteAdminRow(id);
      await writeAdminAudit({
        adminId: session!.user.id,
        adminName: session!.user.name ?? "Admin",
        action: "DELETE",
        entityType: "admin",
        entityId: id,
        entityLabel: String(target.name),
      });
      return NextResponse.json({ ok: true });
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
    await writeAdminAudit({
      adminId: session!.user.id,
      adminName: session!.user.name ?? "Admin",
      action: "DELETE",
      entityType: "admin",
      entityId: id,
      entityLabel: target.name,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/admins:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
