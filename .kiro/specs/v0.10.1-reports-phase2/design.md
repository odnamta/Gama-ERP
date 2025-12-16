# Design Document: Reports Module Phase 2 (v0.10.1)

## Overview

Reports Module Phase 2 extends the foundation from v0.10 with 10 additional reports covering revenue analysis, operational metrics, customer insights, and sales pipeline. It also introduces PDF/Excel export capabilities and chart visualizations using Recharts library.

**New Reports:**
1. Revenue by Customer (sales, manager)
2. Revenue by Project (manager)
3. Cost Analysis by Category (ops, manager)
4. JO Summary (ops, manager)
5. On-Time Delivery Rate (ops, manager)
6. Vendor Performance (ops, manager)
7. Customer Payment History (finance, manager)
8. Outstanding Invoices (finance, manager)
9. Sales Pipeline Analysis (sales, manager)
10. Customer Acquisition (sales, manager)

**New Features:**
- PDF export using @react-pdf/renderer
- Excel export using xlsx library
- Chart visualizations using Recharts

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Reports Module Phase 2                            │
├─────────────────────────────────────────────────────────────────────┤
│  /app/(main)/reports/                                               │
│  ├── revenue-by-customer/page.tsx                                   │
│  ├── revenue-by-project/page.tsx                                    │
│  ├── cost-analysis/page.tsx                                         │
│  ├── jo-summary/page.tsx                                            │
│  ├── on-time-delivery/page.tsx                                      │
│  ├── vendor-performance/page.tsx                                    │
│  ├── customer-payment-history/page.tsx                              │
│  ├── outstanding-invoices/page.tsx                                  │
│  ├── sales-pipeline/page.tsx                                        │
│  └── customer-acquisition/page.tsx                                  │
├─────────────────────────────────────────────────────────────────────┤
│  /components/reports/                                               │
│  ├── charts/                                                        │
│  │   ├── PieChart.tsx                                               │
│  │   ├── BarChart.tsx                                               │
│  │   ├── FunnelChart.tsx                                            │
│  │   └── LineChart.tsx                                              │
│  ├── export/                                                        │
│  │   ├── ExportButtons.tsx                                          │
│  │   ├── PDFTemplate.tsx                                            │
│  │   └── ExcelExport.tsx                                            │
│  └── (existing components from v0.10)                               │
├─────────────────────────────────────────────────────────────────────┤
│  /lib/reports/                                                      │
│  ├── revenue-customer-utils.ts                                      │
│  ├── revenue-project-utils.ts                                       │
│  ├── cost-analysis-utils.ts                                         │
│  ├── jo-summary-utils.ts                                            │
│  ├── on-time-delivery-utils.ts                                      │
│  ├── vendor-performance-utils.ts                                    │
│  ├── payment-history-utils.ts                                       │
│  ├── outstanding-invoices-utils.ts                                  │
│  ├── sales-pipeline-utils.ts                                        │
│  ├── customer-acquisition-utils.ts                                  │
│  └── export-utils.ts                                                │
├─────────────────────────────────────────────────────────────────────┤
│  /types/reports.ts (extended)                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  User    │───▶│ Report Page  │───▶│ Supabase    │───▶│ Raw Data     │
│  Action  │    │ (filters)    │    │ Query       │    │              │
└──────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                                              │
                      ┌───────────────────────────────────────┘
                      ▼
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  UI      │◀───│ Report       │◀───│ Utility     │◀───│ Transform    │
│  Render  │    │ Components   │    │ Functions   │    │ & Calculate  │
└──────────┘    └──────────────┘    └─────────────┘    └──────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Export Flow                                                          │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────┐ │
│  │ Export  │───▶│ Format Data │───▶│ Generate    │───▶│ Download   │ │
│  │ Button  │    │ for Export  │    │ PDF/Excel   │    │ File       │ │
│  └─────────┘    └─────────────┘    └─────────────┘    └────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Chart Components

```typescript
// PieChart for revenue distribution
interface PieChartProps {
  data: { name: string; value: number; color?: string }[];
  title?: string;
  showLegend?: boolean;
  showLabels?: boolean;
}

// BarChart for cost categories
interface BarChartProps {
  data: { category: string; value: number; previousValue?: number }[];
  title?: string;
  showComparison?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

// FunnelChart for sales pipeline
interface FunnelChartProps {
  data: { stage: string; value: number; count: number }[];
  title?: string;
  showPercentages?: boolean;
}

// LineChart for trends
interface LineChartProps {
  data: { date: string; value: number; label?: string }[];
  title?: string;
  showArea?: boolean;
}
```

