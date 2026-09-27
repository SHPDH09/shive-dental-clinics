import { requireSuperAdminSession } from "@/lib/api-auth";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function tableOk(table: string): Promise<boolean> {
  if (!canUseSupabaseDataLayer()) return true;
  try {
    const sb = await getAdminSupabaseClient();
    const { error } = await sb.from(table).select("id", { head: true, count: "exact" }).limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function GET() {
  const { error } = await requireSuperAdminSession();
  if (error) return error;

  try {
    if (canUseSupabaseDataLayer()) {
      const sb = await getAdminSupabaseClient();
      const [admins, appts, patients, enquiries, activity] = await Promise.all([
        sb.from("Admin").select("*", { count: "exact", head: true }),
        sb.from("Appointment").select("*", { count: "exact", head: true }),
        sb.from("Patient").select("*", { count: "exact", head: true }),
        sb.from("Enquiry").select("*", { count: "exact", head: true }),
        sb
          .from("AdminActivityLog")
          .select("id, adminName, action, entityType, entityLabel, createdAt")
          .order("createdAt", { ascending: false })
          .limit(15),
      ]);

      const dbHealth = {
        ServiceCategory: await tableOk("ServiceCategory"),
        HeroSlide: await tableOk("HeroSlide"),
        Enquiry: await tableOk("Enquiry"),
        Admin: await tableOk("Admin"),
      };

      return NextResponse.json({
        counts: {
          admins: admins.count ?? 0,
          appointments: appts.count ?? 0,
          patients: patients.count ?? 0,
          enquiries: enquiries.count ?? 0,
        },
        activity: activity.data ?? [],
        dbHealth,
        quickLinks: [
          { href: "/admin/admins", label: "Admin users" },
          { href: "/admin/settings", label: "Clinic settings" },
          { href: "/admin/hero-slides", label: "Hero slides" },
          { href: "/admin/reports", label: "Reports" },
        ],
      });
    }

    const [admins, appointments, patients, enquiries] = await Promise.all([
      prisma.admin.count(),
      prisma.appointment.count(),
      prisma.patient.count(),
      prisma.enquiry.count(),
    ]);

    return NextResponse.json({
      counts: { admins, appointments, patients, enquiries },
      activity: [],
      dbHealth: {},
      quickLinks: [],
    });
  } catch (e) {
    console.error("super/overview:", e);
    return NextResponse.json({ error: "Overview unavailable" }, { status: 503 });
  }
}
