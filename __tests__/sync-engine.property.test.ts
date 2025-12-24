// =====================================================
// v0.69: SYNC ENGINE PROPERTY TESTS
// Property 11: Retry Logic
// Validates: Requirements 9.1, 9.2, 9.3, 9.4
// =====================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  retryWithBackoff,
  isRetryableError,
  isTokenExpiredError,
  sleep,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
  type RetryableOperation,
  type TokenRefreshFn,
  createSyncContext,
  recordCreate,
  recordUpdate,
  recordFailure,
  contextToResult,
  updateContextFromResults,
  processSyncBatch,
  checkTokenStatus,
  createTokenRefreshFn,
  type SyncRecord,
  type RecordSyncResult,
  type ExternalApiAdapter,
} from '@/lib/sync-engine';
import { calculateRetryDelay } from '@/lib/integration-utils';
import type { IntegrationConnection, ExternalIdMapping } from '@/types/integration';

// =====================================================
// ARBITRARIES (Generators)
// =====================================================

const uuidArb = fc.uuid();

const retryableErrorCodeArb = fc.constantFrom(
  'NETWORK_ERROR',
  'TIMEOUT',
  'RATE_LIMITED',
  'SERVER_ERROR',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  '500',
  '502',
  '503',
  '504',
  '429'
);

const nonRetryableErrorCodeArb = fc.constantFrom(
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'FORBIDDEN',
  'BAD_REQUEST',
  '400',
  '403',
  '404',
  '422'
);

const tokenExpiredErrorCodeArb = fc.constantFrom(
  'TOKEN_EXPIRED',
  '401',
  'UNAUTHORIZED',
  'INVALID_TOKEN'
);

const retryConfigArb: fc.Arbitrary<RetryConfig> = fc.record({
  maxRetries: fc.integer({ min: 0, max: 5 }),
  baseDelayMs: fc.integer({ min: 100, max: 2000 }),
  maxDelayMs: fc.integer({ min: 5000, max: 60000 }),
});

const syncRecordArb: fc.Arbitrary<SyncRecord> = fc.record({
  localId: uuidArb,
  data: fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue()),
});

