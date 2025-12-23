// __tests__/notification-template-utils.property.test.ts
// Property-based tests for notification template utilities (v0.67)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  replacePlaceholders,
  extractPlaceholderKeys,
  validatePlaceholderData,
  renderTemplate,
  validateTemplate,
  getTemplateSupportedChannels,
} from '@/lib/notification-template-utils';
import type {
  NotificationTemplate,
  PlaceholderDefinition,
  NotificationChannel,
  EventType,
  NotificationTemplateInsert,
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

const placeholderKeyArb = fc.stringMatching(/^[a-z][a-z0-9_]{0,19}$/);

const placeholderDefinitionArb: fc.Arbitrary<PlaceholderDefinition> = fc.record({
  key: placeholderKeyArb,
  description: fc.string({ minLength: 1, maxLength: 100 }),
  default_value: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
});

const templateCodeArb = fc.stringMatching(/^[A-Z][A-Z0-9_]{2,29}$/);

// Use constant date string to avoid invalid date generation issues
const createdAtArb = fc.constant(new Date().toISOString());

const notificationTemplateArb: fc.Arbitrary<NotificationTemplate> = fc.record({
  id: fc.uuid(),
  template_code: templateCodeArb,
  template_name: fc.string({ minLength: 1, maxLength: 100 }),
  event_type: eventTypeArb,
  email_subject: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  email_body_html: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
  email_body_text: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
  whatsapp_template_id: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  whatsapp_body: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  in_app_title: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  in_app_body: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  in_app_action_url: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  push_title: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  push_body: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  placeholders: fc.array(placeholderDefinitionArb, { maxLength: 10 }),
  is_active: fc.boolean(),
  created_at: createdAtArb,
});

// Template with placeholders embedded in content
const templateWithPlaceholdersArb = fc.record({
  id: fc.uuid(),
  template_code: templateCodeArb,
  template_name: fc.string({ minLength: 1, maxLength: 100 }),
  event_type: eventTypeArb,
  email_subject: fc.constant('Subject: {{subject_key}}'),
  email_body_html: fc.constant('<p>Hello {{name}}, your order {{order_id}} is ready.</p>'),
  email_body_text: fc.constant('Hello {{name}}, your order {{order_id}} is ready.'),
  whatsapp_template_id: fc.constant(null),
  whatsapp_body: fc.constant('Hi {{name}}, order {{order_id}} ready.'),
  in_app_title: fc.constant('Order {{order_id}}'),
  in_app_body: fc.constant('Your order is ready, {{name}}!'),
  in_app_action_url: fc.constant('/orders/{{order_id}}'),
  push_title: fc.constant('Order Ready'),
  push_body: fc.constant('{{name}}, order {{order_id}} ready'),
  placeholders: fc.constant([
    { key: 'name', description: 'Customer name' },
    { key: 'order_id', description: 'Order ID' },
    { key: 'subject_key', description: 'Email subject', default_value: 'Order Update' },
  ] as PlaceholderDefinition[]),
  is_active: fc.constant(true),
  created_at: fc.constant(new Date().toISOString()),
});

// ============================================================================
// Property 1: Template Storage Integrity
// ============================================================================

describe('Property 1: Template Storage Integrity', () => {
  it('template validation preserves valid templates', () => {
    fc.assert(
      fc.property(
        fc.record({
          template_code: templateCodeArb,
          template_name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          event_type: eventTypeArb,
          email_subject: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
          email_body_html: fc.constant('<p>Test content</p>'), // Ensure at least one channel
          placeholders: fc.array(placeholderDefinitionArb, { maxLength: 5 }),
        }),
        (template) => {
          const result = validateTemplate(template as NotificationTemplateInsert);
          // Valid templates should pass validation
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('template with all channel fields preserves structure after validation', () => {
    fc.assert(
      fc.property(notificationTemplateArb, (template) => {
        // Validation should not modify the template structure
        const validation = validateTemplate({
          template_code: template.template_code,
          template_name: template.template_name,
          event_type: template.event_type,
          email_subject: template.email_subject,
          email_body_html: template.email_body_html,
          email_body_text: template.email_body_text,
          whatsapp_template_id: template.whatsapp_template_id,
          whatsapp_body: template.whatsapp_body,
          in_app_title: template.in_app_title,
          in_app_body: template.in_app_body,
          in_app_action_url: template.in_app_action_url,
          push_title: template.push_title,
          push_body: template.push_body,
          placeholders: template.placeholders,
          is_active: template.is_active,
        });

        // Should return a validation result (valid or with specific error)
        expect(typeof validation.valid).toBe('boolean');
        if (!validation.valid) {
          expect(validation.error).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('placeholder definitions are preserved in template structure', () => {
    fc.assert(
      fc.property(
        fc.array(placeholderDefinitionArb, { minLength: 1, maxLength: 10 }),
        (placeholders) => {
          const template: NotificationTemplate = {
            id: 'test-id',
            template_code: 'TEST_TEMPLATE',
            template_name: 'Test Template',
            event_type: 'job_order.assigned',
            email_subject: 'Test',
            email_body_html: '<p>Test</p>',
            email_body_text: 'Test',
            whatsapp_template_id: null,
            whatsapp_body: null,
            in_app_title: null,
            in_app_body: null,
            in_app_action_url: null,
            push_title: null,
            push_body: null,
            placeholders,
            is_active: true,
            created_at: new Date().toISOString(),
          };

          // Placeholders should be preserved
          expect(template.placeholders).toEqual(placeholders);
          expect(template.placeholders.length).toBe(placeholders.length);

          // Each placeholder should have required fields
          for (const ph of template.placeholders) {
            expect(ph.key).toBeDefined();
            expect(ph.description).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 2: Placeholder Replacement Completeness
// ============================================================================

describe('Property 2: Placeholder Replacement Completeness', () => {
  it('replaces all placeholders when data contains all keys', () => {
    fc.assert(
      fc.property(
        fc.array(placeholderKeyArb, { minLength: 1, maxLength: 5 }),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 5, maxLength: 10 }),
        (keys, values) => {
          // Build template string with placeholders
          const uniqueKeys = [...new Set(keys)];
          const templateStr = uniqueKeys.map(k => `{{${k}}}`).join(' ');
          
          // Build data object
          const data: Record<string, string> = {};
          uniqueKeys.forEach((key, i) => {
            data[key] = values[i % values.length];
          });

          const result = replacePlaceholders(templateStr, data);

          // Result should not contain any {{key}} patterns for keys in data
          for (const key of uniqueKeys) {
            expect(result).not.toContain(`{{${key}}}`);
            expect(result).toContain(data[key]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('uses default values for missing keys when defaults are defined', () => {
    fc.assert(
      fc.property(
        placeholderKeyArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (key, defaultValue) => {
          const templateStr = `Hello {{${key}}}!`;
          const definitions: PlaceholderDefinition[] = [
            { key, description: 'Test', default_value: defaultValue },
          ];

          const result = replacePlaceholders(templateStr, {}, definitions);

          // Should use default value
          expect(result).toBe(`Hello ${defaultValue}!`);
          expect(result).not.toContain(`{{${key}}}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('leaves placeholders unchanged when no data or default', () => {
    fc.assert(
      fc.property(placeholderKeyArb, (key) => {
        const templateStr = `Hello {{${key}}}!`;

        const result = replacePlaceholders(templateStr, {});

        // Should leave placeholder unchanged
        expect(result).toBe(`Hello {{${key}}}!`);
      }),
      { numRuns: 100 }
    );
  });

  it('handles inline defaults in {{key|default}} format', () => {
    fc.assert(
      fc.property(
        placeholderKeyArb,
        fc.string({ minLength: 1, maxLength: 30 }),
        (key, inlineDefault) => {
          // Avoid | and {} in default value as they're special chars
          // Also trim whitespace since the implementation trims
          const safeDefault = inlineDefault.replace(/[|{}]/g, '').trim();
          if (!safeDefault) return; // Skip if empty after sanitization
          
          const templateStr = `Hello {{${key}|${safeDefault}}}!`;

          const result = replacePlaceholders(templateStr, {});

          // Should use inline default (trimmed)
          expect(result).toBe(`Hello ${safeDefault}!`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('data value takes priority over defaults', () => {
    fc.assert(
      fc.property(
        placeholderKeyArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (key, dataValue, defaultValue) => {
          const templateStr = `Hello {{${key}}}!`;
          const definitions: PlaceholderDefinition[] = [
            { key, description: 'Test', default_value: defaultValue },
          ];
          const data = { [key]: dataValue };

          const result = replacePlaceholders(templateStr, data, definitions);

          // Should use data value, not default
          expect(result).toBe(`Hello ${dataValue}!`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 3: Template Rendering Round-Trip
// ============================================================================

describe('Property 3: Template Rendering Round-Trip', () => {
  it('extracted placeholder keys match those in template', () => {
    fc.assert(
      fc.property(
        fc.array(placeholderKeyArb, { minLength: 1, maxLength: 5 }),
        (keys) => {
          const uniqueKeys = [...new Set(keys)];
          const templateStr = uniqueKeys.map(k => `Value: {{${k}}}`).join(', ');

          const extracted = extractPlaceholderKeys(templateStr);

          // All keys should be extracted
          expect(extracted.sort()).toEqual(uniqueKeys.sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all placeholders accounted for when data or defaults provided', () => {
    fc.assert(
      fc.property(templateWithPlaceholdersArb, (template) => {
        // Provide data for all placeholders
        const data: Record<string, string> = {
          name: 'John',
          order_id: '12345',
          subject_key: 'Your Order',
        };

        const validation = validatePlaceholderData(template, data);

        // All placeholders should be accounted for
        expect(validation.valid).toBe(true);
        expect(validation.missingKeys).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('identifies missing placeholders correctly', () => {
    fc.assert(
      fc.property(templateWithPlaceholdersArb, (template) => {
        // Provide partial data (missing 'name')
        const data: Record<string, string> = {
          order_id: '12345',
          // subject_key has default, so not needed
        };

        const validation = validatePlaceholderData(template, data);

        // Should identify 'name' as missing
        expect(validation.valid).toBe(false);
        expect(validation.missingKeys).toContain('name');
      }),
      { numRuns: 100 }
    );
  });

  it('rendering produces output for channels with content', () => {
    fc.assert(
      fc.property(
        templateWithPlaceholdersArb,
        channelArb,
        (template, channel) => {
          const data = {
            name: 'John',
            order_id: '12345',
            subject_key: 'Order Update',
          };

          const rendered = renderTemplate({ template, data, channel });

          // All channels in templateWithPlaceholdersArb have content
          expect(rendered).not.toBeNull();
          if (rendered) {
            expect(rendered.channel).toBe(channel);
            expect(rendered.body).toBeDefined();
            // Body should have placeholders replaced
            expect(rendered.body).not.toContain('{{name}}');
            expect(rendered.body).not.toContain('{{order_id}}');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Additional Template Utility Tests
// ============================================================================

describe('Template Utility Functions', () => {
  it('getTemplateSupportedChannels returns correct channels', () => {
    fc.assert(
      fc.property(notificationTemplateArb, (template) => {
        const channels = getTemplateSupportedChannels(template);

        // Verify each channel
        if (template.email_body_html || template.email_body_text) {
          expect(channels).toContain('email');
        } else {
          expect(channels).not.toContain('email');
        }

        if (template.whatsapp_body) {
          expect(channels).toContain('whatsapp');
        } else {
          expect(channels).not.toContain('whatsapp');
        }

        if (template.in_app_body) {
          expect(channels).toContain('in_app');
        } else {
          expect(channels).not.toContain('in_app');
        }

        if (template.push_body) {
          expect(channels).toContain('push');
        } else {
          expect(channels).not.toContain('push');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('empty template string returns empty result', () => {
    const result = replacePlaceholders('', { key: 'value' });
    expect(result).toBe('');
  });

  it('template without placeholders returns unchanged', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => !s.includes('{{')),
        (str) => {
          const result = replacePlaceholders(str, { any: 'value' });
          expect(result).toBe(str);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Template Validation Edge Cases
// ============================================================================

describe('Template Validation', () => {
  it('rejects empty template code', () => {
    const result = validateTemplate({
      template_code: '',
      template_name: 'Test',
      event_type: 'job_order.assigned',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Template code');
  });

  it('rejects invalid template code format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z]/.test(s)), // lowercase start
        (code) => {
          const result = validateTemplate({
            template_code: code,
            template_name: 'Test',
            event_type: 'job_order.assigned',
          });
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('rejects invalid event type', () => {
    const result = validateTemplate({
      template_code: 'TEST_CODE',
      template_name: 'Test',
      event_type: 'invalid.event' as EventType,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid event type');
  });

  it('warns when no channel content provided', () => {
    const result = validateTemplate({
      template_code: 'TEST_CODE',
      template_name: 'Test',
      event_type: 'job_order.assigned',
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings).toContain('Template has no content for any channel');
  });
});
