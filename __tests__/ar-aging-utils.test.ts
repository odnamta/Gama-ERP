import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateDaysOverdue,
  assignAgingBucket,
  determineSeverity,
  aggregateByBucket,
  transformInvoicesToAgingItems,
  buildARAgingReportData,
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
})
