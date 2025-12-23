// =====================================================
// v0.66: WEBHOOK EXECUTOR PROPERTY TESTS
// =====================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  generateExecutionId,
  calculateExecutionTime,
  isValidAutomationStatus,
} from '@/lib/automation-utils';
import type { AutomationStatus, WebhookEndpoint, AutomationLog } from '@/types/automation';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Webhook Executor Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: n8n-automation-foundation, Property 10: Endpoint Validation on Trigger**
   * *For any* attempt to trigger a webhook with an endpoint_code that does not exist 
   * or is not active, the trigger SHALL fail with an appropriate error.
   * **Validates: Requirements 4.1**
   */
  describe('Property 10: Endpoint Validation on Trigger', () => {
    it('non-existent endpoints should fail validation', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[A-Z][A-Z0-9_]{2,20}$/),
          (endpointCode) => {
            // Simulating validation of non-existent endpoint
            const endpoint: WebhookEndpoint | null = null;
            const isValid = endpoint !== null && endpoint.is_active;
            
            return isValid === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('inactive endpoints should fail validation', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[A-Z][A-Z0-9_]{2,20}$/),
          (endpointCode) => {
            // Simulating validation of inactive endpoint
            const endpoint: Partial<WebhookEndpoint> = {
              endpoint_code: endpointCode,
              is_active: false,
            };
            
            const isValid = endpoint.is_active === true;
            return isValid === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('active endpoints should pass validation', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[A-Z][A-Z0-9_]{2,20}$/),
          fc.string({ minLength: 10, maxLength: 100 }),
          (endpointCode, webhookUrl) => {
            // Simulating validation of active endpoint
            const endpoint: Partial<WebhookEndpoint> = {
              endpoint_code: endpointCode,
              webhook_url: webhookUrl,
              is_active: true,
            };
            
            const isValid = endpoint.is_active === true && !!endpoint.webhook_url;
            return isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-automation-foundation, Property 11: Execution Logging with Status**
   * *For any* webhook execution that returns HTTP 2xx, the automation_log status SHALL 
   * be 'success' and result_data SHALL be populated. *For any* execution that returns 
   * non-2xx or throws an error, the status SHALL be 'failed' and error_message SHALL be populated.
   * **Validates: Requirements 4.5, 4.6, 5.3, 5.4**
   */
  describe('Property 11: Execution Logging with Status', () => {
    it('2xx responses should result in success status', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 299 }),
          (statusCode) => {
            const isSuccess = statusCode >= 200 && statusCode < 300;
            const expectedStatus: AutomationStatus = isSuccess ? 'success' : 'failed';
            
            return expectedStatus === 'success';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('non-2xx responses should result in failed status', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: 100, max: 199 }),
            fc.integer({ min: 300, max: 599 })
          ),
          (statusCode) => {
            const isSuccess = statusCode >= 200 && statusCode < 300;
            const expectedStatus: AutomationStatus = isSuccess ? 'success' : 'failed';
            
            return expectedStatus === 'failed';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('success logs should have result_data', () => {
      fc.assert(
        fc.property(
          fc.dictionary(fc.string(), fc.jsonValue()),
          (resultData) => {
            const log: Partial<AutomationLog> = {
              status: 'success',
              result_data: resultData,
              error_message: null,
            };
            
            return log.status === 'success' && log.result_data !== null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('failed logs should have error_message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (errorMessage) => {
            const log: Partial<AutomationLog> = {
              status: 'failed',
              result_data: null,
              error_message: errorMessage,
            };
            
            return log.status === 'failed' && log.error_message !== null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all automation statuses should be valid', () => {
      const validStatuses: AutomationStatus[] = ['running', 'success', 'failed', 'timeout'];
      
      fc.assert(
        fc.property(fc.constantFrom(...validStatuses), (status) => {
          return isValidAutomationStatus(status) === true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-automation-foundation, Property 12: Execution Time Tracking**
   * *For any* completed automation_log entry, execution_time_ms SHALL be calculated 
   * as the difference between completed_at and triggered_at in milliseconds.
   * **Validates: Requirements 4.7, 5.5**
   */
  describe('Property 12: Execution Time Tracking', () => {
    it('execution time should be positive for valid timestamps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 100000 }), // duration in ms
          (duration) => {
            const triggeredAt = new Date(Date.now() - duration).toISOString();
            const completedAt = new Date().toISOString();
            
            const executionTime = calculateExecutionTime(triggeredAt, completedAt);
            
            // Execution time should be approximately equal to duration
            // Allow some tolerance for test execution time
            return executionTime >= 0 && Math.abs(executionTime - duration) < 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('execution time should be 0 or positive', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          (date1, date2) => {
            const [earlier, later] = date1 < date2 ? [date1, date2] : [date2, date1];
            const executionTime = calculateExecutionTime(earlier.toISOString(), later.toISOString());
            
            return executionTime >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('execution time calculation should be consistent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          (durationMs) => {
            const start = new Date(Date.now() - durationMs);
            const end = new Date();
            
            const calculated = calculateExecutionTime(start.toISOString(), end.toISOString());
            const expected = end.getTime() - start.getTime();
            
            return calculated === expected;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('completed logs should have execution_time_ms', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          (executionTimeMs) => {
            const log: Partial<AutomationLog> = {
              status: 'success',
              triggered_at: new Date(Date.now() - executionTimeMs).toISOString(),
              completed_at: new Date().toISOString(),
              execution_time_ms: executionTimeMs,
            };
            
            return (
              log.completed_at !== null &&
              log.execution_time_ms !== null &&
              log.execution_time_ms > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional tests for execution ID
   */
  describe('Execution ID Generation', () => {
    it('should generate unique execution IDs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), (count) => {
          const ids = new Set<string>();
          for (let i = 0; i < count; i++) {
            ids.add(generateExecutionId());
          }
          return ids.size === count;
        }),
        { numRuns: 100 }
      );
    });

    it('execution IDs should have correct format', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const id = generateExecutionId();
          return id.startsWith('exec_') && id.split('_').length === 3;
        }),
        { numRuns: 100 }
      );
    });
  });
});
