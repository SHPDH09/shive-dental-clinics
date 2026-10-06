import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { serializeCoupon } from "@/lib/serializers";
import { z } from "zod";

const couponSchema = z.object({
  code: z.string().min(3).max(30),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  noteIds: z.array(z.string()).optional(),
  maxUsers: z.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  minPurchaseAmount: z.number().nonnegative().default(0),
  maxDiscount: z.number().positive().optional().nullable(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export async function GET(req: Request) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const q = new URL(req.url).searchParams.get("q")?.trim()?.toUpperCase();
  const coupons = await prisma.coupon.findMany({
    where: q ? { code: { contains: q, mode: "insensitive" } } : undefined,
    include: { couponNotes: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ coupons: coupons.map(serializeCoupon) });
}

export async function POST(req: Request) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const parsed = couponSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid coupon." }, { status: 400 });

  const code = parsed.data.code.trim().toUpperCase();
  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      maxUsers: parsed.data.maxUsers ?? null,
      validFrom: new Date(parsed.data.validFrom),
      validUntil: new Date(parsed.data.validUntil),
      minPurchaseAmount: parsed.data.minPurchaseAmount,
      maxDiscount: parsed.data.maxDiscount ?? null,
      status: parsed.data.status ?? "ACTIVE",
      couponNotes: parsed.data.noteIds?.length
        ? { create: parsed.data.noteIds.map((noteId) => ({ noteId })) }
        : undefined,
    },
    include: { couponNotes: true },
  });

  return NextResponse.json({ coupon: serializeCoupon(coupon) }, { status: 201 });
}
