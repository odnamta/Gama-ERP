import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  aggregateRevenueByCustomer,
  calculatePercentageOfTotal,
  sortByRevenueDescending,
  filterZeroRevenue,
  buildRevenueByCustomerReport,
} from '@/lib/reports/revenue-customer-utils'

/**
 * **Feature: v0.10.1-reports-phase2, Property 1: Revenue aggregation per customer**
 * For any set of completed JOs with customer associations, the Revenue by Customer report
 * should correctly sum revenue per customer, and the sum of all customer revenues should equal the total revenue.
 * **Validates: Requirements 1.1, 1.2**
 */
describe('Property 1: Revenue aggregation per customer', () => {
  it('should correctly aggregate revenue per customer', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            customerId: fc.stringMatching(/^cust-[0-9]+$/),
            customerName: fc.string({ minLength: 1, maxLength: 50 }),
            revenue: fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (joData) => {
          const result = aggregateRevenueByCustomer(joData)
          
          // Sum of all aggregated revenues should equal sum of input revenues
          const totalFromResult = Array.from(result.values()).reduce((sum, v) => sum + v.totalRevenue, 0)
          const totalFromInput = joData.reduce((sum, jo) => sum + jo.revenue, 0)
          
          expect(totalFromResult).toBeCloseTo(totalFromInput, 5)
          
          // Each customer's JO count should match input
          for (const [customerId, data] of result.entries()) {
            const inputCount = joData.filter(jo => jo.customerId === customerId).length
            expect(data.joCount).toBe(inputCount)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 5: Percentage calculations sum to 100**
 * For any report with percentage distributions, the percentages should sum to 100% (within floating point tolerance).
 * **Validates: Requirements 1.2**
 */
describe('Property 5: Percentage calculations sum to 100', () => {
  it('should have percentages sum to 100 for non-empty data', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            totalRevenue: fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (items) => {
          const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0)
          const percentages = calculatePercentageOfTotal(items, totalRevenue)
          const sum = percentages.reduce((s, p) => s + p, 0)
          
          expect(sum).toBeCloseTo(100, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all zeros when total revenue is zero', () => {
    const items = [{ totalRevenue: 0 }, { totalRevenue: 0 }]
    const percentages = calculatePercentageOfTotal(items, 0)
    
    expect(percentages.every(p => p === 0)).toBe(true)
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 6: Sorting by amount descending**
 * For any report with amount-based sorting, items should be ordered from highest to lowest amount.
 * **Validates: Requirements 1.3**
 */
describe('Property 6: Sorting by amount descending', () => {
  it('should sort items by revenue in descending order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            totalRevenue: fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }),
            customerId: fc.string(),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (items) => {
          const sorted = sortByRevenueDescending(items)
          
          // Verify descending order
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].totalRevenue).toBeGreaterThanOrEqual(sorted[i].totalRevenue)
          }
          
          // Verify same length (no items lost)
          expect(sorted.length).toBe(items.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 7: Zero-value filtering**
 * For any report that excludes zero values, no items with zero amount should appear in the results.
 * **Validates: Requirements 1.4**
 */
describe('Property 7: Zero-value filtering', () => {
  it('should exclude all items with zero revenue', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            totalRevenue: fc.float({ min: Math.fround(-100), max: Math.fround(1000000), noNaN: true }),
            customerId: fc.string(),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (items) => {
          const filtered = filterZeroRevenue(items)
          
          // No zero or negative values in result
          expect(filtered.every(item => item.totalRevenue > 0)).toBe(true)
          
          // All positive items from input should be in result
          const positiveInputCount = items.filter(item => item.totalRevenue > 0).length
          expect(filtered.length).toBe(positiveInputCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('buildRevenueByCustomerReport', () => {
  it('should build a complete report with correct totals', () => {
    const joData = [
      { customerId: 'c1', customerName: 'Customer A', revenue: 1000 },
      { customerId: 'c1', customerName: 'Customer A', revenue: 500 },
      { customerId: 'c2', customerName: 'Customer B', revenue: 2000 },
      { customerId: 'c3', customerName: 'Customer C', revenue: 0 },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildRevenueByCustomerReport(joData, period)
    
    // Should have 2 customers (c3 filtered out due to zero revenue)
    expect(report.customerCount).toBe(2)
    expect(report.totalRevenue).toBe(3500)
    
    // Should be sorted by revenue descending
    expect(report.items[0].customerName).toBe('Customer B')
    expect(report.items[0].totalRevenue).toBe(2000)
    expect(report.items[1].customerName).toBe('Customer A')
    expect(report.items[1].totalRevenue).toBe(1500)
    
    // Percentages should sum to 100
    const percentSum = report.items.reduce((sum, item) => sum + item.percentageOfTotal, 0)
    expect(percentSum).toBeCloseTo(100, 5)
  })

  it('should handle empty data', () => {
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    const report = buildRevenueByCustomerReport([], period)
    
    expect(report.items).toHaveLength(0)
    expect(report.totalRevenue).toBe(0)
    expect(report.customerCount).toBe(0)
  })
})
