import { messageFromApiErrorField } from "@/lib/zod-api-error";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "same-origin",
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (body.error !== undefined) {
        message = messageFromApiErrorField(body.error);
      }
    } catch {
      /* ignore */
    }
    throw new AdminApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
