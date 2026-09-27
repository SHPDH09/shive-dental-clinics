import { createPublicEnquiry } from "@/lib/create-public-enquiry";
import { createNotification } from "@/lib/notifications";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { enquirySchema } from "@/lib/validations";
import { firstZodFieldError } from "@/lib/zod-api-error";
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
      return NextResponse.json({ error: firstZodFieldError(parsed.error) }, { status: 400 });
    }

    if (parsed.data.website) {
      return NextResponse.json({ success: true, id: "ok" });
    }

    const data = parsed.data;
    const subject = data.subject?.trim() || "Website contact enquiry";
    const enquiry = await createPublicEnquiry({
      name: data.name,
      phone: data.phone,
      email: data.email,
      subject,
      message: data.message,
    });

    try {
      await createNotification({
        type: "NEW_ENQUIRY",
        title: "New message",
        message: `${enquiry.name}: ${subject}`,
        link: "/admin/messages",
      });
    } catch (notifyErr) {
      console.error("Enquiry notification failed (enquiry saved):", notifyErr);
    }

    return NextResponse.json({ success: true, id: enquiry.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
  }
}
