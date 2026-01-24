# Implementation Plan: Agency Dashboard (v0.9.15)

## Overview

This implementation plan converts the Agency Dashboard design into discrete coding tasks. The implementation follows the established dashboard pattern from the Finance Manager dashboard, creating a server action for data fetching with caching, and updating the dashboard page to display real metrics.

## Tasks

- [x] 1. Create Agency Dashboard Data Fetcher
  - [x] 1.1 Create `lib/dashboard/agency-data.ts` with TypeScript interfaces
    - Define `RecentBooking` interface with id, bookingNumber, customerName, status, createdAt
    - Define `RecentBL` interface with id, blNumber, vesselName, status, issuedAt
    - Define `AgencyDashboardMetrics` interface with all metric fields
    - Export `getAgencyDashboardMetrics` async function signature
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2_

  - [x] 1.2 Implement booking metrics queries
    - Query active bookings count (status in draft, requested, confirmed, amended)
    - Query bookings this month count (created_at >= start of month)
    - Query pending confirmations count (status = requested)
    - Query completed this month count (status = completed, completed_at >= start of month)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.3 Implement shipping line metrics queries
    - Query total active shipping lines count (is_active = true)
    - Query preferred shipping lines count (is_preferred = true, is_active = true)
    - Query most used shipping line by booking count with aggregation
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.4 Implement B/L metrics queries
    - Query B/L issued this month count (status = issued, issued_at >= start of month)
    - Query B/L pending issuance count (status in draft, submitted)
    - Query B/L draft count (status = draft)
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 1.5 Implement vessel and container metrics queries
    - Query upcoming arrivals this week (scheduled_arrival within current week)
    - Query containers in transit count (status = shipped)
    - Query expected arrivals next 7 days (status = scheduled, scheduled_arrival within 7 days)
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 1.6 Implement recent activity queries
    - Query 5 most recent bookings with customer join, ordered by created_at desc
    - Query 5 most recent issued B/Ls, ordered by issued_at desc
    - Transform results to RecentBooking and RecentBL interfaces
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 1.7 Implement caching with 5-minute TTL
    - Import getOrFetch and generateCacheKey from lib/dashboard-cache
    - Generate cache key with 'agency-dashboard-metrics' prefix and 'agency' role
    - Wrap all queries in getOrFetch with 5-minute TTL
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Update Agency Dashboard Page
  - [x] 2.1 Update `app/(main)/dashboard/agency/page.tsx` with real data
    - Import getAgencyDashboardMetrics from lib/dashboard/agency-data
    - Import formatDate, formatNumber from lib/utils/format
    - Call getAgencyDashboardMetrics after auth check
    - _Requirements: 2.1, 3.1, 4.1, 5.1_

  - [x] 2.2 Implement booking overview metrics cards
    - Display active bookings count with formatNumber
    - Display bookings this month count
    - Display pending confirmations count
    - Display completed this month count
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.3 Implement shipping line metrics cards
    - Display total shipping lines count
    - Display most used shipping line name (or "-" if none)
    - Display preferred lines count
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.4 Implement B/L metrics cards
    - Display B/L issued this month count
    - Display B/L pending issuance count
    - Display B/L draft count
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.5 Implement vessel/container metrics cards
    - Display upcoming arrivals this week count
    - Display containers in transit count
    - Display expected arrivals count
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 2.6 Implement recent activity tables
    - Create recent bookings table with booking_number, customer, status, date columns
    - Create recent B/Ls table with bl_number, vessel, status, issued_at columns
    - Use formatDate for date columns
    - Display empty state message when no activity
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.7 Implement responsive grid layout
    - Use 4-column grid on large screens (lg:grid-cols-4)
    - Use 2-column grid on medium screens (md:grid-cols-2)
    - Use single column on small screens (grid-cols-1)
    - Apply consistent card styling matching other dashboards
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3. Checkpoint - Verify Dashboard Functionality
  - Ensure all metrics display correctly with real data
  - Verify role-based access control works (agency, owner, director allowed)
  - Test with empty database returns zero metrics
  - Ask the user if questions arise

- [x] 4. Write Tests
  - [x] 4.1 Write unit tests for agency data fetcher
    - Test booking metrics calculation with sample data
    - Test shipping line metrics calculation
    - Test B/L metrics calculation
    - Test vessel/container metrics calculation
    - Test recent activity ordering
    - Test empty data returns default metrics
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2_

  - [x] 4.2 Write property test for booking metrics calculation
    - **Property 2: Booking Metrics Calculation**
    - Generate random bookings with various statuses and dates
    - Verify active count matches status filter
    - Verify monthly count matches date filter
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 4.3 Write property test for recent activity ordering
    - **Property 6: Recent Bookings Ordering**
    - **Property 7: Recent B/Ls Ordering**
    - Generate random bookings/B/Ls with various dates
    - Verify ordering is descending by date
    - Verify limit of 5 is respected
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 5. Final Checkpoint - Ensure all tests pass
  - Run `npm run build` to verify no TypeScript errors
  - Run tests to verify all pass
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows the Finance Manager dashboard pattern for consistency
