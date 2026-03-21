import "server-only";
import { CACHE_TTL } from "./constants";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function deleteCache(key: string): void {
  cache.delete(key);
}

/**
 * Simple in-memory cache with TTL.
 * - Stores data for CACHE_TTL seconds (5 min)
 * - On fetcher error, returns stale data if available
 * - No external dependencies needed
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;

  // Return cached if still fresh
  if (existing && existing.expiresAt > now) {
    return { data: existing.data, cached: true };
  }

  try {
    // Fetch fresh data
    const data = await fetcher();
    cache.set(key, { data, expiresAt: now + CACHE_TTL * 1000 });
    return { data, cached: false };
  } catch (error) {
    // On error, return stale data if we have it
    if (existing) {
      return { data: existing.data, cached: true };
    }
    throw error;
  }
}
