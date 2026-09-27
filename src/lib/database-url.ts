import { getSupabaseProjectRef, isSupabaseConfigured } from "@/lib/supabase/env";

function isLegacyAwsRdsUrl(url: string): boolean {
  return url.includes("rds.amazonaws.com");
}

/** Prisma / pg connection string (Supabase Postgres preferred over stale AWS URLs). */
export function resolveDatabaseUrl(): string | undefined {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (password) {
    const ref = getSupabaseProjectRef();
    const encoded = encodeURIComponent(password);
    return `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres?schema=public&sslmode=require`;
  }

  const direct = process.env.DATABASE_URL?.trim();
  if (!direct) return undefined;

  if (isSupabaseConfigured() && isLegacyAwsRdsUrl(direct)) {
    return undefined;
  }

  return direct;
}
