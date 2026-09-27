/** Normalize Supabase/PostgREST and fetch errors for API responses. */
export function errorMessageFromUnknown(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message;
    if (typeof o.error === "string") return o.error;
    if (typeof o.details === "string" && o.details.trim()) return o.details;
  }
  return "Request failed";
}

export function mapSupabaseErrorMessage(message: string): string {
  if (/Could not find the 'address' column.*Branch/i.test(message)) {
    return 'Branch table is outdated — run supabase/migration-branches-premium.sql in Supabase SQL Editor.';
  }
  if (/relation.*does not exist|Could not find the table/i.test(message)) {
    if (/ServiceCategory/i.test(message)) {
      return (
        "ServiceCategory table missing on the Supabase project this Worker is using. " +
        "In Supabase SQL Editor run supabase/migration-services-premium.sql, then NOTIFY pgrst, 'reload schema';. " +
        "If the table already exists, fix Cloudflare: remove a wrong SUPABASE_SECRET_KEY secret or redeploy so SUPABASE_SKEY_B64 from wrangler.jsonc is used."
      );
    }
    return 'Database table missing — run the latest supabase/migration-*.sql files in Supabase SQL Editor.';
  }
  if (/permission denied|row-level security|RLS|42501/i.test(message)) {
    return 'Database permission denied — run supabase/rls-authenticated-admin.sql (adds ServiceCategory policy).';
  }
  if (/duplicate key|unique constraint|23505/i.test(message)) {
    return "Category slug already exists — use a different name or slug.";
  }
  if (/SUPABASE_SECRET_KEY|service role/i.test(message)) {
    return "Server missing SUPABASE_SECRET_KEY — add it in Cloudflare Worker secrets for admin writes.";
  }
  return message;
}
