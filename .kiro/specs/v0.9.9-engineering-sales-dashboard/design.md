# Design Document: Engineering/Sales Dashboard (v0.9.9)

## Overview

This feature implements a combined Engineering/Sales Dashboard for Hutami (Marketing Manager) who manages both Marketing/Sales and Engineering functions. The dashboard provides unified visibility into the sales pipeline and engineering workload, enabling tracking of quotations from RFQ to award while monitoring technical assessments for complex projects.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Main Dashboard Layout                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  DashboardHeader: Greeting + Last Updated + Refresh Button              ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  TabNavigation: [Sales Pipeline] [Engineering] [Combined View]          ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  SALES PIPELINE TAB                                                      ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  SalesPipelineCards: Draft | Eng Review | Submitted | Won | Win Rate│││
│  │  ├─────────────────────────────────────────────────────────────────────┤││
│  │  │  PipelineFunnelChart: Horizontal bar visualization                  │││
│  │  ├─────────────────────────────────────────────────────────────────────┤││
│  │  │  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │││
│  │  │  │ UrgentQuotations    │  │ EngineeringWorkloadCard             │  │││
│  │  │  │ (Deadline ≤7 days)  │  │ (Pending by type + Complex count)  │  │││
│  │  │  └─────────────────────┘  └─────────────────────────────────────┘  │││
│  │  ├─────────────────────────────────────────────────────────────────────┤││
│  │  │  RecentQuotationsTable: Quote# | Customer | Value | Status | Eng   │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  QuickActionsBar: [New Quotation] [Start Assessment] [Follow Up] [Report]│
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Materialized View: sales_pipeline_summary

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS sales_pipeline_summary AS
SELECT
  -- Pipeline by status
  (SELECT COUNT(*) FROM quotations WHERE status = 'draft' AND is_active = true) as draft_count,
  (SELECT COALESCE(SUM(total_revenue), 0) FROM quotations WHERE status = 'draft' AND is_active = true) as draft_value,
  (SELECT COUNT(*) FROM quotations WHERE status = 'engineering_review' AND is_active = true) as eng_review_count,
  (SELECT COALESCE(SUM(total_revenue), 0) FROM quotations WHERE status = 'engineering_review' AND is_active = true) as eng_review_value,
  (SELECT COUNT(*) FROM quotations WHERE status = 'submitted' AND is_active = true) as submitted_count,
  (SELECT COALESCE(SUM(total_revenue), 0) FROM quotations WHERE status = 'submitted' AND is_active = true) as submitted_value,
  -- Won/Lost this month
  (SELECT COUNT(*) FROM quotations WHERE status = 'won' AND updated_at >= DATE_TRUNC('month', CURRENT_DATE) AND is_active = true) as won_mtd,
  (SELECT COALESCE(SUM(total_revenue), 0) FROM quotations WHERE status = 'won' AND updated_at >= DATE_TRUNC('month', CURRENT_DATE) AND is_active = true) as won_value_mtd,
  (SELECT COUNT(*) FROM quotations WHERE status = 'lost' AND updated_at >= DATE_TRUNC('month', CURRENT_DATE) AND is_active = true) as lost_mtd,
  -- Win rate (90 days)
  (SELECT 
    CASE WHEN (won_count + lost_count) > 0 
      THEN ROUND(won_count::NUMERIC / (won_count + lost_count) * 100, 1)
      ELSE 0 
    END
   FROM (
     SELECT 
       COUNT(*) FILTER (WHERE status = 'won') as won_count,
       COUNT(*) FILTER (WHERE status = 'lost') as lost_count
     FROM quotations
     WHERE updated_at >= CURRENT_DATE - INTERVAL '90 days'
       AND is_active = true
   ) sub
  ) as win_rate_90d,
  -- Pursuit costs this month
  (SELECT COALESCE(SUM(amount), 0) FROM pursuit_costs
   WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as pursuit_costs_mtd,
  NOW() as calculated_at;
```

### Materialized View: engineering_workload_summary

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS engineering_workload_summary AS
SELECT
  -- Pending assessments total
  (SELECT COUNT(*) FROM engineering_assessments WHERE status IN ('pending', 'in_progress')) as pending_assessments,
  -- By type
  (SELECT COUNT(*) FROM engineering_assessments WHERE assessment_type = 'route_survey' AND status IN ('pending', 'in_progress')) as pending_surveys,
  (SELECT COUNT(*) FROM engineering_assessments WHERE assessment_type = 'technical_review' AND status IN ('pending', 'in_progress')) as pending_technical,
  (SELECT COUNT(*) FROM engineering_assessments WHERE assessment_type = 'jmp_creation' AND status IN ('pending', 'in_progress')) as pending_jmp,
  -- Completed this month
  (SELECT COUNT(*) FROM engineering_assessments WHERE status = 'completed' AND completed_at >= DATE_TRUNC('month', CURRENT_DATE)) as completed_mtd,
  -- Complex projects in pipeline
  (SELECT COUNT(*) FROM quotations WHERE market_type = 'complex' AND status NOT IN ('won', 'lost', 'cancelled') AND is_active = true) as complex_in_pipeline,
  NOW() as calculated_at;
```

### View: quotation_dashboard_list

```sql
CREATE OR REPLACE VIEW quotation_dashboard_list AS
SELECT 
  q.id,
  q.quotation_number,
  q.rfq_number,
  c.name as customer_name,
  q.commodity as cargo_description,
  q.total_revenue,
  q.profit_margin as gross_margin,
  q.status,
  q.market_type,
  q.rfq_deadline as submission_deadline,
  q.created_at,
  -- Engineering status
  CASE 
    WHEN q.market_type = 'simple' THEN 'not_required'
    WHEN EXISTS (SELECT 1 FROM engineering_assessments ea WHERE ea.quotation_id = q.id AND ea.status = 'completed') THEN 'completed'
    WHEN EXISTS (SELECT 1 FROM engineering_assessments ea WHERE ea.quotation_id = q.id AND ea.status = 'in_progress') THEN 'in_progress'
    ELSE 'pending'
  END as engineering_status,
  -- Days until deadline
  CASE 
    WHEN q.rfq_deadline IS NOT NULL THEN q.rfq_deadline - CURRENT_DATE
    ELSE NULL
  END as days_to_deadline
FROM quotations q
JOIN customers c ON q.customer_id = c.id
WHERE q.is_active = true
  AND q.status NOT IN ('won', 'lost', 'cancelled')
ORDER BY 
  CASE WHEN q.rfq_deadline IS NOT NULL THEN 0 ELSE 1 END,
  q.rfq_deadline,
  q.created_at DESC;
```

### Refresh Function

```sql
CREATE OR REPLACE FUNCTION refresh_sales_engineering_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW sales_pipeline_summary;
  REFRESH MATERIALIZED VIEW engineering_workload_summary;
END;
$$ LANGUAGE plpgsql;
```

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_quotations_submission_deadline ON quotations(rfq_deadline) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_quotations_status_active ON quotations(status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_engineering_assessments_quotation_status ON engineering_assessments(quotation_id, status);
```

## Component Interfaces

### Types

```typescript
// lib/sales-engineering-dashboard-utils.ts

export interface SalesPipelineSummary {
  draftCount: number
  draftValue: number
  engReviewCount: number
  engReviewValue: number
  submittedCount: number
  submittedValue: number
  wonMTD: number
  wonValueMTD: number
  lostMTD: number
  winRate90d: number
  pursuitCostsMTD: number
  calculatedAt: string
}

export interface EngineeringWorkloadSummary {
  pendingAssessments: number
  pendingSurveys: number
  pendingTechnical: number
  pendingJMP: number
  completedMTD: number
  complexInPipeline: number
  calculatedAt: string
}

export interface QuotationListItem {
  id: string
  quotationNumber: string
  rfqNumber: string | null
  customerName: string
  cargoDescription: string | null
  totalRevenue: number
  grossMargin: number | null
  status: QuotationStatus
  marketType: 'simple' | 'complex'
  submissionDeadline: string | null
  createdAt: string
  engineeringStatus: 'not_required' | 'pending' | 'in_progress' | 'completed'
  daysToDeadline: number | null
}

export type QuotationStatus = 'draft' | 'engineering_review' | 'ready' | 'submitted' | 'won' | 'lost' | 'cancelled'

export interface SalesEngineeringDashboardData {
  salesSummary: SalesPipelineSummary
  engineeringSummary: EngineeringWorkloadSummary
  urgentQuotations: QuotationListItem[]
  recentQuotations: QuotationListItem[]
  isStale: boolean
}

export type DashboardTab = 'sales' | 'engineering' | 'combined'
```

### Component Structure

```
components/
├── dashboard/
│   ├── sales-engineering/
│   │   ├── index.ts                           # Exports
│   │   ├── sales-engineering-dashboard.tsx    # Main container
│   │   ├── dashboard-header.tsx               # Greeting + refresh
│   │   ├── tab-navigation.tsx                 # Tab switcher
│   │   ├── sales-pipeline-cards.tsx           # 5 KPI cards
│   │   ├── pipeline-funnel-chart.tsx          # Horizontal bar chart
│   │   ├── urgent-quotations-card.tsx         # Deadline approaching list
│   │   ├── engineering-workload-card.tsx      # Assessment breakdown
│   │   ├── recent-quotations-table.tsx        # Quotation list table
│   │   └── quick-actions-bar.tsx              # Action buttons
```

## Utility Functions

```typescript
// lib/sales-engineering-dashboard-utils.ts

/**
 * Calculate total pipeline value (draft + eng_review + submitted)
 * Property 1: Pipeline Value Calculation
 */
export function calculateTotalPipelineValue(summary: SalesPipelineSummary): number

/**
 * Calculate total pipeline count
 * Property 1: Pipeline Count Calculation
 */
export function calculateTotalPipelineCount(summary: SalesPipelineSummary): number

/**
 * Check if quotation deadline is urgent (≤7 days)
 * Property 2: Urgent Deadline Detection
 */
export function isDeadlineUrgent(daysToDeadline: number | null): boolean

/**
 * Check if quotation deadline is critical (≤3 days)
 * Property 3: Critical Deadline Detection
 */
export function isDeadlineCritical(daysToDeadline: number | null): boolean

/**
 * Filter quotations with upcoming deadlines
 * Property 4: Urgent Quotations Filter
 */
export function filterUrgentQuotations(
  quotations: QuotationListItem[],
  maxDays: number
): QuotationListItem[]

/**
 * Get engineering status display info (icon, label, color)
 * Property 5: Engineering Status Display
 */
export function getEngineeringStatusDisplay(status: string): {
  icon: string
  label: string
  colorClass: string
}

/**
 * Calculate win rate from won and lost counts
 * Property 6: Win Rate Calculation
 */
export function calculateWinRate(won: number, lost: number): number

/**
 * Check if dashboard data is stale (>5 minutes old)
 * Property 7: Staleness Detection
 */
export function isDashboardStale(calculatedAt: string, currentDate?: Date): boolean

/**
 * Format pipeline stage for funnel chart
 * Property 8: Pipeline Funnel Data
 */
export function formatPipelineFunnelData(summary: SalesPipelineSummary): PipelineFunnelItem[]

/**
 * Group assessments by type for workload display
 * Property 9: Assessment Type Grouping
 */
export function groupAssessmentsByType(summary: EngineeringWorkloadSummary): AssessmentTypeGroup[]

/**
 * Sort quotations by deadline urgency
 * Property 10: Quotation Sorting
 */
export function sortByDeadlineUrgency(quotations: QuotationListItem[]): QuotationListItem[]
```

## Server Actions

```typescript
// app/(main)/dashboard/sales-engineering-actions.ts

'use server'

/**
 * Get complete sales/engineering dashboard data
 */
export async function getSalesEngineeringDashboardData(): Promise<SalesEngineeringDashboardData>

/**
 * Refresh dashboard materialized views
 */
export async function refreshSalesEngineeringDashboard(): Promise<void>

/**
 * Get urgent quotations (deadline within N days)
 */
export async function getUrgentQuotations(maxDays: number): Promise<QuotationListItem[]>

/**
 * Get recent quotations for table display
 */
export async function getRecentQuotations(limit: number): Promise<QuotationListItem[]>

/**
 * Get pending engineering assessments
 */
export async function getPendingAssessments(limit: number): Promise<EngineeringAssessment[]>
```

## Correctness Properties

### Property 1: Pipeline Value and Count Calculation
*For any* sales pipeline summary, the total pipeline value SHALL equal draftValue + engReviewValue + submittedValue, and total count SHALL equal draftCount + engReviewCount + submittedCount
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Urgent Deadline Detection
*For any* quotation with daysToDeadline ≤ 7 and daysToDeadline ≥ 0, isDeadlineUrgent SHALL return true; otherwise false
**Validates: Requirements 4.1**

### Property 3: Critical Deadline Detection
*For any* quotation with daysToDeadline ≤ 3 and daysToDeadline ≥ 0, isDeadlineCritical SHALL return true; otherwise false
**Validates: Requirements 4.4**

### Property 4: Urgent Quotations Filter
*For any* list of quotations, filterUrgentQuotations SHALL return only quotations where daysToDeadline is not null and daysToDeadline ≤ maxDays and daysToDeadline ≥ 0
**Validates: Requirements 4.1, 4.3**

### Property 5: Engineering Status Display
*For any* engineering status, getEngineeringStatusDisplay SHALL return: 'completed' → ✅, 'in_progress' → 🔄, 'pending' → ⏳, 'not_required' → N/A
**Validates: Requirements 6.3**

### Property 6: Win Rate Calculation
*For any* won and lost counts, win rate SHALL equal (won / (won + lost)) × 100 when (won + lost) > 0, otherwise 0
**Validates: Requirements 2.5**

### Property 7: Staleness Detection
*For any* calculatedAt timestamp, isDashboardStale SHALL return true if current time - calculatedAt > 5 minutes
**Validates: Requirements 8.1, 8.3**

### Property 8: Pipeline Funnel Data
*For any* sales summary, formatPipelineFunnelData SHALL return exactly 3 items in order: Draft, Eng Review, Submitted with correct counts and values
**Validates: Requirements 3.1, 3.2**

### Property 9: Assessment Type Grouping
*For any* engineering summary, groupAssessmentsByType SHALL return groups for surveys, technical, and JMP with correct counts
**Validates: Requirements 5.2**

### Property 10: Quotation Sorting
*For any* list of quotations, sortByDeadlineUrgency SHALL sort by daysToDeadline ascending (nulls last)
**Validates: Requirements 4.1**

### Property 11: Dashboard Routing
*For any* user with role='sales' OR email='hutamiarini@gama-group.co', the dashboard router SHALL display the Sales/Engineering Dashboard
**Validates: Requirements 1.1**

## Error Handling

| Scenario | Handling |
|----------|----------|
| No quotations in pipeline | Show empty state with "No active quotations" message |
| No urgent quotations | Show "No urgent deadlines" message |
| No pending assessments | Show "All assessments complete" message |
| Materialized view refresh fails | Show error toast, display cached data |
| Database query fails | Show error state with retry button |
| Unauthorized access | Redirect to appropriate dashboard with toast |

## Testing Strategy

### Unit Tests (Property-Based with fast-check)
- Property 1: Pipeline value/count calculation
- Property 2: Urgent deadline detection
- Property 3: Critical deadline detection
- Property 4: Urgent quotations filter
- Property 5: Engineering status display
- Property 6: Win rate calculation
- Property 7: Staleness detection
- Property 8: Pipeline funnel data formatting
- Property 9: Assessment type grouping
- Property 10: Quotation sorting

### Integration Tests
- Dashboard renders with mock data
- Tab navigation works correctly
- Refresh button triggers data reload
- Quick action buttons navigate correctly
- Table sorting and filtering works

## UI Mockup Reference

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 👋 Good morning, Hutami                                  Last updated: 2 min ago [🔄]      │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│ TABS: [📈 Sales Pipeline] [🔧 Engineering] [Combined View]                                 │
│                                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════════════════    │
│ SALES PIPELINE                                                         December 2025       │
│ ═══════════════════════════════════════════════════════════════════════════════════════    │
│                                                                                             │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│ │ 📝 Draft      │ │ 🔧 Eng Review │ │ 📤 Submitted  │ │ ✅ Won MTD    │ │ 📉 Win Rate   │ │
│ │               │ │               │ │               │ │               │ │               │ │
│ │      5        │ │      3        │ │      8        │ │      4        │ │    67%        │ │
│ │ Rp 2.5B       │ │ Rp 1.8B       │ │ Rp 4.2B       │ │ Rp 1.2B       │ │ (90 days)     │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ │
│                                                                                             │
│ PIPELINE FUNNEL                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────┐│
│ │ Draft          ████████████████████████████████████████████████████ Rp 2.5B (5)        ││
│ │ Eng Review     ████████████████████████████████████ Rp 1.8B (3)                        ││
│ │ Submitted      ████████████████████████████████████████████████████████████ Rp 4.2B (8)││
│ └─────────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                             │
│ ┌────────────────────────────────────────┐ ┌────────────────────────────────────────────┐ │
│ │ URGENT: DEADLINE APPROACHING       🔔 │ │ ENGINEERING WORKLOAD                       │ │
│ │ ──────────────────────────────────────│ │ ──────────────────────────────────────────│ │
│ │                                        │ │                                            │ │
│ │ ┌──────────────────────────────────┐  │ │ Pending Assessments:           7           │ │
│ │ │ QUO-2025-0089  PT. Freeport     │  │ │ ┌──────────────────────────────────────┐   │ │
│ │ │ Pipe Transport  Rp 850M        │  │ │ │ Surveys        ███░░░ 3              │   │ │
│ │ │ ⏰ 2 days left          [→]    │  │ │ │ Technical      ██░░░░ 2              │   │ │
│ │ ├──────────────────────────────────┤  │ │ │ JMP            ██░░░░ 2              │   │ │
│ │ │ QUO-2025-0092  PT. IKPT        │  │ │ └──────────────────────────────────────┘   │ │
│ │ │ Heavy Lift     Rp 1.2B         │  │ │                                            │ │
│ │ │ ⏰ 5 days left          [→]    │  │ │ Complex Projects in Pipeline:    4         │ │
│ │ └──────────────────────────────────┘  │ │                                            │ │
│ │                                        │ │ [View Engineering Queue →]                │ │
│ │ [View All Quotations →]               │ │                                            │ │
│ └────────────────────────────────────────┘ └────────────────────────────────────────────┘ │
│                                                                                             │
│ RECENT QUOTATIONS                                                                           │
│ ───────────────────────────────────────────────────────────────────────────────────────    │
│                                                                                             │
│ ┌───────────┬────────────────┬─────────────┬─────────────┬────────────┬────────┬────────┐ │
│ │ Quote #   │ Customer       │ Value       │ Margin      │ Status     │ Eng    │ Action │ │
│ ├───────────┼────────────────┼─────────────┼─────────────┼────────────┼────────┼────────┤ │
│ │QUO-0089   │ PT. Freeport   │ Rp 850M     │ 22%         │ Submitted  │ ✅     │ [View] │ │
│ │QUO-0092   │ PT. IKPT       │ Rp 1.2B     │ 18%         │ Eng Review │ 🔄     │ [View] │ │
│ │QUO-0095   │ PT. Petrosea   │ Rp 450M     │ 25%         │ Draft      │ N/A    │ [Edit] │ │
│ │QUO-0096   │ PT. Semen ID   │ Rp 680M     │ 20%         │ Draft      │ ⏳     │ [Edit] │ │
│ └───────────┴────────────────┴─────────────┴─────────────┴────────────┴────────┴────────┘ │
│                                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════════════════    │
│ QUICK ACTIONS                                                                               │
│ ═══════════════════════════════════════════════════════════════════════════════════════    │
│                                                                                             │
│ [➕ New Quotation] [📋 Start Assessment] [📧 Follow Up] [📊 Pipeline Report]               │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```
