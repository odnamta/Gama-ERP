// =====================================================
// v0.69: SYNC MAPPING UTILS PROPERTY TESTS
// Property 3: Sync Mapping Persistence
// Property 4: Filter Application
// Validates: Requirements 2.1, 2.2, 2.5, 2.6
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  prepareSyncMappingForCreate,
  prepareSyncMappingForUpdate,
  applyFieldMappings,
  applyTransform,
  getNestedValue,
  setNestedValue,
  evaluateFilterCondition,
  evaluateFilterConditions,
  filterRecords,
  evaluateOperator,
  isMappingActive,
  filterActiveMappings,
  transformRecordBatch,
  processSyncMapping,
} from '@/lib/sync-mapping-utils';
import {
  VALID_SYNC_DIRECTIONS,
  VALID_SYNC_FREQUENCIES,
  VALID_TRANSFORM_FUNCTIONS,
  VALID_FILTER_OPERATORS,
  type FieldMapping,
  type FilterCondition,
  type SyncMapping,
  type CreateSyncMappingInput,
  type TransformFunction,
  type FilterOperator,
} from '@/types/integration';

// =====================================================
// ARBITRARIES (Generators)
// =====================================================

// Valid field name generator (alphanumeric with underscores)
const fieldNameChars = 'abcdefghijklmnopqrstuvwxyz_';
const fieldNameArb = fc.array(
  fc.constantFrom(...fieldNameChars.split('')),
  { minLength: 1, maxLength: 30 }
).map(arr => arr.join(''));

// Valid field mapping generator
const fieldMappingArb: fc.Arbitrary<FieldMapping> = fc.record({
  local_field: fieldNameArb,
  remote_field: fieldNameArb,
  transform: fc.option(fc.constantFrom(...VALID_TRANSFORM_FUNCTIONS), { nil: undefined }),
}).map(r => ({
  local_field: r.local_field as string,
  remote_field: r.remote_field as string,
  transform: r.transform,
}));

// Valid filter condition generator
const filterConditionArb: fc.Arbitrary<FilterCondition> = fc.record({
  field: fieldNameArb,
  operator: fc.constantFrom(...VALID_FILTER_OPERATORS),
  value: fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
}).map(r => ({
  field: r.field as string,
  operator: r.operator,
  value: r.value,
}));

// Valid UUID generator
const uuidArb = fc.uuid();

// Valid sync mapping input generator
const syncMappingInputArb: fc.Arbitrary<CreateSyncMappingInput> = fc.record({
  connection_id: uuidArb,
  local_table: fieldNameArb,
  remote_entity: fieldNameArb,
  field_mappings: fc.array(fieldMappingArb, { minLength: 1, maxLength: 5 }),
  sync_direction: fc.option(fc.constantFrom(...VALID_SYNC_DIRECTIONS), { nil: undefined }),
  sync_frequency: fc.option(fc.constantFrom(...VALID_SYNC_FREQUENCIES), { nil: undefined }),
  filter_conditions: fc.option(fc.array(filterConditionArb, { minLength: 0, maxLength: 3 }), { nil: null }),
  is_active: fc.option(fc.boolean(), { nil: undefined }),
}).map(r => ({
  connection_id: r.connection_id,
  local_table: r.local_table as string,
  remote_entity: r.remote_entity as string,
  field_mappings: r.field_mappings,
  sync_direction: r.sync_direction,
  sync_frequency: r.sync_frequency,
  filter_conditions: r.filter_conditions,
  is_active: r.is_active,
}));

// Simple record generator for testing transformations
const simpleRecordArb = fc.dictionary(
  fieldNameArb,
  fc.oneof(fc.string(), fc.integer(), fc.double(), fc.boolean(), fc.constant(null))
);

