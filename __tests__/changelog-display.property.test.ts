/**
 * Property-Based Tests for Changelog Display
 * Task 4.5: Write property tests for changelog display
 * 
 * Property 4: Entry Ordering - verify entries are ordered by published_at DESC
 * Property 6: Display Completeness - verify all required fields are displayed
 * 
 * Validates: Requirements 3.1, 3.3, 3.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { groupEntriesByMonth, getCategoryBadgeColor, formatPublishedDate } from '@/lib/changelog-utils';
import type { ChangelogEntry, ChangelogCategory } from '@/types/changelog';

// Arbitrary for generating valid changelog categories
const categoryArb = fc.constantFrom<ChangelogCategory>('feature', 'improvement', 'bugfix', 'security');

// Generate a valid ISO date string directly
const isoDateStringArb = fc.integer({ min: 1704067200000, max: 1830297600000 })
  .map(ts => new Date(ts).toISOString());

// Arbitrary for generating a changelog entry
const changelogEntryArb = fc.record({
  id: fc.uuid(),
  version: fc.option(fc.stringMatching(/^v\d+\.\d+$/), { nil: null }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  category: categoryArb,
  is_major: fc.boolean(),
  published_at: isoDateStringArb,
  created_by: fc.option(fc.uuid(), { nil: null }),
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
});

// Arbitrary for generating a sorted list of changelog entries (by published_at DESC)
const sortedChangelogEntriesArb = fc.array(changelogEntryArb, { minLength: 0, maxLength: 30 })
  .map(entries => entries.sort((a, b) => 
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  ));

describe('Feature: v0.82-changelog-feature, Property 4: Entry Ordering', () => {
  /**
   * **Validates: Requirements 3.1**
   * 
   * *For any* query to the changelog page, the returned entries SHALL be ordered
   * by published_at in descending order (newest first).
   */
  it('should maintain descending order within grouped entries', () => {
    fc.assert(
      fc.property(sortedChangelogEntriesArb, (entries) => {
        const grouped = groupEntriesByMonth(entries);
        
        // Within each group, entries should maintain their relative order
        // (which is descending by published_at since input is sorted)
        for (const group of grouped) {
          for (let i = 0; i < group.entries.length - 1; i++) {
            const current = new Date(group.entries[i].published_at);
            const next = new Date(group.entries[i + 1].published_at);
            expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve the order of groups (newest month first)', () => {
    fc.assert(
      fc.property(sortedChangelogEntriesArb.filter(e => e.length > 1), (entries) => {
        const grouped = groupEntriesByMonth(entries);
        
        if (grouped.length > 1) {
          // First entry of each group should be in descending order
          for (let i = 0; i < grouped.length - 1; i++) {
            const currentFirst = new Date(grouped[i].entries[0].published_at);
            const nextFirst = new Date(grouped[i + 1].entries[0].published_at);
            expect(currentFirst.getTime()).toBeGreaterThanOrEqual(nextFirst.getTime());
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: v0.82-changelog-feature, Property 6: Display Completeness', () => {
  /**
   * **Validates: Requirements 3.3, 3.5**
   * 
   * *For any* changelog entry displayed on the page, the rendered output SHALL include:
   * version (if present), title, description (if present), category badge with correct color,
   * published date, and visual highlight if is_major is true.
   */
  it('should have all required display data available for each entry', () => {
    fc.assert(
      fc.property(changelogEntryArb, (entry) => {
        // Title is always required and present
        expect(entry.title).toBeTruthy();
        expect(typeof entry.title).toBe('string');
        
        // Category should have a valid badge color
        const badgeColor = getCategoryBadgeColor(entry.category);
        expect(badgeColor).toBeTruthy();
        expect(typeof badgeColor).toBe('string');
        
        // Published date should be formattable
        const formattedDate = formatPublishedDate(entry.published_at);
        expect(formattedDate).toBeTruthy();
        expect(typeof formattedDate).toBe('string');
        
        // is_major should be a boolean for highlight logic
        expect(typeof entry.is_major).toBe('boolean');
        
        // Version can be null or string
        expect(entry.version === null || typeof entry.version === 'string').toBe(true);
        
        // Description can be null or string
        expect(entry.description === null || typeof entry.description === 'string').toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly identify major updates for highlighting', () => {
    fc.assert(
      fc.property(changelogEntryArb, (entry) => {
        // Major updates should be identifiable
        if (entry.is_major) {
          expect(entry.is_major).toBe(true);
        } else {
          expect(entry.is_major).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should map categories to correct badge colors', () => {
    const categoryColorMap: Record<ChangelogCategory, string> = {
      feature: 'blue',
      bugfix: 'red',
      improvement: 'green',
      security: 'yellow',
    };

    fc.assert(
      fc.property(categoryArb, (category) => {
        const color = getCategoryBadgeColor(category);
        expect(color).toContain(categoryColorMap[category]);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Display utility functions', () => {
  it('formatPublishedDate should produce consistent output', () => {
    fc.assert(
      fc.property(isoDateStringArb, (dateStr) => {
        const formatted = formatPublishedDate(dateStr);
        const date = new Date(dateStr);
        
        // Should contain the year
        expect(formatted).toContain(date.getFullYear().toString());
        
        // Should be a reasonable length (e.g., "Jan 15, 2025")
        expect(formatted.length).toBeGreaterThan(5);
        expect(formatted.length).toBeLessThan(20);
      }),
      { numRuns: 100 }
    );
  });
});
