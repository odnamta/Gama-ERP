/**
 * Property-based tests for template utilities
 * Feature: customs-document-templates
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  extractPlaceholders,
  validatePlaceholders,
  fillTemplate,
  resolvePlaceholders,
  generateDocumentNumber,
  validateTemplateFormData,
  validatePlaceholderDefinition,
  isValidDocumentType,
  isValidDocumentStatus,
  isValidPlaceholderSource,
} from '@/lib/template-utils';
import type { PlaceholderDefinition, DocumentType } from '@/types/customs-templates';
import type { PIBDocument, PIBItem } from '@/types/pib';

// Arbitraries for generating test data
const placeholderKeyArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{0,19}$/);

const placeholderSourceArb = fc.oneof(
  fc.constant('manual'),
  fc.constant('current_date'),
  fc.constant('pib_items'),
  fc.constant('peb_items'),
  placeholderKeyArb.map(k => `pib.${k}`),
  placeholderKeyArb.map(k => `peb.${k}`)
);

const placeholderDefinitionArb: fc.Arbitrary<PlaceholderDefinition> = fc.record({
  key: placeholderKeyArb,
  label: fc.string({ minLength: 1, maxLength: 50 }),
  source: placeholderSourceArb,
  type: fc.oneof(
    fc.constant('text' as const),
    fc.constant('number' as const),
    fc.constant('date' as const),
    fc.constant(undefined)
  ),
});

const documentTypeArb: fc.Arbitrary<DocumentType> = fc.constantFrom(
  'packing_list',
  'commercial_invoice',
  'coo',
  'insurance_cert',
  'bill_of_lading',
  'shipping_instruction',
  'cargo_manifest'
);

describe('Template Utilities Property Tests', () => {
  /**
   * Property 5: Template Filling Correctness
   * For any valid template HTML and data object, filling the template SHALL:
   * - Replace all {{key}} placeholders with corresponding values from data
   * - Expand all {{#array}}...{{/array}} blocks for each item in the array
   * - Replace missing placeholder values with empty strings
   * Validates: Requirements 2.1, 2.5, 2.6
   */
  describe('Property 5: Template Filling Correctness', () => {
    it('should replace simple placeholders with values', () => {
      fc.assert(
        fc.property(
          placeholderKeyArb,
          fc.string({ minLength: 1, maxLength: 100 }),
          (key, value) => {
            const html = `<div>{{${key}}}</div>`;
            const data = { [key]: value };
            const result = fillTemplate(html, data);
            expect(result).toBe(`<div>${value}</div>`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should replace missing placeholders with empty strings', () => {
      fc.assert(
        fc.property(placeholderKeyArb, (key) => {
          const html = `<div>{{${key}}}</div>`;
          const data = {}; // No data provided
          const result = fillTemplate(html, data);
          expect(result).toBe('<div></div>');
        }),
        { numRuns: 100 }
      );
    });

    it('should expand array blocks for each item', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ name: fc.string({ minLength: 1, maxLength: 20 }) }), { minLength: 1, maxLength: 5 }),
          (items) => {
            const html = '<ul>{{#items}}<li>{{name}}</li>{{/items}}</ul>';
            const data = { items };
            const result = fillTemplate(html, data);
            
            // Should contain one <li> for each item
            const liCount = (result.match(/<li>/g) || []).length;
            expect(liCount).toBe(items.length);
            
            // Each item's name should appear in the result
            for (const item of items) {
              expect(result).toContain(item.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty arrays by removing the block', () => {
      const html = '<ul>{{#items}}<li>{{name}}</li>{{/items}}</ul>';
      const data = { items: [] };
      const result = fillTemplate(html, data);
      expect(result).toBe('<ul></ul>');
    });
  });

  /**
   * Property 6: Placeholder Resolution from Source Data
   * For any PIB or PEB document and template with placeholders mapped to that source,
   * resolving placeholders SHALL return values that match the corresponding fields in the source document.
   * Validates: Requirements 3.1
   */
  describe('Property 6: Placeholder Resolution from Source Data', () => {
    it('should resolve PIB field placeholders correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (importerName, supplierName) => {
            const pibData: Partial<PIBDocument> = {
              importer_name: importerName,
              supplier_name: supplierName,
            } as PIBDocument;

            const definitions: PlaceholderDefinition[] = [
              { key: 'buyer', label: 'Buyer', source: 'pib.importer_name' },
              { key: 'seller', label: 'Seller', source: 'pib.supplier_name' },
            ];

            const resolved = resolvePlaceholders(definitions, pibData as PIBDocument);
            
            expect(resolved.buyer).toBe(importerName);
            expect(resolved.seller).toBe(supplierName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should resolve current_date to today\'s date', () => {
      const definitions: PlaceholderDefinition[] = [
        { key: 'date', label: 'Date', source: 'current_date' },
      ];

      const resolved = resolvePlaceholders(definitions);
      
      // Should be a date string in DD/MM/YYYY format
      expect(resolved.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('should resolve manual placeholders to empty string or default', () => {
      fc.assert(
        fc.property(
          placeholderKeyArb,
          fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          (key, defaultValue) => {
            const definitions: PlaceholderDefinition[] = [
              { key, label: 'Manual Field', source: 'manual', defaultValue: defaultValue ?? undefined },
            ];

            const resolved = resolvePlaceholders(definitions);
            
            expect(resolved[key]).toBe(defaultValue ?? '');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Document Number Format Compliance
   * For any generated document, the document_number SHALL match the pattern
   * ^[A-Z]{3}-\d{8}-\d{4}$ (TYPE-YYYYMMDD-NNNN).
   * Validates: Requirements 3.4
   */
  describe('Property 7: Document Number Format Compliance', () => {
    it('should generate document numbers matching the required format', () => {
      fc.assert(
        fc.property(
          documentTypeArb,
          fc.integer({ min: 1, max: 9999 }),
          (docType, sequence) => {
            const docNumber = generateDocumentNumber(docType, sequence);
            
            // Should match pattern TYPE-YYYYMMDD-NNNN
            const pattern = /^[A-Z]{3}-\d{8}-\d{4}$/;
            expect(docNumber).toMatch(pattern);
            
            // Prefix should be first 3 chars of document type (uppercase)
            const expectedPrefix = docType.substring(0, 3).toUpperCase();
            expect(docNumber.startsWith(expectedPrefix)).toBe(true);
            
            // Sequence should be zero-padded to 4 digits
            const seqPart = docNumber.split('-')[2];
            expect(seqPart).toBe(String(sequence).padStart(4, '0'));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Placeholder-Definition Consistency
   * For any template, all placeholder keys found in template_html (matching {{key}} pattern,
   * excluding array markers) SHALL have corresponding entries in the placeholders array.
   * Validates: Requirements 7.4
   */
  describe('Property 11: Placeholder-Definition Consistency', () => {
    it('should detect missing placeholder definitions', () => {
      fc.assert(
        fc.property(
          fc.array(placeholderKeyArb, { minLength: 1, maxLength: 5 }),
          (keys) => {
            // Create HTML with all placeholders
            const html = keys.map(k => `{{${k}}}`).join(' ');
            
            // Create definitions for only half the keys
            const halfKeys = keys.slice(0, Math.ceil(keys.length / 2));
            const definitions: PlaceholderDefinition[] = halfKeys.map(k => ({
              key: k,
              label: k,
              source: 'manual',
            }));

            const result = validatePlaceholders(html, definitions);
            
            // Missing should contain keys not in definitions
            const missingKeys = keys.filter(k => !halfKeys.includes(k));
            for (const missing of missingKeys) {
              expect(result.missing).toContain(missing);
            }
            
            // If there are missing keys, valid should be false
            if (missingKeys.length > 0) {
              expect(result.valid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect unused placeholder definitions', () => {
      fc.assert(
        fc.property(
          fc.array(placeholderKeyArb, { minLength: 2, maxLength: 5 }),
          (keys) => {
            // Ensure unique keys to avoid duplicate definition issues
            const uniqueKeys = [...new Set(keys)];
            if (uniqueKeys.length < 2) return true; // Skip if not enough unique keys
            
            // Create HTML with only first key
            const html = `{{${uniqueKeys[0]}}}`;
            
            // Create definitions for all unique keys
            const definitions: PlaceholderDefinition[] = uniqueKeys.map(k => ({
              key: k,
              label: k,
              source: 'manual',
            }));

            const result = validatePlaceholders(html, definitions);
            
            // Unused should contain all keys except the first
            const unusedKeys = uniqueKeys.slice(1);
            for (const unused of unusedKeys) {
              expect(result.unused).toContain(unused);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid=true when all placeholders are defined', () => {
      fc.assert(
        fc.property(
          fc.array(placeholderKeyArb, { minLength: 1, maxLength: 5 }),
          (keys) => {
            // Ensure unique keys
            const uniqueKeys = [...new Set(keys)];
            
            // Create HTML with all placeholders
            const html = uniqueKeys.map(k => `{{${k}}}`).join(' ');
            
            // Create definitions for all keys
            const definitions: PlaceholderDefinition[] = uniqueKeys.map(k => ({
              key: k,
              label: k,
              source: 'manual',
            }));

            const result = validatePlaceholders(html, definitions);
            
            expect(result.valid).toBe(true);
            expect(result.missing).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: Template Validation Requires All Mandatory Fields
   * For any template creation attempt, if any of the required fields
   * (template_code, template_name, document_type, template_html) is missing or empty,
   * the creation SHALL fail with a validation error.
   * Validates: Requirements 1.2
   */
  describe('Property 1: Template Validation Requires All Mandatory Fields', () => {
    it('should reject templates with missing template_code', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          documentTypeArb,
          fc.string({ minLength: 10, maxLength: 100 }),
          (name, docType, html) => {
            const result = validateTemplateFormData({
              template_code: '',
              template_name: name,
              document_type: docType,
              template_html: `<html>${html}</html>`,
            });
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'template_code')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject templates with missing template_name', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          documentTypeArb,
          fc.string({ minLength: 10, maxLength: 100 }),
          (code, docType, html) => {
            const result = validateTemplateFormData({
              template_code: code,
              template_name: '',
              document_type: docType,
              template_html: `<html>${html}</html>`,
            });
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'template_name')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject templates with missing template_html', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          documentTypeArb,
          (code, name, docType) => {
            const result = validateTemplateFormData({
              template_code: code,
              template_name: name,
              document_type: docType,
              template_html: '',
            });
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'template_html')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Placeholder Definition Validation
   * For any placeholder definition, if the key, label, or source field is missing or empty,
   * the definition SHALL be rejected as invalid.
   * Validates: Requirements 2.2
   */
  describe('Property 2: Placeholder Definition Validation', () => {
    it('should reject placeholder definitions with missing key', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          placeholderSourceArb,
          (label, source) => {
            const result = validatePlaceholderDefinition({
              key: '',
              label,
              source,
            });
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('key'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject placeholder definitions with missing label', () => {
      fc.assert(
        fc.property(
          placeholderKeyArb,
          placeholderSourceArb,
          (key, source) => {
            const result = validatePlaceholderDefinition({
              key,
              label: '',
              source,
            });
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('label'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject placeholder definitions with missing source', () => {
      fc.assert(
        fc.property(
          placeholderKeyArb,
          fc.string({ minLength: 1, maxLength: 50 }),
          (key, label) => {
            const result = validatePlaceholderDefinition({
              key,
              label,
              source: '',
            });
            
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('source'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid placeholder definitions', () => {
      // Use stringMatching to ensure non-whitespace-only labels
      const nonWhitespaceLabel = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,49}$/);
      fc.assert(
        fc.property(
          placeholderKeyArb,
          nonWhitespaceLabel,
          placeholderSourceArb,
          (key, label, source) => {
            const result = validatePlaceholderDefinition({
              key,
              label,
              source,
            });
            
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Valid Enum Values Enforcement
   * For any document_type value, it must be one of the valid types.
   * For any placeholder source, it must match a valid source pattern.
   * For any document status, it must be one of the valid statuses.
   * Validates: Requirements 1.4, 2.3, 5.1
   */
  describe('Property 3: Valid Enum Values Enforcement', () => {
    it('should accept valid document types', () => {
      fc.assert(
        fc.property(documentTypeArb, (docType) => {
          expect(isValidDocumentType(docType)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid document types', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
            !['packing_list', 'commercial_invoice', 'coo', 'insurance_cert', 
              'bill_of_lading', 'shipping_instruction', 'cargo_manifest'].includes(s)
          ),
          (invalidType) => {
            expect(isValidDocumentType(invalidType)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid document statuses', () => {
      const validStatuses = ['draft', 'final', 'sent', 'archived'];
      for (const status of validStatuses) {
        expect(isValidDocumentStatus(status)).toBe(true);
      }
    });

    it('should reject invalid document statuses', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
            !['draft', 'final', 'sent', 'archived'].includes(s)
          ),
          (invalidStatus) => {
            expect(isValidDocumentStatus(invalidStatus)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid placeholder sources', () => {
      fc.assert(
        fc.property(placeholderSourceArb, (source) => {
          expect(isValidPlaceholderSource(source)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid placeholder sources', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
            !s.startsWith('pib.') && !s.startsWith('peb.') &&
            !['manual', 'current_date', 'pib_items', 'peb_items'].includes(s)
          ),
          (invalidSource) => {
            expect(isValidPlaceholderSource(invalidSource)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