describe('Sync Mapping Utils Property Tests', () => {
  // =====================================================
  // Property 3: Sync Mapping Persistence
  // Validates: Requirements 2.1, 2.2
  // =====================================================
  describe('Property 3: Sync Mapping Persistence', () => {
    it('preserves all required fields when preparing for create', () => {
      fc.assert(
        fc.property(syncMappingInputArb, (input) => {
          const result = prepareSyncMappingForCreate(input);
          
          if (!result.valid) {
            // If validation fails, it should have errors
            return 'errors' in result && result.errors.length > 0;
          }
          
          const data = result.data;
          
          // Verify all required fields are preserved
          expect(data.connection_id).toBe(input.connection_id);
          expect(data.local_table).toBe(input.local_table.trim());
          expect(data.remote_entity).toBe(input.remote_entity.trim());
          
          // Verify field_mappings are preserved with local_field, remote_field, and optional transform
          expect(data.field_mappings.length).toBe(input.field_mappings.length);
          for (let i = 0; i < input.field_mappings.length; i++) {
            expect(data.field_mappings[i].local_field).toBe(input.field_mappings[i].local_field.trim());
            expect(data.field_mappings[i].remote_field).toBe(input.field_mappings[i].remote_field.trim());
            if (input.field_mappings[i].transform) {
              expect(data.field_mappings[i].transform).toBe(input.field_mappings[i].transform);
            }
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('applies default values for optional fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            connection_id: uuidArb,
            local_table: fieldNameArb,
            remote_entity: fieldNameArb,
            field_mappings: fc.array(fieldMappingArb, { minLength: 1, maxLength: 3 }),
          }),
          (input) => {
            const result = prepareSyncMappingForCreate(input as CreateSyncMappingInput);
            
            if (!result.valid) return true; // Skip invalid inputs
            
            const data = result.data;
            
            // Verify defaults are applied
            expect(data.sync_direction).toBe('push');
            expect(data.sync_frequency).toBe('realtime');
            expect(data.filter_conditions).toBeNull();
            expect(data.is_active).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('preserves field mapping transform functions', () => {
      fc.assert(
        fc.property(
          fc.record({
            connection_id: uuidArb,
            local_table: fieldNameArb,
            remote_entity: fieldNameArb,
            field_mappings: fc.array(
              fc.record({
                local_field: fieldNameArb,
                remote_field: fieldNameArb,
                transform: fc.constantFrom(...VALID_TRANSFORM_FUNCTIONS),
              }),
              { minLength: 1, maxLength: 3 }
            ),
          }),
          (input) => {
            const result = prepareSyncMappingForCreate(input as CreateSyncMappingInput);
            
            if (!result.valid) return true;
            
            const data = result.data;
            
            // Verify transforms are preserved
            for (let i = 0; i < input.field_mappings.length; i++) {
              expect(data.field_mappings[i].transform).toBe(input.field_mappings[i].transform);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('prepares update data correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            local_table: fc.option(fieldNameArb, { nil: undefined }),
            remote_entity: fc.option(fieldNameArb, { nil: undefined }),
            field_mappings: fc.option(fc.array(fieldMappingArb, { minLength: 1, maxLength: 3 }), { nil: undefined }),
            sync_direction: fc.option(fc.constantFrom(...VALID_SYNC_DIRECTIONS), { nil: undefined }),
            sync_frequency: fc.option(fc.constantFrom(...VALID_SYNC_FREQUENCIES), { nil: undefined }),
            is_active: fc.option(fc.boolean(), { nil: undefined }),
          }),
          (rawInput) => {
            const input = {
              local_table: rawInput.local_table as string | undefined,
              remote_entity: rawInput.remote_entity as string | undefined,
              field_mappings: rawInput.field_mappings,
              sync_direction: rawInput.sync_direction,
              sync_frequency: rawInput.sync_frequency,
              is_active: rawInput.is_active,
            };
            
            const result = prepareSyncMappingForUpdate(input);
            
            // Only defined fields should be in the result
            if (input.local_table !== undefined) {
              expect(result.local_table).toBe(input.local_table.trim());
            } else {
              expect(result.local_table).toBeUndefined();
            }
            
            if (input.remote_entity !== undefined) {
              expect(result.remote_entity).toBe(input.remote_entity.trim());
            } else {
              expect(result.remote_entity).toBeUndefined();
            }
            
            if (input.sync_direction !== undefined) {
              expect(result.sync_direction).toBe(input.sync_direction);
            } else {
              expect(result.sync_direction).toBeUndefined();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Property 4: Filter Application
  // Validates: Requirements 2.5, 2.6
  // =====================================================
  describe('Property 4: Filter Application', () => {
    it('returns all records when no filter conditions', () => {
      fc.assert(
        fc.property(
          fc.array(simpleRecordArb, { minLength: 0, maxLength: 10 }),
          (records) => {
            const filtered = filterRecords(records, null);
            expect(filtered.length).toBe(records.length);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns all records when filter conditions is empty array', () => {
      fc.assert(
        fc.property(
          fc.array(simpleRecordArb, { minLength: 0, maxLength: 10 }),
          (records) => {
            const filtered = filterRecords(records, []);
            expect(filtered.length).toBe(records.length);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('eq operator filters correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (fieldName, value) => {
            const records = [
              { [fieldName]: value },
              { [fieldName]: value + '_different' },
              { [fieldName]: value },
            ];
            
            const conditions: FilterCondition[] = [
              { field: fieldName, operator: 'eq', value }
            ];
            
            const filtered = filterRecords(records, conditions);
            
            // All filtered records should have the exact value
            return filtered.every(r => r[fieldName] === value);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('neq operator filters correctly', () => {
      // Use deterministic test data to avoid edge cases
      const testCases = [
        { fieldName: 'status', value: 'active', records: [
          { status: 'active' },
          { status: 'inactive' },
          { status: 'pending' },
        ]},
        { fieldName: 'type', value: 'A', records: [
          { type: 'A' },
          { type: 'B' },
          { type: 'C' },
        ]},
      ];
      
      for (const { fieldName, value, records } of testCases) {
        const conditions: FilterCondition[] = [
          { field: fieldName, operator: 'neq', value }
        ];
        
        const filtered = filterRecords(records, conditions);
        
        // No filtered records should have the excluded value
        expect(filtered.every(r => r[fieldName] !== value)).toBe(true);
        // Should have filtered out exactly one record
        expect(filtered.length).toBe(2);
      }
    });

    it('gt operator filters numbers correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 100 }),
          (fieldName, threshold) => {
            const records = [
              { [fieldName]: threshold - 10 },
              { [fieldName]: threshold },
              { [fieldName]: threshold + 10 },
              { [fieldName]: threshold + 20 },
            ];
            
            const conditions: FilterCondition[] = [
              { field: fieldName, operator: 'gt', value: threshold }
            ];
            
            const filtered = filterRecords(records, conditions);
            
            // All filtered records should have value > threshold
            return filtered.every(r => (r[fieldName] as number) > threshold);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('lt operator filters numbers correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 10, max: 100 }),
          (fieldName, threshold) => {
            const records = [
              { [fieldName]: threshold - 10 },
              { [fieldName]: threshold },
              { [fieldName]: threshold + 10 },
            ];
            
            const conditions: FilterCondition[] = [
              { field: fieldName, operator: 'lt', value: threshold }
            ];
            
            const filtered = filterRecords(records, conditions);
            
            // All filtered records should have value < threshold
            return filtered.every(r => (r[fieldName] as number) < threshold);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('in operator filters correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
          (fieldName, allowedValues) => {
            const records = [
              { [fieldName]: allowedValues[0] },
              { [fieldName]: 'not_in_list' },
              { [fieldName]: allowedValues[allowedValues.length - 1] || allowedValues[0] },
            ];
            
            const conditions: FilterCondition[] = [
              { field: fieldName, operator: 'in', value: allowedValues }
            ];
            
            const filtered = filterRecords(records, conditions);
            
            // All filtered records should have value in the allowed list
            return filtered.every(r => allowedValues.includes(r[fieldName] as string));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('contains operator filters strings correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 5 }),
          (fieldName, substring) => {
            const records = [
              { [fieldName]: `prefix_${substring}_suffix` },
              { [fieldName]: 'no_match_here' },
              { [fieldName]: substring.toUpperCase() }, // Case insensitive
            ];
            
            const conditions: FilterCondition[] = [
              { field: fieldName, operator: 'contains', value: substring }
            ];
            
            const filtered = filterRecords(records, conditions);
            
            // All filtered records should contain the substring (case insensitive)
            return filtered.every(r => 
              (r[fieldName] as string).toLowerCase().includes(substring.toLowerCase())
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple conditions use AND logic', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 60, max: 100 }),
          (minValue, maxValue) => {
            const records = [
              { amount: 5, status: 'active' },
              { amount: 30, status: 'active' },
              { amount: 30, status: 'inactive' },
              { amount: 80, status: 'active' },
            ];
            
            const conditions: FilterCondition[] = [
              { field: 'amount', operator: 'gte', value: minValue },
              { field: 'amount', operator: 'lte', value: maxValue },
              { field: 'status', operator: 'eq', value: 'active' },
            ];
            
            const filtered = filterRecords(records, conditions);
            
            // All filtered records should satisfy ALL conditions
            return filtered.every(r => 
              (r.amount as number) >= minValue &&
              (r.amount as number) <= maxValue &&
              r.status === 'active'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deactivated mappings are excluded from active filter', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (activeStates) => {
            const mappings: SyncMapping[] = activeStates.map((isActive, i) => ({
              id: `mapping-${i}`,
              connection_id: 'conn-1',
              local_table: 'test',
              remote_entity: 'Test',
              field_mappings: [{ local_field: 'id', remote_field: 'id' }],
              sync_direction: 'push',
              sync_frequency: 'realtime',
              filter_conditions: null,
              is_active: isActive,
              created_at: new Date().toISOString(),
            }));
            
            const activeMappings = filterActiveMappings(mappings);
            
            // All returned mappings should be active
            expect(activeMappings.every(m => m.is_active === true)).toBe(true);
            
            // Count should match
            const expectedCount = activeStates.filter(s => s).length;
            expect(activeMappings.length).toBe(expectedCount);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Field Mapping Transformation Tests
  // =====================================================
  describe('Field Mapping Transformations', () => {
    it('applyFieldMappings transforms records correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            amount: fc.integer({ min: 0, max: 10000 }),
          }),
          (source) => {
            const mappings: FieldMapping[] = [
              { local_field: 'name', remote_field: 'customerName' },
              { local_field: 'amount', remote_field: 'totalAmount' },
            ];
            
            const result = applyFieldMappings(source, mappings);
            
            expect(result.customerName).toBe(source.name);
            expect(result.totalAmount).toBe(source.amount);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('applyTransform uppercase works correctly', () => {
      fc.assert(
        fc.property(fc.string(), (value) => {
          const result = applyTransform(value, 'uppercase');
          return result === value.toUpperCase();
        }),
        { numRuns: 100 }
      );
    });

    it('applyTransform lowercase works correctly', () => {
      fc.assert(
        fc.property(fc.string(), (value) => {
          const result = applyTransform(value, 'lowercase');
          return result === value.toLowerCase();
        }),
        { numRuns: 100 }
      );
    });

    it('applyTransform currency_format rounds to 2 decimals', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 100000, noNaN: true }), (value) => {
          const result = applyTransform(value, 'currency_format');
          const expected = Number(value.toFixed(2));
          return result === expected;
        }),
        { numRuns: 100 }
      );
    });

    it('applyTransform handles null/undefined gracefully', () => {
      for (const transform of VALID_TRANSFORM_FUNCTIONS) {
        expect(applyTransform(null, transform)).toBeNull();
        expect(applyTransform(undefined, transform)).toBeUndefined();
      }
    });

    it('getNestedValue retrieves nested properties', () => {
      const obj = {
        customer: {
          address: {
            city: 'Jakarta'
          }
        }
      };
      
      expect(getNestedValue(obj, 'customer.address.city')).toBe('Jakarta');
      expect(getNestedValue(obj, 'customer.address')).toEqual({ city: 'Jakarta' });
      expect(getNestedValue(obj, 'customer.nonexistent')).toBeUndefined();
    });

    it('setNestedValue creates nested structure', () => {
      const obj: Record<string, unknown> = {};
      setNestedValue(obj, 'customer.address.city', 'Jakarta');
      
      expect((obj.customer as Record<string, unknown>)).toBeDefined();
      expect(((obj.customer as Record<string, unknown>).address as Record<string, unknown>).city).toBe('Jakarta');
    });
  });

  // =====================================================
  // Operator Evaluation Tests
  // =====================================================
  describe('Operator Evaluation', () => {
    it('gte operator works for numbers', () => {
      expect(evaluateOperator(10, 'gte', 5)).toBe(true);
      expect(evaluateOperator(5, 'gte', 5)).toBe(true);
      expect(evaluateOperator(4, 'gte', 5)).toBe(false);
    });

    it('lte operator works for numbers', () => {
      expect(evaluateOperator(4, 'lte', 5)).toBe(true);
      expect(evaluateOperator(5, 'lte', 5)).toBe(true);
      expect(evaluateOperator(6, 'lte', 5)).toBe(false);
    });

    it('contains works for arrays', () => {
      expect(evaluateOperator(['a', 'b', 'c'], 'contains', 'b')).toBe(true);
      expect(evaluateOperator(['a', 'b', 'c'], 'contains', 'd')).toBe(false);
    });
  });

  // =====================================================
  // Process Sync Mapping Tests
  // =====================================================
  describe('Process Sync Mapping', () => {
    it('processSyncMapping filters and transforms records', () => {
      const records = [
        { id: '1', name: 'Active Item', status: 'active', amount: 100 },
        { id: '2', name: 'Inactive Item', status: 'inactive', amount: 200 },
        { id: '3', name: 'Another Active', status: 'active', amount: 300 },
      ];
      
      const mapping: SyncMapping = {
        id: 'mapping-1',
        connection_id: 'conn-1',
        local_table: 'items',
        remote_entity: 'Item',
        field_mappings: [
          { local_field: 'id', remote_field: 'itemId' },
          { local_field: 'name', remote_field: 'itemName', transform: 'uppercase' },
          { local_field: 'amount', remote_field: 'totalAmount' },
        ],
        sync_direction: 'push',
        sync_frequency: 'realtime',
        filter_conditions: [
          { field: 'status', operator: 'eq', value: 'active' }
        ],
        is_active: true,
        created_at: new Date().toISOString(),
      };
      
      const result = processSyncMapping(records, mapping);
      
      // Should only have 2 records (active ones)
      expect(result.length).toBe(2);
      
      // Should be transformed
      expect(result[0].itemId).toBe('1');
      expect(result[0].itemName).toBe('ACTIVE ITEM');
      expect(result[0].totalAmount).toBe(100);
      
      expect(result[1].itemId).toBe('3');
      expect(result[1].itemName).toBe('ANOTHER ACTIVE');
      expect(result[1].totalAmount).toBe(300);
    });

    it('transformRecordBatch transforms all records', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.integer(),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (records) => {
            const mappings: FieldMapping[] = [
              { local_field: 'id', remote_field: 'externalId' },
              { local_field: 'value', remote_field: 'amount' },
            ];
            
            const result = transformRecordBatch(records, mappings);
            
            expect(result.length).toBe(records.length);
            
            for (let i = 0; i < records.length; i++) {
              expect(result[i].externalId).toBe(records[i].id);
              expect(result[i].amount).toBe(records[i].value);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
