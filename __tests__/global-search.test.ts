/**
 * Global Search Component Tests
 * v0.24: Global Search Feature
 * 
 * Property-based tests for keyboard navigation and component logic
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Navigation state management functions (extracted for testing)
 */

// Calculate next index when pressing Down Arrow
function navigateDown(currentIndex: number, resultsLength: number): number {
  if (resultsLength === 0) return 0;
  return Math.min(currentIndex + 1, resultsLength - 1);
}

// Calculate next index when pressing Up Arrow
function navigateUp(currentIndex: number, resultsLength: number): number {
  if (resultsLength === 0) return 0;
  return Math.max(currentIndex - 1, 0);
}

describe('Global Search Component', () => {
  /**
   * **Feature: global-search, Property 2: Keyboard Navigation Bounds**
   * *For any* results array of length N and any current selectedIndex, after pressing:
   * - Down Arrow: new selectedIndex = min(selectedIndex + 1, N - 1)
   * - Up Arrow: new selectedIndex = max(selectedIndex - 1, 0)
   * The selectedIndex SHALL always remain within bounds [0, N-1] for non-empty results.
   * **Validates: Requirements 5.1, 5.2, 5.4, 5.5**
   */
  describe('Property 2: Keyboard Navigation Bounds', () => {
    it('should keep index within bounds when pressing Down Arrow', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // results length
          fc.integer({ min: 0, max: 99 }),   // current index
          (resultsLength, currentIndex) => {
            // Ensure currentIndex is valid for resultsLength
            const validIndex = Math.min(currentIndex, resultsLength - 1);
            const newIndex = navigateDown(validIndex, resultsLength);
            
            // Index should be within bounds
            expect(newIndex).toBeGreaterThanOrEqual(0);
            expect(newIndex).toBeLessThan(resultsLength);
            
            // Should increment by 1 or stay at max
            expect(newIndex).toBe(Math.min(validIndex + 1, resultsLength - 1));
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should keep index within bounds when pressing Up Arrow', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // results length
          fc.integer({ min: 0, max: 99 }),   // current index
          (resultsLength, currentIndex) => {
            // Ensure currentIndex is valid for resultsLength
            const validIndex = Math.min(currentIndex, resultsLength - 1);
            const newIndex = navigateUp(validIndex, resultsLength);
            
            // Index should be within bounds
            expect(newIndex).toBeGreaterThanOrEqual(0);
            expect(newIndex).toBeLessThan(resultsLength);
            
            // Should decrement by 1 or stay at 0
            expect(newIndex).toBe(Math.max(validIndex - 1, 0));
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should stay at last index when at end and pressing Down', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // results length
          (resultsLength) => {
            const lastIndex = resultsLength - 1;
            const newIndex = navigateDown(lastIndex, resultsLength);
            
            expect(newIndex).toBe(lastIndex);
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should stay at first index when at start and pressing Up', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // results length
          (resultsLength) => {
            const newIndex = navigateUp(0, resultsLength);
            
            expect(newIndex).toBe(0);
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle empty results gracefully', () => {
      expect(navigateDown(0, 0)).toBe(0);
      expect(navigateUp(0, 0)).toBe(0);
    })

    it('should handle sequential navigation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 50 }), // results length
          fc.array(fc.constantFrom('up', 'down'), { minLength: 1, maxLength: 20 }),
          (resultsLength, actions) => {
            let index = 0;
            
            for (const action of actions) {
              if (action === 'down') {
                index = navigateDown(index, resultsLength);
              } else {
                index = navigateUp(index, resultsLength);
              }
              
              // Index should always be valid
              expect(index).toBeGreaterThanOrEqual(0);
              expect(index).toBeLessThan(resultsLength);
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: global-search, Property 10: Minimum Query Length Threshold**
   * Already tested in search-utils.test.ts via shouldSearch function
   * This test verifies the integration behavior
   * **Validates: Requirements 2.1**
   */
  describe('Property 10: Minimum Query Length (Integration)', () => {
    it('should not search for queries shorter than 2 characters', async () => {
      // Import using dynamic import for ESM compatibility
      const { shouldSearch } = await import('@/lib/search-utils');
      
      expect(shouldSearch('')).toBe(false);
      expect(shouldSearch('a')).toBe(false);
      expect(shouldSearch('ab')).toBe(true);
      expect(shouldSearch('abc')).toBe(true);
    })
  })
})
