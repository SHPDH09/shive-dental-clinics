import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  deleteAppointmentAdmin,
  getAppointmentAdmin,
  updateAppointmentAdmin,
} from "@/lib/supabase/appointments-admin";
import { useSupabaseCrud } from "@/lib/supabase/crud";
import type { AppointmentMailContext } from "@/lib/mail/appointment-emails";
import { emailPatientOnStatusChange } from "@/lib/mail/appointment-status-mail";
import { ensurePatientForConfirmedAppointment } from "@/lib/ensure-patient-from-appointment";
import { NextResponse } from "next/server";
import type { AppointmentStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function mailCtxFromRecord(row: {
  patientName: string;
  email?: string | null;
  phone: string;
  treatmentName: string;
  appointmentCode: string;
  appointmentDate: string | Date;
  appointmentTime: string;
}): AppointmentMailContext {
  const dateRaw = row.appointmentDate;
  const dateStr =
    typeof dateRaw === "string"
      ? dateRaw.slice(0, 10)
      : dateRaw.toISOString().slice(0, 10);
  return {
    patientName: String(row.patientName),
    email: row.email ?? null,
    phone: String(row.phone),
    treatmentName: String(row.treatmentName),
    appointmentCode: String(row.appointmentCode),
    appointmentDate: dateStr,
    appointmentTime: String(row.appointmentTime),
  };
}

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
      include: { patient: true, service: true, branch: true, doctor: true },
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
      if (
        before &&
        body.status === "CONFIRMED" &&
        String(before.status) !== "CONFIRMED"
      ) {
        const { patientId } = await ensurePatientForConfirmedAppointment(
          {
            patientName: String(before.patientName),
            phone: String(before.phone),
            email: (before.email as string | null) ?? null,
          },
          {
            useSupabase: true,
            existingPatientId: (before.patientId as string | null) ?? null,
          },
        );
        if (patientId) data.patientId = patientId;
      }
      const item = await updateAppointmentAdmin(id, data);
      let patientEmailSent = false;
      let patientEmailWarning: string | undefined;
      if (before && body.status !== undefined && body.status !== before.status) {
        const mailCtx = mailCtxFromRecord({
          patientName: String(item.patientName ?? before.patientName),
          email: (item.email ?? before.email) as string | null,
          phone: String(item.phone ?? before.phone),
          treatmentName: String(item.treatmentName ?? before.treatmentName),
          appointmentCode: String(item.appointmentCode ?? before.appointmentCode),
          appointmentDate: String(item.appointmentDate ?? before.appointmentDate),
          appointmentTime: String(item.appointmentTime ?? before.appointmentTime),
        });
        const mailResult = await emailPatientOnStatusChange(
          mailCtx,
          String(body.status),
          String(before.status),
        );
        if (mailResult.ok && "messageId" in mailResult) {
          patientEmailSent = true;
        } else if (!mailResult.ok) {
          if ("skipped" in mailResult && mailResult.skipped && body.status === "CONFIRMED") {
            patientEmailWarning = "Patient has no email — confirmation saved but not emailed.";
          } else {
            patientEmailWarning = mailResult.error ?? "Could not email patient";
            console.error("Appointment status email:", mailResult);
          }
        }
      }
      return NextResponse.json({
        ...item,
        patientEmailSent,
        ...(patientEmailWarning ? { patientEmailWarning } : {}),
      });
    }

    const beforePrisma = await prisma.appointment.findUnique({ where: { id } });

    let linkedPatientId: string | null = beforePrisma?.patientId ?? null;
    if (
      beforePrisma &&
      body.status === "CONFIRMED" &&
      beforePrisma.status !== "CONFIRMED"
    ) {
      const ensured = await ensurePatientForConfirmedAppointment(
        {
          patientName: beforePrisma.patientName,
          phone: beforePrisma.phone,
          email: beforePrisma.email,
        },
        { useSupabase: false, existingPatientId: beforePrisma.patientId },
      );
      if (ensured.patientId) linkedPatientId = ensured.patientId;
    }

    const prismaData: {
      status?: AppointmentStatus;
      notes?: string | null;
      appointmentDate?: Date;
      appointmentTime?: string;
      patientId?: string | null;
    } = {};
    if (body.status !== undefined) prismaData.status = body.status;
    if (linkedPatientId && body.status === "CONFIRMED") {
      prismaData.patientId = linkedPatientId;
    }
    if (body.notes !== undefined) prismaData.notes = body.notes;
    if (data.appointmentDate) prismaData.appointmentDate = new Date(data.appointmentDate as string);
    if (data.appointmentTime) prismaData.appointmentTime = data.appointmentTime as string;

    const item = await prisma.appointment.update({
      where: { id },
      data: prismaData,
      include: { patient: true, service: true },
    });
    let patientEmailSent = false;
    let patientEmailWarning: string | undefined;
    if (beforePrisma && body.status !== undefined && body.status !== beforePrisma.status) {
      const mailCtx = mailCtxFromRecord(item);
      const mailResult = await emailPatientOnStatusChange(
        mailCtx,
        item.status,
        beforePrisma.status,
      );
      if (mailResult.ok && "messageId" in mailResult) {
        patientEmailSent = true;
      } else if (!mailResult.ok) {
        if ("skipped" in mailResult && mailResult.skipped && body.status === "CONFIRMED") {
          patientEmailWarning = "Patient has no email — confirmation saved but not emailed.";
        } else {
          patientEmailWarning = mailResult.error ?? "Could not email patient";
        }
      }
    }
    return NextResponse.json({
      ...item,
      patientEmailSent,
      ...(patientEmailWarning ? { patientEmailWarning } : {}),
    });
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
