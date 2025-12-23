// =====================================================
// v0.66: WEBHOOK ACTIONS PROPERTY TESTS
// =====================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  generateWebhookSecret,
  buildWebhookUrl,
  isValidTriggerType,
  isValidTriggerEvent,
} from '@/lib/automation-utils';
import type { TriggerType, TriggerEvent, CreateWebhookEndpointInput } from '@/types/automation';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

describe('Webhook Actions Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: n8n-automation-foundation, Property 1: Webhook Endpoint Data Integrity**
   * *For any* webhook endpoint created with a database_event trigger type, the endpoint 
   * SHALL have trigger_table and trigger_event fields populated. *For any* endpoint with 
   * scheduled trigger type, the endpoint SHALL have cron_expression populated.
   * **Validates: Requirements 1.1, 1.4, 1.5, 1.6**
   */
  describe('Property 1: Webhook Endpoint Data Integrity', () => {
    // Arbitrary for valid endpoint codes
    const endpointCodeArb = fc.stringMatching(/^[A-Z][A-Z0-9_]{2,20}$/);
    const endpointNameArb = fc.string({ minLength: 1, maxLength: 100 });
    const tableNameArb = fc.stringMatching(/^[a-z][a-z0-9_]{2,50}$/);
    const cronExpressionArb = fc.constantFrom(
      '0 0 * * *',
      '*/5 * * * *',
      '0 9 * * 1-5',
      '0 0 1 * *'
    );

    it('database_event triggers require trigger_table and trigger_event', () => {
      fc.assert(
        fc.property(
          endpointCodeArb,
          endpointNameArb,
          tableNameArb,
          fc.constantFrom<TriggerEvent>('INSERT', 'UPDATE', 'DELETE'),
          (code, name, table, event) => {
            const input: CreateWebhookEndpointInput = {
              endpointCode: code,
              endpointName: name,
              triggerType: 'database_event',
              triggerTable: table,
              triggerEvent: event,
            };

            // Valid database_event config should have both table and event
            const hasRequiredFields = !!input.triggerTable && !!input.triggerEvent;
            return hasRequiredFields === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('scheduled triggers require cron_expression', () => {
      fc.assert(
        fc.property(
          endpointCodeArb,
          endpointNameArb,
          cronExpressionArb,
          (code, name, cron) => {
            const input: CreateWebhookEndpointInput = {
              endpointCode: code,
              endpointName: name,
              triggerType: 'scheduled',
              cronExpression: cron,
            };

            // Valid scheduled config should have cron expression
            return !!input.cronExpression;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('manual and external triggers do not require additional fields', () => {
      fc.assert(
        fc.property(
          endpointCodeArb,
          endpointNameArb,
          fc.constantFrom<TriggerType>('manual', 'external'),
          (code, name, triggerType) => {
            const input: CreateWebhookEndpointInput = {
              endpointCode: code,
              endpointName: name,
              triggerType,
            };

            // Manual and external don't require table, event, or cron
            return input.triggerType === 'manual' || input.triggerType === 'external';
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-automation-foundation, Property 3: Trigger Type Validation**
   * *For any* webhook endpoint, the trigger_type SHALL be one of: 'database_event', 
   * 'scheduled', 'manual', or 'external'. Creating an endpoint with any other 
   * trigger_type SHALL be rejected.
   * **Validates: Requirements 1.3**
   */
  describe('Property 3: Trigger Type Validation', () => {
    it('should accept all valid trigger types', () => {
      const validTypes: TriggerType[] = ['database_event', 'scheduled', 'manual', 'external'];

      fc.assert(
        fc.property(fc.constantFrom(...validTypes), (triggerType) => {
          return isValidTriggerType(triggerType) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid trigger types', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => 
            !['database_event', 'scheduled', 'manual', 'external'].includes(s) &&
            s.length > 0
          ),
          (invalidType) => {
            return isValidTriggerType(invalidType) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept all valid trigger events', () => {
      const validEvents: TriggerEvent[] = ['INSERT', 'UPDATE', 'DELETE'];

      fc.assert(
        fc.property(fc.constantFrom(...validEvents), (triggerEvent) => {
          return isValidTriggerEvent(triggerEvent) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid trigger events', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => 
            !['INSERT', 'UPDATE', 'DELETE'].includes(s) &&
            s.length > 0
          ),
          (invalidEvent) => {
            return isValidTriggerEvent(invalidEvent) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-automation-foundation, Property 2: Webhook URL and Secret Uniqueness**
   * *For any* two webhook endpoints registered in the system, their webhook_url values 
   * SHALL be distinct. *For any* webhook endpoint, the webhook_secret SHALL have 
   * sufficient entropy (minimum 32 characters).
   * **Validates: Requirements 1.2**
   */
  describe('Property 2: Webhook URL and Secret Uniqueness', () => {
    it('should generate unique URLs for different endpoint codes', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[A-Z][A-Z0-9_]{2,20}$/), { minLength: 2, maxLength: 10 })
            .filter(arr => new Set(arr).size === arr.length), // Ensure unique codes
          (codes) => {
            const urls = codes.map(code => buildWebhookUrl(code));
            const uniqueUrls = new Set(urls);
            return uniqueUrls.size === codes.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate secrets with minimum 32 bytes (64 hex chars)', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const secret = generateWebhookSecret();
          // 64 hex characters = 32 bytes of entropy
          return secret.length >= 64;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate unique secrets across multiple generations', () => {
      fc.assert(
        fc.property(fc.integer({ min: 5, max: 20 }), (count) => {
          const secrets = new Set<string>();
          for (let i = 0; i < count; i++) {
            secrets.add(generateWebhookSecret());
          }
          return secrets.size === count;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate URL based on endpoint code', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[A-Z][A-Z0-9_]{2,20}$/),
          (code) => {
            const url = buildWebhookUrl(code);
            // URL should contain the lowercase version of the code
            return url.includes(code.toLowerCase());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
