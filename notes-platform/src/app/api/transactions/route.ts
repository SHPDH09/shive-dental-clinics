import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { serializeTransaction } from "@/lib/serializers";

export async function GET() {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;

  const transactions = await prisma.transaction.findMany({
    where: { userId: session!.user.id },
    include: { order: { include: { items: { include: { note: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    transactions: transactions.map((tx) => ({
      ...serializeTransaction(tx),
      notes: tx.order.items.map((i) => i.note.title).join(", "),
    })),
  });
}
