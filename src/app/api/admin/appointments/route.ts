import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { addDays, endOfDay, startOfDay } from "date-fns";
import type { AppointmentStatus } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

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

  const where: {
    status?: AppointmentStatus;
    treatmentName?: { contains: string; mode: "insensitive" };
    appointmentDate?: { gte?: Date; lte?: Date };
  } = {};

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
}
