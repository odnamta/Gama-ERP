import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateDaysOutstanding,
  getAgingBucket,
  groupByAgingBucket,
  filterByCustomer,
  buildOutstandingInvoicesReport,
  OutstandingInvoiceItem,
} from '@/lib/reports/outstanding-invoices-utils'

/**
 * **Feature: v0.10.1-reports-phase2, Property 17: Outstanding invoices listing**
 * For any set of unpaid invoices, all should appear in the Outstanding Invoices report
 * with correct days outstanding calculation.
 * **Validates: Requirements 8.1, 8.2**
 */
describe('Property 17: Outstanding invoices listing', () => {
  it('should include all invoices in the report', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            invoiceId: fc.stringMatching(/^inv-[0-9]+$/),
            invoiceNumber: fc.string({ minLength: 1, maxLength: 20 }),
            customerName: fc.string({ minLength: 1, maxLength: 50 }),
            joNumber: fc.string({ minLength: 1, maxLength: 20 }),
            invoiceDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            dueDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            amount: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
            daysOutstanding: fc.integer({ min: -30, max: 365 }),
            agingBucket: fc.constantFrom('Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (items) => {
          const report = buildOutstandingInvoicesReport(items as OutstandingInvoiceItem[])
          
          expect(report.totalCount).toBe(items.length)
          expect(report.items.length).toBe(items.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should calculate total amount correctly', () => {
    const items: OutstandingInvoiceItem[] = [
      { invoiceId: '1', invoiceNumber: 'INV-1', customerName: 'A', joNumber: 'JO-1', invoiceDate: new Date(), dueDate: new Date(), amount: 1000, daysOutstanding: 10, agingBucket: '1-30 Days' },
      { invoiceId: '2', invoiceNumber: 'INV-2', customerName: 'B', joNumber: 'JO-2', invoiceDate: new Date(), dueDate: new Date(), amount: 2000, daysOutstanding: 45, agingBucket: '31-60 Days' },
    ]
    
    const report = buildOutstandingInvoicesReport(items)
    expect(report.totalAmount).toBe(3000)
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 18: Outstanding invoices customer filtering**
 * For any Outstanding Invoices report filtered by customer, all returned items should belong to the specified customer.
 * **Validates: Requirements 8.4**
 */
describe('Property 18: Outstanding invoices customer filtering', () => {
  it('should filter by customer correctly', () => {
    const items: OutstandingInvoiceItem[] = [
      { invoiceId: 'c1-1', invoiceNumber: 'INV-1', customerName: 'Customer A', joNumber: 'JO-1', invoiceDate: new Date(), dueDate: new Date(), amount: 1000, daysOutstanding: 10, agingBucket: '1-30 Days' },
      { invoiceId: 'c2-1', invoiceNumber: 'INV-2', customerName: 'Customer B', joNumber: 'JO-2', invoiceDate: new Date(), dueDate: new Date(), amount: 2000, daysOutstanding: 45, agingBucket: '31-60 Days' },
      { invoiceId: 'c1-2', invoiceNumber: 'INV-3', customerName: 'Customer A', joNumber: 'JO-3', invoiceDate: new Date(), dueDate: new Date(), amount: 500, daysOutstanding: 5, agingBucket: 'Current' },
    ]
    
    const filtered = filterByCustomer(items, 'c1')
    expect(filtered.length).toBe(2)
    expect(filtered.every(item => item.invoiceId.includes('c1'))).toBe(true)
  })

  it('should return all items when customerId is null', () => {
    const items: OutstandingInvoiceItem[] = [
      { invoiceId: '1', invoiceNumber: 'INV-1', customerName: 'A', joNumber: 'JO-1', invoiceDate: new Date(), dueDate: new Date(), amount: 1000, daysOutstanding: 10, agingBucket: '1-30 Days' },
      { invoiceId: '2', invoiceNumber: 'INV-2', customerName: 'B', joNumber: 'JO-2', invoiceDate: new Date(), dueDate: new Date(), amount: 2000, daysOutstanding: 45, agingBucket: '31-60 Days' },
    ]
    
    const filtered = filterByCustomer(items, null)
    expect(filtered.length).toBe(items.length)
  })
})

describe('calculateDaysOutstanding', () => {
  it('should calculate positive days for overdue invoices', () => {
    const dueDate = new Date('2024-01-01')
    const refDate = new Date('2024-01-15')
    expect(calculateDaysOutstanding(dueDate, refDate)).toBe(14)
  })

  it('should calculate negative days for not-yet-due invoices', () => {
    const dueDate = new Date('2024-01-15')
    const refDate = new Date('2024-01-01')
    expect(calculateDaysOutstanding(dueDate, refDate)).toBeLessThan(0)
  })
})

describe('getAgingBucket', () => {
  it('should return correct bucket for each range', () => {
    expect(getAgingBucket(-5)).toBe('Current')
    expect(getAgingBucket(0)).toBe('Current')
    expect(getAgingBucket(15)).toBe('1-30 Days')
    expect(getAgingBucket(45)).toBe('31-60 Days')
    expect(getAgingBucket(75)).toBe('61-90 Days')
    expect(getAgingBucket(100)).toBe('90+ Days')
  })
})

describe('groupByAgingBucket', () => {
  it('should group invoices by bucket correctly', () => {
    const items: OutstandingInvoiceItem[] = [
      { invoiceId: '1', invoiceNumber: 'INV-1', customerName: 'A', joNumber: 'JO-1', invoiceDate: new Date(), dueDate: new Date(), amount: 1000, daysOutstanding: 10, agingBucket: '1-30 Days' },
      { invoiceId: '2', invoiceNumber: 'INV-2', customerName: 'B', joNumber: 'JO-2', invoiceDate: new Date(), dueDate: new Date(), amount: 2000, daysOutstanding: 45, agingBucket: '31-60 Days' },
      { invoiceId: '3', invoiceNumber: 'INV-3', customerName: 'C', joNumber: 'JO-3', invoiceDate: new Date(), dueDate: new Date(), amount: 500, daysOutstanding: 20, agingBucket: '1-30 Days' },
    ]
    
    const breakdown = groupByAgingBucket(items)
    
    const bucket1_30 = breakdown.find(b => b.bucket === '1-30 Days')
    expect(bucket1_30?.count).toBe(2)
    expect(bucket1_30?.amount).toBe(1500)
    
    const bucket31_60 = breakdown.find(b => b.bucket === '31-60 Days')
    expect(bucket31_60?.count).toBe(1)
    expect(bucket31_60?.amount).toBe(2000)
  })
})
