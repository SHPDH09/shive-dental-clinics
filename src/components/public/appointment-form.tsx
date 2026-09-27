"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentPublicSchema } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type FormValues = z.infer<typeof appointmentPublicSchema>;

type ServiceOption = { id: string; name: string };

type Props = {
  services: ServiceOption[];
  compact?: boolean;
};

export function AppointmentForm({ services, compact }: Props) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(appointmentPublicSchema),
    defaultValues: {
      patientName: "",
      phone: "",
      email: "",
      treatmentName: services[0]?.name ?? "",
      serviceId: services[0]?.id ?? "",
      appointmentDate: "",
      appointmentTime: "",
      message: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError("Please check your details and try again.");
        return;
      }
      setSuccess(`Thank you! Your reference is ${json.appointmentId}. We will confirm shortly.`);
      reset();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={compact ? "space-y-4" : "card-premium space-y-5 p-6 md:p-8"}
    >
      {!compact && (
        <div>
          <h3 className="text-xl font-bold text-slate-900">Book your visit</h3>
          <p className="mt-1 text-sm text-slate-600">We will call you to confirm your slot.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Full name</Label>
          <Input {...register("patientName")} placeholder="Your name" />
          {errors.patientName && (
            <p className="mt-1 text-xs text-red-600">{errors.patientName.message}</p>
          )}
        </div>
        <div>
          <Label>Phone</Label>
          <Input {...register("phone")} placeholder="+91 …" />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <Label>Email (optional)</Label>
          <Input type="email" {...register("email")} placeholder="you@email.com" />
        </div>
        <div>
          <Label>Treatment</Label>
          <Select
            {...register("treatmentName")}
            onChange={(e) => {
              const name = e.target.value;
              const svc = services.find((s) => s.name === name);
              register("treatmentName").onChange(e);
              if (svc) {
                const ev = { target: { name: "serviceId", value: svc.id } };
                register("serviceId").onChange(ev as never);
              }
            }}
          >
            {services.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </Select>
          <input type="hidden" {...register("serviceId")} />
        </div>
        <div>
          <Label>Preferred date</Label>
          <Input type="date" {...register("appointmentDate")} />
          {errors.appointmentDate && (
            <p className="mt-1 text-xs text-red-600">{errors.appointmentDate.message}</p>
          )}
        </div>
        <div>
          <Label>Preferred time</Label>
          <Input type="time" {...register("appointmentTime")} />
          {errors.appointmentTime && (
            <p className="mt-1 text-xs text-red-600">{errors.appointmentTime.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label>Message (optional)</Label>
        <Textarea rows={3} {...register("message")} placeholder="Symptoms or questions…" />
      </div>

      {success && (
        <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{success}</p>
      )}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Submit request
      </Button>
    </form>
  );
}
