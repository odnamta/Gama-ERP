// __tests__/notification-log-utils.property.test.ts
// Property-based tests for notification log utilities (v0.67)

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidStatusTransition,
  getValidNextStatuses,
  isTerminalStatus,
  validateLogEntry,
  isLogEntryComplete,
  buildPendingLogEntry,
  getStatusLabel,
  getStatusColor,
} from '@/lib/notification-log-utils';
import type {
  NotificationLogEntry,
  NotificationLogInsert,
  NotificationStatus,
  NotificationChannel,
} from '@/types/notification-workflows';

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

const channelArb = fc.constantFrom<NotificationChannel>('email', 'whatsapp', 'in_app', 'push');

const statusArb = fc.constantFrom<NotificationStatus>('pending', 'sent', 'delivered', 'failed', 'bounced');

const terminalStatusArb = fc.constantFrom<NotificationStatus>('delivered', 'failed', 'bounced');

const nonTerminalStatusArb = fc.constantFrom<NotificationStatus>('pending', 'sent');

const logEntryArb: fc.Arbitrary<NotificationLogEntry> = fc.record({
  id: fc.uuid(),
  template_id: fc.option(fc.uuid(), { nil: null }),
  recipient_user_id: fc.option(fc.uuid(), { nil: null }),
  recipient_email: fc.option(fc.emailAddress(), { nil: null }),
  recipient_phone: fc.option(fc.constant('+6281234567890'), { nil: null }),
  channel: channelArb,
  subject: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  body: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  status: statusArb,
  external_id: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  sent_at: fc.option(fc.constant(new Date().toISOString()), { nil: null }),
  delivered_at: fc.option(fc.constant(new Date().toISOString()), { nil: null }),
  error_message: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  entity_type: fc.option(fc.constantFrom('job_order', 'invoice', 'incident'), { nil: null }),
  entity_id: fc.option(fc.uuid(), { nil: null }),
  created_at: fc.constant(new Date().toISOString()),
});

const validLogInsertArb: fc.Arbitrary<NotificationLogInsert> = fc.record({
  template_id: fc.option(fc.uuid(), { nil: null }),
  recipient_user_id: fc.uuid(),
  recipient_email: fc.option(fc.emailAddress(), { nil: null }),
  recipient_phone: fc.option(fc.constant('+6281234567890'), { nil: null }),
  channel: channelArb,
  subject: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  body: fc.string({ minLength: 1, maxLength: 500 }),
  status: fc.constant('pending' as NotificationStatus),
  entity_type: fc.option(fc.constantFrom('job_order', 'invoice', 'incident'), { nil: null }),
  entity_id: fc.option(fc.uuid(), { nil: null }),
});

// ============================================================================
// Property 7: Log Entry Completeness
// ============================================================================

