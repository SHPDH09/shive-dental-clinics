import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET(req: Request) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const studentId = searchParams.get("studentId") ?? undefined;
  const noteId = searchParams.get("noteId") ?? undefined;
  const paymentStatus = searchParams.get("paymentStatus") ?? undefined;
  const transactionStatus = searchParams.get("transactionStatus") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const orders = await prisma.order.findMany({
    where: {
      ...(studentId ? { userId: studentId } : {}),
      ...(paymentStatus ? { paymentStatus: paymentStatus as "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" } : {}),
      ...(transactionStatus
        ? { transactionStatus: transactionStatus as "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" }
        : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(noteId ? { items: { some: { noteId } } } : {}),
      ...(q
        ? {
            OR: [
              { user: { name: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              { transactions: { some: { externalId: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      user: true,
      coupon: true,
      items: { include: { note: true } },
      transactions: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    transactions: orders.map((order) => ({
      id: order.id,
      transactionId: order.transactions[0]?.externalId,
      studentName: order.user.name,
      studentEmail: order.user.email,
      noteName: order.items.map((i) => i.note.title).join(", "),
      amount: decimalToNumber(order.subtotal),
      discount: decimalToNumber(order.discount),
      coupon: order.coupon?.code ?? null,
      finalAmount: decimalToNumber(order.totalAmount),
      paymentStatus: order.paymentStatus,
      transactionStatus: order.transactionStatus,
      date: order.createdAt.toISOString(),
    })),
  });
}
