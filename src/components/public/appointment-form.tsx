"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentPublicSchema } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";

type FormValues = z.infer<typeof appointmentPublicSchema>;

type ServiceOption = { id: string; name: string; slug?: string };

type Props = {
  services: ServiceOption[];
  compact?: boolean;
  initialServiceSlug?: string | null;
  initialServiceId?: string | null;
};

export function AppointmentForm({
  services,
  compact,
  initialServiceSlug,
  initialServiceId,
}: Props) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preselected = useMemo(() => {
    if (initialServiceId) {
      return services.find((s) => s.id === initialServiceId) ?? null;
    }
    if (initialServiceSlug) {
      return services.find((s) => s.slug === initialServiceSlug) ?? null;
    }
    return null;
  }, [initialServiceId, initialServiceSlug, services]);

  const defaultService = preselected ?? services[0] ?? null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(appointmentPublicSchema),
    defaultValues: {
      patientName: "",
      phone: "",
      email: "",
      treatmentName: defaultService?.name ?? "",
      serviceId: defaultService?.id ?? "",
      appointmentDate: "",
      appointmentTime: "",
      message: "",
    },
  });

  useEffect(() => {
    if (preselected) {
      setValue("treatmentName", preselected.name);
      setValue("serviceId", preselected.id);
    }
  }, [preselected, setValue]);

  const selectedName = watch("treatmentName");

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
      reset({
        patientName: "",
        phone: "",
        email: "",
        treatmentName: defaultService?.name ?? "",
        serviceId: defaultService?.id ?? "",
        appointmentDate: "",
        appointmentTime: "",
        message: "",
      });
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

      {preselected && selectedName === preselected.name && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          <Check className="h-4 w-4 shrink-0 text-teal-600" />
          <span>
            Selected service: <strong>{preselected.name}</strong>
          </span>
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
                setValue("serviceId", svc.id);
              }
            }}
          >
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
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
