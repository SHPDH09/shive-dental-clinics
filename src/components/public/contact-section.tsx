"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enquirySchema } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useState } from "react";
import { setStoredVisitorContact, syncVisitorLead } from "@/lib/visitor-contact";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

type FormValues = z.infer<typeof enquirySchema>;

type ContactProps = {
  phone: string;
  email: string;
  address: string;
  mapEmbedUrl?: string | null;
  openingHours?: { weekdays?: string; sunday?: string } | null;
};

export function ContactSection({
  phone,
  email,
  address,
  mapEmbedUrl,
  openingHours,
}: ContactProps) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(enquirySchema),
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const res = await fetch("/api/public/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setError("Could not send message. Please try again.");
        return;
      }
      setStoredVisitorContact({ name: data.name, email: data.email, phone: data.phone });
      void syncVisitorLead("/contact", { name: data.name, email: data.email, phone: data.phone });
      setSuccess(true);
      reset();
    } catch {
      setError("Something went wrong.");
    }
  };

  const hours = openingHours as { weekdays?: string; sunday?: string } | undefined;

  return (
    <section id="contact" className="scroll-mt-24 bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="section-title">Get in touch</h2>
        <p className="section-subtitle">Questions about treatment or insurance? We are happy to help.</p>
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="card-premium flex gap-4 p-5">
              <MapPin className="h-5 w-5 text-[var(--primary)]" />
              <div>
                <p className="font-semibold text-slate-900">Visit us</p>
                <p className="mt-1 text-sm text-slate-600">{address}</p>
              </div>
            </div>
            <div className="card-premium flex gap-4 p-5">
              <Phone className="h-5 w-5 text-[var(--primary)]" />
              <div>
                <p className="font-semibold text-slate-900">Call</p>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-sm text-[var(--primary)]">{phone}</a>
              </div>
            </div>
            <div className="card-premium flex gap-4 p-5">
              <Mail className="h-5 w-5 text-[var(--primary)]" />
              <div>
                <p className="font-semibold text-slate-900">Email</p>
                <a href={`mailto:${email}`} className="text-sm text-[var(--primary)]">{email}</a>
              </div>
            </div>
            <div className="card-premium flex gap-4 p-5">
              <Clock className="h-5 w-5 text-[var(--primary)]" />
              <div>
                <p className="font-semibold text-slate-900">Hours</p>
                <p className="text-sm text-slate-600">{hours?.weekdays ?? "Mon – Sat: 9 AM – 8 PM"}</p>
                <p className="text-sm text-slate-600">{hours?.sunday ?? "Sun: 10 AM – 2 PM"}</p>
              </div>
            </div>
            {mapEmbedUrl && (
              <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                <iframe
                  title="Clinic location"
                  src={mapEmbedUrl}
                  className="h-56 w-full border-0"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card-premium space-y-4 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900">Send a message</h3>
            <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register("website")} />
            <div>
              <Label>Name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Subject</Label>
              <Input {...register("subject")} placeholder="e.g. Teeth cleaning appointment" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Phone</Label>
                <Input {...register("phone")} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
              </div>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={4} {...register("message")} />
              {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
            </div>
            {success && (
              <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
                Thank you! We will respond shortly.
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>Send message</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
