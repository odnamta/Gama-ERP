# Design Document: Reports Module Foundation (v0.27)

## Overview

This design document describes the architecture for enhancing the existing Reports Module with database-driven configuration, execution logging, and improved report management. The system builds upon the existing report infrastructure while adding centralized configuration storage, audit trails, and enhanced filtering capabilities.

The current implementation uses a static `REPORTS` array in `lib/reports/report-permissions.ts`. This enhancement introduces database tables for dynamic configuration and execution tracking while maintaining backward compatibility with existing report pages.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Reports Module                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Reports Hub  │───▶│ Report Page  │───▶│ Export (PDF/Excel)   │  │
│  │ /reports     │    │ /reports/:id │    │                      │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                   │                      │                │
│         ▼                   ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Report Services Layer                     │   │
│  │  - getReportConfigurations()                                │   │
│  │  - logReportExecution()                                     │   │
│  │  - getRecentReports()                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                   │                      │                │
│         ▼                   ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Supabase Database                       │   │
│  │  - report_configurations                                    │   │
│  │  - report_executions                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User navigates to Reports Hub
2. System fetches report configurations filtered by user role
3. User selects a report to run
4. System logs execution and displays report
5. User optionally exports to PDF/Excel
6. System logs export action

## Components and Interfaces

### Database Schema

#### report_configurations Table

```sql
CREATE TABLE report_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_code VARCHAR(50) UNIQUE NOT NULL,
  report_name VARCHAR(200) NOT NULL,
  description TEXT,
  report_category VARCHAR(50) NOT NULL,
  default_filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  allowed_roles TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  href VARCHAR(200),
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE report_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users"
  ON report_configurations FOR SELECT
  TO authenticated
  USING (is_active = true);
```

#### report_executions Table

```sql
CREATE TABLE report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_code VARCHAR(50) NOT NULL,
  parameters JSONB DEFAULT '{}',
  executed_by UUID REFERENCES user_profiles(id),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  export_format VARCHAR(20),
  export_url VARCHAR(500)
);

CREATE INDEX idx_report_executions_code ON report_executions(report_code);
CREATE INDEX idx_report_executions_user ON report_executions(executed_by);
CREATE INDEX idx_report_executions_date ON report_executions(executed_at DESC);

-- RLS Policy
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own executions"
  ON report_executions FOR SELECT
  TO authenticated
  USING (executed_by = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'manager')
  ));

CREATE POLICY "Users can insert their own executions"
  ON report_executions FOR INSERT
  TO authenticated
  WITH CHECK (executed_by = auth.uid());
```

### TypeScript Interfaces

```typescript
// types/reports.ts - Extended types

export type ReportCategoryDB = 'operations' | 'finance' | 'sales' | 'executive'

export interface ReportConfigurationDB {
  id: string
  report_code: string
  report_name: string
  description: string | null
  report_category: ReportCategoryDB
  default_filters: Record<string, unknown>
  columns: ReportColumnConfig[]
  allowed_roles: string[]
  is_active: boolean
  display_order: number
  href: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface ReportColumnConfig {
  key: string
  header: string
  format?: 'currency' | 'percentage' | 'number' | 'date' | 'text'
  align?: 'left' | 'center' | 'right'
  width?: string
}

export interface ReportExecution {
  id: string
  report_code: string
  parameters: Record<string, unknown>
  executed_by: string
  executed_at: string
  export_format: 'view' | 'pdf' | 'excel' | 'csv' | null
  export_url: string | null
}

export interface RecentReport {
  report_code: string
  report_name: string
  href: string
  executed_at: string
}
```

### Service Layer

