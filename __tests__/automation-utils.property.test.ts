// =====================================================
// v0.66: AUTOMATION UTILS PROPERTY TESTS
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateExecutionId,
  generateWebhookSecret,
  calculateRetryDelay,
  isValidTriggerType,
  isValidTriggerEvent,
  isValidTemplateCategory,
  calculateExecutionTime,
} from '@/lib/automation-utils';

describe('Automation Utils Property Tests', () => {
  /**
   * **Feature: n8n-automation-foundation, Property 9: Execution ID Uniqueness**
   * *For any* two webhook executions, their execution_id values SHALL be distinct.
   * **Validates: Requirements 4.2**
   */
  describe('Property 9: Execution ID Uniqueness', () => {
    it('should generate unique execution IDs across multiple calls', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), (count) => {
          const ids = new Set<string>();
          for (let i = 0; i < count; i++) {
            ids.add(generateExecutionId());
          }
          // All IDs should be unique
          return ids.size === count;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate execution IDs with correct format', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const id = generateExecutionId();
          // Should start with 'exec_'
          expect(id.startsWith('exec_')).toBe(true);
          // Should have format exec_{timestamp}_{random}
          const parts = id.split('_');
          expect(parts.length).toBe(3);
          expect(parts[0]).toBe('exec');
          // Timestamp and random parts should be non-empty
          expect(parts[1].length).toBeGreaterThan(0);
          expect(parts[2].length).toBeGreaterThan(0);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-automation-foundation, Property 8: Exponential Backoff Retry**
   * *For any* event that fails processing, if retry_count < max_retries, the retry_count 
   * SHALL be incremented and scheduled_for SHALL be set to current_time + (2^retry_count) minutes.
   * **Validates: Requirements 3.6, 3.7**
   */
  describe('Property 8: Exponential Backoff Retry', () => {
    it('should calculate exponential backoff correctly for any retry count', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10 }), (retryCount) => {
          const delay = calculateRetryDelay(retryCount);
          const expectedDelay = Math.pow(2, retryCount) * 60 * 1000;
          return delay === expectedDelay;
        }),
        { numRuns: 100 }
      );
    });

    it('should cap retry delay at 2^10 minutes for large retry counts', () => {
      fc.assert(
        fc.property(fc.integer({ min: 11, max: 100 }), (retryCount) => {
          const delay = calculateRetryDelay(retryCount);
          const maxDelay = Math.pow(2, 10) * 60 * 1000; // ~17 hours
          return delay === maxDelay;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle negative retry counts by treating them as 0', () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: -1 }), (retryCount) => {
          const delay = calculateRetryDelay(retryCount);
          const expectedDelay = Math.pow(2, 0) * 60 * 1000; // 1 minute
          return delay === expectedDelay;
        }),
        { numRuns: 100 }
      );
    });

    it('should produce increasing delays for increasing retry counts', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 9 }), (retryCount) => {
          const delay1 = calculateRetryDelay(retryCount);
          const delay2 = calculateRetryDelay(retryCount + 1);
          return delay2 > delay1;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for validation functions
   */
  describe('Validation Functions', () => {
    it('should validate trigger types correctly', () => {
      const validTypes = ['database_event', 'scheduled', 'manual', 'external'];
      
      fc.assert(
        fc.property(fc.constantFrom(...validTypes), (type) => {
          return isValidTriggerType(type) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid trigger types', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['database_event', 'scheduled', 'manual', 'external'].includes(s)),
          (type) => {
            return isValidTriggerType(type) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate trigger events correctly', () => {
      const validEvents = ['INSERT', 'UPDATE', 'DELETE'];
      
      fc.assert(
        fc.property(fc.constantFrom(...validEvents), (event) => {
          return isValidTriggerEvent(event) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate template categories correctly', () => {
      const validCategories = ['notification', 'document', 'integration', 'data_sync', 'reporting'];
      
      fc.assert(
        fc.property(fc.constantFrom(...validCategories), (category) => {
          return isValidTemplateCategory(category) === true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Webhook Secret Generation', () => {
    it('should generate secrets with sufficient length (64 hex chars = 32 bytes)', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const secret = generateWebhookSecret();
          return secret.length === 64;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate unique secrets', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 50 }), (count) => {
          const secrets = new Set<string>();
          for (let i = 0; i < count; i++) {
            secrets.add(generateWebhookSecret());
          }
          return secrets.size === count;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid hex strings', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const secret = generateWebhookSecret();
          return /^[0-9a-f]+$/.test(secret);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Execution Time Calculation', () => {
    it('should calculate positive execution time for valid timestamps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (duration) => {
            const now = Date.now();
            const startTime = new Date(now).toISOString();
            const endTime = new Date(now + duration).toISOString();
            const execTime = calculateExecutionTime(startTime, endTime);
            return execTime >= 0 && execTime === duration;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for end time before start time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000 }),
          (offset) => {
            const startTime = new Date(Date.now()).toISOString();
            const endTime = new Date(Date.now() - offset).toISOString();
            const execTime = calculateExecutionTime(startTime, endTime);
            return execTime === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
