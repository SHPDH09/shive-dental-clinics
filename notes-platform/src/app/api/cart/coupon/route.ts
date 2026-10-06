import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { validateCouponForCart } from "@/lib/coupons";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function POST(req: Request) {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;
  const body = (await req.json().catch(() => ({}))) as { code?: string };
  if (!body.code?.trim()) return NextResponse.json({ error: "Coupon code required." }, { status: 400 });

  const cart = await prisma.cartItem.findMany({
    where: { userId: session!.user.id },
    include: { note: true },
  });
  const noteIds = cart.filter((c) => c.note.status === "ACTIVE").map((c) => c.noteId);
  const subtotal = cart.reduce((s, c) => s + decimalToNumber(c.note.finalPrice), 0);

  const result = await validateCouponForCart({
    code: body.code,
    userId: session!.user.id,
    noteIds,
    subtotal,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ couponDiscount: result.discount, couponId: result.couponId });
}
