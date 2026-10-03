"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-client";
import { LoadingState } from "@/components/admin/loading-state";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { CommunicationsView } from "@/components/admin/communications-view";
import { renderTemplate } from "@/lib/communications/template-render";
import {
  Bell,
  History,
  Inbox,
  Mail,
  MessageCircle,
  Send,
  Settings,
  Smartphone,
  Zap,
} from "lucide-react";

type Tab =
  | "Inbox"
  | "Send Message"
  | "Templates"
  | "Campaigns"
  | "Automations"
  | "Communication History"
  | "Settings";

type Stats = {
  totalMessages: number;
  whatsAppSent: number;
  smsSent: number;
  emailsSent: number;
  pending: number;
  failed: number;
  unreadReplies: number;
};

type ChannelStatus = {
  channel: string;
  connected: boolean;
  label: string;
  detail: string;
};

type InboxRow = {
  id: string;
  patientName: string;
  patientCode: string | null;
  phone: string | null;
  email: string | null;
  channel: string;
  lastMessage: string;
  lastAt: string;
  assignedStaff: string | null;
  unreadCount: number;
  status: string;
  patientId: string | null;
  leadId: string | null;
  enquiryId: string | null;
};

type Template = {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body: string;
  channel?: string;
};

const TABS: Tab[] = [
  "Inbox",
  "Send Message",
  "Templates",
  "Campaigns",
  "Automations",
  "Communication History",
  "Settings",
];

