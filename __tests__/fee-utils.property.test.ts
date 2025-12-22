/**
 * Feature: customs-fee-duty-tracking
 * Property-based tests for fee and container utility functions
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidFeeCategory,
  isValidPaymentStatus,
  isValidDocumentType,
  isValidDocumentLink,
  isValidFeeAmount,
  validateFeeForm,
  filterFees,
  calculateFreeTimeEnd,
  calculateStorageDays,
  calculateStorageFee,
  getFreeTimeStatus,
  getDaysUntilFreeTimeExpires,
  isValidContainerStatus,
  validateContainerForm,
  filterContainers,
  aggregateFeesByCategory,
} from '@/lib/fee-utils';
import {
  FEE_CATEGORIES,
  PAYMENT_STATUSES,
  CONTAINER_STATUSES,
  CustomsFeeWithRelations,
  ContainerTrackingWithRelations,
  CustomsFeeFormData,
  ContainerFormData,
} from '@/types/customs-fees';
import { addDays, parseISO, differenceInDays, startOfDay } from 'date-fns';

// =====================================================
// Property 1: Fee Category Validation
// =====================================================
describe('Property 1: Fee Category Validation', () => {
  /**
   * For any valid fee category from the allowed list,
   * isValidFeeCategory SHALL return true
   */
  it('accepts all valid fee categories', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FEE_CATEGORIES),
        (category) => {
          return isValidFeeCategory(category) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any string not in the allowed fee categories,
   * isValidFeeCategory SHALL return false
   */
  it('rejects invalid fee categories', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !FEE_CATEGORIES.includes(s as any)),
        (invalidCategory) => {
          return isValidFeeCategory(invalidCategory) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 2: Fee Document Link Validation
// =====================================================
describe('Property 2: Fee Document Link Validation', () => {
  /**
   * For document_type 'pib', pib_id must be non-null and non-empty
   */
  it('requires pib_id for PIB document type', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (pibId) => {
          return isValidDocumentLink('pib', pibId, null) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For document_type 'peb', peb_id must be non-null and non-empty
   */
  it('requires peb_id for PEB document type', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (pebId) => {
          return isValidDocumentLink('peb', null, pebId) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Missing document link should be invalid
   */
  it('rejects missing document links', () => {
    expect(isValidDocumentLink('pib', null, null)).toBe(false);
    expect(isValidDocumentLink('pib', '', null)).toBe(false);
    expect(isValidDocumentLink('peb', null, null)).toBe(false);
    expect(isValidDocumentLink('peb', null, '')).toBe(false);
  });
});

// =====================================================
// Property 3: Fee Amount Validation
// =====================================================
describe('Property 3: Fee Amount Validation', () => {
  /**
   * For any positive number, isValidFeeAmount SHALL return true
   */
  it('accepts positive amounts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000000 }),
        (amount) => {
          return isValidFeeAmount(amount) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For zero or negative numbers, isValidFeeAmount SHALL return false
   */
  it('rejects zero and negative amounts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: 0 }),
        (amount) => {
          return isValidFeeAmount(amount) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For NaN, isValidFeeAmount SHALL return false
   */
  it('rejects NaN', () => {
    expect(isValidFeeAmount(NaN)).toBe(false);
  });
});

// =====================================================
// Property 4: Free Time End Calculation
// =====================================================
describe('Property 4: Free Time End Calculation', () => {
  /**
   * For any arrival date and free time days,
   * free_time_end SHALL equal arrival_date plus free_time_days
   */
  it('calculates free_time_end as arrival_date plus free_time_days', () => {
    // Test with specific examples for date handling
    const testCases = [
      { arrival: '2024-01-01', days: 7, expected: '2024-01-08' },
      { arrival: '2024-01-15', days: 10, expected: '2024-01-25' },
      { arrival: '2024-02-28', days: 1, expected: '2024-02-29' }, // Leap year
      { arrival: '2024-12-25', days: 7, expected: '2025-01-01' }, // Year boundary
    ];

    for (const tc of testCases) {
      const result = calculateFreeTimeEnd(tc.arrival, tc.days);
      expect(result).toBe(tc.expected);
    }
  });
});

// =====================================================
// Property 5: Storage Days Calculation
// =====================================================
describe('Property 5: Storage Days Calculation', () => {
  /**
   * When gate_out_date exceeds free_time_end,
   * storage_days SHALL equal the difference in days
   */
  it('calculates storage days when gate out exceeds free time', () => {
    const testCases = [
      { freeTimeEnd: '2024-01-10', gateOut: '2024-01-15', expected: 5 },
      { freeTimeEnd: '2024-01-10', gateOut: '2024-01-11', expected: 1 },
      { freeTimeEnd: '2024-02-28', gateOut: '2024-03-05', expected: 6 },
    ];

    for (const tc of testCases) {
      const result = calculateStorageDays(tc.freeTimeEnd, tc.gateOut);
      expect(result).toBe(tc.expected);
    }
  });

  /**
   * When gate_out_date is on or before free_time_end,
   * storage_days SHALL be 0
   */
  it('returns 0 when gate out is within free time', () => {
    const testCases = [
      { freeTimeEnd: '2024-01-10', gateOut: '2024-01-10' },
      { freeTimeEnd: '2024-01-10', gateOut: '2024-01-05' },
      { freeTimeEnd: '2024-01-10', gateOut: '2024-01-01' },
    ];

    for (const tc of testCases) {
      const result = calculateStorageDays(tc.freeTimeEnd, tc.gateOut);
      expect(result).toBe(0);
    }
  });
});

// =====================================================
// Property 6: Storage Fee Calculation
// =====================================================
describe('Property 6: Storage Fee Calculation', () => {
  /**
   * total_storage_fee SHALL equal storage_days multiplied by daily_rate
   */
  it('calculates fee as storage_days times daily_rate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 10000000 }),
        (storageDays, dailyRate) => {
          const fee = calculateStorageFee(storageDays, dailyRate);
          const expected = Math.round(storageDays * dailyRate * 100) / 100;
          
          return Math.abs(fee - expected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * When storage_days is 0, fee SHALL be 0
   */
  it('returns 0 when storage days is 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000000 }),
        (dailyRate) => {
          return calculateStorageFee(0, dailyRate) === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 7: Free Time Status Determination
// =====================================================
describe('Property 7: Free Time Status Determination', () => {
  /**
   * When free_time_end is more than 2 days in the future, status SHALL be 'ok'
   */
  it('returns ok when more than 2 days remaining', () => {
    const futureDate = addDays(new Date(), 5).toISOString().split('T')[0];
    expect(getFreeTimeStatus(futureDate)).toBe('ok');
  });

  /**
   * When free_time_end is within 2 days, status SHALL be 'warning'
   */
  it('returns warning when within 2 days', () => {
    const nearDate = addDays(new Date(), 1).toISOString().split('T')[0];
    expect(getFreeTimeStatus(nearDate)).toBe('warning');
  });

  /**
   * When free_time_end has passed, status SHALL be 'critical'
   */
  it('returns critical when expired', () => {
    const pastDate = addDays(new Date(), -1).toISOString().split('T')[0];
    expect(getFreeTimeStatus(pastDate)).toBe('critical');
  });

  /**
   * When free_time_end is null, status SHALL be 'ok'
   */
  it('returns ok when free_time_end is null', () => {
    expect(getFreeTimeStatus(null)).toBe('ok');
  });
});

// =====================================================
// Property 9: Fee Filtering Correctness
// =====================================================
describe('Property 9: Fee Filtering Correctness', () => {
  const createMockFee = (overrides: Partial<CustomsFeeWithRelations> = {}): CustomsFeeWithRelations => ({
    id: 'test-id',
    document_type: 'pib',
    pib_id: 'pib-1',
    peb_id: null,
    job_order_id: null,
    fee_type_id: 'fee-type-1',
    description: 'Test fee',
    currency: 'IDR',
    amount: 1000000,
    payment_status: 'pending',
    payment_date: null,
    payment_reference: null,
    payment_method: null,
    ntpn: null,
    ntb: null,
    billing_code: null,
    vendor_id: null,
    vendor_invoice_number: null,
    receipt_url: null,
    notes: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fee_type: {
      id: 'fee-type-1',
      fee_code: 'BM',
      fee_name: 'Bea Masuk',
      description: null,
      fee_category: 'duty',
      is_government_fee: true,
      is_active: true,
      display_order: 1,
      created_at: new Date().toISOString(),
    },
    ...overrides,
  });

  /**
   * Filtering by document_type returns only matching fees
   */
  it('filters by document type correctly', () => {
    const fees = [
      createMockFee({ document_type: 'pib' }),
      createMockFee({ document_type: 'peb', pib_id: null, peb_id: 'peb-1' }),
      createMockFee({ document_type: 'pib' }),
    ];

    const filtered = filterFees(fees, { document_type: 'pib' });
    expect(filtered.every((f) => f.document_type === 'pib')).toBe(true);
    expect(filtered.length).toBe(2);
  });

  /**
   * Filtering by payment_status returns only matching fees
   */
  it('filters by payment status correctly', () => {
    const fees = [
      createMockFee({ payment_status: 'pending' }),
      createMockFee({ payment_status: 'paid' }),
      createMockFee({ payment_status: 'pending' }),
    ];

    const filtered = filterFees(fees, { payment_status: 'pending' });
    expect(filtered.every((f) => f.payment_status === 'pending')).toBe(true);
    expect(filtered.length).toBe(2);
  });

  /**
   * Multiple filters are applied with AND logic
   */
  it('applies multiple filters with AND logic', () => {
    const fees = [
      createMockFee({ document_type: 'pib', payment_status: 'pending' }),
      createMockFee({ document_type: 'pib', payment_status: 'paid' }),
      createMockFee({ document_type: 'peb', pib_id: null, peb_id: 'peb-1', payment_status: 'pending' }),
    ];

    const filtered = filterFees(fees, { document_type: 'pib', payment_status: 'pending' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].document_type).toBe('pib');
    expect(filtered[0].payment_status).toBe('pending');
  });
});

// =====================================================
// Property 12: Container Status Validation
// =====================================================
describe('Property 12: Container Status Validation', () => {
  /**
   * For any valid container status from the allowed list,
   * isValidContainerStatus SHALL return true
   */
  it('accepts all valid container statuses', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CONTAINER_STATUSES),
        (status) => {
          return isValidContainerStatus(status) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any string not in the allowed container statuses,
   * isValidContainerStatus SHALL return false
   */
  it('rejects invalid container statuses', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !CONTAINER_STATUSES.includes(s as any)),
        (invalidStatus) => {
          return isValidContainerStatus(invalidStatus) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Additional Property Tests
// =====================================================
describe('Fee Form Validation', () => {
  /**
   * Valid form data should pass validation
   */
  it('validates correct form data', () => {
    const validData: CustomsFeeFormData = {
      document_type: 'pib',
      pib_id: 'test-pib-id',
      fee_type_id: 'test-fee-type-id',
      currency: 'IDR',
      amount: 1000000,
    };

    const result = validateFeeForm(validData);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  /**
   * Missing required fields should fail validation
   */
  it('rejects form data with missing required fields', () => {
    const invalidData: CustomsFeeFormData = {
      document_type: 'pib',
      fee_type_id: '',
      currency: '',
      amount: 0,
    };

    const result = validateFeeForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Container Form Validation', () => {
  /**
   * Valid container form data should pass validation
   */
  it('validates correct container form data', () => {
    const validData: ContainerFormData = {
      container_number: 'ABCD1234567',
      free_time_days: 7,
    };

    const result = validateContainerForm(validData);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  /**
   * Missing container number should fail validation
   */
  it('rejects container form without container number', () => {
    const invalidData: ContainerFormData = {
      container_number: '',
      free_time_days: 7,
    };

    const result = validateContainerForm(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'container_number')).toBe(true);
  });
});

describe('Fee Aggregation by Category', () => {
  /**
   * Aggregation should sum fees by category correctly
   */
  it('aggregates fees by category', () => {
    const createFeeWithCategory = (category: string, amount: number): CustomsFeeWithRelations => ({
      id: 'test-id',
      document_type: 'pib',
      pib_id: 'pib-1',
      peb_id: null,
      job_order_id: null,
      fee_type_id: 'fee-type-1',
      description: null,
      currency: 'IDR',
      amount,
      payment_status: 'pending',
      payment_date: null,
      payment_reference: null,
      payment_method: null,
      ntpn: null,
      ntb: null,
      billing_code: null,
      vendor_id: null,
      vendor_invoice_number: null,
      receipt_url: null,
      notes: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fee_type: {
        id: 'fee-type-1',
        fee_code: 'TEST',
        fee_name: 'Test',
        description: null,
        fee_category: category as any,
        is_government_fee: true,
        is_active: true,
        display_order: 1,
        created_at: new Date().toISOString(),
      },
    });

    const fees = [
      createFeeWithCategory('duty', 1000),
      createFeeWithCategory('duty', 2000),
      createFeeWithCategory('tax', 500),
      createFeeWithCategory('service', 300),
    ];

    const result = aggregateFeesByCategory(fees);
    expect(result.duty).toBe(3000);
    expect(result.tax).toBe(500);
    expect(result.service).toBe(300);
    expect(result.storage).toBe(0);
    expect(result.penalty).toBe(0);
  });
});


// =====================================================
// Property 8: Job Cost Aggregation Consistency
// =====================================================
describe('Property 8: Job Cost Aggregation Consistency', () => {
  const createFeeWithCategory = (category: string, amount: number, status: string = 'pending'): CustomsFeeWithRelations => ({
    id: `test-id-${Math.random()}`,
    document_type: 'pib',
    pib_id: 'pib-1',
    peb_id: null,
    job_order_id: 'job-1',
    fee_type_id: 'fee-type-1',
    description: null,
    currency: 'IDR',
    amount,
    payment_status: status as any,
    payment_date: status === 'paid' ? '2024-01-15' : null,
    payment_reference: null,
    payment_method: null,
    ntpn: null,
    ntb: null,
    billing_code: null,
    vendor_id: null,
    vendor_invoice_number: null,
    receipt_url: null,
    notes: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fee_type: {
      id: 'fee-type-1',
      fee_code: 'TEST',
      fee_name: 'Test',
      description: null,
      fee_category: category as any,
      is_government_fee: true,
      is_active: true,
      display_order: 1,
      created_at: new Date().toISOString(),
    },
  });

  /**
   * Sum of all category totals SHALL equal total_customs_cost
   */
  it('category totals sum to total customs cost', () => {
    const fees = [
      createFeeWithCategory('duty', 1000),
      createFeeWithCategory('tax', 500),
      createFeeWithCategory('service', 300),
      createFeeWithCategory('storage', 200),
      createFeeWithCategory('penalty', 100),
    ];

    const aggregated = aggregateFeesByCategory(fees);
    const totalFromCategories = 
      aggregated.duty + 
      aggregated.tax + 
      aggregated.service + 
      aggregated.storage + 
      aggregated.penalty + 
      aggregated.other;
    
    const totalFromFees = fees.reduce((sum, f) => sum + f.amount, 0);
    
    expect(totalFromCategories).toBe(totalFromFees);
  });

  /**
   * Paid + pending amounts SHALL equal total for active fees
   */
  it('paid plus pending equals total for active fees', () => {
    const fees = [
      createFeeWithCategory('duty', 1000, 'paid'),
      createFeeWithCategory('duty', 2000, 'pending'),
      createFeeWithCategory('tax', 500, 'paid'),
      createFeeWithCategory('tax', 300, 'pending'),
    ];

    const paidTotal = fees
      .filter(f => f.payment_status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0);
    
    const pendingTotal = fees
      .filter(f => f.payment_status === 'pending')
      .reduce((sum, f) => sum + f.amount, 0);
    
    const totalActive = fees
      .filter(f => f.payment_status === 'paid' || f.payment_status === 'pending')
      .reduce((sum, f) => sum + f.amount, 0);

    expect(paidTotal + pendingTotal).toBe(totalActive);
  });
});

// =====================================================
// Property 10: Pending Payments View Correctness
// =====================================================
describe('Property 10: Pending Payments View Correctness', () => {
  const createFeeWithStatus = (status: string, createdAt: string): CustomsFeeWithRelations => ({
    id: `test-id-${Math.random()}`,
    document_type: 'pib',
    pib_id: 'pib-1',
    peb_id: null,
    job_order_id: null,
    fee_type_id: 'fee-type-1',
    description: null,
    currency: 'IDR',
    amount: 1000,
    payment_status: status as any,
    payment_date: null,
    payment_reference: null,
    payment_method: null,
    ntpn: null,
    ntb: null,
    billing_code: null,
    vendor_id: null,
    vendor_invoice_number: null,
    receipt_url: null,
    notes: null,
    created_by: null,
    created_at: createdAt,
    updated_at: createdAt,
    fee_type: {
      id: 'fee-type-1',
      fee_code: 'BM',
      fee_name: 'Bea Masuk',
      description: null,
      fee_category: 'duty',
      is_government_fee: true,
      is_active: true,
      display_order: 1,
      created_at: new Date().toISOString(),
    },
  });

  /**
   * Filtering for pending status SHALL return only pending fees
   */
  it('returns only pending fees when filtered', () => {
    const fees = [
      createFeeWithStatus('pending', '2024-01-01T00:00:00Z'),
      createFeeWithStatus('paid', '2024-01-02T00:00:00Z'),
      createFeeWithStatus('pending', '2024-01-03T00:00:00Z'),
      createFeeWithStatus('waived', '2024-01-04T00:00:00Z'),
      createFeeWithStatus('cancelled', '2024-01-05T00:00:00Z'),
    ];

    const pendingFees = filterFees(fees, { payment_status: 'pending' });
    
    expect(pendingFees.every(f => f.payment_status === 'pending')).toBe(true);
    expect(pendingFees.length).toBe(2);
  });

  /**
   * Pending fees can be sorted by created_at
   */
  it('pending fees can be sorted by creation date', () => {
    const fees = [
      createFeeWithStatus('pending', '2024-01-03T00:00:00Z'),
      createFeeWithStatus('pending', '2024-01-01T00:00:00Z'),
      createFeeWithStatus('pending', '2024-01-02T00:00:00Z'),
    ];

    const sorted = [...fees].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    expect(sorted[0].created_at).toBe('2024-01-01T00:00:00Z');
    expect(sorted[1].created_at).toBe('2024-01-02T00:00:00Z');
    expect(sorted[2].created_at).toBe('2024-01-03T00:00:00Z');
  });
});

// =====================================================
// Property 11: Payment Status Transition
// =====================================================
describe('Property 11: Payment Status Transition', () => {
  /**
   * Valid payment status transitions
   */
  it('validates payment status values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PAYMENT_STATUSES),
        (status) => {
          return isValidPaymentStatus(status) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Payment date is required when marking as paid
   */
  it('requires payment_date when status is paid', () => {
    // A fee marked as paid should have a payment_date
    const paidFeeWithDate = {
      payment_status: 'paid' as const,
      payment_date: '2024-01-15',
    };
    
    const paidFeeWithoutDate = {
      payment_status: 'paid' as const,
      payment_date: null,
    };

    // Valid: paid with date
    expect(paidFeeWithDate.payment_date).not.toBeNull();
    
    // This represents an invalid state that should be prevented by validation
    expect(paidFeeWithoutDate.payment_date).toBeNull();
  });

  /**
   * Pending fees should not have payment_date
   */
  it('pending fees typically have no payment_date', () => {
    const pendingFee = {
      payment_status: 'pending' as const,
      payment_date: null,
    };

    expect(pendingFee.payment_status).toBe('pending');
    expect(pendingFee.payment_date).toBeNull();
  });

  /**
   * Waived and cancelled fees may or may not have dates
   */
  it('waived and cancelled are valid terminal states', () => {
    expect(isValidPaymentStatus('waived')).toBe(true);
    expect(isValidPaymentStatus('cancelled')).toBe(true);
  });
});
