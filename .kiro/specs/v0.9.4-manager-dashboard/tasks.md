# Implementation Plan

- [x] 1. Create manager dashboard utility functions
  - [x] 1.1 Create `lib/manager-dashboard-utils.ts` with type definitions
    - Define interfaces: ManagerKPIs, PLSummaryRow, PendingApproval, BudgetAlertItem, TeamMemberMetrics, ManagerPeriodFilter
    - Define types: ManagerPeriodType, CostCategory
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

  - [x] 1.2 Implement variance and margin calculation functions
    - Implement `calculateVariance()` to compute percentage change between two values
    - Implement `calculateMargin()` to compute profit margin percentage
    - Handle zero/edge cases (return 0 instead of NaN/Infinity)
    - _Requirements: 2.2, 2.3, 3.6, 3.7_

  - [x] 1.3 Write property test for variance calculation
    - **Property 3: Variance calculation**
    - **Validates: Requirements 2.2, 3.6**

  - [x] 1.4 Write property test for margin calculation
    - **Property 4: Margin calculation**
    - **Validates: Requirements 2.3, 3.7**

  - [x] 1.5 Implement P&L calculation functions
    - Implement `calculatePLSummary()` to aggregate revenue, costs, profit from JOs
    - Implement `groupCostsByCategory()` to group cost items by category
    - Implement `calculateGrossProfit()` to compute revenue minus costs
    - _Requirements: 2.1, 3.3, 3.4, 3.5_

  - [x] 1.6 Write property test for KPI calculations
    - **Property 2: KPI calculations are consistent**
    - **Validates: Requirements 2.1**

  - [x] 1.7 Write property test for cost grouping
    - **Property 5: Cost grouping by category**
    - **Validates: Requirements 3.3, 3.4**

  - [x] 1.8 Write property test for gross profit calculation
    - **Property 6: Gross profit calculation**
    - **Validates: Requirements 3.5**

  - [x] 1.9 Implement pending approvals functions
    - Implement `filterPendingApprovals()` to filter PJOs with status 'pending_approval'
    - Implement `calculateEstimatedProfit()` to compute estimated profit from PJO
    - Implement `transformPendingApproval()` to create PendingApproval objects
    - _Requirements: 4.1, 4.2_

  - [x] 1.10 Write property test for pending approvals filter
    - **Property 7: Pending approvals filter**
    - **Validates: Requirements 4.1**

  - [x] 1.11 Write property test for approval queue data completeness
    - **Property 8: Approval queue data completeness**
    - **Validates: Requirements 4.2**

  - [x] 1.12 Implement budget alerts functions
    - Implement `filterBudgetAlerts()` to filter cost items with status 'exceeded'
    - Implement `calculateOverByPercentage()` to compute variance percentage
    - Implement `sortByVarianceDesc()` to sort by variance descending
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 1.13 Write property test for budget alerts filter and sort
    - **Property 9: Budget alerts filter and sort**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 1.14 Implement team metrics functions
    - Implement `calculateTeamMetrics()` to aggregate metrics by team member
    - Implement `calculatePerformanceRating()` to compute 1-5 star rating
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 1.15 Write property test for team metrics by role
    - **Property 10: Team metrics by role**
    - **Validates: Requirements 6.3, 6.4**

  - [x] 1.16 Write property test for performance rating calculation
    - **Property 11: Performance rating calculation**
    - **Validates: Requirements 6.5**

  - [x] 1.17 Implement period filter functions
    - Implement `getManagerPeriodDates()` for This Month, This Quarter, This Year, YTD
    - Implement `getPreviousPeriodDates()` to get equivalent previous period
    - _Requirements: 7.2, 7.4_

  - [x] 1.18 Write property test for period date calculation
    - **Property 12: Period date calculation**
    - **Validates: Requirements 7.2**

  - [x] 1.19 Write property test for previous period calculation
    - **Property 13: Previous period calculation**
    - **Validates: Requirements 7.4**

  - [x] 1.20 Implement KPI aggregation function
    - Implement `calculateManagerKPIs()` to aggregate all KPI data
    - _Requirements: 2.1, 2.4_

- [x] 2. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create manager dashboard UI components
  - [x] 3.1 Create `components/dashboard/manager/manager-period-filter.tsx`
    - Dropdown with period options (This Month, This Quarter, This Year, YTD)
    - _Requirements: 7.1, 7.2_

  - [x] 3.2 Create `components/dashboard/manager/manager-kpi-cards.tsx`
    - 6 KPI cards: Revenue MTD, Costs MTD, Profit MTD, Pending Approvals, Budget Exceeded, Jobs In Progress
    - Show variance percentages and margin
    - Conditional "Review Now" link and warning indicators
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.3 Create `components/dashboard/manager/pl-summary-table.tsx`
    - Table with columns: Category, This Month, Last Month, Variance, YTD
    - Revenue row, cost category rows, Total Cost subtotal, Gross Profit and Margin rows
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.4 Create `components/dashboard/manager/approval-queue.tsx`
    - Table with PJO number, customer, revenue, estimated profit, margin
    - Inline approve (✓) and reject (✗) buttons
    - "Approve All" batch action button
    - Empty state message
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 3.5 Create `components/dashboard/manager/budget-alerts-table.tsx`
    - Table with PJO number, cost item, budget, actual, over-by percentage
    - Sorted by variance descending
    - Review action button
    - Empty state success message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 3.6 Create `components/dashboard/manager/team-performance-table.tsx`
    - Table with team member, role, PJOs created, JOs completed, on-time rate
    - Star rating indicator (1-5)
    - Role-based metric display
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.7 Create `components/dashboard/manager/manager-dashboard.tsx`
    - Main container composing all components
    - Period filter state management
    - Welcome message with manager name
    - Layout matching the wireframe
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Integrate manager dashboard with routing
  - [x] 4.1 Create server actions for manager dashboard data
    - Add `fetchManagerDashboardData()` action in `app/(main)/dashboard/actions.ts`
    - Fetch JOs, PJOs, cost items, and user metrics
    - _Requirements: 1.1, 7.2_

  - [x] 4.2 Create approve/reject PJO server actions
    - Add `approvePJO()` action for inline approval
    - Add `rejectPJO()` action with rejection reason
    - Add `approveAllPJOs()` action for batch approval
    - _Requirements: 4.4, 4.5, 4.7_

  - [x] 4.3 Update dashboard page to route manager users
    - Modify `app/(main)/dashboard/page.tsx` to render ManagerDashboard for role='manager'
    - _Requirements: 1.1_

  - [x] 4.4 Write property test for dashboard routing
    - **Property 1: Dashboard routing for manager role**
    - **Validates: Requirements 1.1**

- [x] 5. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

