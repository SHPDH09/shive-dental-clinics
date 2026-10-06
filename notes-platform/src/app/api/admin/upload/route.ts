import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { uploadPrivatePdf, uploadPublicImage } from "@/lib/storage";

export async function POST(req: Request) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;

  const form = await req.formData();
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  try {
    if (kind === "cover") {
      const url = await uploadPublicImage(file);
      return NextResponse.json({ url });
    }
    if (kind === "pdf") {
      const path = await uploadPrivatePdf(file);
      return NextResponse.json({ path });
    }
    return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
