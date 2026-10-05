"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Archive, Mail, MessageCircle, Search, Send, Smartphone, Star } from "lucide-react";
import { DataLoadingSection } from "@/components/branding/data-loading-section";

export type ThreadRow = {
  id: string;
  channel: string;
  status: string;
  contactName: string;
  patientCode: string | null;
  phone: string | null;
  email: string | null;
  branchName: string | null;
  lastMessage: string;
  lastAt: string;
  assignedStaff: string | null;
  unreadCount: number;
  important: boolean;
  patientId: string | null;
  leadId: string | null;
  enquiryId: string | null;
};

type ThreadDetail = ThreadRow & {
  messages: {
    id: string;
    direction: string;
    body: string;
    senderLabel: string | null;
    createdAt: string;
  }[];
};

type Props = {
  onRefresh?: () => void;
};

export function InboxPanel({ onRefresh }: Props) {
  const [rows, setRows] = useState<ThreadRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [replyChannel, setReplyChannel] = useState<"WHATSAPP" | "SMS" | "EMAIL">("WHATSAPP");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (channel) params.set("channel", channel);
    if (status) params.set("status", status);
    if (unreadOnly) params.set("unread", "1");
    try {
      const res = await adminFetch<{ items: ThreadRow[] }>(`/api/admin/communications/threads?${params}`);
      setRows(res.items);
    } finally {
      setListLoading(false);
    }
  }, [q, channel, status, unreadOnly]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const d = await adminFetch<ThreadDetail>(`/api/admin/communications/threads/${id}`);
      setDetail(d);
      setSelectedId(id);
      if (d.channel === "EMAIL") setReplyChannel("EMAIL");
      else if (d.channel === "SMS") setReplyChannel("SMS");
      else setReplyChannel("WHATSAPP");
      await adminFetch(`/api/admin/communications/threads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ markRead: true }),
      });
      void loadList();
    } finally {
      setDetailLoading(false);
    }
  }, [loadList]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const patchThread = async (patch: Record<string, unknown>) => {
    if (!selectedId) return;
    const d = await adminFetch<ThreadDetail>(`/api/admin/communications/threads/${selectedId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setDetail(d);
    void loadList();
    onRefresh?.();
  };

  const sendReply = async () => {
    if (!selectedId || !replyBody.trim()) return;
    setSending(true);
    try {
      const res = await adminFetch<{ results: { whatsAppUrl?: string }[]; thread: ThreadDetail }>(
        `/api/admin/communications/threads/${selectedId}/reply`,
        {
          method: "POST",
          body: JSON.stringify({ channel: replyChannel, message: replyBody }),
        },
      );
      const wa = res.results.find((r) => r.whatsAppUrl);
      if (wa?.whatsAppUrl) window.open(wa.whatsAppUrl, "_blank", "noopener,noreferrer");
      setReplyBody("");
      setDetail(res.thread);
      void loadList();
      onRefresh?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_minmax(360px,1.4fr)]">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input placeholder="Search conversations…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">All channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="OPEN">Open</option>
            <option value="ARCHIVED">Archived</option>
            <option value="CLOSED">Closed</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            Unread only
          </label>
        </div>
        <DataLoadingSection loading={listLoading} label="Loading conversations…" minHeight="min-h-[240px]">
        <ul className="max-h-[520px] space-y-1 overflow-y-auto">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => void loadDetail(row.id)}
                className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${
                  selectedId === row.id ? "bg-[#fff8e1] ring-1 ring-[#f4c430]/50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    {row.important && <Star className="mr-1 inline h-3 w-3 fill-amber-400 text-amber-400" />}
                    {row.contactName}
                  </p>
                  {row.unreadCount > 0 && (
                    <span className="rounded-full bg-[#d91f26] px-2 py-0.5 text-xs font-semibold text-white">{row.unreadCount}</span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">{row.lastMessage}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {row.channel} · {format(new Date(row.lastAt), "dd MMM HH:mm")}
                </p>
              </button>
            </li>
          ))}
        </ul>
        {rows.length === 0 && !listLoading && (
          <p className="py-8 text-center text-sm text-slate-500">No conversations match your filters.</p>
        )}
        </DataLoadingSection>
      </div>

      <div className="flex min-h-[520px] flex-col rounded-2xl border border-slate-200 bg-white">
        {detailLoading ? (
          <DataLoadingSection loading label="Loading conversation…" minHeight="min-h-[520px]">
            {null}
          </DataLoadingSection>
        ) : !detail ? (
          <p className="flex flex-1 items-center justify-center text-sm text-slate-500">Select a conversation</p>
        ) : (
          <>
            <div className="border-b border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{detail.contactName}</h2>
                  <p className="text-xs text-slate-500">
                    {detail.patientCode ? `Patient ${detail.patientCode}` : detail.leadId ? `Lead ${detail.leadId.slice(0, 8)}…` : "Contact"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {detail.phone ?? "—"} {detail.email ? `· ${detail.email}` : ""}
                  </p>
                  {detail.branchName && <p className="text-xs text-slate-500">Branch: {detail.branchName}</p>}
                  {detail.assignedStaff && <p className="text-xs text-slate-500">Assigned: {detail.assignedStaff}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {detail.patientId && (
                        <Link href={`/admin/patients/${detail.patientId}`} className="text-sm font-medium text-[#d91f26] hover:underline">
                      Patient profile
                    </Link>
                  )}
                  {detail.leadId && (
                        <Link href={`/admin/leads/${detail.leadId}`} className="text-sm font-medium text-[#d91f26] hover:underline">
                      Lead profile
                    </Link>
                  )}
                  <Button type="button" variant="secondary" onClick={() => void patchThread({ important: !detail.important })}>
                    <Star className="mr-1 h-4 w-4" /> {detail.important ? "Unmark" : "Important"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void patchThread({ status: detail.status === "ARCHIVED" ? "OPEN" : "ARCHIVED" })}
                  >
                    <Archive className="mr-1 h-4 w-4" /> {detail.status === "ARCHIVED" ? "Unarchive" : "Archive"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => void patchThread({ markUnread: true })}>
                    Mark unread
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {detail.messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    m.direction === "OUTBOUND" ? "admin-bubble-staff ml-auto" : "admin-bubble-patient"
                  }`}
                >
                  <p className="text-xs opacity-80">{m.senderLabel ?? (m.direction === "OUTBOUND" ? "Staff" : "Patient")}</p>
                  <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-1 text-[10px] opacity-70">{format(new Date(m.createdAt), "dd MMM yyyy HH:mm")}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 p-4">
              <Label>Type your message</Label>
              <Textarea rows={3} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Type your message…" />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(["WHATSAPP", "SMS", "EMAIL"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setReplyChannel(ch)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                      replyChannel === ch ? "bg-[#1a3260] text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {ch === "WHATSAPP" && <MessageCircle className="h-3 w-3" />}
                    {ch === "SMS" && <Smartphone className="h-3 w-3" />}
                    {ch === "EMAIL" && <Mail className="h-3 w-3" />}
                    {ch === "WHATSAPP" ? "WhatsApp" : ch === "SMS" ? "SMS" : "Email"}
                  </button>
                ))}
                <Button type="button" disabled={sending || !replyBody.trim()} onClick={() => void sendReply()}>
                  <Send className="mr-2 h-4 w-4" /> Send
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
