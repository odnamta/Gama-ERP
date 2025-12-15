# Implementation Plan

- [x] 1. Create sales dashboard utility functions
  - [x] 1.1 Create `lib/sales-dashboard-utils.ts` with type definitions
    - Define interfaces: SalesKPIs, PipelineStage, PendingFollowup, TopCustomer, WinLossData, PeriodFilter
    - Define types: PeriodType, StalenessLevel
    - _Requirements: 1.2, 2.1, 3.1, 5.1, 6.1, 7.1_

  - [x] 1.2 Implement pipeline grouping and aggregation functions
    - Implement `groupPJOsByPipelineStage()` to group PJOs by status with count and value
    - Implement `calculatePipelineValue()` to sum estimated revenue
    - _Requirements: 2.1, 2.2_

  - [x] 1.3 Write property test for pipeline grouping
    - **Property 2: Pipeline grouping and aggregation**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 1.4 Implement conversion rate and win rate functions
    - Implement `calculateConversionRate()` for stage-to-stage conversion
    - Implement `calculateWinRate()` for overall win rate (converted / (converted + rejected))
    - _Requirements: 2.3, 2.4_

  - [x] 1.5 Write property test for conversion rate calculation
    - **Property 3: Conversion rate calculation**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 1.6 Implement staleness classification functions
    - Implement `calculateDaysInStatus()` to calculate days since created_at
    - Implement `getStalenessLevel()` with thresholds (draft: 5/7 days, pending: 3 days)
    - Implement `countStalePJOs()` to count non-normal staleness
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 1.7 Write property test for staleness classification
    - **Property 6: Staleness classification**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 1.8 Implement pending follow-ups functions
    - Implement `filterPendingFollowups()` to filter draft/pending_approval PJOs
    - Sort by days_in_status descending (oldest first)
    - _Requirements: 3.1, 3.3_

  - [x] 1.9 Write property test for pending follow-ups filter and sort
    - **Property 4: Pending follow-ups filter**
    - **Property 5: Follow-ups sort order**
    - **Validates: Requirements 3.1, 3.3**

  - [x] 1.10 Implement top customers functions
    - Implement `rankCustomersByValue()` to aggregate and rank customers
    - Implement `calculateCustomerTrend()` to compare current vs previous period
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 1.11 Write property test for top customers ranking
    - **Property 8: Top customers ranking and calculation**
    - **Property 9: Customer trend calculation**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 1.12 Implement win/loss analysis functions
    - Implement `calculateWinLossData()` to aggregate won/lost/pending with percentages
    - Implement `groupLossReasons()` to group rejection reasons with counts
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 1.13 Write property test for win/loss aggregation
    - **Property 10: Win/loss aggregation**
    - **Property 11: Win/loss percentage calculation**
    - **Property 12: Loss reasons grouping**
    - **Validates: Requirements 6.1, 6.3, 6.4**

  - [x] 1.14 Implement period filter functions
    - Implement `getPeriodDates()` for This Week, This Month, This Quarter, This Year, Custom
    - Implement `filterPJOsByPeriod()` to filter by date range
    - _Requirements: 7.2, 7.3_

  - [x] 1.15 Write property test for period filter application
    - **Property 13: Period filter application**
    - **Validates: Requirements 7.2**

  - [x] 1.16 Implement KPI aggregation function
    - Implement `calculateSalesKPIs()` to aggregate all KPI data
    - _Requirements: 1.2, 1.3_

- [x] 2. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create sales dashboard UI components
  - [x] 3.1 Create `components/dashboard/sales/period-filter.tsx`
    - Dropdown with period options (This Week, This Month, This Quarter, This Year, Custom)
    - Date pickers for custom range
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 3.2 Create `components/dashboard/sales/sales-kpi-cards.tsx`
    - 4 KPI cards: Pipeline Value, Win Rate, Active PJOs, New Customers
    - Show counts alongside values
    - Win rate comparison to target
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 3.3 Create `components/dashboard/sales/pipeline-funnel.tsx`
    - Visual pipeline stages (draft → pending → approved → converted/rejected)
    - Show count and value per stage
    - Show conversion rates between stages
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.4 Create `components/dashboard/sales/pending-followups-table.tsx`
    - Table with PJO number, customer, value, status, days in status
    - Staleness indicators (warning/alert badges)
    - Action buttons for follow-up
    - Stale count in header
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

  - [x] 3.5 Create `components/dashboard/sales/top-customers-table.tsx`
    - Table with rank, customer name, total value, job count, avg value
    - Trend indicators with percentage
    - Click to navigate to customer detail
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 3.6 Create `components/dashboard/sales/win-loss-analysis.tsx`
    - Visual bar representation of won/lost/pending distribution
    - Percentages for each category
    - Loss reasons list with counts
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 3.7 Create `components/dashboard/sales/sales-dashboard.tsx`
    - Main container composing all components
    - Period filter state management
    - Layout matching the wireframe
    - _Requirements: 1.1, 1.2_

- [x] 4. Integrate sales dashboard with routing
  - [x] 4.1 Create server actions for sales dashboard data
    - Add `getSalesDashboardData()` action in `app/(main)/dashboard/actions.ts`
    - Fetch PJOs, customers, and aggregate data
    - _Requirements: 1.1, 7.2_

  - [x] 4.2 Update dashboard page to route sales users
    - Modify `app/(main)/dashboard/page.tsx` to render SalesDashboard for role='sales'
    - _Requirements: 1.1_

  - [x] 4.3 Write property test for dashboard routing
    - **Property 1: Dashboard routing for sales role**
    - **Validates: Requirements 1.1**

- [x] 5. Update navigation for sales role
  - [x] 5.1 Update sidebar navigation filtering
    - Show: Dashboard, Customers, Projects, PJOs for sales role
    - Hide: Job Orders, Invoices, system administration
    - _Requirements: 8.1, 8.2_

  - [x] 5.2 Update middleware for sales role access control
    - Redirect restricted page access to Sales Dashboard
    - _Requirements: 8.3_

  - [x] 5.3 Write property test for navigation filtering
    - **Property 14: Navigation filtering for sales role**
    - **Validates: Requirements 8.1, 8.2**

- [x] 6. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
