// =====================================================
// v0.69: INTEGRATION UTILS PROPERTY TESTS
// Property 2: Enum Value Validation
// Validates: Requirements 1.6, 1.7, 2.3, 2.4
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateIntegrationType, validateProvider, validateSyncDirection, validateSyncFrequency,
  validateSyncStatus, validateTransformFunction, validateFilterOperator,
  validateConnectionCode, validateConnectionName, validateConnectionInput,
  validateFieldMapping, validateFilterCondition, validateSyncMappingInput,
  isTokenExpired, calculateRetryDelay, formatSyncStatus, formatIntegrationType,
  formatProvider, getSyncStatusColor,
} from '@/lib/integration-utils';
import {
  VALID_INTEGRATION_TYPES, VALID_PROVIDERS, VALID_SYNC_DIRECTIONS, VALID_SYNC_FREQUENCIES,
  VALID_SYNC_STATUSES, VALID_TRANSFORM_FUNCTIONS, VALID_FILTER_OPERATORS,
  type IntegrationType, type Provider, type SyncDirection, type SyncFrequency,
  type SyncStatus, type CreateConnectionInput,
} from '@/types/integration';

describe('Integration Utils Property Tests', () => {
  describe('Property 2: Enum Value Validation', () => {
    it('accepts valid integration types', () => {
      fc.assert(fc.property(fc.constantFrom(...VALID_INTEGRATION_TYPES), t => validateIntegrationType(t)), { numRuns: 100 });
    });
    it('rejects invalid integration types', () => {
      fc.assert(fc.property(fc.string().filter(s => !VALID_INTEGRATION_TYPES.includes(s as IntegrationType)), t => !validateIntegrationType(t)), { numRuns: 100 });
    });
    it('accepts valid providers', () => {
      fc.assert(fc.property(fc.constantFrom(...VALID_PROVIDERS), p => validateProvider(p)), { numRuns: 100 });
    });
    it('rejects invalid providers', () => {
      fc.assert(fc.property(fc.string().filter(s => !VALID_PROVIDERS.includes(s as Provider)), p => !validateProvider(p)), { numRuns: 100 });
    });
    it('accepts valid sync directions', () => {
      fc.assert(fc.property(fc.constantFrom(...VALID_SYNC_DIRECTIONS), d => validateSyncDirection(d)), { numRuns: 100 });
    });
    it('rejects invalid sync directions', () => {
      fc.assert(fc.property(fc.string().filter(s => !VALID_SYNC_DIRECTIONS.includes(s as SyncDirection)), d => !validateSyncDirection(d)), { numRuns: 100 });
    });
    it('accepts valid sync frequencies', () => {
      fc.assert(fc.property(fc.constantFrom(...VALID_SYNC_FREQUENCIES), f => validateSyncFrequency(f)), { numRuns: 100 });
    });
    it('rejects invalid sync frequencies', () => {
      fc.assert(fc.property(fc.string().filter(s => !VALID_SYNC_FREQUENCIES.includes(s as SyncFrequency)), f => !validateSyncFrequency(f)), { numRuns: 100 });
    });

    it('accepts valid sync statuses', () => {
      fc.assert(fc.property(fc.constantFrom(...VALID_SYNC_STATUSES), s => validateSyncStatus(s)), { numRuns: 100 });
    });
    it('rejects invalid sync statuses', () => {
      fc.assert(fc.property(fc.string().filter(s => !VALID_SYNC_STATUSES.includes(s as SyncStatus)), s => !validateSyncStatus(s)), { numRuns: 100 });
    });
    it('accepts valid transform functions', () => {
      fc.assert(fc.property(fc.constantFrom(...VALID_TRANSFORM_FUNCTIONS), t => validateTransformFunction(t)), { numRuns: 100 });
    });
    it('rejects invalid transform functions', () => {
      fc.assert(fc.property(fc.string().filter(s => !VALID_TRANSFORM_FUNCTIONS.includes(s as any)), t => !validateTransformFunction(t)), { numRuns: 100 });
    });
    it('accepts valid filter operators', () => {
      fc.assert(fc.property(fc.constantFrom(...VALID_FILTER_OPERATORS), o => validateFilterOperator(o)), { numRuns: 100 });
    });
    it('rejects invalid filter operators', () => {
      fc.assert(fc.property(fc.string().filter(s => !VALID_FILTER_OPERATORS.includes(s as any)), o => !validateFilterOperator(o)), { numRuns: 100 });
    });
  });

  describe('Connection Validation', () => {
    const codeChars = 'abcdefghijklmnopqrstuvwxyz0123456789_-';
    const validCodeArb = fc.array(fc.constantFrom(...codeChars.split('')), { minLength: 1, maxLength: 50 }).map(arr => arr.join(''));

    it('accepts valid connection codes', () => {
      fc.assert(fc.property(validCodeArb, c => validateConnectionCode(c)), { numRuns: 100 });
    });
    it('rejects empty connection codes', () => {
      expect(validateConnectionCode('')).toBe(false);
      expect(validateConnectionCode('   ')).toBe(false);
    });
    it('rejects codes over 50 chars', () => {
      const longCode = 'a'.repeat(51);
      expect(validateConnectionCode(longCode)).toBe(false);
    });
    it('accepts valid connection names', () => {
      fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), n => validateConnectionName(n)), { numRuns: 100 });
    });
    it('rejects empty connection names', () => {
      expect(validateConnectionName('')).toBe(false);
      expect(validateConnectionName('   ')).toBe(false);
    });
    it('rejects names over 100 chars', () => {
      const longName = 'a'.repeat(101);
      expect(validateConnectionName(longName)).toBe(false);
    });
    it('validates complete connection inputs', () => {
      fc.assert(fc.property(
        fc.record({
          connection_code: validCodeArb,
          connection_name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          integration_type: fc.constantFrom(...VALID_INTEGRATION_TYPES),
          provider: fc.constantFrom(...VALID_PROVIDERS),
        }),
        input => {
          const result = validateConnectionInput(input as CreateConnectionInput);
          return result.valid && result.errors.length === 0;
        }
      ), { numRuns: 100 });
    });
    it('returns errors for invalid inputs', () => {
      const result = validateConnectionInput({ connection_code: '', connection_name: '', integration_type: '' as IntegrationType, provider: '' as Provider });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });


  describe('Field Mapping Validation', () => {
    it('accepts valid field mappings', () => {
      fc.assert(fc.property(
        fc.record({ local_field: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), remote_field: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0) }),
        m => validateFieldMapping(m)
      ), { numRuns: 100 });
    });
    it('rejects empty local_field', () => { expect(validateFieldMapping({ local_field: '', remote_field: 'test' })).toBe(false); });
    it('rejects empty remote_field', () => { expect(validateFieldMapping({ local_field: 'test', remote_field: '' })).toBe(false); });
    it('rejects invalid transform', () => { expect(validateFieldMapping({ local_field: 'test', remote_field: 'test', transform: 'invalid' as any })).toBe(false); });
  });

  describe('Filter Condition Validation', () => {
    it('accepts valid filter conditions', () => {
      fc.assert(fc.property(
        fc.record({ field: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), operator: fc.constantFrom(...VALID_FILTER_OPERATORS), value: fc.oneof(fc.string(), fc.integer(), fc.boolean()) }),
        c => validateFilterCondition(c)
      ), { numRuns: 100 });
    });
    it('rejects empty field', () => { expect(validateFilterCondition({ field: '', operator: 'eq', value: 'test' })).toBe(false); });
    it('rejects invalid operator', () => { expect(validateFilterCondition({ field: 'test', operator: 'invalid' as any, value: 'test' })).toBe(false); });
  });

  describe('Sync Mapping Validation', () => {
    it('rejects empty connection_id', () => {
      const result = validateSyncMappingInput({ connection_id: '', local_table: 'invoices', remote_entity: 'Invoice', field_mappings: [{ local_field: 'id', remote_field: 'invoiceId' }] });
      expect(result.valid).toBe(false);
    });
    it('rejects empty field_mappings', () => {
      const result = validateSyncMappingInput({ connection_id: '123e4567-e89b-12d3-a456-426614174000', local_table: 'invoices', remote_entity: 'Invoice', field_mappings: [] });
      expect(result.valid).toBe(false);
    });
  });

  describe('Token Expiration', () => {
    it('returns true for null token', () => { expect(isTokenExpired(null)).toBe(true); });
    it('returns true for expired tokens', () => { expect(isTokenExpired(new Date(Date.now() - 60000).toISOString())).toBe(true); });
    it('returns true for tokens expiring within 5 min', () => { expect(isTokenExpired(new Date(Date.now() + 2 * 60 * 1000).toISOString())).toBe(true); });
    it('returns false for tokens expiring after 5 min', () => { expect(isTokenExpired(new Date(Date.now() + 10 * 60 * 1000).toISOString())).toBe(false); });
  });

  describe('Retry Delay', () => {
    it('calculates exponential backoff', () => {
      fc.assert(fc.property(fc.integer({ min: 0, max: 4 }), r => calculateRetryDelay(r) === 1000 * Math.pow(2, r)), { numRuns: 100 });
    });
    it('caps at max delay', () => { expect(calculateRetryDelay(20, 1000, 30000)).toBe(30000); });
    it('treats negative as 0', () => { expect(calculateRetryDelay(-5)).toBe(1000); });
  });

  describe('Formatting', () => {
    it('formats sync statuses', () => { fc.assert(fc.property(fc.constantFrom(...VALID_SYNC_STATUSES), s => typeof formatSyncStatus(s) === 'string' && formatSyncStatus(s).length > 0), { numRuns: 100 }); });
    it('returns color classes', () => { fc.assert(fc.property(fc.constantFrom(...VALID_SYNC_STATUSES), s => getSyncStatusColor(s).includes('text-')), { numRuns: 100 }); });
    it('formats integration types', () => { fc.assert(fc.property(fc.constantFrom(...VALID_INTEGRATION_TYPES), t => typeof formatIntegrationType(t) === 'string' && formatIntegrationType(t).length > 0), { numRuns: 100 }); });
    it('formats providers', () => { fc.assert(fc.property(fc.constantFrom(...VALID_PROVIDERS), p => typeof formatProvider(p) === 'string' && formatProvider(p).length > 0), { numRuns: 100 }); });
  });
});
