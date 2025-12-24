// =====================================================
// v0.69: SYNC LOG UTILS PROPERTY TESTS
// Property 9: Sync Log State Machine
// Property 10: Sync Log Completeness
// Validates: Requirements 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidStateTransition,
  isTerminalState,
  getValidNextStates,
  validateSyncLogInput,
  prepareSyncLogForCreate,
  prepareSyncLogForUpdate,
  prepareSyncCompletion,
  prepareSyncFailure,
  prepareSyncProgress,
  buildSyncLogFilters,
  filterSyncLogs,
  calculateSyncStats,
  getMostRecentSync,
  getRunningsyncs,
  getFailedSyncs,
  validateSyncLogCompleteness,
  validateRecordCountConsistency,
  calculateSyncDuration,
  formatSyncDuration,
  createSyncError,
  groupErrorsByCode,
  getUniqueErrorCodes,
} from '@/lib/sync-log-utils';
import {
  type SyncLog,
  type CreateSyncLogInput,
  type SyncStatus,
  type SyncError,
  VALID_SYNC_STATUSES,
} from '@/types/integration';

// =====================================================
// ARBITRARIES (Generators)
// =====================================================

const uuidArb = fc.uuid();
const syncTypeArb = fc.constantFrom('push', 'pull', 'full_sync') as fc.Arbitrary<'push' | 'pull' | 'full_sync'>;
const syncStatusArb = fc.constantFrom(...VALID_SYNC_STATUSES);
const isoDateArb = fc.integer({ min: 1704067200000, max: 1767225600000 }).map(ts => new Date(ts).toISOString());

const syncLogInputArb: fc.Arbitrary<CreateSyncLogInput> = fc.record({
  connection_id: uuidArb,
  mapping_id: fc.option(uuidArb, { nil: null }),
  sync_type: syncTypeArb,
});

const syncErrorArb: fc.Arbitrary<SyncError> = fc.record({
  record_id: uuidArb,
  error_code: fc.stringMatching(/^[A-Z_]{3,20}$/),
  error_message: fc.string({ minLength: 1, maxLength: 100 }),
  timestamp: isoDateArb,
});

const syncLogArb: fc.Arbitrary<SyncLog> = fc.record({
  id: uuidArb,
  connection_id: uuidArb,
  mapping_id: fc.option(uuidArb, { nil: null }),
  sync_type: syncTypeArb,
  started_at: isoDateArb,
  completed_at: fc.option(isoDateArb, { nil: null }),
  records_processed: fc.integer({ min: 0, max: 10000 }),
  records_created: fc.integer({ min: 0, max: 5000 }),
  records_updated: fc.integer({ min: 0, max: 5000 }),
  records_failed: fc.integer({ min: 0, max: 1000 }),
  status: syncStatusArb,
  error_details: fc.option(fc.array(syncErrorArb, { minLength: 0, maxLength: 5 }), { nil: null }),
  created_at: isoDateArb,
});

