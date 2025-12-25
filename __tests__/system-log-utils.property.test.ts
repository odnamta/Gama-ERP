/**
 * Property-based tests for system-log-utils.ts
 * Feature: system-audit-logging
 * 
 * Uses fast-check for property-based testing with minimum 100 iterations
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createErrorLogInput,
  createWarnLogInput,
  createInfoLogInput,
  createDebugLogInput,
  createLogInput,
  filterSystemLogs,
  sortSystemLogs,
  paginateSystemLogs,
  calculateLogStats,
  countByLevel,
  countBySource,
  calculateErrorRate,
  extractErrorDetails,
  normalizeError,
  getLogsByRequestId,
  getErrorLogs,
  getLogsAtOrAboveLevel,
  isValidLogLevel,
  LOG_LEVEL_SEVERITY,
} from '@/lib/system-log-utils';
import {
  SystemLogEntry,
  SystemLogLevel,
  SystemLogFilters,
} from '@/types/system-log';

// =====================================================
// Generators
// =====================================================

const logLevelGenerator = fc.constantFrom<SystemLogLevel>(
  'error',
  'warn',
  'info',
  'debug'
);

const sourceGenerator = fc.constantFrom(
  'api',
  'auth',
  'database',
  'scheduler',
  'webhook',
  'notification',
  'integration'
);

const moduleGenerator = fc.constantFrom(
  'customers',
  'projects',
  'quotations',
  'job_orders',
  'invoices',
  'employees',
  'settings'
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

// System log entry generator
const systemLogEntryGenerator = (overrides: Partial<SystemLogEntry> = {}): fc.Arbitrary<SystemLogEntry> =>
  fc.record({
    id: fc.uuid(),
    timestamp: safeTimestampGenerator,
    level: logLevelGenerator,
    source: sourceGenerator,
    message: fc.string({ minLength: 1, maxLength: 200 }),
    module: fc.option(moduleGenerator, { nil: null }),
    function_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    error_type: fc.option(fc.constantFrom('Error', 'TypeError', 'ReferenceError', 'SyntaxError'), { nil: null }),
    error_stack: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    request_id: fc.option(fc.uuid(), { nil: null }),
    user_id: fc.option(fc.uuid(), { nil: null }),
    data: fc.constant({}),
  }).map((entry) => ({ ...entry, ...overrides }));

// Error generator
const errorGenerator = fc.record({
  name: fc.constantFrom('Error', 'TypeError', 'ReferenceError', 'SyntaxError', 'RangeError'),
  message: fc.string({ minLength: 1, maxLength: 200 }),
  stack: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
}).map(({ name, message, stack }) => {
  const error = new Error(message);
  error.name = name;
  if (stack) {
    error.stack = stack;
  }
  return error;
});

// =====================================================
// Property 5: System Log Level Support
// =====================================================

describe('Property 5: System Log Level Support', () => {
  /**
   * Feature: system-audit-logging, Property 5: System Log Level Support
   * For any of the four log levels (error, warn, info, debug), the system logging 
   * utility SHALL accept and store the log entry with the correct level value.
   * Validates: Requirements 2.1
   */

  it('should create error log with level "error"', () => {
    fc.assert(
      fc.property(
        sourceGenerator,
        errorGenerator,
        (source, error) => {
          const input = createErrorLogInput(source, error);
          expect(input.level).toBe('error');
          expect(input.source).toBe(source);
          expect(input.message).toBe(error.message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create warn log with level "warn"', () => {
    fc.assert(
      fc.property(
        sourceGenerator,
        fc.string({ minLength: 1, maxLength: 200 }),
        (source, message) => {
          const input = createWarnLogInput(source, message);
          expect(input.level).toBe('warn');
          expect(input.source).toBe(source);
          expect(input.message).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create info log with level "info"', () => {
    fc.assert(
      fc.property(
        sourceGenerator,
        fc.string({ minLength: 1, maxLength: 200 }),
        (source, message) => {
          const input = createInfoLogInput(source, message);
          expect(input.level).toBe('info');
          expect(input.source).toBe(source);
          expect(input.message).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create debug log with level "debug"', () => {
    fc.assert(
      fc.property(
        sourceGenerator,
        fc.string({ minLength: 1, maxLength: 200 }),
        (source, message) => {
          const input = createDebugLogInput(source, message);
          expect(input.level).toBe('debug');
          expect(input.source).toBe(source);
          expect(input.message).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create log with any valid level using createLogInput', () => {
    fc.assert(
      fc.property(
        logLevelGenerator,
        sourceGenerator,
        fc.string({ minLength: 1, maxLength: 200 }),
        (level, source, message) => {
          const input = createLogInput(level, source, message);
          expect(input.level).toBe(level);
          expect(input.source).toBe(source);
          expect(input.message).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all four log levels as valid', () => {
    const levels: SystemLogLevel[] = ['error', 'warn', 'info', 'debug'];
    for (const level of levels) {
      expect(isValidLogLevel(level)).toBe(true);
    }
  });

  it('should reject invalid log levels', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !['error', 'warn', 'info', 'debug'].includes(s)),
        (invalidLevel) => {
          expect(isValidLogLevel(invalidLevel)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 4: System Log Error Capture
// =====================================================

describe('Property 4: System Log Error Capture', () => {
  /**
   * Feature: system-audit-logging, Property 4: System Log Error Capture
   * For any error logged via the system logging utility, the resulting log entry 
   * SHALL contain the error type (from error.name), the error message (from error.message), 
   * and the stack trace (from error.stack) when available.
   * Validates: Requirements 2.2, 2.3
   */

  it('should capture error type from error.name', () => {
    fc.assert(
      fc.property(
        sourceGenerator,
        errorGenerator,
        (source, error) => {
          const input = createErrorLogInput(source, error);
          expect(input.error_type).toBe(error.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should capture error message from error.message', () => {
    fc.assert(
      fc.property(
        sourceGenerator,
        errorGenerator,
        (source, error) => {
          const input = createErrorLogInput(source, error);
          expect(input.message).toBe(error.message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should capture stack trace from error.stack when available', () => {
    fc.assert(
      fc.property(
        sourceGenerator,
        errorGenerator,
        (source, error) => {
          const input = createErrorLogInput(source, error);
          expect(input.error_stack).toBe(error.stack);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract error details correctly', () => {
    fc.assert(
      fc.property(errorGenerator, (error) => {
        const details = extractErrorDetails(error);
        expect(details.error_type).toBe(error.name);
        expect(details.message).toBe(error.message);
        expect(details.error_stack).toBe(error.stack || null);
      }),
      { numRuns: 100 }
    );
  });

  it('should normalize unknown caught values to Error', () => {
    // Test with string
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (str) => {
        const error = normalizeError(str);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(str);
      }),
      { numRuns: 50 }
    );

    // Test with object
    fc.assert(
      fc.property(
        fc.record({
          message: fc.string({ minLength: 1 }),
          name: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        }),
        (obj) => {
          const error = normalizeError(obj);
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe(obj.message);
          if (obj.name) {
            expect(error.name).toBe(obj.name);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve Error instances when normalizing', () => {
    fc.assert(
      fc.property(errorGenerator, (originalError) => {
        const normalized = normalizeError(originalError);
        expect(normalized).toBe(originalError);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// System Log Filtering Tests
// =====================================================

describe('System Log Filtering', () => {
  it('should return all entries when no filters are applied', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 0, maxLength: 20 }),
        (entries) => {
          const result = filterSystemLogs(entries, {});
          expect(result.length).toBe(entries.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by level correctly', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        logLevelGenerator,
        (entries, level) => {
          const result = filterSystemLogs(entries, { level });
          
          // All results should have the specified level
          result.forEach((entry) => {
            expect(entry.level).toBe(level);
          });
          
          // Count should match expected
          const expectedCount = entries.filter((e) => e.level === level).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by array of levels correctly', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.array(logLevelGenerator, { minLength: 1, maxLength: 3 }),
        (entries, levels) => {
          const uniqueLevels = [...new Set(levels)];
          const result = filterSystemLogs(entries, { level: uniqueLevels });
          
          // All results should have one of the specified levels
          result.forEach((entry) => {
            expect(uniqueLevels).toContain(entry.level);
          });
          
          // Count should match expected
          const expectedCount = entries.filter((e) => uniqueLevels.includes(e.level)).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by source correctly (partial match)', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        sourceGenerator,
        (entries, source) => {
          const result = filterSystemLogs(entries, { source });
          
          // All results should contain the source string
          result.forEach((entry) => {
            expect(entry.source.toLowerCase()).toContain(source.toLowerCase());
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by search term in message', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (entries, searchTerm) => {
          const result = filterSystemLogs(entries, { search: searchTerm });
          
          // All results should contain the search term in message
          result.forEach((entry) => {
            expect(entry.message.toLowerCase()).toContain(searchTerm.toLowerCase());
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by date range correctly', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        safeDateStringGenerator,
        safeDateStringGenerator,
        (entries, date1, date2) => {
          // Ensure start_date <= end_date
          const [startDate, endDate] = date1 <= date2 ? [date1, date2] : [date2, date1];
          
          const result = filterSystemLogs(entries, { start_date: startDate, end_date: endDate });
          
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
        fc.array(systemLogEntryGenerator(), { minLength: 5, maxLength: 20 }),
        logLevelGenerator,
        sourceGenerator,
        (entries, level, source) => {
          const filters: SystemLogFilters = { level, source };
          const result = filterSystemLogs(entries, filters);
          
          // All results should match ALL criteria
          result.forEach((entry) => {
            expect(entry.level).toBe(level);
            expect(entry.source.toLowerCase()).toContain(source.toLowerCase());
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// System Log Sorting Tests
// =====================================================

describe('System Log Sorting', () => {
  it('should sort by timestamp descending by default', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 2, maxLength: 20 }),
        (entries) => {
          const sorted = sortSystemLogs(entries);
          
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
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 10 }),
        (entries) => {
          const original = [...entries];
          sortSystemLogs(entries);
          expect(entries).toEqual(original);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort ascending when specified', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 2, maxLength: 20 }),
        (entries) => {
          const sorted = sortSystemLogs(entries, 'timestamp', 'asc');
          
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].timestamp).getTime();
            const currTime = new Date(sorted[i].timestamp).getTime();
            expect(prevTime).toBeLessThanOrEqual(currTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// System Log Pagination Tests
// =====================================================

describe('System Log Pagination', () => {
  it('should return correct page size', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (entries, pageSize) => {
          const result = paginateSystemLogs(entries, { page: 1, page_size: pageSize });
          
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
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (entries, pageSize) => {
          const result = paginateSystemLogs(entries, { page: 1, page_size: pageSize });
          
          const expectedTotalPages = Math.ceil(entries.length / pageSize);
          expect(result.total_pages).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Statistics Tests
// =====================================================

describe('System Log Statistics', () => {
  it('should count by level correctly', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const counts = countByLevel(entries);
          
          // Sum of all counts should equal total entries
          const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);
          expect(totalCount).toBe(entries.length);
          
          // Each level count should be correct
          for (const level of ['error', 'warn', 'info', 'debug'] as SystemLogLevel[]) {
            const expectedCount = entries.filter((e) => e.level === level).length;
            expect(counts[level]).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count by source correctly', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const counts = countBySource(entries);
          
          // Sum of all counts should equal total entries
          const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);
          expect(totalCount).toBe(entries.length);
          
          // Each source count should be correct
          for (const [source, count] of Object.entries(counts)) {
            const expectedCount = entries.filter((e) => e.source === source).length;
            expect(count).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate error rate correctly', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const rate = calculateErrorRate(entries);
          
          const errors = entries.filter((e) => e.level === 'error').length;
          const expectedRate = (errors / entries.length) * 100;
          
          expect(rate).toBeCloseTo(expectedRate, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 error rate for empty array', () => {
    const rate = calculateErrorRate([]);
    expect(rate).toBe(0);
  });

  it('should calculate complete stats correctly', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const stats = calculateLogStats(entries);
          
          expect(stats.total_entries).toBe(entries.length);
          
          // Verify level counts
          const levelSum = Object.values(stats.entries_by_level).reduce((sum, c) => sum + c, 0);
          expect(levelSum).toBe(entries.length);
          
          // Verify source counts
          const sourceSum = stats.entries_by_source.reduce((sum, s) => sum + s.count, 0);
          expect(sourceSum).toBe(entries.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Query Helper Tests
// =====================================================

describe('Query Helpers', () => {
  it('should get logs by request ID', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        (entries, requestId) => {
          // Set some entries to have the target request_id
          const modifiedEntries = entries.map((e, i) => 
            i % 3 === 0 ? { ...e, request_id: requestId } : e
          );
          
          const result = getLogsByRequestId(modifiedEntries, requestId);
          
          // All results should have the specified request_id
          result.forEach((entry) => {
            expect(entry.request_id).toBe(requestId);
          });
          
          // Results should be sorted by timestamp ascending
          for (let i = 1; i < result.length; i++) {
            const prevTime = new Date(result[i - 1].timestamp).getTime();
            const currTime = new Date(result[i].timestamp).getTime();
            expect(prevTime).toBeLessThanOrEqual(currTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should get error logs only', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const result = getErrorLogs(entries);
          
          // All results should be errors
          result.forEach((entry) => {
            expect(entry.level).toBe('error');
          });
          
          // Count should match expected
          const expectedCount = entries.filter((e) => e.level === 'error').length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should get logs at or above severity level', () => {
    fc.assert(
      fc.property(
        fc.array(systemLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        logLevelGenerator,
        (entries, minLevel) => {
          const result = getLogsAtOrAboveLevel(entries, minLevel);
          const minSeverity = LOG_LEVEL_SEVERITY[minLevel];
          
          // All results should be at or above the minimum severity
          result.forEach((entry) => {
            expect(LOG_LEVEL_SEVERITY[entry.level]).toBeLessThanOrEqual(minSeverity);
          });
          
          // Count should match expected
          const expectedCount = entries.filter(
            (e) => LOG_LEVEL_SEVERITY[e.level] <= minSeverity
          ).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
