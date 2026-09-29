"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  getOrCreateVisitorId,
  getStoredVisitorContact,
  hasUsableContact,
  setStoredVisitorContact,
  syncVisitorLead,
} from "@/lib/visitor-contact";
import { usePathname } from "next/navigation";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

/** Hidden fields for browser autofill — not shown in UI; values sync to leads in background. */
function HiddenAutofillCapture() {
  const pathname = usePathname();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const telRef = useRef<HTMLInputElement>(null);
  const lastSnapshot = useRef("");

  const trySync = useCallback(() => {
    const name = nameRef.current?.value?.trim() ?? "";
    const email = emailRef.current?.value?.trim() ?? "";
    const phone = telRef.current?.value?.trim() ?? "";
    const snap = `${name}|${email}|${phone}`;
    if (snap === lastSnapshot.current) return;
    lastSnapshot.current = snap;

    const hasEmail = email.includes("@");
    const hasPhone = phone.replace(/\D/g, "").length >= 6;
    if (!hasEmail && !hasPhone && name.length < 2) return;

    setStoredVisitorContact({
      name: name || undefined,
      email: hasEmail ? email : undefined,
      phone: hasPhone ? phone : undefined,
    });
    void syncVisitorLead(pathname || "/", {
      name: name || undefined,
      email: hasEmail ? email : undefined,
      phone: hasPhone ? phone : undefined,
    });
  }, [pathname]);

  useEffect(() => {
    trySync();
    const id = window.setInterval(trySync, 2500);
    return () => window.clearInterval(id);
  }, [trySync]);

  return (
    <form
      aria-hidden
      tabIndex={-1}
      autoComplete="on"
      className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
      onSubmit={(e) => e.preventDefault()}
    >
      <input ref={nameRef} name="name" type="text" autoComplete="name" defaultValue="" />
      <input ref={emailRef} name="email" type="email" autoComplete="email" defaultValue="" />
      <input ref={telRef} name="tel" type="tel" autoComplete="tel" defaultValue="" />
    </form>
  );
}

function GoogleOneTapLeads({ gsiReady }: { gsiReady: boolean }) {
  const prompted = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !gsiReady || prompted.current || !window.google?.accounts?.id) return;
    prompted.current = true;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false,
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
            void syncVisitorLead(window.location.pathname, { name: json.name, email: json.email });
          }
        } catch {
          /* ignore */
        }
      },
    });
    window.google.accounts.id.prompt();
  }, [gsiReady]);

  return null;
}

export function LeadCaptureSuite() {
  const [gsiReady, setGsiReady] = useState(false);

  return (
    <>
      <HiddenAutofillCapture />
      {GOOGLE_CLIENT_ID ? (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="lazyOnload"
            onLoad={() => setGsiReady(true)}
          />
          <GoogleOneTapLeads gsiReady={gsiReady} />
        </>
      ) : null}
    </>
  );
}
