import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireUser(role?: "ADMIN" | "STUDENT") {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (role && session.user.role !== role) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}
