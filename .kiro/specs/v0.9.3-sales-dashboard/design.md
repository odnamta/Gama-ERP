# Design Document: Sales & Marketing Dashboard (v0.9.3)

## Overview

This feature implements a dedicated Sales & Marketing Dashboard for sales/marketing users in Gama ERP. The dashboard provides a focused view of the quotation pipeline, win/loss rates, revenue targets, and customer acquisition metrics - enabling sales users to track opportunities and optimize their conversion rates.

The design leverages the existing permission system from v0.9 and follows the same patterns established in the Ops Dashboard (v0.9.1) and Finance Dashboard (v0.9.2) for role-based dashboard routing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Main Layout                               │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │   Sidebar   │  │              Dashboard                   │  │
│  │  (filtered) │  │  ┌─────────────────────────────────────┐│  │
│  │             │  │  │  Role-based Dashboard Router        ││  │
│  │  Dashboard  │  │  │  ┌─────────┐  ┌─────────────────┐  ││  │
│  │  Customers  │  │  │  │ Admin/  │  │ Sales Dashboard  │  ││  │
│  │  Projects   │  │  │  │ Manager │  │ (this feature)   │  ││  │
│  │  PJOs       │  │  │  │Dashboard│  │                  │  ││  │
│  │             │  │  │  └─────────┘  └─────────────────┘  ││  │
│  └─────────────┘  │  └─────────────────────────────────────┘│  │
│                   └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Routing Strategy

The main `/dashboard` page checks user role and renders the appropriate dashboard:
- `admin`, `manager` → Full Dashboard (existing)
- `ops` → Operations Dashboard (v0.9.1)
- `finance` → Finance Dashboard (v0.9.2)
- `sales` → Sales Dashboard (this feature)
- `viewer` → Minimal read-only dashboard

## Components and Interfaces

### New Components

```
components/
├── dashboard/
│   ├── sales/
│   │   ├── sales-dashboard.tsx         # Main sales dashboard container
│   │   ├── sales-kpi-cards.tsx         # 4 KPI cards (Pipeline, Win Rate, Active PJOs, New Customers)
│   │   ├── pipeline-funnel.tsx         # Visual pipeline with stages and conversion rates
│   │   ├── pending-followups-table.tsx # PJOs needing attention with staleness indicators
│   │   ├── top-customers-table.tsx     # Customers ranked by value with trends
│   │   ├── win-loss-analysis.tsx       # Win/loss distribution with loss reasons
│   │   └── period-filter.tsx           # Period selection dropdown
```

### Component Interfaces

```typescript
// Sales Dashboard Props
interface SalesDashboardProps {
  kpis: SalesKPIs
  pipeline: PipelineStage[]
  pendingFollowups: PendingFollowup[]
  topCustomers: TopCustomer[]
  winLossData: WinLossData
  period: PeriodFilter
}

// KPI Data
interface SalesKPIs {
  pipelineValue: number
  pipelineCount: number
  winRate: number
  winRateTarget: number
  activePJOsCount: number
  newCustomersCount: number
}

// Pipeline Stage
interface PipelineStage {
  status: 'draft' | 'pending_approval' | 'approved' | 'converted' | 'rejected'
  count: number
  value: number
  conversionRate: number | null  // Rate to next stage, null for terminal stages
}

// Pending Follow-up
interface PendingFollowup {
  id: string
  pjo_number: string
  customer_name: string
  value: number
  status: 'draft' | 'pending_approval'
  days_in_status: number
  staleness: 'normal' | 'warning' | 'alert'
  created_at: string
}

// Top Customer
interface TopCustomer {
  id: string
  name: string
  totalValue: number
  jobCount: number
  avgValue: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

// Win/Loss Data
interface WinLossData {
  won: { count: number; value: number; percentage: number }
  lost: { count: number; value: number; percentage: number }
  pending: { count: number; value: number; percentage: number }
  lossReasons: Array<{ reason: string; count: number }>
}

// Period Filter
type PeriodType = 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'custom'

interface PeriodFilter {
  type: PeriodType
  startDate: Date
  endDate: Date
}

// Staleness levels
type StalenessLevel = 'normal' | 'warning' | 'alert'
```

### Utility Functions

