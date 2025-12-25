/**
 * Property-based tests for cache utilities
 * Feature: v0.78-performance-optimization
 * Tests Properties 1-3 from the design document
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  withCache,
  invalidateCache,
  getCacheStats,
  getCacheMap,
  resetCacheCounters,
  setCache,
  getCache,
  hasCache,
} from '@/lib/cache-utils';

describe('Cache Utils Property Tests', () => {
  beforeEach(() => {
    // Clear cache and reset counters before each test
    invalidateCache();
    resetCacheCounters();
  });

  describe('Property 1: Cache TTL Behavior', () => {
    /**
     * Property: Cache returns cached data when TTL has not expired
     * Validates: Requirements 5.1, 5.2
     */
    it('should return cached data when TTL has not expired', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.anything(),
          fc.integer({ min: 1, max: 3600 }),
          async (key, value, ttlSeconds) => {
            // Use unique key per iteration to avoid cache collisions
            const uniqueKey = `test-${Date.now()}-${Math.random()}-${key}`;
            let fetchCount = 0;
            const fetcher = async () => {
              fetchCount++;
              return value;
            };

            // First call should fetch
            const result1 = await withCache(uniqueKey, fetcher, ttlSeconds);
            expect(fetchCount).toBe(1);

            // Second call should return cached value (not fetch again)
            const result2 = await withCache(uniqueKey, fetcher, ttlSeconds);
            expect(fetchCount).toBe(1); // Still 1, not 2
            expect(result2).toEqual(result1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Cache fetches fresh data when TTL has expired
     * Validates: Requirement 5.3
     */
    it('should fetch fresh data when TTL has expired', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (key) => {
            let fetchCount = 0;
            const fetcher = async () => {
              fetchCount++;
              return `value-${fetchCount}`;
            };

            // Use very short TTL (1ms effectively)
            const ttlSeconds = 0.001;

            // First call
            await withCache(key, fetcher, ttlSeconds);
            expect(fetchCount).toBe(1);

            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 10));

            // Second call should fetch again due to expired TTL
            await withCache(key, fetcher, ttlSeconds);
            expect(fetchCount).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: TTL is configurable per cache entry
     * Validates: Requirement 5.1
     */
    it('should support different TTL values for different keys', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 60, max: 3600 }),
          fc.integer({ min: 60, max: 3600 }),
          async (key1, key2, ttl1, ttl2) => {
            // Ensure different keys
            const uniqueKey1 = `key1-${key1}`;
            const uniqueKey2 = `key2-${key2}`;

            setCache(uniqueKey1, 'value1', ttl1);
            setCache(uniqueKey2, 'value2', ttl2);

            // Both should be cached
            expect(hasCache(uniqueKey1)).toBe(true);
            expect(hasCache(uniqueKey2)).toBe(true);

            // Values should be retrievable
            expect(getCache(uniqueKey1)).toBe('value1');
            expect(getCache(uniqueKey2)).toBe('value2');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Cache Invalidation', () => {
    /**
     * Property: Invalidation with pattern removes matching entries
     * Validates: Requirement 5.4
     */
    it('should remove entries matching pattern', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (prefix, count) => {
            // Clear cache first
            invalidateCache();

            // Add entries with prefix
            for (let i = 0; i < count; i++) {
              setCache(`${prefix}-${i}`, `value-${i}`, 3600);
            }

            // Add entries without prefix
            setCache('other-key', 'other-value', 3600);

            // Invalidate with pattern
            const removed = invalidateCache(`${prefix}-*`);

            // Should have removed all prefixed entries
            expect(removed).toBe(count);

            // Prefixed entries should be gone
            for (let i = 0; i < count; i++) {
              expect(hasCache(`${prefix}-${i}`)).toBe(false);
            }

            // Other entry should still exist
            expect(hasCache('other-key')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Invalidation without pattern clears all entries
     * Validates: Requirement 5.5
     */
    it('should clear all entries when no pattern provided', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 20 }),
          (keys) => {
            // Clear cache first
            invalidateCache();

            // Add entries
            const uniqueKeys = [...new Set(keys)];
            uniqueKeys.forEach((key, i) => {
              setCache(`test-${key}-${i}`, `value-${i}`, 3600);
            });

            const sizeBefore = getCacheMap().size;

            // Invalidate all
            const removed = invalidateCache();

            // Should have removed all entries
            expect(removed).toBe(sizeBefore);
            expect(getCacheMap().size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Pattern matching supports wildcard correctly
     * Validates: Requirement 5.4
     */
    it('should support wildcard pattern matching', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('customers', 'employees', 'dashboard'),
          fc.integer({ min: 1, max: 5 }),
          (category, count) => {
            // Clear cache first
            invalidateCache();

            // Add entries for multiple categories
            for (let i = 0; i < count; i++) {
              setCache(`customers-list-${i}`, `customer-${i}`, 3600);
              setCache(`employees-list-${i}`, `employee-${i}`, 3600);
              setCache(`dashboard-stats-${i}`, `stats-${i}`, 3600);
            }

            const totalBefore = getCacheMap().size;
            expect(totalBefore).toBe(count * 3);

            // Invalidate only one category
            const removed = invalidateCache(`${category}-*`);

            // Should have removed only that category
            expect(removed).toBe(count);
            expect(getCacheMap().size).toBe(count * 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Cache Statistics', () => {
    /**
     * Property: Cache stats accurately reflect cache state
     * Validates: Requirement 5.5
     */
    it('should accurately report cache size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 50 }),
          (entryCount) => {
            // Clear cache first
            invalidateCache();
            resetCacheCounters();

            // Add entries
            for (let i = 0; i < entryCount; i++) {
              setCache(`key-${i}`, `value-${i}`, 3600);
            }

            const stats = getCacheStats();
            expect(stats.size).toBe(entryCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Hit rate calculation is correct
     * Validates: Requirement 5.5
     */
    it('should calculate hit rate correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 0, max: 20 }),
          async (hits, misses) => {
            // Clear cache and reset counters
            invalidateCache();
            resetCacheCounters();

            // Generate hits by caching and retrieving
            for (let i = 0; i < hits; i++) {
              setCache(`hit-key-${i}`, `value-${i}`, 3600);
              getCache(`hit-key-${i}`); // This counts as a hit
            }

            // Generate misses by requesting non-existent keys
            for (let i = 0; i < misses; i++) {
              getCache(`miss-key-${i}`); // This counts as a miss
            }

            const stats = getCacheStats();
            const expectedHitRate = (hits + misses) > 0 ? hits / (hits + misses) : 0;

            expect(stats.hits).toBe(hits);
            expect(stats.misses).toBe(misses);
            expect(stats.hitRate).toBeCloseTo(expectedHitRate, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Oldest entry age is tracked correctly
     * Validates: Requirement 5.5
     */
    it('should track oldest entry age', async () => {
      // Clear cache first
      invalidateCache();
      resetCacheCounters();

      // Add first entry
      setCache('first-key', 'first-value', 3600);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));

      // Add second entry
      setCache('second-key', 'second-value', 3600);

      const stats = getCacheStats();

      // Oldest entry age should be at least 50ms
      expect(stats.oldestEntryAge).not.toBeNull();
      expect(stats.oldestEntryAge!).toBeGreaterThanOrEqual(50);
    });

    /**
     * Property: Empty cache has null oldest entry age
     * Validates: Requirement 5.5
     */
    it('should return null oldest entry age for empty cache', () => {
      invalidateCache();
      resetCacheCounters();

      const stats = getCacheStats();
      expect(stats.oldestEntryAge).toBeNull();
      expect(stats.size).toBe(0);
    });
  });
});
