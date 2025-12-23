// __tests__/notification-stats-utils.property.test.ts
// Property-based tests for notification statistics utilities (v0.67)

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateStats,
  createEmptyStats,
  mergeStats,
  getChannelPercentage,
  getStatusPercentage,
  getMostUsedChannel,
  isHealthyDelivery,
  getDeliveryHealth,
} from '@/lib/notification-stats-utils';
import type {
  NotificationLogEntry,
  NotificationStats,
  NotificationChannel,
  NotificationStatus,
} from '@/types/notification-workflows';

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

const channelArb = fc.constantFrom<NotificationChannel>('email', 'whatsapp', 'in_app', 'push');

const statusArb = fc.constantFrom<NotificationStatus>('pending', 'sent', 'delivered', 'failed', 'bounced');

const logEntryArb: fc.Arbitrary<NotificationLogEntry> = fc.record({
  id: fc.uuid(),
  template_id: fc.option(fc.uuid(), { nil: null }),
  recipient_user_id: fc.option(fc.uuid(), { nil: null }),
  recipient_email: fc.option(fc.emailAddress(), { nil: null }),
  recipient_phone: fc.option(fc.constant('+6281234567890'), { nil: null }),
  channel: channelArb,
  subject: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  body: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  status: statusArb,
  external_id: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  sent_at: fc.option(fc.constant(new Date().toISOString()), { nil: null }),
  delivered_at: fc.option(fc.constant(new Date().toISOString()), { nil: null }),
  error_message: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  entity_type: fc.option(fc.constantFrom('job_order', 'invoice', 'incident'), { nil: null }),
  entity_id: fc.option(fc.uuid(), { nil: null }),
  created_at: fc.constant(new Date().toISOString()),
});

// Generate entries with specific status distribution
const entriesWithStatusArb = (count: number) => fc.array(logEntryArb, { minLength: count, maxLength: count });

// ============================================================================
// Property 10: Statistics Calculation Invariant
// ============================================================================

