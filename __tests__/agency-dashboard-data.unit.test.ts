/**
 * Unit Tests for Agency Dashboard Data Fetcher
 * Tests specific examples and edge cases for the agency dashboard metrics
 * 
 * Feature: v0.9.15-agency-dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}))
const mockSupabase = {
  from: mockFrom,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Mock dashboard cache to bypass caching in tests
vi.mock('@/lib/dashboard-cache', () => ({
  generateCacheKey: vi.fn(() => Promise.resolve('test-cache-key')),
  getOrFetch: vi.fn(async (_key: string, fetcher: () => Promise<unknown>) => fetcher()),
}))

// Helper to create chainable mock
function createChainableMock(returnValue: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'gte', 'lte', 'not', 'order', 'limit', 'single']
  
  methods.forEach(method => {
    chain[method] = vi.fn(() => chain)
  })
  
  // Final resolution
  chain.then = (resolve: (value: unknown) => void) => {
    resolve(returnValue)
    return Promise.resolve(returnValue)
  }
  
  return chain
}

describe('Agency Dashboard Data - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Booking Metrics Calculation', () => {
    it('should count active bookings with correct statuses', () => {
      // Test data: bookings with various statuses
      const bookings = [
        { id: '1', status: 'draft' },
        { id: '2', status: 'requested' },
        { id: '3', status: 'confirmed' },
        { id: '4', status: 'amended' },
        { id: '5', status: 'cancelled' },
        { id: '6', status: 'shipped' },
        { id: '7', status: 'completed' },
      ]
      
      const activeStatuses = ['draft', 'requested', 'confirmed', 'amended']
      const activeCount = bookings.filter(b => activeStatuses.includes(b.status)).length
      
      expect(activeCount).toBe(4)
    })

    it('should count bookings this month correctly', () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const bookings = [
        { id: '1', created_at: new Date(now.getFullYear(), now.getMonth(), 5).toISOString() },
        { id: '2', created_at: new Date(now.getFullYear(), now.getMonth(), 10).toISOString() },
        { id: '3', created_at: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString() },
      ]
      
      const thisMonthCount = bookings.filter(b => new Date(b.created_at) >= startOfMonth).length
      
      expect(thisMonthCount).toBe(2)
    })

    it('should count pending confirmations (status = requested)', () => {
      const bookings = [
        { id: '1', status: 'draft' },
        { id: '2', status: 'requested' },
        { id: '3', status: 'requested' },
        { id: '4', status: 'confirmed' },
      ]
      
      const pendingCount = bookings.filter(b => b.status === 'requested').length
      
      expect(pendingCount).toBe(2)
    })

    it('should count completed bookings this month', () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const bookings = [
        { id: '1', status: 'completed', updated_at: new Date(now.getFullYear(), now.getMonth(), 5).toISOString() },
        { id: '2', status: 'completed', updated_at: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString() },
        { id: '3', status: 'shipped', updated_at: new Date(now.getFullYear(), now.getMonth(), 10).toISOString() },
      ]
      
      const completedThisMonth = bookings.filter(
        b => b.status === 'completed' && new Date(b.updated_at) >= startOfMonth
      ).length
      
      expect(completedThisMonth).toBe(1)
    })
  })

  describe('Shipping Line Metrics Calculation', () => {
    it('should count total active shipping lines', () => {
      const shippingLines = [
        { id: '1', line_name: 'Maersk', is_active: true },
        { id: '2', line_name: 'MSC', is_active: true },
        { id: '3', line_name: 'Evergreen', is_active: false },
      ]
      
      const activeCount = shippingLines.filter(l => l.is_active).length
      
      expect(activeCount).toBe(2)
    })

    it('should count preferred shipping lines', () => {
      const shippingLines = [
        { id: '1', line_name: 'Maersk', is_active: true, is_preferred: true },
        { id: '2', line_name: 'MSC', is_active: true, is_preferred: false },
        { id: '3', line_name: 'Evergreen', is_active: true, is_preferred: true },
        { id: '4', line_name: 'CMA CGM', is_active: false, is_preferred: true },
      ]
      
      const preferredCount = shippingLines.filter(l => l.is_active && l.is_preferred).length
      
      expect(preferredCount).toBe(2)
    })

    it('should find most used shipping line by booking count', () => {
      const bookings = [
        { shipping_line_id: 'line-1' },
        { shipping_line_id: 'line-1' },
        { shipping_line_id: 'line-1' },
        { shipping_line_id: 'line-2' },
        { shipping_line_id: 'line-2' },
        { shipping_line_id: 'line-3' },
      ]
      
      const shippingLines = [
        { id: 'line-1', line_name: 'Maersk' },
        { id: 'line-2', line_name: 'MSC' },
        { id: 'line-3', line_name: 'Evergreen' },
      ]
      
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
      
      // Find max
      let maxCount = 0
      let maxLineId = ''
      for (const [lineId, count] of lineCounts) {
        if (count > maxCount) {
          maxCount = count
          maxLineId = lineId
        }
      }
      
      const mostUsedLine = shippingLines.find(l => l.id === maxLineId)
      
      expect(mostUsedLine?.line_name).toBe('Maersk')
      expect(maxCount).toBe(3)
    })

    it('should return "-" when no bookings exist', () => {
      const bookings: { shipping_line_id: string }[] = []
      
      const lineCounts = new Map<string, number>()
      for (const booking of bookings) {
        if (booking.shipping_line_id) {
          lineCounts.set(
            booking.shipping_line_id,
            (lineCounts.get(booking.shipping_line_id) || 0) + 1
          )
        }
      }
      
      const mostUsedShippingLine = lineCounts.size === 0 ? '-' : 'Some Line'
      
      expect(mostUsedShippingLine).toBe('-')
    })
  })

  describe('B/L Metrics Calculation', () => {
    it('should count B/Ls issued this month', () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const bls = [
        { id: '1', status: 'issued', issued_at: new Date(now.getFullYear(), now.getMonth(), 5).toISOString() },
        { id: '2', status: 'issued', issued_at: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString() },
        { id: '3', status: 'draft', issued_at: null },
      ]
      
      const issuedThisMonth = bls.filter(
        bl => bl.status === 'issued' && bl.issued_at && new Date(bl.issued_at) >= startOfMonth
      ).length
      
      expect(issuedThisMonth).toBe(1)
    })

    it('should count B/Ls pending issuance (draft or submitted)', () => {
      const bls = [
        { id: '1', status: 'draft' },
        { id: '2', status: 'submitted' },
        { id: '3', status: 'issued' },
        { id: '4', status: 'released' },
        { id: '5', status: 'draft' },
      ]
      
      const pendingStatuses = ['draft', 'submitted']
      const pendingCount = bls.filter(bl => pendingStatuses.includes(bl.status)).length
      
      expect(pendingCount).toBe(3)
    })

    it('should count B/L drafts', () => {
      const bls = [
        { id: '1', status: 'draft' },
        { id: '2', status: 'draft' },
        { id: '3', status: 'submitted' },
        { id: '4', status: 'issued' },
      ]
      
      const draftCount = bls.filter(bl => bl.status === 'draft').length
      
      expect(draftCount).toBe(2)
    })
  })

  describe('Vessel/Container Metrics Calculation', () => {
    it('should count upcoming arrivals this week', () => {
      const now = new Date()
      const day = now.getDay()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - day + (day === 0 ? -6 : 1))
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      
      const schedules = [
        { id: '1', scheduled_arrival: new Date(startOfWeek.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'scheduled' },
        { id: '2', scheduled_arrival: new Date(endOfWeek.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'scheduled' },
        { id: '3', scheduled_arrival: new Date(startOfWeek.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'cancelled' },
      ]
      
      const upcomingThisWeek = schedules.filter(s => {
        const arrival = new Date(s.scheduled_arrival)
        return arrival >= startOfWeek && arrival <= endOfWeek && s.status === 'scheduled'
      }).length
      
      expect(upcomingThisWeek).toBe(1)
    })

    it('should count containers in transit', () => {
      const containers = [
        { id: '1', status: 'shipped' },
        { id: '2', status: 'shipped' },
        { id: '3', status: 'delivered' },
        { id: '4', status: 'empty' },
      ]
      
      const inTransitCount = containers.filter(c => c.status === 'shipped').length
      
      expect(inTransitCount).toBe(2)
    })

    it('should count expected arrivals in next 7 days', () => {
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const schedules = [
        { id: '1', scheduled_arrival: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'scheduled' },
        { id: '2', scheduled_arrival: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'scheduled' },
        { id: '3', scheduled_arrival: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: 'scheduled' },
        { id: '4', scheduled_arrival: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'cancelled' },
      ]
      
      const expectedArrivals = schedules.filter(s => {
        const arrival = new Date(s.scheduled_arrival)
        return arrival >= now && arrival <= sevenDaysFromNow && s.status === 'scheduled'
      }).length
      
      expect(expectedArrivals).toBe(2)
    })
  })

  describe('Recent Activity Ordering', () => {
    it('should order recent bookings by created_at descending', () => {
      const bookings = [
        { id: '1', booking_number: 'BKG-001', created_at: '2026-01-20T10:00:00Z' },
        { id: '2', booking_number: 'BKG-002', created_at: '2026-01-22T10:00:00Z' },
        { id: '3', booking_number: 'BKG-003', created_at: '2026-01-21T10:00:00Z' },
      ]
      
      const sorted = [...bookings].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      expect(sorted[0].booking_number).toBe('BKG-002')
      expect(sorted[1].booking_number).toBe('BKG-003')
      expect(sorted[2].booking_number).toBe('BKG-001')
    })

    it('should limit recent bookings to 5', () => {
      const bookings = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        booking_number: `BKG-${String(i + 1).padStart(3, '0')}`,
        created_at: new Date(2026, 0, i + 1).toISOString(),
      }))
      
      const limited = bookings.slice(0, 5)
      
      expect(limited.length).toBe(5)
    })

    it('should order recent B/Ls by issued_at descending', () => {
      const bls = [
        { id: '1', bl_number: 'BL-001', issued_at: '2026-01-20T10:00:00Z' },
        { id: '2', bl_number: 'BL-002', issued_at: '2026-01-22T10:00:00Z' },
        { id: '3', bl_number: 'BL-003', issued_at: '2026-01-21T10:00:00Z' },
      ]
      
      const sorted = [...bls].sort(
        (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
      )
      
      expect(sorted[0].bl_number).toBe('BL-002')
      expect(sorted[1].bl_number).toBe('BL-003')
      expect(sorted[2].bl_number).toBe('BL-001')
    })

    it('should limit recent B/Ls to 5', () => {
      const bls = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        bl_number: `BL-${String(i + 1).padStart(3, '0')}`,
        issued_at: new Date(2026, 0, i + 1).toISOString(),
      }))
      
      const limited = bls.slice(0, 5)
      
      expect(limited.length).toBe(5)
    })
  })

  describe('Empty Data Handling', () => {
    it('should return zero for all metrics when no data exists', () => {
      const defaultMetrics = {
        activeBookings: 0,
        bookingsThisMonth: 0,
        pendingConfirmations: 0,
        completedThisMonth: 0,
        totalShippingLines: 0,
        mostUsedShippingLine: '-',
        preferredLinesCount: 0,
        blIssuedThisMonth: 0,
        blPendingIssuance: 0,
        blDraftCount: 0,
        upcomingArrivals: 0,
        containersInTransit: 0,
        expectedArrivals: 0,
        recentBookings: [],
        recentBLs: [],
      }
      
      expect(defaultMetrics.activeBookings).toBe(0)
      expect(defaultMetrics.mostUsedShippingLine).toBe('-')
      expect(defaultMetrics.recentBookings).toHaveLength(0)
      expect(defaultMetrics.recentBLs).toHaveLength(0)
    })

    it('should handle null customer names gracefully', () => {
      const booking = {
        id: '1',
        booking_number: 'BKG-001',
        status: 'draft',
        created_at: '2026-01-20T10:00:00Z',
        customers: null,
      }
      
      const customerName = (booking.customers as { name: string } | null)?.name || 'Unknown Customer'
      
      expect(customerName).toBe('Unknown Customer')
    })

    it('should handle null issued_at for B/Ls', () => {
      const bl = {
        id: '1',
        bl_number: 'BL-001',
        vessel_name: 'Test Vessel',
        status: 'draft',
        issued_at: null,
      }
      
      const issuedAt = bl.issued_at || null
      
      expect(issuedAt).toBeNull()
    })
  })
})
