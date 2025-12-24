// =====================================================
// v0.69: EXTERNAL ID UTILS PROPERTY TESTS
// Property 6: External ID Mapping Lifecycle
// Validates: Requirements 3.5, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateExternalIdMappingInput,
  prepareExternalIdMappingForCreate,
  prepareExternalIdMappingForUpdate,
  determineOperation,
  determineOperationBatch,
  getExternalId,
  getLocalId,
  hasExternalMapping,
  isMappingStale,
  groupMappingsByTable,
  createMappingLookup,
  createReverseMappingLookup,
  filterMappingsByConnection,
  filterMappingsByTable,
  extractExternalIds,
  extractLocalIds,
  findStaleMappings,
  mergeExternalData,
  validateMappingOwnership,
} from '@/lib/external-id-utils';
import {
  type ExternalIdMapping,
  type CreateExternalIdMappingInput,
} from '@/types/integration';

// =====================================================
// ARBITRARIES (Generators)
// =====================================================

const uuidArb = fc.uuid();
const tableNameArb = fc.stringMatching(/^[a-z][a-z0-9_]{0,29}$/);
const externalIdArb = fc.string({ minLength: 1, maxLength: 50 });

// Use a simpler date approach to avoid invalid date issues
const isoDateArb = fc.integer({ min: 1704067200000, max: 1767225600000 }) // 2024-01-01 to 2025-12-31
  .map(ts => new Date(ts).toISOString());

const externalIdMappingInputArb: fc.Arbitrary<CreateExternalIdMappingInput> = fc.record({
  connection_id: uuidArb,
  local_table: tableNameArb,
  local_id: uuidArb,
  external_id: externalIdArb,
  external_data: fc.option(fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.oneof(fc.string(), fc.integer(), fc.boolean())), { nil: null }),
});

const externalIdMappingArb: fc.Arbitrary<ExternalIdMapping> = fc.record({
  id: uuidArb,
  connection_id: uuidArb,
  local_table: tableNameArb,
  local_id: uuidArb,
  external_id: externalIdArb,
  external_data: fc.option(fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.oneof(fc.string(), fc.integer(), fc.boolean())), { nil: null }),
  synced_at: isoDateArb,
});

