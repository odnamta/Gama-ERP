/**
 * Vendor Invoice Utils Tests
 * Property-based and unit tests for vendor invoice utility functions
 * 
 * Feature: accounts-payable
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateInternalRef,
  parseInternalRef,
  isValidInternalRef,
  calculateDefaultDueDate,
  isOverdue,
  isDueSoon,
  getDaysUntilDue,
  calculateAgingBucket,
  calculateVariance,
  isWithinTolerance,
  calculateRemainingBalance,
  calculateTotalPaid,
  determineVendorInvoiceStatus,
  validatePaymentAmount,
  isValidPaymentMethod,
  validateVendorInvoiceInput,
  getStatusDisplayInfo,
  getExpenseCategoryLabel,
  formatVendorInvoiceCurrency,
  VARIANCE_TOLERANCE_PERCENT,
  DEFAULT_PAYMENT_TERMS_DAYS,
} from '@/lib/vendor-invoice-utils';
import type { VendorInvoiceStatus } from '@/types/vendor-invoices';

describe('vendor-invoice-utils', () => {
  // =====================================================
  // Property 1: Internal Reference Format Validity
  // Validates: Requirements 1.2
  // =====================================================
  describe('Property 1: Internal Reference Format Validity', () => {
    it('should generate valid internal reference format VI-YYYY-NNNNN', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2099 }),
          fc.integer({ min: 1, max: 99999 }),
          (year, sequence) => {
            const ref = generateInternalRef(year, sequence);
            expect(isValidInternalRef(ref)).toBe(true);
            expect(ref).toMatch(/^VI-\d{4}-\d{5}$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should parse generated references correctly (round-trip)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2099 }),
          fc.integer({ min: 1, max: 99999 }),
          (year, sequence) => {
            const ref = generateInternalRef(year, sequence);
            const parsed = parseInternalRef(ref);
            expect(parsed).not.toBeNull();
            expect(parsed?.year).toBe(year);
            expect(parsed?.sequence).toBe(sequence);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid reference formats', () => {
      const invalidRefs = [
        'VI-2025-123',      // Too few digits
        'VI-2025-1234567',  // Too many digits
        'VI-25-12345',      // 2-digit year
        'VX-2025-12345',    // Wrong prefix
        '2025-12345',       // Missing prefix
        '',                 // Empty
      ];
      
      invalidRefs.forEach(ref => {
        expect(isValidInternalRef(ref)).toBe(false);
        expect(parseInternalRef(ref)).toBeNull();
      });
    });
  });

  // =====================================================
  // Property 2: Default Due Date Calculation
  // Validates: Requirements 1.3
  // =====================================================
  describe('Property 2: Default Due Date Calculation', () => {
    it('should calculate due date as exactly 30 days from invoice date', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3650 }), // Days offset from base date
          (daysOffset) => {
            const baseDate = new Date('2020-01-01');
            baseDate.setDate(baseDate.getDate() + daysOffset);
            const invoiceDateStr = baseDate.toISOString().split('T')[0];
            const dueDate = calculateDefaultDueDate(invoiceDateStr);
            
            const invoice = new Date(invoiceDateStr);
            const due = new Date(dueDate);
            
            const diffTime = due.getTime() - invoice.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            expect(diffDays).toBe(DEFAULT_PAYMENT_TERMS_DAYS);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Property 3: Total Amount Calculation Invariant
  // Validates: Requirements 1.4
  // (Tested implicitly - total_amount = subtotal + tax_amount is enforced at DB level)
  // =====================================================


  // =====================================================
  // Property 8: Overdue Detection
  // Validates: Requirements 3.6
  // =====================================================
  describe('Property 8: Overdue Detection', () => {
    it('should return true for past due dates with non-terminal status', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const nonTerminalStatuses: VendorInvoiceStatus[] = ['received', 'verified', 'approved', 'partial', 'disputed'];
      
      nonTerminalStatuses.forEach(status => {
        expect(isOverdue(yesterdayStr, status)).toBe(true);
      });
    });

    it('should return false for paid or cancelled invoices regardless of due date', () => {
      // Test with specific dates instead of random dates to avoid invalid date issues
      const testDates = [
        '2020-01-01',
        '2022-06-15',
        '2024-12-31',
        '2025-01-01',
      ];
      
      testDates.forEach(dueDateStr => {
        expect(isOverdue(dueDateStr, 'paid')).toBe(false);
        expect(isOverdue(dueDateStr, 'cancelled')).toBe(false);
      });
    });

    it('should return false for future due dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      expect(isOverdue(tomorrowStr, 'received')).toBe(false);
    });

    it('should return false for null due date', () => {
      expect(isOverdue(null, 'received')).toBe(false);
    });
  });

  // =====================================================
  // Property 9: Due Soon Detection
  // Validates: Requirements 3.7
  // =====================================================
  describe('Property 9: Due Soon Detection', () => {
    it('should return true for due dates within 7 days', () => {
      for (let i = 0; i <= 7; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        expect(isDueSoon(futureDateStr, 'received')).toBe(true);
      }
    });

    it('should return false for due dates more than 7 days away', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 8);
      const farFutureStr = farFuture.toISOString().split('T')[0];
      
      expect(isDueSoon(farFutureStr, 'received')).toBe(false);
    });

    it('should return false for overdue invoices', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      expect(isDueSoon(yesterdayStr, 'received')).toBe(false);
    });

    it('should return false for paid or cancelled invoices', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      expect(isDueSoon(tomorrowStr, 'paid')).toBe(false);
      expect(isDueSoon(tomorrowStr, 'cancelled')).toBe(false);
    });
  });

  // =====================================================
  // Property 11: Variance Calculation
  // Validates: Requirements 5.1
  // =====================================================
  describe('Property 11: Variance Calculation', () => {
    it('should calculate variance as invoice - bkk amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 1000000000, noNaN: true }),
          fc.float({ min: 1, max: 1000000000, noNaN: true }),
          (bkkAmount, invoiceAmount) => {
            const result = calculateVariance(bkkAmount, invoiceAmount);
            expect(result.variance).toBeCloseTo(invoiceAmount - bkkAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate variance percent correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 1000000000, noNaN: true }),
          fc.float({ min: 1, max: 1000000000, noNaN: true }),
          (bkkAmount, invoiceAmount) => {
            const result = calculateVariance(bkkAmount, invoiceAmount);
            const expectedPercent = ((invoiceAmount - bkkAmount) / bkkAmount) * 100;
            expect(result.variancePercent).toBeCloseTo(expectedPercent, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero BKK amount', () => {
      const result = calculateVariance(0, 1000);
      expect(result.variance).toBe(1000);
      expect(result.variancePercent).toBe(0);
    });
  });

  // =====================================================
  // Property 12: Verification Status Determination
  // Validates: Requirements 5.2, 5.3
  // =====================================================
  describe('Property 12: Verification Status Determination', () => {
    it('should be within tolerance when variance percent <= 2%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -VARIANCE_TOLERANCE_PERCENT, max: VARIANCE_TOLERANCE_PERCENT, noNaN: true }),
          (variancePercent) => {
            expect(isWithinTolerance(variancePercent)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be outside tolerance when variance percent > 2%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(VARIANCE_TOLERANCE_PERCENT + 0.1), max: Math.fround(100), noNaN: true }),
          (variancePercent) => {
            expect(isWithinTolerance(variancePercent)).toBe(false);
            expect(isWithinTolerance(-variancePercent)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set withinTolerance correctly in calculateVariance', () => {
      // Within tolerance (1% variance)
      const result1 = calculateVariance(100000, 101000);
      expect(result1.withinTolerance).toBe(true);
      
      // Outside tolerance (5% variance)
      const result2 = calculateVariance(100000, 105000);
      expect(result2.withinTolerance).toBe(false);
    });
  });


  // =====================================================
  // Property 20: Aging Bucket Calculation
  // Validates: Requirements 12.3
  // =====================================================
  describe('Property 20: Aging Bucket Calculation', () => {
    it('should return current for future due dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          (daysInFuture) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysInFuture);
            const futureDateStr = futureDate.toISOString().split('T')[0];
            
            expect(calculateAgingBucket(futureDateStr)).toBe('current');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 1-30 for 1-30 days overdue', () => {
      for (let i = 1; i <= 30; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        const pastDateStr = pastDate.toISOString().split('T')[0];
        
        expect(calculateAgingBucket(pastDateStr)).toBe('1-30');
      }
    });

    it('should return 31-60 for 31-60 days overdue', () => {
      for (let i = 31; i <= 60; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        const pastDateStr = pastDate.toISOString().split('T')[0];
        
        expect(calculateAgingBucket(pastDateStr)).toBe('31-60');
      }
    });

    it('should return 61-90 for 61-90 days overdue', () => {
      for (let i = 61; i <= 90; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        const pastDateStr = pastDate.toISOString().split('T')[0];
        
        expect(calculateAgingBucket(pastDateStr)).toBe('61-90');
      }
    });

    it('should return 90+ for more than 90 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 91, max: 365 }),
          (daysOverdue) => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysOverdue);
            const pastDateStr = pastDate.toISOString().split('T')[0];
            
            expect(calculateAgingBucket(pastDateStr)).toBe('90+');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return current for null due date', () => {
      expect(calculateAgingBucket(null)).toBe('current');
    });
  });

  // =====================================================
  // Payment Status Tests
  // Validates: Requirements 7.3, 7.4
  // =====================================================
  describe('Payment Status Determination', () => {
    it('should return paid when amount_paid >= total_amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 1000000000, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (totalAmount, extraPercent) => {
            const amountPaid = totalAmount * (1 + extraPercent);
            const status = determineVendorInvoiceStatus(totalAmount, amountPaid, 'approved');
            expect(status).toBe('paid');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return partial when 0 < amount_paid < total_amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(1000000000), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
          (totalAmount, paidPercent) => {
            const amountPaid = totalAmount * paidPercent;
            const status = determineVendorInvoiceStatus(totalAmount, amountPaid, 'approved');
            expect(status).toBe('partial');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve cancelled status regardless of payment', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 1000000000, noNaN: true }),
          fc.float({ min: 0, max: 2, noNaN: true }),
          (totalAmount, paidMultiplier) => {
            const amountPaid = totalAmount * paidMultiplier;
            const status = determineVendorInvoiceStatus(totalAmount, amountPaid, 'cancelled');
            expect(status).toBe('cancelled');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve disputed status regardless of payment', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 1000000000, noNaN: true }),
          fc.float({ min: 0, max: 2, noNaN: true }),
          (totalAmount, paidMultiplier) => {
            const amountPaid = totalAmount * paidMultiplier;
            const status = determineVendorInvoiceStatus(totalAmount, amountPaid, 'disputed');
            expect(status).toBe('disputed');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Remaining Balance Calculation
  // =====================================================
  describe('Remaining Balance Calculation', () => {
    it('should calculate remaining as total - paid (never negative)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000000000, noNaN: true }),
          fc.float({ min: 0, max: 2000000000, noNaN: true }),
          (totalAmount, amountPaid) => {
            const remaining = calculateRemainingBalance(totalAmount, amountPaid);
            expect(remaining).toBeGreaterThanOrEqual(0);
            expect(remaining).toBe(Math.max(0, totalAmount - amountPaid));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Total Paid Calculation
  // =====================================================
  describe('Total Paid Calculation', () => {
    it('should sum all payment amounts', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 0, max: 1000000, noNaN: true }), { minLength: 0, maxLength: 20 }),
          (amounts) => {
            const payments = amounts.map(amount => ({ amount }));
            const total = calculateTotalPaid(payments);
            const expected = amounts.reduce((sum, a) => sum + a, 0);
            expect(total).toBeCloseTo(expected, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalPaid([])).toBe(0);
    });
  });


  // =====================================================
  // Validation Tests
  // =====================================================
  describe('Payment Amount Validation', () => {
    it('should reject null/undefined amounts', () => {
      expect(validatePaymentAmount(null).isValid).toBe(false);
      expect(validatePaymentAmount(undefined).isValid).toBe(false);
    });

    it('should reject zero or negative amounts', () => {
      expect(validatePaymentAmount(0).isValid).toBe(false);
      expect(validatePaymentAmount(-100).isValid).toBe(false);
    });

    it('should accept positive amounts', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000000000), noNaN: true }),
          (amount) => {
            expect(validatePaymentAmount(amount).isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Payment Method Validation', () => {
    it('should accept valid payment methods', () => {
      expect(isValidPaymentMethod('transfer')).toBe(true);
      expect(isValidPaymentMethod('cash')).toBe(true);
      expect(isValidPaymentMethod('check')).toBe(true);
      expect(isValidPaymentMethod('giro')).toBe(true);
    });

    it('should reject invalid payment methods', () => {
      expect(isValidPaymentMethod('invalid')).toBe(false);
      expect(isValidPaymentMethod('')).toBe(false);
      expect(isValidPaymentMethod(null)).toBe(false);
      expect(isValidPaymentMethod(undefined)).toBe(false);
    });
  });

  describe('Vendor Invoice Input Validation', () => {
    it('should require vendor_id', () => {
      const result = validateVendorInvoiceInput({
        invoice_number: 'INV-001',
        invoice_date: '2025-01-01',
        subtotal: 1000,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vendor is required');
    });

    it('should require invoice_number', () => {
      const result = validateVendorInvoiceInput({
        vendor_id: 'vendor-123',
        invoice_date: '2025-01-01',
        subtotal: 1000,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vendor invoice number is required');
    });

    it('should require positive subtotal', () => {
      const result = validateVendorInvoiceInput({
        vendor_id: 'vendor-123',
        invoice_number: 'INV-001',
        invoice_date: '2025-01-01',
        subtotal: 0,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subtotal must be greater than zero');
    });

    it('should reject negative tax_amount', () => {
      const result = validateVendorInvoiceInput({
        vendor_id: 'vendor-123',
        invoice_number: 'INV-001',
        invoice_date: '2025-01-01',
        subtotal: 1000,
        tax_amount: -100,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tax amount cannot be negative');
    });

    it('should accept valid input', () => {
      const result = validateVendorInvoiceInput({
        vendor_id: 'vendor-123',
        invoice_number: 'INV-001',
        invoice_date: '2025-01-01',
        subtotal: 1000,
        tax_amount: 110,
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // =====================================================
  // Display Functions Tests
  // =====================================================
  describe('Display Functions', () => {
    it('should return correct status display info', () => {
      const statuses: VendorInvoiceStatus[] = ['received', 'verified', 'approved', 'partial', 'paid', 'disputed', 'cancelled'];
      
      statuses.forEach(status => {
        const info = getStatusDisplayInfo(status);
        expect(info).toHaveProperty('bg');
        expect(info).toHaveProperty('text');
        expect(info).toHaveProperty('label');
        expect(info.label.length).toBeGreaterThan(0);
      });
    });

    it('should return correct expense category labels', () => {
      expect(getExpenseCategoryLabel('trucking')).toBe('Trucking');
      expect(getExpenseCategoryLabel('shipping')).toBe('Shipping');
      expect(getExpenseCategoryLabel('port')).toBe('Port Charges');
      expect(getExpenseCategoryLabel(null)).toBe('-');
      expect(getExpenseCategoryLabel(undefined)).toBe('-');
    });

    it('should format currency correctly', () => {
      expect(formatVendorInvoiceCurrency(1000000)).toContain('1.000.000');
      expect(formatVendorInvoiceCurrency(0)).toContain('0');
      expect(formatVendorInvoiceCurrency(null)).toBe('-');
      expect(formatVendorInvoiceCurrency(undefined)).toBe('-');
    });
  });

  // =====================================================
  // Days Until Due Tests
  // =====================================================
  describe('Days Until Due', () => {
    it('should return positive for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const days = getDaysUntilDue(tomorrowStr);
      expect(days).toBe(5);
    });

    it('should return negative for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 3);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const days = getDaysUntilDue(yesterdayStr);
      expect(days).toBe(-3);
    });

    it('should return 0 for today', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const days = getDaysUntilDue(todayStr);
      expect(days).toBe(0);
    });

    it('should return null for null due date', () => {
      expect(getDaysUntilDue(null)).toBeNull();
    });
  });
});
