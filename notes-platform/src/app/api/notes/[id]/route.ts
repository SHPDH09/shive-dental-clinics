import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeNote } from "@/lib/serializers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.status !== "ACTIVE") {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  await prisma.note.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  const session = await auth();
  let owned = false;
  if (session?.user?.role === "STUDENT") {
    const purchase = await prisma.purchase.findUnique({
      where: { userId_noteId: { userId: session.user.id, noteId: id } },
    });
    owned = Boolean(purchase);
  }

  return NextResponse.json({ note: serializeNote(note, owned) });
}
