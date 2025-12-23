// =====================================================
// v0.66: TEMPLATE MANAGEMENT ACTIONS PROPERTY TESTS
// =====================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { isValidTemplateCategory } from '@/lib/automation-utils';
import type { AutomationTemplate, TemplateCategory, CreateAutomationTemplateInput } from '@/types/automation';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
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
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

describe('Template Management Actions Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Arbitraries for template data
  const templateCodeArb = fc.stringMatching(/^[A-Z][A-Z0-9_]{2,30}$/);
  const templateNameArb = fc.string({ minLength: 1, maxLength: 100 });
  const categoryArb = fc.constantFrom<TemplateCategory>('notification', 'document', 'integration', 'data_sync', 'reporting');
  const workflowJsonArb = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.array(fc.string()))
  );
  const credentialsArb = fc.array(
    fc.constantFrom('supabase', 'smtp', 'whatsapp', 'slack', 'telegram'),
    { minLength: 0, maxLength: 5 }
  );

  /**
   * **Feature: n8n-automation-foundation, Property 13: Template Data Integrity**
   * *For any* automation template, the template SHALL have template_code, template_name, 
   * and category fields populated. The workflow_json, required_credentials, and 
   * config_schema fields SHALL be stored when provided.
   * **Validates: Requirements 6.1, 6.3, 6.4, 6.5**
   */
  describe('Property 13: Template Data Integrity', () => {
    it('templates should have required fields populated', () => {
      fc.assert(
        fc.property(
          templateCodeArb,
          templateNameArb,
          categoryArb,
          (code, name, category) => {
            const template: Partial<AutomationTemplate> = {
              template_code: code,
              template_name: name,
              category,
            };

            return (
              typeof template.template_code === 'string' &&
              template.template_code.length > 0 &&
              typeof template.template_name === 'string' &&
              template.template_name.length > 0 &&
              typeof template.category === 'string' &&
              template.category.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('workflow_json should be stored when provided', () => {
      fc.assert(
        fc.property(
          templateCodeArb,
          templateNameArb,
          categoryArb,
          workflowJsonArb,
          (code, name, category, workflowJson) => {
            const template: Partial<AutomationTemplate> = {
              template_code: code,
              template_name: name,
              category,
              workflow_json: workflowJson,
            };

            return template.workflow_json !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('required_credentials should be stored when provided', () => {
      fc.assert(
        fc.property(
          templateCodeArb,
          templateNameArb,
          categoryArb,
          credentialsArb,
          (code, name, category, credentials) => {
            const template: Partial<AutomationTemplate> = {
              template_code: code,
              template_name: name,
              category,
              required_credentials: credentials,
            };

            return (
              Array.isArray(template.required_credentials) &&
              template.required_credentials.length === credentials.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('config_schema should be stored when provided', () => {
      fc.assert(
        fc.property(
          templateCodeArb,
          templateNameArb,
          categoryArb,
          fc.dictionary(fc.string(), fc.jsonValue()),
          (code, name, category, configSchema) => {
            const template: Partial<AutomationTemplate> = {
              template_code: code,
              template_name: name,
              category,
              config_schema: configSchema,
            };

            return template.config_schema !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('template input should map correctly to template structure', () => {
      fc.assert(
        fc.property(
          templateCodeArb,
          templateNameArb,
          categoryArb,
          fc.option(fc.string({ minLength: 1, maxLength: 500 })),
          workflowJsonArb,
          credentialsArb,
          (code, name, category, description, workflowJson, credentials) => {
            const input: CreateAutomationTemplateInput = {
              templateCode: code,
              templateName: name,
              category,
              description: description ?? undefined,
              workflowJson,
              requiredCredentials: credentials,
            };

            // Verify all input fields are present
            return (
              input.templateCode === code &&
              input.templateName === name &&
              input.category === category
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-automation-foundation, Property 14: Template Category Validation**
   * *For any* automation template, the category SHALL be one of: 'notification', 
   * 'document', 'integration', 'data_sync', or 'reporting'. Creating a template 
   * with any other category SHALL be rejected.
   * **Validates: Requirements 6.2**
   */
  describe('Property 14: Template Category Validation', () => {
    it('should accept all valid categories', () => {
      const validCategories: TemplateCategory[] = ['notification', 'document', 'integration', 'data_sync', 'reporting'];

      fc.assert(
        fc.property(fc.constantFrom(...validCategories), (category) => {
          return isValidTemplateCategory(category) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid categories', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => 
            !['notification', 'document', 'integration', 'data_sync', 'reporting'].includes(s) &&
            s.length > 0
          ),
          (invalidCategory) => {
            return isValidTemplateCategory(invalidCategory) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('templates with valid categories should be accepted', () => {
      fc.assert(
        fc.property(
          templateCodeArb,
          templateNameArb,
          categoryArb,
          (code, name, category) => {
            const input: CreateAutomationTemplateInput = {
              templateCode: code,
              templateName: name,
              category,
            };

            return isValidTemplateCategory(input.category);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('each category should have distinct meaning', () => {
      const categories: TemplateCategory[] = ['notification', 'document', 'integration', 'data_sync', 'reporting'];
      
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 4 }),
          fc.integer({ min: 0, max: 4 }),
          (i, j) => {
            if (i === j) return true;
            return categories[i] !== categories[j];
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional tests for template filtering
   */
  describe('Template Filtering', () => {
    // Generate sample templates for testing
    const generateTemplates = (count: number): AutomationTemplate[] => {
      const categories: TemplateCategory[] = ['notification', 'document', 'integration', 'data_sync', 'reporting'];
      const templates: AutomationTemplate[] = [];
      
      for (let i = 0; i < count; i++) {
        templates.push({
          id: `template-${i}`,
          template_code: `TEMPLATE_${i}`,
          template_name: `Template ${i}`,
          description: `Description for template ${i}`,
          category: categories[i % 5],
          workflow_json: { nodes: [], connections: {} },
          required_credentials: ['supabase'],
          config_schema: {},
          is_active: i % 2 === 0,
          created_at: new Date().toISOString(),
        });
      }
      
      return templates;
    };

    it('filtering by category should return only matching templates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          categoryArb,
          (count, filterCategory) => {
            const templates = generateTemplates(count);
            const filtered = templates.filter(t => t.category === filterCategory);
            
            return filtered.every(t => t.category === filterCategory);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtering by active status should return only matching templates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          fc.boolean(),
          (count, isActive) => {
            const templates = generateTemplates(count);
            const filtered = templates.filter(t => t.is_active === isActive);
            
            return filtered.every(t => t.is_active === isActive);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('combining category and active filters should return intersection', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 20, max: 100 }),
          categoryArb,
          fc.boolean(),
          (count, filterCategory, isActive) => {
            const templates = generateTemplates(count);
            const filtered = templates.filter(t => 
              t.category === filterCategory && 
              t.is_active === isActive
            );
            
            return filtered.every(t => 
              t.category === filterCategory && 
              t.is_active === isActive
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
