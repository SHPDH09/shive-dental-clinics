import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { buildCheckoutFromCart, newExternalTransactionId } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { createPaymentSession } from "@/lib/payment";

export async function POST(req: Request) {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;

  const body = (await req.json().catch(() => ({}))) as { couponCode?: string | null };
  try {
    const checkout = await buildCheckoutFromCart(session!.user.id, body.couponCode);

    const order = await prisma.order.create({
      data: {
        userId: session!.user.id,
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        couponDiscount: checkout.couponDiscount,
        totalAmount: checkout.totalAmount,
        couponId: checkout.couponId,
        items: {
          create: checkout.lineItems.map((item) => ({
            noteId: item.noteId,
            price: item.price,
            discount: item.discount,
            finalPrice: item.finalPrice,
          })),
        },
      },
    });

    const externalId = newExternalTransactionId();
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId: session!.user.id,
        externalId,
        amount: checkout.totalAmount,
        paymentStatus: "PENDING",
        paymentMethod: process.env.PAYMENT_PROVIDER === "mock" ? "mock" : "cashfree",
      },
    });

    const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
    const payment = await createPaymentSession({
      orderId: order.id,
      amount: checkout.totalAmount,
      customerEmail: user!.email,
      customerName: user!.name,
      customerPhone: user!.phone,
    });

    return NextResponse.json({ orderId: order.id, payment });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout failed." }, { status: 400 });
  }
}
