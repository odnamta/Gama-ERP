// __tests__/notification-sender-utils.property.test.ts
// Property-based tests for notification sender utilities (v0.67)

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getDeliveryChannels,
  getSkippedChannels,
  shouldDelayForQuietHours,
  shouldBatchForDigest,
  getDeliveryTiming,
  renderNotificationsForChannels,
  prepareNotification,
  isValidEmail,
  buildSuccessResult,
  buildPartialResult,
  buildFailureResult,
} from '@/lib/notification-sender-utils';
import type {
  NotificationTemplate,
  NotificationWorkflowPreference,
  NotificationChannel,
  EventType,
  DigestFrequency,
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

const channelArb = fc.constantFrom<NotificationChannel>('email', 'whatsapp', 'in_app', 'push');

const digestFrequencyArb = fc.constantFrom<DigestFrequency>('immediate', 'hourly', 'daily');

const validTimeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

// Valid email arbitrary
const validEmailArb = fc.tuple(
  fc.stringMatching(/^[a-z]{3,10}$/),
  fc.stringMatching(/^[a-z]{3,10}$/),
  fc.constantFrom('com', 'co.id', 'org', 'net')
).map(([user, domain, tld]) => `${user}@${domain}.${tld}`);

// Valid Indonesian phone arbitrary
const validPhoneArb = fc.tuple(
  fc.constantFrom('81', '82', '85', '87', '88'),
  fc.stringMatching(/^[0-9]{8,9}$/)
).map(([prefix, rest]) => '+62' + prefix + rest);

// Template with all channels
const fullTemplateArb: fc.Arbitrary<NotificationTemplate> = fc.record({
  id: fc.uuid(),
  template_code: fc.stringMatching(/^[A-Z][A-Z0-9_]{2,20}$/),
  template_name: fc.string({ minLength: 1, maxLength: 50 }),
  event_type: eventTypeArb,
  email_subject: fc.constant('Test Subject {{name}}'),
  email_body_html: fc.constant('<p>Hello {{name}}</p>'),
  email_body_text: fc.constant('Hello {{name}}'),
  whatsapp_template_id: fc.constant(null),
  whatsapp_body: fc.constant('Hello {{name}}'),
  in_app_title: fc.constant('Notification'),
  in_app_body: fc.constant('Hello {{name}}'),
  in_app_action_url: fc.constant('/test'),
  push_title: fc.constant('Alert'),
  push_body: fc.constant('Hello {{name}}'),
  placeholders: fc.constant([{ key: 'name', description: 'Name' }]),
  is_active: fc.constant(true),
  created_at: fc.constant(new Date().toISOString()),
});

// Preference arbitrary
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
  created_at: fc.constant(new Date().toISOString()),
  updated_at: fc.constant(new Date().toISOString()),
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
// Property 5: Channel Filtering by Preferences
// ============================================================================

describe('Property 5: Channel Filtering by Preferences', () => {
  it('only enabled channels are included in delivery', () => {
    fc.assert(
      fc.property(
        fullTemplateArb,
        preferenceArb,
        validEmailArb,
        validPhoneArb,
        (template, preference, email, phone) => {
          const channels = getDeliveryChannels(template, preference, email, phone);

          // Email should only be included if enabled
          if (preference.email_enabled) {
            expect(channels.includes('email')).toBe(true);
          } else {
            expect(channels.includes('email')).toBe(false);
          }

          // WhatsApp should only be included if enabled
          if (preference.whatsapp_enabled) {
            expect(channels.includes('whatsapp')).toBe(true);
          } else {
            expect(channels.includes('whatsapp')).toBe(false);
          }

          // In-app should only be included if enabled
          if (preference.in_app_enabled) {
            expect(channels.includes('in_app')).toBe(true);
          } else {
            expect(channels.includes('in_app')).toBe(false);
          }

          // Push should only be included if enabled
          if (preference.push_enabled) {
            expect(channels.includes('push')).toBe(true);
          } else {
            expect(channels.includes('push')).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('channels without recipient info are excluded', () => {
    fc.assert(
      fc.property(fullTemplateArb, preferenceArb, (template, preference) => {
        // Enable all channels
        const allEnabledPref = {
          ...preference,
          email_enabled: true,
          whatsapp_enabled: true,
          in_app_enabled: true,
          push_enabled: true,
        };

        // No email or phone provided
        const channels = getDeliveryChannels(template, allEnabledPref, undefined, undefined);

        // Email and WhatsApp should be excluded (no recipient)
        expect(channels.includes('email')).toBe(false);
        expect(channels.includes('whatsapp')).toBe(false);

        // In-app and push should still be included
        expect(channels.includes('in_app')).toBe(true);
        expect(channels.includes('push')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('invalid email excludes email channel', () => {
    fc.assert(
      fc.property(fullTemplateArb, preferenceArb, validPhoneArb, (template, preference, phone) => {
        const allEnabledPref = {
          ...preference,
          email_enabled: true,
          whatsapp_enabled: true,
        };

        // Invalid email
        const channels = getDeliveryChannels(template, allEnabledPref, 'invalid-email', phone);

        expect(channels.includes('email')).toBe(false);
        expect(channels.includes('whatsapp')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('invalid phone excludes whatsapp channel', () => {
    fc.assert(
      fc.property(fullTemplateArb, preferenceArb, validEmailArb, (template, preference, email) => {
        const allEnabledPref = {
          ...preference,
          email_enabled: true,
          whatsapp_enabled: true,
        };

        // Invalid phone
        const channels = getDeliveryChannels(template, allEnabledPref, email, '123');

        expect(channels.includes('email')).toBe(true);
        expect(channels.includes('whatsapp')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('skipped channels have reasons', () => {
    fc.assert(
      fc.property(fullTemplateArb, preferenceArb, (template, preference) => {
        const skipped = getSkippedChannels(template, preference, undefined, undefined);

        // Each skipped channel should have a reason
        for (const item of skipped) {
          expect(item.channel).toBeDefined();
          expect(item.reason).toBeDefined();
          expect(typeof item.reason).toBe('string');
          expect(item.reason.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 6: Quiet Hours and Digest Batching
// ============================================================================

describe('Property 6: Quiet Hours and Digest Batching', () => {
  it('notifications during quiet hours are delayed', () => {
    // Create preference with quiet hours 22:00-07:00
    const prefWithQuietHours: NotificationWorkflowPreference = {
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

    // 23:00 should be in quiet hours
    const time23 = new Date('2025-01-15T23:00:00');
    expect(shouldDelayForQuietHours(prefWithQuietHours, time23)).toBe(true);

    // 03:00 should be in quiet hours (overnight)
    const time03 = new Date('2025-01-15T03:00:00');
    expect(shouldDelayForQuietHours(prefWithQuietHours, time03)).toBe(true);

    // 12:00 should NOT be in quiet hours
    const time12 = new Date('2025-01-15T12:00:00');
    expect(shouldDelayForQuietHours(prefWithQuietHours, time12)).toBe(false);
  });

  it('no quiet hours means no delay', () => {
    fc.assert(
      fc.property(preferenceArb, (preference) => {
        const prefNoQuiet = {
          ...preference,
          quiet_hours_start: null,
          quiet_hours_end: null,
        };

        const time = new Date('2025-01-15T23:00:00');
        expect(shouldDelayForQuietHours(prefNoQuiet, time)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('immediate frequency does not batch', () => {
    fc.assert(
      fc.property(preferenceArb, (preference) => {
        const immediatePref = { ...preference, digest_frequency: 'immediate' as DigestFrequency };
        expect(shouldBatchForDigest(immediatePref)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('hourly and daily frequencies batch', () => {
    fc.assert(
      fc.property(
        preferenceArb,
        fc.constantFrom<DigestFrequency>('hourly', 'daily'),
        (preference, frequency) => {
          const batchPref = { ...preference, digest_frequency: frequency };
          expect(shouldBatchForDigest(batchPref)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getDeliveryTiming returns correct timing', () => {
    // Test immediate (no quiet hours, immediate frequency)
    const immediatePref: NotificationWorkflowPreference = {
      id: 'test',
      user_id: 'test',
      event_type: 'job_order.assigned',
      email_enabled: true,
      whatsapp_enabled: false,
      in_app_enabled: true,
      push_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
      digest_frequency: 'immediate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(getDeliveryTiming(immediatePref)).toBe('immediate');

    // Test delayed (in quiet hours)
    const quietPref: NotificationWorkflowPreference = {
      ...immediatePref,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
    };

    const time23 = new Date('2025-01-15T23:00:00');
    expect(getDeliveryTiming(quietPref, time23)).toBe('delayed_quiet_hours');

    // Test batched (hourly digest, outside quiet hours)
    const batchPref: NotificationWorkflowPreference = {
      ...immediatePref,
      digest_frequency: 'hourly',
    };

    const time12 = new Date('2025-01-15T12:00:00');
    expect(getDeliveryTiming(batchPref, time12)).toBe('batched_digest');
  });
});

// ============================================================================
// Notification Rendering Tests
// ============================================================================

describe('Notification Rendering', () => {
  it('renders notifications for specified channels', () => {
    fc.assert(
      fc.property(
        fullTemplateArb,
        fc.subarray(['email', 'whatsapp', 'in_app', 'push'] as NotificationChannel[]),
        (template, channels) => {
          const data = { name: 'Test User' };
          const rendered = renderNotificationsForChannels(template, data, channels);

          // Should render for each channel
          expect(rendered.length).toBe(channels.length);

          // Each rendered notification should have correct channel
          for (const notification of rendered) {
            expect(channels).toContain(notification.channel);
            expect(notification.body).toBeDefined();
            // Placeholders should be replaced
            expect(notification.body).not.toContain('{{name}}');
            expect(notification.body).toContain('Test User');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('prepareNotification returns complete preparation info', () => {
    fc.assert(
      fc.property(
        fullTemplateArb,
        preferenceArb,
        validEmailArb,
        validPhoneArb,
        (template, preference, email, phone) => {
          const data = { name: 'Test User' };
          const prepared = prepareNotification(template, preference, data, email, phone);

          // Should have all required fields
          expect(prepared.rendered).toBeDefined();
          expect(Array.isArray(prepared.rendered)).toBe(true);
          expect(prepared.deliveryChannels).toBeDefined();
          expect(Array.isArray(prepared.deliveryChannels)).toBe(true);
          expect(prepared.skippedChannels).toBeDefined();
          expect(Array.isArray(prepared.skippedChannels)).toBe(true);
          expect(prepared.timing).toBeDefined();
          expect(['immediate', 'delayed_quiet_hours', 'batched_digest']).toContain(prepared.timing);
          expect(typeof prepared.shouldSendNow).toBe('boolean');

          // Rendered count should match delivery channels
          expect(prepared.rendered.length).toBe(prepared.deliveryChannels.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Email Validation Tests
// ============================================================================

describe('Email Validation', () => {
  it('valid emails pass validation', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        expect(isValidEmail(email)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('invalid emails fail validation', () => {
    const invalidEmails = [
      '',
      'invalid',
      'no@domain',
      '@nodomain.com',
      'spaces in@email.com',
      'missing@.com',
    ];

    for (const email of invalidEmails) {
      expect(isValidEmail(email)).toBe(false);
    }
  });

  it('null and undefined fail validation', () => {
    expect(isValidEmail(null as unknown as string)).toBe(false);
    expect(isValidEmail(undefined as unknown as string)).toBe(false);
  });
});

// ============================================================================
// Result Builder Tests
// ============================================================================

describe('Result Builders', () => {
  it('buildSuccessResult creates valid success result', () => {
    fc.assert(
      fc.property(
        fc.array(channelArb, { maxLength: 4 }),
        fc.array(channelArb, { maxLength: 4 }),
        fc.array(fc.uuid(), { maxLength: 4 }),
        (sent, skipped, logIds) => {
          const result = buildSuccessResult(sent, skipped, logIds);

          expect(result.success).toBe(true);
          expect(result.channels_sent).toEqual(sent);
          expect(result.channels_skipped).toEqual(skipped);
          expect(result.log_ids).toEqual(logIds);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('buildPartialResult success depends on channels sent', () => {
    fc.assert(
      fc.property(
        fc.array(channelArb, { minLength: 0, maxLength: 4 }),
        fc.array(channelArb, { maxLength: 4 }),
        fc.array(fc.uuid(), { maxLength: 4 }),
        (sent, skipped, logIds) => {
          const errors = [{ channel: 'email' as NotificationChannel, error: 'Test error' }];
          const result = buildPartialResult(sent, skipped, logIds, errors);

          // Success should be true only if at least one channel sent
          expect(result.success).toBe(sent.length > 0);
          expect(result.errors).toEqual(errors);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('buildFailureResult creates valid failure result', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (errorMsg) => {
        const result = buildFailureResult(errorMsg);

        expect(result.success).toBe(false);
        expect(result.channels_sent).toHaveLength(0);
        expect(result.log_ids).toHaveLength(0);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].error).toBe(errorMsg);
      }),
      { numRuns: 100 }
    );
  });
});
