'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrFetch, generateCacheKey } from '@/lib/dashboard-cache'

// =====================================================
// INTERFACES
// =====================================================

export interface RecentBooking {
  id: string
  bookingNumber: string
  customerName: string
  status: string
  createdAt: string
}

export interface RecentBL {
  id: string
  blNumber: string
  vesselName: string
  status: string
  issuedAt: string | null
}

export interface AgencyDashboardMetrics {
  // Booking Overview
  activeBookings: number
  bookingsThisMonth: number
  pendingConfirmations: number
  completedThisMonth: number
  
  // Shipping Lines
  totalShippingLines: number
  mostUsedShippingLine: string
  preferredLinesCount: number
  
  // Bills of Lading
  blIssuedThisMonth: number
  blPendingIssuance: number
  blDraftCount: number
  
  // Vessel/Container Status
  upcomingArrivals: number
  containersInTransit: number
  expectedArrivals: number
  
  // Recent Activity
  recentBookings: RecentBooking[]
  recentBLs: RecentBL[]
}

// =====================================================
// CONSTANTS
// =====================================================

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const ACTIVE_BOOKING_STATUSES = ['draft', 'requested', 'confirmed', 'amended']
const PENDING_BL_STATUSES = ['draft', 'submitted']

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as start
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

// =====================================================
// MAIN DATA FETCHER
// =====================================================

export async function getAgencyDashboardMetrics(): Promise<AgencyDashboardMetrics> {
  const cacheKey = await generateCacheKey('agency-dashboard-metrics', 'agency')
  
  return getOrFetch(cacheKey, async () => {
    const supabase = await createClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = getStartOfWeek(now)
    const endOfWeek = getEndOfWeek(now)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    // Run all queries in parallel for performance
    const [
      // Booking metrics
      activeBookingsResult,
      bookingsThisMonthResult,
      pendingConfirmationsResult,
      completedThisMonthResult,
      
      // Shipping line metrics
      totalShippingLinesResult,
      preferredLinesResult,
      mostUsedLineResult,
      shippingLinesLookupResult,
      
      // B/L metrics
      blIssuedThisMonthResult,
      blPendingIssuanceResult,
      blDraftResult,
      
      // Vessel/Container metrics
      upcomingArrivalsResult,
      containersInTransitResult,
      expectedArrivalsResult,
      
      // Recent activity
      recentBookingsResult,
      recentBLsResult,
    ] = await Promise.all([
      // Active bookings (status in draft, requested, confirmed, amended)
      supabase
        .from('freight_bookings')
        .select('id', { count: 'exact', head: true })
        .in('status', ACTIVE_BOOKING_STATUSES),
      
      // Bookings this month
      supabase
        .from('freight_bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      
      // Pending confirmations (status = requested)
      supabase
        .from('freight_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'requested'),
      
      // Completed this month
      supabase
        .from('freight_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', startOfMonth.toISOString()),
      
      // Total active shipping lines
      supabase
        .from('shipping_lines')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Preferred shipping lines
      supabase
        .from('shipping_lines')
        .select('id', { count: 'exact', head: true })
        .eq('is_preferred', true)
        .eq('is_active', true),
      
      // Most used shipping line (by booking count)
      supabase
        .from('freight_bookings')
        .select('shipping_line_id')
        .not('shipping_line_id', 'is', null),
      
      // Shipping lines lookup for name
      supabase
        .from('shipping_lines')
        .select('id, line_name')
        .eq('is_active', true),
      
      // B/L issued this month
      supabase
        .from('bills_of_lading')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'issued')
        .gte('issued_at', startOfMonth.toISOString()),
      
      // B/L pending issuance (draft or submitted)
      supabase
        .from('bills_of_lading')
        .select('id', { count: 'exact', head: true })
        .in('status', PENDING_BL_STATUSES),
      
      // B/L draft count
      supabase
        .from('bills_of_lading')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
      
      // Upcoming arrivals this week
      supabase
        .from('vessel_schedules')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_arrival', startOfWeek.toISOString())
        .lte('scheduled_arrival', endOfWeek.toISOString())
        .eq('status', 'scheduled'),
      
      // Containers in transit
      supabase
        .from('booking_containers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'shipped'),
      
      // Expected arrivals next 7 days
      supabase
        .from('vessel_schedules')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_arrival', now.toISOString())
        .lte('scheduled_arrival', sevenDaysFromNow.toISOString())
        .eq('status', 'scheduled'),
      
      // Recent bookings (last 5)
      supabase
        .from('freight_bookings')
        .select('id, booking_number, status, created_at, customer_id, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Recent B/Ls (last 5 issued)
      supabase
        .from('bills_of_lading')
        .select('id, bl_number, vessel_name, status, issued_at')
        .not('issued_at', 'is', null)
        .order('issued_at', { ascending: false })
        .limit(5),
    ])
    
    // Calculate most used shipping line
    let mostUsedShippingLine = '-'
    if (mostUsedLineResult.data && mostUsedLineResult.data.length > 0 && shippingLinesLookupResult.data) {
      const lineCounts = new Map<string, number>()
      for (const booking of mostUsedLineResult.data) {
        if (booking.shipping_line_id) {
          lineCounts.set(
            booking.shipping_line_id,
            (lineCounts.get(booking.shipping_line_id) || 0) + 1
          )
        }
      }
      
      let maxCount = 0
      let maxLineId = ''
      for (const [lineId, count] of lineCounts) {
        if (count > maxCount) {
          maxCount = count
          maxLineId = lineId
        }
      }
      
      if (maxLineId) {
        const line = shippingLinesLookupResult.data.find(l => l.id === maxLineId)
        if (line) {
          mostUsedShippingLine = line.line_name
        }
      }
    }
    
    // Transform recent bookings
    const recentBookings: RecentBooking[] = (recentBookingsResult.data || []).map(booking => ({
      id: booking.id,
      bookingNumber: booking.booking_number || '',
      customerName: (booking.customers as { name: string } | null)?.name || 'Unknown Customer',
      status: booking.status || '',
      createdAt: booking.created_at || '',
    }))
    
    // Transform recent B/Ls
    const recentBLs: RecentBL[] = (recentBLsResult.data || []).map(bl => ({
      id: bl.id,
      blNumber: bl.bl_number || '',
      vesselName: bl.vessel_name || '',
      status: bl.status || '',
      issuedAt: bl.issued_at || null,
    }))
    
    return {
      // Booking Overview
      activeBookings: activeBookingsResult.count || 0,
      bookingsThisMonth: bookingsThisMonthResult.count || 0,
      pendingConfirmations: pendingConfirmationsResult.count || 0,
      completedThisMonth: completedThisMonthResult.count || 0,
      
      // Shipping Lines
      totalShippingLines: totalShippingLinesResult.count || 0,
      mostUsedShippingLine,
      preferredLinesCount: preferredLinesResult.count || 0,
      
      // Bills of Lading
      blIssuedThisMonth: blIssuedThisMonthResult.count || 0,
      blPendingIssuance: blPendingIssuanceResult.count || 0,
      blDraftCount: blDraftResult.count || 0,
      
      // Vessel/Container Status
      upcomingArrivals: upcomingArrivalsResult.count || 0,
      containersInTransit: containersInTransitResult.count || 0,
      expectedArrivals: expectedArrivalsResult.count || 0,
      
      // Recent Activity
      recentBookings,
      recentBLs,
    }
  }, CACHE_TTL)
}
