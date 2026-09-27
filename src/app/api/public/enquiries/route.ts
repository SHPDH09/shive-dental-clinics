import { prisma } from "@/lib/prisma";
import { enquirySchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = enquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
      },
    });

    await createNotification({
      type: "NEW_ENQUIRY",
      title: "New contact enquiry",
      message: `${enquiry.name} sent a message`,
      link: "/admin/messages",
    });

    return NextResponse.json({ success: true, id: enquiry.id });
  } catch {
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
  }
}
