/**
 * Property-Based Tests for AI Insights Utils
 * Feature: ai-insights-natural-language
 * 
 * Tests correctness properties defined in design.md
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateSQL,
  validateQueryInput,
  calculateSimilarity,
  matchTemplate,
  extractParameters,
  substituteParameters,
  determineResponseType,
  formatCurrency,
  formatPercentage,
  formatRelativeTime,
  exportToCSV,
  canAccessAIInsights,
  getSuggestedQuestions,
} from '@/lib/ai-insights-utils';
import type { AIQueryTemplate } from '@/types/ai-insights';

// =====================================================
// Property 1: Empty Query Validation
// Validates: Requirements 1.2
// =====================================================
describe('Property 1: Empty Query Validation', () => {
  it('should return false for empty strings', () => {
    fc.assert(
      fc.property(fc.constant(''), (query) => {
        expect(validateQueryInput(query)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should return false for whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
          .map(arr => arr.join('')),
        (query) => {
          expect(validateQueryInput(query)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return true for non-empty, non-whitespace strings', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length > 0),
        (query) => {
          expect(validateQueryInput(query)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 2: Template Matching Threshold
// Validates: Requirements 2.1
// =====================================================
describe('Property 2: Template Matching Threshold', () => {
  const mockTemplate: AIQueryTemplate = {
    id: '1',
    template_name: 'Revenue MTD',
    template_category: 'financial',
    sample_questions: ['What is the revenue this month?', 'How much revenue did we make?'],
    sql_template: 'SELECT SUM(total_revenue) as value FROM job_orders',
    parameters: [],
    response_format: 'text',
    response_template: 'Revenue is {value}',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  it('should match when similarity > 0.7', () => {
    // Exact match should always work
    const result = matchTemplate('What is the revenue this month?', [mockTemplate]);
    expect(result).not.toBeNull();
    expect(result!.similarity).toBeGreaterThan(0.7);
  });

  it('should not match when similarity <= 0.7', () => {
    // Completely unrelated query
    const result = matchTemplate('How is the weather today?', [mockTemplate]);
    expect(result).toBeNull();
  });

  it('similarity calculation should be between 0 and 1', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (s1, s2) => {
        const similarity = calculateSimilarity(s1, s2);
        expect(similarity).toBeGreaterThanOrEqual(0);
        expect(similarity).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it('identical strings should have similarity of 1', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length > 0),
        (s) => {
          const similarity = calculateSimilarity(s, s);
          expect(similarity).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 3: Parameter Extraction and Substitution
// Validates: Requirements 2.2
// =====================================================
describe('Property 3: Parameter Extraction and Substitution', () => {
  it('should substitute named parameters correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/i.test(s)),
          value: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('{') && !s.includes('}')),
        }),
        ({ key, value }) => {
          const template = `SELECT * FROM table WHERE col = '{${key}}'`;
          const result = substituteParameters(template, { [key]: value });
          expect(result).toContain(value);
          expect(result).not.toContain(`{${key}}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle templates without parameters', () => {
    const template = 'SELECT * FROM customers';
    const result = substituteParameters(template, {});
    expect(result).toBe(template);
  });
});

// =====================================================
// Property 6: SQL Validation Blocks Unsafe Queries
// Validates: Requirements 4.1, 4.2, 4.3
// =====================================================
describe('Property 6: SQL Validation Blocks Unsafe Queries', () => {
  const blockedKeywords = [
    'insert', 'update', 'delete', 'drop', 'truncate',
    'alter', 'create', 'grant', 'revoke', 'execute', 'exec'
  ];

  const blockedTables = ['user_profiles', 'auth', 'passwords', 'tokens'];

  it('should block queries with blocked keywords', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...blockedKeywords),
        fc.string(),
        (keyword, suffix) => {
          const sql = `${keyword} ${suffix}`;
          const result = validateSQL(sql);
          expect(result.isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should block queries referencing blocked tables', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...blockedTables),
        (table) => {
          const sql = `SELECT * FROM ${table}`;
          const result = validateSQL(sql);
          expect(result.isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only allow queries starting with SELECT', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE'),
        (keyword) => {
          const sql = `${keyword} something`;
          const result = validateSQL(sql);
          expect(result.isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow valid SELECT queries on non-blocked tables', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('customers', 'job_orders', 'invoices', 'projects'),
        (table) => {
          const sql = `SELECT * FROM ${table}`;
          const result = validateSQL(sql);
          expect(result.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 7: Response Type Determination
// Validates: Requirements 5.1, 5.2, 5.3, 5.4
// =====================================================
describe('Property 7: Response Type Determination', () => {
  it('should return "text" for empty data', () => {
    expect(determineResponseType([])).toBe('text');
    expect(determineResponseType(null as unknown as unknown[])).toBe('text');
    expect(determineResponseType(undefined as unknown as unknown[])).toBe('text');
  });

  it('should return "number" for single row with single column', () => {
    fc.assert(
      fc.property(fc.integer(), (value) => {
        const data = [{ value }];
        expect(determineResponseType(data)).toBe('number');
      }),
      { numRuns: 100 }
    );
  });

  it('should return "table" for 2-20 rows', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }),
        (count) => {
          const data = Array.from({ length: count }, (_, i) => ({ id: i, name: `Item ${i}` }));
          expect(determineResponseType(data)).toBe('table');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "chart" for more than 20 rows', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 21, max: 100 }),
        (count) => {
          const data = Array.from({ length: count }, (_, i) => ({ id: i, value: i * 10 }));
          expect(determineResponseType(data)).toBe('chart');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 8: Value Formatting
// Validates: Requirements 5.5, 5.6
// =====================================================
describe('Property 8: Value Formatting', () => {
  it('currency formatter should produce string starting with "Rp "', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000000000 }), (value) => {
        const formatted = formatCurrency(value);
        expect(formatted).toMatch(/^Rp /);
      }),
      { numRuns: 100 }
    );
  });

  it('currency formatter should handle negative values', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000000000, max: -1 }), (value) => {
        const formatted = formatCurrency(value);
        expect(formatted).toMatch(/^Rp -/);
      }),
      { numRuns: 100 }
    );
  });

  it('percentage formatter should produce string ending with "%"', () => {
    fc.assert(
      fc.property(fc.float({ min: -100, max: 100, noNaN: true }), (value) => {
        const formatted = formatPercentage(value);
        expect(formatted).toMatch(/%$/);
      }),
      { numRuns: 100 }
    );
  });

  it('percentage formatter should have exactly one decimal place', () => {
    fc.assert(
      fc.property(fc.float({ min: -100, max: 100, noNaN: true }), (value) => {
        const formatted = formatPercentage(value);
        // Match pattern like "12.3%" or "-5.0%"
        expect(formatted).toMatch(/^-?\d+\.\d%$/);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 10: History Limit
// Validates: Requirements 7.2
// Note: This tests the utility function behavior
// =====================================================
describe('Property 10: History Limit', () => {
  it('getSuggestedQuestions should return a limited array', () => {
    const suggestions = getSuggestedQuestions();
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeLessThanOrEqual(10);
  });
});

// =====================================================
// Property 11: Relative Timestamp Formatting
// Validates: Requirements 7.4
// =====================================================
describe('Property 11: Relative Timestamp Formatting', () => {
  it('should return "just now" for timestamps within last minute', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');
  });

  it('should return "X minutes ago" for timestamps within last hour', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 59 }), (minutes) => {
        const now = new Date();
        const past = new Date(now.getTime() - minutes * 60 * 1000);
        const result = formatRelativeTime(past);
        expect(result).toMatch(/^\d+ minutes? ago$/);
      }),
      { numRuns: 50 }
    );
  });

  it('should return "X hours ago" for timestamps within last 24 hours', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 23 }), (hours) => {
        const now = new Date();
        const past = new Date(now.getTime() - hours * 60 * 60 * 1000);
        const result = formatRelativeTime(past);
        expect(result).toMatch(/^\d+ hours? ago$/);
      }),
      { numRuns: 50 }
    );
  });

  it('should return "X days ago" for timestamps within last 7 days', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 7 }), (days) => {
        const now = new Date();
        const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const result = formatRelativeTime(past);
        // Could be "X days ago" or "Yesterday"
        expect(result).toMatch(/(\d+ days? ago|Yesterday)/);
      }),
      { numRuns: 50 }
    );
  });

  it('should always return a non-empty string', () => {
    fc.assert(
      fc.property(
        // Generate dates within the last 365 days to ensure valid relative time formatting
        fc.integer({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }).map(ms => new Date(Date.now() - ms)),
        (date) => {
          const result = formatRelativeTime(date);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 12: CSV Export Format
// Validates: Requirements 9.2
// =====================================================
describe('Property 12: CSV Export Format', () => {
  it('should produce header line plus data lines', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (rowCount) => {
          const data = Array.from({ length: rowCount }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
          }));
          const csv = exportToCSV(data);
          const lines = csv.split('\n');
          // Header + data rows
          expect(lines.length).toBe(rowCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have comma-separated values', () => {
    const data = [{ a: 1, b: 2, c: 3 }];
    const csv = exportToCSV(data);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('a,b,c');
    expect(lines[1]).toBe('1,2,3');
  });

  it('should escape values containing commas', () => {
    const data = [{ name: 'Hello, World', value: 123 }];
    const csv = exportToCSV(data);
    expect(csv).toContain('"Hello, World"');
  });

  it('should escape values containing quotes', () => {
    const data = [{ name: 'Say "Hello"', value: 123 }];
    const csv = exportToCSV(data);
    expect(csv).toContain('"Say ""Hello"""');
  });

  it('should return empty string for empty data', () => {
    expect(exportToCSV([])).toBe('');
  });
});

// =====================================================
// Property 13: Role-Based Access Control
// Validates: Requirements 10.1
// =====================================================
describe('Property 13: Role-Based Access Control', () => {
  const allowedRoles = ['owner', 'manager', 'finance'];
  const disallowedRoles = ['sales', 'engineer', 'admin', 'ops', 'viewer', 'guest'];

  it('should return true for allowed roles', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allowedRoles), (role) => {
        expect(canAccessAIInsights(role)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should return false for disallowed roles', () => {
    fc.assert(
      fc.property(fc.constantFrom(...disallowedRoles), (role) => {
        expect(canAccessAIInsights(role)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should return false for empty or invalid input', () => {
    expect(canAccessAIInsights('')).toBe(false);
    expect(canAccessAIInsights(null as unknown as string)).toBe(false);
    expect(canAccessAIInsights(undefined as unknown as string)).toBe(false);
  });

  it('should be case-insensitive', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allowedRoles), (role) => {
        expect(canAccessAIInsights(role.toUpperCase())).toBe(true);
        expect(canAccessAIInsights(role.toLowerCase())).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
