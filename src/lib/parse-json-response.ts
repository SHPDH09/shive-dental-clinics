/** Parse JSON API bodies without throwing on empty or invalid responses. */
export async function parseJsonResponse<T extends Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    if (!res.ok) {
      throw new Error(res.status === 401 ? "Please sign in again" : `Request failed (${res.status})`);
    }
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      !res.ok
        ? `Server error (${res.status}). Check admin upload / storage configuration.`
        : "Invalid response from server",
    );
  }
}
