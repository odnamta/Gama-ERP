/**
 * Property-based tests for performance monitoring utilities
 * Feature: v0.78-performance-optimization
 * Tests Properties 9-10 from the design document
 * Validates: Requirements 9.1, 9.2, 9.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  logSlowQuery,
  getPerformanceMetrics,
  clearSlowQueryLog,
  getSlowQueryLog,
  getSlowQueryThreshold,
  isSlowQuery,
  formatExecutionTime,
  withQueryTiming,
} from '@/lib/performance-utils';
import {
  getCacheStats,
  setCache,
  getCache,
  invalidateCache,
  resetCacheCounters,
} from '@/lib/cache-utils';

describe('Performance Utils Property Tests', () => {
  beforeEach(() => {
    clearSlowQueryLog();
  });

  describe('Property 9: Slow Query Logging', () => {
    /**
     * Property: Queries >= 1000ms are logged as slow
     * Validates: Requirement 9.1
     */
    it('should log queries that take >= 1000ms', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1000, max: 10000 }),
          (query, executionTime) => {
            clearSlowQueryLog();
            
            const wasLogged = logSlowQuery(query, executionTime);
            
            expect(wasLogged).toBe(true);
            expect(getSlowQueryLog().length).toBe(1);
            
            const logEntry = getSlowQueryLog()[0];
            expect(logEntry.query).toBe(query);
            expect(logEntry.executionTime).toBe(executionTime);
            expect(logEntry.timestamp).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Queries < 1000ms are NOT logged
     * Validates: Requirement 9.1
     */
    it('should not log queries that take < 1000ms', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 999 }),
          (query, executionTime) => {
            clearSlowQueryLog();
            
            const wasLogged = logSlowQuery(query, executionTime);
            
            expect(wasLogged).toBe(false);
            expect(getSlowQueryLog().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Slow query threshold is exactly 1000ms
     * Validates: Requirement 9.1
     */
    it('should have threshold of exactly 1000ms', () => {
      expect(getSlowQueryThreshold()).toBe(1000);
    });

    /**
     * Property: isSlowQuery correctly identifies slow queries
     * Validates: Requirement 9.1
     */
    it('should correctly identify slow queries', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5000 }),
          (executionTime) => {
            const isSlow = isSlowQuery(executionTime);
            expect(isSlow).toBe(executionTime >= 1000);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Log entries include query text, execution time, and timestamp
     * Validates: Requirement 9.3
     */
    it('should include query text, execution time, and timestamp in log entries', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1000, max: 5000 }),
          fc.option(fc.string({ minLength: 1, maxLength: 30 })),
          fc.option(fc.constantFrom('select', 'insert', 'update', 'delete')),
          (query, executionTime, table, operation) => {
            clearSlowQueryLog();
            
            logSlowQuery(query, executionTime, table ?? undefined, operation ?? undefined);
            
            const logEntry = getSlowQueryLog()[0];
            expect(logEntry.query).toBe(query);
            expect(logEntry.executionTime).toBe(executionTime);
            expect(logEntry.timestamp).toBeInstanceOf(Date);
            expect(logEntry.table).toBe(table ?? undefined);
            expect(logEntry.operation).toBe(operation ?? undefined);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Performance metrics accurately reflect logged queries
     * Validates: Requirement 9.3
     */
    it('should accurately calculate performance metrics', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              query: fc.string({ minLength: 1, maxLength: 50 }),
              executionTime: fc.integer({ min: 1000, max: 5000 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (queries) => {
            clearSlowQueryLog();
            
            // Log all queries
            queries.forEach(q => logSlowQuery(q.query, q.executionTime));
            
            const metrics = getPerformanceMetrics();
            
            // Count should match
            expect(metrics.slowQueryCount).toBe(queries.length);
            
            // Average should be correct
            const totalTime = queries.reduce((sum, q) => sum + q.executionTime, 0);
            const expectedAverage = totalTime / queries.length;
            expect(metrics.averageSlowQueryTime).toBeCloseTo(expectedAverage, 5);
            
            // Slowest query should be correct
            const maxTime = Math.max(...queries.map(q => q.executionTime));
            expect(metrics.slowestQuery?.executionTime).toBe(maxTime);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Empty log returns zero metrics
     * Validates: Requirement 9.3
     */
    it('should return zero metrics for empty log', () => {
      clearSlowQueryLog();
      
      const metrics = getPerformanceMetrics();
      
      expect(metrics.slowQueryCount).toBe(0);
      expect(metrics.averageSlowQueryTime).toBe(0);
      expect(metrics.slowestQuery).toBeNull();
      expect(metrics.recentSlowQueries).toEqual([]);
    });
  });

  describe('Property 10: Cache Hit Rate Tracking', () => {
    beforeEach(() => {
      invalidateCache();
      resetCacheCounters();
    });

    /**
     * Property: Cache hit rate is correctly calculated
     * Validates: Requirement 9.2
     */
    it('should correctly calculate cache hit rate', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }),
          fc.integer({ min: 0, max: 20 }),
          (hits, misses) => {
            invalidateCache();
            resetCacheCounters();
            
            // Generate hits by setting and getting cached values
            for (let i = 0; i < hits; i++) {
              setCache(`hit-key-${i}`, `value-${i}`, 3600);
              getCache(`hit-key-${i}`);
            }
            
            // Generate misses by requesting non-existent keys
            for (let i = 0; i < misses; i++) {
              getCache(`miss-key-${i}`);
            }
            
            const stats = getCacheStats();
            const totalRequests = hits + misses;
            const expectedHitRate = totalRequests > 0 ? hits / totalRequests : 0;
            
            expect(stats.hits).toBe(hits);
            expect(stats.misses).toBe(misses);
            expect(stats.hitRate).toBeCloseTo(expectedHitRate, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Hit rate is 0 when no requests made
     * Validates: Requirement 9.2
     */
    it('should return 0 hit rate when no requests made', () => {
      invalidateCache();
      resetCacheCounters();
      
      const stats = getCacheStats();
      
      expect(stats.hitRate).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    /**
     * Property: Hit rate is 1 when all requests are hits
     * Validates: Requirement 9.2
     */
    it('should return 1 hit rate when all requests are hits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (requestCount) => {
            invalidateCache();
            resetCacheCounters();
            
            // Set up cache entries
            for (let i = 0; i < requestCount; i++) {
              setCache(`key-${i}`, `value-${i}`, 3600);
            }
            
            // All requests should be hits
            for (let i = 0; i < requestCount; i++) {
              getCache(`key-${i}`);
            }
            
            const stats = getCacheStats();
            
            expect(stats.hitRate).toBe(1);
            expect(stats.hits).toBe(requestCount);
            expect(stats.misses).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Hit rate is 0 when all requests are misses
     * Validates: Requirement 9.2
     */
    it('should return 0 hit rate when all requests are misses', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (requestCount) => {
            invalidateCache();
            resetCacheCounters();
            
            // All requests should be misses (no cache entries)
            for (let i = 0; i < requestCount; i++) {
              getCache(`nonexistent-key-${i}`);
            }
            
            const stats = getCacheStats();
            
            expect(stats.hitRate).toBe(0);
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(requestCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Execution Time Formatting', () => {
    /**
     * Property: Times >= 1000ms are formatted as seconds
     */
    it('should format times >= 1000ms as seconds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000 }),
          (ms) => {
            const formatted = formatExecutionTime(ms);
            expect(formatted).toMatch(/^\d+\.\d{2}s$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Times < 1000ms are formatted as milliseconds
     */
    it('should format times < 1000ms as milliseconds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 999 }),
          (ms) => {
            const formatted = formatExecutionTime(ms);
            expect(formatted).toMatch(/^\d+ms$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
