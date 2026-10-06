import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { serializeCoupon } from "@/lib/serializers";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  code: z.string().min(3).max(30).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  noteIds: z.array(z.string()).optional(),
  maxUsers: z.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  minPurchaseAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional().nullable(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  if (parsed.data.noteIds) {
    await prisma.couponNote.deleteMany({ where: { couponId: id } });
    if (parsed.data.noteIds.length) {
      await prisma.couponNote.createMany({
        data: parsed.data.noteIds.map((noteId) => ({ couponId: id, noteId })),
      });
    }
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(parsed.data.code != null ? { code: parsed.data.code.trim().toUpperCase() } : {}),
      ...(parsed.data.discountType != null ? { discountType: parsed.data.discountType } : {}),
      ...(parsed.data.discountValue != null ? { discountValue: parsed.data.discountValue } : {}),
      ...(parsed.data.maxUsers !== undefined ? { maxUsers: parsed.data.maxUsers } : {}),
      ...(parsed.data.validFrom != null ? { validFrom: new Date(parsed.data.validFrom) } : {}),
      ...(parsed.data.validUntil != null ? { validUntil: new Date(parsed.data.validUntil) } : {}),
      ...(parsed.data.minPurchaseAmount != null ? { minPurchaseAmount: parsed.data.minPurchaseAmount } : {}),
      ...(parsed.data.maxDiscount !== undefined ? { maxDiscount: parsed.data.maxDiscount } : {}),
      ...(parsed.data.status != null ? { status: parsed.data.status } : {}),
    },
    include: { couponNotes: true, usages: true },
  });

  return NextResponse.json({ coupon: { ...serializeCoupon(coupon), usage: coupon.usages.length } });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const { id } = await params;
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
