import { prisma } from "@/lib/prisma";
import { appointmentPublicSchema } from "@/lib/validations";
import { generateCode } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = appointmentPublicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const appointment = await prisma.appointment.create({
      data: {
        appointmentCode: generateCode("APT"),
        patientName: data.patientName,
        phone: data.phone,
        email: data.email || null,
        serviceId: data.serviceId || null,
        treatmentName: data.treatmentName,
        appointmentDate: new Date(data.appointmentDate),
        appointmentTime: data.appointmentTime,
        message: data.message || null,
        status: "PENDING",
      },
    });

    await createNotification({
      type: "NEW_APPOINTMENT",
      title: "New appointment request",
      message: `${appointment.patientName} booked ${appointment.treatmentName}`,
      link: "/admin/appointments",
    });

    return NextResponse.json({
      success: true,
      appointmentId: appointment.appointmentCode,
      id: appointment.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
