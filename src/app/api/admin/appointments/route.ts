import { branchScopeFilter } from "@/lib/admin-context";
import { requireAdminContext } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { listAppointmentsAdmin } from "@/lib/supabase/appointments-admin";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";
import { addDays, endOfDay, startOfDay } from "date-fns";
import type { AppointmentStatus } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const { admin, error } = await requireAdminContext();
  if (error) return error;

  const scopedBranch = branchScopeFilter(admin ?? null);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const skip = (page - 1) * limit;

  const status = searchParams.get("status");
  const treatment = searchParams.get("treatment")?.trim();
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const today = searchParams.get("today");
  const tomorrow = searchParams.get("tomorrow");

  try {
    if (useSupabaseCrud()) {
      const { items, total } = await listAppointmentsAdmin({
        page,
        limit,
        status,
        treatment,
        dateFrom,
        dateTo,
        today,
        tomorrow,
      });
      return NextResponse.json({ items, total, page, limit });
    }

    const where: {
      branchId?: string;
      status?: AppointmentStatus;
      treatmentName?: { contains: string; mode: "insensitive" };
      appointmentDate?: { gte?: Date; lte?: Date };
    } = {};

    if (scopedBranch) {
      where.branchId = scopedBranch;
    }

    if (status) {
      where.status = status as AppointmentStatus;
    }

    if (treatment) {
      where.treatmentName = { contains: treatment, mode: "insensitive" };
    }

    if (today === "true" || today === "1") {
      where.appointmentDate = {
        gte: startOfDay(new Date()),
        lte: endOfDay(new Date()),
      };
    } else if (tomorrow === "true" || tomorrow === "1") {
      const day = addDays(new Date(), 1);
      where.appointmentDate = {
        gte: startOfDay(day),
        lte: endOfDay(day),
      };
    } else if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) {
        where.appointmentDate.gte = startOfDay(new Date(dateFrom));
      }
      if (dateTo) {
        where.appointmentDate.lte = endOfDay(new Date(dateTo));
      }
    }

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ appointmentDate: "asc" }, { appointmentTime: "asc" }],
        include: { patient: true, service: true },
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error("Appointments list error:", e);
    return NextResponse.json({ error: "Failed to load appointments" }, { status: 503 });
  }
}
