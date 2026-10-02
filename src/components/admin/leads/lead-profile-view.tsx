"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/admin/loading-state";
import { adminFetch } from "@/lib/admin-client";
import { whatsappLink } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MessageCircle, Phone, UserPlus } from "lucide-react";

type Profile = {
  id: string;
  leadCode: string;
  name: string;
  phone: string;
  whatsAppNumber: string | null;
  email: string | null;
  status: string;
  statusLabel: string;
  priority: string;
  sourceLabel: string;
  interestedService: string | null;
  assignedStaff: string | null;
  followUpDate: string | null;
  followUpTime: string | null;
  branchName: string | null;
  doctorName: string | null;
  notes: string | null;
  patientId: string | null;
  timeline: { at: string; label: string; title: string; detail?: string | null }[];
};

export function LeadProfileView({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    void adminFetch<Profile>(`/api/admin/leads/${leadId}?profile=full`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [leadId]);

  const convert = async (linkPatientId?: string) => {
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/convert`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkPatientId ? { linkPatientId } : {}),
      });
      const body = (await res.json()) as { patientId?: string; duplicate?: boolean; message?: string };
      if (res.status === 409 && body.duplicate && body.patientId) {
        if (window.confirm(`${body.message}\nLink to existing patient?`)) {
          await convert(body.patientId);
        }
        return;
      }
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setMsg("Converted to patient.");
      if (body.patientId) router.push(`/admin/patients/${body.patientId}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Conversion failed");
    }
  };

  if (loading) return <LoadingState />;
  if (!profile) return <p className="text-sm text-red-600">Lead not found.</p>;

  const wa = profile.whatsAppNumber || profile.phone;

  return (
    <div className="space-y-6">
      <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm text-slate-600">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <div className="rounded-2xl border bg-gradient-to-br from-white to-violet-50/30 p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{profile.name}</h1>
        <p className="font-mono text-sm text-slate-500">{profile.leadCode}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`tel:${profile.phone}`} className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-sm">
            <Phone className="mr-2 h-4 w-4" /> Call
          </a>
          <a href={whatsappLink(wa, `Hello ${profile.name}`)} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-sm">
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </a>
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-sm">
              <Mail className="mr-2 h-4 w-4" /> Email
            </a>
          )}
          <Button type="button" onClick={() => void convert()}>
            <UserPlus className="mr-2 h-4 w-4" /> Convert to patient
          </Button>
          <Link href="/admin/appointments" className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-sm">
            Book appointment
          </Link>
        </div>
        {msg && <p className="mt-3 text-sm text-teal-700">{msg}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <dl className="rounded-2xl border bg-white p-5 text-sm">
          <dt className="text-slate-500">Status</dt>
          <dd className="font-semibold">{profile.statusLabel}</dd>
          <dt className="mt-3 text-slate-500">Priority</dt>
          <dd className="font-semibold">{profile.priority}</dd>
          <dt className="mt-3 text-slate-500">Source</dt>
          <dd>{profile.sourceLabel}</dd>
          <dt className="mt-3 text-slate-500">Interested in</dt>
          <dd>{profile.interestedService ?? "—"}</dd>
        </dl>
        <dl className="rounded-2xl border bg-white p-5 text-sm">
          <dt className="text-slate-500">Assigned to</dt>
          <dd>{profile.assignedStaff ?? "—"}</dd>
          <dt className="mt-3 text-slate-500">Branch / Doctor</dt>
          <dd>{profile.branchName ?? "—"} / {profile.doctorName ?? "—"}</dd>
          <dt className="mt-3 text-slate-500">Next follow-up</dt>
          <dd>
            {profile.followUpDate
              ? `${format(new Date(profile.followUpDate), "dd MMM yyyy")}${profile.followUpTime ? ` – ${profile.followUpTime}` : ""}`
              : "—"}
          </dd>
          {profile.patientId && (
            <>
              <dt className="mt-3 text-slate-500">Patient</dt>
              <dd>
                <Link href={`/admin/patients/${profile.patientId}`} className="text-violet-700 underline">
                  View patient
                </Link>
              </dd>
            </>
          )}
        </dl>
      </div>

      {profile.notes && (
        <div className="rounded-2xl border bg-white p-5 text-sm">
          <h3 className="font-semibold">Notes</h3>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">{profile.notes}</p>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5">
        <h3 className="font-semibold">Activity timeline</h3>
        <ol className="relative ml-3 mt-4 border-l border-violet-200 pl-6">
          {profile.timeline.map((e, i) => (
            <li key={`${e.at}-${i}`} className="mb-4">
              <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-violet-500" />
              <p className="text-xs text-slate-500">{e.label}</p>
              <p className="font-medium">{e.title}</p>
              {e.detail && <p className="text-sm text-slate-600">{e.detail}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
