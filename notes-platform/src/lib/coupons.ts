import { prisma } from "@/lib/prisma";
import { roundMoney } from "@/lib/pricing";
import { decimalToNumber } from "@/lib/utils";
import type { DiscountType } from "@/generated/prisma/client";

export type CouponValidationResult =
  | { ok: true; couponId: string; discount: number }
  | { ok: false; error: string };

function applyCouponAmount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
  maxDiscount: number | null,
): number {
  let discount = 0;
  if (discountType === "PERCENTAGE") {
    discount = (subtotal * discountValue) / 100;
  } else {
    discount = discountValue;
  }
  if (maxDiscount != null) discount = Math.min(discount, maxDiscount);
  return roundMoney(Math.min(subtotal, Math.max(0, discount)));
}

export async function validateCouponForCart(params: {
  code: string;
  userId: string;
  noteIds: string[];
  subtotal: number;
}): Promise<CouponValidationResult> {
  const code = params.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code." };

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: { couponNotes: true },
  });
  if (!coupon) return { ok: false, error: "Invalid coupon code." };
  if (coupon.status !== "ACTIVE") return { ok: false, error: "This coupon is not active." };

  const now = new Date();
  if (now < coupon.validFrom) return { ok: false, error: "Coupon is not valid yet." };
  if (now > coupon.validUntil) return { ok: false, error: "Coupon has expired." };
  if (coupon.maxUsers != null && coupon.usedCount >= coupon.maxUsers) {
    return { ok: false, error: "Coupon usage limit reached." };
  }

  const minPurchase = decimalToNumber(coupon.minPurchaseAmount);
  if (params.subtotal < minPurchase) {
    return { ok: false, error: `Minimum purchase amount is ₹${minPurchase.toFixed(2)}.` };
  }

  if (coupon.couponNotes.length > 0) {
    const allowed = new Set(coupon.couponNotes.map((n) => n.noteId));
    const allAllowed = params.noteIds.every((id) => allowed.has(id));
    if (!allAllowed) {
      return { ok: false, error: "Coupon does not apply to items in your cart." };
    }
  }

  const priorUse = await prisma.couponUsage.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId: params.userId } },
  });
  if (priorUse) return { ok: false, error: "You have already used this coupon." };

  const discount = applyCouponAmount(
    params.subtotal,
    coupon.discountType,
    decimalToNumber(coupon.discountValue),
    coupon.maxDiscount != null ? decimalToNumber(coupon.maxDiscount) : null,
  );

  return { ok: true, couponId: coupon.id, discount };
}
