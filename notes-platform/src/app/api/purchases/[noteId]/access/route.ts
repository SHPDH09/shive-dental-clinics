import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getSignedPdfUrl } from "@/lib/storage";

type Params = { params: Promise<{ noteId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;
  const { noteId } = await params;

  const purchase = await prisma.purchase.findUnique({
    where: { userId_noteId: { userId: session!.user.id, noteId } },
    include: { note: true },
  });
  if (!purchase) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const note = purchase.note;
  let pdfUrl: string | null = null;
  if (note.pdfPath) {
    pdfUrl = await getSignedPdfUrl(note.pdfPath);
  }

  return NextResponse.json({
    noteId,
    title: note.title,
    externalLink: note.notesLink,
    pdfUrl,
  });
}
