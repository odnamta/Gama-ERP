import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateNetProfit,
  calculateNetMargin,
  filterJobsByDateRange,
  filterJobsByMarginRange,
  calculateProfitabilitySummary,
  sortJobsByMargin,
  validateProfitabilityFilters,
  JobProfitabilityData,
} from '@/lib/reports/profitability-utils'

// Safe date arbitrary using integer offset from base date
const baseDateArb = fc.integer({ min: 0, max: 730 }).map(days => {
  const d = new Date('2024-01-01')
  d.setDate(d.getDate() + days)
  return d
})

// Arbitrary for job profitability data
const jobProfitabilityArb = fc.record({
  joId: fc.uuid(),
  joNumber: fc.stringMatching(/^JO-[0-9]{4}\/CARGO\/[A-Z]{2,3}\/[0-9]{4}$/),
  customerName: fc.string({ minLength: 1, maxLength: 50 }),
  projectName: fc.string({ minLength: 1, maxLength: 50 }),
  revenue: fc.float({ min: 0, max: 10000000, noNaN: true }),
  directCost: fc.float({ min: 0, max: 10000000, noNaN: true }),
  overhead: fc.float({ min: 0, max: 1000000, noNaN: true }),
  netProfit: fc.float({ min: -10000000, max: 10000000, noNaN: true }),
  netMargin: fc.float({ min: -1000, max: 1000, noNaN: true }),
  createdAt: baseDateArb,
}) as fc.Arbitrary<JobProfitabilityData>

// Arbitrary for consistent job data (where netProfit and netMargin are calculated correctly)
const consistentJobArb = fc
  .record({
    joId: fc.uuid(),
    joNumber: fc.string(),
    customerName: fc.string({ minLength: 1 }),
    projectName: fc.string({ minLength: 1 }),
    revenue: fc.float({ min: 0, max: 1000000, noNaN: true }),
    directCost: fc.float({ min: 0, max: 500000, noNaN: true }),
    overhead: fc.float({ min: 0, max: 100000, noNaN: true }),
    createdAt: baseDateArb,
  })
  .map((job) => {
    const netProfit = job.revenue - job.directCost - job.overhead
    const netMargin = job.revenue > 0 ? (netProfit / job.revenue) * 100 : 0
    return { ...job, netProfit, netMargin }
  }) as fc.Arbitrary<JobProfitabilityData>

