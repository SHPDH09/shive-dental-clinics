import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { serializePurchase } from "@/lib/serializers";

export async function GET() {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;

  const purchases = await prisma.purchase.findMany({
    where: { userId: session!.user.id },
    include: { note: true },
    orderBy: { purchasedAt: "desc" },
  });

  return NextResponse.json({ purchases: purchases.map(serializePurchase) });
}
