import { getSupabaseProjectRef, isSupabaseConfigured } from "./supabase/env";

function isLegacyAwsRdsUrl(url: string): boolean {
  return url.includes("rds.amazonaws.com");
}

/** Prisma / pg connection string (Supabase Postgres preferred over stale AWS URLs). */
export function resolveDatabaseUrl(): string | undefined {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (password) {
    const ref = getSupabaseProjectRef();
    const encoded = encodeURIComponent(password);
    const poolerHost =
      process.env.SUPABASE_POOLER_HOST?.trim() || "aws-0-ap-south-1.pooler.supabase.com";
    return `postgresql://postgres.${ref}:${encoded}@${poolerHost}:5432/postgres?schema=public&sslmode=require&uselibpqcompat=true`;
  }

  const direct = process.env.DATABASE_URL?.trim();
  if (!direct) return undefined;

  if (isSupabaseConfigured() && isLegacyAwsRdsUrl(direct)) {
    return undefined;
  }

  return direct;
}
