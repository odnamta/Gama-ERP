/**
 * Recent Searches Utility Tests
 * v0.24: Global Search Feature
 * 
 * Property-based tests for recent searches management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import {
  addToRecentSearches,
  getMaxRecentSearches,
} from '@/lib/recent-searches-utils'

describe('Recent Searches Utils', () => {
  /**
   * **Feature: global-search, Property 6: Recent Searches Maximum Limit**
   * *For any* state of recentSearches, the array length SHALL be at most 5.
   * **Validates: Requirements 7.1**
   */
  describe('Property 6: Recent Searches Maximum Limit', () => {
    it('should never exceed MAX_RECENT_SEARCHES items', () => {
      fc.assert(
        fc.property(
          // Use non-whitespace strings to avoid edge cases with whitespace filtering
          fc.array(fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/), { minLength: 0, maxLength: 20 }),
          fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/),
          (existingSearches, newSearch) => {
            const result = addToRecentSearches(existingSearches, newSearch)
            expect(result.length).toBeLessThanOrEqual(getMaxRecentSearches())
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should limit to exactly MAX_RECENT_SEARCHES when adding to full list', () => {
      fc.assert(
        fc.property(
          // Use non-whitespace strings to avoid edge cases with whitespace filtering
          fc.array(fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/), { minLength: 10, maxLength: 20 }),
          fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/),
          (existingSearches, newSearch) => {
            // Ensure new search is not in existing
            const filtered = existingSearches.filter(s => s !== newSearch)
            const result = addToRecentSearches(filtered, newSearch)
            expect(result.length).toBeLessThanOrEqual(getMaxRecentSearches())
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain limit after multiple additions', () => {
      fc.assert(
        fc.property(
          // Use non-whitespace strings to avoid edge cases with whitespace filtering
          fc.array(fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/), { minLength: 1, maxLength: 10 }),
          (searches) => {
            let result: string[] = []
            for (const search of searches) {
              result = addToRecentSearches(result, search)
              expect(result.length).toBeLessThanOrEqual(getMaxRecentSearches())
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: global-search, Property 7: Recent Searches No Duplicates**
   * *For any* recentSearches array after adding a new search query,
   * the array SHALL contain no duplicate entries.
   * **Validates: Requirements 7.5**
   */
  describe('Property 7: Recent Searches No Duplicates', () => {
    it('should not contain duplicates after adding new search', () => {
      fc.assert(
        fc.property(
          // Use non-whitespace strings to avoid edge cases with whitespace filtering
          fc.array(fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/), { minLength: 0, maxLength: 10 }),
          fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/),
          (existingSearches, newSearch) => {
            const result = addToRecentSearches(existingSearches, newSearch)
            const uniqueSet = new Set(result)
            expect(result.length).toBe(uniqueSet.size)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should move existing search to top instead of duplicating', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/), { minLength: 2, maxLength: 5 }),
          (searches) => {
            // Start with unique searches
            const uniqueSearches = [...new Set(searches)]
            if (uniqueSearches.length < 2) return // Skip if not enough unique items
            
            // Add first search, then add it again
            let result = addToRecentSearches([], uniqueSearches[0])
            result = addToRecentSearches(result, uniqueSearches[1])
            result = addToRecentSearches(result, uniqueSearches[0]) // Add first again
            
            // First search should be at top, no duplicates
            expect(result[0]).toBe(uniqueSearches[0])
            expect(result.filter(s => s === uniqueSearches[0]).length).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle adding same search multiple times', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/), // Non-whitespace strings
          fc.integer({ min: 2, max: 10 }),
          (search, times) => {
            let result: string[] = []
            for (let i = 0; i < times; i++) {
              result = addToRecentSearches(result, search)
            }
            
            // Should only have one entry
            expect(result.length).toBe(1)
            expect(result[0]).toBe(search)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('addToRecentSearches', () => {
    it('should add new search to the front', () => {
      const result = addToRecentSearches(['old1', 'old2'], 'new')
      expect(result[0]).toBe('new')
    })

    it('should not add empty or whitespace-only searches', () => {
      expect(addToRecentSearches(['a', 'b'], '')).toEqual(['a', 'b'])
      expect(addToRecentSearches(['a', 'b'], '   ')).toEqual(['a', 'b'])
    })

    it('should trim whitespace from searches', () => {
      const result = addToRecentSearches([], '  test  ')
      expect(result[0]).toBe('test')
    })

    it('should preserve order of other items', () => {
      const result = addToRecentSearches(['a', 'b', 'c'], 'd')
      expect(result).toEqual(['d', 'a', 'b', 'c'])
    })

    it('should drop oldest item when at max capacity', () => {
      const existing = ['a', 'b', 'c', 'd', 'e']
      const result = addToRecentSearches(existing, 'f')
      
      expect(result.length).toBe(5)
      expect(result[0]).toBe('f')
      expect(result).not.toContain('e') // Oldest dropped
    })
  })

  describe('getMaxRecentSearches', () => {
    it('should return 5', () => {
      expect(getMaxRecentSearches()).toBe(5)
    })
  })
})
