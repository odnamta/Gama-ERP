// =====================================================
// v0.70: OVERDUE CHECK UTILS PROPERTY TESTS
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateDaysOverdue,
  classifyOverdueSeverity,
  isEligibleForOverdue,
  isInvoiceOverdue,
  groupOverdueInvoices,
  createOverdueInvoice,
  filterOverdueInvoices,
  prepareOverdueStatusUpdate,
  canUpdateToOverdue,
  createFollowUpTaskInput,
  getFollowUpPriority,
  generateOverdueSummary,
  hasCriticalOverdue,
  getMostCriticalInvoices,
} from '@/lib/overdue-check-utils';
import {
  OverdueSeverity,
  OverdueInvoice,
  OVERDUE_SEVERITY_THRESHOLDS,
  OVERDUE_ELIGIBLE_STATUSES,
} from '@/types/overdue-check';

// =====================================================
// GENERATORS
// =====================================================

/**
 * Generator for overdue severity
 */
const overdueSeverityArb = fc.constantFrom<OverdueSeverity>('critical', 'high', 'medium', 'low');

/**
 * Generator for days overdue (positive integers)
 */
const daysOverdueArb = fc.integer({ min: 1, max: 365 });

/**
 * Generator for eligible invoice statuses
 */
const eligibleStatusArb = fc.constantFrom(...OVERDUE_ELIGIBLE_STATUSES);

/**
 * Generator for non-eligible invoice statuses
 */
const nonEligibleStatusArb = fc.constantFrom('draft', 'paid', 'overdue', 'cancelled');

/**
 * Generator for invoice amounts
 */
const amountArb = fc.integer({ min: 100000, max: 1000000000 });

/**
 * Generator for ISO date strings in the past
 */
const pastDateArb = fc.integer({ min: 1, max: 365 }).map(daysAgo => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
});

/**
 * Generator for overdue invoices
 */
const overdueInvoiceArb = fc.record({
  id: fc.uuid(),
  invoice_number: fc.stringMatching(/^INV-\d{4}-\d{4}$/),
  customer_id: fc.uuid(),
  customer_name: fc.string({ minLength: 1, maxLength: 100 }),
  amount: amountArb,
  due_date: pastDateArb,
  days_overdue: daysOverdueArb,
  severity: overdueSeverityArb,
  status: eligibleStatusArb,
  jo_id: fc.option(fc.uuid(), { nil: null }),
});

/**
 * Generator for raw invoice data
 */
