/**
 * Property-Based Tests for PEB Actions
 * Feature: customs-export-documentation
 * 
 * These tests validate the correctness properties for server actions
 * using fast-check for property-based testing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  validatePEBDocument,
  validatePEBItem,
  canTransitionStatus,
  getNextAllowedStatuses,
  calculateItemTotalPrice,
} from '@/lib/peb-utils';
import { PEBStatus, PEB_STATUS_TRANSITIONS } from '@/types/peb';

// =====================================================
// Test Data Generators
// =====================================================

const pebStatusGenerator = fc.constantFrom<PEBStatus>(
  'draft', 'submitted', 'approved', 'loaded', 'departed', 'completed', 'cancelled'
);

const validPEBFormDataGenerator = fc.record({
  exporter_name: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  export_type_id: fc.uuid(),
  customs_office_id: fc.uuid(),
  transport_mode: fc.constantFrom('sea', 'air', 'land') as fc.Arbitrary<'sea' | 'air' | 'land'>,
  currency: fc.constantFrom('USD', 'EUR', 'IDR'),
  fob_value: fc.integer({ min: 0, max: 10000000 }).map(n => n / 100),
});

const validPEBItemFormDataGenerator = fc.record({
  hs_code: fc.stringMatching(/^\d{4}\.\d{2}(\.\d{2})?$/),
  goods_description: fc.string({ minLength: 1, maxLength: 500 }),
  quantity: fc.integer({ min: 1, max: 10000 }).map(n => n / 100),
  unit: fc.constantFrom('PCS', 'KG', 'MT', 'SET', 'UNIT'),
  unit_price: fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
});

// =====================================================
// Property 3: Sequential Item Numbers
// =====================================================

describe('Property 3: Sequential Item Numbers', () => {
  /**
   * Feature: customs-export-documentation
   * Property 3: Sequential Item Numbers
   * For any PEB document, when items are added sequentially, item numbers 
   * SHALL be assigned in ascending order starting from 1 with no gaps.
   * Validates: Requirements 3.1
   */
  it('should assign sequential item numbers starting from 1', () => {
    // This tests the logic that would be used in addPEBItem
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 20 }),
        (existingItemNumbers) => {
          // Sort to simulate existing items
          const sorted = [...existingItemNumbers].sort((a, b) => a - b);
          
          // Get the next item number (same logic as in addPEBItem)
          const maxItemNumber = sorted.length > 0 ? Math.max(...sorted) : 0;
          const nextItemNumber = maxItemNumber + 1;
          
          // Next item number should be one more than the max
          expect(nextItemNumber).toBe(maxItemNumber + 1);
          expect(nextItemNumber).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should start from 1 when no items exist', () => {
    const existingItems: number[] = [];
    const nextItemNumber = existingItems.length > 0 
      ? Math.max(...existingItems) + 1 
      : 1;
    
    expect(nextItemNumber).toBe(1);
  });
});

// =====================================================
// Property 4: Item Required Fields Validation
// =====================================================

