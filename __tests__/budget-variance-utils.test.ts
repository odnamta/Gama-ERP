import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateVariance,
  hasVarianceWarning,
  transformPJOsToVarianceItems,
  buildBudgetVarianceReportData,
  formatVariancePercentage,
} from '@/lib/reports/budget-variance-utils'

// Arbitrary for PJO with costs
const pjoWithCostsArb = fc.record({
  id: fc.uuid(),
  pjo_number: fc.stringMatching(/^[0-9]{4}\/CARGO\/[A-Z]{2,3}\/[0-9]{4}$/),
  customers: fc.option(fc.record({ name: fc.string() }), { nil: null }),
  total_cost_estimated: fc.option(fc.float({ min: 0, max: 1000000, noNaN: true }), { nil: null }),
  total_cost_actual: fc.option(fc.float({ min: 0, max: 1000000, noNaN: true }), { nil: null }),
})

describe('Budget Variance Utils', () => {
  /**
   * **Feature: v0.9.6-reports-module, Property 4: Budget variance calculation**
   * *For any* PJO with estimated and actual cost values, the variance amount should
   * equal (actual - estimated) and variance percentage should equal
   * ((actual - estimated) / estimated * 100), with percentage returning null when estimated is zero.
   * **Validates: Requirements 3.3, 3.5**
   */
  describe('Property 4: Budget variance calculation', () => {
    it('should calculate variance amount correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000000, noNaN: true }),
          fc.float({ min: 0, max: 1000000, noNaN: true }),
          (estimated, actual) => {
            const result = calculateVariance(estimated, actual)
            const expectedAmount = actual - estimated
            
            expect(Math.abs(result.varianceAmount - expectedAmount)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate variance percentage correctly when estimated > 0', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: 1000000, noNaN: true }), // estimated > 0
          fc.float({ min: 0, max: 1000000, noNaN: true }),
          (estimated, actual) => {
            const result = calculateVariance(estimated, actual)
            const expectedPercentage = ((actual - estimated) / estimated) * 100
            
            expect(result.variancePercentage).not.toBeNull()
            expect(Math.abs(result.variancePercentage! - expectedPercentage)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return null percentage when estimated is zero', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000000, noNaN: true }),
          (actual) => {
            const result = calculateVariance(0, actual)
            
            expect(result.variancePercentage).toBeNull()
            expect(result.varianceAmount).toBe(actual)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * **Feature: v0.9.6-reports-module, Property 5: Budget variance warning threshold**
   * *For any* budget variance item, the hasWarning flag should be true if and only if
   * the variance percentage exceeds 10%.
   * **Validates: Requirements 3.4**
   */
  describe('Property 5: Budget variance warning threshold', () => {
    it('should return true when variance > 10%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(10.01), max: 1000, noNaN: true }),
          (percentage) => {
            expect(hasVarianceWarning(percentage)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return false when variance <= 10%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000, max: 10, noNaN: true }),
          (percentage) => {
            expect(hasVarianceWarning(percentage)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return false when percentage is null', () => {
      expect(hasVarianceWarning(null)).toBe(false)
    })

    it('should correctly set hasWarning in transformed items', () => {
      fc.assert(
        fc.property(
          fc.array(pjoWithCostsArb, { minLength: 1, maxLength: 20 }),
          (pjos) => {
            const items = transformPJOsToVarianceItems(pjos)
            
            for (const item of items) {
              const expectedWarning = item.variancePercentage !== null && item.variancePercentage > 10
              expect(item.hasWarning).toBe(expectedWarning)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('transformPJOsToVarianceItems', () => {
    it('should transform all PJOs to variance items', () => {
      fc.assert(
        fc.property(
          fc.array(pjoWithCostsArb, { minLength: 0, maxLength: 20 }),
          (pjos) => {
            const items = transformPJOsToVarianceItems(pjos)
            
            expect(items.length).toBe(pjos.length)
            
            for (let i = 0; i < pjos.length; i++) {
              expect(items[i].pjoId).toBe(pjos[i].id)
              expect(items[i].pjoNumber).toBe(pjos[i].pjo_number)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle null customer names', () => {
      const pjos = [
        { id: '1', pjo_number: '0001/CARGO/XII/2025', customers: null, total_cost_estimated: 100, total_cost_actual: 110 },
      ]
      
      const items = transformPJOsToVarianceItems(pjos)
      expect(items[0].customerName).toBe('Unknown')
    })
  })

  describe('buildBudgetVarianceReportData', () => {
    it('should sort items by variance percentage descending', () => {
      const pjos = [
        { id: '1', pjo_number: '0001/CARGO/XII/2025', customers: { name: 'A' }, total_cost_estimated: 100, total_cost_actual: 110 }, // 10%
        { id: '2', pjo_number: '0002/CARGO/XII/2025', customers: { name: 'B' }, total_cost_estimated: 100, total_cost_actual: 150 }, // 50%
        { id: '3', pjo_number: '0003/CARGO/XII/2025', customers: { name: 'C' }, total_cost_estimated: 100, total_cost_actual: 90 },  // -10%
      ]
      
      const period = { startDate: new Date(), endDate: new Date() }
      const result = buildBudgetVarianceReportData(pjos, period)
      
      expect(result.items[0].pjoId).toBe('2') // 50% first
      expect(result.items[1].pjoId).toBe('1') // 10% second
      expect(result.items[2].pjoId).toBe('3') // -10% last
    })

    it('should calculate summary correctly', () => {
      fc.assert(
        fc.property(
          fc.array(pjoWithCostsArb, { minLength: 1, maxLength: 20 }),
          (pjos) => {
            const period = { startDate: new Date(), endDate: new Date() }
            const result = buildBudgetVarianceReportData(pjos, period)
            
            const expectedEstimated = pjos.reduce((sum, p) => sum + (p.total_cost_estimated ?? 0), 0)
            const expectedActual = pjos.reduce((sum, p) => sum + (p.total_cost_actual ?? 0), 0)
            
            expect(Math.abs(result.summary.totalEstimated - expectedEstimated)).toBeLessThan(0.01)
            expect(Math.abs(result.summary.totalActual - expectedActual)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('formatVariancePercentage', () => {
    it('should return N/A for null', () => {
      expect(formatVariancePercentage(null)).toBe('N/A')
    })

    it('should add + sign for positive values', () => {
      expect(formatVariancePercentage(15.5)).toBe('+15.5%')
    })

    it('should not add sign for negative values', () => {
      expect(formatVariancePercentage(-10.5)).toBe('-10.5%')
    })
  })
})
