import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateMargin,
  calculateSummaryTotals,
  filterByStatus,
  buildJOSummaryReport,
  JOSummaryItem,
  JOStatus,
} from '@/lib/reports/jo-summary-utils'

const joStatusArb = fc.constantFrom<JOStatus>('active', 'completed', 'submitted_to_finance', 'invoiced', 'closed')

const joItemArb = fc.record({
  joId: fc.stringMatching(/^jo-[0-9]+$/),
  joNumber: fc.string({ minLength: 1, maxLength: 20 }),
  customerName: fc.string({ minLength: 1, maxLength: 50 }),
  projectName: fc.string({ minLength: 1, maxLength: 50 }),
  status: joStatusArb,
  revenue: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
  cost: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
  margin: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 8: JO summary aggregation**
 * For any set of JOs within a period, the JO Summary totals should equal the sum of individual JO values.
 * **Validates: Requirements 4.1, 4.2, 4.4**
 */
describe('Property 8: JO summary aggregation', () => {
  it('should correctly aggregate JO totals', () => {
    fc.assert(
      fc.property(
        fc.array(joItemArb, { minLength: 0, maxLength: 50 }),
        (items) => {
          const totals = calculateSummaryTotals(items as JOSummaryItem[])
          
          const expectedRevenue = items.reduce((sum, item) => sum + item.revenue, 0)
          const expectedCost = items.reduce((sum, item) => sum + item.cost, 0)
          
          expect(totals.totalRevenue).toBeCloseTo(expectedRevenue, 5)
          expect(totals.totalCost).toBeCloseTo(expectedCost, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should calculate average margin correctly', () => {
    const items: JOSummaryItem[] = [
      { joId: '1', joNumber: 'JO-1', customerName: 'A', projectName: 'P1', status: 'completed', revenue: 1000, cost: 600, margin: 40 },
      { joId: '2', joNumber: 'JO-2', customerName: 'B', projectName: 'P2', status: 'completed', revenue: 2000, cost: 1000, margin: 50 },
    ]
    
    const totals = calculateSummaryTotals(items)
    // Total revenue: 3000, Total cost: 1600, Margin: (3000-1600)/3000 * 100 = 46.67%
    expect(totals.averageMargin).toBeCloseTo(46.67, 1)
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 9: JO status filtering**
 * For any JO Summary filtered by status, all returned items should have the specified status.
 * **Validates: Requirements 4.3**
 */
describe('Property 9: JO status filtering', () => {
  it('should filter items by status correctly', () => {
    fc.assert(
      fc.property(
        fc.array(joItemArb, { minLength: 0, maxLength: 50 }),
        joStatusArb,
        (items, status) => {
          const filtered = filterByStatus(items as JOSummaryItem[], status)
          
          expect(filtered.every(item => item.status === status)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all items when status is "all"', () => {
    const items: JOSummaryItem[] = [
      { joId: '1', joNumber: 'JO-1', customerName: 'A', projectName: 'P1', status: 'active', revenue: 1000, cost: 600, margin: 40 },
      { joId: '2', joNumber: 'JO-2', customerName: 'B', projectName: 'P2', status: 'completed', revenue: 2000, cost: 1000, margin: 50 },
    ]
    
    const filtered = filterByStatus(items, 'all')
    expect(filtered.length).toBe(items.length)
  })
})

describe('calculateMargin', () => {
  it('should return 0 when revenue is 0', () => {
    expect(calculateMargin(0, 100)).toBe(0)
  })

  it('should calculate margin correctly', () => {
    expect(calculateMargin(1000, 600)).toBe(40)
  })
})
