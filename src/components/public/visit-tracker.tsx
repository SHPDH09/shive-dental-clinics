"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getOrCreateVisitorId,
  getStoredVisitorContact,
  syncVisitorLead,
} from "@/lib/visitor-contact";

function pickContactFromUrl(params: URLSearchParams) {
  const get = (...names: string[]) => {
    for (const n of names) {
      const v = params.get(n)?.trim();
      if (v) return v;
    }
    return null;
  };
  return {
    name: get("name", "fullname", "full_name"),
    email: get("email", "e"),
    phone: get("phone", "mobile", "tel", "whatsapp"),
  };
}

export function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    const path = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    if (lastSent.current === path) return;
    lastSent.current = path;

    const urlContact = pickContactFromUrl(searchParams);
    const stored = getStoredVisitorContact();

    const send = () => {
      void syncVisitorLead(pathname || "/", {
        name: urlContact.name ?? stored?.name,
        email: urlContact.email ?? stored?.email,
        phone: urlContact.phone ?? stored?.phone,
      });
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(send, { timeout: 3000 });
    } else {
      window.setTimeout(send, 400);
    }
  }, [pathname, searchParams]);

  return null;
}
