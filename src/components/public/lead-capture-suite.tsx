"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { X } from "lucide-react";
import {
  getOrCreateVisitorId,
  getStoredVisitorContact,
  hasUsableContact,
  setStoredVisitorContact,
  syncVisitorLead,
} from "@/lib/visitor-contact";
import { usePathname } from "next/navigation";

const DISMISS_KEY = "sdc_lead_bar_dismissed";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (momentListener?: (n: { isNotDisplayed: () => boolean }) => void) => void;
        };
      };
    };
  }
}

function LeadCaptureBar({ onDismiss }: { onDismiss: () => void }) {
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const debounce = useRef<number | null>(null);

  useEffect(() => {
    const c = getStoredVisitorContact();
    if (c?.name) setName(c.name);
    if (c?.email) setEmail(c.email);
    if (c?.phone) setPhone(c.phone);
  }, []);

  const push = useCallback(
    (contact: { name?: string; email?: string; phone?: string }) => {
      setStoredVisitorContact(contact);
      void syncVisitorLead(pathname || "/", contact);
    },
    [pathname],
  );

  const schedulePush = useCallback(
    (next: { name: string; email: string; phone: string }) => {
      if (debounce.current) window.clearTimeout(debounce.current);
      debounce.current = window.setTimeout(() => {
        const hasEmail = next.email.includes("@");
        const hasPhone = next.phone.replace(/\D/g, "").length >= 6;
        if (!hasEmail && !hasPhone) return;
        push({
          name: next.name.trim() || undefined,
          email: hasEmail ? next.email.trim() : undefined,
          phone: hasPhone ? next.phone.trim() : undefined,
        });
      }, 600);
    },
    [push],
  );

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-3 md:bottom-6 md:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-sky-200 bg-white p-4 shadow-xl ring-1 ring-sky-100 md:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-900">Quick connect</p>
            <p className="text-xs text-slate-500">
              Browser can autofill your details — we save them as a lead when email or phone is available.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Name"
            value={name}
            onChange={(e) => {
              const v = e.target.value;
              setName(v);
              schedulePush({ name: v, email, phone });
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              schedulePush({ name, email: v, phone });
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="tel"
            name="tel"
            autoComplete="tel"
            placeholder="Phone / WhatsApp"
            value={phone}
            onChange={(e) => {
              const v = e.target.value;
              setPhone(v);
              schedulePush({ name, email, phone: v });
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function GoogleOneTapLeads({ onProfile }: { onProfile: (p: { name: string; email: string }) => void }) {
  const [gsiReady, setGsiReady] = useState(false);
  const prompted = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !gsiReady || prompted.current) return;
    if (!window.google?.accounts?.id) return;
    prompted.current = true;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: true,
      cancel_on_tap_outside: true,
      callback: async (response: { credential?: string }) => {
        const credential = response.credential;
        if (!credential) return;
        const visitorId = getOrCreateVisitorId();
        try {
          const res = await fetch("/api/public/visit/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential, visitorId, path: window.location.pathname }),
          });
          const json = (await res.json()) as { name?: string; email?: string };
          if (res.ok && json.email) {
            setStoredVisitorContact({ name: json.name, email: json.email });
            onProfile({ name: json.name ?? "", email: json.email ?? "" });
          }
        } catch {
          /* ignore */
        }
      },
    });
    window.google.accounts.id.prompt();
  }, [gsiReady, onProfile]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGsiReady(true)} />
  );
}

export function LeadCaptureSuite() {
  const [showBar, setShowBar] = useState(false);
  const [hideBar, setHideBar] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") {
        setHideBar(true);
        return;
      }
    } catch {
      /* ignore */
    }
    if (hasUsableContact(getStoredVisitorContact())) {
      setHideBar(true);
      return;
    }
    const t = window.setTimeout(() => setShowBar(true), 12000);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    setShowBar(false);
    setHideBar(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const onGoogleProfile = useCallback(() => {
    setHideBar(true);
  }, []);

  return (
    <>
      <GoogleOneTapLeads onProfile={onGoogleProfile} />
      {showBar && !hideBar && <LeadCaptureBar onDismiss={dismiss} />}
    </>
  );
}
