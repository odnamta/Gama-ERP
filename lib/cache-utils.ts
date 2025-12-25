/**
 * Cache Utilities Module
 * In-memory caching layer with TTL support for performance optimization
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

/**
 * Cache entry interface with value and expiration timestamp
 * Requirement 5.1: Store data with configurable TTL
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * Cache statistics interface
 * Requirement 5.5: Provide cache statistics
 */
export interface CacheStats {
  size: number;
  hitRate: number;
  oldestEntryAge: number | null;
  hits: number;
  misses: number;
}

// In-memory cache storage
const cache = new Map<string, CacheEntry<unknown>>();

// Cache hit/miss counters for statistics
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Get the current cache Map (for testing purposes)
 */
export function getCacheMap(): Map<string, CacheEntry<unknown>> {
  return cache;
}

/**
 * Reset cache counters (for testing purposes)
 */
export function resetCacheCounters(): void {
  cacheHits = 0;
  cacheMisses = 0;
}

/**
 * Wrapper function that caches the result of an async function
 * Requirement 5.1: Store data with configurable TTL in seconds
 * Requirement 5.2: Return cached data if TTL has not expired
 * Requirement 5.3: Fetch fresh data if TTL has expired
 * 
 * @param key - Unique cache key
 * @param fetcher - Async function to fetch data if not cached
 * @param ttlSeconds - Time-to-live in seconds
 * @returns Cached or freshly fetched data
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  // Check if cached data exists and is not expired
  if (cached && cached.expiresAt > now) {
    cacheHits++;
    return cached.value;
  }

  // Fetch fresh data
  cacheMisses++;
  const value = await fetcher();

  // Store in cache with expiration
  const entry: CacheEntry<T> = {
    value,
    expiresAt: now + (ttlSeconds * 1000),
    createdAt: now,
  };
  cache.set(key, entry as CacheEntry<unknown>);

  return value;
}

/**
 * Invalidate cache entries matching a pattern
 * Requirement 5.4: Remove entries matching pattern
 * Requirement 5.5: Clear all entries if no pattern provided
 * 
 * @param pattern - Optional pattern to match cache keys (supports * wildcard)
 * @returns Number of entries removed
 */
export function invalidateCache(pattern?: string): number {
  if (!pattern) {
    // Clear all cache entries
    const size = cache.size;
    cache.clear();
    return size;
  }

  // Convert pattern to regex (support * wildcard)
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*'); // Convert * to .*
  const regex = new RegExp(`^${regexPattern}$`);

  let removed = 0;
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      removed++;
    }
  }

  return removed;
}

/**
 * Get current cache statistics
 * Requirement 5.5: Provide cache statistics including size, hit rate, and oldest entry
 * 
 * @returns Cache statistics object
 */
export function getCacheStats(): CacheStats {
  const now = Date.now();
  let oldestCreatedAt: number | null = null;

  for (const entry of cache.values()) {
    if (oldestCreatedAt === null || entry.createdAt < oldestCreatedAt) {
      oldestCreatedAt = entry.createdAt;
    }
  }

  const totalRequests = cacheHits + cacheMisses;
  const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

  return {
    size: cache.size,
    hitRate,
    oldestEntryAge: oldestCreatedAt !== null ? now - oldestCreatedAt : null,
    hits: cacheHits,
    misses: cacheMisses,
  };
}

/**
 * Manually set a cache entry (useful for pre-warming cache)
 * 
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time-to-live in seconds
 */
export function setCache<T>(key: string, value: T, ttlSeconds: number): void {
  const now = Date.now();
  const entry: CacheEntry<T> = {
    value,
    expiresAt: now + (ttlSeconds * 1000),
    createdAt: now,
  };
  cache.set(key, entry as CacheEntry<unknown>);
}

/**
 * Get a cache entry directly (without fetcher)
 * 
 * @param key - Cache key
 * @returns Cached value or undefined if not found/expired
 */
export function getCache<T>(key: string): T | undefined {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    cacheHits++;
    return cached.value;
  }

  if (cached) {
    // Entry exists but expired, remove it
    cache.delete(key);
  }

  cacheMisses++;
  return undefined;
}

/**
 * Check if a cache key exists and is not expired
 * 
 * @param key - Cache key
 * @returns True if key exists and is valid
 */
export function hasCache(key: string): boolean {
  const now = Date.now();
  const cached = cache.get(key);
  return cached !== undefined && cached.expiresAt > now;
}
