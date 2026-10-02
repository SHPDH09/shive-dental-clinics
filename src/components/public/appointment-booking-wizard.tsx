"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Check, Loader2, Lock } from "lucide-react";

type BranchOption = {
  id: string;
  name: string;
  slug: string;
  city: string;
  doctorIds: string[];
  serviceIds: string[];
};

type DoctorOption = { id: string; name: string; slug: string; specialization: string };
type ServiceOption = { id: string; name: string; slug?: string };

type SlotEntry = { time: string; status: "available" | "booked" | "past" };

type Props = {
  branches: BranchOption[];
  doctors: DoctorOption[];
  services: ServiceOption[];
  initialBranchSlug?: string | null;
  initialDoctorSlug?: string | null;
  initialServiceSlug?: string | null;
};

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export function AppointmentBookingWizard({
  branches,
  doctors,
  services,
  initialBranchSlug,
  initialDoctorSlug,
  initialServiceSlug,
}: Props) {
  const preBranch = useMemo(
    () => (initialBranchSlug ? branches.find((b) => b.slug === initialBranchSlug) : null),
    [branches, initialBranchSlug],
  );
  const preDoctor = useMemo(
    () => (initialDoctorSlug ? doctors.find((d) => d.slug === initialDoctorSlug) : null),
    [doctors, initialDoctorSlug],
  );
  const preService = useMemo(
    () => (initialServiceSlug ? services.find((s) => s.slug === initialServiceSlug) : null),
    [services, initialServiceSlug],
  );

  const [step, setStep] = useState<Step>(1);
  const [branchId, setBranchId] = useState(preBranch?.id ?? branches[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState(preDoctor?.id ?? "");
  const [serviceId, setServiceId] = useState(preService?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slotEntries, setSlotEntries] = useState<SlotEntry[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [closedDay, setClosedDay] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedBranch = branches.find((b) => b.id === branchId);
  const branchDoctors = useMemo(() => {
    if (!selectedBranch) return doctors;
    if (selectedBranch.doctorIds.length === 0) return doctors;
    return doctors.filter((d) => selectedBranch.doctorIds.includes(d.id));
  }, [doctors, selectedBranch]);

  const branchServices = useMemo(() => {
    if (!selectedBranch) return services;
    if (selectedBranch.serviceIds.length === 0) return services;
    return services.filter((s) => selectedBranch.serviceIds.includes(s.id));
  }, [services, selectedBranch]);

  const selectedDoctor = branchDoctors.find((d) => d.id === doctorId) ?? doctors.find((d) => d.id === doctorId);
  const selectedService = branchServices.find((s) => s.id === serviceId) ?? services.find((s) => s.id === serviceId);
  const treatmentName = selectedService?.name ?? "";

  const availableCount = useMemo(
    () => slotEntries.filter((s) => s.status === "available").length,
    [slotEntries],
  );

  useEffect(() => {
    if (preBranch) setBranchId(preBranch.id);
  }, [preBranch]);

  useEffect(() => {
    if (!branchId) return;
    const allowed = branchDoctors.map((d) => d.id);
    if (doctorId && !allowed.includes(doctorId)) {
      setDoctorId(branchDoctors[0]?.id ?? "");
    } else if (!doctorId && branchDoctors[0]) {
      setDoctorId(branchDoctors[0].id);
    }
    const svcAllowed = branchServices.map((s) => s.id);
    if (serviceId && !svcAllowed.includes(serviceId)) {
      setServiceId(branchServices[0]?.id ?? "");
    } else if (!serviceId && branchServices[0]) {
      setServiceId(branchServices[0].id);
    }
  }, [branchId, branchDoctors, branchServices, doctorId, serviceId]);

  useEffect(() => {
    if (preDoctor && branchDoctors.some((d) => d.id === preDoctor.id)) setDoctorId(preDoctor.id);
  }, [preDoctor, branchDoctors]);

  useEffect(() => {
    if (preService && branchServices.some((s) => s.id === preService.id)) setServiceId(preService.id);
  }, [preService, branchServices]);

  useEffect(() => {
    if (step !== 5 || !doctorId || !date || !branchId) return;
    setSlotsLoading(true);
    setTime("");
    const params = new URLSearchParams({
      doctorId,
      date,
      branchId,
    });
    void fetch(`/api/public/appointments/slots?${params.toString()}`)
      .then((r) => r.json())
      .then((json: { slots?: SlotEntry[]; closed?: boolean }) => {
        setSlotEntries(json.slots ?? []);
        setClosedDay(Boolean(json.closed));
      })
      .catch(() => {
        setSlotEntries([]);
        setClosedDay(true);
      })
      .finally(() => setSlotsLoading(false));
  }, [step, doctorId, date, branchId]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const canNext = () => {
    if (step === 1) return Boolean(branchId);
    if (step === 2) return Boolean(doctorId);
    if (step === 3) return Boolean(serviceId);
    if (step === 4) return Boolean(date);
    if (step === 5) return Boolean(time);
    if (step === 6) return patientName.trim().length >= 2;
    if (step === 7) return phone.trim().length >= 10;
    if (step === 8) return emailOk;
    if (step === 9) return patientName.trim().length >= 2 && phone.trim().length >= 10 && emailOk;
    return false;
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          phone,
          email,
          branchId,
          doctorId,
          serviceId,
          treatmentName,
          appointmentDate: date,
          appointmentTime: time,
          message,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Could not book. Please try another time.");
        return;
      }
      const emailNote = json.confirmationEmailSent
        ? " A confirmation email has been sent to your inbox."
        : json.emailWarning
          ? ` Note: ${json.emailWarning}.`
          : "";
      setSuccess(`Thank you! Your reference is ${json.appointmentId}.${emailNote} We will confirm shortly.`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="card-premium p-8 text-center">
        <Check className="mx-auto h-10 w-10 text-teal-600" />
        <p className="mt-4 text-lg font-semibold text-slate-900">{success}</p>
      </div>
    );
  }

  const steps = [
    "Branch",
    "Doctor",
    "Treatment",
    "Date",
    "Time",
    "Your name",
    "Phone",
    "Email",
    "Confirm",
  ] as const;

  return (
    <div className="card-premium space-y-8 p-6 md:p-8">
      <div className="flex flex-wrap gap-2">
        {steps.map((label, i) => {
          const n = (i + 1) as Step;
          const active = step === n;
          const done = step > n;
          return (
            <span
              key={label}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                active ? "bg-sky-600 text-white" : done ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}. {label}
            </span>
          );
        })}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select branch</h3>
          <p className="text-sm text-slate-600">Appointment times follow this branch&apos;s opening hours.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {branches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBranchId(b.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  branchId === b.id ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200" : "border-slate-200 hover:border-sky-200"
                }`}
              >
                <p className="font-semibold text-slate-900">{b.name}</p>
                <p className="text-sm text-slate-600">{b.city}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select doctor</h3>
          {branchDoctors.length === 0 ? (
            <p className="text-sm text-slate-600">No doctors listed for this branch. Please call the clinic.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {branchDoctors.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDoctorId(d.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    doctorId === d.id ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200" : "border-slate-200 hover:border-sky-200"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{d.name}</p>
                  <p className="text-sm text-slate-600">{d.specialization}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select treatment</h3>
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {branchServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select date</h3>
          <Input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select time</h3>
          <p className="text-sm text-slate-600">
            Showing slots for <strong>{selectedBranch?.name}</strong>
            {selectedDoctor ? (
              <>
                {" "}
                with <strong>{selectedDoctor.name}</strong>
              </>
            ) : null}
            . Full slots are locked.
          </p>
          {slotsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          ) : closedDay ? (
            <p className="text-sm text-slate-600">
              This branch or doctor is not available on the selected day. Please pick another date.
            </p>
          ) : slotEntries.length === 0 ? (
            <p className="text-sm text-slate-600">No time slots for this day. Try another date.</p>
          ) : (
            <>
              {availableCount === 0 ? (
                <p className="text-sm text-amber-800 rounded-lg bg-amber-50 px-3 py-2">
                  All slots are full or past for this day. Please choose another date.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {slotEntries.map((slot) => {
                  const locked = slot.status !== "available";
                  const label =
                    slot.status === "booked" ? "Full" : slot.status === "past" ? "Past" : null;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={locked}
                      title={
                        slot.status === "booked"
                          ? "This slot is already booked"
                          : slot.status === "past"
                            ? "This time has passed"
                            : undefined
                      }
                      onClick={() => !locked && setTime(slot.time)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        locked
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : time === slot.time
                            ? "border-sky-600 bg-sky-50 text-sky-900"
                            : "border-slate-200 hover:border-sky-300 text-slate-800"
                      }`}
                    >
                      {locked ? <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden /> : null}
                      <span>{slot.time}</span>
                      {label ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Your full name</h3>
          <div>
            <Label htmlFor="patient-name">Name as on ID / records</Label>
            <Input
              id="patient-name"
              autoFocus
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
            />
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Mobile number</h3>
          <div>
            <Label htmlFor="patient-phone">We will call or WhatsApp to confirm</Label>
            <Input
              id="patient-phone"
              type="tel"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
            />
          </div>
        </div>
      )}

      {step === 8 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Email address</h3>
          <div>
            <Label htmlFor="patient-email">For appointment confirmation</Label>
            <Input
              id="patient-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
            {email.trim() && !emailOk ? (
              <p className="mt-1 text-xs text-red-600">Enter a valid email address.</p>
            ) : null}
          </div>
        </div>
      )}

      {step === 9 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Review & confirm</h3>
          <div className="space-y-1 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <strong>Branch:</strong> {selectedBranch?.name}
            </p>
            <p>
              <strong>Doctor:</strong> {selectedDoctor?.name}
            </p>
            <p>
              <strong>Treatment:</strong> {treatmentName}
            </p>
            <p>
              <strong>Date & time:</strong> {date} at {time}
            </p>
            <p>
              <strong>Name:</strong> {patientName}
            </p>
            <p>
              <strong>Phone:</strong> {phone}
            </p>
            <p>
              <strong>Email:</strong> {email}
            </p>
          </div>
          <div>
            <Label>Message (optional)</Label>
            <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {step > 1 && (
          <Button type="button" variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)}>
            Back
          </Button>
        )}
        {step < 9 && (
          <Button type="button" disabled={!canNext()} onClick={() => setStep((s) => (s + 1) as Step)}>
            Continue
          </Button>
        )}
        {step === 9 && (
          <Button type="button" disabled={!canNext() || submitting} onClick={() => void submit()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirm appointment
          </Button>
        )}
      </div>
    </div>
  );
}
