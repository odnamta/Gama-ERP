import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateDaysOverdue,
  calculateDaysOutstanding,
  assignAgingBucket,
  determineSeverity,
  aggregateByBucket,
  aggregateByCustomer,
  transformInvoicesToAgingItems,
  buildARAgingReportData,
  validateAgingFilters,
  filterUnpaidInvoices,
  AGING_BUCKETS,
} from '@/lib/reports/ar-aging-utils'
import { AgingInvoice } from '@/types/reports'

// Helper to generate date strings
const dateStringArb = fc.integer({ min: 2024, max: 2025 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day =>
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    )
  )
)

// Arbitrary for invoice data
const invoiceDataArb = fc.record({
  id: fc.uuid(),
  invoice_number: fc.stringMatching(/^INV-[0-9]{4}-[0-9]{4}$/),
  invoice_date: dateStringArb,
  due_date: dateStringArb,
  total_amount: fc.float({ min: 0, max: 1000000, noNaN: true }),
  customers: fc.option(fc.record({ name: fc.string() }), { nil: null }),
})

describe('AR Aging Utils', () => {
  /**
   * **Feature: v0.9.6-reports-module, Property 6: Aging bucket assignment**
   * *For any* unpaid invoice with a due date, the invoice should be assigned to
   * exactly one aging bucket based on days overdue.
   * **Validates: Requirements 4.1**
   */
  describe('Property 6: Aging bucket assignment', () => {
    it('should assign Current bucket for non-overdue invoices', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -365, max: 0 }),
          (daysOverdue) => {
            const bucket = assignAgingBucket(daysOverdue)
            expect(bucket).toBe('Current')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should assign 1-30 Days bucket correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (daysOverdue) => {
            const bucket = assignAgingBucket(daysOverdue)
            expect(bucket).toBe('1-30 Days')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should assign 31-60 Days bucket correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 31, max: 60 }),
          (daysOverdue) => {
            const bucket = assignAgingBucket(daysOverdue)
            expect(bucket).toBe('31-60 Days')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should assign 61-90 Days bucket correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 61, max: 90 }),
          (daysOverdue) => {
            const bucket = assignAgingBucket(daysOverdue)
            expect(bucket).toBe('61-90 Days')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should assign 90+ Days bucket correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 91, max: 1000 }),
          (daysOverdue) => {
            const bucket = assignAgingBucket(daysOverdue)
            expect(bucket).toBe('90+ Days')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should assign exactly one bucket to each invoice', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 500 }),
          (daysOverdue) => {
            const bucket = assignAgingBucket(daysOverdue)
            const validBuckets = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days']
            expect(validBuckets).toContain(bucket)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: v0.9.6-reports-module, Property 7: Aging bucket aggregation**
   * *For any* set of invoices assigned to aging buckets, each bucket's count should
   * equal the number of invoices in that bucket, and totalAmount should equal the
   * sum of invoice amounts in that bucket.
   * **Validates: Requirements 4.2**
   */
  describe('Property 7: Aging bucket aggregation', () => {
    it('should count invoices correctly per bucket', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              invoiceId: fc.uuid(),
              invoiceNumber: fc.string(),
              customerName: fc.string(),
              invoiceDate: fc.date(),
              dueDate: fc.date(),
              amount: fc.float({ min: 0, max: 1000000, noNaN: true }),
              daysOverdue: fc.integer({ min: 0, max: 200 }),
              bucket: fc.constantFrom('Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'),
              severity: fc.constantFrom('normal', 'warning', 'critical'),
            }) as fc.Arbitrary<AgingInvoice>,
            { minLength: 0, maxLength: 50 }
          ),
          (invoices) => {
            const buckets = aggregateByBucket(invoices)
            
            // Total count should match
            const totalCount = buckets.reduce((sum, b) => sum + b.count, 0)
            expect(totalCount).toBe(invoices.length)
            
            // Each bucket count should match filtered count
            for (const bucket of buckets) {
              const expectedCount = invoices.filter(i => i.bucket === bucket.label).length
              expect(bucket.count).toBe(expectedCount)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should sum amounts correctly per bucket', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              invoiceId: fc.uuid(),
              invoiceNumber: fc.string(),
              customerName: fc.string(),
              invoiceDate: fc.date(),
              dueDate: fc.date(),
              amount: fc.float({ min: 0, max: 1000000, noNaN: true }),
              daysOverdue: fc.integer({ min: 0, max: 200 }),
              bucket: fc.constantFrom('Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'),
              severity: fc.constantFrom('normal', 'warning', 'critical'),
            }) as fc.Arbitrary<AgingInvoice>,
            { minLength: 0, maxLength: 50 }
          ),
          (invoices) => {
            const buckets = aggregateByBucket(invoices)
            
            for (const bucket of buckets) {
              const expectedAmount = invoices
                .filter(i => i.bucket === bucket.label)
                .reduce((sum, i) => sum + i.amount, 0)
              expect(Math.abs(bucket.totalAmount - expectedAmount)).toBeLessThan(0.01)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: v0.9.6-reports-module, Property 8: Aging severity styling**
   * *For any* invoice, the severity should be 'critical' if 90+ days overdue,
   * 'warning' if 31-89 days overdue, and 'normal' otherwise.
   * **Validates: Requirements 4.4, 4.5**
   */
  describe('Property 8: Aging severity styling', () => {
    it('should return critical for 90+ days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 90, max: 1000 }),
          (daysOverdue) => {
            expect(determineSeverity(daysOverdue)).toBe('critical')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return warning for 31-89 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 31, max: 89 }),
          (daysOverdue) => {
            expect(determineSeverity(daysOverdue)).toBe('warning')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return normal for 0-30 days overdue', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 30 }),
          (daysOverdue) => {
            expect(determineSeverity(daysOverdue)).toBe('normal')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('calculateDaysOverdue', () => {
    it('should return 0 for future due dates', () => {
      const today = new Date('2025-01-15')
      const dueDate = new Date('2025-01-20')
      expect(calculateDaysOverdue(dueDate, today)).toBe(0)
    })

    it('should return correct days for past due dates', () => {
      const today = new Date('2025-01-15')
      const dueDate = new Date('2025-01-10')
      expect(calculateDaysOverdue(dueDate, today)).toBe(5)
    })
  })

  describe('transformInvoicesToAgingItems', () => {
    it('should transform all invoices', () => {
      fc.assert(
        fc.property(
          fc.array(invoiceDataArb, { minLength: 0, maxLength: 20 }),
          (invoices) => {
            const items = transformInvoicesToAgingItems(invoices)
            expect(items.length).toBe(invoices.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle null customer names', () => {
      const invoices = [{
        id: '1',
        invoice_number: 'INV-2025-0001',
        invoice_date: '2025-01-01',
        due_date: '2025-01-15',
        total_amount: 1000,
        customers: null,
      }]
      
      const items = transformInvoicesToAgingItems(invoices)
      expect(items[0].customerName).toBe('Unknown')
    })
  })

  describe('buildARAgingReportData', () => {
    it('should build complete report with correct totals', () => {
      fc.assert(
        fc.property(
          fc.array(invoiceDataArb, { minLength: 1, maxLength: 20 }),
          (invoices) => {
            const result = buildARAgingReportData(invoices)
            
            expect(result.totals.totalCount).toBe(invoices.length)
            
            const expectedTotal = invoices.reduce((sum, i) => sum + i.total_amount, 0)
            expect(Math.abs(result.totals.totalAmount - expectedTotal)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 9: Aging bucket assignment**
   * *For any* days overdue value:
   * - If days <= 0, bucket is 'Current'
   * - If 1 <= days <= 30, bucket is '1-30 Days'
   * - If 31 <= days <= 60, bucket is '31-60 Days'
   * - If 61 <= days <= 90, bucket is '61-90 Days'
   * - If days > 90, bucket is '90+ Days'
   * **Validates: Requirements 5.2**
   */
  describe('Property 9: Aging bucket assignment (v0.27)', () => {
    it('should assign buckets according to specification for any days value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -365, max: 500 }),
          (daysOverdue) => {
            const bucket = assignAgingBucket(daysOverdue)
            
            if (daysOverdue <= 0) {
              expect(bucket).toBe('Current')
            } else if (daysOverdue <= 30) {
              expect(bucket).toBe('1-30 Days')
            } else if (daysOverdue <= 60) {
              expect(bucket).toBe('31-60 Days')
            } else if (daysOverdue <= 90) {
              expect(bucket).toBe('61-90 Days')
            } else {
              expect(bucket).toBe('90+ Days')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle boundary values correctly', () => {
      // Test exact boundary values
      expect(assignAgingBucket(0)).toBe('Current')
      expect(assignAgingBucket(1)).toBe('1-30 Days')
      expect(assignAgingBucket(30)).toBe('1-30 Days')
      expect(assignAgingBucket(31)).toBe('31-60 Days')
      expect(assignAgingBucket(60)).toBe('31-60 Days')
      expect(assignAgingBucket(61)).toBe('61-90 Days')
      expect(assignAgingBucket(90)).toBe('61-90 Days')
      expect(assignAgingBucket(91)).toBe('90+ Days')
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 10: Days outstanding calculation**
   * *For any* invoice with a due_date and any as-of date, days_outstanding equals
   * the number of days between the as-of date and the due_date (positive if overdue,
   * zero or negative if not yet due).
   * **Validates: Requirements 5.7**
   */
  describe('Property 10: Days outstanding calculation', () => {
    it('should calculate positive days for overdue invoices', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysLate) => {
            const asOfDate = new Date('2025-06-15')
            const dueDate = new Date(asOfDate)
            dueDate.setDate(dueDate.getDate() - daysLate)
            
            const result = calculateDaysOutstanding(dueDate, asOfDate)
            expect(result).toBe(daysLate)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate negative days for future due dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysUntilDue) => {
            const asOfDate = new Date('2025-06-15')
            const dueDate = new Date(asOfDate)
            dueDate.setDate(dueDate.getDate() + daysUntilDue)
            
            const result = calculateDaysOutstanding(dueDate, asOfDate)
            expect(result).toBe(-daysUntilDue)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0 when due date equals as-of date', () => {
      const date = new Date('2025-06-15')
      expect(calculateDaysOutstanding(date, date)).toBe(0)
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 11: AR aging summary consistency**
   * *For any* set of invoices, the sum of amounts across all aging buckets in the
   * summary must equal the total outstanding amount.
   * **Validates: Requirements 5.3**
   */
  describe('Property 11: AR aging summary consistency', () => {
    it('should have bucket totals sum to total amount', () => {
      fc.assert(
        fc.property(
          fc.array(invoiceDataArb, { minLength: 0, maxLength: 30 }),
          (invoices) => {
            const report = buildARAgingReportData(invoices)
            
            const bucketSum = report.summary.reduce((sum, bucket) => sum + bucket.totalAmount, 0)
            const totalAmount = report.totals.totalAmount
            
            // Allow small floating point tolerance
            expect(Math.abs(bucketSum - totalAmount)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have bucket counts sum to total count', () => {
      fc.assert(
        fc.property(
          fc.array(invoiceDataArb, { minLength: 0, maxLength: 30 }),
          (invoices) => {
            const report = buildARAgingReportData(invoices)
            
            const bucketCountSum = report.summary.reduce((sum, bucket) => sum + bucket.count, 0)
            expect(bucketCountSum).toBe(report.totals.totalCount)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 12: Customer aging aggregation**
   * *For any* customer in the AR aging report, the sum of their amounts across all
   * aging buckets must equal the sum of their individual invoice amounts.
   * **Validates: Requirements 5.4**
   */
  describe('Property 12: Customer aging aggregation', () => {
    // Arbitrary for aging invoices with consistent customer names
    const agingInvoiceArb = fc.record({
      invoiceId: fc.uuid(),
      invoiceNumber: fc.string(),
      customerName: fc.constantFrom('Customer A', 'Customer B', 'Customer C'),
      invoiceDate: fc.constant(new Date('2025-01-01')),
      dueDate: fc.constant(new Date('2025-01-15')),
      amount: fc.float({ min: 0, max: 100000, noNaN: true }),
      daysOverdue: fc.integer({ min: 0, max: 200 }),
      bucket: fc.constantFrom('Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'),
      severity: fc.constantFrom('normal', 'warning', 'critical'),
    }) as fc.Arbitrary<AgingInvoice>

    it('should aggregate customer totals correctly', () => {
      fc.assert(
        fc.property(
          fc.array(agingInvoiceArb, { minLength: 1, maxLength: 30 }),
          (invoices) => {
            const customerData = aggregateByCustomer(invoices)
            
            // For each customer, verify total equals sum of bucket amounts
            for (const customer of customerData) {
              const bucketSum = customer.current + customer.days1to30 + 
                               customer.days31to60 + customer.days61to90 + customer.over90
              expect(Math.abs(bucketSum - customer.total)).toBeLessThan(0.01)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have customer totals sum to overall total', () => {
      fc.assert(
        fc.property(
          fc.array(agingInvoiceArb, { minLength: 1, maxLength: 30 }),
          (invoices) => {
            const customerData = aggregateByCustomer(invoices)
            
            const customerTotalSum = customerData.reduce((sum, c) => sum + c.total, 0)
            const invoiceTotalSum = invoices.reduce((sum, i) => sum + i.amount, 0)
            
            expect(Math.abs(customerTotalSum - invoiceTotalSum)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 13: AR aging invoice filter**
   * *For any* invoice included in the AR aging report, the invoice's amount_due
   * must be greater than zero.
   * **Validates: Requirements 5.8**
   */
  describe('Property 13: AR aging invoice filter', () => {
    const invoiceWithAmountDueArb = fc.record({
      id: fc.uuid(),
      invoice_number: fc.stringMatching(/^INV-[0-9]{4}-[0-9]{4}$/),
      invoice_date: dateStringArb,
      due_date: dateStringArb,
      total_amount: fc.float({ min: 0, max: 1000000, noNaN: true }),
      amount_due: fc.float({ min: -1000, max: 1000000, noNaN: true }),
      customers: fc.option(fc.record({ name: fc.string() }), { nil: null }),
    })

    it('should only include invoices with amount_due > 0', () => {
      fc.assert(
        fc.property(
          fc.array(invoiceWithAmountDueArb, { minLength: 0, maxLength: 30 }),
          (invoices) => {
            const filtered = filterUnpaidInvoices(invoices)
            
            // All filtered invoices should have amount_due > 0
            for (const inv of filtered) {
              const amountDue = inv.amount_due ?? inv.total_amount
              expect(amountDue).toBeGreaterThan(0)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should exclude fully paid invoices (amount_due = 0)', () => {
      const invoices = [
        { id: '1', invoice_number: 'INV-2025-0001', invoice_date: '2025-01-01', due_date: '2025-01-15', total_amount: 1000, amount_due: 0, customers: null },
        { id: '2', invoice_number: 'INV-2025-0002', invoice_date: '2025-01-01', due_date: '2025-01-15', total_amount: 2000, amount_due: 500, customers: null },
      ]
      
      const filtered = filterUnpaidInvoices(invoices)
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe('2')
    })

    it('should use total_amount when amount_due is undefined', () => {
      const invoices = [
        { id: '1', invoice_number: 'INV-2025-0001', invoice_date: '2025-01-01', due_date: '2025-01-15', total_amount: 1000, customers: null },
        { id: '2', invoice_number: 'INV-2025-0002', invoice_date: '2025-01-01', due_date: '2025-01-15', total_amount: 0, customers: null },
      ]
      
      const filtered = filterUnpaidInvoices(invoices)
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe('1')
    })
  })

  describe('validateAgingFilters', () => {
    it('should accept valid filters', () => {
      expect(validateAgingFilters({})).toEqual({ valid: true })
      expect(validateAgingFilters({ asOfDate: new Date() })).toEqual({ valid: true })
      expect(validateAgingFilters({ customerId: 'cust-123' })).toEqual({ valid: true })
    })

    it('should reject empty customer ID', () => {
      const result = validateAgingFilters({ customerId: '' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Customer ID')
    })

    it('should reject whitespace-only customer ID', () => {
      const result = validateAgingFilters({ customerId: '   ' })
      expect(result.valid).toBe(false)
    })
  })
})
