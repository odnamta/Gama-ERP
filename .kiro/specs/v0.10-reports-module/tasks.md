# Implementation Plan

## Phase 1: Reports Module (v0.9.6)

- [x] 1. Set up reports module structure and permissions
  - [x] 1.1 Create report types and interfaces in `/types/reports.ts`
    - Define ReportConfig, DateRange, PeriodPreset interfaces
    - Define data interfaces for each report type
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Create report permissions utility in `/lib/reports/report-permissions.ts`
    - Define REPORTS configuration array with allowedRoles
    - Implement `getVisibleReports(role)` function
    - Implement `canAccessReport(role, reportId)` function
    - _Requirements: 1.4, 7.1, 7.2, 7.3, 7.4_
  - [x] 1.3 Write property test for role-based filtering
    - **Property 1: Role-based report filtering**
    - **Validates: Requirements 1.4, 7.1, 7.2, 7.3, 7.4**

- [x] 2. Create shared report components
  - [x] 2.1 Create ReportCard component in `/components/reports/ReportCard.tsx`
    - Display icon, title, description, and Generate button
    - Support optional badge (e.g., "Beta")
    - _Requirements: 1.3_
  - [x] 2.2 Create ReportFilters component in `/components/reports/ReportFilters.tsx`
    - Implement period preset dropdown (This Week, This Month, etc.)
    - Implement custom date range picker with validation
    - Sync filter state with URL query parameters
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 2.3 Write property test for date range validation
    - **Property 12: Date range validation**
    - **Validates: Requirements 8.3**
  - [x] 2.4 Create ReportTable component in `/components/reports/ReportTable.tsx`
    - Implement generic table with column definitions
    - Add pagination with 25 rows per page
    - Support row highlighting (warning/critical)
    - Support row click navigation
    - _Requirements: 6.4_
  - [x] 2.5 Write property test for pagination
    - **Property 11: Pagination**
    - **Validates: Requirements 6.4**
  - [x] 2.6 Create ReportSummary, ReportSkeleton, ReportEmptyState components
    - ReportSummary: Display key metrics with formatting
    - ReportSkeleton: Loading state with skeleton UI
    - ReportEmptyState: Empty data message
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Create Reports Index page
  - [x] 3.1 Create reports layout in `/app/(dashboard)/reports/layout.tsx`
    - Add breadcrumb navigation
    - _Requirements: 1.1_
  - [x] 3.2 Create reports index page in `/app/(dashboard)/reports/page.tsx`
    - Display reports grouped by category (Financial, Operational, AR, Sales)
    - Filter reports based on user role
    - Handle unauthorized access redirect
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement P&L Report
  - [x] 5.1 Create P&L utility functions in `/lib/reports/profit-loss-utils.ts`
    - Implement `groupRevenueByCategory(items)` function
    - Implement `groupCostsByCategory(items)` function
    - Implement `calculatePLSummary(revenue, costs)` function
    - Handle zero revenue edge case for margin calculation
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 5.2 Write property tests for P&L calculations
    - **Property 2: P&L data grouping**
    - **Property 3: P&L calculations**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6**
  - [x] 5.3 Create P&L report page in `/app/(dashboard)/reports/profit-loss/page.tsx`
    - Fetch revenue and cost data for selected period
    - Display revenue grouped by service type
    - Display costs grouped by category
    - Show totals, gross profit, and margin
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7_

- [x] 6. Implement Budget Variance Report
  - [x] 6.1 Create Budget Variance utility functions in `/lib/reports/budget-variance-utils.ts`
    - Implement `calculateVariance(estimated, actual)` function
    - Implement `transformPJOsToVarianceItems(pjos)` function
    - Handle zero estimated edge case
    - Implement warning threshold check (>10%)
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  - [x] 6.2 Write property tests for variance calculations
    - **Property 4: Budget variance calculation**
    - **Property 5: Budget variance warning threshold**
    - **Validates: Requirements 3.3, 3.4, 3.5**
  - [x] 6.3 Create Budget Variance report page in `/app/(dashboard)/reports/budget-variance/page.tsx`
    - Fetch PJOs with cost items for selected period
    - Display variance table with highlighting
    - Link PJO numbers to detail pages
    - _Requirements: 3.1, 3.2, 3.4, 3.6_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement AR Aging Report
  - [x] 8.1 Create AR Aging utility functions in `/lib/reports/ar-aging-utils.ts`
    - Implement `calculateDaysOverdue(dueDate, today)` function
    - Implement `assignAgingBucket(daysOverdue)` function
    - Implement `aggregateByBucket(invoices)` function
    - Implement `determineSeverity(daysOverdue)` function
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  - [x] 8.2 Write property tests for aging calculations
    - **Property 6: Aging bucket assignment**
    - **Property 7: Aging bucket aggregation**
    - **Property 8: Aging severity styling**
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5**
  - [x] 8.3 Create AR Aging report page in `/app/(dashboard)/reports/ar-aging/page.tsx`
    - Fetch unpaid invoices
    - Display aging summary buckets (clickable)
    - Display invoice detail table with severity highlighting
    - Link invoice numbers to detail pages
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7_

- [x] 9. Implement Quotation Conversion Report
  - [x] 9.1 Create Quotation Conversion utility functions in `/lib/reports/quotation-utils.ts`
    - Implement `countByStatus(pjos)` function
    - Implement `calculateConversionRate(from, to)` function
    - Implement `calculateAverageDaysInStage(pjos)` function
    - Handle zero starting count edge case
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 9.2 Write property tests for conversion calculations
    - **Property 9: Quotation status counts**
    - **Property 10: Conversion rate calculation**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [x] 9.3 Create Quotation Conversion report page in `/app/(dashboard)/reports/quotation-conversion/page.tsx`
    - Fetch PJOs for selected period
    - Display status pipeline with counts and percentages
    - Display conversion rates
    - Display average days per stage
    - Link status counts to filtered PJO list
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

