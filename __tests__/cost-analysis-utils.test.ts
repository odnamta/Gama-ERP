import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  aggregateCostsByCategory,
  calculateAveragePerJO,
  calculatePeriodComparison,
  filterZeroCosts,
  sortByCostDescending,
  buildCostAnalysisReport,
} from '@/lib/reports/cost-analysis-utils'

/**
 * **Feature: v0.10.1-reports-phase2, Property 4: Cost aggregation per category**
 * For any set of cost items with category assignments, the Cost Analysis report should correctly
 * sum costs per category, and the sum of all category costs should equal the total cost.
 * **Validates: Requirements 3.1, 3.2**
 */
describe('Property 4: Cost aggregation per category', () => {
  it('should correctly aggregate costs per category', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            category: fc.constantFrom('trucking', 'fuel', 'labor', 'tolls', 'other'),
            amount: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
            joId: fc.stringMatching(/^jo-[0-9]+$/),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (costItems) => {
          const result = aggregateCostsByCategory(costItems)
          
          const totalFromResult = Array.from(result.values()).reduce((sum, v) => sum + v.totalAmount, 0)
          const totalFromInput = costItems.reduce((sum, item) => sum + item.amount, 0)
          
          expect(totalFromResult).toBeCloseTo(totalFromInput, 5)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 5: Percentage calculations sum to 100**
 * **Validates: Requirements 3.2**
 */
describe('Property 5: Percentage calculations sum to 100 (Cost Analysis)', () => {
  it('should have percentages sum to 100 for non-empty data', () => {
    const costItems = [
      { category: 'trucking', amount: 1000, joId: 'jo-1' },
      { category: 'fuel', amount: 500, joId: 'jo-1' },
      { category: 'labor', amount: 300, joId: 'jo-2' },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildCostAnalysisReport(costItems, period)
    const percentSum = report.items.reduce((sum, item) => sum + item.percentageOfTotal, 0)
    
    expect(percentSum).toBeCloseTo(100, 5)
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 6: Sorting by amount descending**
 * **Validates: Requirements 3.3**
 */
describe('Property 6: Sorting by amount descending (Cost Analysis)', () => {
  it('should sort items by cost in descending order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            totalAmount: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
            category: fc.string(),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (items) => {
          const sorted = sortByCostDescending(items)
          
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].totalAmount).toBeGreaterThanOrEqual(sorted[i].totalAmount)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 7: Zero-value filtering**
 * **Validates: Requirements 3.5**
 */
describe('Property 7: Zero-value filtering (Cost Analysis)', () => {
  it('should exclude all items with zero cost', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            totalAmount: fc.float({ min: Math.fround(-100), max: Math.fround(100000), noNaN: true }),
            category: fc.string(),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (items) => {
          const filtered = filterZeroCosts(items)
          expect(filtered.every(item => item.totalAmount > 0)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 21: Period comparison calculation**
 * **Validates: Requirements 3.4**
 */
describe('Property 21: Period comparison calculation', () => {
  it('should calculate period-over-period change correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        (current, previous) => {
          const change = calculatePeriodComparison(current, previous)
          const expected = ((current - previous) / previous) * 100
          expect(change).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return null when previous is zero', () => {
    expect(calculatePeriodComparison(100, 0)).toBeNull()
  })
})

describe('calculateAveragePerJO', () => {
  it('should calculate average correctly', () => {
    expect(calculateAveragePerJO(1000, 5)).toBe(200)
    expect(calculateAveragePerJO(0, 5)).toBe(0)
    expect(calculateAveragePerJO(1000, 0)).toBe(0)
  })
})

describe('buildCostAnalysisReport', () => {
  it('should build a complete report', () => {
    const costItems = [
      { category: 'trucking', amount: 1000, joId: 'jo-1' },
      { category: 'trucking', amount: 500, joId: 'jo-2' },
      { category: 'fuel', amount: 300, joId: 'jo-1' },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildCostAnalysisReport(costItems, period)
    
    expect(report.totalCost).toBe(1800)
    expect(report.items[0].category).toBe('Trucking & Vehicle')
    expect(report.items[0].totalAmount).toBe(1500)
    expect(report.items[0].joCount).toBe(2)
  })
})
