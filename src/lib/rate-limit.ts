const buckets = new Map<string, { count: number; resetAt: number }>();

/** Simple in-memory rate limiter (per Worker/Node instance). Pair with Cloudflare WAF for global limits. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const row = buckets.get(key);
  if (!row || now > row.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (row.count >= limit) return false;
  row.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function rateLimit429(retryAfterSec = 60): Response {
  return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSec),
    },
  });
}

/** Returns a 429 Response if limited, otherwise null. */
export function enforceRateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowMs: number,
): Response | null {
  const ip = clientIp(req);
  const key = `${scope}:${ip}`;
  if (!checkRateLimit(key, limit, windowMs)) {
    const retryAfter = Math.ceil(windowMs / 1000);
    return rateLimit429(Math.min(retryAfter, 3600));
  }
  return null;
}
