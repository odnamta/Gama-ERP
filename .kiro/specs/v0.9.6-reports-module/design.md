# Design Document: Reports Module (v0.9.6)

## Overview

The Reports Module provides a dedicated section for generating business reports in Gama ERP. It follows a modular architecture with a central report index, individual report pages with shared filtering components, and utility functions for data transformation and calculations.

Phase 1 focuses on four core reports with data tables:
1. Profit & Loss Statement
2. Budget Variance Report
3. AR Aging Report
4. Quotation Conversion Report

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Reports Module                               │
├─────────────────────────────────────────────────────────────────────┤
│  /app/(dashboard)/reports/                                          │
│  ├── page.tsx              (Report Index)                           │
│  ├── layout.tsx            (Reports Layout with breadcrumb)         │
│  ├── profit-loss/page.tsx  (P&L Report)                            │
│  ├── budget-variance/page.tsx (Budget Variance Report)             │
│  ├── ar-aging/page.tsx     (AR Aging Report)                       │
│  └── quotation-conversion/page.tsx (Quotation Conversion Report)   │
├─────────────────────────────────────────────────────────────────────┤
│  /components/reports/                                               │
│  ├── ReportCard.tsx        (Card for report index)                 │
│  ├── ReportFilters.tsx     (Period/date selection)                 │
│  ├── ReportTable.tsx       (Generic data table)                    │
│  ├── ReportSummary.tsx     (Totals/highlights section)             │
│  ├── ReportSkeleton.tsx    (Loading state)                         │
│  └── ReportEmptyState.tsx  (No data state)                         │
├─────────────────────────────────────────────────────────────────────┤
│  /lib/reports/                                                      │
│  ├── report-utils.ts       (Shared utility functions)              │
│  ├── report-permissions.ts (Role-based access control)             │
│  ├── profit-loss-utils.ts  (P&L calculations)                      │
│  ├── budget-variance-utils.ts (Variance calculations)              │
│  ├── ar-aging-utils.ts     (Aging bucket calculations)             │
│  └── quotation-utils.ts    (Conversion rate calculations)          │
├─────────────────────────────────────────────────────────────────────┤
│  /types/reports.ts         (TypeScript interfaces)                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  User    │───▶│ Report Page  │───▶│ Supabase    │───▶│ Raw Data     │
│  Action  │    │ (filters)    │    │ Query       │    │              │
└──────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                                              │
                                                              ▼
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  UI      │◀───│ Report       │◀───│ Utility     │◀───│ Transform    │
│  Render  │    │ Components   │    │ Functions   │    │ & Calculate  │
└──────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

## Components and Interfaces

### ReportCard Component
```typescript
interface ReportCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string; // e.g., "Beta"
}
```
Displays a clickable card on the report index page with icon, title, description, and generate button.

### ReportFilters Component
```typescript
interface ReportFiltersProps {
  defaultPeriod?: PeriodPreset;
  onPeriodChange: (period: DateRange) => void;
  showCustomRange?: boolean;
}

type PeriodPreset = 
  | 'this-week' 
  | 'this-month' 
  | 'last-month' 
  | 'this-quarter' 
  | 'last-quarter' 
  | 'this-year' 
  | 'custom';

interface DateRange {
  startDate: Date;
  endDate: Date;
}
```
Provides period selection with presets and optional custom date range picker.

### ReportTable Component
```typescript
interface ReportTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  pageSize?: number; // default 25
  onRowClick?: (row: T) => void;
  highlightCondition?: (row: T) => 'warning' | 'critical' | null;
}
```
Generic table component with pagination, row highlighting, and click handling.

### ReportSummary Component
```typescript
interface ReportSummaryProps {
  items: SummaryItem[];
  layout?: 'horizontal' | 'vertical';
}

interface SummaryItem {
  label: string;
  value: string | number;
  format?: 'currency' | 'percentage' | 'number';
  highlight?: 'positive' | 'negative' | 'neutral';
}
```
Displays key metrics/totals with optional formatting and highlighting.

## Data Models

### Report Configuration
```typescript
interface ReportConfig {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'operational' | 'ar' | 'sales';
  href: string;
  icon: string;
  allowedRoles: UserRole[];
  badge?: string;
}

const REPORTS: ReportConfig[] = [
  {
    id: 'profit-loss',
    title: 'Profit & Loss Statement',
    description: 'Revenue, costs, and margins by period',
    category: 'financial',
    href: '/reports/profit-loss',
    icon: 'TrendingUp',
    allowedRoles: ['admin', 'manager', 'finance'],
  },
  // ... other reports
];
```

### P&L Report Data
```typescript
interface PLReportData {
  period: DateRange;
  revenue: RevenueGroup[];
  costs: CostGroup[];
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
}

interface RevenueGroup {
  category: string;
  amount: number;
}

interface CostGroup {
  category: string;
  amount: number;
}
```

### Budget Variance Data
```typescript
interface BudgetVarianceItem {
  pjoId: string;
  pjoNumber: string;
  customerName: string;
  estimatedTotal: number;
  actualTotal: number;
  varianceAmount: number;
  variancePercentage: number | null; // null when estimated is 0
  hasWarning: boolean;
}
```

