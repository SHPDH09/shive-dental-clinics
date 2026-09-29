"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getStoredVisitorContact,
  hasUsableContact,
  syncVisitorLead,
} from "@/lib/visitor-contact";

const SESSION_VISIT_KEY = "sdc_visit_logged";

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
  const sent = useRef(false);

  useEffect(() => {
    const urlContact = pickContactFromUrl(searchParams);
    const hasUrlContact = Boolean(urlContact.email || urlContact.phone || urlContact.name);
    const stored = getStoredVisitorContact();

    try {
      if (!hasUrlContact && !hasUsableContact(stored) && sessionStorage.getItem(SESSION_VISIT_KEY) === "1") {
        return;
      }
    } catch {
      /* ignore */
    }

    if (sent.current && !hasUrlContact) return;
    sent.current = true;

    const send = () => {
      void syncVisitorLead(pathname || "/", {
        name: urlContact.name ?? stored?.name,
        email: urlContact.email ?? stored?.email,
        phone: urlContact.phone ?? stored?.phone,
      }).then(() => {
        try {
          if (!hasUrlContact && !hasUsableContact(stored)) {
            sessionStorage.setItem(SESSION_VISIT_KEY, "1");
          }
        } catch {
          /* ignore */
        }
      });
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(send, { timeout: 5000 });
    } else {
      window.setTimeout(send, 800);
    }
  }, [pathname, searchParams]);

  return null;
}
