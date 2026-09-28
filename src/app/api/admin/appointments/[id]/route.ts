import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  deleteAppointmentAdmin,
  getAppointmentAdmin,
  updateAppointmentAdmin,
} from "@/lib/supabase/appointments-admin";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import { NextResponse } from "next/server";
import type { AppointmentStatus } from "@/generated/prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  try {
    if (useSupabaseCrud()) {
      const item = await getAppointmentAdmin(id);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(item);
    }

    const item = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, service: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
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

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    data.status = body.status;
  }
  if (body.notes !== undefined) {
    data.notes = body.notes;
  }
  if (body.appointmentDate !== undefined) {
    data.appointmentDate = new Date(body.appointmentDate).toISOString();
  }
  if (body.appointmentTime !== undefined) {
    data.appointmentTime = body.appointmentTime;
  }
  if (body.reschedule) {
    if (body.reschedule.appointmentDate !== undefined) {
      data.appointmentDate = new Date(body.reschedule.appointmentDate).toISOString();
    }
    if (body.reschedule.appointmentTime !== undefined) {
      data.appointmentTime = body.reschedule.appointmentTime;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    if (useSupabaseCrud()) {
      const before = await getAppointmentAdmin(id);
      const item = await updateAppointmentAdmin(id, data);
      if (before && body.status !== undefined && body.status !== before.status) {
        const { sendAppointmentStatusEmail } = await import("@/lib/mail/appointment-emails");
        void sendAppointmentStatusEmail(
          {
            patientName: String(item.patientName ?? before.patientName),
            email: (item.email ?? before.email) as string | null,
            phone: String(item.phone ?? before.phone),
            treatmentName: String(item.treatmentName ?? before.treatmentName),
            appointmentCode: String(item.appointmentCode ?? before.appointmentCode),
            appointmentDate: String(item.appointmentDate ?? before.appointmentDate).slice(0, 10),
            appointmentTime: String(item.appointmentTime ?? before.appointmentTime),
            status: String(body.status),
          },
          String(body.status),
        );
      }
      return NextResponse.json(item);
    }

    const beforePrisma = await prisma.appointment.findUnique({ where: { id } });

    const prismaData: {
      status?: AppointmentStatus;
      notes?: string | null;
      appointmentDate?: Date;
      appointmentTime?: string;
    } = {};
    if (body.status !== undefined) prismaData.status = body.status;
    if (body.notes !== undefined) prismaData.notes = body.notes;
    if (data.appointmentDate) prismaData.appointmentDate = new Date(data.appointmentDate as string);
    if (data.appointmentTime) prismaData.appointmentTime = data.appointmentTime as string;

    const item = await prisma.appointment.update({
      where: { id },
      data: prismaData,
      include: { patient: true, service: true },
    });
    if (beforePrisma && body.status !== undefined && body.status !== beforePrisma.status) {
      const { sendAppointmentStatusEmail } = await import("@/lib/mail/appointment-emails");
      void sendAppointmentStatusEmail(
        {
          patientName: item.patientName,
          email: item.email,
          phone: item.phone,
          treatmentName: item.treatmentName,
          appointmentCode: item.appointmentCode,
          appointmentDate: item.appointmentDate.toISOString().slice(0, 10),
          appointmentTime: item.appointmentTime,
          status: item.status,
        },
        item.status,
      );
    }
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
    if (useSupabaseCrud()) {
      await deleteAppointmentAdmin(id);
      return NextResponse.json({ success: true });
    }

    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