```typescript
// lib/sales-dashboard-utils.ts

export function calculatePipelineValue(pjos: ProformaJobOrder[]): number {
  // Sum of total_estimated_revenue for active pipeline PJOs
}

export function calculateWinRate(converted: number, rejected: number): number {
  // (converted / (converted + rejected)) * 100
}

export function groupPJOsByPipelineStage(pjos: ProformaJobOrder[]): PipelineStage[] {
  // Groups PJOs by status with count, value, and conversion rates
}

export function calculateConversionRate(fromCount: number, toCount: number): number {
  // (toCount / fromCount) * 100
}

export function filterPendingFollowups(pjos: ProformaJobOrder[], currentDate: Date): PendingFollowup[] {
  // Returns PJOs in draft or pending_approval, sorted by days_in_status desc
}

export function calculateDaysInStatus(createdAt: string, currentDate: Date): number {
  // Days since PJO was created or entered current status
}

export function getStalenessLevel(status: string, daysInStatus: number): StalenessLevel {
  // draft > 7 days: 'alert', draft > 5 days: 'warning'
  // pending_approval > 3 days: 'warning'
}

export function countStalePJOs(followups: PendingFollowup[]): number {
  // Count of PJOs with staleness != 'normal'
}

export function rankCustomersByValue(
  pjos: ProformaJobOrder[],
  period: PeriodFilter,
  previousPeriod: PeriodFilter
): TopCustomer[] {
  // Aggregates PJO values by customer, calculates trends
}

export function calculateCustomerTrend(
  currentValue: number,
  previousValue: number
): { trend: 'up' | 'down' | 'stable'; percentage: number } {
  // Compares current to previous period
}

export function calculateWinLossData(pjos: ProformaJobOrder[]): WinLossData {
  // Aggregates won/lost/pending with percentages and loss reasons
}

export function groupLossReasons(rejectedPjos: ProformaJobOrder[]): Array<{ reason: string; count: number }> {
  // Groups rejection reasons with counts
}

export function getPeriodDates(periodType: PeriodType, customStart?: Date, customEnd?: Date): PeriodFilter {
  // Returns start and end dates for the selected period
}

export function filterPJOsByPeriod(pjos: ProformaJobOrder[], period: PeriodFilter): ProformaJobOrder[] {
  // Filters PJOs by created_at within period
}

export function calculateSalesKPIs(
  pjos: ProformaJobOrder[],
  customers: Customer[],
  period: PeriodFilter
): SalesKPIs {
  // Aggregates all KPI data
}
```

## Data Models

### Database Queries

```sql
-- Pipeline by status with values
SELECT 
  status,
  COUNT(*) as count,
  COALESCE(SUM(total_estimated_revenue), 0) as total_value
FROM proforma_job_orders
WHERE is_active = true
  AND created_at >= :start_date
  AND created_at <= :end_date
GROUP BY status;

-- Pending follow-ups (draft or pending_approval)
SELECT 
  p.id,
  p.pjo_number,
  p.status,
  p.total_estimated_revenue,
  p.created_at,
  c.name as customer_name
FROM proforma_job_orders p
JOIN projects pr ON p.project_id = pr.id
JOIN customers c ON pr.customer_id = c.id
WHERE p.status IN ('draft', 'pending_approval')
  AND p.is_active = true
ORDER BY p.created_at ASC;

-- Top customers by PJO value
SELECT 
  c.id,
  c.name,
  COUNT(p.id) as job_count,
  COALESCE(SUM(p.total_estimated_revenue), 0) as total_value
FROM customers c
JOIN projects pr ON c.id = pr.customer_id
JOIN proforma_job_orders p ON pr.id = p.project_id
WHERE p.status IN ('approved', 'converted')
  AND p.created_at >= :start_date
  AND p.created_at <= :end_date
GROUP BY c.id, c.name
ORDER BY total_value DESC
LIMIT 10;

-- New customers this period
SELECT COUNT(DISTINCT c.id) as new_customers
FROM customers c
WHERE c.created_at >= :start_date
  AND c.created_at <= :end_date;

-- Loss reasons aggregation
SELECT 
  rejection_reason,
  COUNT(*) as count
FROM proforma_job_orders
WHERE status = 'rejected'
  AND rejection_reason IS NOT NULL
  AND created_at >= :start_date
GROUP BY rejection_reason
ORDER BY count DESC;
```

### Staleness Calculation

```typescript
function getStalenessLevel(status: string, daysInStatus: number): StalenessLevel {
  if (status === 'draft') {
    if (daysInStatus > 7) return 'alert'
    if (daysInStatus > 5) return 'warning'
  }
  if (status === 'pending_approval') {
    if (daysInStatus > 3) return 'warning'
  }
  return 'normal'
}
```

### Win Rate Calculation

```typescript
function calculateWinRate(converted: number, rejected: number): number {
  const totalDecided = converted + rejected
  if (totalDecided === 0) return 0
  return (converted / totalDecided) * 100
}
```

### Conversion Rate Calculation

