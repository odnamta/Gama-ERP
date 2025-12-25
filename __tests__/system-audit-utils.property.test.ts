/**
 * Property-based tests for system-audit-utils.ts
 * Feature: system-audit-logging
 * 
 * Uses fast-check for property-based testing with minimum 100 iterations
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateChangedFields,
  getChangedFieldDetails,
  filterAuditLogs,
  sortAuditLogs,
  paginateAuditLogs,
  formatAuditLogDescription,
  formatAction,
  formatModule,
  countByAction,
  countByModule,
  countByEntityType,
  getUniqueUsers,
  calculateFailureRate,
  getEntityAuditHistory,
} from '@/lib/system-audit-utils';
import {
  AuditLogEntry,
  AuditLogFilters,
  AuditAction,
  AuditStatus,
} from '@/types/audit';

// =====================================================
// Generators
// =====================================================

const auditActionGenerator = fc.constantFrom<AuditAction>(
  'create',
  'update',
  'delete',
  'view',
  'export',
  'approve',
  'reject',
  'submit',
  'cancel',
  'INSERT',
  'UPDATE',
  'DELETE'
);

const auditStatusGenerator = fc.constantFrom<AuditStatus>(
  'success',
  'failure',
  'pending'
);

const moduleGenerator = fc.constantFrom(
  'customers',
  'projects',
  'quotations',
  'pjo',
  'job_orders',
  'invoices',
  'employees',
  'vendors',
  'equipment',
  'settings',
  'users',
  'public'
);

const entityTypeGenerator = fc.constantFrom(
  'customer',
  'project',
  'quotation',
  'pjo',
  'job_order',
  'invoice',
  'employee',
  'vendor',
  'asset'
);

// Safe timestamp generator
const safeTimestampGenerator = fc.integer({ min: 0, max: 3650 }).map((daysFromBase) => {
  const baseDate = new Date('2020-01-01');
  baseDate.setDate(baseDate.getDate() + daysFromBase);
  return baseDate.toISOString();
});

// Safe date string generator
const safeDateStringGenerator = fc.integer({ min: 0, max: 3650 }).map((daysFromBase) => {
  const baseDate = new Date('2020-01-01');
  baseDate.setDate(baseDate.getDate() + daysFromBase);
  return baseDate.toISOString().split('T')[0];
});

// JSON value generator (for old_values/new_values)
const jsonValueGenerator: fc.Arbitrary<unknown> = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.double({ noNaN: true }),
  fc.boolean(),
  fc.constant(null)
);

// Simple object generator for old/new values
const simpleObjectGenerator = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
  jsonValueGenerator,
  { minKeys: 0, maxKeys: 10 }
);

// Audit log entry generator
const auditLogEntryGenerator = (overrides: Partial<AuditLogEntry> = {}): fc.Arbitrary<AuditLogEntry> =>
  fc.record({
    id: fc.uuid(),
    timestamp: safeTimestampGenerator,
    user_id: fc.option(fc.uuid(), { nil: null }),
    user_email: fc.option(fc.emailAddress(), { nil: null }),
    user_role: fc.option(fc.constantFrom('admin', 'manager', 'ops', 'finance', 'sales'), { nil: null }),
    action: auditActionGenerator,
    module: moduleGenerator,
    entity_type: entityTypeGenerator,
    entity_id: fc.option(fc.uuid(), { nil: null }),
    entity_reference: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    old_values: fc.option(simpleObjectGenerator as fc.Arbitrary<Record<string, unknown>>, { nil: null }),
    new_values: fc.option(simpleObjectGenerator as fc.Arbitrary<Record<string, unknown>>, { nil: null }),
    changed_fields: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 10 }), { nil: null }),
    ip_address: fc.option(fc.ipV4(), { nil: null }),
    user_agent: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    session_id: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    request_method: fc.option(fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'), { nil: null }),
    request_path: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    status: fc.option(auditStatusGenerator, { nil: null }),
    error_message: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    metadata: fc.constant({}),
  }).map((entry) => ({ ...entry, ...overrides }));

// =====================================================
// Property 2: Changed Fields Calculation Correctness
// =====================================================

describe('Property 2: Changed Fields Calculation Correctness', () => {
  /**
   * Feature: system-audit-logging, Property 2: Changed Fields Calculation Correctness
   * For any two JSON objects representing old and new values, the calculated 
   * changed_fields array SHALL contain exactly the keys where the values differ 
   * between the two objects, and SHALL not contain any keys where values are identical.
   * Validates: Requirements 1.3
   */

  it('should return empty array when both objects are null', () => {
    fc.assert(
      fc.property(fc.constant(null), fc.constant(null), (oldVal, newVal) => {
        const result = calculateChangedFields(oldVal, newVal);
        expect(result).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });

  it('should return all keys from newValues when oldValues is null', () => {
    fc.assert(
      fc.property(simpleObjectGenerator, (newValues) => {
        const result = calculateChangedFields(null, newValues);
        // Result is sorted, so we need to sort expected keys too
        const expectedKeys = Object.keys(newValues).sort();
        // Both should be sorted arrays with same elements
        expect(result.sort()).toEqual(expectedKeys.sort());
      }),
      { numRuns: 100 }
    );
  });

  it('should return all keys from oldValues when newValues is null', () => {
    fc.assert(
      fc.property(simpleObjectGenerator, (oldValues) => {
        const result = calculateChangedFields(oldValues, null);
        // Result is sorted, so we need to sort expected keys too
        const expectedKeys = Object.keys(oldValues).sort();
        // Both should be sorted arrays with same elements
        expect(result.sort()).toEqual(expectedKeys.sort());
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty array when objects are identical', () => {
    fc.assert(
      fc.property(simpleObjectGenerator, (obj) => {
        // Create a deep copy
        const copy = JSON.parse(JSON.stringify(obj));
        const result = calculateChangedFields(obj, copy);
        expect(result).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect all changed fields correctly', () => {
    fc.assert(
      fc.property(
        simpleObjectGenerator,
        simpleObjectGenerator,
        (oldValues, newValues) => {
          const result = calculateChangedFields(oldValues, newValues);
          
          // Verify each returned field actually differs
          for (const field of result) {
            const oldVal = oldValues[field];
            const newVal = newValues[field];
            // At least one should be different (either value differs or key exists in only one)
            const oldHas = field in oldValues;
            const newHas = field in newValues;
            
            if (oldHas && newHas) {
              // Both have the field - values must differ
              expect(JSON.stringify(oldVal)).not.toBe(JSON.stringify(newVal));
            } else {
              // Field exists in only one object
              expect(oldHas !== newHas).toBe(true);
            }
          }
          
          // Verify no unchanged fields are included
          const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
          for (const key of allKeys) {
            if (!result.includes(key)) {
              // This key should have identical values in both
              const oldVal = oldValues[key];
              const newVal = newValues[key];
              expect(JSON.stringify(oldVal)).toBe(JSON.stringify(newVal));
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return sorted array of changed fields', () => {
    fc.assert(
      fc.property(
        simpleObjectGenerator,
        simpleObjectGenerator,
        (oldValues, newValues) => {
          const result = calculateChangedFields(oldValues, newValues);
          const sorted = [...result].sort();
          expect(result).toEqual(sorted);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle nested objects correctly', () => {
    const nestedObjGenerator = fc.record({
      name: fc.string(),
      nested: fc.record({
        value: fc.integer(),
        flag: fc.boolean(),
      }),
    });

    fc.assert(
      fc.property(nestedObjGenerator, nestedObjGenerator, (oldObj, newObj) => {
        const result = calculateChangedFields(
          oldObj as unknown as Record<string, unknown>,
          newObj as unknown as Record<string, unknown>
        );
        
        // Result should be an array
        expect(Array.isArray(result)).toBe(true);
        
        // Each changed field should actually differ
        for (const field of result) {
          const oldVal = (oldObj as Record<string, unknown>)[field];
          const newVal = (newObj as Record<string, unknown>)[field];
          expect(JSON.stringify(oldVal)).not.toBe(JSON.stringify(newVal));
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle arrays correctly', () => {
    const arrayObjGenerator = fc.record({
      items: fc.array(fc.integer(), { minLength: 0, maxLength: 5 }),
      tags: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
    });

    fc.assert(
      fc.property(arrayObjGenerator, arrayObjGenerator, (oldObj, newObj) => {
        const result = calculateChangedFields(
          oldObj as unknown as Record<string, unknown>,
          newObj as unknown as Record<string, unknown>
        );
        
        // Result should be an array
        expect(Array.isArray(result)).toBe(true);
        
        // Verify correctness
        if (JSON.stringify(oldObj.items) !== JSON.stringify(newObj.items)) {
          expect(result).toContain('items');
        }
        if (JSON.stringify(oldObj.tags) !== JSON.stringify(newObj.tags)) {
          expect(result).toContain('tags');
        }
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 10: Audit Log Filter Correctness
// =====================================================

describe('Property 10: Audit Log Filter Correctness', () => {
  /**
   * Feature: system-audit-logging, Property 10: Audit Log Filter Correctness
   * For any combination of audit log filters (user_id, entity_type, entity_id, 
   * action, module, date range), all returned entries SHALL match ALL specified 
   * filter criteria, and no entries matching the criteria SHALL be excluded.
   * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
   */

  it('should return all entries when no filters are applied', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 0, maxLength: 20 }),
        (entries) => {
          const result = filterAuditLogs(entries, {});
          expect(result.length).toBe(entries.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by user_id correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        (entries, userId) => {
          // Set some entries to have the target user_id
          const modifiedEntries = entries.map((e, i) => 
            i % 2 === 0 ? { ...e, user_id: userId } : e
          );
          
          const result = filterAuditLogs(modifiedEntries, { user_id: userId });
          
          // All results should have the specified user_id
          result.forEach((entry) => {
            expect(entry.user_id).toBe(userId);
          });
          
          // Count should match expected
          const expectedCount = modifiedEntries.filter((e) => e.user_id === userId).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by entity_type correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        entityTypeGenerator,
        (entries, entityType) => {
          const result = filterAuditLogs(entries, { entity_type: entityType });
          
          // All results should have the specified entity_type
          result.forEach((entry) => {
            expect(entry.entity_type).toBe(entityType);
          });
          
          // Count should match expected
          const expectedCount = entries.filter((e) => e.entity_type === entityType).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by action correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        auditActionGenerator,
        (entries, action) => {
          const result = filterAuditLogs(entries, { action });
          
          // All results should have the specified action
          result.forEach((entry) => {
            expect(entry.action).toBe(action);
          });
          
          // Count should match expected
          const expectedCount = entries.filter((e) => e.action === action).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by module correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        moduleGenerator,
        (entries, module) => {
          const result = filterAuditLogs(entries, { module });
          
          // All results should have the specified module
          result.forEach((entry) => {
            expect(entry.module).toBe(module);
          });
          
          // Count should match expected
          const expectedCount = entries.filter((e) => e.module === module).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by date range correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        safeDateStringGenerator,
        safeDateStringGenerator,
        (entries, date1, date2) => {
          // Ensure start_date <= end_date
          const [startDate, endDate] = date1 <= date2 ? [date1, date2] : [date2, date1];
          
          const result = filterAuditLogs(entries, { start_date: startDate, end_date: endDate });
          
          // All results should be within the date range
          result.forEach((entry) => {
            const entryDate = new Date(entry.timestamp);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            expect(entryDate >= start).toBe(true);
            expect(entryDate <= end).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by multiple criteria (AND logic)', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 5, maxLength: 20 }),
        auditActionGenerator,
        moduleGenerator,
        (entries, action, module) => {
          const filters: AuditLogFilters = { action, module };
          const result = filterAuditLogs(entries, filters);
          
          // All results should match ALL criteria
          result.forEach((entry) => {
            expect(entry.action).toBe(action);
            expect(entry.module).toBe(module);
          });
          
          // Count should match expected
          const expectedCount = entries.filter(
            (e) => e.action === action && e.module === module
          ).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by array of actions correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.array(auditActionGenerator, { minLength: 1, maxLength: 3 }),
        (entries, actions) => {
          const uniqueActions = [...new Set(actions)];
          const result = filterAuditLogs(entries, { action: uniqueActions });
          
          // All results should have one of the specified actions
          result.forEach((entry) => {
            expect(uniqueActions).toContain(entry.action);
          });
          
          // Count should match expected
          const expectedCount = entries.filter((e) => uniqueActions.includes(e.action as AuditAction)).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by status correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        auditStatusGenerator,
        (entries, status) => {
          const result = filterAuditLogs(entries, { status });
          
          // All results should have the specified status
          result.forEach((entry) => {
            expect(entry.status).toBe(status);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Additional Property Tests
// =====================================================

describe('Audit Log Sorting', () => {
  it('should sort by timestamp descending by default', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 2, maxLength: 20 }),
        (entries) => {
          const sorted = sortAuditLogs(entries);
          
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].timestamp).getTime();
            const currTime = new Date(sorted[i].timestamp).getTime();
            expect(prevTime).toBeGreaterThanOrEqual(currTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mutate original array', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 10 }),
        (entries) => {
          const original = [...entries];
          sortAuditLogs(entries);
          expect(entries).toEqual(original);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Audit Log Pagination', () => {
  it('should return correct page size', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (entries, pageSize) => {
          const result = paginateAuditLogs(entries, { page: 1, page_size: pageSize });
          
          expect(result.data.length).toBeLessThanOrEqual(pageSize);
          expect(result.page_size).toBe(pageSize);
          expect(result.total).toBe(entries.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate total pages correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (entries, pageSize) => {
          const result = paginateAuditLogs(entries, { page: 1, page_size: pageSize });
          
          const expectedTotalPages = Math.ceil(entries.length / pageSize);
          expect(result.total_pages).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Entity Audit History', () => {
  it('should return only entries for specified entity', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        entityTypeGenerator,
        fc.uuid(),
        (entries, entityType, entityId) => {
          // Set some entries to have the target entity
          const modifiedEntries = entries.map((e, i) => 
            i % 3 === 0 ? { ...e, entity_type: entityType, entity_id: entityId } : e
          );
          
          const result = getEntityAuditHistory(modifiedEntries, entityType, entityId);
          
          // All results should have the specified entity
          result.forEach((entry) => {
            expect(entry.entity_type).toBe(entityType);
            expect(entry.entity_id).toBe(entityId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return results sorted by timestamp descending', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 3, maxLength: 20 }),
        entityTypeGenerator,
        fc.uuid(),
        (entries, entityType, entityId) => {
          // Set all entries to have the target entity
          const modifiedEntries = entries.map((e) => ({
            ...e,
            entity_type: entityType,
            entity_id: entityId,
          }));
          
          const result = getEntityAuditHistory(modifiedEntries, entityType, entityId);
          
          for (let i = 1; i < result.length; i++) {
            const prevTime = new Date(result[i - 1].timestamp).getTime();
            const currTime = new Date(result[i].timestamp).getTime();
            expect(prevTime).toBeGreaterThanOrEqual(currTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Statistics Functions', () => {
  it('should count by action correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const counts = countByAction(entries);
          
          // Sum of all counts should equal total entries
          const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);
          expect(totalCount).toBe(entries.length);
          
          // Each action count should be correct
          for (const [action, count] of Object.entries(counts)) {
            const expectedCount = entries.filter((e) => e.action === action).length;
            expect(count).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate failure rate correctly', () => {
    fc.assert(
      fc.property(
        fc.array(auditLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const rate = calculateFailureRate(entries);
          
          const failures = entries.filter((e) => e.status === 'failure').length;
          const expectedRate = (failures / entries.length) * 100;
          
          expect(rate).toBeCloseTo(expectedRate, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 failure rate for empty array', () => {
    const rate = calculateFailureRate([]);
    expect(rate).toBe(0);
  });
});
