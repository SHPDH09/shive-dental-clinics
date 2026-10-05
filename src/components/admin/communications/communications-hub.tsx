"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-client";
import { DataLoadingSection, LoadingState } from "@/components/admin/loading-state";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { CommunicationsView } from "@/components/admin/communications-view";
import { InboxPanel } from "@/components/admin/communications/inbox-panel";
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

type Template = {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body: string;
  channel?: string;
  category?: string;
  enabled?: boolean;
  variables?: string[];
};

type CampaignStats = {
  total: number;
  active: number;
  scheduled: number;
  completed: number;
  failed: number;
};

const TEMPLATE_CATEGORIES = [
  "APPOINTMENT",
  "REMINDER",
  "FOLLOW_UP",
  "ENQUIRY",
  "PAYMENT",
  "TREATMENT",
  "WELCOME",
  "MARKETING",
  "GENERAL",
] as const;

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
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [automations, setAutomations] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [automationRuns, setAutomationRuns] = useState<Record<string, unknown>[]>([]);
  const [commSettings, setCommSettings] = useState<Record<string, unknown> | null>(null);

  const [sendChannel, setSendChannel] = useState<"WHATSAPP" | "SMS" | "EMAIL">("WHATSAPP");
  const [recipientMode, setRecipientMode] = useState<"custom" | "patient" | "lead">("custom");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPick, setPatientPick] = useState<{ id: string; name: string; phone: string; email?: string } | null>(null);
  const [bulkBranchId, setBulkBranchId] = useState("");
  const [bulkCount, setBulkCount] = useState<number | null>(null);
  const [bulkConfirmed, setBulkConfirmed] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  const [tplForm, setTplForm] = useState({
    name: "",
    subject: "",
    body: "",
    channel: "WHATSAPP" as "WHATSAPP" | "SMS" | "EMAIL",
    category: "GENERAL" as (typeof TEMPLATE_CATEGORIES)[number],
  });
  const [tplEditingId, setTplEditingId] = useState<string | null>(null);

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    channel: "WHATSAPP" as "WHATSAPP" | "SMS" | "EMAIL",
    messageBody: "",
    templateSlug: "",
    branchId: "",
  });
  const [campaignEstimate, setCampaignEstimate] = useState<number | null>(null);
  const [campaignConfirm, setCampaignConfirm] = useState(false);

  const [histChannel, setHistChannel] = useState("");
  const [histStatus, setHistStatus] = useState("");
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
      if (tab === "Templates") {
        const res = await adminFetch<{ items: Template[] }>("/api/admin/message-templates?limit=100");
        setTemplates(res.items ?? []);
      }
      if (tab === "Automations") {
        const res = await adminFetch<{ items: Record<string, unknown>[] }>(
          "/api/admin/communications/automations",
        );
        setAutomations(res.items ?? []);
        const runs = await adminFetch<{ items: Record<string, unknown>[] }>(
          "/api/admin/communications/automations/runs?limit=20",
        );
        setAutomationRuns(runs.items ?? []);
      }
      if (tab === "Campaigns") {
        const res = await adminFetch<{ items: Record<string, unknown>[]; stats: CampaignStats }>(
          "/api/admin/communications/campaigns",
        );
        setCampaigns(res.items ?? []);
        setCampaignStats(res.stats ?? null);
      }
      if (tab === "Communication History") {
        const params = new URLSearchParams({ limit: "150" });
        if (histChannel) params.set("channel", histChannel);
        if (histStatus) params.set("status", histStatus);
        const res = await adminFetch<{ items: Record<string, unknown>[] }>(
          `/api/admin/communications/history?${params}`,
        );
        setHistory(res.items ?? []);
      }
      if (tab === "Settings") {
        const s = await adminFetch<Record<string, unknown>>("/api/admin/communications/settings");
        setCommSettings(s);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, loadOverview, histChannel, histStatus]);

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

  const searchPatients = async () => {
    if (patientSearch.length < 2) return;
    const res = await adminFetch<{ items: { id: string; name: string; phone: string; email?: string }[] }>(
      `/api/admin/patients?q=${encodeURIComponent(patientSearch)}&limit=8`,
    );
    const first = res.items?.[0];
    if (first) {
      setPatientPick(first);
      setSendName(first.name);
      setSendPhone(first.phone);
      setSendEmail(first.email ?? "");
      setRecipientMode("patient");
    }
  };

  const estimateBulk = async () => {
    const res = await adminFetch<{ count: number }>("/api/admin/communications/audience/estimate", {
      method: "POST",
      body: JSON.stringify({ branchId: bulkBranchId || undefined, patientStatus: "ACTIVE" }),
    });
    setBulkCount(res.count);
  };

  const submitBulk = async () => {
    if (!bulkConfirmed || bulkCount === null) return;
    setBulkSending(true);
    try {
      await adminFetch("/api/admin/communications/bulk-send", {
        method: "POST",
        body: JSON.stringify({
          channels: [sendChannel],
          audienceFilter: { branchId: bulkBranchId || undefined, patientStatus: "ACTIVE" },
          message: sendBody,
          subject: sendSubject,
          templateSlug: sendTemplateSlug || undefined,
          marketing: tplForm.category === "MARKETING",
          confirmed: true,
        }),
      });
      setTab("Communication History");
    } finally {
      setBulkSending(false);
    }
  };

  const saveTemplate = async () => {
    const payload = {
      name: tplForm.name,
      subject: tplForm.subject,
      body: tplForm.body,
      channel: tplForm.channel,
      category: tplForm.category,
    };
    if (tplEditingId) {
      await adminFetch(`/api/admin/message-templates/${tplEditingId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await adminFetch("/api/admin/message-templates", { method: "POST", body: JSON.stringify(payload) });
    }
    setTplForm({ name: "", subject: "", body: "", channel: "WHATSAPP", category: "GENERAL" });
    setTplEditingId(null);
    void loadTabData();
  };

  const toggleTemplateEnabled = async (t: Template) => {
    await adminFetch(`/api/admin/message-templates/${t.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !t.enabled }),
    });
    void loadTabData();
  };

  const duplicateTemplate = async (t: Template) => {
    await adminFetch("/api/admin/message-templates", {
      method: "POST",
      body: JSON.stringify({
        name: `${t.name} (copy)`,
        subject: t.subject,
        body: t.body,
        channel: t.channel ?? "EMAIL",
        category: t.category ?? "GENERAL",
      }),
    });
    void loadTabData();
  };

  const estimateCampaign = async () => {
    const res = await adminFetch<{ count: number }>("/api/admin/communications/audience/estimate", {
      method: "POST",
      body: JSON.stringify({ branchId: campaignForm.branchId || undefined, patientStatus: "ACTIVE" }),
    });
    setCampaignEstimate(res.count);
  };

  const createCampaign = async () => {
    if (!campaignConfirm) return;
    await adminFetch("/api/admin/communications/campaigns", {
      method: "POST",
      body: JSON.stringify({
        name: campaignForm.name,
        channel: campaignForm.channel,
        messageBody: campaignForm.messageBody,
        templateSlug: campaignForm.templateSlug || undefined,
        audienceFilter: { branchId: campaignForm.branchId || undefined, patientStatus: "ACTIVE" },
      }),
    });
    setCampaignForm({ name: "", channel: "WHATSAPP", messageBody: "", templateSlug: "", branchId: "" });
    setCampaignConfirm(false);
    void loadTabData();
  };

  const testAutomation = async (id: string) => {
    await adminFetch("/api/admin/communications/automations/test", {
      method: "POST",
      body: JSON.stringify({ automationId: id }),
    });
    void loadTabData();
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
            patientId: patientPick?.id,
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

  if (loading && !stats) return <LoadingState label="Loading communications…" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-page-title text-2xl font-bold md:text-3xl">Communications</h1>
        <p className="admin-help-text mt-2 max-w-2xl">
          All patient messages in one place — WhatsApp, SMS, and email. Pick a tab below to read, send, or manage templates.
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
            className={tab === t ? "admin-tab admin-tab-active" : "admin-tab"}
          >
            {t}
          </button>
        ))}
      </div>

      <DataLoadingSection loading={loading} label={`Loading ${tab}…`} minHeight="min-h-[320px]">
      {tab === "Inbox" && <InboxPanel onRefresh={() => void loadOverview()} />}

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
              <Label>Recipient</Label>
              <Select value={recipientMode} onChange={(e) => setRecipientMode(e.target.value as typeof recipientMode)}>
                <option value="custom">Custom contact</option>
                <option value="patient">Patient</option>
                <option value="lead">Lead (enter details below)</option>
              </Select>
            </div>
            {recipientMode === "patient" && (
              <div className="flex gap-2">
                <Input
                  placeholder="Search patient name or phone…"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={() => void searchPatients()}>
                  Find
                </Button>
              </div>
            )}
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
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="font-semibold text-slate-800">Bulk messaging</h3>
              <p className="mt-1 text-xs text-slate-500">Filter active patients by branch. Marketing templates require patient consent.</p>
              <div className="mt-3">
                <Label>Branch ID (optional)</Label>
                <Input value={bulkBranchId} onChange={(e) => setBulkBranchId(e.target.value)} placeholder="Branch cuid" />
              </div>
              <Button type="button" variant="secondary" className="mt-2" onClick={() => void estimateBulk()}>
                Preview audience
              </Button>
              {bulkCount !== null && (
                <p className="mt-2 text-sm font-medium text-slate-800">{bulkCount} recipients selected</p>
              )}
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={bulkConfirmed} onChange={(e) => setBulkConfirmed(e.target.checked)} />
                I confirm sending this bulk message
              </label>
              <Button
                type="button"
                className="mt-3"
                disabled={bulkSending || !bulkConfirmed || bulkCount === null || !sendBody.trim()}
                onClick={() => void submitBulk()}
              >
                Send bulk
              </Button>
            </div>
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
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">{tplEditingId ? "Edit template" : "Create template"}</h2>
            <div>
              <Label>Name</Label>
              <Input value={tplForm.name} onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select
                  value={tplForm.category}
                  onChange={(e) => setTplForm((f) => ({ ...f, category: e.target.value as typeof tplForm.category }))}
                >
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Channel</Label>
                <Select
                  value={tplForm.channel}
                  onChange={(e) => setTplForm((f) => ({ ...f, channel: e.target.value as typeof tplForm.channel }))}
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Subject (email)</Label>
              <Input value={tplForm.subject} onChange={(e) => setTplForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={6} value={tplForm.body} onChange={(e) => setTplForm((f) => ({ ...f, body: e.target.value }))} />
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase text-slate-500">Live preview</p>
              <p className="mt-2 whitespace-pre-wrap">
                {renderTemplate(tplForm.body || "…", {
                  patient_name: "Rahul",
                  doctor_name: "Dr. Rishikesh",
                  service_name: "Dental Implant",
                  appointment_date: "10 Oct 2026",
                  appointment_time: "11:00 AM",
                  branch_name: "Main Branch",
                  clinic_phone: "9973479904",
                  clinic_whatsapp: "9973479904",
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void saveTemplate()} disabled={tplForm.name.length < 2 || tplForm.body.length < 10}>
                Save template
              </Button>
              {tplEditingId && (
                <Button type="button" variant="secondary" onClick={() => { setTplEditingId(null); setTplForm({ name: "", subject: "", body: "", channel: "WHATSAPP", category: "GENERAL" }); }}>
                  Cancel
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Variables: {"{{patient_name}}"}, {"{{doctor_name}}"}, {"{{service_name}}"}, {"{{appointment_date}}"}, {"{{appointment_time}}"}, {"{{branch_name}}"}, {"{{clinic_phone}}"}, {"{{clinic_whatsapp}}"}
            </p>
          </div>
          <div className="grid gap-3 content-start">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.category ?? "GENERAL"} · {t.channel ?? "EMAIL"} · {t.enabled === false ? "Inactive" : "Active"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => { applyTemplate(t.slug); setTab("Send Message"); }}>
                      Use
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setTplEditingId(t.id);
                        setTplForm({
                          name: t.name,
                          subject: t.subject,
                          body: t.body,
                          channel: (t.channel as typeof tplForm.channel) ?? "WHATSAPP",
                          category: (t.category as typeof tplForm.category) ?? "GENERAL",
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => void duplicateTemplate(t)}>
                      Duplicate
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => void toggleTemplateEnabled(t)}>
                      {t.enabled === false ? "Activate" : "Deactivate"}
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600 line-clamp-3">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Automations" && (
        <div className="space-y-6">
          {automations.map((a) => (
            <div key={String(a.id)} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{String(a.name)}</p>
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                    WHEN {String(a.trigger)} → THEN Send {String(a.channel)} USING {String(a.templateSlug ?? "template")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{String(a.timingLabel ?? "")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(a.enabled)}
                      onChange={(e) => void toggleAutomation(String(a.id), e.target.checked)}
                    />
                    Enabled
                  </label>
                  <Button type="button" variant="secondary" onClick={() => void testAutomation(String(a.id))}>
                    Test
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {automationRuns.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">Execution history</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {automationRuns.map((r) => (
                  <li key={String(r.id)} className="text-slate-600">
                    {r.createdAt ? format(new Date(String(r.createdAt)), "dd MMM HH:mm") : "—"} · {String(r.status)} ·{" "}
                    {String(r.detail ?? "")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {automations.length === 0 && (
            <p className="text-sm text-slate-500">Run SQL migration `scripts/supabase-communications-crm.sql` to enable automations.</p>
          )}
          <p className="text-xs text-slate-500">Marketing automations respect patient communication consent flags.</p>
        </div>
      )}

      {tab === "Campaigns" && (
        <div className="space-y-6">
          {campaignStats && (
            <div className="grid gap-3 sm:grid-cols-5">
              {[
                { label: "Total", value: campaignStats.total },
                { label: "Active", value: campaignStats.active },
                { label: "Scheduled", value: campaignStats.scheduled },
                { label: "Completed", value: campaignStats.completed },
                { label: "Failed", value: campaignStats.failed },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase text-slate-500">{c.label}</p>
                  <p className="text-2xl font-bold">{c.value}</p>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold">Create campaign</h2>
              <Input placeholder="Campaign name" value={campaignForm.name} onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))} />
              <Select value={campaignForm.channel} onChange={(e) => setCampaignForm((f) => ({ ...f, channel: e.target.value as typeof campaignForm.channel }))}>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
              </Select>
              <Input placeholder="Branch filter (optional ID)" value={campaignForm.branchId} onChange={(e) => setCampaignForm((f) => ({ ...f, branchId: e.target.value }))} />
              <Select value={campaignForm.templateSlug} onChange={(e) => setCampaignForm((f) => ({ ...f, templateSlug: e.target.value }))}>
                <option value="">Custom message</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </Select>
              <Textarea rows={4} placeholder="Message body" value={campaignForm.messageBody} onChange={(e) => setCampaignForm((f) => ({ ...f, messageBody: e.target.value }))} />
              <Button type="button" variant="secondary" onClick={() => void estimateCampaign()}>
                Preview audience
              </Button>
              {campaignEstimate !== null && (
                <p className="text-sm font-medium">Estimated recipients: {campaignEstimate}</p>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={campaignConfirm} onChange={(e) => setCampaignConfirm(e.target.checked)} />
                Confirm campaign launch
              </label>
              <Button type="button" disabled={!campaignConfirm || campaignForm.name.length < 2} onClick={() => void createCampaign()}>
                Launch campaign (draft)
              </Button>
            </div>
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={String(c.id)} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold">{String(c.name)}</p>
                  <p className="text-sm text-slate-600">
                    {String(c.channel)} · {String(c.status)} · {String(c.recipientCount)} recipients
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Communication History" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Select value={histChannel} onChange={(e) => setHistChannel(e.target.value)}>
              <option value="">All channels</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
            </Select>
            <Select value={histStatus} onChange={(e) => setHistStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READ">Read</option>
              <option value="FAILED">Failed</option>
            </Select>
            <Button type="button" variant="secondary" onClick={() => void loadTabData()}>
              Apply filters
            </Button>
          </div>
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
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Recipient</th>
                  <th className="px-4 py-3 text-left">Channel</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Staff</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={String(h.id)} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      {h.createdAt ? format(new Date(String(h.createdAt)), "dd MMM") : "—"}
                    </td>
                    <td className="px-4 py-3">{String(h.recipientName ?? "—")}</td>
                    <td className="px-4 py-3">{String(h.channel)}</td>
                    <td className="px-4 py-3">{String(h.messageType ?? "GENERAL")}</td>
                    <td className="px-4 py-3">{String(h.status)}</td>
                    <td className="px-4 py-3">{String(h.sentByStaffName ?? "—")}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {String(h.status) === "FAILED" && (
                          <button type="button" className="font-medium text-[#d91f26] hover:underline" onClick={() => void retryFailed(String(h.id))}>
                            Retry
                          </button>
                        )}
                        {h.patientId != null && String(h.patientId) !== "" ? (
                          <Link href={`/admin/patients/${String(h.patientId)}`} className="text-slate-600 hover:underline">
                            Patient
                          </Link>
                        ) : null}
                        {h.leadId != null && String(h.leadId) !== "" ? (
                          <Link href={`/admin/leads/${String(h.leadId)}`} className="text-slate-600 hover:underline">
                            Lead
                          </Link>
                        ) : null}
                      </div>
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
          {commSettings && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold">WhatsApp</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Business number: {String((commSettings.whatsApp as { businessNumber?: string })?.businessNumber ?? "—")}
                </p>
                <p className="text-xs text-slate-500">
                  Status: {(commSettings.whatsApp as { connected?: boolean })?.connected ? "Connected" : "Not connected"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold">SMS</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Sender ID: {String((commSettings.sms as { senderId?: string })?.senderId || "—")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold">Email</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {String((commSettings.email as { senderName?: string })?.senderName)} ·{" "}
                  {String((commSettings.email as { senderEmail?: string })?.senderEmail)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold">Privacy defaults</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  <li>Appointment & follow-up messages: transactional</li>
                  <li>Marketing: requires explicit patient consent</li>
                  <li>Patient profile controls: WhatsApp, SMS, Email toggles</li>
                </ul>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Settings className="h-5 w-5" />
              Channel configuration
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              SMTP, WhatsApp number, and SMS keys are managed in{" "}
              <Link href="/admin/settings" className="font-medium text-[#d91f26] underline">
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
      </DataLoadingSection>
    </div>
  );
}
