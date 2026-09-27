import bcrypt from "bcryptjs";
import { requireAdminContext } from "@/lib/api-auth";
import { writeAdminAudit } from "@/lib/admin-audit";
import { mergePermissions, roleLabel } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/prisma";
import { findAdminById, updateAdminRow } from "@/lib/supabase/admins-data";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { adminChangePasswordSchema, adminProfileUpdateSchema } from "@/lib/validations";
import { firstZodFieldError } from "@/lib/zod-api-error";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, admin, error } = await requireAdminContext();
  if (error) return error;

  const matrix = admin?.permissions ?? mergePermissions(session!.user.role, null);

  return NextResponse.json({
    id: session!.user.id,
    name: admin?.name ?? session!.user.name,
    email: admin?.email ?? session!.user.email,
    phone: admin?.phone ?? null,
    profilePhotoUrl: admin?.profilePhotoUrl ?? null,
    role: admin?.role ?? session!.user.role,
    roleLabel: roleLabel(admin?.role ?? session!.user.role ?? ""),
    branchId: admin?.branchId ?? null,
    branchName: admin?.branchName ?? null,
    active: admin?.active ?? true,
    permissions: matrix,
    rawPermissions: admin?.rawPermissions ?? null,
    createdAt: admin?.createdAt?.toISOString() ?? null,
    lastLoginAt: admin?.lastLoginAt?.toISOString() ?? null,
  });
}

export async function PATCH(req: Request) {
  const { session, admin, error } = await requireAdminContext();
  if (error) return error;

  const body = await req.json();

  if (body.currentPassword != null) {
    const parsed = adminChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodFieldError(parsed.error) }, { status: 400 });
    }

    let hash: string | null = null;
    if (canUseSupabaseDataLayer()) {
      const row = await findAdminById(session!.user.id);
      hash = row?.passwordHash ?? null;
    } else {
      const row = await prisma.admin.findUnique({
        where: { id: session!.user.id },
        select: { passwordHash: true },
      });
      hash = row?.passwordHash ?? null;
    }

    if (!hash || !(await bcrypt.compare(parsed.data.currentPassword, hash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    if (canUseSupabaseDataLayer()) {
      await updateAdminRow(session!.user.id, { passwordHash });
    } else {
      await prisma.admin.update({
        where: { id: session!.user.id },
        data: { passwordHash },
      });
    }

    await writeAdminAudit({
      adminId: session!.user.id,
      adminName: session!.user.name ?? "Admin",
      action: "PASSWORD_CHANGE",
      entityType: "admin",
      entityId: session!.user.id,
    });

    return NextResponse.json({ ok: true });
  }

  const parsed = adminProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodFieldError(parsed.error) }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
  if (parsed.data.profilePhotoUrl !== undefined) {
    data.profilePhotoUrl = parsed.data.profilePhotoUrl || null;
  }

  try {
    if (canUseSupabaseDataLayer()) {
      const updated = await updateAdminRow(session!.user.id, data);
      await writeAdminAudit({
        adminId: session!.user.id,
        adminName: session!.user.name ?? "Admin",
        action: "UPDATE",
        entityType: "profile",
        entityId: session!.user.id,
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.admin.update({
      where: { id: session!.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePhotoUrl: true,
      },
    });

    await writeAdminAudit({
      adminId: session!.user.id,
      adminName: session!.user.name ?? "Admin",
      action: "UPDATE",
      entityType: "profile",
      entityId: session!.user.id,
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/admin/me profile:", e);
    const msg =
      e instanceof Error
        ? e.message
        : typeof e === "object" && e && "message" in e
          ? String((e as { message: string }).message)
          : "Could not update profile";
    if (/column.*profilePhotoUrl|does not exist/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Admin profilePhotoUrl column missing — run supabase/migration-admins-premium.sql in Supabase.",
        },
        { status: 400 },
      );
    }
    if (/0 rows|PGRST116|not found/i.test(msg)) {
      return NextResponse.json(
        { error: "Admin account not found in database. Ask a super admin to add your user." },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