```typescript
function calculateConversionRate(fromCount: number, toCount: number): number {
  if (fromCount === 0) return 0
  return (toCount / fromCount) * 100
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dashboard routing for sales role
*For any* user profile with role='sales', the dashboard router SHALL return the Sales Dashboard component
**Validates: Requirements 1.1**

### Property 2: Pipeline grouping and aggregation
*For any* set of active PJOs, the pipeline grouping SHALL produce exactly one entry per status (draft, pending_approval, approved, converted, rejected) with count equal to PJOs in that status and value equal to sum of total_estimated_revenue
**Validates: Requirements 2.1, 2.2**

### Property 3: Conversion rate calculation
*For any* two consecutive pipeline stages, the conversion rate SHALL equal (next stage count / current stage count) × 100, and overall win rate SHALL equal (converted / (converted + rejected)) × 100
**Validates: Requirements 2.3, 2.4**

### Property 4: Pending follow-ups filter
*For any* PJO, it SHALL appear in the pending follow-ups list if and only if status is 'draft' or 'pending_approval' and is_active is true
**Validates: Requirements 3.1**

### Property 5: Follow-ups sort order
*For any* list of pending follow-ups, the list SHALL be sorted by days_in_status in descending order (oldest first)
**Validates: Requirements 3.3**

### Property 6: Staleness classification
*For any* PJO in draft status with days_in_status > 7, staleness SHALL be 'alert'; with days_in_status > 5, staleness SHALL be 'warning'. For any PJO in pending_approval status with days_in_status > 3, staleness SHALL be 'warning'. Otherwise staleness SHALL be 'normal'
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 7: Stale count aggregation
*For any* list of pending follow-ups, the stale count SHALL equal the number of PJOs where staleness is not 'normal'
**Validates: Requirements 4.4**

### Property 8: Top customers ranking and calculation
*For any* set of customers with PJOs in the selected period, customers SHALL be ranked by total PJO value descending, and avgValue SHALL equal totalValue / jobCount
**Validates: Requirements 5.1, 5.2**

### Property 9: Customer trend calculation
*For any* customer with values in current and previous periods, trend SHALL be 'up' if current > previous, 'down' if current < previous, 'stable' if equal
**Validates: Requirements 5.3**

### Property 10: Win/loss aggregation
*For any* set of PJOs, won count SHALL equal PJOs with status='converted', lost count SHALL equal PJOs with status='rejected', pending count SHALL equal PJOs with status in ('draft', 'pending_approval', 'approved')
**Validates: Requirements 6.1**

### Property 11: Win/loss percentage calculation
*For any* win/loss data, each category percentage SHALL equal (category count / total count) × 100, and all percentages SHALL sum to 100
**Validates: Requirements 6.3**

### Property 12: Loss reasons grouping
*For any* set of rejected PJOs with rejection_reason, the loss reasons list SHALL contain each unique reason with count equal to PJOs having that reason
**Validates: Requirements 6.4**

### Property 13: Period filter application
*For any* period selection, all dashboard data SHALL only include PJOs where created_at falls within the period's start and end dates
**Validates: Requirements 7.2**

### Property 14: Navigation filtering for sales role
*For any* user with role='sales', the sidebar SHALL show Dashboard, Customers, Projects, and PJOs, and SHALL hide Job Orders, Invoices, and system administration items
**Validates: Requirements 8.1, 8.2**

## Error Handling

| Scenario | Handling |
|----------|----------|
| No PJOs in pipeline | Show empty state with "No opportunities yet" message |
| No pending follow-ups | Show empty state with "All caught up!" message |
| No customers with PJOs | Show empty state with "No customer data" message |
| No decided PJOs (win rate) | Show "N/A" for win rate |
| Database query fails | Show error toast, display cached data if available |
| Unauthorized access attempt | Redirect to Sales Dashboard with toast notification |
| Invalid period selection | Default to "This Month" |

## Testing Strategy

### Unit Tests
- Test pipeline stage grouping with various PJO combinations
- Test win rate calculation with edge cases (0 decided, all won, all lost)
- Test staleness classification for all threshold combinations
- Test customer ranking and average calculation
- Test period date calculations for all period types

### Property-Based Tests (using fast-check)
- Property 2: Pipeline grouping and aggregation
- Property 3: Conversion rate calculation
- Property 4: Pending follow-ups filter
- Property 5: Follow-ups sort order
- Property 6: Staleness classification
- Property 7: Stale count aggregation
- Property 8: Top customers ranking and calculation
- Property 9: Customer trend calculation
- Property 10: Win/loss aggregation
- Property 11: Win/loss percentage calculation
- Property 12: Loss reasons grouping
- Property 13: Period filter application

### Integration Tests
- Full dashboard render with mock data
- Period filter changes update all components
- Navigation between dashboard and filtered lists
- Sidebar menu filtering for sales role
