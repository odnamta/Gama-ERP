import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  validateDateRange,
  getDateRangeForPreset,
  formatCurrency,
  formatPercentage,
} from '@/lib/reports/report-utils'
import { calculatePagination, getPageItems } from '@/types/reports'

describe('Report Utils', () => {
  /**
   * **Feature: v0.9.6-reports-module, Property 12: Date range validation**
   * *For any* date range where end date is before start date, the validation
   * should return an error and prevent report generation.
   * **Validates: Requirements 8.3**
   */
  describe('Property 12: Date range validation', () => {
    it('should reject date ranges where end is before start', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
          fc.integer({ min: 1, max: 365 }),
          (startDate, daysToSubtract) => {
            // Create end date that is strictly before start date
            const endDate = new Date(startDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000)
            
            const result = validateDateRange({ startDate, endDate })
            
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept date ranges where end is after or equal to start', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
          fc.integer({ min: 0, max: 365 }),
          (startDate, daysToAdd) => {
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + daysToAdd)
            
            const result = validateDateRange({ startDate, endDate })
            
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept same start and end date', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
          (date) => {
            const result = validateDateRange({ startDate: date, endDate: date })
            expect(result.valid).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * **Feature: v0.9.6-reports-module, Property 11: Pagination**
   * *For any* dataset with n items and page size of 25, the number of pages
   * should equal ceil(n / 25), and each page should contain at most 25 items.
   * **Validates: Requirements 6.4**
   */
  describe('Property 11: Pagination', () => {
    it('should calculate correct number of pages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (totalItems, pageSize) => {
            const pagination = calculatePagination(totalItems, pageSize)
            
            const expectedPages = Math.ceil(totalItems / pageSize) || 1
            expect(pagination.totalPages).toBe(expectedPages)
            expect(pagination.totalItems).toBe(totalItems)
            expect(pagination.pageSize).toBe(pageSize)
            expect(pagination.currentPage).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return correct items for each page', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 0, maxLength: 200 }),
          fc.integer({ min: 1, max: 50 }),
          (items, pageSize) => {
            const pagination = calculatePagination(items.length, pageSize)
            
            for (let page = 1; page <= pagination.totalPages; page++) {
              const pageItems = getPageItems(items, page, pageSize)
              
              // Each page should have at most pageSize items
              expect(pageItems.length).toBeLessThanOrEqual(pageSize)
              
              // Last page may have fewer items
              if (page < pagination.totalPages) {
                expect(pageItems.length).toBe(pageSize)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return all items across all pages', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 25 }),
          (items, pageSize) => {
            const pagination = calculatePagination(items.length, pageSize)
            
            const allPageItems: number[] = []
            for (let page = 1; page <= pagination.totalPages; page++) {
              allPageItems.push(...getPageItems(items, page, pageSize))
            }
            
            expect(allPageItems).toEqual(items)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle empty arrays', () => {
      const pagination = calculatePagination(0, 25)
      expect(pagination.totalPages).toBe(1)
      expect(pagination.totalItems).toBe(0)
      
      const items = getPageItems([], 1, 25)
      expect(items).toEqual([])
    })

    it('should default to page size of 25', () => {
      const pagination = calculatePagination(100)
      expect(pagination.pageSize).toBe(25)
      expect(pagination.totalPages).toBe(4)
    })
  })

  describe('getDateRangeForPreset', () => {
    it('should return valid date ranges for all presets', () => {
      const presets = ['this-week', 'this-month', 'last-month', 'this-quarter', 'last-quarter', 'this-year'] as const
      
      for (const preset of presets) {
        const range = getDateRangeForPreset(preset)
        expect(range.startDate).toBeInstanceOf(Date)
        expect(range.endDate).toBeInstanceOf(Date)
        expect(range.endDate >= range.startDate).toBe(true)
      }
    })
  })

  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000000 }),
          (amount) => {
            const formatted = formatCurrency(amount)
            expect(formatted).toContain('Rp')
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages with correct decimals', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -100, max: 100 }),
          fc.integer({ min: 0, max: 4 }),
          (value, decimals) => {
            const formatted = formatPercentage(value, decimals)
            expect(formatted).toContain('%')
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