describe('Property 7: Log Entry Completeness', () => {
  it('log entry with all required fields is complete', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        channelArb,
        fc.string({ minLength: 1, maxLength: 500 }),
        (userId, channel, body) => {
          const entry: NotificationLogEntry = {
            id: 'test-id',
            template_id: 'template-id',
            recipient_user_id: userId,
            recipient_email: null,
            recipient_phone: null,
            channel,
            subject: 'Test Subject',
            body,
            status: 'pending',
            external_id: null,
            sent_at: null,
            delivered_at: null,
            error_message: null,
            entity_type: 'job_order',
            entity_id: 'entity-id',
            created_at: new Date().toISOString(),
          };

          expect(isLogEntryComplete(entry)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('log entry without recipient is incomplete', () => {
    fc.assert(
      fc.property(channelArb, fc.string({ minLength: 1, maxLength: 500 }), (channel, body) => {
        const entry: NotificationLogEntry = {
          id: 'test-id',
          template_id: 'template-id',
          recipient_user_id: null,
          recipient_email: null,
          recipient_phone: null,
          channel,
          subject: 'Test Subject',
          body,
          status: 'pending',
          external_id: null,
          sent_at: null,
          delivered_at: null,
          error_message: null,
          entity_type: null,
          entity_id: null,
          created_at: new Date().toISOString(),
        };

        expect(isLogEntryComplete(entry)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('log entry without body is incomplete', () => {
    fc.assert(
      fc.property(fc.uuid(), channelArb, (userId, channel) => {
        const entry: NotificationLogEntry = {
          id: 'test-id',
          template_id: 'template-id',
          recipient_user_id: userId,
          recipient_email: null,
          recipient_phone: null,
          channel,
          subject: 'Test Subject',
          body: null,
          status: 'pending',
          external_id: null,
          sent_at: null,
          delivered_at: null,
          error_message: null,
          entity_type: null,
          entity_id: null,
          created_at: new Date().toISOString(),
        };

        expect(isLogEntryComplete(entry)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('log entry with email recipient is complete', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        channelArb,
        fc.string({ minLength: 1, maxLength: 500 }),
        (email, channel, body) => {
          const entry: NotificationLogEntry = {
            id: 'test-id',
            template_id: null,
            recipient_user_id: null,
            recipient_email: email,
            recipient_phone: null,
            channel,
            subject: null,
            body,
            status: 'pending',
            external_id: null,
            sent_at: null,
            delivered_at: null,
            error_message: null,
            entity_type: null,
            entity_id: null,
            created_at: new Date().toISOString(),
          };

          expect(isLogEntryComplete(entry)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('buildPendingLogEntry creates valid pending entry', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        channelArb,
        fc.string({ minLength: 1, maxLength: 500 }),
        (templateId, userId, channel, body) => {
          const entry = buildPendingLogEntry(templateId, userId, channel, 'Subject', body);

          expect(entry.template_id).toBe(templateId);
          expect(entry.recipient_user_id).toBe(userId);
          expect(entry.channel).toBe(channel);
          expect(entry.body).toBe(body);
          expect(entry.status).toBe('pending');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 8: Status Transition Validity
// ============================================================================

describe('Property 8: Status Transition Validity', () => {
  it('pending can transition to sent or failed', () => {
    expect(isValidStatusTransition('pending', 'sent')).toBe(true);
    expect(isValidStatusTransition('pending', 'failed')).toBe(true);
    expect(isValidStatusTransition('pending', 'delivered')).toBe(false);
    expect(isValidStatusTransition('pending', 'bounced')).toBe(false);
  });

  it('sent can transition to delivered, failed, or bounced', () => {
    expect(isValidStatusTransition('sent', 'delivered')).toBe(true);
    expect(isValidStatusTransition('sent', 'failed')).toBe(true);
    expect(isValidStatusTransition('sent', 'bounced')).toBe(true);
    expect(isValidStatusTransition('sent', 'pending')).toBe(false);
  });

  it('terminal statuses cannot transition', () => {
    fc.assert(
      fc.property(terminalStatusArb, statusArb, (terminal, anyStatus) => {
        // Terminal statuses should not transition to any status
        expect(isValidStatusTransition(terminal, anyStatus)).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  it('getValidNextStatuses returns correct transitions', () => {
    expect(getValidNextStatuses('pending')).toEqual(['sent', 'failed']);
    expect(getValidNextStatuses('sent')).toEqual(['delivered', 'failed', 'bounced']);
    expect(getValidNextStatuses('delivered')).toEqual([]);
    expect(getValidNextStatuses('failed')).toEqual([]);
    expect(getValidNextStatuses('bounced')).toEqual([]);
  });

  it('isTerminalStatus correctly identifies terminal statuses', () => {
    fc.assert(
      fc.property(terminalStatusArb, (status) => {
        expect(isTerminalStatus(status)).toBe(true);
      }),
      { numRuns: 50 }
    );

    fc.assert(
      fc.property(nonTerminalStatusArb, (status) => {
        expect(isTerminalStatus(status)).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  it('valid transitions are consistent with getValidNextStatuses', () => {
    fc.assert(
      fc.property(statusArb, statusArb, (from, to) => {
        const validNext = getValidNextStatuses(from);
        const isValid = isValidStatusTransition(from, to);

        expect(isValid).toBe(validNext.includes(to));
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Log Entry Validation Tests
// ============================================================================

describe('Log Entry Validation', () => {
  it('valid log entries pass validation', () => {
    fc.assert(
      fc.property(validLogInsertArb, (entry) => {
        const result = validateLogEntry(entry);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('entry without channel fails validation', () => {
    const entry: NotificationLogInsert = {
      channel: '' as NotificationChannel,
      body: 'Test body',
    };

    const result = validateLogEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Channel');
  });

  it('entry with invalid channel fails validation', () => {
    const entry: NotificationLogInsert = {
      channel: 'invalid' as NotificationChannel,
      body: 'Test body',
    };

    const result = validateLogEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid channel');
  });

  it('failed status without error message fails validation', () => {
    const entry: NotificationLogInsert = {
      channel: 'email',
      body: 'Test body',
      status: 'failed',
    };

    const result = validateLogEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Error message');
  });

  it('failed status with error message passes validation', () => {
    const entry: NotificationLogInsert = {
      channel: 'email',
      body: 'Test body',
      status: 'failed',
      error_message: 'Delivery failed',
    };

    const result = validateLogEntry(entry);
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// Status Helper Tests
// ============================================================================

describe('Status Helpers', () => {
  it('getStatusLabel returns human-readable labels', () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const label = getStatusLabel(status);
        
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
        // Label should be capitalized
        expect(label[0]).toBe(label[0].toUpperCase());
      }),
      { numRuns: 50 }
    );
  });

  it('getStatusColor returns valid color names', () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const color = getStatusColor(status);
        
        expect(typeof color).toBe('string');
        expect(['yellow', 'blue', 'green', 'red', 'orange', 'gray']).toContain(color);
      }),
      { numRuns: 50 }
    );
  });

  it('terminal statuses have appropriate colors', () => {
    expect(getStatusColor('delivered')).toBe('green');
    expect(getStatusColor('failed')).toBe('red');
    expect(getStatusColor('bounced')).toBe('orange');
  });

  it('non-terminal statuses have appropriate colors', () => {
    expect(getStatusColor('pending')).toBe('yellow');
    expect(getStatusColor('sent')).toBe('blue');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('handles null and undefined gracefully in validation', () => {
    const entry1: NotificationLogInsert = {
      channel: null as unknown as NotificationChannel,
    };
    expect(validateLogEntry(entry1).valid).toBe(false);

    const entry2: NotificationLogInsert = {
      channel: undefined as unknown as NotificationChannel,
    };
    expect(validateLogEntry(entry2).valid).toBe(false);
  });

  it('buildPendingLogEntry handles optional parameters', () => {
    const entry = buildPendingLogEntry('template-id', 'user-id', 'email', 'Subject', 'Body');

    expect(entry.recipient_email).toBeNull();
    expect(entry.recipient_phone).toBeNull();
    expect(entry.entity_type).toBeNull();
    expect(entry.entity_id).toBeNull();
  });

  it('buildPendingLogEntry includes optional parameters when provided', () => {
    const entry = buildPendingLogEntry('template-id', 'user-id', 'email', 'Subject', 'Body', {
      recipientEmail: 'test@example.com',
      recipientPhone: '+6281234567890',
      entityType: 'job_order',
      entityId: 'entity-123',
    });

    expect(entry.recipient_email).toBe('test@example.com');
    expect(entry.recipient_phone).toBe('+6281234567890');
    expect(entry.entity_type).toBe('job_order');
    expect(entry.entity_id).toBe('entity-123');
  });
});
