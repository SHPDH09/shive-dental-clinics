import type { DiscountType } from "@/generated/prisma/client";

export function calculateNoteFinalPrice(
  price: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  if (discountValue <= 0) return roundMoney(price);
  if (discountType === "PERCENTAGE") {
    const pct = Math.min(100, Math.max(0, discountValue));
    return roundMoney(price - (price * pct) / 100);
  }
  return roundMoney(Math.max(0, price - discountValue));
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function discountPercent(price: number, finalPrice: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - finalPrice) / price) * 100);
}
