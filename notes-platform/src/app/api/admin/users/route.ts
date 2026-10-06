import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { serializeUser } from "@/lib/serializers";
import { decimalToNumber } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export async function GET(req: Request) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const q = new URL(req.url).searchParams.get("q")?.trim();

  const users = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = await Promise.all(
    users.map(async (user) => {
      const [purchaseCount, spend] = await Promise.all([
        prisma.purchase.count({ where: { userId: user.id } }),
        prisma.order.aggregate({
          where: { userId: user.id, paymentStatus: "SUCCESS" },
          _sum: { totalAmount: true },
        }),
      ]);
      return {
        ...serializeUser(user),
        totalPurchases: purchaseCount,
        totalSpent: decimalToNumber(spend._sum.totalAmount),
      };
    }),
  );

  return NextResponse.json({ users: enriched });
}

export async function POST(req: Request) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid student payload." }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already exists." }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      phone: parsed.data.phone?.trim() || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: "STUDENT",
      status: parsed.data.status ?? "ACTIVE",
    },
  });

  return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
}