```typescript
// lib/reports/report-config-service.ts

interface ReportConfigService {
  // Get all active report configurations for a user role
  getReportConfigurations(role: string): Promise<ReportConfigurationDB[]>
  
  // Get a single report configuration by code
  getReportByCode(code: string): Promise<ReportConfigurationDB | null>
  
  // Check if user can access a report
  canAccessReport(role: string, reportCode: string): Promise<boolean>
  
  // Get reports grouped by category
  getReportsByCategory(role: string): Promise<Record<ReportCategoryDB, ReportConfigurationDB[]>>
  
  // Log a report execution
  logExecution(params: {
    reportCode: string
    userId: string
    parameters?: Record<string, unknown>
    exportFormat?: 'view' | 'pdf' | 'excel' | 'csv'
  }): Promise<void>
  
  // Get recent reports for a user
  getRecentReports(userId: string, limit?: number): Promise<RecentReport[]>
}
```

### Component Structure

```
components/reports/
├── ReportCard.tsx           # Existing - Report card in hub
├── ReportEmptyState.tsx     # Existing - Empty state display
├── ReportFilters.tsx        # Existing - Filter controls
├── ReportSkeleton.tsx       # Existing - Loading skeleton
├── ReportSummary.tsx        # Existing - Summary display
├── ReportTable.tsx          # Existing - Data table
├── ReportHub.tsx            # New - Enhanced hub with search/recent
├── RecentReportsBar.tsx     # New - Recently run reports display
├── ReportSearchInput.tsx    # New - Search input for reports
└── index.ts                 # Barrel export
```

## Data Models

### Default Report Configurations

```typescript
const DEFAULT_REPORTS: Partial<ReportConfigurationDB>[] = [
  // Operations Reports
  {
    report_code: 'ops_job_summary',
    report_name: 'Job Order Summary',
    description: 'Overview of all jobs with key metrics',
    report_category: 'operations',
    allowed_roles: ['owner', 'admin', 'manager', 'ops'],
    display_order: 1,
    href: '/reports/jo-summary',
    icon: 'ClipboardList',
  },
  {
    report_code: 'ops_budget_variance',
    report_name: 'Budget Variance Report',
    description: 'Estimated vs actual costs per PJO',
    report_category: 'operations',
    allowed_roles: ['owner', 'admin', 'manager', 'ops'],
    display_order: 2,
    href: '/reports/budget-variance',
    icon: 'BarChart3',
  },
  {
    report_code: 'ops_on_time_delivery',
    report_name: 'On-Time Delivery',
    description: 'Delivery performance metrics',
    report_category: 'operations',
    allowed_roles: ['owner', 'admin', 'manager', 'ops'],
    display_order: 3,
    href: '/reports/on-time-delivery',
    icon: 'Clock',
  },
  {
    report_code: 'ops_vendor_performance',
    report_name: 'Vendor Performance',
    description: 'Vendor spend and performance analysis',
    report_category: 'operations',
    allowed_roles: ['owner', 'admin', 'manager', 'ops'],
    display_order: 4,
    href: '/reports/vendor-performance',
    icon: 'Truck',
  },
  // Finance Reports
  {
    report_code: 'fin_profit_loss',
    report_name: 'Profit & Loss Statement',
    description: 'Revenue, costs, and margins by period',
    report_category: 'finance',
    allowed_roles: ['owner', 'admin', 'manager', 'finance'],
    display_order: 10,
    href: '/reports/profit-loss',
    icon: 'TrendingUp',
  },
  {
    report_code: 'fin_ar_aging',
    report_name: 'AR Aging Report',
    description: 'Outstanding invoices by age bucket',
    report_category: 'finance',
    allowed_roles: ['owner', 'admin', 'manager', 'finance'],
    display_order: 11,
    href: '/reports/ar-aging',
    icon: 'Clock',
  },
  {
    report_code: 'fin_outstanding_invoices',
    report_name: 'Outstanding Invoices',
    description: 'All unpaid invoices',
    report_category: 'finance',
    allowed_roles: ['owner', 'admin', 'manager', 'finance'],
    display_order: 12,
    href: '/reports/outstanding-invoices',
    icon: 'FileText',
  },
  {
    report_code: 'fin_cost_analysis',
    report_name: 'Cost Analysis by Category',
    description: 'Detailed cost breakdown by category',
    report_category: 'finance',
    allowed_roles: ['owner', 'admin', 'manager', 'finance'],
    display_order: 13,
    href: '/reports/cost-analysis',
    icon: 'PieChart',
  },
  {
    report_code: 'fin_revenue_customer',
    report_name: 'Revenue by Customer',
    description: 'Revenue breakdown by customer',
    report_category: 'finance',
    allowed_roles: ['owner', 'admin', 'manager', 'finance', 'sales'],
    display_order: 14,
    href: '/reports/revenue-by-customer',
    icon: 'Users',
  },
  {
    report_code: 'fin_revenue_project',
    report_name: 'Revenue by Project',
    description: 'Revenue and profit analysis by project',
    report_category: 'finance',
    allowed_roles: ['owner', 'admin', 'manager'],
    display_order: 15,
    href: '/reports/revenue-by-project',
    icon: 'FolderKanban',
  },
  {
    report_code: 'fin_payment_history',
    report_name: 'Customer Payment History',
    description: 'Payment patterns and slow payer analysis',
    report_category: 'finance',
    allowed_roles: ['owner', 'admin', 'manager', 'finance'],
    display_order: 16,
    href: '/reports/customer-payment-history',
    icon: 'CreditCard',
  },
  // Sales Reports
  {
    report_code: 'sales_pipeline',
    report_name: 'Sales Pipeline Analysis',
    description: 'PJO pipeline stages and weighted values',
    report_category: 'sales',
    allowed_roles: ['owner', 'admin', 'manager', 'sales'],
    display_order: 20,
    href: '/reports/sales-pipeline',
    icon: 'TrendingUp',
  },
  {
    report_code: 'sales_quotation_conversion',
    report_name: 'Quotation Conversion Rate',
    description: 'PJO conversion and pipeline analysis',
    report_category: 'sales',
    allowed_roles: ['owner', 'admin', 'manager', 'sales'],
    display_order: 21,
    href: '/reports/quotation-conversion',
    icon: 'TrendingUp',
  },
  {
    report_code: 'sales_customer_acquisition',
    report_name: 'Customer Acquisition',
    description: 'New customer trends and revenue analysis',
    report_category: 'sales',
    allowed_roles: ['owner', 'admin', 'manager', 'sales'],
    display_order: 22,
    href: '/reports/customer-acquisition',
    icon: 'UserPlus',
  },
  // Executive Reports
  {
    report_code: 'exec_kpi_dashboard',
    report_name: 'KPI Dashboard',
    description: 'Key performance indicators overview',
    report_category: 'executive',
    allowed_roles: ['owner', 'admin', 'manager'],
    display_order: 30,
    href: '/reports/kpi-dashboard',
    icon: 'LayoutDashboard',
  },
]
```

