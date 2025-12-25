/**
 * Property-based tests for data-access-utils.ts
 * Feature: system-audit-logging
 * 
 * Uses fast-check for property-based testing with minimum 100 iterations
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createDataExportLogInput,
  createDataAccessLogInput,
  filterDataAccessLogs,
  sortDataAccessLogs,
  paginateDataAccessLogs,
  calculateDataAccessStats,
  countByAccessType,
  countByDataType,
  countExportsByFormat,
  calculateTotalRecordsExported,
  validateExportLogInput,
  validateAccessLogInput,
  isValidAccessType,
  isValidFileFormat,
  getExportLogs,
  getLogsByUser,
  getLogsByDataType,
  getLogsByEntity,
} from '@/lib/data-access-utils';
import {
  DataAccessLogEntry,
  DataAccessType,
  ExportFileFormat,
  LogDataExportInput,
  LogDataAccessInput,
} from '@/types/data-access-log';

// =====================================================
// Generators
// =====================================================

const accessTypeGenerator = fc.constantFrom<DataAccessType>(
  'view',
  'export',
  'bulk_query',
  'download'
);

const fileFormatGenerator = fc.constantFrom<ExportFileFormat>(
  'csv',
  'xlsx',
  'pdf',
  'json'
);

const dataTypeGenerator = fc.constantFrom(
  'customers',
  'projects',
  'quotations',
  'job_orders',
  'invoices',
  'employees',
  'vendors',
  'assets',
  'reports'
);

const entityTypeGenerator = fc.constantFrom(
  'customer',
  'project',
  'quotation',
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

// Data access log entry generator
const dataAccessLogEntryGenerator = (
  overrides: Partial<DataAccessLogEntry> = {}
): fc.Arbitrary<DataAccessLogEntry> =>
  fc.record({
    id: fc.uuid(),
    timestamp: safeTimestampGenerator,
    user_id: fc.uuid(),
    data_type: dataTypeGenerator,
    entity_type: fc.option(entityTypeGenerator, { nil: null }),
    entity_id: fc.option(fc.uuid(), { nil: null }),
    access_type: accessTypeGenerator,
    reason: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    ip_address: fc.option(fc.ipV4(), { nil: null }),
    records_count: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: null }),
    file_format: fc.option(fileFormatGenerator, { nil: null }),
  }).map((entry) => ({ ...entry, ...overrides }));

// Export log entry generator (always has export access_type and file_format)
const exportLogEntryGenerator = (): fc.Arbitrary<DataAccessLogEntry> =>
  fc.record({
    id: fc.uuid(),
    timestamp: safeTimestampGenerator,
    user_id: fc.uuid(),
    data_type: dataTypeGenerator,
    entity_type: fc.option(entityTypeGenerator, { nil: null }),
    entity_id: fc.constant(null),
    access_type: fc.constant<DataAccessType>('export'),
    reason: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    ip_address: fc.option(fc.ipV4(), { nil: null }),
    records_count: fc.integer({ min: 1, max: 100000 }),
    file_format: fileFormatGenerator,
  });

// Log data export input generator
const logDataExportInputGenerator = (): fc.Arbitrary<LogDataExportInput> =>
  fc.record({
    user_id: fc.uuid(),
    data_type: dataTypeGenerator,
    file_format: fileFormatGenerator,
    records_count: fc.integer({ min: 0, max: 100000 }),
    entity_type: fc.option(entityTypeGenerator, { nil: undefined }),
    reason: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
    ip_address: fc.option(fc.ipV4(), { nil: undefined }),
  });

// Log data access input generator
const logDataAccessInputGenerator = (): fc.Arbitrary<LogDataAccessInput> =>
  fc.record({
    user_id: fc.uuid(),
    data_type: dataTypeGenerator,
    access_type: accessTypeGenerator,
    entity_type: fc.option(entityTypeGenerator, { nil: undefined }),
    entity_id: fc.option(fc.uuid(), { nil: undefined }),
    reason: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
    ip_address: fc.option(fc.ipV4(), { nil: undefined }),
    records_count: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
  });

// =====================================================
// Property 9: Data Export Logging
// =====================================================

describe('Property 9: Data Export Logging', () => {
  /**
   * Feature: system-audit-logging, Property 9: Data Export Logging
   * For any data export operation, the data_access_log entry SHALL contain 
   * the data_type, file_format, and records_count, and access_type SHALL be 'export'.
   * Validates: Requirements 4.1
   */

  it('should create export log with access_type set to export', () => {
    fc.assert(
      fc.property(logDataExportInputGenerator(), (input) => {
        const result = createDataExportLogInput(input);
        expect(result.access_type).toBe('export');
      }),
      { numRuns: 100 }
    );
  });

  it('should create export log with data_type from input', () => {
    fc.assert(
      fc.property(logDataExportInputGenerator(), (input) => {
        const result = createDataExportLogInput(input);
        expect(result.data_type).toBe(input.data_type);
      }),
      { numRuns: 100 }
    );
  });

  it('should create export log with file_format from input', () => {
    fc.assert(
      fc.property(logDataExportInputGenerator(), (input) => {
        const result = createDataExportLogInput(input);
        expect(result.file_format).toBe(input.file_format);
      }),
      { numRuns: 100 }
    );
  });

  it('should create export log with records_count from input', () => {
    fc.assert(
      fc.property(logDataExportInputGenerator(), (input) => {
        const result = createDataExportLogInput(input);
        expect(result.records_count).toBe(input.records_count);
      }),
      { numRuns: 100 }
    );
  });

  it('should create export log with user_id from input', () => {
    fc.assert(
      fc.property(logDataExportInputGenerator(), (input) => {
        const result = createDataExportLogInput(input);
        expect(result.user_id).toBe(input.user_id);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate export log input requires data_type, file_format, and records_count', () => {
    // Missing data_type
    const missingDataType = validateExportLogInput({
      user_id: 'test-user',
      file_format: 'csv',
      records_count: 100,
    });
    expect(missingDataType.valid).toBe(false);
    expect(missingDataType.errors).toContain('Data type is required');

    // Missing file_format
    const missingFormat = validateExportLogInput({
      user_id: 'test-user',
      data_type: 'customers',
      records_count: 100,
    });
    expect(missingFormat.valid).toBe(false);
    expect(missingFormat.errors).toContain('File format is required');

    // Missing records_count
    const missingCount = validateExportLogInput({
      user_id: 'test-user',
      data_type: 'customers',
      file_format: 'csv',
    });
    expect(missingCount.valid).toBe(false);
    expect(missingCount.errors).toContain('Records count is required');
  });

  it('should validate complete export log input as valid', () => {
    fc.assert(
      fc.property(logDataExportInputGenerator(), (input) => {
        const result = validateExportLogInput(input);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Data Access Log Creation Tests
// =====================================================

describe('Data Access Log Creation', () => {
  it('should create access log with correct access_type', () => {
    fc.assert(
      fc.property(logDataAccessInputGenerator(), (input) => {
        const result = createDataAccessLogInput(input);
        expect(result.access_type).toBe(input.access_type);
      }),
      { numRuns: 100 }
    );
  });

  it('should create access log with correct user_id', () => {
    fc.assert(
      fc.property(logDataAccessInputGenerator(), (input) => {
        const result = createDataAccessLogInput(input);
        expect(result.user_id).toBe(input.user_id);
      }),
      { numRuns: 100 }
    );
  });

  it('should create access log with correct data_type', () => {
    fc.assert(
      fc.property(logDataAccessInputGenerator(), (input) => {
        const result = createDataAccessLogInput(input);
        expect(result.data_type).toBe(input.data_type);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate access log input correctly', () => {
    fc.assert(
      fc.property(logDataAccessInputGenerator(), (input) => {
        const result = validateAccessLogInput(input);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Filtering Tests
// =====================================================

describe('Data Access Log Filtering', () => {
  it('should return all entries when no filters are applied', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 0, maxLength: 20 }),
        (entries) => {
          const result = filterDataAccessLogs(entries, {});
          expect(result.length).toBe(entries.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by user_id correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        (entries, userId) => {
          // Set some entries to have the target user_id
          const modifiedEntries = entries.map((e, i) =>
            i % 2 === 0 ? { ...e, user_id: userId } : e
          );

          const result = filterDataAccessLogs(modifiedEntries, { user_id: userId });

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

  it('should filter by access_type correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        accessTypeGenerator,
        (entries, accessType) => {
          const result = filterDataAccessLogs(entries, { access_type: accessType });

          // All results should have the specified access_type
          result.forEach((entry) => {
            expect(entry.access_type).toBe(accessType);
          });

          // Count should match expected
          const expectedCount = entries.filter((e) => e.access_type === accessType).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by file_format correctly', () => {
    fc.assert(
      fc.property(
        fc.array(exportLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fileFormatGenerator,
        (entries, format) => {
          const result = filterDataAccessLogs(entries, { file_format: format });

          // All results should have the specified file_format
          result.forEach((entry) => {
            expect(entry.file_format).toBe(format);
          });

          // Count should match expected
          const expectedCount = entries.filter((e) => e.file_format === format).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter by date range correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        safeDateStringGenerator,
        safeDateStringGenerator,
        (entries, date1, date2) => {
          // Ensure start_date <= end_date
          const [startDate, endDate] = date1 <= date2 ? [date1, date2] : [date2, date1];

          const result = filterDataAccessLogs(entries, { start_date: startDate, end_date: endDate });

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

  it('should filter by array of access_types correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.array(accessTypeGenerator, { minLength: 1, maxLength: 3 }),
        (entries, accessTypes) => {
          const uniqueTypes = [...new Set(accessTypes)];
          const result = filterDataAccessLogs(entries, { access_type: uniqueTypes });

          // All results should have one of the specified access_types
          result.forEach((entry) => {
            expect(uniqueTypes).toContain(entry.access_type);
          });

          // Count should match expected
          const expectedCount = entries.filter((e) => uniqueTypes.includes(e.access_type)).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Sorting Tests
// =====================================================

describe('Data Access Log Sorting', () => {
  it('should sort by timestamp descending by default', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 2, maxLength: 20 }),
        (entries) => {
          const sorted = sortDataAccessLogs(entries);

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
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 10 }),
        (entries) => {
          const original = [...entries];
          sortDataAccessLogs(entries);
          expect(entries).toEqual(original);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort ascending when specified', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 2, maxLength: 20 }),
        (entries) => {
          const sorted = sortDataAccessLogs(entries, 'timestamp', 'asc');

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
// Pagination Tests
// =====================================================

describe('Data Access Log Pagination', () => {
  it('should return correct page size', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (entries, pageSize) => {
          const result = paginateDataAccessLogs(entries, { page: 1, page_size: pageSize });

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
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (entries, pageSize) => {
          const result = paginateDataAccessLogs(entries, { page: 1, page_size: pageSize });

          const expectedTotalPages = Math.ceil(entries.length / pageSize);
          expect(result.total_pages).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty data for out-of-range page', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 10 }),
        (entries) => {
          const result = paginateDataAccessLogs(entries, { page: 1000, page_size: 10 });
          expect(result.data).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Statistics Tests
// =====================================================

describe('Data Access Statistics', () => {
  it('should count total accesses correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 0, maxLength: 20 }),
        (entries) => {
          const stats = calculateDataAccessStats(entries);
          expect(stats.total_accesses).toBe(entries.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count by access type correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const counts = countByAccessType(entries);

          // Sum of all counts should equal total entries
          const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);
          expect(totalCount).toBe(entries.length);

          // Each access type count should be correct
          for (const [type, count] of Object.entries(counts)) {
            const expectedCount = entries.filter((e) => e.access_type === type).length;
            expect(count).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count exports by format correctly', () => {
    fc.assert(
      fc.property(
        fc.array(exportLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const counts = countExportsByFormat(entries);

          // Each format count should be correct
          for (const [format, count] of Object.entries(counts)) {
            const expectedCount = entries.filter(
              (e) => e.access_type === 'export' && e.file_format === format
            ).length;
            expect(count).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate total records exported correctly', () => {
    fc.assert(
      fc.property(
        fc.array(exportLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const total = calculateTotalRecordsExported(entries);

          const expectedTotal = entries
            .filter((e) => e.access_type === 'export' && e.records_count !== null)
            .reduce((sum, e) => sum + (e.records_count || 0), 0);

          expect(total).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count by data type correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const counts = countByDataType(entries);

          // Sum of all counts should equal total entries
          const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);
          expect(totalCount).toBe(entries.length);
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
  it('should get export logs only', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        (entries) => {
          const exports = getExportLogs(entries);

          // All results should be exports
          exports.forEach((entry) => {
            expect(entry.access_type).toBe('export');
          });

          // Count should match expected
          const expectedCount = entries.filter((e) => e.access_type === 'export').length;
          expect(exports.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should get logs by user correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        (entries, userId) => {
          // Set some entries to have the target user_id
          const modifiedEntries = entries.map((e, i) =>
            i % 2 === 0 ? { ...e, user_id: userId } : e
          );

          const result = getLogsByUser(modifiedEntries, userId);

          // All results should have the specified user_id
          result.forEach((entry) => {
            expect(entry.user_id).toBe(userId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should get logs by data type correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        dataTypeGenerator,
        (entries, dataType) => {
          const result = getLogsByDataType(entries, dataType);

          // All results should have the specified data_type
          result.forEach((entry) => {
            expect(entry.data_type).toBe(dataType);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should get logs by entity correctly', () => {
    fc.assert(
      fc.property(
        fc.array(dataAccessLogEntryGenerator(), { minLength: 1, maxLength: 20 }),
        entityTypeGenerator,
        fc.uuid(),
        (entries, entityType, entityId) => {
          // Set some entries to have the target entity
          const modifiedEntries = entries.map((e, i) =>
            i % 3 === 0 ? { ...e, entity_type: entityType, entity_id: entityId } : e
          );

          const result = getLogsByEntity(modifiedEntries, entityType, entityId);

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
});

// =====================================================
// Validation Tests
// =====================================================

describe('Validation Functions', () => {
  it('should validate access types correctly', () => {
    expect(isValidAccessType('view')).toBe(true);
    expect(isValidAccessType('export')).toBe(true);
    expect(isValidAccessType('bulk_query')).toBe(true);
    expect(isValidAccessType('download')).toBe(true);
    expect(isValidAccessType('invalid')).toBe(false);
    expect(isValidAccessType('')).toBe(false);
  });

  it('should validate file formats correctly', () => {
    expect(isValidFileFormat('csv')).toBe(true);
    expect(isValidFileFormat('xlsx')).toBe(true);
    expect(isValidFileFormat('pdf')).toBe(true);
    expect(isValidFileFormat('json')).toBe(true);
    expect(isValidFileFormat('invalid')).toBe(false);
    expect(isValidFileFormat('')).toBe(false);
  });

  it('should reject negative records_count in export validation', () => {
    const result = validateExportLogInput({
      user_id: 'test-user',
      data_type: 'customers',
      file_format: 'csv',
      records_count: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Records count must be non-negative');
  });

  it('should reject invalid file format in export validation', () => {
    const result = validateExportLogInput({
      user_id: 'test-user',
      data_type: 'customers',
      file_format: 'invalid' as ExportFileFormat,
      records_count: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid file format');
  });

  it('should reject invalid access type in access validation', () => {
    const result = validateAccessLogInput({
      user_id: 'test-user',
      data_type: 'customers',
      access_type: 'invalid' as DataAccessType,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid access type');
  });
});
