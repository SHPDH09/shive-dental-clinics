import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET() {
  const { error } = await requireUser("ADMIN");
  if (error) return error;

  const [
    totalStudents,
    totalNotes,
    totalPurchases,
    revenueAgg,
    totalTransactions,
    activeCoupons,
    recentPurchases,
    recentStudents,
    recentTransactions,
    topNotes,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.note.count(),
    prisma.purchase.count(),
    prisma.order.aggregate({
      where: { paymentStatus: "SUCCESS" },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.count(),
    prisma.coupon.count({ where: { status: "ACTIVE" } }),
    prisma.purchase.findMany({
      take: 8,
      orderBy: { purchasedAt: "desc" },
      include: { user: true, note: true },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: true, order: { include: { items: { include: { note: true } } } } },
    }),
    prisma.note.findMany({ take: 5, orderBy: { purchaseCount: "desc" } }),
  ]);

  return NextResponse.json({
    stats: {
      totalStudents,
      totalNotes,
      totalPurchases,
      totalRevenue: decimalToNumber(revenueAgg._sum.totalAmount),
      totalTransactions,
      activeCoupons,
    },
    recentPurchases: recentPurchases.map((p) => ({
      id: p.id,
      student: p.user.name,
      note: p.note.title,
      amount: decimalToNumber(p.purchasedPrice),
      at: p.purchasedAt.toISOString(),
    })),
    recentStudents: recentStudents.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      at: s.createdAt.toISOString(),
    })),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      externalId: t.externalId,
      student: t.user.name,
      amount: decimalToNumber(t.amount),
      status: t.paymentStatus,
      at: t.createdAt.toISOString(),
      note: t.order.items[0]?.note.title,
    })),
    topNotes: topNotes.map((n) => ({
      id: n.id,
      title: n.title,
      purchaseCount: n.purchaseCount,
      finalPrice: decimalToNumber(n.finalPrice),
    })),
  });
}
