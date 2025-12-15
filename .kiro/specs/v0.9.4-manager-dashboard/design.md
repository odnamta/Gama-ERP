# Design Document: Manager Dashboard

## Overview

The Manager Dashboard provides comprehensive business oversight for users with the `manager` role. It displays financial KPIs, P&L breakdown by cost category, pending approval queue with inline actions, budget alerts, and team performance metrics. The dashboard follows the same patterns established in the Ops, Finance, and Sales dashboards.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dashboard Page (Server)                       │
│  - Role check: render ManagerDashboard for role='manager'       │
│  - Fetch data via server action                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              fetchManagerDashboardData() Action                  │
│  - Fetch JOs for P&L calculation                                │
│  - Fetch PJOs for approval queue                                │
│  - Fetch cost items for budget alerts                           │
│  - Fetch user metrics for team performance                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              lib/manager-dashboard-utils.ts                      │
│  - calculatePLSummary()                                         │
│  - groupCostsByCategory()                                       │
│  - calculateVariance()                                          │
│  - filterPendingApprovals()                                     │
│  - filterBudgetAlerts()                                         │
│  - calculateTeamMetrics()                                       │
│  - calculatePerformanceRating()                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ManagerDashboard Component                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ KPI Cards   │ │ P&L Summary │ │ Period      │               │
│  │ (6 cards)   │ │ Table       │ │ Filter      │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Approval    │ │ Budget      │ │ Team        │               │
│  │ Queue       │ │ Alerts      │ │ Performance │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ManagerDashboard` | `components/dashboard/manager/manager-dashboard.tsx` | Main container composing all sections |
| `ManagerKPICards` | `components/dashboard/manager/manager-kpi-cards.tsx` | 6 KPI cards (Revenue, Costs, Profit, Pending, Exceeded, Jobs) |
| `PLSummaryTable` | `components/dashboard/manager/pl-summary-table.tsx` | P&L breakdown with cost categories |
| `ApprovalQueue` | `components/dashboard/manager/approval-queue.tsx` | Pending PJOs with inline approve/reject |
| `BudgetAlertsTable` | `components/dashboard/manager/budget-alerts-table.tsx` | Exceeded cost items sorted by variance |
| `TeamPerformanceTable` | `components/dashboard/manager/team-performance-table.tsx` | Team member metrics with ratings |
| `ManagerPeriodFilter` | `components/dashboard/manager/manager-period-filter.tsx` | Period selection dropdown |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `calculatePLSummary()` | Aggregate revenue, costs, profit, margin from JOs |
| `groupCostsByCategory()` | Group cost items by category with totals |
| `calculateVariance()` | Calculate percentage change between two values |
| `calculateMargin()` | Calculate margin percentage (profit/revenue * 100) |
| `filterPendingApprovals()` | Filter PJOs with status 'pending_approval' |
| `calculateEstimatedProfit()` | Calculate estimated profit from PJO revenue and costs |
| `filterBudgetAlerts()` | Filter cost items with status 'exceeded' |
| `sortByVariance()` | Sort items by variance percentage descending |
| `calculateTeamMetrics()` | Aggregate metrics by team member |
| `calculatePerformanceRating()` | Calculate 1-5 star rating from metrics |
| `getPeriodDates()` | Get start/end dates for period type |
| `getPreviousPeriodDates()` | Get equivalent previous period dates |

## Data Models

### ManagerKPIs
```typescript
interface ManagerKPIs {
  revenueMTD: number
  costsMTD: number
  profitMTD: number
  marginMTD: number
  revenueVariance: number  // % change vs last month
  costsVariance: number
  profitVariance: number
  pendingApprovalsCount: number
  budgetExceededCount: number
  jobsInProgressCount: number
}
```

### PLSummaryRow
```typescript
interface PLSummaryRow {
  category: string
  thisMonth: number
  lastMonth: number
  variance: number  // percentage
  ytd: number
  isSubtotal?: boolean
  isTotal?: boolean
}
```

### PendingApproval
```typescript
interface PendingApproval {
  id: string
  pjo_number: string
  customer_name: string
  project_name: string
  revenue: number
  estimatedCost: number
  estimatedProfit: number
  margin: number
  daysPending: number
  created_at: string
}
```

### BudgetAlert
```typescript
interface BudgetAlertItem {
  id: string
  pjo_id: string
  pjo_number: string
  category: string
  budgetAmount: number
  actualAmount: number
  overByAmount: number
  overByPercentage: number
}
```

### TeamMemberMetrics
```typescript
interface TeamMemberMetrics {
  userId: string
  name: string
  role: string
  pjosCreated: number | null
  josCompleted: number | null
  onTimeRate: number | null
  rating: number  // 1-5
}
```

### ManagerPeriodFilter
```typescript
type ManagerPeriodType = 'this_month' | 'this_quarter' | 'this_year' | 'ytd'

