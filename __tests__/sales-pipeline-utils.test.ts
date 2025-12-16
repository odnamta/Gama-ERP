import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  STAGE_PROBABILITIES,
  getStageProbability,
  calculateWeightedValue,
  groupPJOsByStatus,
  calculatePipelineTrend,
  buildSalesPipelineReport,
} from '@/lib/reports/sales-pipeline-utils'
import { PJOStatusForReport } from '@/types/reports'

const pjoStatusArb = fc.constantFrom<PJOStatusForReport>('draft', 'pending_approval', 'approved', 'converted', 'rejected')

/**
 * **Feature: v0.10.1-reports-phase2, Property 19: Sales pipeline grouping**
 * For any set of PJOs, the Sales Pipeline report should correctly group by status
 * with accurate counts and total values per status.
 * **Validates: Requirements 9.1, 9.2**
 */
describe('Property 19: Sales pipeline grouping', () => {
  it('should correctly group PJOs by status', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            status: pjoStatusArb,
            value: fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (pjos) => {
          const result = groupPJOsByStatus(pjos)
          
          // Total value should match
          const totalFromResult = Array.from(result.values()).reduce((sum, v) => sum + v.totalValue, 0)
          const totalFromInput = pjos.reduce((sum, pjo) => sum + pjo.value, 0)
          expect(totalFromResult).toBeCloseTo(totalFromInput, 5)
          
          // Total count should match
          const countFromResult = Array.from(result.values()).reduce((sum, v) => sum + v.count, 0)
          expect(countFromResult).toBe(pjos.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have percentages sum to 100 for non-empty data', () => {
    const pjos = [
      { status: 'draft' as PJOStatusForReport, value: 1000 },
      { status: 'pending_approval' as PJOStatusForReport, value: 2000 },
      { status: 'approved' as PJOStatusForReport, value: 3000 },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildSalesPipelineReport(pjos, period)
    const percentSum = report.items.reduce((sum, item) => sum + item.percentageOfPipeline, 0)
    
    expect(percentSum).toBeCloseTo(100, 5)
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 20: Weighted pipeline value calculation**
 * For any pipeline item, weighted value should equal (total value * stage probability),
 * using Draft=10%, Pending=30%, Approved=70%, Converted=100%.
 * **Validates: Requirements 9.3, 9.4**
 */
describe('Property 20: Weighted pipeline value calculation', () => {
  it('should calculate weighted value correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }),
        pjoStatusArb,
        (value, status) => {
          const weighted = calculateWeightedValue(value, status)
          const expected = value * STAGE_PROBABILITIES[status]
          expect(weighted).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use correct probabilities', () => {
    expect(getStageProbability('draft')).toBe(0.10)
    expect(getStageProbability('pending_approval')).toBe(0.30)
    expect(getStageProbability('approved')).toBe(0.70)
    expect(getStageProbability('converted')).toBe(1.00)
    expect(getStageProbability('rejected')).toBe(0)
  })

  it('should calculate total weighted pipeline value correctly', () => {
    const pjos = [
      { status: 'draft' as PJOStatusForReport, value: 10000 },
      { status: 'approved' as PJOStatusForReport, value: 10000 },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildSalesPipelineReport(pjos, period)
    // Draft: 10000 * 0.10 = 1000, Approved: 10000 * 0.70 = 7000
    expect(report.weightedPipelineValue).toBeCloseTo(8000, 5)
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 21: Period comparison calculation**
 * **Validates: Requirements 9.5**
 */
describe('Property 21: Period comparison calculation (Pipeline)', () => {
  it('should calculate trend correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
        (current, previous) => {
          const trend = calculatePipelineTrend(current, previous)
          const expected = ((current - previous) / previous) * 100
          expect(trend).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return null when previous is zero', () => {
    expect(calculatePipelineTrend(1000, 0)).toBeNull()
  })
})

describe('buildSalesPipelineReport', () => {
  it('should build a complete report', () => {
    const pjos = [
      { status: 'draft' as PJOStatusForReport, value: 5000 },
      { status: 'draft' as PJOStatusForReport, value: 3000 },
      { status: 'approved' as PJOStatusForReport, value: 10000 },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildSalesPipelineReport(pjos, period, 15000)
    
    expect(report.totalPipelineValue).toBe(18000)
    expect(report.changePercentage).toBeCloseTo(20, 5) // (18000-15000)/15000 * 100
  })
})
