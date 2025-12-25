/**
 * Property-based tests for cached query functions and mutation-triggered invalidation
 * Feature: v0.78-performance-optimization
 * Tests Property 3: Mutation-Triggered Cache Invalidation
 * Validates: Requirements 6.4, 6.5, 6.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  invalidateCustomerCache,
  invalidateEmployeeCache,
  invalidateDashboardCache,
  invalidateAllCaches,
  CACHE_KEYS,
} from '@/lib/cached-queries';
import {
  invalidateCache,
  setCache,
  hasCache,
  getCacheMap,
  resetCacheCounters,
} from '@/lib/cache-utils';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  })),
}));

describe('Cached Queries Property Tests', () => {
  beforeEach(() => {
    // Clear cache and reset counters before each test
    invalidateCache();
    resetCacheCounters();
  });

  describe('Property 3: Mutation-Triggered Cache Invalidation', () => {
    /**
     * Property: Customer cache invalidation removes all customer-related entries
     * Validates: Requirement 6.4
     */
    it('should invalidate all customer cache entries on customer mutation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (customerEntryCount) => {
            // Clear cache first
            invalidateCache();

            // Add customer cache entries
            for (let i = 0; i < customerEntryCount; i++) {
              setCache(`${CACHE_KEYS.CUSTOMERS}-list-${i}`, { id: i, name: `Customer ${i}` }, 600);
            }

            // Add non-customer entries that should NOT be invalidated
            setCache(`${CACHE_KEYS.EMPLOYEES}-list`, [{ id: 1 }], 600);
            setCache(`${CACHE_KEYS.DASHBOARD}-stats`, { active_jobs: 5 }, 60);

            // Verify customer entries exist
            for (let i = 0; i < customerEntryCount; i++) {
              expect(hasCache(`${CACHE_KEYS.CUSTOMERS}-list-${i}`)).toBe(true);
            }

            // Invalidate customer cache
            const removed = invalidateCustomerCache();

            // All customer entries should be removed
            expect(removed).toBe(customerEntryCount);
            for (let i = 0; i < customerEntryCount; i++) {
              expect(hasCache(`${CACHE_KEYS.CUSTOMERS}-list-${i}`)).toBe(false);
            }

            // Non-customer entries should still exist
            expect(hasCache(`${CACHE_KEYS.EMPLOYEES}-list`)).toBe(true);
            expect(hasCache(`${CACHE_KEYS.DASHBOARD}-stats`)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Employee cache invalidation removes all employee-related entries
     * Validates: Requirement 6.5
     */
    it('should invalidate all employee cache entries on employee mutation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (employeeEntryCount) => {
            // Clear cache first
            invalidateCache();

            // Add employee cache entries
            for (let i = 0; i < employeeEntryCount; i++) {
              setCache(`${CACHE_KEYS.EMPLOYEES}-list-${i}`, { id: i, name: `Employee ${i}` }, 600);
            }

            // Add non-employee entries that should NOT be invalidated
            setCache(`${CACHE_KEYS.CUSTOMERS}-list`, [{ id: 1 }], 600);
            setCache(`${CACHE_KEYS.DASHBOARD}-stats`, { active_jobs: 5 }, 60);

            // Verify employee entries exist
            for (let i = 0; i < employeeEntryCount; i++) {
              expect(hasCache(`${CACHE_KEYS.EMPLOYEES}-list-${i}`)).toBe(true);
            }

            // Invalidate employee cache
            const removed = invalidateEmployeeCache();

            // All employee entries should be removed
            expect(removed).toBe(employeeEntryCount);
            for (let i = 0; i < employeeEntryCount; i++) {
              expect(hasCache(`${CACHE_KEYS.EMPLOYEES}-list-${i}`)).toBe(false);
            }

            // Non-employee entries should still exist
            expect(hasCache(`${CACHE_KEYS.CUSTOMERS}-list`)).toBe(true);
            expect(hasCache(`${CACHE_KEYS.DASHBOARD}-stats`)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Dashboard cache invalidation removes all dashboard-related entries
     * Validates: Requirement 6.6
     */
    it('should invalidate all dashboard cache entries on JO/invoice status change', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (dashboardEntryCount) => {
            // Clear cache first
            invalidateCache();

            // Add dashboard cache entries
            for (let i = 0; i < dashboardEntryCount; i++) {
              setCache(`${CACHE_KEYS.DASHBOARD}-stats-${i}`, { active_jobs: i }, 60);
            }

            // Add non-dashboard entries that should NOT be invalidated
            setCache(`${CACHE_KEYS.CUSTOMERS}-list`, [{ id: 1 }], 600);
            setCache(`${CACHE_KEYS.EMPLOYEES}-list`, [{ id: 1 }], 600);

            // Verify dashboard entries exist
            for (let i = 0; i < dashboardEntryCount; i++) {
              expect(hasCache(`${CACHE_KEYS.DASHBOARD}-stats-${i}`)).toBe(true);
            }

            // Invalidate dashboard cache
            const removed = invalidateDashboardCache();

            // All dashboard entries should be removed
            expect(removed).toBe(dashboardEntryCount);
            for (let i = 0; i < dashboardEntryCount; i++) {
              expect(hasCache(`${CACHE_KEYS.DASHBOARD}-stats-${i}`)).toBe(false);
            }

            // Non-dashboard entries should still exist
            expect(hasCache(`${CACHE_KEYS.CUSTOMERS}-list`)).toBe(true);
            expect(hasCache(`${CACHE_KEYS.EMPLOYEES}-list`)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Invalidation is idempotent - calling multiple times has same effect
     * Validates: Requirements 6.4, 6.5, 6.6
     */
    it('should be idempotent - multiple invalidations have same effect', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('customers', 'employees', 'dashboard'),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          (cacheType, entryCount, invalidationCount) => {
            // Clear cache first
            invalidateCache();

            // Add cache entries based on type
            const cacheKey = cacheType === 'customers' 
              ? CACHE_KEYS.CUSTOMERS 
              : cacheType === 'employees' 
                ? CACHE_KEYS.EMPLOYEES 
                : CACHE_KEYS.DASHBOARD;

            for (let i = 0; i < entryCount; i++) {
              setCache(`${cacheKey}-entry-${i}`, { id: i }, 600);
            }

            // Get invalidation function
            const invalidateFn = cacheType === 'customers'
              ? invalidateCustomerCache
              : cacheType === 'employees'
                ? invalidateEmployeeCache
                : invalidateDashboardCache;

            // First invalidation should remove all entries
            const firstRemoved = invalidateFn();
            expect(firstRemoved).toBe(entryCount);

            // Subsequent invalidations should remove 0 entries
            for (let i = 1; i < invalidationCount; i++) {
              const removed = invalidateFn();
              expect(removed).toBe(0);
            }

            // Cache should be empty for this type
            for (let i = 0; i < entryCount; i++) {
              expect(hasCache(`${cacheKey}-entry-${i}`)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: invalidateAllCaches clears everything
     * Validates: All cache requirements
     */
    it('should clear all caches when invalidateAllCaches is called', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          (customerCount, employeeCount, dashboardCount) => {
            // Clear cache first
            invalidateCache();

            // Add entries for all cache types
            for (let i = 0; i < customerCount; i++) {
              setCache(`${CACHE_KEYS.CUSTOMERS}-${i}`, { id: i }, 600);
            }
            for (let i = 0; i < employeeCount; i++) {
              setCache(`${CACHE_KEYS.EMPLOYEES}-${i}`, { id: i }, 600);
            }
            for (let i = 0; i < dashboardCount; i++) {
              setCache(`${CACHE_KEYS.DASHBOARD}-${i}`, { id: i }, 60);
            }

            const totalEntries = customerCount + employeeCount + dashboardCount;
            expect(getCacheMap().size).toBe(totalEntries);

            // Invalidate all
            const removed = invalidateAllCaches();

            // All entries should be removed
            expect(removed).toBe(totalEntries);
            expect(getCacheMap().size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Cache keys follow expected naming convention
     * Validates: Cache key structure
     */
    it('should use consistent cache key prefixes', () => {
      expect(CACHE_KEYS.CUSTOMERS).toBe('customers');
      expect(CACHE_KEYS.EMPLOYEES).toBe('employees');
      expect(CACHE_KEYS.DASHBOARD).toBe('dashboard');
    });
  });
});
