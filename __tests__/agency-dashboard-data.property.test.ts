/**
 * Property-Based Tests for Agency Dashboard Data
 * Tests universal properties across generated inputs
 * 
 * Feature: v0.9.15-agency-dashboard
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// =====================================================
// ARBITRARIES (Test Data Generators)
// =====================================================

const bookingStatusArb = fc.constantFrom('draft', 'requested', 'confirmed', 'amended', 'cancelled', 'shipped', 'completed')
const blStatusArb = fc.constantFrom('draft', 'submitted', 'issued', 'released', 'surrendered', 'amended')
const vesselStatusArb = fc.constantFrom('scheduled', 'arrived', 'berthed', 'departed', 'cancelled')
const containerStatusArb = fc.constantFrom('empty', 'stuffing', 'full', 'shipped', 'delivered')

const dateInRangeArb = (startDaysAgo: number, endDaysAgo: number) => {
  const now = Date.now()
  const start = now - startDaysAgo * 24 * 60 * 60 * 1000
  const end = now - endDaysAgo * 24 * 60 * 60 * 1000
  return fc.integer({ min: Math.min(start, end), max: Math.max(start, end) })
    .map(ts => new Date(ts).toISOString())
}

const bookingArb = fc.record({
  id: fc.uuid(),
  booking_number: fc.string({ minLength: 5, maxLength: 20 }),
  status: bookingStatusArb,
  created_at: dateInRangeArb(60, 0), // Last 60 days
  updated_at: dateInRangeArb(30, 0), // Last 30 days
  shipping_line_id: fc.option(fc.uuid(), { nil: undefined }),
  customer_id: fc.option(fc.uuid(), { nil: undefined }),
})

const blArb = fc.record({
  id: fc.uuid(),
  bl_number: fc.string({ minLength: 5, maxLength: 20 }),
  status: blStatusArb,
  vessel_name: fc.string({ minLength: 3, maxLength: 50 }),
  issued_at: fc.option(dateInRangeArb(60, 0), { nil: null }),
  created_at: dateInRangeArb(60, 0),
})

const shippingLineArb = fc.record({
  id: fc.uuid(),
  line_name: fc.string({ minLength: 3, maxLength: 50 }),
  is_active: fc.boolean(),
  is_preferred: fc.boolean(),
})

const vesselScheduleArb = fc.record({
  id: fc.uuid(),
  vessel_name: fc.string({ minLength: 3, maxLength: 50 }),
  scheduled_arrival: dateInRangeArb(14, -14), // 2 weeks before to 2 weeks after
  status: vesselStatusArb,
})

const containerArb = fc.record({
  id: fc.uuid(),
  booking_id: fc.uuid(),
  container_number: fc.string({ minLength: 11, maxLength: 11 }),
  status: containerStatusArb,
})

// =====================================================
// HELPER FUNCTIONS (Pure calculation functions)
// =====================================================

const ACTIVE_BOOKING_STATUSES = ['draft', 'requested', 'confirmed', 'amended']
const PENDING_BL_STATUSES = ['draft', 'submitted']

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

interface Booking {
  id: string
  booking_number: string
  status: string
  created_at: string
  updated_at: string
  shipping_line_id?: string
  customer_id?: string
}

interface BL {
  id: string
  bl_number: string
  status: string
  vessel_name: string
  issued_at: string | null
  created_at: string
}

interface ShippingLine {
  id: string
  line_name: string
  is_active: boolean
  is_preferred: boolean
}

interface VesselSchedule {
  id: string
  vessel_name: string
  scheduled_arrival: string
  status: string
}

interface Container {
  id: string
  booking_id: string
  container_number: string
  status: string
}

function calculateBookingMetrics(bookings: Booking[], referenceDate: Date = new Date()) {
  const startOfMonth = getStartOfMonth(referenceDate)
  
  return {
    activeBookings: bookings.filter(b => ACTIVE_BOOKING_STATUSES.includes(b.status)).length,
    bookingsThisMonth: bookings.filter(b => new Date(b.created_at) >= startOfMonth).length,
    pendingConfirmations: bookings.filter(b => b.status === 'requested').length,
    completedThisMonth: bookings.filter(
      b => b.status === 'completed' && new Date(b.updated_at) >= startOfMonth
    ).length,
  }
}

function calculateShippingLineMetrics(shippingLines: ShippingLine[], bookings: Booking[]) {
  const activeLines = shippingLines.filter(l => l.is_active)
  
  // Count bookings per line
  const lineCounts = new Map<string, number>()
  for (const booking of bookings) {
    if (booking.shipping_line_id) {
      lineCounts.set(
        booking.shipping_line_id,
        (lineCounts.get(booking.shipping_line_id) || 0) + 1
      )
    }
  }
  
  // Find most used
  let maxCount = 0
  let maxLineId = ''
  for (const [lineId, count] of lineCounts) {
    if (count > maxCount) {
      maxCount = count
      maxLineId = lineId
    }
  }
  
  const mostUsedLine = shippingLines.find(l => l.id === maxLineId)
  
  return {
    totalShippingLines: activeLines.length,
    preferredLinesCount: activeLines.filter(l => l.is_preferred).length,
    mostUsedShippingLine: mostUsedLine?.line_name || '-',
  }
}

function calculateBLMetrics(bls: BL[], referenceDate: Date = new Date()) {
  const startOfMonth = getStartOfMonth(referenceDate)
  
  return {
    blIssuedThisMonth: bls.filter(
      bl => bl.status === 'issued' && bl.issued_at && new Date(bl.issued_at) >= startOfMonth
    ).length,
    blPendingIssuance: bls.filter(bl => PENDING_BL_STATUSES.includes(bl.status)).length,
    blDraftCount: bls.filter(bl => bl.status === 'draft').length,
  }
}

function calculateVesselContainerMetrics(
  schedules: VesselSchedule[],
  containers: Container[],
  referenceDate: Date = new Date()
) {
  const startOfWeek = getStartOfWeek(referenceDate)
  const endOfWeek = getEndOfWeek(referenceDate)
  const sevenDaysFromNow = new Date(referenceDate.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return {
    upcomingArrivals: schedules.filter(s => {
      const arrival = new Date(s.scheduled_arrival)
      return arrival >= startOfWeek && arrival <= endOfWeek && s.status === 'scheduled'
    }).length,
    containersInTransit: containers.filter(c => c.status === 'shipped').length,
    expectedArrivals: schedules.filter(s => {
      const arrival = new Date(s.scheduled_arrival)
      return arrival >= referenceDate && arrival <= sevenDaysFromNow && s.status === 'scheduled'
    }).length,
  }
}

function getRecentBookings(bookings: Booking[], limit: number = 5): Booking[] {
  return [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}

function getRecentBLs(bls: BL[], limit: number = 5): BL[] {
  return [...bls]
    .filter(bl => bl.issued_at !== null)
    .sort((a, b) => new Date(b.issued_at!).getTime() - new Date(a.issued_at!).getTime())
    .slice(0, limit)
}

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Agency Dashboard Data - Property Tests', () => {
  describe('Property 2: Booking Metrics Calculation', () => {
    /**
     * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
     * 
     * For any set of freight bookings with various statuses and creation dates,
     * the dashboard metrics should correctly calculate booking counts.
     */
    it('active bookings count equals count of bookings with active statuses', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArb, { minLength: 0, maxLength: 50 }),
          (bookings) => {
            const metrics = calculateBookingMetrics(bookings)
            const expectedActive = bookings.filter(b => ACTIVE_BOOKING_STATUSES.includes(b.status)).length
            
            expect(metrics.activeBookings).toBe(expectedActive)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('bookings this month count equals count of bookings created in current month', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArb, { minLength: 0, maxLength: 50 }),
          (bookings) => {
            const now = new Date()
            const startOfMonth = getStartOfMonth(now)
            const metrics = calculateBookingMetrics(bookings, now)
            const expectedThisMonth = bookings.filter(b => new Date(b.created_at) >= startOfMonth).length
            
            expect(metrics.bookingsThisMonth).toBe(expectedThisMonth)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('pending confirmations count equals count of bookings with status requested', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArb, { minLength: 0, maxLength: 50 }),
          (bookings) => {
            const metrics = calculateBookingMetrics(bookings)
            const expectedPending = bookings.filter(b => b.status === 'requested').length
            
            expect(metrics.pendingConfirmations).toBe(expectedPending)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('completed this month equals count of completed bookings updated in current month', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArb, { minLength: 0, maxLength: 50 }),
          (bookings) => {
            const now = new Date()
            const startOfMonth = getStartOfMonth(now)
            const metrics = calculateBookingMetrics(bookings, now)
            const expectedCompleted = bookings.filter(
              b => b.status === 'completed' && new Date(b.updated_at) >= startOfMonth
            ).length
            
            expect(metrics.completedThisMonth).toBe(expectedCompleted)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('all booking counts are non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArb, { minLength: 0, maxLength: 50 }),
          (bookings) => {
            const metrics = calculateBookingMetrics(bookings)
            
            expect(metrics.activeBookings).toBeGreaterThanOrEqual(0)
            expect(metrics.bookingsThisMonth).toBeGreaterThanOrEqual(0)
            expect(metrics.pendingConfirmations).toBeGreaterThanOrEqual(0)
            expect(metrics.completedThisMonth).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 3: Shipping Line Metrics Calculation', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     * 
     * For any set of shipping lines and associated bookings,
     * the dashboard metrics should correctly calculate shipping line statistics.
     */
    it('total shipping lines equals count of active shipping lines', () => {
      fc.assert(
        fc.property(
          fc.array(shippingLineArb, { minLength: 0, maxLength: 20 }),
          fc.array(bookingArb, { minLength: 0, maxLength: 50 }),
          (shippingLines, bookings) => {
            const metrics = calculateShippingLineMetrics(shippingLines, bookings)
            const expectedTotal = shippingLines.filter(l => l.is_active).length
            
            expect(metrics.totalShippingLines).toBe(expectedTotal)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('preferred lines count equals count of active and preferred lines', () => {
      fc.assert(
        fc.property(
          fc.array(shippingLineArb, { minLength: 0, maxLength: 20 }),
          fc.array(bookingArb, { minLength: 0, maxLength: 50 }),
          (shippingLines, bookings) => {
            const metrics = calculateShippingLineMetrics(shippingLines, bookings)
            const expectedPreferred = shippingLines.filter(l => l.is_active && l.is_preferred).length
            
            expect(metrics.preferredLinesCount).toBe(expectedPreferred)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('most used shipping line is "-" when no bookings have shipping_line_id', () => {
      fc.assert(
        fc.property(
          fc.array(shippingLineArb, { minLength: 0, maxLength: 20 }),
          (shippingLines) => {
            const bookingsWithoutLines = [] as Booking[]
            const metrics = calculateShippingLineMetrics(shippingLines, bookingsWithoutLines)
            
            expect(metrics.mostUsedShippingLine).toBe('-')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 4: B/L Metrics Calculation', () => {
    /**
     * **Validates: Requirements 4.1, 4.2, 4.3**
     * 
     * For any set of bills of lading with various statuses and issue dates,
     * the dashboard metrics should correctly calculate B/L statistics.
     */
    it('B/L pending issuance equals count of B/Ls with draft or submitted status', () => {
      fc.assert(
        fc.property(
          fc.array(blArb, { minLength: 0, maxLength: 50 }),
          (bls) => {
            const metrics = calculateBLMetrics(bls)
            const expectedPending = bls.filter(bl => PENDING_BL_STATUSES.includes(bl.status)).length
            
            expect(metrics.blPendingIssuance).toBe(expectedPending)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('B/L draft count equals count of B/Ls with draft status', () => {
      fc.assert(
        fc.property(
          fc.array(blArb, { minLength: 0, maxLength: 50 }),
          (bls) => {
            const metrics = calculateBLMetrics(bls)
            const expectedDraft = bls.filter(bl => bl.status === 'draft').length
            
            expect(metrics.blDraftCount).toBe(expectedDraft)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('B/L draft count is always <= B/L pending issuance', () => {
      fc.assert(
        fc.property(
          fc.array(blArb, { minLength: 0, maxLength: 50 }),
          (bls) => {
            const metrics = calculateBLMetrics(bls)
            
            // Draft is a subset of pending (draft + submitted)
            expect(metrics.blDraftCount).toBeLessThanOrEqual(metrics.blPendingIssuance)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('all B/L counts are non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(blArb, { minLength: 0, maxLength: 50 }),
          (bls) => {
            const metrics = calculateBLMetrics(bls)
            
            expect(metrics.blIssuedThisMonth).toBeGreaterThanOrEqual(0)
            expect(metrics.blPendingIssuance).toBeGreaterThanOrEqual(0)
            expect(metrics.blDraftCount).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 5: Vessel and Container Metrics Calculation', () => {
    /**
     * **Validates: Requirements 5.1, 5.2, 5.3**
     * 
     * For any set of vessel schedules and booking containers,
     * the dashboard metrics should correctly calculate vessel and container statistics.
     */
    it('containers in transit equals count of containers with shipped status', () => {
      fc.assert(
        fc.property(
          fc.array(vesselScheduleArb, { minLength: 0, maxLength: 30 }),
          fc.array(containerArb, { minLength: 0, maxLength: 50 }),
          (schedules, containers) => {
            const metrics = calculateVesselContainerMetrics(schedules, containers)
            const expectedInTransit = containers.filter(c => c.status === 'shipped').length
            
            expect(metrics.containersInTransit).toBe(expectedInTransit)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('all vessel/container counts are non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(vesselScheduleArb, { minLength: 0, maxLength: 30 }),
          fc.array(containerArb, { minLength: 0, maxLength: 50 }),
          (schedules, containers) => {
            const metrics = calculateVesselContainerMetrics(schedules, containers)
            
            expect(metrics.upcomingArrivals).toBeGreaterThanOrEqual(0)
            expect(metrics.containersInTransit).toBeGreaterThanOrEqual(0)
            expect(metrics.expectedArrivals).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 6: Recent Bookings Ordering', () => {
    /**
     * **Validates: Requirements 6.1, 6.3**
     * 
     * For any set of freight bookings, the recent bookings list should:
     * - Contain at most 5 bookings
     * - Be ordered by created_at in descending order
     */
    it('recent bookings list contains at most 5 items', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArb, { minLength: 0, maxLength: 50 }),
          (bookings) => {
            const recent = getRecentBookings(bookings, 5)
            
            expect(recent.length).toBeLessThanOrEqual(5)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent bookings are ordered by created_at descending', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArb, { minLength: 2, maxLength: 50 }),
          (bookings) => {
            const recent = getRecentBookings(bookings, 5)
            
            for (let i = 0; i < recent.length - 1; i++) {
              const current = new Date(recent[i].created_at).getTime()
              const next = new Date(recent[i + 1].created_at).getTime()
              expect(current).toBeGreaterThanOrEqual(next)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent bookings length equals min(total bookings, 5)', () => {
      fc.assert(
        fc.property(
          fc.array(bookingArb, { minLength: 0, maxLength: 50 }),
          (bookings) => {
            const recent = getRecentBookings(bookings, 5)
            const expectedLength = Math.min(bookings.length, 5)
            
            expect(recent.length).toBe(expectedLength)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 7: Recent B/Ls Ordering', () => {
    /**
     * **Validates: Requirements 6.2, 6.4**
     * 
     * For any set of bills of lading with issued_at dates, the recent B/Ls list should:
     * - Contain at most 5 B/Ls
     * - Be ordered by issued_at in descending order
     * - Only include B/Ls with non-null issued_at
     */
    it('recent B/Ls list contains at most 5 items', () => {
      fc.assert(
        fc.property(
          fc.array(blArb, { minLength: 0, maxLength: 50 }),
          (bls) => {
            const recent = getRecentBLs(bls, 5)
            
            expect(recent.length).toBeLessThanOrEqual(5)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent B/Ls are ordered by issued_at descending', () => {
      fc.assert(
        fc.property(
          fc.array(blArb, { minLength: 2, maxLength: 50 }),
          (bls) => {
            const recent = getRecentBLs(bls, 5)
            
            for (let i = 0; i < recent.length - 1; i++) {
              const current = new Date(recent[i].issued_at!).getTime()
              const next = new Date(recent[i + 1].issued_at!).getTime()
              expect(current).toBeGreaterThanOrEqual(next)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent B/Ls only include B/Ls with non-null issued_at', () => {
      fc.assert(
        fc.property(
          fc.array(blArb, { minLength: 0, maxLength: 50 }),
          (bls) => {
            const recent = getRecentBLs(bls, 5)
            
            for (const bl of recent) {
              expect(bl.issued_at).not.toBeNull()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('recent B/Ls length equals min(B/Ls with issued_at, 5)', () => {
      fc.assert(
        fc.property(
          fc.array(blArb, { minLength: 0, maxLength: 50 }),
          (bls) => {
            const recent = getRecentBLs(bls, 5)
            const blsWithIssuedAt = bls.filter(bl => bl.issued_at !== null)
            const expectedLength = Math.min(blsWithIssuedAt.length, 5)
            
            expect(recent.length).toBe(expectedLength)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