describe('Sync Log Utils Property Tests', () => {
  // =====================================================
  // Property 9: Sync Log State Machine
  // Validates: Requirements 6.3, 6.4, 6.5, 6.6
  // =====================================================
  describe('Property 9: Sync Log State Machine', () => {
    it('running state can transition to terminal states', () => {
      const validTargets = getValidNextStates('running');
      
      expect(validTargets).toContain('completed');
      expect(validTargets).toContain('failed');
      expect(validTargets).toContain('partial');
      expect(validTargets.length).toBe(3);
    });

    it('terminal states have no valid transitions', () => {
      const terminalStates: SyncStatus[] = ['completed', 'failed', 'partial'];
      
      for (const state of terminalStates) {
        expect(isTerminalState(state)).toBe(true);
        expect(getValidNextStates(state)).toHaveLength(0);
      }
    });

    it('running is not a terminal state', () => {
      expect(isTerminalState('running')).toBe(false);
    });

    it('isValidStateTransition correctly validates transitions', () => {
      // Valid transitions from running
      expect(isValidStateTransition('running', 'completed')).toBe(true);
      expect(isValidStateTransition('running', 'failed')).toBe(true);
      expect(isValidStateTransition('running', 'partial')).toBe(true);
      
      // Invalid transitions from running
      expect(isValidStateTransition('running', 'running')).toBe(false);
      
      // Invalid transitions from terminal states
      expect(isValidStateTransition('completed', 'running')).toBe(false);
      expect(isValidStateTransition('completed', 'failed')).toBe(false);
      expect(isValidStateTransition('failed', 'completed')).toBe(false);
      expect(isValidStateTransition('partial', 'completed')).toBe(false);
    });

    it('prepareSyncLogForUpdate rejects invalid transitions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('completed', 'failed', 'partial') as fc.Arbitrary<SyncStatus>,
          syncStatusArb,
          (currentStatus, newStatus) => {
            const result = prepareSyncLogForUpdate({ status: newStatus }, currentStatus);
            
            // Terminal states should reject all status updates
            if (result.valid) {
              // Should not be valid for terminal states
              return false;
            }
            
            expect(result.errors.length).toBeGreaterThan(0);
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('prepareSyncLogForUpdate accepts valid transitions from running', () => {
      const validTargets: SyncStatus[] = ['completed', 'failed', 'partial'];
      
      for (const target of validTargets) {
        const result = prepareSyncLogForUpdate({ status: target }, 'running');
        expect(result.valid).toBe(true);
      }
    });
  });

  // =====================================================
  // Property 10: Sync Log Completeness
  // Validates: Requirements 8.1, 8.2, 8.3, 8.4
  // =====================================================
  describe('Property 10: Sync Log Completeness', () => {
    it('prepareSyncLogForCreate sets initial state correctly', () => {
      fc.assert(
        fc.property(syncLogInputArb, (input) => {
          const result = prepareSyncLogForCreate(input);
          
          if (!result.valid) return true;
          
          const data = result.data;
          
          // Initial state should be running
          expect(data.status).toBe('running');
          
          // Timestamps
          expect(data.started_at).toBeDefined();
          expect(data.completed_at).toBeNull();
          
          // Initial counts should be zero
          expect(data.records_processed).toBe(0);
          expect(data.records_created).toBe(0);
          expect(data.records_updated).toBe(0);
          expect(data.records_failed).toBe(0);
          
          // No errors initially
          expect(data.error_details).toBeNull();
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('prepareSyncCompletion sets correct status based on failures', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 100 }),
          (processed, created, updated, failed) => {
            const result = prepareSyncCompletion({
              records_processed: processed,
              records_created: created,
              records_updated: updated,
              records_failed: failed,
            });
            
            // Status should be 'partial' if there are failures, 'completed' otherwise
            if (failed > 0) {
              expect(result.status).toBe('partial');
            } else {
              expect(result.status).toBe('completed');
            }
            
            // completed_at should be set
            expect(result.completed_at).toBeDefined();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('prepareSyncFailure always sets failed status', () => {
      fc.assert(
        fc.property(
          fc.array(syncErrorArb, { minLength: 1, maxLength: 5 }),
          (errors) => {
            const result = prepareSyncFailure(errors);
            
            expect(result.status).toBe('failed');
            expect(result.completed_at).toBeDefined();
            expect(result.error_details).toEqual(errors);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('validateSyncLogCompleteness checks all required fields', () => {
      fc.assert(
        fc.property(syncLogArb, (log) => {
          const result = validateSyncLogCompleteness(log);
          
          // If complete, no missing fields
          if (result.complete) {
            expect(result.missing).toHaveLength(0);
          }
          
          // Terminal states should have completed_at
          if (isTerminalState(log.status) && !log.completed_at) {
            expect(result.complete).toBe(false);
            expect(result.missing).toContain('completed_at (required for terminal state)');
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('validateRecordCountConsistency checks sum equality', () => {
      // Consistent counts
      const consistentLog: SyncLog = {
        id: 'id1', connection_id: 'conn1', mapping_id: null, sync_type: 'push',
        started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
        records_processed: 100, records_created: 50, records_updated: 40, records_failed: 10,
        status: 'partial', error_details: null, created_at: new Date().toISOString(),
      };
      expect(validateRecordCountConsistency(consistentLog)).toBe(true);
      
      // Inconsistent counts
      const inconsistentLog: SyncLog = {
        ...consistentLog,
        records_processed: 100, records_created: 50, records_updated: 40, records_failed: 5,
      };
      expect(validateRecordCountConsistency(inconsistentLog)).toBe(false);
    });
  });

  // =====================================================
  // Sync Log Filtering Tests
  // =====================================================
  describe('Sync Log Filtering', () => {
    it('filterSyncLogs filters by connection_id', () => {
      fc.assert(
        fc.property(
          fc.array(syncLogArb, { minLength: 0, maxLength: 20 }),
          uuidArb,
          (logs, connectionId) => {
            const filtered = filterSyncLogs(logs, { connection_id: connectionId });
            
            for (const log of filtered) {
              expect(log.connection_id).toBe(connectionId);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filterSyncLogs filters by status', () => {
      fc.assert(
        fc.property(
          fc.array(syncLogArb, { minLength: 0, maxLength: 20 }),
          syncStatusArb,
          (logs, status) => {
            const filtered = filterSyncLogs(logs, { status });
            
            for (const log of filtered) {
              expect(log.status).toBe(status);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('buildSyncLogFilters creates correct filter conditions', () => {
      const filters = {
        connection_id: 'conn-123',
        status: 'completed' as SyncStatus,
        from_date: '2024-01-01',
        to_date: '2024-12-31',
      };
      
      const conditions = buildSyncLogFilters(filters);
      
      expect(conditions.length).toBe(4);
      expect(conditions.find(c => c.field === 'connection_id')).toBeDefined();
      expect(conditions.find(c => c.field === 'status')).toBeDefined();
      expect(conditions.find(c => c.field === 'started_at' && c.operator === 'gte')).toBeDefined();
      expect(conditions.find(c => c.field === 'started_at' && c.operator === 'lte')).toBeDefined();
    });
  });

  // =====================================================
  // Sync Statistics Tests
  // =====================================================
  describe('Sync Statistics', () => {
    it('calculateSyncStats aggregates correctly', () => {
      const logs: SyncLog[] = [
        { id: '1', connection_id: 'c1', mapping_id: null, sync_type: 'push', started_at: '2024-01-01', completed_at: '2024-01-01', records_processed: 100, records_created: 50, records_updated: 50, records_failed: 0, status: 'completed', error_details: null, created_at: '2024-01-01' },
        { id: '2', connection_id: 'c1', mapping_id: null, sync_type: 'push', started_at: '2024-01-02', completed_at: '2024-01-02', records_processed: 50, records_created: 25, records_updated: 20, records_failed: 5, status: 'partial', error_details: null, created_at: '2024-01-02' },
        { id: '3', connection_id: 'c1', mapping_id: null, sync_type: 'push', started_at: '2024-01-03', completed_at: '2024-01-03', records_processed: 0, records_created: 0, records_updated: 0, records_failed: 0, status: 'failed', error_details: [], created_at: '2024-01-03' },
      ];
      
      const stats = calculateSyncStats(logs);
      
      expect(stats.total_syncs).toBe(3);
      expect(stats.successful_syncs).toBe(1);
      expect(stats.failed_syncs).toBe(1);
      expect(stats.partial_syncs).toBe(1);
      expect(stats.total_records_processed).toBe(150);
      expect(stats.total_records_created).toBe(75);
      expect(stats.total_records_updated).toBe(70);
      expect(stats.total_records_failed).toBe(5);
      expect(stats.success_rate).toBeCloseTo(33.33, 1);
    });

    it('getMostRecentSync returns most recent for connection', () => {
      const logs: SyncLog[] = [
        { id: '1', connection_id: 'c1', mapping_id: null, sync_type: 'push', started_at: '2024-01-01T10:00:00Z', completed_at: null, records_processed: 0, records_created: 0, records_updated: 0, records_failed: 0, status: 'running', error_details: null, created_at: '2024-01-01' },
        { id: '2', connection_id: 'c1', mapping_id: null, sync_type: 'push', started_at: '2024-01-03T10:00:00Z', completed_at: null, records_processed: 0, records_created: 0, records_updated: 0, records_failed: 0, status: 'running', error_details: null, created_at: '2024-01-03' },
        { id: '3', connection_id: 'c2', mapping_id: null, sync_type: 'push', started_at: '2024-01-05T10:00:00Z', completed_at: null, records_processed: 0, records_created: 0, records_updated: 0, records_failed: 0, status: 'running', error_details: null, created_at: '2024-01-05' },
      ];
      
      const mostRecent = getMostRecentSync(logs, 'c1');
      expect(mostRecent?.id).toBe('2');
      
      const noMatch = getMostRecentSync(logs, 'c999');
      expect(noMatch).toBeNull();
    });

    it('getRunningsyncs returns only running syncs', () => {
      fc.assert(
        fc.property(
          fc.array(syncLogArb, { minLength: 0, maxLength: 20 }),
          (logs) => {
            const running = getRunningsyncs(logs);
            
            for (const log of running) {
              expect(log.status).toBe('running');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getFailedSyncs returns only failed syncs', () => {
      fc.assert(
        fc.property(
          fc.array(syncLogArb, { minLength: 0, maxLength: 20 }),
          (logs) => {
            const failed = getFailedSyncs(logs);
            
            for (const log of failed) {
              expect(log.status).toBe('failed');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Duration Calculation Tests
  // =====================================================
  describe('Duration Calculation', () => {
    it('calculateSyncDuration returns null for incomplete syncs', () => {
      const log: SyncLog = {
        id: '1', connection_id: 'c1', mapping_id: null, sync_type: 'push',
        started_at: '2024-01-01T10:00:00Z', completed_at: null,
        records_processed: 0, records_created: 0, records_updated: 0, records_failed: 0,
        status: 'running', error_details: null, created_at: '2024-01-01',
      };
      
      expect(calculateSyncDuration(log)).toBeNull();
    });

    it('calculateSyncDuration returns correct duration', () => {
      const log: SyncLog = {
        id: '1', connection_id: 'c1', mapping_id: null, sync_type: 'push',
        started_at: '2024-01-01T10:00:00Z', completed_at: '2024-01-01T10:05:00Z',
        records_processed: 100, records_created: 100, records_updated: 0, records_failed: 0,
        status: 'completed', error_details: null, created_at: '2024-01-01',
      };
      
      const duration = calculateSyncDuration(log);
      expect(duration).toBe(5 * 60 * 1000); // 5 minutes in ms
    });

    it('formatSyncDuration formats correctly', () => {
      expect(formatSyncDuration(null)).toBe('In progress');
      expect(formatSyncDuration(500)).toBe('500ms');
      expect(formatSyncDuration(5000)).toBe('5.0s');
      expect(formatSyncDuration(120000)).toBe('2.0m');
      expect(formatSyncDuration(7200000)).toBe('2.0h');
    });
  });

  // =====================================================
  // Error Handling Tests
  // =====================================================
  describe('Error Handling', () => {
    it('createSyncError creates valid error object', () => {
      fc.assert(
        fc.property(
          uuidArb,
          fc.stringMatching(/^[A-Z_]{3,20}$/),
          fc.string({ minLength: 1, maxLength: 100 }),
          (recordId, errorCode, errorMessage) => {
            const error = createSyncError(recordId, errorCode, errorMessage);
            
            expect(error.record_id).toBe(recordId);
            expect(error.error_code).toBe(errorCode);
            expect(error.error_message).toBe(errorMessage);
            expect(error.timestamp).toBeDefined();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('groupErrorsByCode groups correctly', () => {
      const errors: SyncError[] = [
        { record_id: '1', error_code: 'VALIDATION_ERROR', error_message: 'msg1', timestamp: '2024-01-01' },
        { record_id: '2', error_code: 'NETWORK_ERROR', error_message: 'msg2', timestamp: '2024-01-01' },
        { record_id: '3', error_code: 'VALIDATION_ERROR', error_message: 'msg3', timestamp: '2024-01-01' },
      ];
      
      const grouped = groupErrorsByCode(errors);
      
      expect(grouped.get('VALIDATION_ERROR')?.length).toBe(2);
      expect(grouped.get('NETWORK_ERROR')?.length).toBe(1);
    });

    it('getUniqueErrorCodes returns unique codes', () => {
      fc.assert(
        fc.property(
          fc.array(syncErrorArb, { minLength: 0, maxLength: 20 }),
          (errors) => {
            const uniqueCodes = getUniqueErrorCodes(errors);
            
            // Should have no duplicates
            expect(new Set(uniqueCodes).size).toBe(uniqueCodes.length);
            
            // All error codes should be in the result
            for (const error of errors) {
              expect(uniqueCodes).toContain(error.error_code);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Input Validation Tests
  // =====================================================
  describe('Input Validation', () => {
    it('validateSyncLogInput accepts valid input', () => {
      fc.assert(
        fc.property(syncLogInputArb, (input) => {
          const result = validateSyncLogInput(input);
          
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('validateSyncLogInput rejects empty connection_id', () => {
      const result = validateSyncLogInput({
        connection_id: '',
        sync_type: 'push',
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Connection ID is required');
    });

    it('validateSyncLogInput rejects invalid sync_type', () => {
      const result = validateSyncLogInput({
        connection_id: 'conn-1',
        sync_type: 'invalid' as 'push',
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid sync type');
    });
  });
});
