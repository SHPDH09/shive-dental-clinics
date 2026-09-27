import { createId } from "@paralleldrive/cuid2";
import { findPatientIdByPhone } from "@/lib/enquiry-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import { enquirySchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (!checkRateLimit(`enquiry:${ip}`, 8, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = enquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.website) {
      return NextResponse.json({ success: true, id: "ok" });
    }

    const data = parsed.data;
    const subject = data.subject?.trim() || "Website contact enquiry";
    const patientId = await findPatientIdByPhone(data.phone);
    const inbound = {
      id: createId(),
      direction: "in" as const,
      subject,
      body: data.message,
      sentAt: new Date().toISOString(),
    };

    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      subject,
      message: data.message,
      source: "WEBSITE",
      status: "NEW",
      important: false,
      patientId,
      conversation: [inbound],
      auditLog: [],
    };

    let enquiry: { id: string; name: string };

    if (useSupabaseCrud()) {
      enquiry = (await supabaseCreate("enquiry", payload)) as { id: string; name: string };
    } else {
      enquiry = await prisma.enquiry.create({
        data: {
          ...payload,
          source: "WEBSITE",
          status: "NEW",
        },
      });
    }

    await createNotification({
      type: "NEW_ENQUIRY",
      title: "New message",
      message: `${enquiry.name}: ${subject}`,
      link: "/admin/messages",
    });

    return NextResponse.json({ success: true, id: enquiry.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
  }
}
