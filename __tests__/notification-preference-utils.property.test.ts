// __tests__/notification-preference-utils.property.test.ts
// Property-based tests for notification preference utilities (v0.67)

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createDefaultPreference,
  isDefaultPreference,
  validatePreference,
  isValidTimeFormat,
  getEnabledChannels,
  isChannelEnabled,
  setChannelEnabled,
  isInQuietHours,
  isTimeInQuietHours,
  shouldBatchNotification,
  getNextDigestTime,
} from '@/lib/notification-preference-utils';
import type {
  NotificationWorkflowPreference,
  NotificationWorkflowPreferenceInsert,
  EventType,
  DigestFrequency,
  NotificationChannel,
} from '@/types/notification-workflows';

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

const eventTypeArb = fc.constantFrom<EventType>(
  'job_order.assigned',
  'job_order.status_changed',
  'invoice.sent',
  'invoice.overdue',
  'incident.created',
  'document.expiring',
  'maintenance.due',
  'approval.required'
);

const digestFrequencyArb = fc.constantFrom<DigestFrequency>('immediate', 'hourly', 'daily');

const channelArb = fc.constantFrom<NotificationChannel>('email', 'whatsapp', 'in_app', 'push');

const validTimeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

const isoDateStringArb = fc.constant(new Date().toISOString());

const preferenceArb: fc.Arbitrary<NotificationWorkflowPreference> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  event_type: eventTypeArb,
  email_enabled: fc.boolean(),
  whatsapp_enabled: fc.boolean(),
  in_app_enabled: fc.boolean(),
  push_enabled: fc.boolean(),
  quiet_hours_start: fc.option(validTimeArb, { nil: null }),
  quiet_hours_end: fc.option(validTimeArb, { nil: null }),
  digest_frequency: digestFrequencyArb,
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
}).map(pref => {
  // Ensure quiet hours are either both set or both null
  if (pref.quiet_hours_start && !pref.quiet_hours_end) {
    pref.quiet_hours_end = '07:00';
  } else if (!pref.quiet_hours_start && pref.quiet_hours_end) {
    pref.quiet_hours_start = '22:00';
  }
  return pref;
});

// ============================================================================
// Property 4: Preference Storage and Defaults
// ============================================================================

