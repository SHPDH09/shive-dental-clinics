import { prisma } from "@/lib/prisma";
import { validateCouponForCart } from "@/lib/coupons";
import { roundMoney } from "@/lib/pricing";
import { decimalToNumber } from "@/lib/utils";
import { randomUUID } from "crypto";

export async function buildCheckoutFromCart(userId: string, couponCode?: string | null) {
  const cart = await prisma.cartItem.findMany({
    where: { userId },
    include: { note: true },
  });
  if (cart.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const owned = await prisma.purchase.findMany({
    where: { userId, noteId: { in: cart.map((c) => c.noteId) } },
    select: { noteId: true },
  });
  const ownedSet = new Set(owned.map((p) => p.noteId));
  const unpurchased = cart.filter((c) => c.note.status === "ACTIVE" && !ownedSet.has(c.noteId));
  if (unpurchased.length === 0) {
    throw new Error("All items in your cart are already purchased or unavailable.");
  }

  let subtotal = 0;
  let productDiscount = 0;
  const lineItems = unpurchased.map((item) => {
    const price = decimalToNumber(item.note.price);
    const final = decimalToNumber(item.note.finalPrice);
    subtotal += price;
    productDiscount += price - final;
    return {
      noteId: item.noteId,
      price,
      discount: roundMoney(price - final),
      finalPrice: final,
    };
  });

  const merchandiseTotal = roundMoney(lineItems.reduce((s, l) => s + l.finalPrice, 0));
  let couponId: string | null = null;
  let couponDiscount = 0;
  if (couponCode?.trim()) {
    const validation = await validateCouponForCart({
      code: couponCode,
      userId,
      noteIds: lineItems.map((l) => l.noteId),
      subtotal: merchandiseTotal,
    });
    if (!validation.ok) throw new Error(validation.error);
    couponId = validation.couponId;
    couponDiscount = validation.discount;
  }

  const totalAmount = roundMoney(Math.max(0, merchandiseTotal - couponDiscount));

  return {
    lineItems,
    subtotal: roundMoney(subtotal),
    discount: roundMoney(productDiscount),
    couponDiscount,
    totalAmount,
    couponId,
  };
}

export async function finalizeSuccessfulOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found.");
    if (order.paymentStatus === "SUCCESS") return order;

    for (const item of order.items) {
      const existing = await tx.purchase.findUnique({
        where: { userId_noteId: { userId: order.userId, noteId: item.noteId } },
      });
      if (existing) continue;
      await tx.purchase.create({
        data: {
          userId: order.userId,
          noteId: item.noteId,
          orderId: order.id,
          purchasedPrice: item.finalPrice,
        },
      });
      await tx.note.update({
        where: { id: item.noteId },
        data: { purchaseCount: { increment: 1 } },
      });
    }

    if (order.couponId) {
      await tx.couponUsage.upsert({
        where: { couponId_userId: { couponId: order.couponId, userId: order.userId } },
        create: { couponId: order.couponId, userId: order.userId, orderId: order.id },
        update: { orderId: order.id },
      });
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.cartItem.deleteMany({
      where: { userId: order.userId, noteId: { in: order.items.map((i) => i.noteId) } },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "SUCCESS", transactionStatus: "SUCCESS" },
    });

    await tx.transaction.updateMany({
      where: { orderId: order.id },
      data: { paymentStatus: "SUCCESS" },
    });

    return order;
  });
}

export function newExternalTransactionId() {
  return `txn_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
}
