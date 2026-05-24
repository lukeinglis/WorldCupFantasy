interface RateLimitEntry {
  count: number;
  windowStart: number;
  windowMs: number;
}

// In-memory store; resets on cold starts and is per-instance. Fine for ~20 user friends league.
const store = new Map<string, RateLimitEntry>();

const MAX_ENTRIES = 1000;

interface RateLimitParams {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit({ key, limit, windowMs }: RateLimitParams): RateLimitResult {
  const now = Date.now();

  if (store.size > MAX_ENTRIES) {
    for (const [k, entry] of store) {
      if (now - entry.windowStart > entry.windowMs) {
        store.delete(k);
      }
    }
    if (store.size > MAX_ENTRIES) {
      store.clear();
    }
  }

  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now, windowMs });
    return { success: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { success: false, remaining: 0, retryAfterMs };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}
