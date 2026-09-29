/** Anonymous visitor id + optional contact hints (same device, user-consented or autofill). */

export const VISITOR_ID_KEY = "sdc_visitor_id";
export const VISITOR_CONTACT_KEY = "sdc_visitor_contact";

export type VisitorContact = {
  name?: string;
  email?: string;
  phone?: string;
};

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : `v${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    return `v${Date.now()}`;
  }
}

export function getStoredVisitorContact(): VisitorContact | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VISITOR_CONTACT_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as VisitorContact;
    if (!j || typeof j !== "object") return null;
    return j;
  } catch {
    return null;
  }
}

export function setStoredVisitorContact(contact: VisitorContact): void {
  if (typeof window === "undefined") return;
  try {
    const prev = getStoredVisitorContact() ?? {};
    const merged = {
      name: contact.name?.trim() || prev.name,
      email: contact.email?.trim() || prev.email,
      phone: contact.phone?.trim() || prev.phone,
    };
    localStorage.setItem(VISITOR_CONTACT_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}

export function hasUsableContact(c: VisitorContact | null): boolean {
  if (!c) return false;
  const email = c.email?.trim();
  const phone = c.phone?.replace(/\s/g, "");
  return Boolean((email && email.includes("@")) || (phone && phone.length >= 6));
}

export async function syncVisitorLead(path: string, extra?: VisitorContact): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  if (!visitorId) return;
  const stored = getStoredVisitorContact();
  const payload = {
    visitorId,
    path,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    name: extra?.name ?? stored?.name ?? null,
    email: extra?.email ?? stored?.email ?? null,
    phone: extra?.phone ?? stored?.phone ?? null,
  };
  const body: Record<string, unknown> = { ...payload };
  if (extra) body.captureSource = "prompt";
  else if (stored && hasUsableContact(stored)) body.captureSource = "stored_contact";
  else body.captureSource = "visit";
  try {
    await fetch("/api/public/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
