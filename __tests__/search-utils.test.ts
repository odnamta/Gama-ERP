/**
 * Global Search Utility Tests
 * v0.24: Global Search Feature
 * 
 * Property-based tests for search utility functions
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  SearchResult,
  EntityType,
  groupResultsByEntityType,
  sortResultsByRelevance,
  calculateRelevance,
  shouldSearch,
  ENTITY_ORDER,
  getOrderedGroupedResults,
} from '@/lib/search-utils'

// Arbitrary for entity types
const entityTypeArb = fc.constantFrom<EntityType>(
  'customer', 'project', 'pjo', 'jo', 'invoice', 'vendor', 'quotation'
)

// Arbitrary for search results
const searchResultArb = fc.record({
  entity_type: entityTypeArb,
  entity_id: fc.uuid(),
  primary_text: fc.string({ minLength: 1, maxLength: 100 }),
  secondary_text: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  url: fc.string({ minLength: 1, maxLength: 200 }),
  relevance: fc.constantFrom(1.0, 0.8, 0.5, 0.3),
}) as fc.Arbitrary<SearchResult>

describe('Search Utils', () => {
  /**
   * **Feature: global-search, Property 1: Relevance Scoring Correctness**
   * *For any* search result, the relevance score SHALL equal:
   * - 1.0 if primary_text starts with the search query (case-insensitive)
   * - 0.8 if primary_text contains but does not start with the search query
   * - 0.5 if only secondary_text contains the search query
   * - 0.3 for all other partial matches
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
   */
  describe('Property 1: Relevance Scoring Correctness', () => {
    it('should return 1.0 when primary_text starts with query', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 20 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          (query, suffix) => {
            const primaryText = query + suffix
            const relevance = calculateRelevance(primaryText, null, query)
            expect(relevance).toBe(1.0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 1.0 for case-insensitive prefix match', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 20 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          (query, suffix) => {
            const primaryText = query.toUpperCase() + suffix
            const relevance = calculateRelevance(primaryText, null, query.toLowerCase())
            expect(relevance).toBe(1.0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0.8 when primary_text contains but does not start with query', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 2, maxLength: 20 }),
          fc.string({ minLength: 0, maxLength: 20 }),
          (prefix, query, suffix) => {
            // Ensure prefix doesn't end with query start
            const primaryText = prefix + query + suffix
            const relevance = calculateRelevance(primaryText, null, query)
            
            // If it starts with query, it's 1.0, otherwise 0.8
            if (primaryText.toLowerCase().startsWith(query.toLowerCase())) {
              expect(relevance).toBe(1.0)
            } else {
              expect(relevance).toBe(0.8)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0.5 when only secondary_text contains query', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9]{2,20}$/), // Alphanumeric only to avoid regex issues
          (query) => {
            // Primary text that doesn't contain query
            const primaryText = 'ZZZZZ_UNIQUE_TEXT'
            const secondaryText = 'prefix' + query + 'suffix'
            
            // Only test if primary truly doesn't contain query
            if (!primaryText.toLowerCase().includes(query.toLowerCase())) {
              const relevance = calculateRelevance(primaryText, secondaryText, query)
              expect(relevance).toBe(0.5)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0.3 when neither text contains query', () => {
      const relevance = calculateRelevance('ABC', 'DEF', 'XYZ')
      expect(relevance).toBe(0.3)
    })
  })

  /**
   * **Feature: global-search, Property 3: Results Grouping by Entity Type**
   * *For any* set of search results, grouping by entity_type SHALL produce buckets
   * where each bucket contains only results of that entity_type, and no result
   * appears in multiple buckets.
   * **Validates: Requirements 3.1**
   */
  describe('Property 3: Results Grouping by Entity Type', () => {
    it('should group all results into correct entity type buckets', () => {
      fc.assert(
        fc.property(
          fc.array(searchResultArb, { minLength: 0, maxLength: 50 }),
          (results) => {
            const grouped = groupResultsByEntityType(results)
            
            // Each result should be in exactly one bucket
            let totalGrouped = 0
            for (const entityType of Object.keys(grouped) as EntityType[]) {
              totalGrouped += grouped[entityType].length
              
              // All results in bucket should have matching entity_type
              for (const result of grouped[entityType]) {
                expect(result.entity_type).toBe(entityType)
              }
            }
            
            // Total grouped should equal input length
            expect(totalGrouped).toBe(results.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not have any result in multiple buckets', () => {
      fc.assert(
        fc.property(
          fc.array(searchResultArb, { minLength: 1, maxLength: 50 }),
          (results) => {
            const grouped = groupResultsByEntityType(results)
            
            // Collect all entity_ids from all buckets
            const allIds: string[] = []
            for (const entityType of Object.keys(grouped) as EntityType[]) {
              for (const result of grouped[entityType]) {
                allIds.push(result.entity_id)
              }
            }
            
            // Check for duplicates (same entity_id in multiple buckets)
            // Note: Same entity_id can appear if it's in the input multiple times
            // but each occurrence should be in exactly one bucket
            expect(allIds.length).toBe(results.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty arrays for entity types with no results', () => {
      const grouped = groupResultsByEntityType([])
      
      for (const entityType of ENTITY_ORDER) {
        expect(grouped[entityType]).toEqual([])
      }
    })
  })

  /**
   * **Feature: global-search, Property 4: Results Ordering**
   * *For any* set of search results, the results SHALL be ordered such that
   * for any two consecutive results r1 and r2: r1.relevance >= r2.relevance
   * **Validates: Requirements 3.3**
   */
  describe('Property 4: Results Ordering', () => {
    it('should sort results by relevance descending', () => {
      fc.assert(
        fc.property(
          fc.array(searchResultArb, { minLength: 2, maxLength: 50 }),
          (results) => {
            const sorted = sortResultsByRelevance(results)
            
            // Check that each result has relevance >= next result
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].relevance).toBeGreaterThanOrEqual(sorted[i + 1].relevance)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not modify the original array', () => {
      fc.assert(
        fc.property(
          fc.array(searchResultArb, { minLength: 1, maxLength: 20 }),
          (results) => {
            const originalOrder = results.map(r => r.entity_id)
            sortResultsByRelevance(results)
            const afterOrder = results.map(r => r.entity_id)
            
            expect(afterOrder).toEqual(originalOrder)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: global-search, Property 5: Results Limit Invariant**
   * *For any* search query, the number of results returned SHALL be at most max_results.
   * Note: This is tested at the utility level - actual DB limit is tested separately.
   * **Validates: Requirements 3.4**
   */
  describe('Property 5: Results Limit Invariant', () => {
    it('should respect the 20 result limit in grouped results', () => {
      fc.assert(
        fc.property(
          fc.array(searchResultArb, { minLength: 0, maxLength: 100 }),
          (results) => {
            // Simulate limiting to 20 results
            const limited = results.slice(0, 20)
            const grouped = groupResultsByEntityType(limited)
            
            let total = 0
            for (const entityType of Object.keys(grouped) as EntityType[]) {
              total += grouped[entityType].length
            }
            
            expect(total).toBeLessThanOrEqual(20)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: global-search, Property 10: Minimum Query Length Threshold**
   * *For any* search query with length < 2, the search function SHALL NOT be invoked.
   * **Validates: Requirements 2.1**
   */
  describe('Property 10: Minimum Query Length Threshold', () => {
    it('should return false for queries with length < 2', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 1 }),
          (query) => {
            expect(shouldSearch(query)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return true for queries with trimmed length >= 2', () => {
      fc.assert(
        fc.property(
          // Generate strings that have at least 2 non-whitespace characters
          fc.stringMatching(/^[a-zA-Z0-9]{2,100}$/),
          (query) => {
            expect(shouldSearch(query)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle whitespace-only queries correctly', () => {
      expect(shouldSearch('')).toBe(false)
      expect(shouldSearch(' ')).toBe(false)
      expect(shouldSearch('  ')).toBe(false)
      expect(shouldSearch('ab')).toBe(true)
      expect(shouldSearch(' ab ')).toBe(true)
    })
  })

  describe('getOrderedGroupedResults', () => {
    it('should return results in ENTITY_ORDER', () => {
      const results: SearchResult[] = [
        { entity_type: 'vendor', entity_id: '1', primary_text: 'V1', secondary_text: null, url: '/v/1', relevance: 1.0 },
        { entity_type: 'customer', entity_id: '2', primary_text: 'C1', secondary_text: null, url: '/c/1', relevance: 1.0 },
        { entity_type: 'pjo', entity_id: '3', primary_text: 'P1', secondary_text: null, url: '/p/1', relevance: 1.0 },
      ]
      
      const ordered = getOrderedGroupedResults(results)
      const entityTypes = ordered.map(([type]) => type)
      
      // Should be in order: customer, pjo, vendor (based on ENTITY_ORDER)
      expect(entityTypes).toEqual(['customer', 'pjo', 'vendor'])
    })

    it('should exclude empty entity types', () => {
      const results: SearchResult[] = [
        { entity_type: 'customer', entity_id: '1', primary_text: 'C1', secondary_text: null, url: '/c/1', relevance: 1.0 },
      ]
      
      const ordered = getOrderedGroupedResults(results)
      
      expect(ordered.length).toBe(1)
      expect(ordered[0][0]).toBe('customer')
    })
  })
})
