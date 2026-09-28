import { createId } from "@paralleldrive/cuid2";
import { getSupabaseSecretKey } from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";

export type MailFolder = "inbox" | "sent" | "trash";

export type MailboxRow = {
  id: string;
  folder: MailFolder;
  imapUid: number | null;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  read: boolean;
  starred: boolean;
  sentAt: string;
  createdAt: string;
};

function mapRow(r: Record<string, unknown>): MailboxRow {
  return {
    id: String(r.id),
    folder: String(r.folder) as MailFolder,
    imapUid: r.imapUid != null ? Number(r.imapUid) : null,
    fromAddress: String(r.fromAddress ?? ""),
    toAddresses: Array.isArray(r.toAddresses) ? (r.toAddresses as string[]) : [],
    ccAddresses: Array.isArray(r.ccAddresses) ? (r.ccAddresses as string[]) : [],
    subject: String(r.subject ?? ""),
    bodyText: (r.bodyText as string | null) ?? null,
    bodyHtml: (r.bodyHtml as string | null) ?? null,
    read: Boolean(r.read),
    starred: Boolean(r.starred),
    sentAt: String(r.sentAt),
    createdAt: String(r.createdAt),
  };
}

export async function listMailboxMessages(options: {
  folder: MailFolder;
  page: number;
  limit: number;
  q?: string;
}) {
  const sb = await getAdminSupabaseClient();
  const from = (options.page - 1) * options.limit;
  const to = from + options.limit - 1;

  let query = sb
    .from("MailboxMessage")
    .select("*", { count: "exact" })
    .eq("folder", options.folder)
    .order("sentAt", { ascending: false })
    .range(from, to);

  if (options.q?.trim()) {
    const q = options.q.trim();
    query = query.or(`subject.ilike.%${q}%,fromAddress.ilike.%${q}%,bodyText.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    if (/does not exist|PGRST205/i.test(error.message)) {
      return { items: [] as MailboxRow[], total: 0, tableMissing: true };
    }
    throw error;
  }
  return { items: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)), total: count ?? 0, tableMissing: false };
}

export async function getMailboxMessage(id: string) {
  const sb = await getAdminSupabaseClient();
  const { data, error } = await sb.from("MailboxMessage").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

async function mailboxSupabaseClient() {
  if (getSupabaseSecretKey()) {
    return createSupabaseServiceClient();
  }
  return getAdminSupabaseClient();
}

export async function saveSentMail(input: {
  id?: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses?: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  sentAt: Date;
}) {
  const sb = await mailboxSupabaseClient();
  const now = new Date().toISOString();
  const row = {
    id: input.id ?? createId(),
    folder: "sent",
    imapUid: null,
    fromAddress: input.fromAddress,
    toAddresses: input.toAddresses,
    ccAddresses: input.ccAddresses ?? [],
    subject: input.subject,
    bodyText: input.bodyText,
    bodyHtml: input.bodyHtml ?? null,
    read: true,
    starred: false,
    sentAt: input.sentAt.toISOString(),
    createdAt: now,
    updatedAt: now,
  };
  const { error } = await sb.from("MailboxMessage").upsert(row, { onConflict: "id" });
  if (error && !/does not exist|PGRST205/i.test(error.message)) throw error;
}

export async function upsertInboxMail(rows: Omit<MailboxRow, "createdAt">[]) {
  if (rows.length === 0) return 0;
  const sb = await getAdminSupabaseClient();
  const now = new Date().toISOString();
  const payload = rows.map((r) => ({
    ...r,
    folder: "inbox" as const,
    createdAt: now,
    updatedAt: now,
  }));
  const { error } = await sb.from("MailboxMessage").upsert(payload, { onConflict: "id" });
  if (error) {
    if (/does not exist|PGRST205/i.test(error.message)) return 0;
    throw error;
  }
  return rows.length;
}

export async function updateMailboxMessage(
  id: string,
  patch: Partial<Pick<MailboxRow, "read" | "starred" | "folder">>,
) {
  const sb = await getAdminSupabaseClient();
  const { data, error } = await sb
    .from("MailboxMessage")
    .update({ ...patch, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Record<string, unknown>) : null;
}
