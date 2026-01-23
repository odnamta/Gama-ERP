# Design Document

## Overview

This design converts the Operations Manager dashboard from hardcoded mock data to real Supabase queries while maintaining the existing visual layout. The implementation creates a dedicated data service with caching and updates the page component to consume real data.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Operations Manager Dashboard                  │
│                 app/(main)/dashboard/operations-manager          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Operations Manager Data Service                     │
│           lib/operations-manager-dashboard-utils.ts              │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ getJobMetrics()  │  │ getAssetMetrics()│  │ getTeamMetrics()│ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ getCostMetrics() │  │ getKPIMetrics()  │  │ getRecentJobs()│ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Dashboard Cache                             │
│                    lib/dashboard-cache.ts                        │
│                                                                  │
│  getOrFetch(key, fetcher, TTL=5min) → cached or fresh data      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                  │
│                                                                  │
│  job_orders │ assets │ asset_assignments │ employees │ bkk_records│
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Operations Manager Data Service

**File**: `lib/operations-manager-dashboard-utils.ts`

```typescript
// Types
export interface OperationsManagerDashboardData {
  jobMetrics: JobMetrics
  assetMetrics: AssetMetrics
  teamMetrics: TeamMetrics
  costMetrics: CostMetrics
  kpiMetrics: KPIMetrics
  recentJobs: RecentJob[]
  recentBKK: RecentBKK[]
}

export interface JobMetrics {
  activeJobs: number
  pendingHandover: number  // status = 'completed'
  completedMTD: number
  statusBreakdown: Record<string, number>
}

export interface AssetMetrics {
  totalAssets: number
  assignedAssets: number
  availableAssets: number
  utilizationRate: number  // (assigned / total) * 100
  maintenanceDue: number   // expiry dates within 7 days
  statusBreakdown: Record<string, number>
}

export interface TeamMetrics {
  totalActiveEmployees: number
  assignedToJobs: number
  utilizationRate: number  // (assigned / total) * 100
}

export interface CostMetrics {
  totalBudget: number      // SUM(amount) from active jobs
  totalSpent: number       // SUM(final_cost) from active jobs
  budgetUtilization: number // (spent / budget) * 100
  overBudgetJobs: number   // COUNT where final_cost > amount
}

export interface KPIMetrics {
  onTimeDelivery: number   // Placeholder - requires delivery tracking
  safetyScore: number      // Placeholder - requires HSE integration
  costEfficiency: number   // (budget - spent) / budget * 100
  equipmentUptime: number  // (available / total) * 100
}

export interface RecentJob {
  id: string
  joNumber: string
  customerName: string
  status: string
  updatedAt: string
}

export interface RecentBKK {
  id: string
  bkkNumber: string
  description: string
  amount: number
  createdAt: string
}
```

### 2. Dashboard Page Component

**File**: `app/(main)/dashboard/operations-manager/page.tsx`

The page will be updated to:
1. Call `getOperationsManagerDashboardData()` server-side
2. Pass data to presentational components
3. Maintain existing visual layout with real values

### 3. Caching Strategy

```typescript
// Cache key pattern
const cacheKey = `ops-manager-dashboard:${userId}:${dateStr}`

// Usage
const data = await getOrFetch(
  cacheKey,
  () => fetchOperationsManagerData(),
  5 * 60 * 1000  // 5 minute TTL
)
```

## Data Flow

### Job Metrics Query
```sql
-- Active jobs count
SELECT COUNT(*) FROM job_orders WHERE status = 'active'

-- Pending handover (completed but not submitted to finance)
SELECT COUNT(*) FROM job_orders WHERE status = 'completed'

-- Completed this month
SELECT COUNT(*) FROM job_orders 
WHERE status IN ('completed', 'submitted_to_finance', 'invoiced', 'closed')
AND completed_at >= date_trunc('month', CURRENT_DATE)

-- Status breakdown
SELECT status, COUNT(*) FROM job_orders GROUP BY status
```

### Asset Metrics Query
```sql
-- Total and assigned assets
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE assigned_to_job_id IS NOT NULL) as assigned
FROM assets

-- Maintenance due (any expiry within 7 days)
SELECT COUNT(*) FROM assets
WHERE registration_expiry_date <= CURRENT_DATE + INTERVAL '7 days'
   OR kir_expiry_date <= CURRENT_DATE + INTERVAL '7 days'
   OR insurance_expiry_date <= CURRENT_DATE + INTERVAL '7 days'
```

### Cost Metrics Query (NO REVENUE!)
```sql
-- Budget and spent for active jobs
SELECT 
  COALESCE(SUM(amount), 0) as total_budget,
  COALESCE(SUM(final_cost), 0) as total_spent
FROM job_orders
WHERE status = 'active'

-- Over budget jobs
SELECT COUNT(*) FROM job_orders
WHERE status = 'active' AND final_cost > amount AND amount > 0
```

### Team Metrics Query
```sql
-- Active employees
SELECT COUNT(*) FROM employees WHERE status = 'active'

-- Employees assigned to active jobs (via asset_assignments)
SELECT COUNT(DISTINCT employee_id) FROM asset_assignments aa
JOIN job_orders jo ON aa.job_order_id = jo.id
WHERE jo.status = 'active'
AND (aa.assigned_to IS NULL OR aa.assigned_to >= CURRENT_DATE)
```

## Security Considerations

### Revenue Data Exclusion
The service MUST NOT query or expose:
- `job_orders.final_revenue`
- `job_orders.net_profit`
- `job_orders.net_margin`
- `job_orders.total_invoiced`
- `job_orders.invoiceable_amount`
- Any data from `invoices` table

### RLS Compliance
All queries use the authenticated Supabase client which enforces:
- Entity type isolation (gama_main vs gama_agency)
- Role-based access control

## Error Handling

```typescript
try {
  const data = await getOperationsManagerDashboardData()
  return data
} catch (error) {
  console.error('Failed to fetch ops manager dashboard:', error)
  // Return safe defaults
  return getDefaultDashboardData()
}
```

## Performance Targets

- Initial load (uncached): < 2 seconds
- Cached load: < 500ms
- Cache TTL: 5 minutes
- Parallel query execution for independent metrics

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `lib/operations-manager-dashboard-utils.ts` | CREATE | New data service with types and fetch functions |
| `app/(main)/dashboard/operations-manager/page.tsx` | UPDATE | Replace mock data with real data service calls |

## Dependencies

- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/dashboard-cache.ts` - Caching utilities
- `lib/format-utils.ts` - Currency formatting (IDR)
