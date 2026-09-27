import { getSupabaseProjectRef, isSupabaseConfigured } from "./supabase/env";
import { readWorkerEnv } from "./worker-env";

function isLegacyAwsRdsUrl(url: string): boolean {
  return url.includes("rds.amazonaws.com");
}

/** Prisma / pg connection string (Supabase Postgres preferred over stale AWS URLs). */
export function resolveDatabaseUrl(): string | undefined {
  const password = readWorkerEnv("SUPABASE_DB_PASSWORD");
  if (password) {
    const ref = getSupabaseProjectRef();
    const encoded = encodeURIComponent(password);
    const poolerHost =
      readWorkerEnv("SUPABASE_POOLER_HOST") || "aws-0-ap-south-1.pooler.supabase.com";
    return `postgresql://postgres.${ref}:${encoded}@${poolerHost}:5432/postgres?schema=public&sslmode=require&uselibpqcompat=true`;
  }

  const direct = readWorkerEnv("DATABASE_URL");
  if (!direct) return undefined;

  if (isSupabaseConfigured() && isLegacyAwsRdsUrl(direct)) {
    return undefined;
  }

  return direct;
}
