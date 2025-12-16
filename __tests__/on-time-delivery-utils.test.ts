import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateDelayDays,
  classifyDelivery,
  calculateOnTimeMetrics,
  OnTimeDeliveryItem,
} from '@/lib/reports/on-time-delivery-utils'

/**
 * **Feature: v0.10.1-reports-phase2, Property 10: On-time delivery classification**
 * For any JO with scheduled and completed dates, it should be classified as on-time if completed <= scheduled.
 * **Validates: Requirements 5.2, 5.3, 5.4**
 */
describe('Property 10: On-time delivery classification', () => {
  it('should classify on-time when completed <= scheduled', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // days from base date
        fc.integer({ min: 0, max: 30 }), // days early
        (baseDays, daysEarly) => {
          const baseDate = new Date('2022-01-01')
          const scheduledDate = new Date(baseDate.getTime() + baseDays * 24 * 60 * 60 * 1000)
          const completedDate = new Date(scheduledDate.getTime() - daysEarly * 24 * 60 * 60 * 1000)
          
          const result = classifyDelivery(scheduledDate, completedDate)
          expect(result.isOnTime).toBe(true)
          expect(result.delayDays).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should classify late when completed > scheduled', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // days from base date
        fc.integer({ min: 1, max: 30 }), // days late
        (baseDays, daysLate) => {
          const baseDate = new Date('2022-01-01')
          const scheduledDate = new Date(baseDate.getTime() + baseDays * 24 * 60 * 60 * 1000)
          const completedDate = new Date(scheduledDate.getTime() + daysLate * 24 * 60 * 60 * 1000)
          
          const result = classifyDelivery(scheduledDate, completedDate)
          expect(result.isOnTime).toBe(false)
          expect(result.delayDays).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: v0.10.1-reports-phase2, Property 11: On-time percentage calculation**
 * For any set of classified deliveries, on-time percentage should equal (on-time count / total count * 100).
 * **Validates: Requirements 5.2**
 */
describe('Property 11: On-time percentage calculation', () => {
  it('should calculate on-time percentage correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (onTimeCount, lateCount) => {
          const items: OnTimeDeliveryItem[] = [
            ...Array(onTimeCount).fill(null).map((_, i) => ({
              joId: `on-${i}`,
              joNumber: `JO-${i}`,
              customerName: 'Customer',
              scheduledDate: new Date(),
              completedDate: new Date(),
              delayDays: 0,
              isOnTime: true,
            })),
            ...Array(lateCount).fill(null).map((_, i) => ({
              joId: `late-${i}`,
              joNumber: `JO-late-${i}`,
              customerName: 'Customer',
              scheduledDate: new Date(),
              completedDate: new Date(),
              delayDays: 5,
              isOnTime: false,
            })),
          ]
          
          const metrics = calculateOnTimeMetrics(items)
          const total = onTimeCount + lateCount
          const expectedPercentage = total === 0 ? 0 : (onTimeCount / total) * 100
          
          expect(metrics.onTimePercentage).toBeCloseTo(expectedPercentage, 5)
          expect(metrics.onTimeCount).toBe(onTimeCount)
          expect(metrics.lateCount).toBe(lateCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should calculate average delay only from late items', () => {
    const items: OnTimeDeliveryItem[] = [
      { joId: '1', joNumber: 'JO-1', customerName: 'A', scheduledDate: new Date(), completedDate: new Date(), delayDays: 0, isOnTime: true },
      { joId: '2', joNumber: 'JO-2', customerName: 'B', scheduledDate: new Date(), completedDate: new Date(), delayDays: 5, isOnTime: false },
      { joId: '3', joNumber: 'JO-3', customerName: 'C', scheduledDate: new Date(), completedDate: new Date(), delayDays: 10, isOnTime: false },
    ]
    
    const metrics = calculateOnTimeMetrics(items)
    expect(metrics.averageDelayDays).toBe(7.5) // (5 + 10) / 2
  })
})

describe('calculateDelayDays', () => {
  it('should calculate positive delay for late delivery', () => {
    const scheduled = new Date('2024-01-01')
    const completed = new Date('2024-01-05')
    expect(calculateDelayDays(scheduled, completed)).toBe(4)
  })

  it('should calculate negative/zero delay for on-time delivery', () => {
    const scheduled = new Date('2024-01-05')
    const completed = new Date('2024-01-01')
    expect(calculateDelayDays(scheduled, completed)).toBeLessThanOrEqual(0)
  })
})