describe('External ID Utils Property Tests', () => {
  // =====================================================
  // Property 6: External ID Mapping Lifecycle
  // Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
  // =====================================================
  describe('Property 6: External ID Mapping Lifecycle', () => {
    it('validates required fields for creation', () => {
      fc.assert(
        fc.property(externalIdMappingInputArb, (input) => {
          const result = validateExternalIdMappingInput(input);
          
          // Valid input should pass validation
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('rejects empty required fields', () => {
      const invalidInputs = [
        { connection_id: '', local_table: 'test', local_id: 'id1', external_id: 'ext1' },
        { connection_id: 'conn1', local_table: '', local_id: 'id1', external_id: 'ext1' },
        { connection_id: 'conn1', local_table: 'test', local_id: '', external_id: 'ext1' },
        { connection_id: 'conn1', local_table: 'test', local_id: 'id1', external_id: '' },
      ];

      for (const input of invalidInputs) {
        const result = validateExternalIdMappingInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('prepares mapping data correctly for creation', () => {
      fc.assert(
        fc.property(externalIdMappingInputArb, (input) => {
          const result = prepareExternalIdMappingForCreate(input);
          
          if (!result.valid) return true; // Skip invalid inputs
          
          const data = result.data;
          
          // Verify all fields are preserved and trimmed
          expect(data.connection_id).toBe(input.connection_id.trim());
          expect(data.local_table).toBe(input.local_table.trim());
          expect(data.local_id).toBe(input.local_id.trim());
          expect(data.external_id).toBe(input.external_id.trim());
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('prepares update data with synced_at timestamp', () => {
      fc.assert(
        fc.property(
          fc.record({
            external_id: fc.option(externalIdArb, { nil: undefined }),
            external_data: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: undefined }),
          }),
          (input) => {
            const result = prepareExternalIdMappingForUpdate(input);
            
            // synced_at should always be set
            expect(result.synced_at).toBeDefined();
            expect(typeof result.synced_at).toBe('string');
            
            // Only defined fields should be in result
            if (input.external_id !== undefined) {
              expect(result.external_id).toBe(input.external_id.trim());
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('determines create vs update operation correctly', () => {
      fc.assert(
        fc.property(
          fc.option(externalIdMappingArb, { nil: null }),
          (existingMapping) => {
            const operation = determineOperation(existingMapping);
            
            if (existingMapping === null) {
              expect(operation).toBe('create');
            } else {
              expect(operation).toBe('update');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('determines batch operations correctly', () => {
      fc.assert(
        fc.property(
          fc.array(uuidArb, { minLength: 1, maxLength: 10 }),
          fc.array(externalIdMappingArb, { minLength: 0, maxLength: 5 }),
          (localIds, existingMappings) => {
            const lookup = createMappingLookup(existingMappings);
            const results = determineOperationBatch(localIds, lookup);
            
            expect(results.length).toBe(localIds.length);
            
            for (const result of results) {
              const hasMapping = lookup.has(result.localId);
              if (hasMapping) {
                expect(result.operation).toBe('update');
                expect(result.existingMapping).toBeDefined();
              } else {
                expect(result.operation).toBe('create');
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // External ID Lookup Tests
  // =====================================================
  describe('External ID Lookup', () => {
    it('getExternalId returns correct value or null', () => {
      fc.assert(
        fc.property(
          fc.option(externalIdMappingArb, { nil: null }),
          (mapping) => {
            const result = getExternalId(mapping);
            
            if (mapping === null) {
              expect(result).toBeNull();
            } else {
              expect(result).toBe(mapping.external_id);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getLocalId returns correct value or null', () => {
      fc.assert(
        fc.property(
          fc.option(externalIdMappingArb, { nil: null }),
          (mapping) => {
            const result = getLocalId(mapping);
            
            if (mapping === null) {
              expect(result).toBeNull();
            } else {
              expect(result).toBe(mapping.local_id);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hasExternalMapping returns correct boolean', () => {
      fc.assert(
        fc.property(
          fc.option(externalIdMappingArb, { nil: null }),
          (mapping) => {
            const result = hasExternalMapping(mapping);
            
            if (mapping === null) {
              expect(result).toBe(false);
            } else {
              expect(result).toBe(mapping.external_id !== null && mapping.external_id !== '');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Staleness Detection Tests
  // =====================================================
  describe('Staleness Detection', () => {
    it('isMappingStale returns true for null mapping', () => {
      expect(isMappingStale(null, 24)).toBe(true);
    });

    it('isMappingStale correctly identifies stale mappings', () => {
      const now = new Date();
      
      // Fresh mapping (1 hour ago)
      const freshMapping: ExternalIdMapping = {
        id: 'id1',
        connection_id: 'conn1',
        local_table: 'test',
        local_id: 'local1',
        external_id: 'ext1',
        external_data: null,
        synced_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      };
      
      // Stale mapping (25 hours ago)
      const staleMapping: ExternalIdMapping = {
        id: 'id2',
        connection_id: 'conn1',
        local_table: 'test',
        local_id: 'local2',
        external_id: 'ext2',
        external_data: null,
        synced_at: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(),
      };
      
      expect(isMappingStale(freshMapping, 24)).toBe(false);
      expect(isMappingStale(staleMapping, 24)).toBe(true);
    });

    it('findStaleMappings filters correctly', () => {
      const now = new Date();
      
      const mappings: ExternalIdMapping[] = [
        {
          id: 'id1', connection_id: 'conn1', local_table: 'test', local_id: 'l1', external_id: 'e1', external_data: null,
          synced_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        },
        {
          id: 'id2', connection_id: 'conn1', local_table: 'test', local_id: 'l2', external_id: 'e2', external_data: null,
          synced_at: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        },
        {
          id: 'id3', connection_id: 'conn1', local_table: 'test', local_id: 'l3', external_id: 'e3', external_data: null,
          synced_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
        },
      ];
      
      const staleMappings = findStaleMappings(mappings, 24);
      
      expect(staleMappings.length).toBe(2);
      expect(staleMappings.map(m => m.id)).toContain('id2');
      expect(staleMappings.map(m => m.id)).toContain('id3');
    });
  });

  // =====================================================
  // Batch Processing Tests
  // =====================================================
  describe('Batch Processing', () => {
    it('groupMappingsByTable groups correctly', () => {
      fc.assert(
        fc.property(
          fc.array(externalIdMappingArb, { minLength: 0, maxLength: 20 }),
          (mappings) => {
            const grouped = groupMappingsByTable(mappings);
            
            // Total count should match
            let totalCount = 0;
            for (const [, tableMappings] of grouped) {
              totalCount += tableMappings.length;
            }
            expect(totalCount).toBe(mappings.length);
            
            // Each mapping should be in correct group
            for (const [table, tableMappings] of grouped) {
              for (const mapping of tableMappings) {
                expect(mapping.local_table).toBe(table);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('createMappingLookup creates correct lookup', () => {
      fc.assert(
        fc.property(
          fc.array(externalIdMappingArb, { minLength: 0, maxLength: 20 }),
          (mappings) => {
            const lookup = createMappingLookup(mappings);
            
            // Each mapping should be retrievable by local_id
            for (const mapping of mappings) {
              const found = lookup.get(mapping.local_id);
              // Note: if duplicate local_ids, last one wins
              expect(found).toBeDefined();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('createReverseMappingLookup creates correct reverse lookup', () => {
      fc.assert(
        fc.property(
          fc.array(externalIdMappingArb, { minLength: 0, maxLength: 20 }),
          (mappings) => {
            const lookup = createReverseMappingLookup(mappings);
            
            // Each mapping should be retrievable by external_id
            for (const mapping of mappings) {
              const found = lookup.get(mapping.external_id);
              expect(found).toBeDefined();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filterMappingsByConnection filters correctly', () => {
      fc.assert(
        fc.property(
          fc.array(externalIdMappingArb, { minLength: 0, maxLength: 20 }),
          uuidArb,
          (mappings, connectionId) => {
            const filtered = filterMappingsByConnection(mappings, connectionId);
            
            // All filtered mappings should have the correct connection_id
            for (const mapping of filtered) {
              expect(mapping.connection_id).toBe(connectionId);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filterMappingsByTable filters correctly', () => {
      fc.assert(
        fc.property(
          fc.array(externalIdMappingArb, { minLength: 0, maxLength: 20 }),
          tableNameArb,
          (mappings, tableName) => {
            const filtered = filterMappingsByTable(mappings, tableName);
            
            // All filtered mappings should have the correct local_table
            for (const mapping of filtered) {
              expect(mapping.local_table).toBe(tableName);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // ID Extraction Tests
  // =====================================================
  describe('ID Extraction', () => {
    it('extractExternalIds returns all external IDs', () => {
      fc.assert(
        fc.property(
          fc.array(externalIdMappingArb, { minLength: 0, maxLength: 20 }),
          (mappings) => {
            const externalIds = extractExternalIds(mappings);
            
            expect(externalIds.length).toBe(mappings.length);
            
            for (let i = 0; i < mappings.length; i++) {
              expect(externalIds[i]).toBe(mappings[i].external_id);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('extractLocalIds returns all local IDs', () => {
      fc.assert(
        fc.property(
          fc.array(externalIdMappingArb, { minLength: 0, maxLength: 20 }),
          (mappings) => {
            const localIds = extractLocalIds(mappings);
            
            expect(localIds.length).toBe(mappings.length);
            
            for (let i = 0; i < mappings.length; i++) {
              expect(localIds[i]).toBe(mappings[i].local_id);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Data Merge Tests
  // =====================================================
  describe('Data Merge', () => {
    it('mergeExternalData merges correctly', () => {
      fc.assert(
        fc.property(
          fc.option(fc.dictionary(fc.string(), fc.string()), { nil: null }),
          fc.dictionary(fc.string(), fc.string()),
          (existingData, newData) => {
            const result = mergeExternalData(existingData, newData);
            
            // New data should be in result
            for (const [key, value] of Object.entries(newData)) {
              expect(result[key]).toBe(value);
            }
            
            // Existing data should be preserved if not overwritten
            if (existingData) {
              for (const [key, value] of Object.entries(existingData)) {
                if (!(key in newData)) {
                  expect(result[key]).toBe(value);
                }
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('mergeExternalData handles null existing data', () => {
      const newData = { key1: 'value1', key2: 'value2' };
      const result = mergeExternalData(null, newData);
      
      expect(result).toEqual(newData);
    });
  });

  // =====================================================
  // Ownership Validation Tests
  // =====================================================
  describe('Ownership Validation', () => {
    it('validateMappingOwnership returns correct result', () => {
      fc.assert(
        fc.property(
          externalIdMappingArb,
          uuidArb,
          tableNameArb,
          (mapping, connectionId, tableName) => {
            const result = validateMappingOwnership(mapping, connectionId, tableName);
            
            const expected = mapping.connection_id === connectionId && mapping.local_table === tableName;
            expect(result).toBe(expected);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('validateMappingOwnership returns true for matching values', () => {
      const mapping: ExternalIdMapping = {
        id: 'id1',
        connection_id: 'conn-123',
        local_table: 'invoices',
        local_id: 'local-1',
        external_id: 'ext-1',
        external_data: null,
        synced_at: new Date().toISOString(),
      };
      
      expect(validateMappingOwnership(mapping, 'conn-123', 'invoices')).toBe(true);
      expect(validateMappingOwnership(mapping, 'conn-123', 'customers')).toBe(false);
      expect(validateMappingOwnership(mapping, 'conn-456', 'invoices')).toBe(false);
    });
  });
});
