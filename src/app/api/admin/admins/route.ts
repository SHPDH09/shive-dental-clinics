import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { subMinutes } from "date-fns";
import { requireSuperAdminSession } from "@/lib/api-auth";
import { writeAdminAudit } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { roleDefaultPermissions } from "@/lib/rbac/permissions";
import {
  createAdminRow,
  listAdminActivity,
  listAdmins,
  type AdminListFilters,
} from "@/lib/supabase/admins-data";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { adminCreateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

function parseFilters(searchParams: URLSearchParams): AdminListFilters {
  const activeRaw = searchParams.get("active");
  return {
    q: searchParams.get("q")?.trim() || undefined,
    role: searchParams.get("role")?.trim() || undefined,
    branchId: searchParams.get("branchId")?.trim() || undefined,
    active: activeRaw === "true" ? true : activeRaw === "false" ? false : undefined,
    lastLoginFrom: searchParams.get("lastLoginFrom") ?? undefined,
    lastLoginTo: searchParams.get("lastLoginTo") ?? undefined,
    createdFrom: searchParams.get("createdFrom") ?? undefined,
    createdTo: searchParams.get("createdTo") ?? undefined,
  };
}

function loginIdFromEmail(email: string): string {
  const base = email
    .split("@")[0]
    .replace(/\W/g, "")
    .toUpperCase()
    .slice(0, 10);
  return `${base || "ADM"}${createId().slice(-4).toUpperCase()}`;
}

export async function GET(req: Request) {
  const { session, error } = await requireSuperAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const filters = parseFilters(searchParams);

  try {
    const recentCutoff = subMinutes(new Date(), 15);

    if (canUseSupabaseDataLayer()) {
      const items = await listAdmins(filters);
      const total = items.length;
      const active = items.filter((a) => a.active !== false).length;
      const inactive = total - active;
      const recentOnline = items.filter(
        (a) => a.lastLoginAt && new Date(a.lastLoginAt as string) >= recentCutoff,
      ).length;
      const recentActivity = await listAdminActivity(20);

      const branchIds = [...new Set(items.map((i) => i.branchId).filter(Boolean))];
      return NextResponse.json({
        items,
        stats: { total, active, inactive, recentOnline },
        recentActivity,
        branchIds,
      });
    }

    const where: Record<string, unknown> = {};
    if (filters.role) where.role = filters.role;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.active !== undefined) where.active = filters.active;
    if (filters.lastLoginFrom || filters.lastLoginTo) {
      where.lastLoginAt = {
        ...(filters.lastLoginFrom ? { gte: new Date(filters.lastLoginFrom) } : {}),
        ...(filters.lastLoginTo ? { lte: new Date(filters.lastLoginTo) } : {}),
      };
    }
    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {
        ...(filters.createdFrom ? { gte: new Date(filters.createdFrom) } : {}),
        ...(filters.createdTo ? { lte: new Date(filters.createdTo) } : {}),
      };
    }

    let items = await prisma.admin.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
        lastLoginAt: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        branch: { select: { name: true } },
      },
    });

    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.email?.toLowerCase().includes(q) ?? false) ||
          a.loginId.toLowerCase().includes(q),
      );
    }

    const total = items.length;
    const active = items.filter((a) => a.active).length;
    const recentOnline = items.filter(
      (a) => a.lastLoginAt && a.lastLoginAt >= recentCutoff,
    ).length;

    const recentActivity = await prisma.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        adminId: true,
        adminName: true,
        action: true,
        entityType: true,
        entityId: true,
        entityLabel: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      items: items.map(({ branch, ...rest }) => ({
        ...rest,
        branchName: branch?.name ?? null,
      })),
      stats: { total, active, inactive: total - active, recentOnline },
      recentActivity,
    });
  } catch (e) {
    console.error("GET /api/admin/admins:", e);
    return NextResponse.json(
      { error: "Could not load admins", items: [], stats: null, recentActivity: [] },
      { status: 200 },
    );
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireSuperAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = adminCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    loginId: loginIdInput,
    name,
    email,
    phone,
    profilePhotoUrl,
    password,
    role,
    branchId,
    active,
    permissions,
  } = parsed.data;

  if (role === "SUPER_ADMIN" && session!.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot assign super admin role" }, { status: 403 });
  }

  const loginId = loginIdInput?.trim() || loginIdFromEmail(email);
  const passwordHash = await bcrypt.hash(password, 12);
  const permPayload =
    permissions ?? (role === "SUPER_ADMIN" ? null : roleDefaultPermissions(role));

  try {
    if (canUseSupabaseDataLayer()) {
      const admin = await createAdminRow({
        loginId,
        name,
        email,
        phone: phone || null,
        profilePhotoUrl: profilePhotoUrl || null,
        passwordHash,
        role,
        branchId: branchId || null,
        active,
        permissions: permPayload,
      });

      await writeAdminAudit({
        adminId: session!.user.id,
        adminName: session!.user.name ?? "Admin",
        action: "CREATE",
        entityType: "admin",
        entityId: admin.id as string,
        entityLabel: name,
      });

      return NextResponse.json(admin, { status: 201 });
    }

    const admin = await prisma.admin.create({
      data: {
        loginId,
        name,
        email,
        phone: phone || null,
        profilePhotoUrl: profilePhotoUrl || null,
        passwordHash,
        role,
        branchId: branchId || null,
        active,
        permissions: permPayload ?? undefined,
      },
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
        createdAt: true,
      },
    });

    await writeAdminAudit({
      adminId: session!.user.id,
      adminName: session!.user.name ?? "Admin",
      action: "CREATE",
      entityType: "admin",
      entityId: admin.id,
      entityLabel: name,
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