### AR Aging Data
```typescript
interface ARAgingData {
  summary: AgingBucket[];
  details: AgingInvoice[];
}

interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null; // null for 90+
  count: number;
  totalAmount: number;
}

interface AgingInvoice {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  daysOverdue: number;
  bucket: string;
  severity: 'normal' | 'warning' | 'critical';
}
```

### Quotation Conversion Data
```typescript
interface QuotationConversionData {
  statusCounts: StatusCount[];
  conversionRates: ConversionRate[];
  pipelineMetrics: PipelineMetric[];
}

interface StatusCount {
  status: PJOStatus;
  count: number;
  percentage: number;
}

interface ConversionRate {
  from: string;
  to: string;
  rate: number;
}

interface PipelineMetric {
  stage: string;
  averageDays: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role-based report filtering
*For any* user role and report configuration, the visible reports should exactly match those where the role is included in the report's allowedRoles array.
**Validates: Requirements 1.4, 7.1, 7.2, 7.3, 7.4**

### Property 2: P&L data grouping
*For any* set of revenue items and cost items within a date range, the P&L report should group all items by their respective categories with correct sum totals per category.
**Validates: Requirements 2.2, 2.3**

### Property 3: P&L calculations
*For any* total revenue and total cost values, the gross profit should equal (revenue - cost) and gross margin should equal ((revenue - cost) / revenue * 100), with margin returning 0 when revenue is zero.
**Validates: Requirements 2.4, 2.5, 2.6**

### Property 4: Budget variance calculation
*For any* PJO with estimated and actual cost values, the variance amount should equal (actual - estimated) and variance percentage should equal ((actual - estimated) / estimated * 100), with percentage returning null when estimated is zero.
**Validates: Requirements 3.3, 3.5**

### Property 5: Budget variance warning threshold
*For any* budget variance item, the hasWarning flag should be true if and only if the variance percentage exceeds 10%.
**Validates: Requirements 3.4**

### Property 6: Aging bucket assignment
*For any* unpaid invoice with a due date, the invoice should be assigned to exactly one aging bucket based on days overdue: Current (not overdue), 1-30, 31-60, 61-90, or 90+ days.
**Validates: Requirements 4.1**

### Property 7: Aging bucket aggregation
*For any* set of invoices assigned to aging buckets, each bucket's count should equal the number of invoices in that bucket, and totalAmount should equal the sum of invoice amounts in that bucket.
**Validates: Requirements 4.2**

### Property 8: Aging severity styling
*For any* invoice, the severity should be 'critical' if 90+ days overdue, 'warning' if 31-89 days overdue, and 'normal' otherwise.
**Validates: Requirements 4.4, 4.5**

### Property 9: Quotation status counts
*For any* set of PJOs within a date range, the status counts should accurately reflect the number of PJOs in each status, and percentages should sum to 100%.
**Validates: Requirements 5.1**

### Property 10: Conversion rate calculation
*For any* starting count and converted count, the conversion rate should equal (converted / starting * 100), with rate returning 0 when starting count is zero.
**Validates: Requirements 5.2, 5.3**

### Property 11: Pagination
*For any* dataset with n items and page size of 25, the number of pages should equal ceil(n / 25), and each page (except possibly the last) should contain exactly 25 items.
**Validates: Requirements 6.4**

### Property 12: Date range validation
*For any* date range where end date is before start date, the validation should return an error and prevent report generation.
**Validates: Requirements 8.3**

## Error Handling

### Data Fetch Errors
- Display error message with specific error type (network, timeout, server error)
- Provide "Retry" button that re-executes the query
- Log errors to console for debugging

### Empty Data States
- P&L: "No transactions found for the selected period"
- Budget Variance: "No PJOs found for the selected period"
- AR Aging: "No unpaid invoices found - all accounts are current"
- Quotation Conversion: "No quotations found for the selected period"

### Permission Errors
- Redirect to /reports with toast message: "You don't have permission to access this report"
- Log unauthorized access attempts

## Testing Strategy

### Unit Tests
- Test individual utility functions with specific examples
- Test edge cases: zero values, empty arrays, null data
- Test date boundary conditions

### Property-Based Tests
The following properties will be tested using fast-check library:

1. **Role filtering property**: Generate random role/report combinations, verify filtering logic
2. **P&L grouping property**: Generate random revenue/cost items, verify grouping and sums
3. **P&L calculation property**: Generate random revenue/cost totals, verify calculations
4. **Variance calculation property**: Generate random estimated/actual pairs, verify variance
5. **Variance warning property**: Generate random variance percentages, verify threshold
6. **Aging bucket property**: Generate random invoice due dates, verify bucket assignment
7. **Aging aggregation property**: Generate random invoice sets, verify counts and sums
8. **Aging severity property**: Generate random days overdue, verify severity assignment
9. **Status count property**: Generate random PJO sets, verify counts and percentages
10. **Conversion rate property**: Generate random count pairs, verify rate calculation
11. **Pagination property**: Generate random dataset sizes, verify page calculations
12. **Date validation property**: Generate random date pairs, verify validation

### Test Configuration
- Property tests run minimum 100 iterations
- Each test tagged with format: `**Feature: v0.9.6-reports-module, Property {N}: {description}**`
- Tests located in `__tests__/reports-utils.test.ts`