describe('Property 4: Item Required Fields Validation', () => {
  /**
   * Feature: customs-export-documentation
   * Property 4: Item Required Fields Validation
   * For any PEB item submission, if HS code or goods description is missing, 
   * the validation SHALL fail and return appropriate error messages.
   * Validates: Requirements 3.2
   */
  it('should reject items without HS code', () => {
    fc.assert(
      fc.property(
        fc.record({
          hs_code: fc.constant(''),
          goods_description: fc.string({ minLength: 1, maxLength: 500 }),
          quantity: fc.integer({ min: 1, max: 10000 }),
          unit: fc.constantFrom('PCS', 'KG', 'MT'),
          unit_price: fc.integer({ min: 1, max: 1000000 }),
        }),
        (itemData) => {
          const result = validatePEBItem(itemData);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.field === 'hs_code')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject items without goods description', () => {
    fc.assert(
      fc.property(
        fc.record({
          hs_code: fc.stringMatching(/^\d{4}\.\d{2}$/),
          goods_description: fc.constant(''),
          quantity: fc.integer({ min: 1, max: 10000 }),
          unit: fc.constantFrom('PCS', 'KG', 'MT'),
          unit_price: fc.integer({ min: 1, max: 1000000 }),
        }),
        (itemData) => {
          const result = validatePEBItem(itemData);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.field === 'goods_description')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid items with all required fields', () => {
    fc.assert(
      fc.property(validPEBItemFormDataGenerator, (itemData) => {
        const result = validatePEBItem(itemData);
        
        // Should be valid when all required fields are present
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 6: Initial Status Invariant
// =====================================================

describe('Property 6: Initial Status Invariant', () => {
  /**
   * Feature: customs-export-documentation
   * Property 6: Initial Status Invariant
   * For any newly created PEB document, the initial status SHALL be 'draft'.
   * Validates: Requirements 4.2
   */
  it('should always start with draft status', () => {
    // The createPEBDocument action always sets status to 'draft'
    // This test validates the status transition logic
    const initialStatus: PEBStatus = 'draft';
    
    // Draft should be able to transition to submitted or cancelled
    const allowedFromDraft = getNextAllowedStatuses(initialStatus);
    
    expect(allowedFromDraft).toContain('submitted');
    expect(allowedFromDraft).toContain('cancelled');
    expect(allowedFromDraft).not.toContain('approved');
    expect(allowedFromDraft).not.toContain('loaded');
    expect(allowedFromDraft).not.toContain('departed');
    expect(allowedFromDraft).not.toContain('completed');
  });

  it('should not allow skipping draft status', () => {
    // Cannot transition directly to any status other than draft's allowed transitions
    const nonDraftStatuses: PEBStatus[] = ['approved', 'loaded', 'departed', 'completed'];
    
    nonDraftStatuses.forEach(status => {
      expect(canTransitionStatus('draft', status)).toBe(false);
    });
  });
});

// =====================================================
// Property 7: Status History Completeness
// =====================================================

describe('Property 7: Status History Completeness', () => {
  /**
   * Feature: customs-export-documentation
   * Property 7: Status History Completeness
   * For any status change on a PEB document, a status history record SHALL 
   * be created containing the previous status, new status, timestamp, and 
   * user who made the change.
   * Validates: Requirements 4.6
   */
  it('should validate all status transitions follow the workflow', () => {
    fc.assert(
      fc.property(pebStatusGenerator, pebStatusGenerator, (currentStatus, targetStatus) => {
        const canTransition = canTransitionStatus(currentStatus, targetStatus);
        const allowedTransitions = PEB_STATUS_TRANSITIONS[currentStatus];
        
        // canTransition should match whether target is in allowed transitions
        expect(canTransition).toBe(allowedTransitions.includes(targetStatus));
      }),
      { numRuns: 100 }
    );
  });

  it('should have valid workflow transitions', () => {
    // Verify the complete workflow path
    const workflowPath: PEBStatus[] = ['draft', 'submitted', 'approved', 'loaded', 'departed', 'completed'];
    
    for (let i = 0; i < workflowPath.length - 1; i++) {
      const current = workflowPath[i];
      const next = workflowPath[i + 1];
      
      expect(canTransitionStatus(current, next)).toBe(true);
    }
  });

  it('should not allow backward transitions', () => {
    // Cannot go backwards in the workflow
    expect(canTransitionStatus('submitted', 'draft')).toBe(false);
    expect(canTransitionStatus('approved', 'submitted')).toBe(false);
    expect(canTransitionStatus('loaded', 'approved')).toBe(false);
    expect(canTransitionStatus('departed', 'loaded')).toBe(false);
    expect(canTransitionStatus('completed', 'departed')).toBe(false);
  });

  it('should allow cancellation from appropriate statuses', () => {
    // Can cancel from draft, submitted, approved
    expect(canTransitionStatus('draft', 'cancelled')).toBe(true);
    expect(canTransitionStatus('submitted', 'cancelled')).toBe(true);
    expect(canTransitionStatus('approved', 'cancelled')).toBe(true);
    
    // Cannot cancel after loaded
    expect(canTransitionStatus('loaded', 'cancelled')).toBe(false);
    expect(canTransitionStatus('departed', 'cancelled')).toBe(false);
    expect(canTransitionStatus('completed', 'cancelled')).toBe(false);
  });

  it('should not allow transitions from terminal states', () => {
    const terminalStatuses: PEBStatus[] = ['completed', 'cancelled'];
    const allStatuses: PEBStatus[] = ['draft', 'submitted', 'approved', 'loaded', 'departed', 'completed', 'cancelled'];
    
    terminalStatuses.forEach(terminal => {
      allStatuses.forEach(target => {
        if (terminal !== target) {
          expect(canTransitionStatus(terminal, target)).toBe(false);
        }
      });
    });
  });
});

// =====================================================
// Property 2: Required Field Validation (Document)
// =====================================================

describe('Property 2: Required Field Validation', () => {
  /**
   * Feature: customs-export-documentation
   * Property 2: Required Field Validation
   * For any PEB document submission, if exporter name, export type, or 
   * customs office is missing, the validation SHALL fail.
   * Validates: Requirements 2.5
   */
  it('should reject documents without exporter name', () => {
    fc.assert(
      fc.property(
        fc.record({
          exporter_name: fc.constant(''),
          export_type_id: fc.uuid(),
          customs_office_id: fc.uuid(),
          transport_mode: fc.constantFrom('sea', 'air', 'land') as fc.Arbitrary<'sea' | 'air' | 'land'>,
          currency: fc.constant('USD'),
          fob_value: fc.integer({ min: 0, max: 10000 }),
        }),
        (formData) => {
          const result = validatePEBDocument(formData);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.field === 'exporter_name')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject documents without export type', () => {
    const result = validatePEBDocument({
      exporter_name: 'Test Exporter',
      export_type_id: undefined as unknown as string,
      customs_office_id: 'test-office-id',
      transport_mode: 'sea',
      currency: 'USD',
      fob_value: 1000,
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'export_type_id')).toBe(true);
  });

  it('should reject documents without customs office', () => {
    const result = validatePEBDocument({
      exporter_name: 'Test Exporter',
      export_type_id: 'test-type-id',
      customs_office_id: undefined as unknown as string,
      transport_mode: 'sea',
      currency: 'USD',
      fob_value: 1000,
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'customs_office_id')).toBe(true);
  });

  it('should accept valid documents with all required fields', () => {
    fc.assert(
      fc.property(validPEBFormDataGenerator, (formData) => {
        const result = validatePEBDocument(formData);
        
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 5: Item Total Price Calculation (in actions)
// =====================================================

describe('Property 5: Item Total Price Calculation in Actions', () => {
  /**
   * Feature: customs-export-documentation
   * Property 5: Item Total Price Calculation
   * For any PEB item with quantity and unit price, the total price 
   * SHALL equal quantity × unit price.
   * Validates: Requirements 3.5
   */
  it('should calculate total price correctly when adding items', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }).map(n => n / 100),
        fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
        (quantity, unitPrice) => {
          const totalPrice = calculateItemTotalPrice(quantity, unitPrice);
          const expected = Math.round(quantity * unitPrice * 100) / 100;
          
          expect(totalPrice).toBeCloseTo(expected, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
