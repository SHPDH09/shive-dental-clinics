import { enforceRateLimit } from "@/lib/rate-limit";
import { isAppointmentSlotAvailable } from "@/lib/appointment-slots";
import { prisma } from "@/lib/prisma";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import { appointmentPublicSchema } from "@/lib/validations";
import { generateCode } from "@/lib/utils";
import { createAppointmentEnquiry } from "@/lib/create-appointment-enquiry";
import { createNotification } from "@/lib/notifications";
import { captureLeadFromWebsite } from "@/lib/leads/capture-lead";
import { recordWebsiteVisitLead } from "@/lib/record-website-visit-lead";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "appointment", 12, 60 * 60 * 1000);
    if (limited) return limited;

    const body = await req.json();
    const parsed = appointmentPublicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const appointmentCode = generateCode("APT");
    const appointmentDate = new Date(data.appointmentDate);

    if (data.doctorId) {
      const slotOk = await isAppointmentSlotAvailable(
        data.doctorId,
        data.appointmentDate,
        data.appointmentTime,
        data.branchId,
      );
      if (!slotOk) {
        return NextResponse.json(
          { error: "This time slot is no longer available. Please choose another time." },
          { status: 409 },
        );
      }
    }

    let appointment: { id: string; appointmentCode: string; patientName: string; treatmentName: string };

    if (useSupabaseCrud()) {
      const row = (await supabaseCreate("appointment", {
        appointmentCode,
        patientName: data.patientName,
        phone: data.phone,
        email: data.email || null,
        serviceId: data.serviceId || null,
        branchId: data.branchId || null,
        doctorId: data.doctorId || null,
        treatmentName: data.treatmentName,
        appointmentDate: appointmentDate.toISOString(),
        appointmentTime: data.appointmentTime,
        message: data.message || null,
        status: "PENDING",
      })) as { id: string; appointmentCode: string; patientName: string; treatmentName: string };
      appointment = row;
    } else {
      appointment = await prisma.appointment.create({
        data: {
          appointmentCode,
          patientName: data.patientName,
          phone: data.phone,
          email: data.email || null,
          serviceId: data.serviceId || null,
          branchId: data.branchId || null,
          doctorId: data.doctorId || null,
          treatmentName: data.treatmentName,
          appointmentDate,
          appointmentTime: data.appointmentTime,
          message: data.message || null,
          status: "PENDING",
        },
      });
    }

    try {
      await captureLeadFromWebsite({
        name: data.patientName,
        phone: data.phone,
        email: data.email,
        interestedService: data.treatmentName,
        source: "WEBSITE",
        captureChannel: "appointment_form",
      });
    } catch (leadErr) {
      console.error("Lead capture after appointment:", leadErr);
    }

    if (data.visitorId) {
      try {
        await recordWebsiteVisitLead({
          visitorId: data.visitorId,
          path: "/appointment",
          name: data.patientName,
          email: data.email,
          phone: data.phone,
          captureSource: "appointment_form",
        });
      } catch (leadErr) {
        console.error("Visit lead sync after appointment:", leadErr);
      }
    }

    await createNotification({
      type: "NEW_APPOINTMENT",
      title: "New appointment request",
      message: `${appointment.patientName} booked ${appointment.treatmentName}`,
      link: "/admin/appointments",
    });

    const mailCtx = {
      patientName: data.patientName,
      email: data.email,
      phone: data.phone,
      treatmentName: data.treatmentName,
      appointmentCode: appointment.appointmentCode,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
    };

    let patientEmailSent = false;
    let emailWarning: string | undefined;
    try {
      const { sendAppointmentBookedEmail, notifyAdminNewAppointment } = await import(
        "@/lib/mail/appointment-emails"
      );
      const [patientResult, adminResult] = await Promise.all([
        sendAppointmentBookedEmail(mailCtx),
        notifyAdminNewAppointment(mailCtx),
      ]);
      if (patientResult.ok) {
        patientEmailSent = true;
      } else if (!("skipped" in patientResult && patientResult.skipped)) {
        emailWarning = patientResult.error ?? "Could not send confirmation email";
        console.error("Appointment patient email:", patientResult);
      }
      if (adminResult.ok && "messageId" in adminResult) {
        console.info("Admin notified of new appointment:", appointment.appointmentCode);
      } else if (!adminResult.ok && !("skipped" in adminResult && adminResult.skipped)) {
        console.error("Appointment admin notify failed:", adminResult);
      }
    } catch (mailErr) {
      console.error("Appointment email error:", mailErr);
      emailWarning = "Could not send confirmation email";
    }

    try {
      await createAppointmentEnquiry({
        patientName: data.patientName,
        phone: data.phone,
        email: data.email,
        treatmentName: data.treatmentName,
        appointmentCode: appointment.appointmentCode,
        message: data.message,
      });
      await createNotification({
        type: "NEW_ENQUIRY",
        title: "New message",
        message: `Appointment enquiry from ${data.patientName}`,
        link: "/admin/messages",
      });
    } catch {
      /* non-blocking */
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment.appointmentCode,
      id: appointment.id,
      confirmationEmailSent: patientEmailSent,
      ...(emailWarning ? { emailWarning } : {}),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
