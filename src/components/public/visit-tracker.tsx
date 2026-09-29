"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_KEY = "sdc_visitor_id";

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : `v${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return `v${Date.now()}`;
  }
}

function pickContactFromUrl(params: URLSearchParams) {
  const keys = [
    "name",
    "fullname",
    "full_name",
    "email",
    "e",
    "phone",
    "mobile",
    "tel",
    "whatsapp",
  ];
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
    queryKeys: keys.filter((k) => params.has(k)),
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

    const visitorId = getOrCreateVisitorId();
    const contact = pickContactFromUrl(searchParams);

    const payload = {
      visitorId,
      path: pathname || "/",
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      ...contact,
      queryKeys: [
        ...new Set([
          ...(contact.queryKeys ?? []),
          ...Array.from(searchParams.keys()).filter((k) => k.startsWith("utm_")),
        ]),
      ].slice(0, 30),
    };

    const send = () => {
      fetch("/api/public/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        /* ignore */
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
