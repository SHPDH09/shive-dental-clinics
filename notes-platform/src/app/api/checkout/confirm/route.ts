import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { finalizeSuccessfulOrder } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { fetchCashfreeOrderStatus } from "@/lib/payment";

export async function POST(req: Request) {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;

  const body = (await req.json().catch(() => ({}))) as { orderId?: string };
  if (!body.orderId) return NextResponse.json({ error: "orderId required." }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: body.orderId, userId: session!.user.id },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (order.paymentStatus === "SUCCESS") {
    return NextResponse.json({ ok: true, orderId: order.id });
  }

  const provider = process.env.PAYMENT_PROVIDER === "mock" || !process.env.CASHFREE_APP_ID ? "mock" : "cashfree";

  if (provider === "mock") {
    await finalizeSuccessfulOrder(order.id);
    return NextResponse.json({ ok: true, orderId: order.id });
  }

  const status = await fetchCashfreeOrderStatus(order.id);
  if (status !== "PAID") {
    return NextResponse.json({ error: "Payment not confirmed yet." }, { status: 402 });
  }

  await finalizeSuccessfulOrder(order.id);
  return NextResponse.json({ ok: true, orderId: order.id });
}