const rawInvoiceArb = fc.record({
  id: fc.uuid(),
  invoice_number: fc.stringMatching(/^INV-\d{4}-\d{4}$/),
  customer_id: fc.uuid(),
  grand_total: amountArb,
  due_date: pastDateArb,
  status: eligibleStatusArb,
  jo_id: fc.option(fc.uuid(), { nil: null }),
  customer_name: fc.string({ minLength: 1, maxLength: 100 }),
});

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Overdue Check Utils Property Tests', () => {
  /**
   * **Feature: n8n-scheduled-tasks, Property 8: Overdue Invoice Classification**
   * *For any* invoice with days_overdue > 0, the severity classification SHALL be:
   * 'critical' if days_overdue > 60, 'high' if days_overdue > 30, 
   * 'medium' if days_overdue > 14, 'low' otherwise.
   * **Validates: Requirements 3.2, 3.3**
   */
  describe('Property 8: Overdue Invoice Classification', () => {
    it('should classify critical severity for >60 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 61, max: 365 }),
          (daysOverdue) => {
            const severity = classifyOverdueSeverity(daysOverdue);
            return severity === 'critical';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify high severity for 31-60 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 31, max: 60 }),
          (daysOverdue) => {
            const severity = classifyOverdueSeverity(daysOverdue);
            return severity === 'high';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify medium severity for 15-30 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 15, max: 30 }),
          (daysOverdue) => {
            const severity = classifyOverdueSeverity(daysOverdue);
            return severity === 'medium';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify low severity for 1-14 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 14 }),
          (daysOverdue) => {
            const severity = classifyOverdueSeverity(daysOverdue);
            return severity === 'low';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify low severity for 0 days (edge case)', () => {
      const severity = classifyOverdueSeverity(0);
      expect(severity).toBe('low');
    });

    it('should correctly group invoices by severity', () => {
      fc.assert(
        fc.property(
          fc.array(overdueInvoiceArb, { minLength: 0, maxLength: 20 }),
          (invoices) => {
            const result = groupOverdueInvoices(invoices);
            
            // Verify all invoices are grouped correctly
            const allGrouped = [
              ...result.critical,
              ...result.high,
              ...result.medium,
              ...result.low,
            ];
            
            // Total count should match
            if (result.total_count !== invoices.length) {
              return false;
            }
            
            // All invoices should be in the result
            if (allGrouped.length !== invoices.length) {
              return false;
            }
            
            // Each invoice should be in the correct severity group
            for (const invoice of invoices) {
              const group = result[invoice.severity];
              if (!group.some(inv => inv.id === invoice.id)) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate total amount correctly when grouping', () => {
      fc.assert(
        fc.property(
          fc.array(overdueInvoiceArb, { minLength: 0, maxLength: 20 }),
          (invoices) => {
            const result = groupOverdueInvoices(invoices);
            const expectedTotal = invoices.reduce((sum, inv) => sum + inv.amount, 0);
            return result.total_amount === expectedTotal;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only allow eligible statuses for overdue', () => {
      fc.assert(
        fc.property(eligibleStatusArb, (status) => {
          return isEligibleForOverdue(status) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject non-eligible statuses for overdue', () => {
      fc.assert(
        fc.property(nonEligibleStatusArb, (status) => {
          return isEligibleForOverdue(status) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly identify overdue invoices', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          eligibleStatusArb,
          (daysAgo, status) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() - daysAgo);
            
            return isInvoiceOverdue(dueDate.toISOString(), status) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not mark future due dates as overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          eligibleStatusArb,
          (daysAhead, status) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + daysAhead);
            
            return isInvoiceOverdue(dueDate.toISOString(), status) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate days overdue correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAgo) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() - daysAgo);
            dueDate.setHours(0, 0, 0, 0);
            
            const referenceDate = new Date();
            referenceDate.setHours(0, 0, 0, 0);
            
            const calculated = calculateDaysOverdue(dueDate, referenceDate);
            return calculated === daysAgo;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 days overdue for future dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAhead) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + daysAhead);
            
            const calculated = calculateDaysOverdue(dueDate);
            return calculated === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: n8n-scheduled-tasks, Property 9: Overdue Status Update**
   * *For any* invoice identified as overdue (due_date < today and status in ['sent', 'partial']),
   * after processing the invoice status SHALL be 'overdue'.
   * **Validates: Requirements 3.4**
   */
  describe('Property 9: Overdue Status Update', () => {
    it('should prepare overdue status update correctly', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          eligibleStatusArb,
          (invoiceId, previousStatus) => {
            const result = prepareOverdueStatusUpdate(invoiceId, previousStatus);
            
            return (
              result.success === true &&
              result.invoice_id === invoiceId &&
              result.previous_status === previousStatus &&
              result.new_status === 'overdue' &&
              result.updated_at !== null
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow update to overdue for eligible statuses', () => {
      fc.assert(
        fc.property(eligibleStatusArb, (status) => {
          return canUpdateToOverdue(status) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should not allow update to overdue for non-eligible statuses', () => {
      fc.assert(
        fc.property(nonEligibleStatusArb, (status) => {
          return canUpdateToOverdue(status) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should create overdue invoice only for eligible invoices', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.stringMatching(/^INV-\d{4}-\d{4}$/),
          fc.uuid(),
          amountArb,
          fc.integer({ min: 1, max: 365 }),
          eligibleStatusArb,
          fc.option(fc.uuid(), { nil: null }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (id, invoiceNumber, customerId, amount, daysAgo, status, joId, customerName) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() - daysAgo);
            
            const invoice = {
              id,
              invoice_number: invoiceNumber,
              customer_id: customerId,
              grand_total: amount,
              due_date: dueDate.toISOString(),
              status,
              jo_id: joId,
            };
            
            const result = createOverdueInvoice(invoice, customerName);
            
            // Should create an overdue invoice for eligible status and past due date
            return result !== null && result.severity !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not create overdue invoice for non-eligible statuses', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.stringMatching(/^INV-\d{4}-\d{4}$/),
          fc.uuid(),
          amountArb,
          fc.integer({ min: 1, max: 365 }),
          nonEligibleStatusArb,
          fc.option(fc.uuid(), { nil: null }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (id, invoiceNumber, customerId, amount, daysAgo, status, joId, customerName) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() - daysAgo);
            
            const invoice = {
              id,
              invoice_number: invoiceNumber,
              customer_id: customerId,
              grand_total: amount,
              due_date: dueDate.toISOString(),
              status,
              jo_id: joId,
            };
            
            const result = createOverdueInvoice(invoice, customerName);
            
            // Should not create an overdue invoice for non-eligible status
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter overdue invoices correctly', () => {
      fc.assert(
        fc.property(
          fc.array(rawInvoiceArb, { minLength: 0, maxLength: 10 }),
          (invoices) => {
            const result = filterOverdueInvoices(invoices);
            
            // All results should have eligible status and be overdue
            for (const inv of result) {
              if (!isEligibleForOverdue(inv.status)) {
                return false;
              }
              if (inv.days_overdue <= 0) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for follow-up task creation
   */
  describe('Follow-up Task Creation', () => {
    it('should create follow-up task input with correct data', () => {
      fc.assert(
        fc.property(
          overdueInvoiceArb,
          fc.option(fc.uuid(), { nil: undefined }),
          (invoice, assignedTo) => {
            const taskInput = createFollowUpTaskInput(invoice, assignedTo);
            
            return (
              taskInput.invoice_id === invoice.id &&
              taskInput.invoice_number === invoice.invoice_number &&
              taskInput.customer_name === invoice.customer_name &&
              taskInput.amount === invoice.amount &&
              taskInput.days_overdue === invoice.days_overdue &&
              taskInput.severity === invoice.severity &&
              taskInput.assigned_to === assignedTo
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should map severity to correct priority', () => {
      fc.assert(
        fc.property(overdueSeverityArb, (severity) => {
          const priority = getFollowUpPriority(severity);
          
          switch (severity) {
            case 'critical':
              return priority === 'urgent';
            case 'high':
              return priority === 'high';
            case 'medium':
              return priority === 'medium';
            case 'low':
              return priority === 'low';
            default:
              return false;
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Summary and reporting tests
   */
  describe('Summary and Reporting', () => {
    it('should generate correct summary from grouped results', () => {
      fc.assert(
        fc.property(
          fc.array(overdueInvoiceArb, { minLength: 0, maxLength: 20 }),
          (invoices) => {
            const grouped = groupOverdueInvoices(invoices);
            const summary = generateOverdueSummary(grouped);
            
            return (
              summary.total_count === grouped.total_count &&
              summary.total_amount === grouped.total_amount &&
              summary.by_severity.critical.count === grouped.critical.length &&
              summary.by_severity.high.count === grouped.high.length &&
              summary.by_severity.medium.count === grouped.medium.length &&
              summary.by_severity.low.count === grouped.low.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect critical overdue correctly', () => {
      fc.assert(
        fc.property(
          fc.array(overdueInvoiceArb, { minLength: 0, maxLength: 20 }),
          (invoices) => {
            const grouped = groupOverdueInvoices(invoices);
            const hasCritical = hasCriticalOverdue(grouped);
            
            return hasCritical === (grouped.critical.length > 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return most critical invoices sorted by days overdue', () => {
      fc.assert(
        fc.property(
          fc.array(overdueInvoiceArb, { minLength: 2, maxLength: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (invoices, limit) => {
            const grouped = groupOverdueInvoices(invoices);
            const mostCritical = getMostCriticalInvoices(grouped, limit);
            
            // Should not exceed limit
            if (mostCritical.length > limit) {
              return false;
            }
            
            // Should be sorted by days overdue descending
            for (let i = 0; i < mostCritical.length - 1; i++) {
              if (mostCritical[i].days_overdue < mostCritical[i + 1].days_overdue) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
