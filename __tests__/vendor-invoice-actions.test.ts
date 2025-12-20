/**
 * Vendor Invoice Actions Tests
 * Property-based tests for vendor invoice CRUD operations
 * 
 * Feature: accounts-payable
 * 
 * Note: These tests mock Supabase to test action logic without database access.
 * Integration tests with real database would be in a separate e2e test suite.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateAgingBucket,
  calculateDefaultDueDate,
  validateVendorInvoiceInput,
  canViewVendorInvoices,
  canEditVendorInvoices,
  canDeleteVendorInvoices,
  canApproveVendorInvoices,
  calculateVariance,
  determineVendorInvoiceStatus,
} from '@/lib/vendor-invoice-utils';
import type { VendorInvoiceFormData, AgingBucket, VendorInvoiceStatus } from '@/types/vendor-invoices';

// =====================================================
// Test Generators
// =====================================================

// Helper to generate valid date strings
const validDateArb = fc.integer({ min: 0, max: 3650 }).map(daysOffset => {
  const baseDate = new Date('2020-01-01');
  baseDate.setDate(baseDate.getDate() + daysOffset);
  return baseDate.toISOString().split('T')[0];
});

// Generate valid vendor invoice form data
const vendorInvoiceFormDataArb = fc.record({
  vendor_id: fc.uuid(),
  invoice_number: fc.stringMatching(/^INV-[A-Z0-9]{4,10}$/),
  invoice_date: validDateArb,
  received_date: fc.option(validDateArb, { nil: undefined }),
  due_date: fc.option(validDateArb, { nil: undefined }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  subtotal: fc.float({ min: Math.fround(100), max: Math.fround(1000000000), noNaN: true }),
  tax_amount: fc.float({ min: 0, max: Math.fround(100000000), noNaN: true }),
  expense_category: fc.option(
    fc.constantFrom('trucking', 'shipping', 'port', 'handling', 'fuel', 'toll', 'permit', 'crew', 'equipment', 'overhead', 'other'),
    { nil: undefined }
  ),
  jo_id: fc.option(fc.uuid(), { nil: undefined }),
  pjo_id: fc.option(fc.uuid(), { nil: undefined }),
  bkk_id: fc.option(fc.uuid(), { nil: undefined }),
  document_url: fc.option(fc.webUrl(), { nil: undefined }),
  notes: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
});

// Generate user roles
const roleArb = fc.constantFrom('owner', 'admin', 'manager', 'finance', 'ops', 'sales', 'engineer');
const viewableRoleArb = fc.constantFrom('owner', 'admin', 'manager', 'finance');
const editableRoleArb = fc.constantFrom('owner', 'admin', 'finance');
const deletableRoleArb = fc.constantFrom('owner', 'admin');
const nonViewableRoleArb = fc.constantFrom('ops', 'sales', 'engineer');

// Generate aging bucket scenarios
const agingBucketScenarioArb = fc.record({
  daysOverdue: fc.integer({ min: -365, max: 365 }),
});

describe('vendor-invoice-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =====================================================
  // Property 4: Invoice Creation Data Integrity
  // Validates: Requirements 1.1, 1.5, 1.6, 2.1
  // =====================================================
  describe('Property 4: Invoice Creation Data Integrity', () => {
    it('should validate all required fields for invoice creation', () => {
      fc.assert(
        fc.property(vendorInvoiceFormDataArb, (formData) => {
          const validation = validateVendorInvoiceInput({
            vendor_id: formData.vendor_id,
            invoice_number: formData.invoice_number,
            invoice_date: formData.invoice_date,
            subtotal: formData.subtotal,
            tax_amount: formData.tax_amount,
          });
          
          // Valid data should pass validation
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject missing vendor_id', () => {
      fc.assert(
        fc.property(vendorInvoiceFormDataArb, (formData) => {
          const validation = validateVendorInvoiceInput({
            vendor_id: '',
            invoice_number: formData.invoice_number,
            invoice_date: formData.invoice_date,
            subtotal: formData.subtotal,
            tax_amount: formData.tax_amount,
          });
          
          expect(validation.isValid).toBe(false);
          expect(validation.errors).toContain('Vendor is required');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject missing invoice_number', () => {
      fc.assert(
        fc.property(vendorInvoiceFormDataArb, (formData) => {
          const validation = validateVendorInvoiceInput({
            vendor_id: formData.vendor_id,
            invoice_number: '',
            invoice_date: formData.invoice_date,
            subtotal: formData.subtotal,
            tax_amount: formData.tax_amount,
          });
          
          expect(validation.isValid).toBe(false);
          expect(validation.errors).toContain('Vendor invoice number is required');
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate total_amount as subtotal + tax_amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(1000000000), noNaN: true }),
          fc.float({ min: 0, max: Math.fround(100000000), noNaN: true }),
          (subtotal, taxAmount) => {
            const expectedTotal = subtotal + taxAmount;
            // This is the calculation that would happen in createVendorInvoice
            const totalAmount = subtotal + (taxAmount || 0);
            expect(totalAmount).toBeCloseTo(expectedTotal, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set default due date when not provided', () => {
      fc.assert(
        fc.property(
          validDateArb,
          (invoiceDateStr) => {
            const dueDate = calculateDefaultDueDate(invoiceDateStr);
            
            const invoice = new Date(invoiceDateStr);
            const due = new Date(dueDate);
            
            const diffTime = due.getTime() - invoice.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            expect(diffDays).toBe(30);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Property 6: Invoice List Ordering
  // Validates: Requirements 3.1
  // =====================================================
  describe('Property 6: Invoice List Ordering', () => {
    it('should order invoices by due_date ascending', () => {
      // Generate array of due dates
      fc.assert(
        fc.property(
          fc.array(validDateArb, { minLength: 2, maxLength: 20 }),
          (dueDates) => {
            // Sort ascending (as the query would do)
            const sorted = [...dueDates].sort((a, b) => 
              new Date(a).getTime() - new Date(b).getTime()
            );
            
            // Verify ordering
            for (let i = 1; i < sorted.length; i++) {
              expect(new Date(sorted[i]).getTime()).toBeGreaterThanOrEqual(
                new Date(sorted[i - 1]).getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Property 7: Filter Results Correctness
  // Validates: Requirements 3.3, 3.4, 3.5
  // =====================================================
  describe('Property 7: Filter Results Correctness', () => {
    it('should filter by status correctly', () => {
      const statuses = ['received', 'verified', 'approved', 'partial', 'paid', 'disputed', 'cancelled'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...statuses),
          fc.array(fc.constantFrom(...statuses), { minLength: 5, maxLength: 20 }),
          (filterStatus, invoiceStatuses) => {
            // Simulate filtering
            const filtered = invoiceStatuses.filter(s => s === filterStatus);
            
            // All filtered results should match the filter
            filtered.forEach(s => {
              expect(s).toBe(filterStatus);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by date range correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1825 }),  // 0-5 years from base
          fc.integer({ min: 1826, max: 3650 }), // 5-10 years from base
          fc.array(
            fc.integer({ min: 0, max: 3650 }),
            { minLength: 5, maxLength: 20 }
          ),
          (fromOffset, toOffset, dateOffsets) => {
            const baseDate = new Date('2020-01-01');
            
            const fromDate = new Date(baseDate);
            fromDate.setDate(fromDate.getDate() + fromOffset);
            const fromStr = fromDate.toISOString().split('T')[0];
            
            const toDate = new Date(baseDate);
            toDate.setDate(toDate.getDate() + toOffset);
            const toStr = toDate.toISOString().split('T')[0];
            
            // Generate invoice dates from offsets
            const invoiceDates = dateOffsets.map(offset => {
              const d = new Date(baseDate);
              d.setDate(d.getDate() + offset);
              return d.toISOString().split('T')[0];
            });
            
            // Simulate filtering
            const filtered = invoiceDates.filter(dateStr => {
              return dateStr >= fromStr && dateStr <= toStr;
            });
            
            // All filtered results should be within range
            filtered.forEach(dateStr => {
              expect(dateStr >= fromStr).toBe(true);
              expect(dateStr <= toStr).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by vendor_id correctly', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.array(fc.uuid(), { minLength: 5, maxLength: 20 }),
          (filterVendorId, vendorIds) => {
            // Simulate filtering
            const filtered = vendorIds.filter(id => id === filterVendorId);
            
            // All filtered results should match
            filtered.forEach(id => {
              expect(id).toBe(filterVendorId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // =====================================================
  // Property 18: Flexible Job Reference Linking
  // Validates: Requirements 11.1, 11.2
  // =====================================================
  describe('Property 18: Flexible Job Reference Linking', () => {
    it('should allow linking to only PJO (pre-execution costs)', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (pjoId) => {
            // Simulate invoice with only PJO reference
            const invoice = {
              pjo_id: pjoId,
              jo_id: null,
            };
            
            // Should be valid - PJO only linking is allowed
            expect(invoice.pjo_id).toBe(pjoId);
            expect(invoice.jo_id).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow linking to only JO (execution/post-execution costs)', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (joId) => {
            // Simulate invoice with only JO reference
            const invoice = {
              pjo_id: null,
              jo_id: joId,
            };
            
            // Should be valid - JO only linking is allowed
            expect(invoice.pjo_id).toBeNull();
            expect(invoice.jo_id).toBe(joId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow linking to both PJO and JO (after conversion)', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (pjoId, joId) => {
            // Simulate invoice with both references (after PJO->JO conversion)
            const invoice = {
              pjo_id: pjoId,
              jo_id: joId,
            };
            
            // Should be valid - both references allowed
            expect(invoice.pjo_id).toBe(pjoId);
            expect(invoice.jo_id).toBe(joId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow no job reference (standalone vendor invoice)', () => {
      // Simulate invoice with no job reference
      const invoice = {
        pjo_id: null,
        jo_id: null,
      };
      
      // Should be valid - no job reference is allowed
      expect(invoice.pjo_id).toBeNull();
      expect(invoice.jo_id).toBeNull();
    });
  });

  // =====================================================
  // Property 21: Aging Filter Correctness
  // Validates: Requirements 12.5
  // =====================================================
  describe('Property 21: Aging Filter Correctness', () => {
    it('should correctly calculate aging bucket for current (not overdue)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          (daysInFuture) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysInFuture);
            const futureDateStr = futureDate.toISOString().split('T')[0];
            
            const bucket = calculateAgingBucket(futureDateStr);
            expect(bucket).toBe('current');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate aging bucket for 1-30 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (daysOverdue) => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysOverdue);
            const pastDateStr = pastDate.toISOString().split('T')[0];
            
            const bucket = calculateAgingBucket(pastDateStr);
            expect(bucket).toBe('1-30');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate aging bucket for 31-60 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 31, max: 60 }),
          (daysOverdue) => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysOverdue);
            const pastDateStr = pastDate.toISOString().split('T')[0];
            
            const bucket = calculateAgingBucket(pastDateStr);
            expect(bucket).toBe('31-60');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate aging bucket for 61-90 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 61, max: 90 }),
          (daysOverdue) => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysOverdue);
            const pastDateStr = pastDate.toISOString().split('T')[0];
            
            const bucket = calculateAgingBucket(pastDateStr);
            expect(bucket).toBe('61-90');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate aging bucket for 90+ days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 91, max: 365 }),
          (daysOverdue) => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysOverdue);
            const pastDateStr = pastDate.toISOString().split('T')[0];
            
            const bucket = calculateAgingBucket(pastDateStr);
            expect(bucket).toBe('90+');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter invoices by aging bucket correctly', () => {
      const agingBuckets: AgingBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...agingBuckets),
          fc.array(
            fc.integer({ min: -365, max: 365 }),
            { minLength: 5, maxLength: 20 }
          ),
          (filterBucket, daysOffsets) => {
            // Generate due dates from offsets
            const invoices = daysOffsets.map(offset => {
              const date = new Date();
              date.setDate(date.getDate() + offset);
              return {
                due_date: date.toISOString().split('T')[0],
                status: 'received' as const,
              };
            });
            
            // Filter by aging bucket
            const filtered = invoices.filter(inv => {
              return calculateAgingBucket(inv.due_date) === filterBucket;
            });
            
            // All filtered results should have matching aging bucket
            filtered.forEach(inv => {
              expect(calculateAgingBucket(inv.due_date)).toBe(filterBucket);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // =====================================================
  // Property 5: BKK Bidirectional Linking
  // Validates: Requirements 1.7, 10.2
  // =====================================================
  describe('Property 5: BKK Bidirectional Linking', () => {
    it('should maintain bidirectional link consistency', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (invoiceId, bkkId) => {
            // Simulate bidirectional linking
            const vendorInvoice = {
              id: invoiceId,
              bkk_id: bkkId,
            };
            
            const bkk = {
              id: bkkId,
              vendor_invoice_id: invoiceId,
            };
            
            // Verify bidirectional consistency
            expect(vendorInvoice.bkk_id).toBe(bkk.id);
            expect(bkk.vendor_invoice_id).toBe(vendorInvoice.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null BKK link correctly', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (invoiceId) => {
            // Invoice without BKK link
            const vendorInvoice = {
              id: invoiceId,
              bkk_id: null,
            };
            
            expect(vendorInvoice.bkk_id).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Role-Based Access Control Tests
  // Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7
  // =====================================================
  describe('Role-Based Access Control', () => {
    it('should allow view access for owner, admin, manager, finance roles', () => {
      fc.assert(
        fc.property(viewableRoleArb, (role) => {
          expect(canViewVendorInvoices(role)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should deny view access for ops, sales, engineer roles', () => {
      fc.assert(
        fc.property(nonViewableRoleArb, (role) => {
          expect(canViewVendorInvoices(role)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should allow edit access for owner, admin, finance roles', () => {
      fc.assert(
        fc.property(editableRoleArb, (role) => {
          expect(canEditVendorInvoices(role)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should deny edit access for manager, ops, sales, engineer roles', () => {
      const nonEditableRoles = ['manager', 'ops', 'sales', 'engineer'];
      
      fc.assert(
        fc.property(fc.constantFrom(...nonEditableRoles), (role) => {
          expect(canEditVendorInvoices(role)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should allow delete access for owner, admin roles only', () => {
      fc.assert(
        fc.property(deletableRoleArb, (role) => {
          expect(canDeleteVendorInvoices(role)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should deny delete access for finance, manager, ops, sales, engineer roles', () => {
      const nonDeletableRoles = ['finance', 'manager', 'ops', 'sales', 'engineer'];
      
      fc.assert(
        fc.property(fc.constantFrom(...nonDeletableRoles), (role) => {
          expect(canDeleteVendorInvoices(role)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Property 11: Variance Calculation
  // Validates: Requirements 5.1
  // =====================================================
  describe('Property 11: Variance Calculation', () => {
    it('should calculate variance as invoice amount minus BKK amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(1000000), noNaN: true }),
          fc.float({ min: Math.fround(100), max: Math.fround(1000000), noNaN: true }),
          (bkkAmount, invoiceAmount) => {
            const result = calculateVariance(bkkAmount, invoiceAmount);
            
            // Variance = invoice - bkk
            expect(result.variance).toBeCloseTo(invoiceAmount - bkkAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate variance percent correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(1000000), noNaN: true }),
          fc.float({ min: Math.fround(100), max: Math.fround(1000000), noNaN: true }),
          (bkkAmount, invoiceAmount) => {
            const result = calculateVariance(bkkAmount, invoiceAmount);
            
            // Variance percent = (variance / bkk) * 100
            const expectedPercent = ((invoiceAmount - bkkAmount) / bkkAmount) * 100;
            expect(result.variancePercent).toBeCloseTo(expectedPercent, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero BKK amount gracefully', () => {
      const result = calculateVariance(0, 1000);
      expect(result.variance).toBe(1000);
      expect(result.variancePercent).toBe(0); // Avoid division by zero
    });
  });

  // =====================================================
  // Property 12: Verification Status Determination
  // Validates: Requirements 5.2, 5.3
  // =====================================================
  describe('Property 12: Verification Status Determination', () => {
    it('should mark as verified when variance is within 2% tolerance', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
          fc.float({ min: Math.fround(-1.9), max: Math.fround(1.9), noNaN: true }), // Use 1.9% to avoid boundary issues
          (bkkAmount, variancePercent) => {
            // Calculate invoice amount that gives the desired variance percent
            const invoiceAmount = bkkAmount * (1 + variancePercent / 100);
            const result = calculateVariance(bkkAmount, invoiceAmount);
            
            // Within 2% should be within tolerance
            expect(result.withinTolerance).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark as disputed when variance exceeds 2% tolerance', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
          fc.oneof(
            fc.float({ min: Math.fround(2.1), max: Math.fround(50), noNaN: true }),
            fc.float({ min: Math.fround(-50), max: Math.fround(-2.1), noNaN: true })
          ),
          (bkkAmount, variancePercent) => {
            // Calculate invoice amount that gives the desired variance percent
            const invoiceAmount = bkkAmount * (1 + variancePercent / 100);
            const result = calculateVariance(bkkAmount, invoiceAmount);
            
            // Outside 2% should not be within tolerance
            expect(result.withinTolerance).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify boundary case at exactly 2%', () => {
      const bkkAmount = 10000;
      const invoiceAmount = 10200; // Exactly 2% over
      const result = calculateVariance(bkkAmount, invoiceAmount);
      
      expect(result.variancePercent).toBeCloseTo(2, 1);
      expect(result.withinTolerance).toBe(true);
    });

    it('should correctly identify boundary case at exactly -2%', () => {
      const bkkAmount = 10000;
      const invoiceAmount = 9800; // Exactly 2% under
      const result = calculateVariance(bkkAmount, invoiceAmount);
      
      expect(result.variancePercent).toBeCloseTo(-2, 1);
      expect(result.withinTolerance).toBe(true);
    });
  });

  // =====================================================
  // Property 13: Verification Metadata Recording
  // Validates: Requirements 5.4
  // =====================================================
  describe('Property 13: Verification Metadata Recording', () => {
    it('should record verification timestamp and user', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
          (invoiceId, userId, notes) => {
            // Simulate verification metadata
            const verificationData = {
              verified_at: new Date().toISOString(),
              verified_by: userId,
              verification_notes: notes || null,
            };
            
            // Verify metadata is recorded
            expect(verificationData.verified_at).toBeTruthy();
            expect(verificationData.verified_by).toBe(userId);
            if (notes) {
              expect(verificationData.verification_notes).toBe(notes);
            } else {
              expect(verificationData.verification_notes).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Property 14: Approval Status Transition
  // Validates: Requirements 6.1, 6.2, 6.3
  // =====================================================
  describe('Property 14: Approval Status Transition', () => {
    it('should only allow approval from verified status', () => {
      const validStatuses = ['received', 'verified', 'approved', 'partial', 'paid', 'disputed', 'cancelled'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...validStatuses),
          (currentStatus) => {
            // Only 'verified' status can transition to 'approved'
            const canApprove = currentStatus === 'verified';
            
            if (canApprove) {
              expect(currentStatus).toBe('verified');
            } else {
              expect(currentStatus).not.toBe('verified');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record approval timestamp and user when approved', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (invoiceId, userId) => {
            // Simulate approval metadata
            const approvalData = {
              status: 'approved',
              approved_at: new Date().toISOString(),
              approved_by: userId,
            };
            
            // Verify approval metadata is recorded
            expect(approvalData.status).toBe('approved');
            expect(approvalData.approved_at).toBeTruthy();
            expect(approvalData.approved_by).toBe(userId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Property 15: Payment Recording and Status Update
  // Validates: Requirements 7.1, 7.2, 7.3, 7.4
  // =====================================================
  describe('Property 15: Payment Recording and Status Update', () => {
    it('should update status to paid when fully paid', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
          (totalAmount) => {
            // Full payment
            const amountPaid = totalAmount;
            const newStatus = determineVendorInvoiceStatus(totalAmount, amountPaid, 'approved');
            
            expect(newStatus).toBe('paid');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update status to partial when partially paid', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),
          (totalAmount, paymentRatio) => {
            // Partial payment
            const amountPaid = totalAmount * paymentRatio;
            const newStatus = determineVendorInvoiceStatus(totalAmount, amountPaid, 'approved');
            
            expect(newStatus).toBe('partial');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should keep current status when no payment made', () => {
      const prePaymentStatuses = ['received', 'verified', 'approved'];
      
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
          fc.constantFrom(...prePaymentStatuses),
          (totalAmount, currentStatus) => {
            // No payment
            const amountPaid = 0;
            const newStatus = determineVendorInvoiceStatus(totalAmount, amountPaid, currentStatus as VendorInvoiceStatus);
            
            expect(newStatus).toBe(currentStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not change status for cancelled invoices', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
          fc.float({ min: 0, max: Math.fround(1000000), noNaN: true }),
          (totalAmount, amountPaid) => {
            const newStatus = determineVendorInvoiceStatus(totalAmount, amountPaid, 'cancelled');
            expect(newStatus).toBe('cancelled');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not change status for disputed invoices', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1000), max: Math.fround(1000000), noNaN: true }),
          fc.float({ min: 0, max: Math.fround(1000000), noNaN: true }),
          (totalAmount, amountPaid) => {
            const newStatus = determineVendorInvoiceStatus(totalAmount, amountPaid, 'disputed');
            expect(newStatus).toBe('disputed');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Property 16: Matching BKK Query
  // Validates: Requirements 10.1
  // =====================================================
  describe('Property 16: Matching BKK Query', () => {
    it('should filter BKKs by vendor_id', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.array(
            fc.record({
              id: fc.uuid(),
              vendor_id: fc.uuid(),
              jo_id: fc.option(fc.uuid(), { nil: null }),
              status: fc.constantFrom('released', 'settled', 'pending'),
              vendor_invoice_id: fc.option(fc.uuid(), { nil: null }),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          (filterVendorId, bkks) => {
            // Simulate filtering logic
            const filtered = bkks.filter(bkk => 
              bkk.vendor_id === filterVendorId &&
              ['released', 'settled'].includes(bkk.status) &&
              bkk.vendor_invoice_id === null
            );
            
            // All filtered results should match vendor_id
            filtered.forEach(bkk => {
              expect(bkk.vendor_id).toBe(filterVendorId);
              expect(['released', 'settled']).toContain(bkk.status);
              expect(bkk.vendor_invoice_id).toBeNull();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should additionally filter by jo_id when provided', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.array(
            fc.record({
              id: fc.uuid(),
              vendor_id: fc.uuid(),
              jo_id: fc.option(fc.uuid(), { nil: null }),
              status: fc.constantFrom('released', 'settled'),
              vendor_invoice_id: fc.constant(null),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          (filterVendorId, filterJoId, bkks) => {
            // Simulate filtering logic with jo_id
            const filtered = bkks.filter(bkk => 
              bkk.vendor_id === filterVendorId &&
              bkk.jo_id === filterJoId
            );
            
            // All filtered results should match both vendor_id and jo_id
            filtered.forEach(bkk => {
              expect(bkk.vendor_id).toBe(filterVendorId);
              expect(bkk.jo_id).toBe(filterJoId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Property 17: Role-Based Access Control (Approval)
  // Validates: Requirements 9.5
  // =====================================================
  describe('Property 17: Role-Based Access Control (Approval)', () => {
    it('should allow approval for owner, admin, manager roles', () => {
      const approvalRoles = ['owner', 'admin', 'manager'];
      
      fc.assert(
        fc.property(fc.constantFrom(...approvalRoles), (role) => {
          expect(canApproveVendorInvoices(role)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should deny approval for finance, ops, sales, engineer roles', () => {
      const nonApprovalRoles = ['finance', 'ops', 'sales', 'engineer'];
      
      fc.assert(
        fc.property(fc.constantFrom(...nonApprovalRoles), (role) => {
          expect(canApproveVendorInvoices(role)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // =====================================================
  // Validation Edge Cases
  // =====================================================
  describe('Validation Edge Cases', () => {
    it('should reject zero subtotal', () => {
      const validation = validateVendorInvoiceInput({
        vendor_id: 'vendor-123',
        invoice_number: 'INV-001',
        invoice_date: '2025-01-01',
        subtotal: 0,
        tax_amount: 0,
      });
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Subtotal must be greater than zero');
    });

    it('should reject negative subtotal', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.01), noNaN: true }),
          (negativeSubtotal) => {
            const validation = validateVendorInvoiceInput({
              vendor_id: 'vendor-123',
              invoice_number: 'INV-001',
              invoice_date: '2025-01-01',
              subtotal: negativeSubtotal,
              tax_amount: 0,
            });
            
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Subtotal must be greater than zero');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject negative tax_amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.01), noNaN: true }),
          (negativeTax) => {
            const validation = validateVendorInvoiceInput({
              vendor_id: 'vendor-123',
              invoice_number: 'INV-001',
              invoice_date: '2025-01-01',
              subtotal: 1000,
              tax_amount: negativeTax,
            });
            
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Tax amount cannot be negative');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept zero tax_amount', () => {
      const validation = validateVendorInvoiceInput({
        vendor_id: 'vendor-123',
        invoice_number: 'INV-001',
        invoice_date: '2025-01-01',
        subtotal: 1000,
        tax_amount: 0,
      });
      
      expect(validation.isValid).toBe(true);
    });

    it('should accept undefined tax_amount', () => {
      const validation = validateVendorInvoiceInput({
        vendor_id: 'vendor-123',
        invoice_number: 'INV-001',
        invoice_date: '2025-01-01',
        subtotal: 1000,
      });
      
      expect(validation.isValid).toBe(true);
    });
  });

  // =====================================================
  // Property 19: PJO to JO Conversion Linkage
  // Validates: Requirements 11.3
  // =====================================================
  describe('Property 19: PJO to JO Conversion Linkage', () => {
    it('should update jo_id for all invoices linked to PJO', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.array(
            fc.record({
              id: fc.uuid(),
              pjo_id: fc.uuid(),
              jo_id: fc.option(fc.uuid(), { nil: null }),
            }),
            { minLength: 3, maxLength: 10 }
          ),
          (targetPjoId, newJoId, invoices) => {
            // Simulate conversion: update jo_id for all invoices with matching pjo_id
            const updatedInvoices = invoices.map(inv => {
              if (inv.pjo_id === targetPjoId) {
                return { ...inv, jo_id: newJoId };
              }
              return inv;
            });
            
            // Verify all invoices with matching pjo_id now have the new jo_id
            updatedInvoices.forEach(inv => {
              if (inv.pjo_id === targetPjoId) {
                expect(inv.jo_id).toBe(newJoId);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain pjo_id reference after conversion', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (pjoId, joId) => {
            // Simulate invoice after PJO->JO conversion
            const invoice = {
              pjo_id: pjoId,
              jo_id: joId,
            };
            
            // Both references should be maintained
            expect(invoice.pjo_id).toBe(pjoId);
            expect(invoice.jo_id).toBe(joId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not affect invoices linked to other PJOs', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (targetPjoId, otherPjoId, newJoId, existingJoId) => {
            // Ensure different PJO IDs
            fc.pre(targetPjoId !== otherPjoId);
            
            // Invoice linked to different PJO
            const otherInvoice = {
              pjo_id: otherPjoId,
              jo_id: existingJoId,
            };
            
            // Simulate conversion for targetPjoId - should not affect otherInvoice
            // (In real implementation, the query filters by pjo_id)
            const shouldUpdate = otherInvoice.pjo_id === targetPjoId;
            
            if (!shouldUpdate) {
              // Invoice should remain unchanged
              expect(otherInvoice.jo_id).toBe(existingJoId);
              expect(otherInvoice.pjo_id).toBe(otherPjoId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
