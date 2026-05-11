/**
 * Server-side in-memory cache with configurable TTL.
 * Resets on redeploy (acceptable for this use case).
 *
 * TTL defaults:
 *   teams/groups:  24 hours  (rarely change)
 *   standings:     15 minutes
 *   matches:        5 minutes
 *   scorers:       15 minutes
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** TTL presets in milliseconds */
export const CacheTTL = {
  TEAMS: 24 * 60 * 60 * 1000,       // 24 hours
  STANDINGS: 15 * 60 * 1000,        // 15 minutes
  MATCHES: 5 * 60 * 1000,           // 5 minutes
  MATCHES_LIVE: 30 * 1000,          // 30 seconds for live matches
  SCORERS: 15 * 60 * 1000,          // 15 minutes
  MATCH_DETAIL: 2 * 60 * 1000,      // 2 minutes
  STATS: 15 * 60 * 1000,            // 15 minutes
} as const;

/**
 * Get a cached value, or null if expired/missing.
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Set a value in the cache with a given TTL (in ms).
 */
export function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidate a specific cache key.
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear the entire cache.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache stats for debugging.
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
