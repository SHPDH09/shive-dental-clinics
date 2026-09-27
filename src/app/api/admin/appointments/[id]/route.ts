import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { AppointmentStatus } from "@/generated/prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const item = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true, service: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = (await req.json()) as {
    status?: AppointmentStatus;
    notes?: string | null;
    appointmentDate?: string;
    appointmentTime?: string;
    reschedule?: { appointmentDate?: string; appointmentTime?: string };
  };

  const data: {
    status?: AppointmentStatus;
    notes?: string | null;
    appointmentDate?: Date;
    appointmentTime?: string;
  } = {};

  if (body.status !== undefined) {
    data.status = body.status;
  }
  if (body.notes !== undefined) {
    data.notes = body.notes;
  }
  if (body.appointmentDate !== undefined) {
    data.appointmentDate = new Date(body.appointmentDate);
  }
  if (body.appointmentTime !== undefined) {
    data.appointmentTime = body.appointmentTime;
  }
  if (body.reschedule) {
    if (body.reschedule.appointmentDate !== undefined) {
      data.appointmentDate = new Date(body.reschedule.appointmentDate);
    }
    if (body.reschedule.appointmentTime !== undefined) {
      data.appointmentTime = body.reschedule.appointmentTime;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const item = await prisma.appointment.update({
      where: { id },
      data,
      include: { patient: true, service: true },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  try {
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
