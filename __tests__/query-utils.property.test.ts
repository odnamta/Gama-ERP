/**
 * Property-based tests for query optimization utilities
 * Feature: v0.78-performance-optimization
 * Tests Properties 4-8 from the design document
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isEmptyFilterValue,
  filterEmptyFilters,
  eq,
  neq,
  gt,
  gte,
  lt,
  lte,
  inArray,
  isNull,
  paginate,
  sortBy,
  searchIn,
  QueryFilter,
  FilterOperator,
  SortOrder,
} from '@/lib/query-utils';

// Arbitraries for property tests
const filterOperatorArb = fc.constantFrom<FilterOperator>('eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'is');
const sortOrderArb = fc.constantFrom<SortOrder>('asc', 'desc');
const fieldNameArb = fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s));

describe('Query Utils Property Tests', () => {
  describe('Property 4: Query Optimizer Filtering', () => {
    /**
     * Property: Filter helpers create correct filter objects
     * Validates: Requirement 7.1
     */
    it('should create correct filter objects with eq helper', () => {
      fc.assert(
        fc.property(
          fieldNameArb,
          fc.anything(),
          (field, value) => {
            const filter = eq(field, value);
            expect(filter.field).toBe(field);
            expect(filter.operator).toBe('eq');
            expect(filter.value).toBe(value);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create correct filter objects with neq helper', () => {
      fc.assert(
        fc.property(
          fieldNameArb,
          fc.anything(),
          (field, value) => {
            const filter = neq(field, value);
            expect(filter.field).toBe(field);
            expect(filter.operator).toBe('neq');
            expect(filter.value).toBe(value);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create correct filter objects with comparison helpers', () => {
      fc.assert(
        fc.property(
          fieldNameArb,
          fc.integer(),
          (field, value) => {
            const gtFilter = gt(field, value);
            const gteFilter = gte(field, value);
            const ltFilter = lt(field, value);
            const lteFilter = lte(field, value);

            expect(gtFilter.operator).toBe('gt');
            expect(gteFilter.operator).toBe('gte');
            expect(ltFilter.operator).toBe('lt');
            expect(lteFilter.operator).toBe('lte');

            // All should have same field and value
            [gtFilter, gteFilter, ltFilter, lteFilter].forEach(f => {
              expect(f.field).toBe(field);
              expect(f.value).toBe(value);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create correct filter objects with inArray helper', () => {
      fc.assert(
        fc.property(
          fieldNameArb,
          fc.array(fc.anything(), { minLength: 0, maxLength: 10 }),
          (field, values) => {
            const filter = inArray(field, values);
            expect(filter.field).toBe(field);
            expect(filter.operator).toBe('in');
            expect(filter.value).toEqual(values);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create correct filter objects with isNull helper', () => {
      fc.assert(
        fc.property(
          fieldNameArb,
          (field) => {
            const filter = isNull(field);
            expect(filter.field).toBe(field);
            expect(filter.operator).toBe('is');
            expect(filter.value).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Query Optimizer Search', () => {
    /**
     * Property: Search helper creates correct search options
     * Validates: Requirement 7.2
     */
    it('should create correct search options', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          fc.array(fieldNameArb, { minLength: 0, maxLength: 5 }),
          (term, fields) => {
            const search = searchIn(term, fields);
            expect(search.term).toBe(term);
            expect(search.fields).toEqual(fields);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty search term', () => {
      fc.assert(
        fc.property(
          fc.array(fieldNameArb, { minLength: 1, maxLength: 5 }),
          (fields) => {
            const search = searchIn('', fields);
            expect(search.term).toBe('');
            expect(search.fields).toEqual(fields);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty fields array', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (term) => {
            const search = searchIn(term, []);
            expect(search.term).toBe(term);
            expect(search.fields).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Query Optimizer Pagination', () => {
    /**
     * Property: Pagination helper creates valid pagination options
     * Validates: Requirements 7.3, 7.5
     */
    it('should create valid pagination with positive page numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (page, limit) => {
            const pagination = paginate(page, limit);
            expect(pagination.page).toBe(page);
            expect(pagination.limit).toBe(limit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should normalize page to minimum of 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 0 }),
          fc.integer({ min: 1, max: 100 }),
          (page, limit) => {
            const pagination = paginate(page, limit);
            expect(pagination.page).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should normalize limit to minimum of 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: -100, max: 0 }),
          (page, limit) => {
            const pagination = paginate(page, limit);
            expect(pagination.limit).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cap limit at 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 101, max: 1000 }),
          (page, limit) => {
            const pagination = paginate(page, limit);
            expect(pagination.limit).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default limit of 20 when not specified', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (page) => {
            const pagination = paginate(page);
            expect(pagination.limit).toBe(20);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Query Optimizer Sorting', () => {
    /**
     * Property: Sort helper creates correct sort options
     * Validates: Requirement 7.4
     */
    it('should create correct sort options with specified order', () => {
      fc.assert(
        fc.property(
          fieldNameArb,
          sortOrderArb,
          (field, order) => {
            const sort = sortBy(field, order);
            expect(sort.field).toBe(field);
            expect(sort.order).toBe(order);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default to ascending order', () => {
      fc.assert(
        fc.property(
          fieldNameArb,
          (field) => {
            const sort = sortBy(field);
            expect(sort.field).toBe(field);
            expect(sort.order).toBe('asc');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Query Optimizer Empty Filter Handling', () => {
    /**
     * Property: Empty filter values are correctly identified
     * Validates: Requirement 7.6
     */
    it('should identify null as empty', () => {
      expect(isEmptyFilterValue(null)).toBe(true);
    });

    it('should identify undefined as empty', () => {
      expect(isEmptyFilterValue(undefined)).toBe(true);
    });

    it('should identify empty string as empty', () => {
      fc.assert(
        fc.property(
          fc.constant(''),
          (value) => {
            expect(isEmptyFilterValue(value)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify whitespace-only string as empty', () => {
      fc.assert(
        fc.property(
          fc.constant('   '),
          (value) => {
            expect(isEmptyFilterValue(value)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify empty array as empty', () => {
      expect(isEmptyFilterValue([])).toBe(true);
    });

    it('should identify non-empty values as not empty', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
            fc.integer(),
            fc.boolean(),
            fc.array(fc.anything(), { minLength: 1 })
          ),
          (value) => {
            expect(isEmptyFilterValue(value)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: filterEmptyFilters removes filters with empty values
     * Validates: Requirement 7.6
     */
    it('should remove filters with empty values', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              field: fieldNameArb,
              operator: filterOperatorArb,
              value: fc.oneof(
                fc.constant(null),
                fc.constant(undefined),
                fc.constant(''),
                fc.constant([]),
                fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
                fc.integer()
              ),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (filters) => {
            const validFilters = filterEmptyFilters(filters as QueryFilter[]);
            
            // All returned filters should have non-empty values
            validFilters.forEach(f => {
              expect(isEmptyFilterValue(f.value)).toBe(false);
            });

            // Count should match filters with non-empty values
            const expectedCount = filters.filter(f => !isEmptyFilterValue(f.value)).length;
            expect(validFilters.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve filters with valid values', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              field: fieldNameArb,
              operator: filterOperatorArb,
              value: fc.oneof(
                fc.string({ minLength: 1 }).filter(s => s.trim() !== ''),
                fc.integer(),
                fc.boolean()
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (filters) => {
            const validFilters = filterEmptyFilters(filters as QueryFilter[]);
            
            // All filters should be preserved
            expect(validFilters.length).toBe(filters.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
