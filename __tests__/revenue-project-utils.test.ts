import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateProfitMargin,
  aggregateRevenueByProject,
  buildRevenueByProjectReport,
} from '@/lib/reports/revenue-project-utils'

/**
 * **Feature: v0.10.1-reports-phase2, Property 2: Revenue aggregation per project**
 * For any set of completed JOs with project associations, the Revenue by Project report
 * should correctly sum revenue and cost per project.
 * **Validates: Requirements 2.1, 2.2**
 */
describe('Property 2: Revenue aggregation per project', () => {
  it('should correctly aggregate revenue and cost per project', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            projectId: fc.stringMatching(/^proj-[0-9]+$/),
            projectName: fc.string({ minLength: 1, maxLength: 50 }),
            customerName: fc.string({ minLength: 1, maxLength: 50 }),
            revenue: fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }),
            cost: fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (joData) => {
          const result = aggregateRevenueByProject(joData)
          
          // Sum of all aggregated revenues should equal sum of input revenues
          const totalRevenueFromResult = Array.from(result.values()).reduce((sum, v) => sum + v.totalRevenue, 0)
          const totalRevenueFromInput = joData.reduce((sum, jo) => sum + jo.revenue, 0)
          expect(totalRevenueFromResult).toBeCloseTo(totalRevenueFromInput, 5)
          
          // Sum of all aggregated costs should equal sum of input costs
          const totalCostFromResult = Array.from(result.values()).reduce((sum, v) => sum + v.totalCost, 0)
          const totalCostFromInput = joData.reduce((sum, jo) => sum + jo.cost, 0)
          expect(totalCostFromResult).toBeCloseTo(totalCostFromInput, 5)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 3: Profit margin calculation**
 * For any revenue and cost values, the profit margin should equal ((revenue - cost) / revenue * 100),
 * returning 0 when revenue is zero.
 * **Validates: Requirements 2.3, 2.4**
 */
describe('Property 3: Profit margin calculation', () => {
  it('should calculate profit margin correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }),
        (revenue, cost) => {
          const margin = calculateProfitMargin(revenue, cost)
          const expected = ((revenue - cost) / revenue) * 100
          expect(margin).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return 0 when revenue is zero', () => {
    expect(calculateProfitMargin(0, 100)).toBe(0)
    expect(calculateProfitMargin(0, 0)).toBe(0)
  })

  it('should handle negative margins (cost > revenue)', () => {
    const margin = calculateProfitMargin(100, 150)
    expect(margin).toBe(-50)
  })
})

describe('buildRevenueByProjectReport', () => {
  it('should build a complete report with correct totals', () => {
    const joData = [
      { projectId: 'p1', projectName: 'Project A', customerName: 'Customer 1', revenue: 1000, cost: 600 },
      { projectId: 'p1', projectName: 'Project A', customerName: 'Customer 1', revenue: 500, cost: 300 },
      { projectId: 'p2', projectName: 'Project B', customerName: 'Customer 2', revenue: 2000, cost: 1000 },
      { projectId: 'p3', projectName: 'Project C', customerName: 'Customer 3', revenue: 0, cost: 100 },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildRevenueByProjectReport(joData, period)
    
    // Should have 2 projects (p3 filtered out due to zero revenue)
    expect(report.items.length).toBe(2)
    expect(report.totalRevenue).toBe(3500)
    expect(report.totalCost).toBe(1900)
    
    // Should be sorted by revenue descending
    expect(report.items[0].projectName).toBe('Project B')
    expect(report.items[1].projectName).toBe('Project A')
    
    // Margins should be calculated correctly
    expect(report.items[0].profitMargin).toBeCloseTo(50, 5) // (2000-1000)/2000 * 100
    expect(report.items[1].profitMargin).toBeCloseTo(40, 5) // (1500-900)/1500 * 100
  })

  it('should handle empty data', () => {
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    const report = buildRevenueByProjectReport([], period)
    
    expect(report.items).toHaveLength(0)
    expect(report.totalRevenue).toBe(0)
    expect(report.averageMargin).toBe(0)
  })
})