### Export Components

```typescript
interface ExportButtonsProps {
  reportTitle: string;
  reportData: unknown[];
  columns: ExportColumn[];
  summary?: ExportSummary;
  period: DateRange;
}

interface ExportColumn {
  key: string;
  header: string;
  format?: 'currency' | 'percentage' | 'number' | 'date';
}

interface ExportSummary {
  items: { label: string; value: string | number }[];
}

interface ExportMetadata {
  generatedAt: Date;
  generatedBy: string;
  reportTitle: string;
  period: DateRange;
}
```

## Data Models

### Revenue by Customer
```typescript
interface RevenueByCustomerItem {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  joCount: number;
  percentageOfTotal: number;
}

interface RevenueByCustomerReport {
  items: RevenueByCustomerItem[];
  totalRevenue: number;
  customerCount: number;
  period: DateRange;
}
```

### Revenue by Project
```typescript
interface RevenueByProjectItem {
  projectId: string;
  projectName: string;
  customerName: string;
  totalRevenue: number;
  totalCost: number;
  profitMargin: number;
}

interface RevenueByProjectReport {
  items: RevenueByProjectItem[];
  totalRevenue: number;
  totalCost: number;
  averageMargin: number;
  period: DateRange;
}
```

### Cost Analysis
```typescript
interface CostAnalysisItem {
  category: string;
  totalAmount: number;
  percentageOfTotal: number;
  averagePerJO: number;
  joCount: number;
  previousPeriodAmount?: number;
  changePercentage?: number;
}

interface CostAnalysisReport {
  items: CostAnalysisItem[];
  totalCost: number;
  period: DateRange;
  comparisonPeriod?: DateRange;
}
```

### JO Summary
```typescript
interface JOSummaryItem {
  joId: string;
  joNumber: string;
  customerName: string;
  projectName: string;
  status: JOStatus;
  revenue: number;
  cost: number;
  margin: number;
  completedDate?: Date;
}

interface JOSummaryReport {
  items: JOSummaryItem[];
  totalCount: number;
  totalRevenue: number;
  totalCost: number;
  averageMargin: number;
  statusBreakdown: { status: JOStatus; count: number }[];
  period: DateRange;
}
```

### On-Time Delivery
```typescript
interface OnTimeDeliveryItem {
  joId: string;
  joNumber: string;
  customerName: string;
  scheduledDate: Date;
  completedDate: Date;
  delayDays: number;
  isOnTime: boolean;
}

interface OnTimeDeliveryReport {
  items: OnTimeDeliveryItem[];
  onTimeCount: number;
  lateCount: number;
  onTimePercentage: number;
  averageDelayDays: number;
  period: DateRange;
}
```

### Vendor Performance
```typescript
interface VendorPerformanceItem {
  vendorName: string;
  totalSpend: number;
  joCount: number;
  averageCostPerJO: number;
  onTimeDeliveries: number;
  totalDeliveries: number;
  onTimeRate: number | null; // null when no deliveries
}

interface VendorPerformanceReport {
  items: VendorPerformanceItem[];
  totalSpend: number;
  vendorCount: number;
  period: DateRange;
}
```

### Customer Payment History
```typescript
interface CustomerPaymentItem {
  customerId: string;
  customerName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  averageDaysToPay: number | null; // null when no paid invoices
  isSlowPayer: boolean; // true if avgDays > 45
}

interface CustomerPaymentReport {
  items: CustomerPaymentItem[];
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  period: DateRange;
}
```

### Outstanding Invoices
```typescript
interface OutstandingInvoiceItem {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  joNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  daysOutstanding: number;
  agingBucket: string;
}

interface OutstandingInvoicesReport {
  items: OutstandingInvoiceItem[];
  totalCount: number;
  totalAmount: number;
  bucketBreakdown: { bucket: string; count: number; amount: number }[];
}
```