describe('Property 4: Preference Storage and Defaults', () => {
  it('default preference has email and in_app enabled, immediate delivery', () => {
    fc.assert(
      fc.property(fc.uuid(), eventTypeArb, (userId, eventType) => {
        const defaultPref = createDefaultPreference(userId, eventType);

        // Verify default values
        expect(defaultPref.user_id).toBe(userId);
        expect(defaultPref.event_type).toBe(eventType);
        expect(defaultPref.email_enabled).toBe(true);
        expect(defaultPref.whatsapp_enabled).toBe(false);
        expect(defaultPref.in_app_enabled).toBe(true);
        expect(defaultPref.push_enabled).toBe(false);
        expect(defaultPref.quiet_hours_start).toBeNull();
        expect(defaultPref.quiet_hours_end).toBeNull();
        expect(defaultPref.digest_frequency).toBe('immediate');
      }),
      { numRuns: 100 }
    );
  });

  it('isDefaultPreference correctly identifies default preferences', () => {
    fc.assert(
      fc.property(fc.uuid(), eventTypeArb, (userId, eventType) => {
        const defaultPref = createDefaultPreference(userId, eventType);
        expect(isDefaultPreference(defaultPref)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('modified preferences are not identified as default', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        eventTypeArb,
        fc.constantFrom('email', 'whatsapp', 'push') as fc.Arbitrary<'email' | 'whatsapp' | 'push'>,
        (userId, eventType, channelToModify) => {
          const pref = createDefaultPreference(userId, eventType);
          
          // Modify one channel from default
          if (channelToModify === 'email') {
            pref.email_enabled = false; // Default is true
          } else if (channelToModify === 'whatsapp') {
            pref.whatsapp_enabled = true; // Default is false
          } else {
            pref.push_enabled = true; // Default is false
          }

          expect(isDefaultPreference(pref)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preference with all channel flags preserved after creation', () => {
    fc.assert(
      fc.property(preferenceArb, (pref) => {
        // All channel flags should be boolean
        expect(typeof pref.email_enabled).toBe('boolean');
        expect(typeof pref.whatsapp_enabled).toBe('boolean');
        expect(typeof pref.in_app_enabled).toBe('boolean');
        expect(typeof pref.push_enabled).toBe('boolean');

        // Digest frequency should be valid
        expect(['immediate', 'hourly', 'daily']).toContain(pref.digest_frequency);

        // Quiet hours should be either both set or both null
        const hasStart = pref.quiet_hours_start !== null;
        const hasEnd = pref.quiet_hours_end !== null;
        expect(hasStart).toBe(hasEnd);
      }),
      { numRuns: 100 }
    );
  });

  it('getEnabledChannels returns only enabled channels', () => {
    fc.assert(
      fc.property(preferenceArb, (pref) => {
        const enabled = getEnabledChannels(pref);

        // Verify each channel
        if (pref.email_enabled) {
          expect(enabled).toContain('email');
        } else {
          expect(enabled).not.toContain('email');
        }

        if (pref.whatsapp_enabled) {
          expect(enabled).toContain('whatsapp');
        } else {
          expect(enabled).not.toContain('whatsapp');
        }

        if (pref.in_app_enabled) {
          expect(enabled).toContain('in_app');
        } else {
          expect(enabled).not.toContain('in_app');
        }

        if (pref.push_enabled) {
          expect(enabled).toContain('push');
        } else {
          expect(enabled).not.toContain('push');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('isChannelEnabled matches getEnabledChannels', () => {
    fc.assert(
      fc.property(preferenceArb, channelArb, (pref, channel) => {
        const enabled = getEnabledChannels(pref);
        const isEnabled = isChannelEnabled(pref, channel);

        expect(isEnabled).toBe(enabled.includes(channel));
      }),
      { numRuns: 100 }
    );
  });

  it('setChannelEnabled produces correct update object', () => {
    fc.assert(
      fc.property(channelArb, fc.boolean(), (channel, enabled) => {
        const update = setChannelEnabled(channel, enabled);

        switch (channel) {
          case 'email':
            expect(update.email_enabled).toBe(enabled);
            break;
          case 'whatsapp':
            expect(update.whatsapp_enabled).toBe(enabled);
            break;
          case 'in_app':
            expect(update.in_app_enabled).toBe(enabled);
            break;
          case 'push':
            expect(update.push_enabled).toBe(enabled);
            break;
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Preference Validation Tests
// ============================================================================

describe('Preference Validation', () => {
  it('valid preferences pass validation', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        eventTypeArb,
        digestFrequencyArb,
        (userId, eventType, digestFrequency) => {
          const pref: NotificationWorkflowPreferenceInsert = {
            user_id: userId,
            event_type: eventType,
            digest_frequency: digestFrequency,
          };

          const result = validatePreference(pref);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('invalid event type fails validation', () => {
    const result = validatePreference({
      user_id: 'test-user',
      event_type: 'invalid.event' as EventType,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid event type');
  });

  it('invalid digest frequency fails validation', () => {
    const result = validatePreference({
      user_id: 'test-user',
      event_type: 'job_order.assigned',
      digest_frequency: 'weekly' as DigestFrequency,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid digest frequency');
  });

  it('valid time format passes validation', () => {
    fc.assert(
      fc.property(validTimeArb, (time) => {
        expect(isValidTimeFormat(time)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('invalid time format fails validation', () => {
    const invalidTimes = ['25:00', '12:60', '24:00', '-1:30', 'abc', '', '12:3'];
    for (const time of invalidTimes) {
      expect(isValidTimeFormat(time)).toBe(false);
    }
  });

  it('valid time formats pass validation', () => {
    const validTimes = ['00:00', '1:30', '01:30', '12:00', '23:59', '9:00'];
    for (const time of validTimes) {
      expect(isValidTimeFormat(time)).toBe(true);
    }
  });

  it('quiet hours must be set together', () => {
    const result1 = validatePreference({
      user_id: 'test-user',
      event_type: 'job_order.assigned',
      quiet_hours_start: '22:00',
      quiet_hours_end: null,
    });
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain('Both quiet hours');

    const result2 = validatePreference({
      user_id: 'test-user',
      event_type: 'job_order.assigned',
      quiet_hours_start: null,
      quiet_hours_end: '07:00',
    });
    expect(result2.valid).toBe(false);
  });

  it('valid quiet hours pass validation', () => {
    fc.assert(
      fc.property(validTimeArb, validTimeArb, (start, end) => {
        const result = validatePreference({
          user_id: 'test-user',
          event_type: 'job_order.assigned',
          quiet_hours_start: start,
          quiet_hours_end: end,
        });
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Quiet Hours Tests
// ============================================================================

describe('Quiet Hours Logic', () => {
  it('no quiet hours means never in quiet hours', () => {
    fc.assert(
      fc.property(preferenceArb, (pref) => {
        const prefNoQuiet = {
          ...pref,
          quiet_hours_start: null,
          quiet_hours_end: null,
        };

        const time = new Date('2025-01-15T14:30:00');
        expect(isTimeInQuietHours(prefNoQuiet, time)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('time within quiet hours returns true', () => {
    const pref: NotificationWorkflowPreference = {
      id: 'test',
      user_id: 'test',
      event_type: 'job_order.assigned',
      email_enabled: true,
      whatsapp_enabled: false,
      in_app_enabled: true,
      push_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      digest_frequency: 'immediate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 23:00 should be in quiet hours (22:00-07:00)
    const time23 = new Date();
    time23.setHours(23, 0, 0, 0);
    expect(isTimeInQuietHours(pref, time23)).toBe(true);

    // 03:00 should be in quiet hours (overnight)
    const time03 = new Date();
    time03.setHours(3, 0, 0, 0);
    expect(isTimeInQuietHours(pref, time03)).toBe(true);

    // 12:00 should NOT be in quiet hours
    const time12 = new Date();
    time12.setHours(12, 0, 0, 0);
    expect(isTimeInQuietHours(pref, time12)).toBe(false);
  });

  it('daytime quiet hours work correctly', () => {
    const pref: NotificationWorkflowPreference = {
      id: 'test',
      user_id: 'test',
      event_type: 'job_order.assigned',
      email_enabled: true,
      whatsapp_enabled: false,
      in_app_enabled: true,
      push_enabled: false,
      quiet_hours_start: '09:00',
      quiet_hours_end: '17:00',
      digest_frequency: 'immediate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 12:00 should be in quiet hours (09:00-17:00)
    const time12 = new Date();
    time12.setHours(12, 0, 0, 0);
    expect(isTimeInQuietHours(pref, time12)).toBe(true);

    // 08:00 should NOT be in quiet hours
    const time08 = new Date();
    time08.setHours(8, 0, 0, 0);
    expect(isTimeInQuietHours(pref, time08)).toBe(false);

    // 18:00 should NOT be in quiet hours
    const time18 = new Date();
    time18.setHours(18, 0, 0, 0);
    expect(isTimeInQuietHours(pref, time18)).toBe(false);
  });
});

// ============================================================================
// Digest Frequency Tests
// ============================================================================

describe('Digest Frequency Logic', () => {
  it('immediate frequency does not batch', () => {
    fc.assert(
      fc.property(preferenceArb, (pref) => {
        const immediatePref = { ...pref, digest_frequency: 'immediate' as DigestFrequency };
        expect(shouldBatchNotification(immediatePref)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('hourly and daily frequencies batch', () => {
    fc.assert(
      fc.property(
        preferenceArb,
        fc.constantFrom<DigestFrequency>('hourly', 'daily'),
        (pref, frequency) => {
          const batchPref = { ...pref, digest_frequency: frequency };
          expect(shouldBatchNotification(batchPref)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getNextDigestTime returns null for immediate', () => {
    fc.assert(
      fc.property(preferenceArb, (pref) => {
        const immediatePref = { ...pref, digest_frequency: 'immediate' as DigestFrequency };
        expect(getNextDigestTime(immediatePref)).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('getNextDigestTime returns future time for hourly', () => {
    const pref: NotificationWorkflowPreference = {
      id: 'test',
      user_id: 'test',
      event_type: 'job_order.assigned',
      email_enabled: true,
      whatsapp_enabled: false,
      in_app_enabled: true,
      push_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
      digest_frequency: 'hourly',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const fromTime = new Date('2025-01-15T10:30:00');
    const nextTime = getNextDigestTime(pref, fromTime);

    expect(nextTime).not.toBeNull();
    if (nextTime) {
      expect(nextTime.getTime()).toBeGreaterThan(fromTime.getTime());
      expect(nextTime.getMinutes()).toBe(0);
      expect(nextTime.getSeconds()).toBe(0);
      expect(nextTime.getHours()).toBe(11); // Next hour
    }
  });

  it('getNextDigestTime returns future time for daily', () => {
    const pref: NotificationWorkflowPreference = {
      id: 'test',
      user_id: 'test',
      event_type: 'job_order.assigned',
      email_enabled: true,
      whatsapp_enabled: false,
      in_app_enabled: true,
      push_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
      digest_frequency: 'daily',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Test when current time is before 9 AM
    const fromTimeBefore9 = new Date('2025-01-15T08:30:00');
    const nextTimeBefore9 = getNextDigestTime(pref, fromTimeBefore9);

    expect(nextTimeBefore9).not.toBeNull();
    if (nextTimeBefore9) {
      expect(nextTimeBefore9.getTime()).toBeGreaterThan(fromTimeBefore9.getTime());
      expect(nextTimeBefore9.getHours()).toBe(9);
      expect(nextTimeBefore9.getDate()).toBe(15); // Same day
    }

    // Test when current time is after 9 AM
    const fromTimeAfter9 = new Date('2025-01-15T10:30:00');
    const nextTimeAfter9 = getNextDigestTime(pref, fromTimeAfter9);

    expect(nextTimeAfter9).not.toBeNull();
    if (nextTimeAfter9) {
      expect(nextTimeAfter9.getTime()).toBeGreaterThan(fromTimeAfter9.getTime());
      expect(nextTimeAfter9.getHours()).toBe(9);
      expect(nextTimeAfter9.getDate()).toBe(16); // Next day
    }
  });
});