describe('Profitability Utils', () => {
  /**
   * **Feature: reports-module-foundation, Property 15: Net profit calculation**
   * *For any* job in the profitability report, net_profit must equal
   * revenue minus direct_cost minus overhead.
   * **Validates: Requirements 6.2**
   */
  describe('Property 15: Net profit calculation', () => {
    it('should calculate net profit as revenue - directCost - overhead', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000000, noNaN: true }),
          fc.float({ min: 0, max: 10000000, noNaN: true }),
          fc.float({ min: 0, max: 1000000, noNaN: true }),
          (revenue, directCost, overhead) => {
            const result = calculateNetProfit(revenue, directCost, overhead)
            const expected = revenue - directCost - overhead
            expect(Math.abs(result - expected)).toBeLessThan(0.001)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return positive profit when revenue exceeds costs', () => {
      const result = calculateNetProfit(100000, 60000, 10000)
      expect(result).toBe(30000)
    })

    it('should return negative profit when costs exceed revenue', () => {
      const result = calculateNetProfit(50000, 60000, 10000)
      expect(result).toBe(-20000)
    })

    it('should return zero when revenue equals total costs', () => {
      const result = calculateNetProfit(100000, 80000, 20000)
      expect(result).toBe(0)
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 16: Net margin calculation**
   * *For any* job with revenue greater than zero, net_margin must equal
   * (net_profit / revenue) * 100. For jobs with zero revenue, net_margin must be zero.
   * **Validates: Requirements 6.3**
   */
  describe('Property 16: Net margin calculation', () => {
    it('should calculate margin as (netProfit / revenue) * 100 for positive revenue', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }), // revenue > 0
          fc.float({ min: Math.fround(-1000000), max: Math.fround(1000000), noNaN: true }), // netProfit can be negative
          (revenue, netProfit) => {
            const result = calculateNetMargin(netProfit, revenue)
            const expected = (netProfit / revenue) * 100
            expect(Math.abs(result - expected)).toBeLessThan(0.001)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0 when revenue is zero', () => {
      fc.assert(
        fc.property(fc.float({ min: -10000000, max: 10000000, noNaN: true }), (netProfit) => {
          const result = calculateNetMargin(netProfit, 0)
          expect(result).toBe(0)
        }),
        { numRuns: 100 }
      )
    })

    it('should return 30% margin for 30000 profit on 100000 revenue', () => {
      const result = calculateNetMargin(30000, 100000)
      expect(result).toBe(30)
    })

    it('should return negative margin for losses', () => {
      const result = calculateNetMargin(-20000, 100000)
      expect(result).toBe(-20)
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 17: Date range filter correctness**
   * *For any* date range filter applied to the profitability report, all returned
   * jobs must have their created_at date within the specified range (inclusive).
   * **Validates: Requirements 6.4**
   */
  describe('Property 17: Date range filter correctness', () => {
    it('should only include jobs within date range', () => {
      fc.assert(
        fc.property(
          fc.array(consistentJobArb, { minLength: 0, maxLength: 30 }),
          baseDateArb,
          baseDateArb,
          (jobs, date1, date2) => {
            // Ensure dateFrom <= dateTo
            const [from, to] = date1 <= date2 ? [date1, date2] : [date2, date1]

            const filtered = filterJobsByDateRange(jobs, from, to)

            for (const job of filtered) {
              expect(job.createdAt >= from).toBe(true)
              expect(job.createdAt <= to).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should include all jobs when no date range specified', () => {
      fc.assert(
        fc.property(fc.array(consistentJobArb, { minLength: 0, maxLength: 20 }), (jobs) => {
          const filtered = filterJobsByDateRange(jobs, undefined, undefined)
          expect(filtered.length).toBe(jobs.length)
        }),
        { numRuns: 100 }
      )
    })

    it('should filter correctly with only dateFrom', () => {
      const jobs: JobProfitabilityData[] = [
        {
          joId: '1',
          joNumber: 'JO-001',
          customerName: 'A',
          projectName: 'P1',
          revenue: 100,
          directCost: 50,
          overhead: 10,
          netProfit: 40,
          netMargin: 40,
          createdAt: new Date('2024-06-01'),
        },
        {
          joId: '2',
          joNumber: 'JO-002',
          customerName: 'B',
          projectName: 'P2',
          revenue: 200,
          directCost: 100,
          overhead: 20,
          netProfit: 80,
          netMargin: 40,
          createdAt: new Date('2025-01-15'),
        },
      ]

      const filtered = filterJobsByDateRange(jobs, new Date('2025-01-01'), undefined)
      expect(filtered.length).toBe(1)
      expect(filtered[0].joId).toBe('2')
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 18: Margin range filter correctness**
   * *For any* margin range filter (minMargin, maxMargin) applied to the profitability
   * report, all returned jobs must have net_margin >= minMargin and net_margin <= maxMargin.
   * **Validates: Requirements 6.6**
   */
  describe('Property 18: Margin range filter correctness', () => {
    it('should only include jobs within margin range', () => {
      fc.assert(
        fc.property(
          fc.array(consistentJobArb, { minLength: 0, maxLength: 30 }),
          fc.float({ min: -100, max: 50, noNaN: true }),
          fc.float({ min: -50, max: 100, noNaN: true }),
          (jobs, min, max) => {
            // Ensure min <= max
            const [minMargin, maxMargin] = min <= max ? [min, max] : [max, min]

            const filtered = filterJobsByMarginRange(jobs, minMargin, maxMargin)

            for (const job of filtered) {
              expect(job.netMargin >= minMargin).toBe(true)
              expect(job.netMargin <= maxMargin).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should include all jobs when no margin range specified', () => {
      fc.assert(
        fc.property(fc.array(consistentJobArb, { minLength: 0, maxLength: 20 }), (jobs) => {
          const filtered = filterJobsByMarginRange(jobs, undefined, undefined)
          expect(filtered.length).toBe(jobs.length)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 19: Profitability summary consistency**
   * *For any* set of jobs in the profitability report, the summary totals
   * (totalRevenue, totalCost, totalOverhead, totalNetProfit) must equal the sum
   * of the corresponding values from individual jobs.
   * **Validates: Requirements 6.7**
   */
  describe('Property 19: Profitability summary consistency', () => {
    it('should have summary totals equal sum of individual job values', () => {
      fc.assert(
        fc.property(fc.array(consistentJobArb, { minLength: 1, maxLength: 30 }), (jobs) => {
          const summary = calculateProfitabilitySummary(jobs)

          const expectedRevenue = jobs.reduce((sum, j) => sum + j.revenue, 0)
          const expectedDirectCost = jobs.reduce((sum, j) => sum + j.directCost, 0)
          const expectedOverhead = jobs.reduce((sum, j) => sum + j.overhead, 0)
          const expectedNetProfit = jobs.reduce((sum, j) => sum + j.netProfit, 0)

          expect(Math.abs(summary.totalRevenue - expectedRevenue)).toBeLessThan(0.01)
          expect(Math.abs(summary.totalDirectCost - expectedDirectCost)).toBeLessThan(0.01)
          expect(Math.abs(summary.totalOverhead - expectedOverhead)).toBeLessThan(0.01)
          expect(Math.abs(summary.totalNetProfit - expectedNetProfit)).toBeLessThan(0.01)
          expect(summary.totalJobs).toBe(jobs.length)
        }),
        { numRuns: 100 }
      )
    })

    it('should return zeros for empty job list', () => {
      const summary = calculateProfitabilitySummary([])
      expect(summary.totalJobs).toBe(0)
      expect(summary.totalRevenue).toBe(0)
      expect(summary.totalDirectCost).toBe(0)
      expect(summary.totalOverhead).toBe(0)
      expect(summary.totalNetProfit).toBe(0)
      expect(summary.averageMargin).toBe(0)
    })
  })

  /**
   * **Feature: reports-module-foundation, Property 20: Profitability default sort order**
   * *For any* list of jobs returned by the profitability report without explicit
   * sorting, the jobs must be sorted by net_margin in descending order.
   * **Validates: Requirements 6.8**
   */
  describe('Property 20: Profitability default sort order', () => {
    it('should sort jobs by net margin in descending order', () => {
      fc.assert(
        fc.property(fc.array(consistentJobArb, { minLength: 2, maxLength: 30 }), (jobs) => {
          const sorted = sortJobsByMargin(jobs)

          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].netMargin >= sorted[i + 1].netMargin).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should not mutate original array', () => {
      const jobs: JobProfitabilityData[] = [
        {
          joId: '1',
          joNumber: 'JO-001',
          customerName: 'A',
          projectName: 'P1',
          revenue: 100,
          directCost: 80,
          overhead: 10,
          netProfit: 10,
          netMargin: 10,
          createdAt: new Date(),
        },
        {
          joId: '2',
          joNumber: 'JO-002',
          customerName: 'B',
          projectName: 'P2',
          revenue: 100,
          directCost: 50,
          overhead: 10,
          netProfit: 40,
          netMargin: 40,
          createdAt: new Date(),
        },
      ]

      const originalFirst = jobs[0].joId
      sortJobsByMargin(jobs)
      expect(jobs[0].joId).toBe(originalFirst)
    })

    it('should place highest margin job first', () => {
      const jobs: JobProfitabilityData[] = [
        {
          joId: '1',
          joNumber: 'JO-001',
          customerName: 'A',
          projectName: 'P1',
          revenue: 100,
          directCost: 80,
          overhead: 10,
          netProfit: 10,
          netMargin: 10,
          createdAt: new Date(),
        },
        {
          joId: '2',
          joNumber: 'JO-002',
          customerName: 'B',
          projectName: 'P2',
          revenue: 100,
          directCost: 50,
          overhead: 10,
          netProfit: 40,
          netMargin: 40,
          createdAt: new Date(),
        },
        {
          joId: '3',
          joNumber: 'JO-003',
          customerName: 'C',
          projectName: 'P3',
          revenue: 100,
          directCost: 70,
          overhead: 10,
          netProfit: 20,
          netMargin: 20,
          createdAt: new Date(),
        },
      ]

      const sorted = sortJobsByMargin(jobs)
      expect(sorted[0].joId).toBe('2') // 40% margin
      expect(sorted[1].joId).toBe('3') // 20% margin
      expect(sorted[2].joId).toBe('1') // 10% margin
    })
  })

  describe('validateProfitabilityFilters', () => {
    it('should accept valid filters', () => {
      expect(validateProfitabilityFilters({})).toEqual({ valid: true })
      expect(
        validateProfitabilityFilters({
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-12-31'),
        })
      ).toEqual({ valid: true })
      expect(validateProfitabilityFilters({ minMargin: 0, maxMargin: 50 })).toEqual({ valid: true })
    })

    it('should reject invalid date range', () => {
      const result = validateProfitabilityFilters({
        dateFrom: new Date('2025-01-01'),
        dateTo: new Date('2024-01-01'),
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('date')
    })

    it('should reject invalid margin range', () => {
      const result = validateProfitabilityFilters({
        minMargin: 50,
        maxMargin: 10,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('margin')
    })
  })
})
