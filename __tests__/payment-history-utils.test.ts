import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  aggregatePaymentsByCustomer,
  calculateAverageDaysToPay,
  identifySlowPayers,
  buildCustomerPaymentReport,
} from '@/lib/reports/payment-history-utils'

/**
 * **Feature: v0.10.1-reports-phase2, Property 14: Customer payment aggregation**
 * For any set of invoices and payments per customer, the report should correctly calculate
 * total invoiced, total paid, and outstanding balance (invoiced - paid).
 * **Validates: Requirements 7.1, 7.2**
 */
describe('Property 14: Customer payment aggregation', () => {
  it('should correctly aggregate payment data per customer', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            customerId: fc.constantFrom('c1', 'c2', 'c3'),
            customerName: fc.string({ minLength: 1, maxLength: 50 }),
            invoiceAmount: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
            paidAmount: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
            daysToPay: fc.option(fc.integer({ min: 0, max: 120 }), { nil: null }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (payments) => {
          const result = aggregatePaymentsByCustomer(payments)
          
          const totalInvoicedFromResult = Array.from(result.values()).reduce((sum, v) => sum + v.totalInvoiced, 0)
          const totalInvoicedFromInput = payments.reduce((sum, p) => sum + p.invoiceAmount, 0)
          
          expect(totalInvoicedFromResult).toBeCloseTo(totalInvoicedFromInput, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should calculate outstanding balance correctly', () => {
    const payments = [
      { customerId: 'c1', customerName: 'Customer A', invoiceAmount: 1000, paidAmount: 600, daysToPay: 30 },
      { customerId: 'c1', customerName: 'Customer A', invoiceAmount: 500, paidAmount: 500, daysToPay: 15 },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildCustomerPaymentReport(payments, period)
    const customerA = report.items.find(i => i.customerId === 'c1')
    
    expect(customerA?.totalInvoiced).toBe(1500)
    expect(customerA?.totalPaid).toBe(1100)
    expect(customerA?.outstandingBalance).toBe(400)
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 15: Average days to pay calculation**
 * For any set of paid invoices, average days to pay should equal the mean of days to pay,
 * returning null when no paid invoices exist.
 * **Validates: Requirements 7.3, 7.4**
 */
describe('Property 15: Average days to pay calculation', () => {
  it('should calculate average correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 120 }), { minLength: 1, maxLength: 50 }),
        (daysToPay) => {
          const avg = calculateAverageDaysToPay(daysToPay)
          const expected = daysToPay.reduce((sum, d) => sum + d, 0) / daysToPay.length
          
          expect(avg).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return null when no paid invoices', () => {
    expect(calculateAverageDaysToPay([])).toBeNull()
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 16: Slow payer threshold**
 * For any customer payment item, isSlowPayer should be true if and only if averageDaysToPay exceeds 45 days.
 * **Validates: Requirements 7.5**
 */
describe('Property 16: Slow payer threshold', () => {
  it('should identify slow payers correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 120 }),
        (avgDays) => {
          const isSlowPayer = identifySlowPayers(avgDays)
          expect(isSlowPayer).toBe(avgDays > 45)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return false when averageDaysToPay is null', () => {
    expect(identifySlowPayers(null)).toBe(false)
  })

  it('should return false at exactly 45 days', () => {
    expect(identifySlowPayers(45)).toBe(false)
  })

  it('should return true at 46 days', () => {
    expect(identifySlowPayers(46)).toBe(true)
  })
})

describe('buildCustomerPaymentReport', () => {
  it('should build a complete report', () => {
    const payments = [
      { customerId: 'c1', customerName: 'Customer A', invoiceAmount: 1000, paidAmount: 1000, daysToPay: 50 },
      { customerId: 'c2', customerName: 'Customer B', invoiceAmount: 2000, paidAmount: 1500, daysToPay: 30 },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildCustomerPaymentReport(payments, period)
    
    expect(report.totalInvoiced).toBe(3000)
    expect(report.totalPaid).toBe(2500)
    expect(report.totalOutstanding).toBe(500)
    
    const customerA = report.items.find(i => i.customerId === 'c1')
    expect(customerA?.isSlowPayer).toBe(true) // 50 > 45
    
    const customerB = report.items.find(i => i.customerId === 'c2')
    expect(customerB?.isSlowPayer).toBe(false) // 30 <= 45
  })
})
