import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { serializePurchase, serializeTransaction, serializeUser } from "@/lib/serializers";
import { decimalToNumber } from "@/lib/utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  newPassword: z.string().min(8).optional(),
});

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const { id } = await params;

  const user = await prisma.user.findFirst({ where: { id, role: "STUDENT" } });
  if (!user) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const [purchases, transactions, spend] = await Promise.all([
    prisma.purchase.findMany({ where: { userId: id }, include: { note: true }, orderBy: { purchasedAt: "desc" } }),
    prisma.transaction.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
    prisma.order.aggregate({ where: { userId: id, paymentStatus: "SUCCESS" }, _sum: { totalAmount: true } }),
  ]);

  return NextResponse.json({
    user: serializeUser(user),
    totalSpent: decimalToNumber(spend._sum.totalAmount),
    purchases: purchases.map(serializePurchase),
    transactions: transactions.map(serializeTransaction),
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.name != null ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone?.trim() || null } : {}),
      ...(parsed.data.status != null ? { status: parsed.data.status } : {}),
      ...(parsed.data.newPassword ? { passwordHash: await hashPassword(parsed.data.newPassword) } : {}),
    },
  });

  return NextResponse.json({ user: serializeUser(user) });
}
