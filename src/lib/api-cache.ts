/**
 * Server-side in-memory cache with configurable TTL.
 * Resets on redeploy (acceptable for this use case).
 *
 * TTLs are long to stay well under the football-data.org
 * free tier limit of 10 req/min. Scoring uses hardcoded
 * results; API data is display-only.
 */

import { getLogger } from "./logger";

const log = getLogger("api-cache");

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** TTL presets in milliseconds */
export const CacheTTL = {
  TEAMS: 24 * 60 * 60 * 1000,       // 24 hours
  STANDINGS: 2 * 60 * 60 * 1000,    // 2 hours
  MATCHES: 30 * 60 * 1000,          // 30 minutes
  MATCHES_LIVE: 5 * 60 * 1000,      // 5 minutes
  SCORERS: 60 * 60 * 1000,          // 1 hour
  MATCH_DETAIL: 60 * 60 * 1000,     // 1 hour
  STATS: 2 * 60 * 60 * 1000,        // 2 hours
} as const;

/**
 * Get a cached value, or null if expired/missing.
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    log.info({ key, hit: false }, "cache miss");
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    log.info({ key, hit: false, reason: "expired" }, "cache miss");
    return null;
  }
  log.info({ key, hit: true }, "cache hit");
  return entry.data;
}

/**
 * Get a cached value even if expired (stale fallback).
 * Returns null only if the key was never cached.
 */
export function getStaleCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    log.debug({ key }, "stale cache miss");
    return null;
  }
  log.info({ key }, "serving stale cache fallback");
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
  log.info({ key, ttlMs }, "cache set");
}

/**
 * Invalidate a specific cache key.
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
  log.info({ key }, "cache invalidate");
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function invalidateCachePrefix(prefix: string): void {
  let count = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      count++;
    }
  }
  log.info({ prefix, evicted: count }, "cache invalidate prefix");
}

/**
 * Clear the entire cache.
 */
export function clearCache(): void {
  const size = cache.size;
  cache.clear();
  log.info({ evicted: size }, "cache clear");
}

/**
 * Get cache stats for debugging.
 */
export function getCacheStats(): {
  size: number;
  keys: { key: string; expiresAt: number; ttlRemaining: number }[];
} {
  const now = Date.now();
  return {
    size: cache.size,
    keys: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      expiresAt: (entry as CacheEntry<unknown>).expiresAt,
      ttlRemaining: Math.max(0, (entry as CacheEntry<unknown>).expiresAt - now),
    })),
  };
}
