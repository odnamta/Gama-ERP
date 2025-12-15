import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  groupRevenueByCategory,
  groupCostsByCategory,
  calculatePLSummary,
  buildPLReportData,
} from '@/lib/reports/profit-loss-utils'
import { RevenueGroup, CostGroup } from '@/types/reports'

// Arbitraries for generating test data
const revenueItemArb = fc.record({
  description: fc.stringMatching(/^[a-zA-Z\s]+$/),
  subtotal: fc.float({ min: 0, max: 1000000, noNaN: true }),
  unit: fc.option(fc.string(), { nil: undefined }),
})

const costItemArb = fc.record({
  category: fc.constantFrom('trucking', 'port_charges', 'labor', 'fuel', 'tolls', 'documentation', 'other'),
  actual_amount: fc.option(fc.float({ min: 0, max: 1000000, noNaN: true }), { nil: null }),
  estimated_amount: fc.float({ min: 0, max: 1000000, noNaN: true }),
})

const revenueGroupArb = fc.record({
  category: fc.string(),
  amount: fc.float({ min: 0, max: 1000000, noNaN: true }),
})

const costGroupArb = fc.record({
  category: fc.string(),
  amount: fc.float({ min: 0, max: 1000000, noNaN: true }),
})

describe('Profit & Loss Utils', () => {
  /**
   * **Feature: v0.9.6-reports-module, Property 2: P&L data grouping**
   * *For any* set of revenue items and cost items within a date range, the P&L report
   * should group all items by their respective categories with correct sum totals per category.
   * **Validates: Requirements 2.2, 2.3**
   */
  describe('Property 2: P&L data grouping', () => {
    it('should preserve total revenue when grouping', () => {
      fc.assert(
        fc.property(
          fc.array(revenueItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const totalInput = items.reduce((sum, item) => sum + item.subtotal, 0)
            const grouped = groupRevenueByCategory(items)
            const totalGrouped = grouped.reduce((sum, g) => sum + g.amount, 0)
            
            // Allow small floating point differences
            expect(Math.abs(totalInput - totalGrouped)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve total cost when grouping', () => {
      fc.assert(
        fc.property(
          fc.array(costItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const totalInput = items.reduce((sum, item) => {
              return sum + (item.actual_amount ?? item.estimated_amount)
            }, 0)
            const grouped = groupCostsByCategory(items)
            const totalGrouped = grouped.reduce((sum, g) => sum + g.amount, 0)
            
            // Allow small floating point differences
            expect(Math.abs(totalInput - totalGrouped)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should group costs by category correctly', () => {
      fc.assert(
        fc.property(
          fc.array(costItemArb, { minLength: 1, maxLength: 20 }),
          (items) => {
            const grouped = groupCostsByCategory(items)
            
            // Each group should have a non-empty category
            for (const group of grouped) {
              expect(group.category).toBeTruthy()
              expect(group.amount).toBeGreaterThanOrEqual(0)
            }
            
            // No duplicate categories
            const categories = grouped.map(g => g.category)
            const uniqueCategories = new Set(categories)
            expect(categories.length).toBe(uniqueCategories.size)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty array for empty input', () => {
      expect(groupRevenueByCategory([])).toEqual([])
      expect(groupCostsByCategory([])).toEqual([])
    })
  })

  /**
   * **Feature: v0.9.6-reports-module, Property 3: P&L calculations**
   * *For any* total revenue and total cost values, the gross profit should equal
   * (revenue - cost) and gross margin should equal ((revenue - cost) / revenue * 100),
   * with margin returning 0 when revenue is zero.
   * **Validates: Requirements 2.4, 2.5, 2.6**
   */
  describe('Property 3: P&L calculations', () => {
    it('should calculate gross profit correctly', () => {
      fc.assert(
        fc.property(
          fc.array(revenueGroupArb, { minLength: 0, maxLength: 10 }),
          fc.array(costGroupArb, { minLength: 0, maxLength: 10 }),
          (revenue, costs) => {
            const result = calculatePLSummary(revenue, costs)
            
            const expectedRevenue = revenue.reduce((sum, r) => sum + r.amount, 0)
            const expectedCost = costs.reduce((sum, c) => sum + c.amount, 0)
            const expectedProfit = expectedRevenue - expectedCost
            
            expect(Math.abs(result.totalRevenue - expectedRevenue)).toBeLessThan(0.01)
            expect(Math.abs(result.totalCost - expectedCost)).toBeLessThan(0.01)
            expect(Math.abs(result.grossProfit - expectedProfit)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate gross margin correctly', () => {
      fc.assert(
        fc.property(
          fc.array(revenueGroupArb.filter(r => r.amount > 0), { minLength: 1, maxLength: 10 }),
          fc.array(costGroupArb, { minLength: 0, maxLength: 10 }),
          (revenue, costs) => {
            const result = calculatePLSummary(revenue, costs)
            
            const expectedRevenue = revenue.reduce((sum, r) => sum + r.amount, 0)
            const expectedCost = costs.reduce((sum, c) => sum + c.amount, 0)
            const expectedMargin = ((expectedRevenue - expectedCost) / expectedRevenue) * 100
            
            expect(Math.abs(result.grossMargin - expectedMargin)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0% margin when revenue is zero', () => {
      fc.assert(
        fc.property(
          fc.array(costGroupArb, { minLength: 0, maxLength: 10 }),
          (costs) => {
            const result = calculatePLSummary([], costs)
            
            expect(result.totalRevenue).toBe(0)
            expect(result.grossMargin).toBe(0)
            expect(Number.isNaN(result.grossMargin)).toBe(false)
            expect(Number.isFinite(result.grossMargin)).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle all-zero inputs', () => {
      const result = calculatePLSummary([], [])
      
      expect(result.totalRevenue).toBe(0)
      expect(result.totalCost).toBe(0)
      expect(result.grossProfit).toBe(0)
      expect(result.grossMargin).toBe(0)
    })
  })

  describe('buildPLReportData', () => {
    it('should build complete report data', () => {
      const revenueItems = [
        { description: 'Trucking service', subtotal: 100000 },
        { description: 'Port handling', subtotal: 50000 },
      ]
      const costItems = [
        { category: 'trucking', actual_amount: 40000, estimated_amount: 45000 },
        { category: 'fuel', actual_amount: 10000, estimated_amount: 12000 },
      ]
      const period = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      }

      const result = buildPLReportData(revenueItems, costItems, period)

      expect(result.period).toEqual(period)
      expect(result.revenue.length).toBeGreaterThan(0)
      expect(result.costs.length).toBeGreaterThan(0)
      expect(result.totalRevenue).toBe(150000)
      expect(result.totalCost).toBe(50000)
      expect(result.grossProfit).toBe(100000)
      expect(Math.abs(result.grossMargin - 66.67)).toBeLessThan(0.1)
    })
  })
})