describe('Sync Engine Property Tests', () => {
  // =====================================================
  // Property 11: Retry Logic
  // Validates: Requirements 9.1, 9.2, 9.3, 9.4
  // =====================================================
  describe('Property 11: Retry Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // =====================================================
    // 9.1: Retry up to 3 times with exponential backoff
    // =====================================================
    describe('Requirement 9.1: Retry with exponential backoff', () => {
      it('isRetryableError correctly identifies retryable errors', () => {
        fc.assert(
          fc.property(retryableErrorCodeArb, (errorCode) => {
            expect(isRetryableError(errorCode)).toBe(true);
          }),
          { numRuns: 100 }
        );
      });

      it('isRetryableError correctly rejects non-retryable errors', () => {
        fc.assert(
          fc.property(nonRetryableErrorCodeArb, (errorCode) => {
            expect(isRetryableError(errorCode)).toBe(false);
          }),
          { numRuns: 100 }
        );
      });

      it('calculateRetryDelay uses exponential backoff', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 10 }),
            fc.integer({ min: 100, max: 2000 }),
            fc.integer({ min: 5000, max: 60000 }),
            (retryCount, baseDelay, maxDelay) => {
              const delay = calculateRetryDelay(retryCount, baseDelay, maxDelay);
              
              // Delay should be at least baseDelay * 2^retryCount (capped at maxDelay)
              const expectedDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
              expect(delay).toBe(expectedDelay);
              
              // Delay should never exceed maxDelay
              expect(delay).toBeLessThanOrEqual(maxDelay);
              
              return true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('retryWithBackoff retries up to maxRetries times on retryable errors', async () => {
        vi.useRealTimers(); // Use real timers for this test
        
        let callCount = 0;
        const operation: RetryableOperation<string> = async () => {
          callCount++;
          return { success: false, error: 'Network error', errorCode: 'NETWORK_ERROR' };
        };

        const config: RetryConfig = { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 };
        const result = await retryWithBackoff(operation, config);

        // Should have called operation maxRetries + 1 times (initial + retries)
        expect(callCount).toBe(4);
        expect(result.success).toBe(false);
        expect(result.retryCount).toBe(3);
      });

      it('retryWithBackoff succeeds immediately on success', async () => {
        vi.useRealTimers();
        
        let callCount = 0;
        const operation: RetryableOperation<string> = async () => {
          callCount++;
          return { success: true, data: 'result' };
        };

        const result = await retryWithBackoff(operation, DEFAULT_RETRY_CONFIG);

        expect(callCount).toBe(1);
        expect(result.success).toBe(true);
        expect(result.data).toBe('result');
        expect(result.retryCount).toBe(0);
      });

      it('retryWithBackoff does not retry non-retryable errors', async () => {
        vi.useRealTimers();
        
        let callCount = 0;
        const operation: RetryableOperation<string> = async () => {
          callCount++;
          return { success: false, error: 'Validation error', errorCode: 'VALIDATION_ERROR' };
        };

        const result = await retryWithBackoff(operation, DEFAULT_RETRY_CONFIG);

        expect(callCount).toBe(1);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('VALIDATION_ERROR');
        expect(result.retryCount).toBe(0);
      });
    });

    // =====================================================
    // 9.2: Individual record failures don't stop batch
    // =====================================================
    describe('Requirement 9.2: Continue on individual record failures', () => {
      it('processSyncBatch continues processing after individual failures', async () => {
        vi.useRealTimers();
        
        const records: SyncRecord[] = [
          { localId: 'id1', data: { name: 'Record 1' } },
          { localId: 'id2', data: { name: 'Record 2' } },
          { localId: 'id3', data: { name: 'Record 3' } },
        ];

        let createCallCount = 0;
        const adapter: ExternalApiAdapter = {
          createRecord: async () => {
            createCallCount++;
            // Fail on second record
            if (createCallCount === 2) {
              return { success: false, error: 'Validation error', errorCode: 'VALIDATION_ERROR' };
            }
            return { success: true, externalId: `ext-${createCallCount}` };
          },
          updateRecord: async () => ({ success: true }),
        };

        const existingMappings = new Map<string, ExternalIdMapping>();
        const config: RetryConfig = { maxRetries: 0, baseDelayMs: 10, maxDelayMs: 100 };

        const results = await processSyncBatch(records, existingMappings, adapter, config);

        // All records should be processed
        expect(results.length).toBe(3);
        expect(createCallCount).toBe(3);

        // First and third should succeed, second should fail
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(false);
        expect(results[2].success).toBe(true);
      });

      it('updateContextFromResults correctly aggregates results', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                localId: uuidArb,
                success: fc.boolean(),
                operation: fc.constantFrom('create', 'update') as fc.Arbitrary<'create' | 'update'>,
                externalId: fc.option(uuidArb, { nil: undefined }),
                error: fc.option(fc.string(), { nil: undefined }),
                errorCode: fc.option(fc.string(), { nil: undefined }),
              }),
              { minLength: 0, maxLength: 20 }
            ),
            (results) => {
              const context = createSyncContext('conn-1', 'map-1', 'push');
              const updatedContext = updateContextFromResults(context, results);

              // Count expected values
              const expectedProcessed = results.length;
              const expectedCreated = results.filter(r => r.success && r.operation === 'create').length;
              const expectedUpdated = results.filter(r => r.success && r.operation === 'update').length;
              const expectedFailed = results.filter(r => !r.success).length;

              expect(updatedContext.recordsProcessed).toBe(expectedProcessed);
              expect(updatedContext.recordsCreated).toBe(expectedCreated);
              expect(updatedContext.recordsUpdated).toBe(expectedUpdated);
              expect(updatedContext.recordsFailed).toBe(expectedFailed);
              expect(updatedContext.errors.length).toBe(expectedFailed);

              return true;
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    // =====================================================
    // 9.3: Token refresh on expiration
    // =====================================================
    describe('Requirement 9.3: Token refresh on expiration', () => {
      it('isTokenExpiredError correctly identifies token errors', () => {
        fc.assert(
          fc.property(tokenExpiredErrorCodeArb, (errorCode) => {
            expect(isTokenExpiredError(errorCode)).toBe(true);
          }),
          { numRuns: 100 }
        );
      });

      it('isTokenExpiredError rejects non-token errors', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('NETWORK_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND'),
            (errorCode) => {
              expect(isTokenExpiredError(errorCode)).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('retryWithBackoff attempts token refresh on token expired error', async () => {
        vi.useRealTimers();
        
        let operationCallCount = 0;
        let tokenRefreshCalled = false;

        const operation: RetryableOperation<string> = async () => {
          operationCallCount++;
          if (operationCallCount === 1) {
            return { success: false, error: 'Token expired', errorCode: 'TOKEN_EXPIRED' };
          }
          return { success: true, data: 'result' };
        };

        const onTokenExpired: TokenRefreshFn = async () => {
          tokenRefreshCalled = true;
          return { success: true };
        };

        const result = await retryWithBackoff(operation, DEFAULT_RETRY_CONFIG, onTokenExpired);

        expect(tokenRefreshCalled).toBe(true);
        expect(result.success).toBe(true);
        expect(result.tokenRefreshed).toBe(true);
        expect(operationCallCount).toBe(2);
      });

      it('retryWithBackoff only refreshes token once', async () => {
        vi.useRealTimers();
        
        let tokenRefreshCount = 0;

        const operation: RetryableOperation<string> = async () => {
          return { success: false, error: 'Token expired', errorCode: 'TOKEN_EXPIRED' };
        };

        const onTokenExpired: TokenRefreshFn = async () => {
          tokenRefreshCount++;
          return { success: true };
        };

        const config: RetryConfig = { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 };
        await retryWithBackoff(operation, config, onTokenExpired);

        // Token should only be refreshed once
        expect(tokenRefreshCount).toBe(1);
      });
    });

    // =====================================================
    // 9.4: Mark connection for re-auth on refresh failure
    // =====================================================
    describe('Requirement 9.4: Mark connection for re-auth on refresh failure', () => {
      it('retryWithBackoff returns TOKEN_REFRESH_FAILED when refresh fails', async () => {
        vi.useRealTimers();
        
        const operation: RetryableOperation<string> = async () => {
          return { success: false, error: 'Token expired', errorCode: 'TOKEN_EXPIRED' };
        };

        const onTokenExpired: TokenRefreshFn = async () => {
          return { success: false, error: 'Refresh token invalid' };
        };

        const result = await retryWithBackoff(operation, DEFAULT_RETRY_CONFIG, onTokenExpired);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('TOKEN_REFRESH_FAILED');
        expect(result.tokenRefreshed).toBe(false);
      });

      it('checkTokenStatus identifies expired tokens requiring re-auth', () => {
        const connectionWithExpiredToken: IntegrationConnection = {
          id: 'conn-1',
          connection_code: 'TEST',
          connection_name: 'Test Connection',
          integration_type: 'accounting',
          provider: 'accurate',
          credentials: null,
          config: {},
          is_active: true,
          last_sync_at: null,
          last_error: null,
          access_token: 'expired-token',
          refresh_token: null, // No refresh token
          token_expires_at: '2020-01-01T00:00:00Z', // Expired
          created_by: null,
          created_at: new Date().toISOString(),
        };

        const status = checkTokenStatus(connectionWithExpiredToken);

        expect(status.valid).toBe(false);
        expect(status.expired).toBe(true);
        expect(status.requiresReauth).toBe(true);
      });

      it('checkTokenStatus identifies expired tokens with refresh available', () => {
        const connectionWithRefreshToken: IntegrationConnection = {
          id: 'conn-1',
          connection_code: 'TEST',
          connection_name: 'Test Connection',
          integration_type: 'accounting',
          provider: 'accurate',
          credentials: null,
          config: {},
          is_active: true,
          last_sync_at: null,
          last_error: null,
          access_token: 'expired-token',
          refresh_token: 'valid-refresh-token',
          token_expires_at: '2020-01-01T00:00:00Z', // Expired
          created_by: null,
          created_at: new Date().toISOString(),
        };

        const status = checkTokenStatus(connectionWithRefreshToken);

        expect(status.valid).toBe(false);
        expect(status.expired).toBe(true);
        expect(status.requiresReauth).toBe(false);
      });

      it('checkTokenStatus identifies valid tokens', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const connectionWithValidToken: IntegrationConnection = {
          id: 'conn-1',
          connection_code: 'TEST',
          connection_name: 'Test Connection',
          integration_type: 'accounting',
          provider: 'accurate',
          credentials: null,
          config: {},
          is_active: true,
          last_sync_at: null,
          last_error: null,
          access_token: 'valid-token',
          refresh_token: 'refresh-token',
          token_expires_at: futureDate.toISOString(),
          created_by: null,
          created_at: new Date().toISOString(),
        };

        const status = checkTokenStatus(connectionWithValidToken);

        expect(status.valid).toBe(true);
        expect(status.expired).toBe(false);
        expect(status.requiresReauth).toBe(false);
      });

      it('createTokenRefreshFn returns undefined when no refresh token', () => {
        const connectionWithoutRefresh: IntegrationConnection = {
          id: 'conn-1',
          connection_code: 'TEST',
          connection_name: 'Test Connection',
          integration_type: 'accounting',
          provider: 'accurate',
          credentials: null,
          config: {},
          is_active: true,
          last_sync_at: null,
          last_error: null,
          access_token: 'token',
          refresh_token: null,
          token_expires_at: null,
          created_by: null,
          created_at: new Date().toISOString(),
        };

        const refreshFn = createTokenRefreshFn(connectionWithoutRefresh, async () => ({ success: true }));

        expect(refreshFn).toBeUndefined();
      });

      it('createTokenRefreshFn returns function when refresh token exists', () => {
        const connectionWithRefresh: IntegrationConnection = {
          id: 'conn-1',
          connection_code: 'TEST',
          connection_name: 'Test Connection',
          integration_type: 'accounting',
          provider: 'accurate',
          credentials: null,
          config: {},
          is_active: true,
          last_sync_at: null,
          last_error: null,
          access_token: 'token',
          refresh_token: 'refresh-token',
          token_expires_at: null,
          created_by: null,
          created_at: new Date().toISOString(),
        };

        const refreshFn = createTokenRefreshFn(connectionWithRefresh, async () => ({ success: true }));

        expect(refreshFn).toBeDefined();
        expect(typeof refreshFn).toBe('function');
      });
    });
  });

  // =====================================================
  // Sync Context Tests
  // =====================================================
  describe('Sync Context Management', () => {
    it('createSyncContext initializes with correct values', () => {
      fc.assert(
        fc.property(
          uuidArb,
          fc.option(uuidArb, { nil: null }),
          fc.constantFrom('push', 'pull', 'full_sync') as fc.Arbitrary<'push' | 'pull' | 'full_sync'>,
          (connectionId, mappingId, syncType) => {
            const context = createSyncContext(connectionId, mappingId, syncType);

            expect(context.connectionId).toBe(connectionId);
            expect(context.mappingId).toBe(mappingId);
            expect(context.syncType).toBe(syncType);
            expect(context.recordsProcessed).toBe(0);
            expect(context.recordsCreated).toBe(0);
            expect(context.recordsUpdated).toBe(0);
            expect(context.recordsFailed).toBe(0);
            expect(context.errors).toHaveLength(0);
            expect(context.startedAt).toBeInstanceOf(Date);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('recordCreate increments processed and created counts', () => {
      const context = createSyncContext('conn-1', 'map-1', 'push');
      const updated = recordCreate(context);

      expect(updated.recordsProcessed).toBe(1);
      expect(updated.recordsCreated).toBe(1);
      expect(updated.recordsUpdated).toBe(0);
      expect(updated.recordsFailed).toBe(0);
    });

    it('recordUpdate increments processed and updated counts', () => {
      const context = createSyncContext('conn-1', 'map-1', 'push');
      const updated = recordUpdate(context);

      expect(updated.recordsProcessed).toBe(1);
      expect(updated.recordsCreated).toBe(0);
      expect(updated.recordsUpdated).toBe(1);
      expect(updated.recordsFailed).toBe(0);
    });

    it('recordFailure increments processed and failed counts and adds error', () => {
      const context = createSyncContext('conn-1', 'map-1', 'push');
      const updated = recordFailure(context, 'record-1', 'ERROR_CODE', 'Error message');

      expect(updated.recordsProcessed).toBe(1);
      expect(updated.recordsCreated).toBe(0);
      expect(updated.recordsUpdated).toBe(0);
      expect(updated.recordsFailed).toBe(1);
      expect(updated.errors).toHaveLength(1);
      expect(updated.errors[0].record_id).toBe('record-1');
      expect(updated.errors[0].error_code).toBe('ERROR_CODE');
    });

    it('contextToResult determines correct status', () => {
      // All success -> completed
      let context = createSyncContext('conn-1', 'map-1', 'push');
      context = recordCreate(context);
      context = recordUpdate(context);
      let result = contextToResult(context, 'log-1');
      expect(result.status).toBe('completed');

      // Some failures -> partial
      context = createSyncContext('conn-1', 'map-1', 'push');
      context = recordCreate(context);
      context = recordFailure(context, 'r1', 'ERR', 'msg');
      result = contextToResult(context, 'log-1');
      expect(result.status).toBe('partial');

      // All failures -> failed
      context = createSyncContext('conn-1', 'map-1', 'push');
      context = recordFailure(context, 'r1', 'ERR', 'msg');
      context = recordFailure(context, 'r2', 'ERR', 'msg');
      result = contextToResult(context, 'log-1');
      expect(result.status).toBe('failed');

      // No records -> completed
      context = createSyncContext('conn-1', 'map-1', 'push');
      result = contextToResult(context, 'log-1');
      expect(result.status).toBe('completed');
    });
  });

  // =====================================================
  // Sleep Utility Tests
  // =====================================================
  describe('Sleep Utility', () => {
    it('sleep resolves after specified time', async () => {
      vi.useRealTimers();
      
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;

      // Allow some tolerance for timing
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(150);
    });
  });
});
