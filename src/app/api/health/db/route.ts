import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const host = process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ":****@") ?? "not configured";
    return NextResponse.json({
      connected: true,
      message: "Successfully connected to PostgreSQL (AWS RDS)",
      databaseHost: host.split("@")[1]?.split("/")[0] ?? "unknown",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        connected: false,
        message: "Database connection failed",
        error: message,
      },
      { status: 503 },
    );
  }
}
