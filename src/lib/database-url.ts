import { getSupabaseProjectRef } from "@/lib/supabase/env";

/** Prisma / pg connection string (Supabase Postgres or any PostgreSQL). */
export function resolveDatabaseUrl(): string | undefined {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (!password) return undefined;

  const ref = getSupabaseProjectRef();
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres?schema=public&sslmode=require`;
}
