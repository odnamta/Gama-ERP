import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  aggregateVendorData,
  calculateVendorOnTimeRate,
  sortVendors,
  buildVendorPerformanceReport,
  VendorPerformanceItem,
} from '@/lib/reports/vendor-performance-utils'

/**
 * **Feature: v0.10.1-reports-phase2, Property 12: Vendor performance aggregation**
 * For any set of cost items with vendor associations, the Vendor Performance report should correctly
 * aggregate spend, JO count, and calculate averages per vendor.
 * **Validates: Requirements 6.1, 6.2**
 */
describe('Property 12: Vendor performance aggregation', () => {
  it('should correctly aggregate vendor spend', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            vendorName: fc.constantFrom('Vendor A', 'Vendor B', 'Vendor C'),
            amount: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
            joId: fc.stringMatching(/^jo-[0-9]+$/),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (costItems) => {
          const result = aggregateVendorData(costItems)
          
          const totalFromResult = Array.from(result.values()).reduce((sum, v) => sum + v.totalSpend, 0)
          const totalFromInput = costItems.reduce((sum, item) => sum + item.amount, 0)
          
          expect(totalFromResult).toBeCloseTo(totalFromInput, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should count unique JOs per vendor', () => {
    const costItems = [
      { vendorName: 'Vendor A', amount: 100, joId: 'jo-1' },
      { vendorName: 'Vendor A', amount: 200, joId: 'jo-1' },
      { vendorName: 'Vendor A', amount: 150, joId: 'jo-2' },
    ]
    
    const result = aggregateVendorData(costItems)
    const vendorA = result.get('Vendor A')
    
    expect(vendorA?.joIds.size).toBe(2) // jo-1 and jo-2
    expect(vendorA?.totalSpend).toBe(450)
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 13: Vendor on-time rate calculation**
 * For any vendor with delivery data, on-time rate should equal (on-time / total * 100),
 * returning null when total deliveries is zero.
 * **Validates: Requirements 6.3, 6.4**
 */
describe('Property 13: Vendor on-time rate calculation', () => {
  it('should calculate on-time rate correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (onTime, total) => {
          const adjustedOnTime = Math.min(onTime, total)
          const rate = calculateVendorOnTimeRate(adjustedOnTime, total)
          const expected = (adjustedOnTime / total) * 100
          
          expect(rate).toBeCloseTo(expected, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return null when total deliveries is zero', () => {
    expect(calculateVendorOnTimeRate(0, 0)).toBeNull()
    expect(calculateVendorOnTimeRate(5, 0)).toBeNull()
  })
})

describe('sortVendors', () => {
  it('should sort by totalSpend descending by default', () => {
    const items: VendorPerformanceItem[] = [
      { vendorName: 'A', totalSpend: 100, joCount: 1, averageCostPerJO: 100, onTimeDeliveries: 1, totalDeliveries: 1, onTimeRate: 100 },
      { vendorName: 'B', totalSpend: 300, joCount: 1, averageCostPerJO: 300, onTimeDeliveries: 1, totalDeliveries: 1, onTimeRate: 100 },
      { vendorName: 'C', totalSpend: 200, joCount: 1, averageCostPerJO: 200, onTimeDeliveries: 1, totalDeliveries: 1, onTimeRate: 100 },
    ]
    
    const sorted = sortVendors(items, 'totalSpend')
    expect(sorted[0].vendorName).toBe('B')
    expect(sorted[1].vendorName).toBe('C')
    expect(sorted[2].vendorName).toBe('A')
  })

  it('should handle null onTimeRate when sorting', () => {
    const items: VendorPerformanceItem[] = [
      { vendorName: 'A', totalSpend: 100, joCount: 1, averageCostPerJO: 100, onTimeDeliveries: 0, totalDeliveries: 0, onTimeRate: null },
      { vendorName: 'B', totalSpend: 100, joCount: 1, averageCostPerJO: 100, onTimeDeliveries: 1, totalDeliveries: 1, onTimeRate: 100 },
    ]
    
    const sorted = sortVendors(items, 'onTimeRate')
    expect(sorted[0].vendorName).toBe('B')
    expect(sorted[1].vendorName).toBe('A')
  })
})

describe('buildVendorPerformanceReport', () => {
  it('should build a complete report', () => {
    const costItems = [
      { vendorName: 'Vendor A', amount: 1000, joId: 'jo-1' },
      { vendorName: 'Vendor A', amount: 500, joId: 'jo-2' },
      { vendorName: 'Vendor B', amount: 2000, joId: 'jo-1' },
    ]
    const period = { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }
    
    const report = buildVendorPerformanceReport(costItems, period)
    
    expect(report.totalSpend).toBe(3500)
    expect(report.vendorCount).toBe(2)
    expect(report.items[0].vendorName).toBe('Vendor B') // Sorted by spend
  })
})
