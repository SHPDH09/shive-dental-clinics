"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Check, Loader2 } from "lucide-react";

type DoctorOption = { id: string; name: string; slug: string; specialization: string };
type ServiceOption = { id: string; name: string; slug?: string };

type Props = {
  doctors: DoctorOption[];
  services: ServiceOption[];
  initialDoctorSlug?: string | null;
  initialServiceSlug?: string | null;
};

type Step = 1 | 2 | 3 | 4 | 5;

export function AppointmentBookingWizard({
  doctors,
  services,
  initialDoctorSlug,
  initialServiceSlug,
}: Props) {
  const preDoctor = useMemo(
    () => (initialDoctorSlug ? doctors.find((d) => d.slug === initialDoctorSlug) : null),
    [doctors, initialDoctorSlug],
  );
  const preService = useMemo(
    () => (initialServiceSlug ? services.find((s) => s.slug === initialServiceSlug) : null),
    [services, initialServiceSlug],
  );

  const [step, setStep] = useState<Step>(1);
  const [doctorId, setDoctorId] = useState(preDoctor?.id ?? doctors[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(preService?.id ?? services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [closedDay, setClosedDay] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const selectedService = services.find((s) => s.id === serviceId);
  const treatmentName = selectedService?.name ?? "";

  useEffect(() => {
    if (preDoctor) setDoctorId(preDoctor.id);
  }, [preDoctor]);

  useEffect(() => {
    if (preService) setServiceId(preService.id);
  }, [preService]);

  useEffect(() => {
    if (step !== 4 || !doctorId || !date) return;
    setSlotsLoading(true);
    setTime("");
    void fetch(`/api/public/appointments/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`)
      .then((r) => r.json())
      .then((json: { slots?: string[]; closed?: boolean }) => {
        setSlots(json.slots ?? []);
        setClosedDay(Boolean(json.closed));
      })
      .catch(() => {
        setSlots([]);
        setClosedDay(true);
      })
      .finally(() => setSlotsLoading(false));
  }, [step, doctorId, date]);

  const canNext = () => {
    if (step === 1) return Boolean(doctorId);
    if (step === 2) return Boolean(serviceId);
    if (step === 3) return Boolean(date);
    if (step === 4) return Boolean(time);
    if (step === 5) return patientName.trim().length >= 2 && phone.trim().length >= 10;
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
        setError(json.error ?? "Could not book. Please try another time.");
        return;
      }
      setSuccess(`Thank you! Your reference is ${json.appointmentId}. We will confirm shortly.`);
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
    "Select Doctor",
    "Select Treatment",
    "Select Date",
    "Select Time",
    "Your Details",
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
          <h3 className="text-lg font-bold text-slate-900">Select Doctor</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {doctors.map((d) => (
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
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select Treatment</h3>
          {preService && selectedService && (
            <p className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-900">
              <Check className="h-4 w-4" />
              Selected: <strong>{selectedService.name}</strong>
            </p>
          )}
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select Date</h3>
          <Input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select Available Time</h3>
          {slotsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
          ) : closedDay ? (
            <p className="text-sm text-slate-600">This doctor is not available on the selected day. Please pick another date.</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-600">No open slots left for this day. Try another date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                    time === slot ? "border-sky-600 bg-sky-50 text-sky-900" : "border-slate-200 hover:border-sky-300"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Confirm Appointment</h3>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 space-y-1">
            <p>
              <strong>Doctor:</strong> {selectedDoctor?.name}
            </p>
            <p>
              <strong>Treatment:</strong> {treatmentName}
            </p>
            <p>
              <strong>Date:</strong> {date} at {time}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Email (optional)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Message (optional)</Label>
              <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
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
        {step < 5 && (
          <Button type="button" disabled={!canNext()} onClick={() => setStep((s) => (s + 1) as Step)}>
            Continue
          </Button>
        )}
        {step === 5 && (
          <Button type="button" disabled={!canNext() || submitting} onClick={() => void submit()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirm Appointment
          </Button>
        )}
      </div>
    </div>
  );
}