interface ManagerPeriodFilter {
  type: ManagerPeriodType
  startDate: Date
  endDate: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dashboard routing for manager role
*For any* user with role='manager', accessing the dashboard should render the ManagerDashboard component.
**Validates: Requirements 1.1**

### Property 2: KPI calculations are consistent
*For any* set of job orders, the revenue MTD should equal the sum of all final_revenue values, costs MTD should equal the sum of all final_cost values, and profit MTD should equal revenue minus costs.
**Validates: Requirements 2.1**

### Property 3: Variance calculation
*For any* two numeric values (current and previous), variance should equal ((current - previous) / previous) * 100, and when previous is zero, variance should be 0 (not NaN or infinity).
**Validates: Requirements 2.2, 3.6**

### Property 4: Margin calculation
*For any* revenue and cost values, margin should equal ((revenue - cost) / revenue) * 100, and when revenue is zero, margin should be 0%.
**Validates: Requirements 2.3, 3.7**

### Property 5: Cost grouping by category
*For any* set of cost items, grouping by category should produce totals where the sum of all category totals equals the total of all cost items.
**Validates: Requirements 3.3, 3.4**

### Property 6: Gross profit calculation
*For any* revenue and total cost values, gross profit should equal revenue minus total cost.
**Validates: Requirements 3.5**

### Property 7: Pending approvals filter
*For any* set of PJOs, filtering for pending approvals should return only PJOs with status='pending_approval'.
**Validates: Requirements 4.1**

### Property 8: Approval queue data completeness
*For any* pending approval PJO, the transformed data should include PJO number, customer name, revenue, estimated profit, and margin percentage.
**Validates: Requirements 4.2**

### Property 9: Budget alerts filter and sort
*For any* set of cost items, filtering for exceeded items should return only items with status='exceeded', sorted by variance percentage in descending order.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 10: Team metrics by role
*For any* team member, if their role is 'admin' or 'sales', PJOs created should be calculated; if their role is 'ops', JOs completed and on-time rate should be calculated.
**Validates: Requirements 6.3, 6.4**

### Property 11: Performance rating calculation
*For any* set of team metrics, the rating should be between 1 and 5 inclusive, calculated based on the member's performance relative to targets.
**Validates: Requirements 6.5**

### Property 12: Period date calculation
*For any* period type, the returned date range should correctly represent that period (this_month returns first to last day of current month, etc.).
**Validates: Requirements 7.2**

### Property 13: Previous period calculation
*For any* period, the previous period should have the same duration and end exactly before the current period starts.
**Validates: Requirements 7.4**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Data fetch failure | Display error message with retry button |
| Empty approval queue | Show "No pending approvals" message |
| Empty budget alerts | Show "All items within budget" success message |
| Zero revenue | Display margin as 0% |
| Zero previous period value | Display variance as 0% |
| Missing team member data | Show "-" for unavailable metrics |

## Testing Strategy

### Unit Testing
- Test individual utility functions with specific inputs
- Test edge cases (zero values, empty arrays)
- Test error handling scenarios

### Property-Based Testing
- Use fast-check library for property-based tests
- Each correctness property will have a corresponding PBT
- Configure minimum 100 iterations per property test
- Tag each test with: `**Feature: v0.9.4-manager-dashboard, Property {number}: {property_text}**`

### Test Coverage
- All utility functions in `lib/manager-dashboard-utils.ts`
- KPI calculations
- P&L aggregation
- Filtering and sorting functions
- Rating calculations
- Period date calculations

