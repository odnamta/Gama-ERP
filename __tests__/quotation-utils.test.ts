import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  countByStatus,
  calculateConversionRate,
  buildQuotationConversionReportData,
} from '@/lib/reports/quotation-utils'

// Helper to generate date strings
const dateStringArb = fc.integer({ min: 2024, max: 2025 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day =>
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    )
  )
)

// Arbitrary for PJO data
const pjoDataArb = fc.record({
  id: fc.uuid(),
  status: fc.constantFrom('draft', 'pending_approval', 'approved', 'rejected'),
  converted_to_jo: fc.boolean(),
  created_at: dateStringArb,
  approved_at: fc.option(dateStringArb, { nil: null }),
  converted_to_jo_at: fc.option(dateStringArb, { nil: null }),
})

describe('Quotation Conversion Utils', () => {
  /**
   * **Feature: v0.9.6-reports-module, Property 9: Quotation status counts**
   * *For any* set of PJOs within a date range, the status counts should accurately
   * reflect the number of PJOs in each status, and percentages should sum to 100%.
   * **Validates: Requirements 5.1**
   */
  describe('Property 9: Quotation status counts', () => {
    it('should count all PJOs correctly', () => {
      fc.assert(
        fc.property(
          fc.array(pjoDataArb, { minLength: 1, maxLength: 50 }),
          (pjos) => {
            const counts = countByStatus(pjos)
            
            // Total count should match input
            const totalCount = counts.reduce((sum, c) => sum + c.count, 0)
            expect(totalCount).toBe(pjos.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have percentages that sum to approximately 100%', () => {
      fc.assert(
        fc.property(
          fc.array(pjoDataArb, { minLength: 1, maxLength: 50 }),
          (pjos) => {
            const counts = countByStatus(pjos)
            
            const totalPercentage = counts.reduce((sum, c) => sum + c.percentage, 0)
            expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly identify converted PJOs', () => {
      const pjos = [
        { id: '1', status: 'approved', converted_to_jo: true, created_at: '2025-01-01', approved_at: null, converted_to_jo_at: null },
        { id: '2', status: 'approved', converted_to_jo: false, created_at: '2025-01-01', approved_at: null, converted_to_jo_at: null },
        { id: '3', status: 'draft', converted_to_jo: false, created_at: '2025-01-01', approved_at: null, converted_to_jo_at: null },
      ]
      
      const counts = countByStatus(pjos)
      
      const convertedCount = counts.find(c => c.status === 'converted')?.count || 0
      const approvedCount = counts.find(c => c.status === 'approved')?.count || 0
      const draftCount = counts.find(c => c.status === 'draft')?.count || 0
      
      expect(convertedCount).toBe(1)
      expect(approvedCount).toBe(1)
      expect(draftCount).toBe(1)
    })

    it('should return all status types even with empty data', () => {
      const counts = countByStatus([])
      
      expect(counts.length).toBe(5) // draft, pending_approval, approved, rejected, converted
      expect(counts.every(c => c.count === 0)).toBe(true)
    })
  })

  /**
   * **Feature: v0.9.6-reports-module, Property 10: Conversion rate calculation**
   * *For any* starting count and converted count, the conversion rate should equal
   * (converted / starting * 100), with rate returning 0 when starting count is zero.
   * **Validates: Requirements 5.2, 5.3**
   */
  describe('Property 10: Conversion rate calculation', () => {
    it('should calculate conversion rate correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          (fromCount, toCount) => {
            const rate = calculateConversionRate(fromCount, toCount)
            const expectedRate = (toCount / fromCount) * 100
            
            expect(Math.abs(rate - expectedRate)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0 when starting count is zero', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (toCount) => {
            const rate = calculateConversionRate(0, toCount)
            expect(rate).toBe(0)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should return 100% when all items convert', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (count) => {
            const rate = calculateConversionRate(count, count)
            expect(rate).toBe(100)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should return 0% when no items convert', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (count) => {
            const rate = calculateConversionRate(count, 0)
            expect(rate).toBe(0)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle rates over 100% (edge case)', () => {
      // This can happen if toCount > fromCount (data inconsistency)
      const rate = calculateConversionRate(10, 15)
      expect(rate).toBe(150)
    })
  })

  describe('buildQuotationConversionReportData', () => {
    it('should build complete report data', () => {
      const pjos = [
        { id: '1', status: 'draft', converted_to_jo: false, created_at: '2025-01-01', approved_at: null, converted_to_jo_at: null },
        { id: '2', status: 'pending_approval', converted_to_jo: false, created_at: '2025-01-02', approved_at: null, converted_to_jo_at: null },
        { id: '3', status: 'approved', converted_to_jo: false, created_at: '2025-01-03', approved_at: '2025-01-05', converted_to_jo_at: null },
        { id: '4', status: 'approved', converted_to_jo: true, created_at: '2025-01-04', approved_at: '2025-01-06', converted_to_jo_at: '2025-01-10' },
      ]
      
      const period = { startDate: new Date('2025-01-01'), endDate: new Date('2025-01-31') }
      const result = buildQuotationConversionReportData(pjos, period)
      
      expect(result.totals.totalPJOs).toBe(4)
      expect(result.statusCounts.length).toBe(5)
      expect(result.conversionRates.length).toBe(2)
    })

    it('should handle empty PJO list', () => {
      const period = { startDate: new Date('2025-01-01'), endDate: new Date('2025-01-31') }
      const result = buildQuotationConversionReportData([], period)
      
      expect(result.totals.totalPJOs).toBe(0)
      expect(result.totals.overallConversionRate).toBe(0)
    })
  })
})
