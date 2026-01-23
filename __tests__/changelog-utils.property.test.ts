/**
 * Property-Based Tests for Changelog Utilities
 * Task 2.3: Write property tests for changelog utilities
 * 
 * Property 5: Entry Grouping - verify groupEntriesByMonth groups correctly
 * Property 8: Notification Dot Logic - verify hasNewEntries logic
 * 
 * Validates: Requirements 3.2, 6.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  groupEntriesByMonth,
  hasNewEntries,
  getCategoryBadgeColor,
  formatPublishedDate,
  CHANGELOG_LAST_VIEWED_KEY,
} from '@/lib/changelog-utils';
import type { ChangelogEntry, ChangelogCategory } from '@/types/changelog';

// Arbitrary for generating valid changelog categories
const categoryArb = fc.constantFrom<ChangelogCategory>('feature', 'improvement', 'bugfix', 'security');

// Generate a valid ISO date string directly
const isoDateStringArb = fc.integer({ min: 1704067200000, max: 1830297600000 }) // 2024-01-01 to 2028-01-01
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

// Arbitrary for generating a list of changelog entries
const changelogEntriesArb = fc.array(changelogEntryArb, { minLength: 0, maxLength: 50 });

describe('Feature: v0.82-changelog-feature, Property 5: Entry Grouping', () => {
  /**
   * **Validates: Requirements 3.2**
   * 
   * *For any* list of changelog entries, the groupEntriesByMonth function SHALL return
   * entries grouped such that all entries within a group have the same month and year
   * in their published_at timestamp.
   */
  it('should group all entries by their month and year', () => {
    fc.assert(
      fc.property(changelogEntriesArb, (entries) => {
        const grouped = groupEntriesByMonth(entries);
        
        // Every entry in a group should have the same month/year
        for (const group of grouped) {
          for (const entry of group.entries) {
            const entryDate = new Date(entry.published_at);
            const entryMonthYear = entryDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            });
            expect(entryMonthYear).toBe(group.monthYear);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all entries (no entries lost during grouping)', () => {
    fc.assert(
      fc.property(changelogEntriesArb, (entries) => {
        const grouped = groupEntriesByMonth(entries);
        
        // Count total entries in grouped result
        const totalGroupedEntries = grouped.reduce((sum, g) => sum + g.entries.length, 0);
        
        expect(totalGroupedEntries).toBe(entries.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty array for empty input', () => {
    const result = groupEntriesByMonth([]);
    expect(result).toEqual([]);
  });

  it('should return empty array for null/undefined input', () => {
    // @ts-expect-error Testing edge case
    expect(groupEntriesByMonth(null)).toEqual([]);
    // @ts-expect-error Testing edge case
    expect(groupEntriesByMonth(undefined)).toEqual([]);
  });
});

describe('Feature: v0.82-changelog-feature, Property 8: Notification Dot Logic', () => {
  /**
   * **Validates: Requirements 6.2**
   * 
   * *For any* user with a last_viewed timestamp, if there exists at least one changelog
   * entry with published_at greater than last_viewed, then hasNewEntries SHALL return true;
   * otherwise it SHALL return false.
   */
  it('should return true when any entry is newer than lastViewed', () => {
    fc.assert(
      fc.property(
        changelogEntriesArb.filter(e => e.length > 0),
        isoDateStringArb,
        (entries, lastViewed) => {
          const result = hasNewEntries(entries, lastViewed);
          const lastViewedDate = new Date(lastViewed);
          
          // Calculate expected result
          const hasNewer = entries.some(entry => {
            const entryDate = new Date(entry.published_at);
            return entryDate > lastViewedDate;
          });
          
          expect(result).toBe(hasNewer);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return true when lastViewed is null (never viewed)', () => {
    fc.assert(
      fc.property(
        changelogEntriesArb.filter(e => e.length > 0),
        (entries) => {
          const result = hasNewEntries(entries, null);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false for empty entries array', () => {
    fc.assert(
      fc.property(
        fc.option(isoDateStringArb, { nil: null }),
        (lastViewed) => {
          const result = hasNewEntries([], lastViewed);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false when all entries are older than lastViewed', () => {
    // Create entries that are all before a specific date
    const oldEntriesArb = fc.array(
      changelogEntryArb.map(entry => ({
        ...entry,
        published_at: new Date('2024-01-01').toISOString(),
      })),
      { minLength: 1, maxLength: 10 }
    );

    fc.assert(
      fc.property(oldEntriesArb, (entries) => {
        // Last viewed is after all entries
        const lastViewed = new Date('2025-01-01').toISOString();
        const result = hasNewEntries(entries, lastViewed);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('getCategoryBadgeColor', () => {
  it('should return correct color classes for all valid categories', () => {
    fc.assert(
      fc.property(categoryArb, (category) => {
        const color = getCategoryBadgeColor(category);
        
        // Should return a non-empty string
        expect(color).toBeTruthy();
        expect(typeof color).toBe('string');
        
        // Should contain expected color based on category
        switch (category) {
          case 'feature':
            expect(color).toContain('blue');
            break;
          case 'bugfix':
            expect(color).toContain('red');
            break;
          case 'improvement':
            expect(color).toContain('green');
            break;
          case 'security':
            expect(color).toContain('yellow');
            break;
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('formatPublishedDate', () => {
  it('should format dates consistently', () => {
    fc.assert(
      fc.property(isoDateStringArb, (dateStr) => {
        const formatted = formatPublishedDate(dateStr);
        const date = new Date(dateStr);
        
        // Should return a non-empty string
        expect(formatted).toBeTruthy();
        expect(typeof formatted).toBe('string');
        
        // Should contain year
        expect(formatted).toContain(date.getFullYear().toString());
      }),
      { numRuns: 100 }
    );
  });
});

describe('CHANGELOG_LAST_VIEWED_KEY', () => {
  it('should be a valid localStorage key', () => {
    expect(CHANGELOG_LAST_VIEWED_KEY).toBe('gama_changelog_last_viewed');
    expect(typeof CHANGELOG_LAST_VIEWED_KEY).toBe('string');
    expect(CHANGELOG_LAST_VIEWED_KEY.length).toBeGreaterThan(0);
  });
});
