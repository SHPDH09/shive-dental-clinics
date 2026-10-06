import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ noteId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;
  const { noteId } = await params;

  await prisma.cartItem.deleteMany({ where: { userId: session!.user.id, noteId } });
  return NextResponse.json({ ok: true });
}
