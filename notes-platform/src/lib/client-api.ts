export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed.");
  return data;
}

export async function addToCart(noteId: string) {
  return api<{ ok: true }>("/api/cart", { method: "POST", body: JSON.stringify({ noteId }) });
}

export async function buyNowFlow(noteId: string) {
  await addToCart(noteId);
  window.location.href = "/cart";
}
