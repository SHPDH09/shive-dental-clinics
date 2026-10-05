"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  STAFF_ASSIGNees,
  enquirySourceLabel,
  enquiryStatusColor,
  enquiryStatusLabel,
  type ConversationEntry,
} from "@/lib/enquiry-sources";
import { AdminApiError, adminFetch } from "@/lib/admin-client";
import { DataLoadingSection } from "@/components/admin/loading-state";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { whatsappLink } from "@/lib/utils";
import { Mail, Phone, Star, X } from "lucide-react";

type EnquiryRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  message: string;
  source: string;
  status: string;
  important: boolean;
  assignedStaff: string | null;
  conversation: ConversationEntry[] | unknown;
  createdAt: string;
};

type Template = { id: string; name: string; subject: string; body: string };

type PatientContext = {
  linked: boolean;
  patient: {
    id: string;
    patientCode: string;
    name: string;
    appointments: { treatmentName: string; appointmentDate: string; status: string }[];
    enquiries: { subject: string; createdAt: string; status: string }[];
  } | null;
};

function preview(text: string, max = 72) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function parseConv(raw: unknown): ConversationEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw as ConversationEntry[];
}

export function MessagesView() {
  const [items, setItems] = useState<EnquiryRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EnquiryRecord | null>(null);
  const [patientCtx, setPatientCtx] = useState<PatientContext | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tab, setTab] = useState<"inbox" | "templates">("inbox");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [importantOnly, setImportantOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadStats = useCallback(async () => {
    const data = await adminFetch<{ counts: Record<string, number> }>("/api/admin/enquiries?stats=1");
    setCounts(data.counts ?? {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      if (source) params.set("source", source);
      if (assignedStaff) params.set("assignedStaff", assignedStaff);
      if (importantOnly) params.set("important", "true");
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const data = await adminFetch<{ items: EnquiryRecord[] }>(`/api/admin/enquiries?${params}`);
      setItems(data.items ?? []);
      await loadStats();
    } catch {
      setError("Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, [q, status, source, assignedStaff, importantOnly, dateFrom, dateTo, loadStats]);

  useEffect(() => {
    void load();
    adminFetch<{ items: Template[] }>("/api/admin/message-templates?limit=50")
      .then((r) => setTemplates(r.items ?? []))
      .catch(() => setTemplates([]));
  }, [load]);

  const openDetail = async (e: EnquiryRecord) => {
    setSelected(e);
    setReplySubject(e.subject.startsWith("Re:") ? e.subject : `Re: ${e.subject}`);
    setReplyBody("");
    setReplyError(null);
    setReplySuccess(null);
    setPatientCtx(null);
    try {
      const ctx = await adminFetch<PatientContext>(`/api/admin/enquiries/${e.id}/patient`);
      setPatientCtx(ctx);
    } catch {
      setPatientCtx({ linked: false, patient: null });
    }
    if (e.status === "NEW" || e.status === "UNREAD") {
      await adminFetch(`/api/admin/enquiries/${e.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      void load();
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const updated = await adminFetch<EnquiryRecord>(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setSelected(updated);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!selected) return;
    setSaving(true);
    setReplyError(null);
    setReplySuccess(null);
    try {
      const updated = await adminFetch<EnquiryRecord & { emailSent?: boolean; emailTo?: string }>(
        `/api/admin/enquiries/${selected.id}/reply`,
        {
          method: "POST",
          body: JSON.stringify({ subject: replySubject, message: replyBody, sentBy: "Admin" }),
        },
      );
      setSelected(updated);
      setReplyBody("");
      setReplySuccess(
        updated.emailTo
          ? `Reply emailed to ${updated.emailTo}.`
          : "Reply sent by email.",
      );
      await load();
    } catch (e) {
      setReplyError(e instanceof AdminApiError ? e.message : "Could not send reply. Check SMTP settings.");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setSource("");
    setAssignedStaff("");
    setImportantOnly(false);
    setDateFrom("");
    setDateTo("");
  };

  const newCount = useMemo(() => (counts.NEW ?? 0) + (counts.UNREAD ?? 0), [counts]);

  if (error && items.length === 0 && !loading) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <DataLoadingSection loading={loading} label="Loading messages…" minHeight="min-h-[50vh]">
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === "inbox" ? "primary" : "secondary"} onClick={() => setTab("inbox")}>
          Inbox {newCount > 0 && <span className="ml-1 rounded-full bg-white/20 px-2 text-xs">{newCount}</span>}
        </Button>
        <Button type="button" variant={tab === "templates" ? "primary" : "secondary"} onClick={() => setTab("templates")}>
          Templates
        </Button>
      </div>

      {tab === "inbox" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ENQUIRY_STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(status === s.id ? "" : s.id)}
                className={`card-premium p-4 text-left transition ${status === s.id ? "ring-2 ring-sky-400" : ""}`}
              >
                <p className="text-2xl font-bold text-slate-900">{counts[s.id] ?? 0}</p>
                <p className="text-sm text-slate-600">{s.label}</p>
              </button>
            ))}
          </div>

          <div className="card-premium grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-6">
            <Input placeholder="Search name, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">All sources</option>
              {ENQUIRY_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={assignedStaff} onChange={(e) => setAssignedStaff(e.target.value)}>
              <option value="">All staff</option>
              {STAFF_ASSIGNees.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={importantOnly} onChange={(e) => setImportantOnly(e.target.checked)} />
              Important only
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => void load()}>Apply filters</Button>
            <Button type="button" variant="secondary" onClick={clearFilters}>Clear filters</Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {items.length === 0 ? (
              <p className="p-8 text-center text-slate-500">No messages match your filters.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((e) => {
                  const unread = e.status === "NEW" || e.status === "UNREAD";
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => void openDetail(e)}
                        className={`flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${unread ? "bg-sky-50/50" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {unread && <span className="h-2 w-2 rounded-full bg-sky-500" />}
                            {e.important && <Star className="h-4 w-4 fill-amber-400 text-amber-500" />}
                            <span className="font-semibold text-slate-900">{e.name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${enquiryStatusColor(e.status)}`}>
                              {enquiryStatusLabel(e.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-800">{e.subject}</p>
                          <p className="text-sm text-slate-500">{preview(e.message)}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {enquirySourceLabel(e.source)} · {e.phone}
                            {e.email ? ` · ${e.email}` : ""}
                            {e.assignedStaff ? ` · ${e.assignedStaff}` : ""}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-slate-500">
                          {format(new Date(e.createdAt), "dd MMM yyyy, h:mm a")}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card-premium p-5">
            <h3 className="font-semibold text-slate-900">Recent messages</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {items.slice(0, 5).map((e) => (
                <li key={e.id}>
                  <button type="button" className="hover:text-[var(--primary)]" onClick={() => void openDetail(e)}>
                    {e.name} — {e.subject}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {tab === "templates" && (
        <TemplatesPanel templates={templates} onChange={() => void adminFetch<{ items: Template[] }>("/api/admin/message-templates?limit=50").then((r) => setTemplates(r.items ?? []))} />
      )}

      {selected && tab === "inbox" && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h3 className="font-bold text-slate-900">Message details</h3>
              <button type="button" onClick={() => setSelected(null)} className="rounded p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 p-4">
              <div>
                <p className="font-semibold text-lg">{selected.name}</p>
                <p className="text-sm text-slate-600">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`tel:${selected.phone.replace(/\s/g, "")}`} className="btn-secondary inline-flex gap-1 py-2 text-xs">
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
                <a href={whatsappLink(selected.phone, selected.message)} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 text-xs">
                  WhatsApp
                </a>
                {selected.email && (
                  <a href={`mailto:${selected.email}?subject=${encodeURIComponent(selected.subject)}`} className="btn-secondary inline-flex gap-1 py-2 text-xs">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                )}
              </div>

              {patientCtx?.linked && patientCtx.patient && (
                <div className="rounded-xl bg-teal-50 p-4 text-sm">
                  <p className="font-semibold text-teal-900">Patient profile linked</p>
                  <p className="text-teal-800">{patientCtx.patient.name} ({patientCtx.patient.patientCode})</p>
                  <p className="mt-2 font-medium text-teal-900">Recent appointments</p>
                  <ul className="mt-1 space-y-1 text-teal-800">
                    {patientCtx.patient.appointments.slice(0, 4).map((a, i) => (
                      <li key={i}>{a.treatmentName} — {format(new Date(a.appointmentDate), "dd MMM yyyy")}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Subject</p>
                <p className="font-medium">{selected.subject}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Message</p>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{selected.message}</p>
              </div>
              <p className="text-xs text-slate-500">
                Source: {enquirySourceLabel(selected.source)} · Received {format(new Date(selected.createdAt), "dd MMM yyyy, h:mm a")}
              </p>

              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={selected.status === "UNREAD" ? "NEW" : selected.status === "READ" ? "REPLIED" : selected.status}
                  onChange={(ev) => void patch(selected.id, { status: ev.target.value })}
                >
                  {ENQUIRY_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={selected.assignedStaff ?? ""}
                  onChange={(ev) => void patch(selected.id, { assignedStaff: ev.target.value || null })}
                >
                  <option value="">Assign to…</option>
                  {STAFF_ASSIGNees.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Button type="button" variant="secondary" size="sm" onClick={() => void patch(selected.id, { important: !selected.important })}>
                  {selected.important ? "Unmark important" : "Mark important"}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => void patch(selected.id, { status: "CLOSED" })}>
                  Close
                </Button>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-900">Conversation</p>
                <ul className="mt-3 space-y-3">
                  {parseConv(selected.conversation).map((c) => (
                    <li key={c.id} className={`rounded-xl p-3 text-sm ${c.direction === "out" ? "bg-sky-50 ml-4" : "bg-slate-50 mr-4"}`}>
                      <p className="text-xs text-slate-500">{c.direction === "out" ? `Reply · ${c.sentBy ?? "Staff"}` : "Patient"} · {format(new Date(c.sentAt), "dd MMM h:mm a")}</p>
                      {c.subject && <p className="font-medium">{c.subject}</p>}
                      <p className="whitespace-pre-wrap">{c.body}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="font-semibold">Reply</p>
                {templates.length > 0 && (
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    defaultValue=""
                    onChange={(ev) => {
                      const t = templates.find((x) => x.id === ev.target.value);
                      if (t) {
                        setReplySubject(t.subject);
                        setReplyBody(t.body);
                      }
                    }}
                  >
                    <option value="">Insert template…</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
                <div>
                  <Label>To (email)</Label>
                  <Input value={selected.email?.trim() || ""} readOnly placeholder="No email on file" />
                  {!selected.email?.trim() && (
                    <p className="mt-1 text-xs text-amber-700">
                      Add an email on the enquiry or use WhatsApp / phone — SMTP reply needs a valid email.
                    </p>
                  )}
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input value={replySubject} onChange={(e) => setReplySubject(e.target.value)} />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea rows={5} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} />
                </div>
                {replyError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{replyError}</p>}
                {replySuccess && (
                  <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">{replySuccess}</p>
                )}
                <Button
                  type="button"
                  disabled={saving || !replyBody.trim() || !selected.email?.trim()}
                  onClick={() => void sendReply()}
                >
                  Send reply by email
                </Button>
                <p className="text-xs text-slate-500">
                  Sends via clinic Gmail (SMTP) and saves the thread here. Requires SMTP on the server.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DataLoadingSection>
  );
}

function TemplatesPanel({ templates, onChange }: { templates: Template[]; onChange: () => void }) {
  const [form, setForm] = useState({ name: "", subject: "", body: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = async () => {
    if (editingId) {
      await adminFetch(`/api/admin/message-templates/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
    } else {
      await adminFetch("/api/admin/message-templates", { method: "POST", body: JSON.stringify(form) });
    }
    setForm({ name: "", subject: "", body: "" });
    setEditingId(null);
    onChange();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete template?")) return;
    await adminFetch(`/api/admin/message-templates/${id}`, { method: "DELETE" });
    onChange();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-premium space-y-3 p-5">
        <h3 className="font-bold">{editingId ? "Edit template" : "Create template"}</h3>
        <Input placeholder="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <Textarea rows={6} placeholder="Message body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <Button type="button" onClick={() => void save()} disabled={!form.name || !form.subject || !form.body}>
          {editingId ? "Update" : "Create"}
        </Button>
      </div>
      <ul className="space-y-3">
        {templates.map((t) => (
          <li key={t.id} className="card-premium p-4">
            <p className="font-semibold">{t.name}</p>
            <p className="text-sm text-slate-600">{t.subject}</p>
            <p className="mt-2 line-clamp-3 text-sm text-slate-500">{t.body}</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => { setEditingId(t.id); setForm({ name: t.name, subject: t.subject, body: t.body }); }}>
                Edit
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => void remove(t.id)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