### Category Display Configuration

```typescript
const CATEGORY_CONFIG: Record<ReportCategoryDB, { name: string; icon: string }> = {
  operations: { name: 'Operations', icon: 'Settings' },
  finance: { name: 'Finance', icon: 'DollarSign' },
  sales: { name: 'Sales', icon: 'TrendingUp' },
  executive: { name: 'Executive', icon: 'LayoutDashboard' },
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Report Code Uniqueness

*For any* two report configurations in the database, their report_code values must be different.

**Validates: Requirements 1.3**

### Property 2: Role-Based Report Visibility

*For any* user with a given role and any report configuration, the report is visible to the user if and only if the user's role is contained in the report's allowed_roles array.

**Validates: Requirements 3.1, 4.1**

### Property 3: Admin Roles Full Access

*For any* report configuration in the default seed data, the allowed_roles array must contain 'owner', 'admin', and 'manager'.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 4: Category-Specific Role Restrictions

*For any* report configuration:
- If report_category is 'finance', allowed_roles must be a subset of ['owner', 'admin', 'manager', 'finance']
- If report_category is 'operations', allowed_roles must be a subset of ['owner', 'admin', 'manager', 'ops']
- If report_category is 'sales', allowed_roles must be a subset of ['owner', 'admin', 'manager', 'sales']

**Validates: Requirements 4.5, 4.6, 4.7**

### Property 5: Report Execution Logging

*For any* report run action, a corresponding report_execution record must be created with the correct report_code, executed_by, and executed_at timestamp.

**Validates: Requirements 2.2**

### Property 6: Export Format Validation

*For any* report_execution record, the export_format field must be one of: 'view', 'pdf', 'excel', 'csv', or null.

**Validates: Requirements 2.3**

### Property 7: Report Search Filtering

*For any* search query string and set of reports, the filtered results must only include reports where the query appears in either the report_name or description (case-insensitive).

**Validates: Requirements 3.4**

### Property 8: Report Category Ordering

*For any* list of reports within a single category, the reports must be sorted by display_order in ascending order.

**Validates: Requirements 3.6**

### Property 9: Aging Bucket Assignment

*For any* days overdue value:
- If days <= 0, bucket is 'Current'
- If 1 <= days <= 30, bucket is '1-30 Days'
- If 31 <= days <= 60, bucket is '31-60 Days'
- If 61 <= days <= 90, bucket is '61-90 Days'
- If days > 90, bucket is '90+ Days'

**Validates: Requirements 5.2**

### Property 10: Days Outstanding Calculation

*For any* invoice with a due_date and any as-of date, days_outstanding equals the number of days between the as-of date and the due_date (positive if overdue, zero or negative if not yet due).

**Validates: Requirements 5.7**

### Property 11: AR Aging Summary Consistency

*For any* set of invoices, the sum of amounts across all aging buckets in the summary must equal the total outstanding amount.

**Validates: Requirements 5.3**

### Property 12: Customer Aging Aggregation

*For any* customer in the AR aging report, the sum of their amounts across all aging buckets must equal the sum of their individual invoice amounts.

**Validates: Requirements 5.4**

### Property 13: AR Aging Invoice Filter

*For any* invoice included in the AR aging report, the invoice's amount_due must be greater than zero.

**Validates: Requirements 5.8**

### Property 14: Customer Filter Correctness

*For any* customer filter applied to the AR aging report, all returned invoices must belong to that customer.

**Validates: Requirements 5.6**

### Property 15: Net Profit Calculation

*For any* job in the profitability report, net_profit must equal revenue minus direct_cost minus overhead.

**Validates: Requirements 6.2**

### Property 16: Net Margin Calculation

*For any* job with revenue greater than zero, net_margin must equal (net_profit / revenue) * 100. For jobs with zero revenue, net_margin must be zero.

**Validates: Requirements 6.3**

### Property 17: Date Range Filter Correctness

*For any* date range filter applied to the profitability report, all returned jobs must have their created_at date within the specified range (inclusive).

**Validates: Requirements 6.4**

### Property 18: Margin Range Filter Correctness

*For any* margin range filter (minMargin, maxMargin) applied to the profitability report, all returned jobs must have net_margin >= minMargin and net_margin <= maxMargin.

**Validates: Requirements 6.6**

### Property 19: Profitability Summary Consistency

*For any* set of jobs in the profitability report, the summary totals (totalRevenue, totalCost, totalOverhead, totalNetProfit) must equal the sum of the corresponding values from individual jobs.

**Validates: Requirements 6.7**

### Property 20: Profitability Default Sort Order

*For any* list of jobs returned by the profitability report without explicit sorting, the jobs must be sorted by net_margin in descending order.

**Validates: Requirements 6.8**

### Property 21: Export Logging

*For any* export action (PDF or Excel), a report_execution record must be created with the export_format field set to the corresponding format ('pdf' or 'excel').

**Validates: Requirements 7.4**

## Error Handling

### Database Errors

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Report configuration not found | Return null, display "Report not found" message |
| Duplicate report_code on insert | Database constraint violation, return error message |
| User profile not found for execution log | Skip logging, continue with report display |
| Database connection failure | Display error message, offer retry option |

### Permission Errors

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| User role not in allowed_roles | Display "Access Denied" message with back link |
| User not authenticated | Redirect to login page |
| Invalid role value | Treat as 'viewer' role (most restrictive) |

### Report Generation Errors

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| No data for selected filters | Display empty state with helpful message |
| Invalid date range | Display validation error, prevent report run |
| Export generation failure | Display error toast, log error for debugging |

### Input Validation

```typescript
// Validate date range
function validateDateRange(start: Date, end: Date): { valid: boolean; error?: string } {
  if (end < start) {
    return { valid: false, error: 'End date must be after start date' }
  }
  return { valid: true }
}

