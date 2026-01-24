# Implementation Plan: Assets Dashboard Real Data

## Overview

Connect the existing Assets Dashboard to real Equipment module data by creating a server-side data fetcher with 5-minute caching and updating the client component to receive data as props.

## Tasks

- [x] 1. Create data fetcher module
  - [x] 1.1 Create `lib/dashboard/assets-data.ts` with TypeScript interfaces
    - Define AssetSummary, CategoryCount, MaintenanceAlert, RecentMaintenance, RecentAssignment, RecentStatusChange, UtilizationMetrics, AssetsDashboardMetrics interfaces
    - _Requirements: 1.1-1.5, 2.1, 3.1-3.5, 4.1-4.3, 5.1-5.4_
  
  - [x] 1.2 Implement getAssetsDashboardMetrics function with caching
    - Use generateCacheKey and getOrFetch from dashboard-cache.ts
    - Set 5-minute TTL
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 1.3 Implement asset summary queries
    - Query total, active, maintenance, idle, disposed counts
    - Execute queries in parallel with Promise.all
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 1.4 Implement category counts query
    - Group by category, exclude empty categories
    - _Requirements: 2.1, 2.3_
  
  - [x] 1.5 Implement maintenance alerts query
    - Query upcoming_maintenance view for overdue and due_soon
    - Calculate overdue days
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [x] 1.6 Implement recent activity queries
    - Recent maintenance (last 7 days, limit 5)
    - Recent assignments (limit 5)
    - Recent status changes (limit 5)
    - _Requirements: 3.3, 5.1, 5.2, 5.3_
  
  - [x] 1.7 Implement utilization metrics calculation
    - Calculate assigned to jobs count
    - Calculate utilization rate percentage
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Update page component
  - [x] 2.1 Update `app/(main)/dashboard/assets/page.tsx` to fetch data server-side
    - Import and call getAssetsDashboardMetrics
    - Pass metrics as props to client component
    - _Requirements: 7.1, 7.2_

- [x] 3. Update client component
  - [x] 3.1 Update `assets-dashboard-client.tsx` props interface
    - Add metrics prop of type AssetsDashboardMetrics
    - Remove client-side data fetching (useState, useEffect)
    - _Requirements: 7.3_
  
  - [x] 3.2 Update summary cards to use real data
    - Replace mock assetSummary with metrics.summary
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 3.3 Update maintenance alerts tab to use real data
    - Replace mock maintenanceAlerts with metrics.maintenanceAlerts
    - Display overdue days badge
    - _Requirements: 3.4, 3.5_
  
  - [x] 3.4 Update utilization tab to use real data
    - Display utilization rate and counts
    - _Requirements: 4.4_
  
  - [x] 3.5 Add category breakdown section
    - Display categories with counts
    - _Requirements: 2.2_
  
  - [x] 3.6 Add recent activity section
    - Display recent maintenance, assignments, status changes
    - Use formatDate from lib/utils/format.ts
    - _Requirements: 5.4_

- [x] 4. Checkpoint - Verify dashboard displays real data
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Write property tests
  - [x] 5.1 Write property test for asset summary status counts
    - **Property 1: Asset Summary Status Counts**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
  
  - [x] 5.2 Write property test for category counts excluding empty
    - **Property 2: Category Counts Exclude Empty Categories**
    - **Validates: Requirements 2.1, 2.3**
  
  - [x] 5.3 Write property test for maintenance alerts filtering
    - **Property 3: Maintenance Alerts Filter by Status**
    - **Validates: Requirements 3.1, 3.2**
  
  - [x] 5.4 Write property test for utilization rate calculation
    - **Property 7: Utilization Rate Calculation**
    - **Validates: Requirements 4.1, 4.3**
  
  - [x] 5.5 Write property test for recent activity ordering
    - **Property 8: Recent Activity Ordering and Limiting**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 6. Write unit tests
  - [x] 6.1 Write unit tests for edge cases
    - Empty database state
    - Single asset scenarios
    - Division by zero (utilization rate)
    - _Requirements: 7.4_

- [x] 7. Final checkpoint
  - All 53 tests pass (23 unit + 30 property tests)

## Notes

- Follow the pattern from `lib/dashboard/finance-manager-data.ts` for consistency
- Use `formatDate` and `formatCurrency` from `lib/utils/format.ts` per steering rules
- No revenue/profit data should be exposed (operations-safe)
- Property tests use `fast-check` library (already in project)
