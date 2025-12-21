# v0.9.10 Enhanced Operations Dashboard - Design

## Architecture

### Database Views (SECURITY INVOKER)
```sql
-- operations_job_list: Active jobs with budget info (NO revenue)
CREATE VIEW operations_job_list WITH (security_invoker = true) AS
SELECT 
  jo.id, jo.jo_number, jo.status, jo.created_at,
  c.name as customer_name,
  p.name as project_name,
  pjo.total_cost_estimated as budget,
  pjo.total_cost_actual as spent
FROM job_orders jo
JOIN proforma_job_orders pjo ON jo.pjo_id = pjo.id
JOIN projects p ON pjo.project_id = p.id
JOIN customers c ON p.customer_id = c.id
WHERE jo.status IN ('active', 'completed', 'submitted_to_finance');

-- delivery_schedule: Today's deliveries
CREATE VIEW delivery_schedule WITH (security_invoker = true) AS
SELECT 
  sj.id, sj.sj_number, sj.delivery_date, sj.status,
  sj.origin, sj.destination, sj.driver_name,
  jo.jo_number
FROM surat_jalan sj
JOIN job_orders jo ON sj.jo_id = jo.id
WHERE sj.delivery_date = CURRENT_DATE;
```

### TypeScript Types
```typescript
// lib/ops-dashboard-enhanced-utils.ts

export interface EnhancedOpsSummary {
  activeJobsCount: number
  todayDeliveriesCount: number
  pendingHandoverCount: number
  totalBudget: number
  totalSpent: number
}

export interface OperationsJobItem {
  id: string
  joNumber: string
  customerName: string
  projectName: string
  budget: number
  spent: number
  budgetStatus: 'under' | 'on' | 'over'
  deliveryProgress: { completed: number; total: number }
}

export interface DeliveryItem {
  id: string
  sjNumber: string
  joNumber: string
  origin: string
  destination: string
  driverName: string
  status: 'pending' | 'in_transit' | 'delivered'
}

export interface CostSummary {
  totalBudget: number
  totalSpent: number
  remaining: number
  pendingBkkCount: number
  pendingBkkAmount: number
}

export interface PendingAction {
  type: 'berita_acara' | 'surat_jalan' | 'bkk'
  joId: string
  joNumber: string
  description: string
}
```

### Component Structure
```
components/dashboard/ops/
├── enhanced-ops-dashboard.tsx      # Main container
├── enhanced-summary-cards.tsx      # 5 KPI cards
├── enhanced-active-jobs-table.tsx  # Jobs with budget vs actual
├── delivery-schedule-card.tsx      # Today's deliveries
├── cost-tracking-card.tsx          # Budget usage progress
├── pending-actions-card.tsx        # Actionable items
├── quick-actions-bar.tsx           # Quick action buttons
└── index.ts                        # Exports
```

### Utility Functions
```typescript
// lib/ops-dashboard-enhanced-utils.ts

export async function getEnhancedOpsSummary(): Promise<EnhancedOpsSummary>
export async function getOperationsJobList(): Promise<OperationsJobItem[]>
export async function getDeliverySchedule(): Promise<DeliveryItem[]>
export async function getCostSummary(): Promise<CostSummary>
export async function getPendingOperationsActions(): Promise<PendingAction[]>
export async function getEnhancedOpsDashboardData(): Promise<EnhancedOpsDashboardData>
```

## Security Implementation
- All views use `SECURITY INVOKER` (not DEFINER)
- No revenue/profit fields in any query
- Only budget, estimated, actual, spent amounts exposed
- RLS policies apply through invoker context

## UI Components

### Summary Cards (5 cards)
1. Active Jobs - count with truck icon
2. Today's Deliveries - count with calendar icon
3. Pending Handover - count with clipboard icon
4. Total Budget - IDR formatted with wallet icon
5. Total Spent - IDR formatted with credit card icon

### Active Jobs Table
| JO Number | Customer | Project | Budget | Spent | Status | Deliveries |
|-----------|----------|---------|--------|-------|--------|------------|
| JO-0001   | PT ABC   | Proj X  | Rp 50M | Rp 45M| 🟢     | 3/5        |

### Cost Tracking Card
- Progress bar showing budget usage percentage
- Color coding: green (<80%), yellow (80-100%), red (>100%)
- Remaining budget display
- Pending BKK indicator

### Pending Actions Card
- Grouped by action type
- Each item shows JO number and description
- Click to navigate to action page
