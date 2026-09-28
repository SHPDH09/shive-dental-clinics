"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, type Paginated } from "@/lib/admin-client";

export function useAdminList<T>(path: string, query?: Record<string, string>) {
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const queryKey = query ? JSON.stringify(query) : "";

  const reload = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "50", ...(query ?? {}) });
    let cancelled = false;
    setLoading(true);
    setError(null);

    adminFetch<Paginated<T>>(`${path}?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err && typeof err === "object" && "message" in err && typeof err.message === "string"
              ? err.message
              : "Failed to load data";
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, queryKey, tick]);

  return { data, loading, error, reload };
}
