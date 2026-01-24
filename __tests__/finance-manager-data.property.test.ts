/**
 * Property-Based Tests for Finance Manager Dashboard Calculations
 * Feature: v0.9.14-finance-manager-dashboard-real-data
 * 
 * These tests verify the correctness properties defined in the design document
 * for all calculation functions used in the Finance Manager Dashboard.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateRevenueYTD,
  calculateExpensesMTD,
  calculateGrossProfit,
  calculateAROverdue,
  groupInvoicesByAgingBucket,
  getAgingBucket,
  calculateAPOutstanding,
  calculatePJOApprovalQueue,
  calculateBKKApprovalQueue,
  getRecentInvoices,
  getRecentPayments,
  getRecentPJOApprovals,
  type InvoiceForCalculation,
  type BKKRecordForCalculation,
  type PJOForCalculation,
  type ARAgingData,
} from '@/lib/dashboard/finance-manager-calculations';

// =====================================================
// Arbitraries (Test Data Generators)
// =====================================================

// Generate a random date within a range (with safety check)
const dateInRangeArb = (start: Date, end: Date) => {
  const minTime = start.getTime();
  const maxTime = end.getTime();
  // Ensure min <= max
  if (minTime > maxTime) {
    return fc.constant(start.toISOString());
  }
  return fc.integer({ min: minTime, max: maxTime }).map((ts) => new Date(ts).toISOString());
};

// Generate a valid date (constrained to reasonable range to avoid Invalid Date errors)
const validDateArb = dateInRangeArb(new Date(2020, 0, 1), new Date(2030, 11, 31));

// Generate a date in the current year
const currentYear = new Date().getFullYear();
const startOfYear = new Date(currentYear, 0, 1);
const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
const dateInCurrentYearArb = dateInRangeArb(startOfYear, endOfYear);

// Generate a date in the current month
const currentMonth = new Date().getMonth();
const startOfMonth = new Date(currentYear, currentMonth, 1);
const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
const dateInCurrentMonthArb = dateInRangeArb(startOfMonth, endOfMonth);

// Generate a date outside the current year (always in the past year)
const dateOutsideCurrentYearArb = dateInRangeArb(
  new Date(currentYear - 2, 0, 1),
  new Date(currentYear - 1, 11, 31)
);

// Invoice status arbitrary
const invoiceStatusArb = fc.constantFrom('draft', 'sent', 'paid', 'overdue', 'cancelled');
const outstandingInvoiceStatusArb = fc.constantFrom('sent', 'overdue');

// BKK workflow status arbitrary
const bkkWorkflowStatusArb = fc.constantFrom('draft', 'pending_check', 'pending_approval', 'approved', 'paid', 'rejected');
const pendingBKKStatusArb = fc.constantFrom('draft', 'pending_check', 'pending_approval');
const approvedPaidBKKStatusArb = fc.constantFrom('approved', 'paid');

// PJO status arbitrary
const pjoStatusArb = fc.constantFrom('draft', 'pending_approval', 'approved', 'rejected', 'converted');

// Generate a positive amount (currency values)
const amountArb = fc.integer({ min: 0, max: 1_000_000_000 }); // Up to 1 billion IDR

// Generate an invoice for calculation
const invoiceArb = fc.record({
  id: fc.uuid(),
  total_amount: amountArb,
  amount_paid: fc.option(amountArb, { nil: null }),
  status: invoiceStatusArb,
  paid_at: fc.option(validDateArb, { nil: null }),
  due_date: fc.option(validDateArb, { nil: null }),
  created_at: fc.option(validDateArb, { nil: undefined }),
});

// Generate a BKK record for calculation
const bkkRecordArb = fc.record({
  id: fc.uuid(),
  amount: amountArb,
  workflow_status: bkkWorkflowStatusArb,
  approved_at: fc.option(validDateArb, { nil: null }),
  paid_at: fc.option(validDateArb, { nil: null }),
  created_at: validDateArb,
  is_active: fc.boolean(),
});

// Generate a PJO for calculation
const pjoArb = fc.record({
  id: fc.uuid(),
  estimated_amount: fc.option(amountArb, { nil: null }),
  status: pjoStatusArb,
  is_active: fc.boolean(),
  approved_at: fc.option(validDateArb, { nil: null }),
  rejected_at: fc.option(validDateArb, { nil: null }),
});

// =====================================================
// Property 1: Revenue YTD Calculation
// =====================================================

describe('Feature: v0.9.14-finance-manager-dashboard-real-data, Property 1: Revenue YTD Calculation', () => {
  const currentDate = new Date();

  /**
   * **Validates: Requirements 1.1**
   * 
   * *For any* set of invoices with various `status` and `paid_at` values, 
   * the Revenue YTD calculation SHALL equal the sum of `total_amount` for only 
   * those invoices where `status` is 'paid' AND `paid_at` falls within the 
   * current calendar year.
   */
  it('should calculate Revenue YTD as sum of paid invoices in current year', () => {
    fc.assert(
      fc.property(fc.array(invoiceArb, { minLength: 0, maxLength: 50 }), (invoices) => {
        const result = calculateRevenueYTD(invoices, currentDate);

        // Calculate expected value manually
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        const startOfNextYear = new Date(currentDate.getFullYear() + 1, 0, 1);

        const expected = invoices
          .filter((inv) => {
            if (inv.status !== 'paid') return false;
            if (!inv.paid_at) return false;
            const paidDate = new Date(inv.paid_at);
            return paidDate >= startOfYear && paidDate < startOfNextYear;
          })
          .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

        return result === expected;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 1.1**
   * 
   * Invoices with status other than 'paid' should not be included in Revenue YTD.
   */
  it('should exclude non-paid invoices from Revenue YTD', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.constant(null),
            status: fc.constantFrom('draft', 'sent', 'overdue', 'cancelled'),
            paid_at: dateInCurrentYearArb,
            due_date: fc.constant(null),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (invoices) => {
          const result = calculateRevenueYTD(invoices, currentDate);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 1.1**
   * 
   * Paid invoices outside the current year should not be included.
   */
  it('should exclude paid invoices outside current year', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.constant(null),
            status: fc.constant('paid'),
            paid_at: dateOutsideCurrentYearArb,
            due_date: fc.constant(null),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (invoices) => {
          const result = calculateRevenueYTD(invoices, currentDate);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 1.3**
   * 
   * When no paid invoices exist for the current year, return 0.
   */
  it('should return 0 when no invoices exist', () => {
    const result = calculateRevenueYTD([], currentDate);
    expect(result).toBe(0);
  });
});


// =====================================================
// Property 2: Expenses MTD Calculation
// =====================================================

describe('Feature: v0.9.14-finance-manager-dashboard-real-data, Property 2: Expenses MTD Calculation', () => {
  const currentDate = new Date();

  /**
   * **Validates: Requirements 2.1**
   * 
   * *For any* set of BKK records with various `workflow_status` and `approved_at`/`paid_at` values,
   * the Expenses MTD calculation SHALL equal the sum of `amount` for only those records where
   * `workflow_status` is 'approved' or 'paid' AND the approval/payment date falls within the
   * current calendar month.
   */
  it('should calculate Expenses MTD as sum of approved/paid BKK records in current month', () => {
    fc.assert(
      fc.property(fc.array(bkkRecordArb, { minLength: 0, maxLength: 50 }), (bkkRecords) => {
        const result = calculateExpensesMTD(bkkRecords, currentDate);

        // Calculate expected value manually
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        const expected = bkkRecords
          .filter((bkk) => {
            if (!bkk.is_active) return false;
            if (bkk.workflow_status !== 'approved' && bkk.workflow_status !== 'paid') return false;

            const approvedDate = bkk.approved_at ? new Date(bkk.approved_at) : null;
            const paidDate = bkk.paid_at ? new Date(bkk.paid_at) : null;

            const isApprovedInMonth = approvedDate && approvedDate >= startOfMonth && approvedDate < startOfNextMonth;
            const isPaidInMonth = paidDate && paidDate >= startOfMonth && paidDate < startOfNextMonth;

            return isApprovedInMonth || isPaidInMonth;
          })
          .reduce((sum, bkk) => sum + (bkk.amount || 0), 0);

        return result === expected;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.1**
   * 
   * BKK records with status other than 'approved' or 'paid' should not be included.
   */
  it('should exclude non-approved/paid BKK records from Expenses MTD', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            amount: amountArb,
            workflow_status: fc.constantFrom('draft', 'pending_check', 'pending_approval', 'rejected'),
            approved_at: dateInCurrentMonthArb,
            paid_at: fc.constant(null),
            created_at: validDateArb,
            is_active: fc.constant(true),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (bkkRecords) => {
          const result = calculateExpensesMTD(bkkRecords, currentDate);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.1**
   * 
   * Inactive BKK records should not be included.
   */
  it('should exclude inactive BKK records from Expenses MTD', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            amount: amountArb,
            workflow_status: approvedPaidBKKStatusArb,
            approved_at: dateInCurrentMonthArb,
            paid_at: fc.constant(null),
            created_at: validDateArb,
            is_active: fc.constant(false),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (bkkRecords) => {
          const result = calculateExpensesMTD(bkkRecords, currentDate);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.3**
   * 
   * When no approved/paid BKK records exist for the current month, return 0.
   */
  it('should return 0 when no BKK records exist', () => {
    const result = calculateExpensesMTD([], currentDate);
    expect(result).toBe(0);
  });
});

// =====================================================
// Property 3: Gross Profit Invariant
// =====================================================

describe('Feature: v0.9.14-finance-manager-dashboard-real-data, Property 3: Gross Profit Invariant', () => {
  /**
   * **Validates: Requirements 3.1**
   * 
   * *For any* Revenue MTD value R and Expenses MTD value E, 
   * the Gross Profit calculation SHALL equal R - E exactly.
   */
  it('should calculate Gross Profit as Revenue minus Expenses exactly', () => {
    fc.assert(
      fc.property(amountArb, amountArb, (revenue, expenses) => {
        const result = calculateGrossProfit(revenue, expenses);
        return result === revenue - expenses;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.1**
   * 
   * Gross Profit can be negative when expenses exceed revenue.
   */
  it('should return negative value when expenses exceed revenue', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        (revenue, extraExpenses) => {
          const expenses = revenue + extraExpenses;
          const result = calculateGrossProfit(revenue, expenses);
          return result < 0 && result === revenue - expenses;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.1**
   * 
   * Gross Profit is zero when revenue equals expenses.
   */
  it('should return 0 when revenue equals expenses', () => {
    fc.assert(
      fc.property(amountArb, (amount) => {
        const result = calculateGrossProfit(amount, amount);
        return result === 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.1**
   * 
   * Gross Profit calculation is commutative in sign (swapping revenue and expenses negates result).
   */
  it('should negate result when revenue and expenses are swapped', () => {
    fc.assert(
      fc.property(amountArb, amountArb, (a, b) => {
        const result1 = calculateGrossProfit(a, b);
        const result2 = calculateGrossProfit(b, a);
        return result1 === -result2;
      }),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 4: AR Overdue Calculation
// =====================================================

describe('Feature: v0.9.14-finance-manager-dashboard-real-data, Property 4: AR Overdue Calculation', () => {
  const currentDate = new Date();

  /**
   * **Validates: Requirements 4.1**
   * 
   * *For any* set of invoices with various `status`, `due_date`, `total_amount`, and `amount_paid` values,
   * the AR Overdue calculation SHALL equal the sum of (`total_amount` - `amount_paid`) for only those
   * invoices where `status` is 'sent' or 'overdue' AND `due_date` is more than 30 days before the current date.
   */
  it('should calculate AR Overdue as sum of outstanding amounts for invoices >30 days overdue', () => {
    fc.assert(
      fc.property(fc.array(invoiceArb, { minLength: 0, maxLength: 50 }), (invoices) => {
        const result = calculateAROverdue(invoices, currentDate);

        // Calculate expected value manually
        const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const expected = invoices
          .filter((inv) => {
            if (inv.status !== 'sent' && inv.status !== 'overdue') return false;
            if (!inv.due_date) return false;
            const dueDate = new Date(inv.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < thirtyDaysAgo;
          })
          .reduce((sum, inv) => {
            const outstanding = (inv.total_amount || 0) - (inv.amount_paid || 0);
            return sum + Math.max(0, outstanding);
          }, 0);

        return result === expected;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 4.1**
   * 
   * Invoices with status other than 'sent' or 'overdue' should not be included.
   */
  it('should exclude non-outstanding invoices from AR Overdue', () => {
    const thirtyOneDaysAgo = new Date(currentDate.getTime() - 31 * 24 * 60 * 60 * 1000);

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.constant(null),
            status: fc.constantFrom('draft', 'paid', 'cancelled'),
            paid_at: fc.constant(null),
            due_date: fc.constant(thirtyOneDaysAgo.toISOString()),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (invoices) => {
          const result = calculateAROverdue(invoices, currentDate);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 4.1**
   * 
   * Invoices due within the last 30 days should not be included in AR Overdue.
   */
  it('should exclude invoices due within last 30 days from AR Overdue', () => {
    const twentyDaysAgo = new Date(currentDate.getTime() - 20 * 24 * 60 * 60 * 1000);

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.constant(null),
            status: outstandingInvoiceStatusArb,
            paid_at: fc.constant(null),
            due_date: fc.constant(twentyDaysAgo.toISOString()),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (invoices) => {
          const result = calculateAROverdue(invoices, currentDate);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 4.1**
   * 
   * Outstanding amount should be total_amount minus amount_paid, never negative.
   */
  it('should calculate outstanding amount as max(0, total_amount - amount_paid)', () => {
    const sixtyDaysAgo = new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000);

    fc.assert(
      fc.property(amountArb, amountArb, (totalAmount, amountPaid) => {
        const invoice: InvoiceForCalculation = {
          id: 'test-id',
          total_amount: totalAmount,
          amount_paid: amountPaid,
          status: 'sent',
          paid_at: null,
          due_date: sixtyDaysAgo.toISOString(),
        };

        const result = calculateAROverdue([invoice], currentDate);
        const expectedOutstanding = Math.max(0, totalAmount - amountPaid);
        return result === expectedOutstanding;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 4.3**
   * 
   * When no overdue invoices exist, return 0.
   */
  it('should return 0 when no invoices exist', () => {
    const result = calculateAROverdue([], currentDate);
    expect(result).toBe(0);
  });
});

// =====================================================
// Property 5: AR Aging Bucket Assignment
// =====================================================

describe('Feature: v0.9.14-finance-manager-dashboard-real-data, Property 5: AR Aging Bucket Assignment', () => {
  const currentDate = new Date();

  /**
   * **Validates: Requirements 5.2**
   * 
   * *For any* invoice with a `due_date`, the invoice SHALL be assigned to exactly one aging bucket.
   */
  it('should assign each invoice to exactly one aging bucket', () => {
    fc.assert(
      fc.property(validDateArb, (dueDateStr) => {
        const bucket = getAgingBucket(dueDateStr, currentDate);
        const validBuckets: (keyof ARAgingData)[] = ['current', 'days31to60', 'days61to90', 'over90'];
        return validBuckets.includes(bucket);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.2**
   * 
   * The sum of counts across all buckets SHALL equal the total number of outstanding invoices.
   */
  it('should have bucket counts sum to total outstanding invoices', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: outstandingInvoiceStatusArb,
            paid_at: fc.constant(null),
            due_date: fc.option(validDateArb, { nil: null }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (invoices) => {
          const result = groupInvoicesByAgingBucket(invoices, currentDate);

          const totalBucketCount =
            result.current.count +
            result.days31to60.count +
            result.days61to90.count +
            result.over90.count;

          // All invoices should be in exactly one bucket
          return totalBucketCount === invoices.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.2**
   * 
   * Buckets are mutually exclusive - no invoice ID appears in multiple buckets.
   */
  it('should have mutually exclusive buckets (no duplicate invoice IDs)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: outstandingInvoiceStatusArb,
            paid_at: fc.constant(null),
            due_date: fc.option(validDateArb, { nil: null }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (invoices) => {
          const result = groupInvoicesByAgingBucket(invoices, currentDate);

          const allIds = [
            ...result.current.invoiceIds,
            ...result.days31to60.invoiceIds,
            ...result.days61to90.invoiceIds,
            ...result.over90.invoiceIds,
          ];

          const uniqueIds = new Set(allIds);
          return allIds.length === uniqueIds.size;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.2**
   * 
   * Bucket assignment is based on days overdue:
   * - 0-30 days → 'current'
   * - 31-60 days → 'days31to60'
   * - 61-90 days → 'days61to90'
   * - 90+ days → 'over90'
   */
  it('should assign invoices to correct bucket based on days overdue', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -30, max: 365 }), // Days overdue (negative means not yet due)
        (daysOverdue) => {
          const dueDate = new Date(currentDate.getTime() - daysOverdue * 24 * 60 * 60 * 1000);
          const bucket = getAgingBucket(dueDate.toISOString(), currentDate);

          if (daysOverdue <= 30) return bucket === 'current';
          if (daysOverdue <= 60) return bucket === 'days31to60';
          if (daysOverdue <= 90) return bucket === 'days61to90';
          return bucket === 'over90';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.2**
   * 
   * Invoices without due_date should go to 'current' bucket.
   */
  it('should assign invoices without due_date to current bucket', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: outstandingInvoiceStatusArb,
            paid_at: fc.constant(null),
            due_date: fc.constant(null),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (invoices) => {
          const result = groupInvoicesByAgingBucket(invoices, currentDate);

          // All invoices without due_date should be in current bucket
          return (
            result.current.count === invoices.length &&
            result.days31to60.count === 0 &&
            result.days61to90.count === 0 &&
            result.over90.count === 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.2**
   * 
   * Only outstanding invoices (status 'sent' or 'overdue') are included in aging.
   */
  it('should only include outstanding invoices in aging buckets', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: fc.constantFrom('draft', 'paid', 'cancelled'),
            paid_at: fc.constant(null),
            due_date: validDateArb,
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (invoices) => {
          const result = groupInvoicesByAgingBucket(invoices, currentDate);

          const totalCount =
            result.current.count +
            result.days31to60.count +
            result.days61to90.count +
            result.over90.count;

          return totalCount === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 6: AP Outstanding Calculation
// =====================================================

describe('Feature: v0.9.14-finance-manager-dashboard-real-data, Property 6: AP Outstanding Calculation', () => {
  /**
   * **Validates: Requirements 6.1**
   * 
   * *For any* set of BKK records with various `workflow_status` and `amount` values,
   * the AP Outstanding calculation SHALL equal the sum of `amount` for only those records
   * where `workflow_status` is 'draft', 'pending_check', or 'pending_approval' AND `is_active` is true.
   */
  it('should calculate AP Outstanding as sum of pending BKK records', () => {
    fc.assert(
      fc.property(fc.array(bkkRecordArb, { minLength: 0, maxLength: 50 }), (bkkRecords) => {
        const result = calculateAPOutstanding(bkkRecords);

        const pendingStatuses = ['draft', 'pending_check', 'pending_approval'];
        const expected = bkkRecords
          .filter((bkk) => bkk.is_active && pendingStatuses.includes(bkk.workflow_status))
          .reduce((sum, bkk) => sum + (bkk.amount || 0), 0);

        return result === expected;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 6.1**
   * 
   * BKK records with status 'approved', 'paid', or 'rejected' should not be included.
   */
  it('should exclude approved/paid/rejected BKK records from AP Outstanding', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            amount: amountArb,
            workflow_status: fc.constantFrom('approved', 'paid', 'rejected'),
            approved_at: fc.option(validDateArb, { nil: null }),
            paid_at: fc.option(validDateArb, { nil: null }),
            created_at: validDateArb,
            is_active: fc.constant(true),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (bkkRecords) => {
          const result = calculateAPOutstanding(bkkRecords);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 6.1**
   * 
   * Inactive BKK records should not be included in AP Outstanding.
   */
  it('should exclude inactive BKK records from AP Outstanding', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            amount: amountArb,
            workflow_status: pendingBKKStatusArb,
            approved_at: fc.constant(null),
            paid_at: fc.constant(null),
            created_at: validDateArb,
            is_active: fc.constant(false),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (bkkRecords) => {
          const result = calculateAPOutstanding(bkkRecords);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 6.3**
   * 
   * When no pending BKK records exist, return 0.
   */
  it('should return 0 when no BKK records exist', () => {
    const result = calculateAPOutstanding([]);
    expect(result).toBe(0);
  });
});

// =====================================================
// Property 8: Approval Queue Count and Sum Accuracy
// =====================================================

describe('Feature: v0.9.14-finance-manager-dashboard-real-data, Property 8: Approval Queue Count and Sum Accuracy', () => {
  /**
   * **Validates: Requirements 8.2**
   * 
   * *For any* set of PJO records with pending status, the approval queue count SHALL equal
   * the number of records matching the pending criteria, and the total value SHALL equal
   * the sum of the `estimated_amount` field for those same records.
   */
  it('should calculate PJO approval queue count and sum accurately', () => {
    fc.assert(
      fc.property(fc.array(pjoArb, { minLength: 0, maxLength: 50 }), (pjos) => {
        const result = calculatePJOApprovalQueue(pjos);

        const pendingPJOs = pjos.filter((pjo) => pjo.is_active && pjo.status === 'pending_approval');
        const expectedCount = pendingPJOs.length;
        const expectedValue = pendingPJOs.reduce((sum, pjo) => sum + (pjo.estimated_amount || 0), 0);

        return result.count === expectedCount && result.totalValue === expectedValue;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 8.2**
   * 
   * PJOs with status other than 'pending_approval' should not be included.
   */
  it('should exclude non-pending PJOs from approval queue', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            estimated_amount: fc.option(amountArb, { nil: null }),
            status: fc.constantFrom('draft', 'approved', 'rejected', 'converted'),
            is_active: fc.constant(true),
            approved_at: fc.constant(null),
            rejected_at: fc.constant(null),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (pjos) => {
          const result = calculatePJOApprovalQueue(pjos);
          return result.count === 0 && result.totalValue === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 8.2**
   * 
   * Inactive PJOs should not be included in approval queue.
   */
  it('should exclude inactive PJOs from approval queue', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            estimated_amount: fc.option(amountArb, { nil: null }),
            status: fc.constant('pending_approval'),
            is_active: fc.constant(false),
            approved_at: fc.constant(null),
            rejected_at: fc.constant(null),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (pjos) => {
          const result = calculatePJOApprovalQueue(pjos);
          return result.count === 0 && result.totalValue === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.2**
   * 
   * *For any* set of BKK records with pending status, the approval queue count SHALL equal
   * the number of records matching the pending criteria, and the total value SHALL equal
   * the sum of the `amount` field for those same records.
   */
  it('should calculate BKK approval queue count and sum accurately', () => {
    fc.assert(
      fc.property(fc.array(bkkRecordArb, { minLength: 0, maxLength: 50 }), (bkkRecords) => {
        const result = calculateBKKApprovalQueue(bkkRecords);

        const pendingStatuses = ['pending_check', 'pending_approval'];
        const pendingBKKs = bkkRecords.filter(
          (bkk) => bkk.is_active && pendingStatuses.includes(bkk.workflow_status)
        );
        const expectedCount = pendingBKKs.length;
        const expectedValue = pendingBKKs.reduce((sum, bkk) => sum + (bkk.amount || 0), 0);

        return result.count === expectedCount && result.totalValue === expectedValue;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 9.2**
   * 
   * BKK records with status other than 'pending_check' or 'pending_approval' should not be included.
   */
  it('should exclude non-pending BKK records from approval queue', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            amount: amountArb,
            workflow_status: fc.constantFrom('draft', 'approved', 'paid', 'rejected'),
            approved_at: fc.constant(null),
            paid_at: fc.constant(null),
            created_at: validDateArb,
            is_active: fc.constant(true),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (bkkRecords) => {
          const result = calculateBKKApprovalQueue(bkkRecords);
          return result.count === 0 && result.totalValue === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 8.4, 9.4**
   * 
   * When no pending records exist, return 0 for both count and value.
   */
  it('should return 0 for both count and value when no records exist', () => {
    const pjoResult = calculatePJOApprovalQueue([]);
    const bkkResult = calculateBKKApprovalQueue([]);

    expect(pjoResult.count).toBe(0);
    expect(pjoResult.totalValue).toBe(0);
    expect(bkkResult.count).toBe(0);
    expect(bkkResult.totalValue).toBe(0);
  });

  /**
   * **Validates: Requirements 8.2, 9.2**
   * 
   * Count should always be a non-negative integer.
   */
  it('should always return non-negative count', () => {
    fc.assert(
      fc.property(fc.array(pjoArb, { minLength: 0, maxLength: 50 }), (pjos) => {
        const result = calculatePJOApprovalQueue(pjos);
        return result.count >= 0 && Number.isInteger(result.count);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 8.2, 9.2**
   * 
   * Total value should always be non-negative.
   */
  it('should always return non-negative total value', () => {
    fc.assert(
      fc.property(fc.array(bkkRecordArb, { minLength: 0, maxLength: 50 }), (bkkRecords) => {
        const result = calculateBKKApprovalQueue(bkkRecords);
        return result.totalValue >= 0;
      }),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 9: Recent Items Ordering and Limiting
// =====================================================

describe('Feature: v0.9.14-finance-manager-dashboard-real-data, Property 9: Recent Items Ordering and Limiting', () => {
  /**
   * **Validates: Requirements 10.1, 11.1, 12.1**
   * 
   * *For any* set of records with a timestamp field, the "recent N items" query SHALL return
   * at most N records, ordered by the timestamp field in descending order (most recent first).
   * If fewer than N records exist, all records SHALL be returned.
   */
  it('should return at most N items for recent invoices', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: invoiceStatusArb,
            paid_at: fc.option(validDateArb, { nil: null }),
            due_date: fc.option(validDateArb, { nil: null }),
            created_at: validDateArb,
          }),
          { minLength: 0, maxLength: 50 }
        ),
        fc.integer({ min: 1, max: 20 }),
        (invoices, limit) => {
          const result = getRecentInvoices(invoices, limit);

          // Should return at most N items
          const invoicesWithCreatedAt = invoices.filter((inv) => inv.created_at);
          const expectedCount = Math.min(invoicesWithCreatedAt.length, limit);
          return result.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 10.1**
   * 
   * Recent invoices should be ordered by created_at descending (most recent first).
   */
  it('should order recent invoices by created_at descending', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: invoiceStatusArb,
            paid_at: fc.option(validDateArb, { nil: null }),
            due_date: fc.option(validDateArb, { nil: null }),
            created_at: validDateArb,
          }),
          { minLength: 2, maxLength: 50 }
        ),
        (invoices) => {
          const result = getRecentInvoices(invoices, 10);

          // Check that items are in descending order by created_at
          for (let i = 0; i < result.length - 1; i++) {
            const currentDate = new Date(result[i].created_at!).getTime();
            const nextDate = new Date(result[i + 1].created_at!).getTime();
            if (currentDate < nextDate) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 11.1**
   * 
   * Recent payments should return only paid invoices ordered by paid_at descending.
   */
  it('should return only paid invoices for recent payments', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: invoiceStatusArb,
            paid_at: fc.option(validDateArb, { nil: null }),
            due_date: fc.option(validDateArb, { nil: null }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        fc.integer({ min: 1, max: 20 }),
        (invoices, limit) => {
          const result = getRecentPayments(invoices, limit);

          // All returned items should be paid with paid_at set
          return result.every((inv) => inv.status === 'paid' && inv.paid_at !== null);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 11.1**
   * 
   * Recent payments should be ordered by paid_at descending (most recent first).
   */
  it('should order recent payments by paid_at descending', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: fc.constant('paid'),
            paid_at: validDateArb,
            due_date: fc.option(validDateArb, { nil: null }),
          }),
          { minLength: 2, maxLength: 50 }
        ),
        (invoices) => {
          const result = getRecentPayments(invoices, 10);

          // Check that items are in descending order by paid_at
          for (let i = 0; i < result.length - 1; i++) {
            const currentDate = new Date(result[i].paid_at!).getTime();
            const nextDate = new Date(result[i + 1].paid_at!).getTime();
            if (currentDate < nextDate) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.1**
   * 
   * Recent PJO approvals should return only approved or rejected PJOs.
   */
  it('should return only approved/rejected PJOs for recent approvals', () => {
    fc.assert(
      fc.property(
        fc.array(pjoArb, { minLength: 0, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (pjos, limit) => {
          const result = getRecentPJOApprovals(pjos, limit);

          // All returned items should be approved or rejected and active
          return result.every(
            (pjo) => pjo.is_active && (pjo.status === 'approved' || pjo.status === 'rejected')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.1**
   * 
   * Recent PJO approvals should be ordered by decision timestamp descending.
   */
  it('should order recent PJO approvals by decision timestamp descending', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            estimated_amount: fc.option(amountArb, { nil: null }),
            status: fc.constantFrom('approved', 'rejected'),
            is_active: fc.constant(true),
            approved_at: fc.option(validDateArb, { nil: null }),
            rejected_at: fc.option(validDateArb, { nil: null }),
          }),
          { minLength: 2, maxLength: 50 }
        ).map((pjos) =>
          // Ensure each PJO has at least one decision timestamp
          pjos.map((pjo) => ({
            ...pjo,
            approved_at: pjo.status === 'approved' ? pjo.approved_at || new Date().toISOString() : null,
            rejected_at: pjo.status === 'rejected' ? pjo.rejected_at || new Date().toISOString() : null,
          }))
        ),
        (pjos) => {
          const result = getRecentPJOApprovals(pjos, 10);

          // Check that items are in descending order by decision timestamp
          for (let i = 0; i < result.length - 1; i++) {
            const currentDate = new Date(result[i].approved_at || result[i].rejected_at || '').getTime();
            const nextDate = new Date(result[i + 1].approved_at || result[i + 1].rejected_at || '').getTime();
            if (currentDate < nextDate) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 10.4, 11.4, 12.4**
   * 
   * When fewer than N records exist, all records should be returned.
   */
  it('should return all records when fewer than limit exist', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: invoiceStatusArb,
            paid_at: fc.option(validDateArb, { nil: null }),
            due_date: fc.option(validDateArb, { nil: null }),
            created_at: validDateArb,
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (invoices) => {
          const limit = 10; // Larger than array size
          const result = getRecentInvoices(invoices, limit);

          // Should return all invoices with created_at
          const invoicesWithCreatedAt = invoices.filter((inv) => inv.created_at);
          return result.length === invoicesWithCreatedAt.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 10.1, 11.1, 12.1**
   * 
   * Empty input should return empty array.
   */
  it('should return empty array when no records exist', () => {
    expect(getRecentInvoices([], 5)).toEqual([]);
    expect(getRecentPayments([], 5)).toEqual([]);
    expect(getRecentPJOApprovals([], 5)).toEqual([]);
  });

  /**
   * **Validates: Requirements 10.1, 11.1, 12.1**
   * 
   * Result should not modify the original array.
   */
  it('should not modify the original array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: invoiceStatusArb,
            paid_at: fc.option(validDateArb, { nil: null }),
            due_date: fc.option(validDateArb, { nil: null }),
            created_at: validDateArb,
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (invoices) => {
          const originalOrder = invoices.map((inv) => inv.id);
          getRecentInvoices(invoices, 5);
          const afterOrder = invoices.map((inv) => inv.id);

          // Original array should not be modified
          return originalOrder.every((id, index) => id === afterOrder[index]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 10.1, 11.1, 12.1**
   * 
   * Limit of 0 should return empty array.
   */
  it('should return empty array when limit is 0', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            total_amount: amountArb,
            amount_paid: fc.option(amountArb, { nil: null }),
            status: invoiceStatusArb,
            paid_at: fc.option(validDateArb, { nil: null }),
            due_date: fc.option(validDateArb, { nil: null }),
            created_at: validDateArb,
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (invoices) => {
          const result = getRecentInvoices(invoices, 0);
          return result.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