export function CommunicationsHub() {
  const [tab, setTab] = useState<Tab>("Inbox");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [automations, setAutomations] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);

  const [sendChannel, setSendChannel] = useState<"WHATSAPP" | "SMS" | "EMAIL">("WHATSAPP");
  const [sendName, setSendName] = useState("");
  const [sendPhone, setSendPhone] = useState("");
  const [sendEmail, setSendEmail] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendTemplateSlug, setSendTemplateSlug] = useState("");
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const o = await adminFetch<{ stats: Stats; channels: ChannelStatus[] }>(
      "/api/admin/communications/overview",
    );
    setStats(o.stats);
    setChannels(o.channels);
  }, []);

  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      await loadOverview();
      if (tab === "Inbox") {
        const res = await adminFetch<{ items: InboxRow[] }>("/api/admin/communications/inbox");
        setInbox(res.items);
      }
      if (tab === "Templates") {
        const res = await adminFetch<{ items: Template[] }>("/api/admin/message-templates?limit=100");
        setTemplates(res.items ?? []);
      }
      if (tab === "Automations") {
        const res = await adminFetch<{ items: Record<string, unknown>[] }>(
          "/api/admin/communications/automations",
        );
        setAutomations(res.items ?? []);
      }
      if (tab === "Campaigns") {
        const res = await adminFetch<{ items: Record<string, unknown>[] }>(
          "/api/admin/communications/campaigns",
        );
        setCampaigns(res.items ?? []);
      }
      if (tab === "Communication History") {
        const res = await adminFetch<{ items: Record<string, unknown>[] }>(
          "/api/admin/communications/history?limit=150",
        );
        setHistory(res.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, loadOverview]);

  useEffect(() => {
    void loadTabData();
  }, [loadTabData]);

  useEffect(() => {
    setPreview(
      renderTemplate(sendBody, {
        patient_name: sendName || "Patient",
        appointment_date: "10 Oct 2026",
        appointment_time: "11:00 AM",
        doctor_name: "Dr. Rishikesh Prasad",
        clinic_phone: "9973479904",
      }),
    );
  }, [sendBody, sendName]);

  const failedItems = useMemo(
    () => history.filter((h) => String(h.status) === "FAILED"),
    [history],
  );

  const applyTemplate = (slug: string) => {
    const t = templates.find((x) => x.slug === slug);
    if (!t) return;
    setSendTemplateSlug(t.slug);
    setSendBody(t.body);
    setSendSubject(t.subject);
    if (t.channel === "EMAIL" || t.channel === "WHATSAPP" || t.channel === "SMS") {
      setSendChannel(t.channel);
    }
  };

  const submitSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const res = await adminFetch<{ results: { ok: boolean; error?: string; whatsAppUrl?: string }[] }>(
        "/api/admin/communications/send",
        {
          method: "POST",
          body: JSON.stringify({
            channels: [sendChannel],
            recipientName: sendName,
            phone: sendPhone,
            email: sendEmail,
            subject: sendSubject,
            message: sendBody,
            templateSlug: sendTemplateSlug || undefined,
          }),
        },
      );
      const wa = res.results.find((r) => r.whatsAppUrl);
      if (wa?.whatsAppUrl) window.open(wa.whatsAppUrl, "_blank", "noopener,noreferrer");
      if (res.results.some((r) => !r.ok)) {
        setSendError(res.results.map((r) => r.error).filter(Boolean).join(" · ") || "Some channels failed");
      } else {
        setSendBody("");
        setTab("Communication History");
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const toggleAutomation = async (id: string, enabled: boolean) => {
    await adminFetch("/api/admin/communications/automations", {
      method: "PATCH",
      body: JSON.stringify({ id, enabled }),
    });
    void loadTabData();
  };

  const retryFailed = async (logId: string) => {
    await adminFetch("/api/admin/communications/retry", {
      method: "POST",
      body: JSON.stringify({ logId }),
    });
    void loadTabData();
  };

  if (loading && !stats) return <LoadingState />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
        <p className="mt-1 text-sm text-slate-600">
          WhatsApp, SMS, email, and notifications — one place for patient engagement.
        </p>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: "Total Messages", value: stats.totalMessages },
            { label: "WhatsApp Sent", value: stats.whatsAppSent },
            { label: "SMS Sent", value: stats.smsSent },
            { label: "Emails Sent", value: stats.emailsSent },
            { label: "Pending", value: stats.pending },
            { label: "Failed", value: stats.failed },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.unreadReplies > 0 && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Bell className="h-4 w-4" />
          {stats.unreadReplies} unread admin notification(s)
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((ch) => (
          <div
            key={ch.channel}
            className={`rounded-2xl border p-4 ${ch.connected ? "border-teal-200 bg-teal-50/40" : "border-slate-200 bg-slate-50"}`}
          >
            <p className="font-semibold text-slate-900">{ch.label}</p>
            <p className={`text-xs font-semibold ${ch.connected ? "text-teal-700" : "text-amber-700"}`}>
              {ch.connected ? "Connected" : "Not Connected"}
            </p>
            <p className="mt-2 text-xs text-slate-600">{ch.detail}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === t ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Inbox" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Patient / Lead</th>
                <th className="px-4 py-3 text-left">Channel</th>
                <th className="px-4 py-3 text-left">Last message</th>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inbox.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.patientName}</p>
                    <p className="text-xs text-slate-500">{row.phone ?? row.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">{row.channel}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{row.lastMessage}</td>
                  <td className="px-4 py-3">{format(new Date(row.lastAt), "dd MMM yyyy HH:mm")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.patientId && (
                        <Link href={`/admin/patients/${row.patientId}`} className="text-violet-700 hover:underline">
                          View patient
                        </Link>
                      )}
                      {row.leadId && (
                        <Link href={`/admin/leads/${row.leadId}`} className="text-violet-700 hover:underline">
                          View lead
                        </Link>
                      )}
                      {row.phone && (
                        <a href={`tel:${row.phone}`} className="text-slate-600 hover:underline">
                          Call
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {inbox.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">No conversations yet. Send a message or wait for enquiries.</p>
          )}
        </div>
      )}

      {tab === "Send Message" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">Send communication</h2>
            <div>
              <Label>Channel</Label>
              <Select value={sendChannel} onChange={(e) => setSendChannel(e.target.value as typeof sendChannel)}>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
              </Select>
            </div>
            <div>
              <Label>Recipient name</Label>
              <Input value={sendName} onChange={(e) => setSendName(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={sendPhone} onChange={(e) => setSendPhone(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} />
            </div>
            <div>
              <Label>Template</Label>
              <Select value={sendTemplateSlug} onChange={(e) => applyTemplate(e.target.value)}>
                <option value="">Custom message</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            {sendChannel === "EMAIL" && (
              <div>
                <Label>Subject</Label>
                <Input value={sendSubject} onChange={(e) => setSendSubject(e.target.value)} />
              </div>
            )}
            <div>
              <Label>Message</Label>
              <Textarea rows={6} value={sendBody} onChange={(e) => setSendBody(e.target.value)} />
            </div>
            {sendError && <p className="text-sm text-red-600">{sendError}</p>}
            <Button type="button" disabled={sending || sendName.length < 2 || !sendBody.trim()} onClick={() => void submitSend()}>
              <Send className="mr-2 h-4 w-4" />
              Send now
            </Button>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
            <h3 className="font-semibold text-slate-800">Live preview</h3>
            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{preview || "Type a message…"}</p>
            <p className="mt-6 text-xs text-slate-500">
              Variables: {"{{patient_name}}"}, {"{{doctor_name}}"}, {"{{appointment_date}}"}, {"{{appointment_time}}"}, etc.
            </p>
          </div>
        </div>
      )}

      {tab === "Templates" && (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-slate-500">{t.channel ?? "EMAIL"} · {t.slug}</p>
              <p className="mt-3 text-sm text-slate-600 line-clamp-3">{t.body}</p>
              <Button type="button" variant="secondary" className="mt-4" onClick={() => { applyTemplate(t.slug); setTab("Send Message"); }}>
                Use template
              </Button>
            </div>
          ))}
          <p className="text-sm text-slate-500 md:col-span-2">
            Edit templates in Admin → Messages (templates tab) or seed defaults load on first visit.
          </p>
        </div>
      )}

      {tab === "Automations" && (
        <div className="space-y-3">
          {automations.map((a) => (
            <div key={String(a.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-medium">{String(a.name)}</p>
                <p className="text-xs text-slate-500">
                  {String(a.trigger)} · {String(a.channel)} · {String(a.timingLabel ?? "")}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(a.enabled)}
                  onChange={(e) => void toggleAutomation(String(a.id), e.target.checked)}
                />
                Enabled
              </label>
            </div>
          ))}
          {automations.length === 0 && (
            <p className="text-sm text-slate-500">Run SQL migration `scripts/supabase-communications-crm.sql` to enable automations.</p>
          )}
        </div>
      )}

      {tab === "Campaigns" && (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={String(c.id)} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-semibold">{String(c.name)}</p>
              <p className="text-sm text-slate-600">
                {String(c.channel)} · {String(c.status)} · {String(c.recipientCount)} recipients
              </p>
            </div>
          ))}
          <p className="text-sm text-slate-500">
            Create campaigns via API or upcoming UI. Bulk sends require explicit confirmation.
          </p>
        </div>
      )}

      {tab === "Communication History" && (
        <div className="space-y-6">
          {failedItems.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
              <h3 className="font-semibold text-red-900">Failed communications</h3>
              <ul className="mt-3 space-y-2">
                {failedItems.slice(0, 10).map((f) => (
                  <li key={String(f.id)} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      {String(f.recipientName)} — {String(f.channel)} — {String(f.failureReason ?? "Failed")}
                    </span>
                    <Button type="button" variant="secondary" onClick={() => void retryFailed(String(f.id))}>
                      Retry
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Recipient</th>
                  <th className="px-4 py-3 text-left">Channel</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">When</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={String(h.id)} className="border-t border-slate-100">
                    <td className="px-4 py-3">{String(h.recipientName ?? "—")}</td>
                    <td className="px-4 py-3">{String(h.channel)}</td>
                    <td className="px-4 py-3">{String(h.status)}</td>
                    <td className="px-4 py-3">
                      {h.createdAt ? format(new Date(String(h.createdAt)), "dd MMM yyyy HH:mm") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Settings" && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Settings className="h-5 w-5" />
              Channel configuration
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              SMTP, WhatsApp number, and SMS keys are managed in{" "}
              <Link href="/admin/settings" className="text-violet-700 underline">
                Admin Settings
              </Link>{" "}
              (Super Admin). API secrets are never exposed to the browser.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4" /> SMS
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" /> Email
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Inbox className="h-5 w-5" />
              Email mailbox (IMAP)
            </h2>
            <CommunicationsView />
          </div>
        </div>
      )}
    </div>
  );
}
