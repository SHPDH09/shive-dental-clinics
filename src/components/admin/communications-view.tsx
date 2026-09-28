"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { adminFetch } from "@/lib/admin-client";
import { LoadingState } from "@/components/admin/loading-state";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Mail, RefreshCw, Send, Star, Trash2 } from "lucide-react";

type MailRow = {
  id: string;
  folder: string;
  fromAddress: string;
  toAddresses: string[];
  subject: string;
  bodyText: string | null;
  read: boolean;
  starred: boolean;
  sentAt: string;
};

type Folder = "inbox" | "sent" | "trash";

export function CommunicationsView() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [items, setItems] = useState<MailRow[]>([]);
  const [selected, setSelected] = useState<MailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [q, setQ] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const s = await adminFetch<{ configured: boolean }>("/api/admin/mail/status");
      setConfigured(s.configured);
    } catch {
      setConfigured(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ folder, page: "1", limit: "40" });
      if (q.trim()) params.set("q", q.trim());
      const res = await adminFetch<{ items: MailRow[]; tableMissing?: boolean }>(
        `/api/admin/mail/messages?${params}`,
      );
      setItems(res.items ?? []);
      setTableMissing(Boolean(res.tableMissing));
    } catch {
      setError("Could not load emails");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [folder, q]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openMessage = async (row: MailRow) => {
    setSelected(row);
    if (!row.read) {
      await adminFetch(`/api/admin/mail/messages/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
      }).catch(() => null);
      setItems((prev) => prev.map((m) => (m.id === row.id ? { ...m, read: true } : m)));
    }
  };

  const syncInbox = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await adminFetch<{ synced: number; error?: string }>("/api/admin/mail/sync", {
        method: "POST",
      });
      if (res.error) setError(res.error);
      await loadList();
    } catch {
      setError("Inbox sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const sendEmail = async () => {
    setSending(true);
    setError(null);
    try {
      await adminFetch("/api/admin/mail/send", {
        method: "POST",
        body: JSON.stringify({ to, subject, body }),
      });
      setComposeOpen(false);
      setTo("");
      setSubject("");
      setBody("");
      setFolder("sent");
    } catch {
      setError("Send failed — check SMTP secrets on Cloudflare");
    } finally {
      setSending(false);
    }
  };

  const trashMessage = async (id: string) => {
    await adminFetch(`/api/admin/mail/messages/${id}`, { method: "DELETE" });
    setSelected(null);
    void loadList();
  };

  const toggleStar = async (row: MailRow) => {
    const updated = await adminFetch<MailRow>(`/api/admin/mail/messages/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ starred: !row.starred }),
    });
    setItems((prev) => prev.map((m) => (m.id === row.id ? updated : m)));
    if (selected?.id === row.id) setSelected(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
          <p className="text-sm text-slate-500">Gmail inbox sync, send email, appointment notifications</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setComposeOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Compose
          </Button>
          <Button type="button" variant="secondary" disabled={syncing} onClick={() => void syncInbox()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Sync inbox
          </Button>
        </div>
      </div>

      {configured === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          SMTP not configured. Add encrypted secrets <code className="text-xs">SMTP_USER</code> and{" "}
          <code className="text-xs">SMTP_APP_PASSWORD</code> on Cloudflare, then redeploy.
        </div>
      )}
      {tableMissing && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Mailbox table missing. Run <code className="text-xs">npm run supabase:apply-premium</code> (includes mailbox
          migration).
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        {(["inbox", "sent", "trash"] as Folder[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFolder(f);
              setSelected(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${
              folder === f ? "bg-sky-100 text-[var(--primary)]" : "bg-slate-100 text-slate-600"
            }`}
          >
            {f}
          </button>
        ))}
        <Input
          className="max-w-xs"
          placeholder="Search mail…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card-premium overflow-hidden lg:col-span-2">
          {loading ? (
            <LoadingState label="Loading mail…" />
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No messages in {folder}.</p>
          ) : (
            <ul className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
              {items.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => void openMessage(m)}
                    className={`flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-slate-50 ${
                      selected?.id === m.id ? "bg-sky-50" : ""
                    } ${!m.read ? "font-semibold" : ""}`}
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{m.subject || "(No subject)"}</p>
                      <p className="truncate text-xs text-slate-500">
                        {folder === "sent" ? m.toAddresses.join(", ") : m.fromAddress}
                      </p>
                      <p className="text-xs text-slate-400">{format(new Date(m.sentAt), "dd MMM yyyy HH:mm")}</p>
                    </div>
                    {m.starred && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-premium min-h-[320px] p-6 lg:col-span-3">
          {!selected ? (
            <p className="text-sm text-slate-500">Select a message to read.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selected.subject}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    From: {selected.fromAddress}
                    <br />
                    To: {selected.toAddresses.join(", ") || "—"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => void toggleStar(selected)}>
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => void trashMessage(selected.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{selected.bodyText ?? ""}</pre>
            </>
          )}
        </div>
      </div>

      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-premium w-full max-w-lg space-y-4 p-6">
            <h3 className="text-lg font-semibold">Compose email</h3>
            <div>
              <Label>To</Label>
              <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="patient@example.com" />
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={sending} onClick={() => void sendEmail()}>
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