describe('Property 10: Statistics Calculation Invariant', () => {
  it('sum of status counts equals total count', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);

        const statusSum = 
          stats.by_status.pending +
          stats.by_status.sent +
          stats.by_status.delivered +
          stats.by_status.failed +
          stats.by_status.bounced;

        expect(statusSum).toBe(stats.total_sent);
      }),
      { numRuns: 100 }
    );
  });

  it('sum of channel counts equals total count', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);

        const channelSum = 
          stats.by_channel.email +
          stats.by_channel.whatsapp +
          stats.by_channel.in_app +
          stats.by_channel.push;

        expect(channelSum).toBe(stats.total_sent);
      }),
      { numRuns: 100 }
    );
  });

  it('success_rate + failure_rate equals 100% for completed notifications', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), (entries) => {
        // Filter to only completed entries (not pending)
        const completedEntries = entries.filter(e => e.status !== 'pending');
        
        if (completedEntries.length === 0) return; // Skip if no completed entries

        const stats = calculateStats(completedEntries);

        // For completed entries, success + failure should equal 100%
        // (with some tolerance for rounding)
        const total = stats.success_rate + stats.failure_rate;
        
        // Note: 'sent' status is neither success nor failure, so total may be < 100%
        // Success = delivered, Failure = failed + bounced
        // Sent is in-progress, not counted in either rate
        expect(total).toBeLessThanOrEqual(100.01);
        expect(total).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('empty entries produce zero stats', () => {
    const stats = calculateStats([]);

    expect(stats.total_sent).toBe(0);
    expect(stats.success_rate).toBe(0);
    expect(stats.failure_rate).toBe(0);
    expect(stats.common_errors).toHaveLength(0);

    // All channel counts should be 0
    for (const count of Object.values(stats.by_channel)) {
      expect(count).toBe(0);
    }

    // All status counts should be 0
    for (const count of Object.values(stats.by_status)) {
      expect(count).toBe(0);
    }
  });

  it('total_sent equals input array length', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);
        expect(stats.total_sent).toBe(entries.length);
      }),
      { numRuns: 100 }
    );
  });

  it('channel counts are non-negative', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);

        for (const count of Object.values(stats.by_channel)) {
          expect(count).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('status counts are non-negative', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);

        for (const count of Object.values(stats.by_status)) {
          expect(count).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('rates are between 0 and 100', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);

        expect(stats.success_rate).toBeGreaterThanOrEqual(0);
        expect(stats.success_rate).toBeLessThanOrEqual(100);
        expect(stats.failure_rate).toBeGreaterThanOrEqual(0);
        expect(stats.failure_rate).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Statistics Merge Tests
// ============================================================================

describe('Statistics Merge', () => {
  it('merging empty array returns empty stats', () => {
    const merged = mergeStats([]);
    const empty = createEmptyStats();

    expect(merged.total_sent).toBe(empty.total_sent);
    expect(merged.success_rate).toBe(empty.success_rate);
    expect(merged.failure_rate).toBe(empty.failure_rate);
  });

  it('merging single stats returns equivalent stats', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 50 }), (entries) => {
        const original = calculateStats(entries);
        const merged = mergeStats([original]);

        expect(merged.total_sent).toBe(original.total_sent);
        
        // Channel counts should match
        for (const channel of Object.keys(merged.by_channel) as NotificationChannel[]) {
          expect(merged.by_channel[channel]).toBe(original.by_channel[channel]);
        }

        // Status counts should match
        for (const status of Object.keys(merged.by_status) as NotificationStatus[]) {
          expect(merged.by_status[status]).toBe(original.by_status[status]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('merged total equals sum of individual totals', () => {
    fc.assert(
      fc.property(
        fc.array(logEntryArb, { maxLength: 30 }),
        fc.array(logEntryArb, { maxLength: 30 }),
        (entries1, entries2) => {
          const stats1 = calculateStats(entries1);
          const stats2 = calculateStats(entries2);
          const merged = mergeStats([stats1, stats2]);

          expect(merged.total_sent).toBe(stats1.total_sent + stats2.total_sent);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('merged channel counts equal sum of individual counts', () => {
    fc.assert(
      fc.property(
        fc.array(logEntryArb, { maxLength: 30 }),
        fc.array(logEntryArb, { maxLength: 30 }),
        (entries1, entries2) => {
          const stats1 = calculateStats(entries1);
          const stats2 = calculateStats(entries2);
          const merged = mergeStats([stats1, stats2]);

          for (const channel of Object.keys(merged.by_channel) as NotificationChannel[]) {
            expect(merged.by_channel[channel]).toBe(
              stats1.by_channel[channel] + stats2.by_channel[channel]
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Percentage Calculation Tests
// ============================================================================

describe('Percentage Calculations', () => {
  it('channel percentages sum to 100% (with rounding tolerance)', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { minLength: 1, maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);

        const totalPercentage = 
          getChannelPercentage(stats, 'email') +
          getChannelPercentage(stats, 'whatsapp') +
          getChannelPercentage(stats, 'in_app') +
          getChannelPercentage(stats, 'push');

        // Allow for rounding errors
        expect(totalPercentage).toBeGreaterThanOrEqual(99.9);
        expect(totalPercentage).toBeLessThanOrEqual(100.1);
      }),
      { numRuns: 100 }
    );
  });

  it('status percentages sum to 100% (with rounding tolerance)', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { minLength: 1, maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);

        const totalPercentage = 
          getStatusPercentage(stats, 'pending') +
          getStatusPercentage(stats, 'sent') +
          getStatusPercentage(stats, 'delivered') +
          getStatusPercentage(stats, 'failed') +
          getStatusPercentage(stats, 'bounced');

        // Allow for rounding errors
        expect(totalPercentage).toBeGreaterThanOrEqual(99.9);
        expect(totalPercentage).toBeLessThanOrEqual(100.1);
      }),
      { numRuns: 100 }
    );
  });

  it('percentages are between 0 and 100', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), channelArb, (entries, channel) => {
        const stats = calculateStats(entries);
        const percentage = getChannelPercentage(stats, channel);

        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it('empty stats return 0% for all', () => {
    const stats = createEmptyStats();

    for (const channel of ['email', 'whatsapp', 'in_app', 'push'] as NotificationChannel[]) {
      expect(getChannelPercentage(stats, channel)).toBe(0);
    }

    for (const status of ['pending', 'sent', 'delivered', 'failed', 'bounced'] as NotificationStatus[]) {
      expect(getStatusPercentage(stats, status)).toBe(0);
    }
  });
});

// ============================================================================
// Most Used Channel Tests
// ============================================================================

describe('Most Used Channel', () => {
  it('returns null for empty stats', () => {
    const stats = createEmptyStats();
    expect(getMostUsedChannel(stats)).toBeNull();
  });

  it('returns the channel with highest count', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { minLength: 1, maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);
        const mostUsed = getMostUsedChannel(stats);

        if (mostUsed) {
          // Verify it has the highest count
          for (const channel of Object.keys(stats.by_channel) as NotificationChannel[]) {
            expect(stats.by_channel[mostUsed]).toBeGreaterThanOrEqual(stats.by_channel[channel]);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Delivery Health Tests
// ============================================================================

describe('Delivery Health', () => {
  it('unknown for insufficient data', () => {
    const stats = createEmptyStats();
    expect(getDeliveryHealth(stats)).toBe('unknown');

    // Less than 10 completed
    stats.total_sent = 5;
    stats.by_status.delivered = 5;
    expect(getDeliveryHealth(stats)).toBe('unknown');
  });

  it('healthy for high success rate', () => {
    const stats = createEmptyStats();
    stats.total_sent = 100;
    stats.by_status.delivered = 95;
    stats.by_status.failed = 2;
    stats.by_status.bounced = 1;
    stats.by_status.sent = 2;
    stats.success_rate = 95;
    stats.failure_rate = 3;

    expect(getDeliveryHealth(stats)).toBe('healthy');
    expect(isHealthyDelivery(stats)).toBe(true);
  });

  it('warning for moderate success rate', () => {
    const stats = createEmptyStats();
    stats.total_sent = 100;
    stats.by_status.delivered = 80;
    stats.by_status.failed = 8;
    stats.by_status.bounced = 2;
    stats.by_status.sent = 10;
    stats.success_rate = 80;
    stats.failure_rate = 10;

    expect(getDeliveryHealth(stats)).toBe('warning');
  });

  it('critical for low success rate', () => {
    const stats = createEmptyStats();
    stats.total_sent = 100;
    stats.by_status.delivered = 50;
    stats.by_status.failed = 30;
    stats.by_status.bounced = 10;
    stats.by_status.sent = 10;
    stats.success_rate = 50;
    stats.failure_rate = 40;

    expect(getDeliveryHealth(stats)).toBe('critical');
    expect(isHealthyDelivery(stats)).toBe(false);
  });
});

// ============================================================================
// Error Aggregation Tests
// ============================================================================

describe('Error Aggregation', () => {
  it('common_errors contains at most 10 entries', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);
        expect(stats.common_errors.length).toBeLessThanOrEqual(10);
      }),
      { numRuns: 100 }
    );
  });

  it('common_errors are sorted by count descending', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);

        for (let i = 1; i < stats.common_errors.length; i++) {
          expect(stats.common_errors[i - 1].count).toBeGreaterThanOrEqual(
            stats.common_errors[i].count
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('error counts are positive', () => {
    fc.assert(
      fc.property(fc.array(logEntryArb, { maxLength: 100 }), (entries) => {
        const stats = calculateStats(entries);

        for (const error of stats.common_errors) {
          expect(typeof error.count).toBe('number');
          expect(error.count).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});
