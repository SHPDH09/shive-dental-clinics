import { requireAdminSession, requireSuperAdminSession } from "@/lib/api-auth";
import { writeAdminAudit } from "@/lib/admin-audit";
import { getAdminSettings, saveAdminSettings } from "@/lib/clinic-settings/service";
import { clinicSettingsPatchSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, error } = await requireAdminSession();
  if (error) return error;

  if (session!.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 });
  }

  try {
    const settings = await getAdminSettings();
    return NextResponse.json(settings);
  } catch (e) {
    console.error("GET /api/admin/settings:", e);
    return NextResponse.json({ error: "Could not load settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireSuperAdminSession();
  if (error) return error;

  const body = await req.json();
  const parsed = clinicSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const saved = await saveAdminSettings(parsed.data as Record<string, unknown>);
    await writeAdminAudit({
      adminId: session!.user.id,
      adminName: session!.user.name ?? "Admin",
      action: "SETTINGS_UPDATE",
      entityType: "settings",
      entityId: "default",
    });
    return NextResponse.json(saved);
  } catch (e) {
    console.error("PATCH /api/admin/settings:", e);
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }
}