// Validate margin range
function validateMarginRange(min?: number, max?: number): { valid: boolean; error?: string } {
  if (min !== undefined && max !== undefined && max < min) {
    return { valid: false, error: 'Maximum margin must be greater than minimum' }
  }
  return { valid: true }
}

// Validate export format
function isValidExportFormat(format: string): format is 'view' | 'pdf' | 'excel' | 'csv' {
  return ['view', 'pdf', 'excel', 'csv'].includes(format)
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Report Configuration Tests**
   - Verify default reports are seeded correctly
   - Test JSONB field storage and retrieval
   - Test report_code uniqueness constraint

2. **Permission Tests**
   - Test each role's access to specific reports
   - Test access denied scenarios
   - Test edge cases (null role, invalid role)

3. **AR Aging Calculation Tests**
   - Test bucket assignment for boundary values (0, 1, 30, 31, 60, 61, 90, 91 days)
   - Test with empty invoice list
   - Test with single invoice
   - Test customer filter with no matching invoices

4. **Profitability Calculation Tests**
   - Test net profit calculation with various inputs
   - Test net margin with zero revenue (edge case)
   - Test date range filter with boundary dates
   - Test margin filter with exact boundary values

5. **Export Tests**
   - Test PDF generation produces valid blob
   - Test Excel generation produces valid blob
   - Test export metadata inclusion

### Property-Based Tests

Property-based tests will use a testing library (e.g., fast-check for TypeScript) to verify universal properties across many generated inputs.

**Configuration**: Minimum 100 iterations per property test.

**Tag Format**: `Feature: reports-module-foundation, Property N: [property description]`

1. **Property Test: Aging Bucket Assignment**
   - Generate random days overdue values (-100 to 500)
   - Verify bucket assignment matches specification
   - Tag: `Feature: reports-module-foundation, Property 9: Aging bucket assignment`

2. **Property Test: Days Outstanding Calculation**
   - Generate random due dates and as-of dates
   - Verify calculation is correct
   - Tag: `Feature: reports-module-foundation, Property 10: Days outstanding calculation`

3. **Property Test: Summary Consistency**
   - Generate random sets of invoices with amounts
   - Verify bucket totals sum to total amount
   - Tag: `Feature: reports-module-foundation, Property 11: AR aging summary consistency`

4. **Property Test: Net Profit Calculation**
   - Generate random revenue, cost, overhead values
   - Verify net_profit = revenue - cost - overhead
   - Tag: `Feature: reports-module-foundation, Property 15: Net profit calculation`

5. **Property Test: Net Margin Calculation**
   - Generate random revenue and net_profit values
   - Verify margin calculation, including zero revenue edge case
   - Tag: `Feature: reports-module-foundation, Property 16: Net margin calculation`

6. **Property Test: Search Filtering**
   - Generate random report names, descriptions, and search queries
   - Verify filtered results contain query in name or description
   - Tag: `Feature: reports-module-foundation, Property 7: Report search filtering`

7. **Property Test: Category Ordering**
   - Generate random reports with display_order values
   - Verify sorted output is in ascending order
   - Tag: `Feature: reports-module-foundation, Property 8: Report category ordering`

8. **Property Test: Role-Based Visibility**
   - Generate random role and allowed_roles combinations
   - Verify visibility matches role membership
   - Tag: `Feature: reports-module-foundation, Property 2: Role-based report visibility`

### Test File Structure

```
__tests__/
├── report-config-utils.test.ts      # Configuration utility tests
├── report-execution-utils.test.ts   # Execution logging tests
├── ar-aging-utils.test.ts           # Existing + new property tests
├── profitability-utils.test.ts      # New profitability tests
├── report-permissions.test.ts       # Permission tests
└── report-search-utils.test.ts      # Search filtering tests
```