### Sales Pipeline
```typescript
interface SalesPipelineItem {
  status: PJOStatus;
  count: number;
  totalValue: number;
  percentageOfPipeline: number;
  probability: number;
  weightedValue: number;
}

interface SalesPipelineReport {
  items: SalesPipelineItem[];
  totalPipelineValue: number;
  weightedPipelineValue: number;
  previousPeriodValue?: number;
  changePercentage?: number;
  period: DateRange;
}

// Stage probabilities
const STAGE_PROBABILITIES: Record<PJOStatus, number> = {
  draft: 0.10,
  pending_approval: 0.30,
  approved: 0.70,
  converted: 1.00,
  rejected: 0,
};
```

### Customer Acquisition
```typescript
interface CustomerAcquisitionItem {
  customerId: string;
  customerName: string;
  acquisitionDate: Date;
  firstProject: string | null; // null = "No projects"
  totalRevenueToDate: number;
}

interface CustomerAcquisitionReport {
  items: CustomerAcquisitionItem[];
  totalNewCustomers: number;
  averageRevenuePerCustomer: number;
  previousPeriodCount: number;
  acquisitionTrend: number; // percentage change
  period: DateRange;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Revenue aggregation per customer
*For any* set of completed JOs with customer associations, the Revenue by Customer report should correctly sum revenue per customer, and the sum of all customer revenues should equal the total revenue.
**Validates: Requirements 1.1, 1.2**

### Property 2: Revenue aggregation per project
*For any* set of completed JOs with project associations, the Revenue by Project report should correctly sum revenue and cost per project.
**Validates: Requirements 2.1, 2.2**

### Property 3: Profit margin calculation
*For any* revenue and cost values, the profit margin should equal ((revenue - cost) / revenue * 100), returning 0 when revenue is zero.
**Validates: Requirements 2.3, 2.4**

### Property 4: Cost aggregation per category
*For any* set of cost items with category assignments, the Cost Analysis report should correctly sum costs per category, and the sum of all category costs should equal the total cost.
**Validates: Requirements 3.1, 3.2**

### Property 5: Percentage calculations sum to 100
*For any* report with percentage distributions (Revenue by Customer, Cost Analysis, Sales Pipeline), the percentages should sum to 100% (within floating point tolerance).
**Validates: Requirements 1.2, 3.2, 9.2**

### Property 6: Sorting by amount descending
*For any* report with amount-based sorting (Revenue by Customer, Cost Analysis), items should be ordered from highest to lowest amount.
**Validates: Requirements 1.3, 3.3**

### Property 7: Zero-value filtering
*For any* report that excludes zero values (Revenue by Customer, Cost Analysis), no items with zero amount should appear in the results.
**Validates: Requirements 1.4, 3.5**

### Property 8: JO summary aggregation
*For any* set of JOs within a period, the JO Summary totals should equal the sum of individual JO values, and average margin should equal total profit / total revenue * 100.
**Validates: Requirements 4.1, 4.2, 4.4**

### Property 9: JO status filtering
*For any* JO Summary filtered by status, all returned items should have the specified status.
**Validates: Requirements 4.3**

### Property 10: On-time delivery classification
*For any* JO with scheduled and completed dates, it should be classified as on-time if completed <= scheduled, and late otherwise with correct delay days calculation.
**Validates: Requirements 5.2, 5.3, 5.4**

### Property 11: On-time percentage calculation
*For any* set of classified deliveries, on-time percentage should equal (on-time count / total count * 100), and average delay should be calculated only from late deliveries.
**Validates: Requirements 5.2**

### Property 12: Vendor performance aggregation
*For any* set of cost items with vendor associations, the Vendor Performance report should correctly aggregate spend, JO count, and calculate averages per vendor.
**Validates: Requirements 6.1, 6.2**

### Property 13: Vendor on-time rate calculation
*For any* vendor with delivery data, on-time rate should equal (on-time / total * 100), returning null when total deliveries is zero.
**Validates: Requirements 6.3, 6.4**

### Property 14: Customer payment aggregation
*For any* set of invoices and payments per customer, the report should correctly calculate total invoiced, total paid, and outstanding balance (invoiced - paid).
**Validates: Requirements 7.1, 7.2**

### Property 15: Average days to pay calculation
*For any* set of paid invoices, average days to pay should equal the mean of (payment date - invoice date) in days, returning null when no paid invoices exist.
**Validates: Requirements 7.3, 7.4**

### Property 16: Slow payer threshold
*For any* customer payment item, isSlowPayer should be true if and only if averageDaysToPay exceeds 45 days.
**Validates: Requirements 7.5**

### Property 17: Outstanding invoices listing
*For any* set of unpaid invoices, all should appear in the Outstanding Invoices report with correct days outstanding calculation (today - due date).
**Validates: Requirements 8.1, 8.2**

### Property 18: Outstanding invoices customer filtering
*For any* Outstanding Invoices report filtered by customer, all returned items should belong to the specified customer.
**Validates: Requirements 8.4**

### Property 19: Sales pipeline grouping
*For any* set of PJOs, the Sales Pipeline report should correctly group by status with accurate counts and total values per status.
**Validates: Requirements 9.1, 9.2**

### Property 20: Weighted pipeline value calculation
*For any* pipeline item, weighted value should equal (total value * stage probability), using Draft=10%, Pending=30%, Approved=70%, Converted=100%.
**Validates: Requirements 9.3, 9.4**

### Property 21: Period comparison calculation
*For any* two periods of data, the change percentage should equal ((current - previous) / previous * 100), handling zero previous gracefully.
**Validates: Requirements 3.4, 9.5, 10.4**

### Property 22: Customer acquisition filtering
*For any* set of customers with creation dates, only customers created within the selected period should appear in the Customer Acquisition report.
**Validates: Requirements 10.1**

### Property 23: Export file metadata
*For any* exported file (PDF or Excel), it should contain the report title, period dates, generation timestamp, and user name.
**Validates: Requirements 11.2, 11.3, 11.4**

### Property 24: Role-based report access (Phase 2)
*For any* user role and Phase 2 report configuration, the visible reports should exactly match those where the role is included in the report's allowedRoles array.
**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

## Error Handling

### Data Fetch Errors
- Display error message with specific error type
- Provide "Retry" button
- Log errors for debugging

### Empty Data States
- Revenue by Customer: "No revenue data found for the selected period"
- Revenue by Project: "No project revenue found for the selected period"
- Cost Analysis: "No cost data found for the selected period"
- JO Summary: "No job orders found for the selected period"
- On-Time Delivery: "No completed deliveries found for the selected period"
- Vendor Performance: "No vendor data found for the selected period"
- Customer Payment History: "No payment data found for the selected period"
- Outstanding Invoices: "No outstanding invoices - all accounts are current"
- Sales Pipeline: "No quotations found for the selected period"
- Customer Acquisition: "No new customers acquired in the selected period"

### Export Errors
- Display toast with error message
- Allow retry
- Log export failures

## Testing Strategy

### Unit Tests
- Test individual utility functions with specific examples
- Test edge cases: zero values, empty arrays, null data
- Test date boundary conditions
- Test export file generation

### Property-Based Tests
Using fast-check library with minimum 100 iterations:

1. **Revenue customer aggregation**: Generate random JOs, verify customer sums
2. **Revenue project aggregation**: Generate random JOs, verify project sums
3. **Profit margin calculation**: Generate random revenue/cost, verify formula
4. **Cost category aggregation**: Generate random costs, verify category sums
5. **Percentage sum to 100**: Generate random distributions, verify sum
6. **Descending sort**: Generate random amounts, verify order
7. **Zero filtering**: Generate data with zeros, verify exclusion
8. **JO summary aggregation**: Generate random JOs, verify totals
9. **JO status filtering**: Generate random JOs, verify filter
10. **On-time classification**: Generate random dates, verify classification
11. **On-time percentage**: Generate random counts, verify calculation
12. **Vendor aggregation**: Generate random costs, verify vendor sums
13. **Vendor on-time rate**: Generate random deliveries, verify rate
14. **Payment aggregation**: Generate random invoices, verify balances
15. **Average days to pay**: Generate random payments, verify mean
16. **Slow payer threshold**: Generate random averages, verify flag
17. **Outstanding listing**: Generate random invoices, verify inclusion
18. **Customer filter**: Generate random invoices, verify filter
19. **Pipeline grouping**: Generate random PJOs, verify groups
20. **Weighted value**: Generate random values, verify weights
21. **Period comparison**: Generate random periods, verify change
22. **Acquisition filtering**: Generate random customers, verify dates
23. **Export metadata**: Generate random exports, verify metadata
24. **Role access Phase 2**: Generate random roles, verify access

### Test Configuration
- Property tests run minimum 100 iterations
- Each test tagged: `**Feature: v0.10.1-reports-phase2, Property {N}: {description}**`
- Tests located in `__tests__/` directory with `-utils.test.ts` suffix
