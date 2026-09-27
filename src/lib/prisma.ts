import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveDatabaseUrl } from "@/lib/database-url";
import { createPgPool } from "@/lib/pg-pool";
import type { Pool } from "pg";

function shouldUseNeonDriver(connectionString: string): boolean {
  return (
    connectionString.includes("supabase.com") ||
    connectionString.includes("pooler.supabase.com")
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(connectionString: string) {
  if (shouldUseNeonDriver(connectionString)) {
    neonConfig.poolQueryViaFetch = true;
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  const pool = globalForPrisma.pool ?? createPgPool(connectionString);
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Lazily creates Prisma client so `next build` can run without DATABASE_URL (e.g. Cloudflare CI). */
export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL or SUPABASE_DB_PASSWORD is not set");
  }

  globalForPrisma.prisma = createPrismaClient(connectionString);
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
