# Requirements Document

## Introduction

This document specifies the requirements for enhancing the Finance Manager Dashboard with additional real data metrics. Feri (Finance Manager) oversees both the Finance Department and Administration Department, requiring visibility into both financial operations and document workflow.

The current implementation provides basic metrics (pendingPJOs, draftInvoices, pendingBKK, arOutstanding, revenueMTD, grossMargin, collectionRate, costControl). This enhancement adds:
- **Financial Overview**: Revenue YTD, Expenses MTD, Gross Profit
- **AR Enhancement**: AR Overdue, AR Aging breakdown
- **Accounts Payable**: AP Outstanding, AP Due This Week
- **Approval Queue**: Pending PJO Approvals, Pending Disbursement Approvals (with count and value)
- **Recent Activity**: Last 5 invoices, payments, PJO approvals
- **Administration Enhancement**: PJOs ready for JO conversion, JOs pending invoice

## Glossary

- **Finance_Manager_Dashboard**: The dashboard page at `/dashboard/finance-manager` displaying financial metrics and KPIs
- **Metrics_Fetcher**: The server-side data fetching module at `lib/dashboard/finance-manager-data.ts`
- **AR_Aging**: Accounts Receivable aging breakdown categorizing unpaid invoices by days overdue (0-30, 31-60, 61-90, 90+ days)
- **AP_Outstanding**: Accounts Payable outstanding amount representing pending disbursements
- **BKK_Record**: Bukti Kas Keluar (Cash Disbursement) record in the `bkk_records` table
- **Invoice**: Customer invoice record in the `invoices` table
- **PJO**: Proforma Job Order record in the `proforma_job_orders` table
- **MTD**: Month-to-Date (from first day of current month to today)
- **YTD**: Year-to-Date (from first day of current year to today)
- **Dashboard_Cache**: The 5-minute TTL caching mechanism in `lib/dashboard-cache.ts`

## Requirements

### Requirement 1: Revenue YTD Metric

**User Story:** As a Finance Manager, I want to see Year-to-Date revenue, so that I can track annual financial performance.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate Revenue YTD as the SUM of `total_amount` from paid invoices where `paid_at` is within the current year
2. WHEN displaying Revenue YTD, THE Finance_Manager_Dashboard SHALL format the value using IDR compact currency format
3. WHEN no paid invoices exist for the current year, THE Metrics_Fetcher SHALL return 0 for Revenue YTD

### Requirement 2: Expenses MTD Metric

**User Story:** As a Finance Manager, I want to see Month-to-Date expenses, so that I can monitor current month spending.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate Expenses MTD as the SUM of `amount` from BKK_Records where `workflow_status` is 'approved' or 'paid' AND `approved_at` or `paid_at` is within the current month
2. WHEN displaying Expenses MTD, THE Finance_Manager_Dashboard SHALL format the value using IDR compact currency format
3. WHEN no approved/paid BKK_Records exist for the current month, THE Metrics_Fetcher SHALL return 0 for Expenses MTD

### Requirement 3: Gross Profit Calculation

**User Story:** As a Finance Manager, I want to see explicit Gross Profit, so that I can understand profitability at a glance.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate Gross Profit as Revenue MTD minus Expenses MTD
2. WHEN displaying Gross Profit, THE Finance_Manager_Dashboard SHALL format the value using IDR compact currency format
3. WHEN Gross Profit is negative, THE Finance_Manager_Dashboard SHALL display the value with a negative indicator and red color styling

### Requirement 4: AR Overdue Metric

**User Story:** As a Finance Manager, I want to see overdue AR amount, so that I can prioritize collection efforts.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate AR Overdue as the SUM of outstanding amounts from invoices where `due_date` is more than 30 days in the past AND `status` is 'sent' or 'overdue'
2. WHEN displaying AR Overdue, THE Finance_Manager_Dashboard SHALL format the value using IDR compact currency format
3. WHEN no overdue invoices exist, THE Metrics_Fetcher SHALL return 0 for AR Overdue

### Requirement 5: AR Aging Breakdown

**User Story:** As a Finance Manager, I want to see AR aging breakdown by time buckets, so that I can assess collection risk.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate AR Aging using the existing `groupInvoicesByAging` function from `lib/finance-dashboard-utils.ts`
2. THE Metrics_Fetcher SHALL return AR Aging data grouped into four buckets: 0-30 days (current), 31-60 days, 61-90 days, and 90+ days
3. WHEN displaying AR Aging, THE Finance_Manager_Dashboard SHALL show count and amount for each aging bucket
4. WHEN displaying AR Aging, THE Finance_Manager_Dashboard SHALL use visual indicators (colors) to highlight higher-risk buckets (61-90 days orange, 90+ days red)

### Requirement 6: AP Outstanding Metric

**User Story:** As a Finance Manager, I want to see total outstanding payables, so that I can manage cash flow.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate AP Outstanding as the SUM of `amount` from BKK_Records where `workflow_status` is 'draft', 'pending_check', or 'pending_approval'
2. WHEN displaying AP Outstanding, THE Finance_Manager_Dashboard SHALL format the value using IDR compact currency format
3. WHEN no pending BKK_Records exist, THE Metrics_Fetcher SHALL return 0 for AP Outstanding

### Requirement 7: AP Due This Week Metric

**User Story:** As a Finance Manager, I want to see payables due within 7 days, so that I can plan immediate cash needs.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate AP Due This Week as the SUM of `amount` from BKK_Records where `workflow_status` is 'approved' AND record was created within the last 7 days (as proxy for urgency since BKK_Records lacks due_date)
2. WHEN displaying AP Due This Week, THE Finance_Manager_Dashboard SHALL format the value using IDR compact currency format
3. WHEN no urgent BKK_Records exist, THE Metrics_Fetcher SHALL return 0 for AP Due This Week

### Requirement 8: Pending PJO Approvals Queue

**User Story:** As a Finance Manager, I want to see pending PJO approvals with count and value, so that I can prioritize approval workflow.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL query PJO records where `status` is 'pending_approval'
2. THE Metrics_Fetcher SHALL return both COUNT and SUM of `estimated_amount` for pending PJO approvals
3. WHEN displaying Pending PJO Approvals, THE Finance_Manager_Dashboard SHALL show both count and total value
4. WHEN no pending PJO approvals exist, THE Metrics_Fetcher SHALL return 0 for both count and value

### Requirement 9: Pending Disbursement Approvals Queue

**User Story:** As a Finance Manager, I want to see pending disbursement approvals with count and value, so that I can manage payment workflow.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL query BKK_Records where `workflow_status` is 'pending_check' or 'pending_approval'
2. THE Metrics_Fetcher SHALL return both COUNT and SUM of `amount` for pending disbursement approvals
3. WHEN displaying Pending Disbursement Approvals, THE Finance_Manager_Dashboard SHALL show both count and total value
4. WHEN no pending disbursement approvals exist, THE Metrics_Fetcher SHALL return 0 for both count and value

### Requirement 10: Recent Invoices Activity

**User Story:** As a Finance Manager, I want to see the last 5 invoices created, so that I can track invoice generation activity.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL query the 5 most recent invoices ordered by `created_at` descending
2. THE Metrics_Fetcher SHALL return invoice_number, customer name (via join), total_amount, status, and created_at for each invoice
3. WHEN displaying Recent Invoices, THE Finance_Manager_Dashboard SHALL show a list with invoice number, customer, amount, and status
4. WHEN fewer than 5 invoices exist, THE Metrics_Fetcher SHALL return all available invoices

### Requirement 11: Recent Payments Activity

**User Story:** As a Finance Manager, I want to see the last 5 payments received, so that I can track collection activity.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL query the 5 most recent invoices where `status` is 'paid' ordered by `paid_at` descending
2. THE Metrics_Fetcher SHALL return invoice_number, customer name (via join), total_amount, and paid_at for each payment
3. WHEN displaying Recent Payments, THE Finance_Manager_Dashboard SHALL show a list with invoice number, customer, amount, and payment date
4. WHEN fewer than 5 paid invoices exist, THE Metrics_Fetcher SHALL return all available paid invoices

### Requirement 12: Recent PJO Approvals Activity

**User Story:** As a Finance Manager, I want to see the last 5 PJO approval decisions, so that I can track approval workflow activity.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL query the 5 most recent PJOs where `status` is 'approved' or 'rejected' ordered by `approved_at` or `rejected_at` descending
2. THE Metrics_Fetcher SHALL return pjo_number, description, estimated_amount, status, and approval/rejection timestamp for each PJO
3. WHEN displaying Recent PJO Approvals, THE Finance_Manager_Dashboard SHALL show a list with PJO number, description, amount, and status with visual indicator (green for approved, red for rejected)
4. WHEN fewer than 5 approved/rejected PJOs exist, THE Metrics_Fetcher SHALL return all available PJOs

### Requirement 13: Dashboard Performance

**User Story:** As a Finance Manager, I want the dashboard to load quickly, so that I can access information efficiently.

#### Acceptance Criteria

1. THE Metrics_Fetcher SHALL use the existing Dashboard_Cache with 5-minute TTL for all new metrics
2. THE Metrics_Fetcher SHALL execute database queries in parallel using Promise.all where possible
3. WHEN cached data exists and is fresh, THE Finance_Manager_Dashboard SHALL load in under 500ms
4. WHEN cache is stale, THE Finance_Manager_Dashboard SHALL load in under 2 seconds

### Requirement 14: TypeScript Type Safety

**User Story:** As a developer, I want all new metrics to be properly typed, so that the codebase remains maintainable.

#### Acceptance Criteria

1. THE Metrics_Fetcher SHALL extend the existing `FinanceManagerMetrics` interface with all new metric fields
2. THE Finance_Manager_Dashboard SHALL use the extended interface without TypeScript errors
3. WHEN building the project, THE build process SHALL complete with 0 TypeScript errors


### Requirement 15: PJOs Ready for JO Conversion

**User Story:** As a Finance Manager overseeing Administration, I want to see PJOs that are approved and ready for JO conversion, so that I can monitor document workflow progress.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate PJOs Ready for JO as the COUNT of PJO records where `status` is 'approved' AND `converted_to_jo` is false or null
2. WHEN displaying PJOs Ready for JO, THE Finance_Manager_Dashboard SHALL show the count in the Administration section
3. WHEN no PJOs are ready for conversion, THE Metrics_Fetcher SHALL return 0

### Requirement 16: JOs Pending Invoice

**User Story:** As a Finance Manager overseeing Administration, I want to see completed JOs that need invoicing, so that I can ensure timely billing.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate JOs Pending Invoice as the COUNT of JO records where `status` is 'completed' or 'submitted_to_finance'
2. WHEN displaying JOs Pending Invoice, THE Finance_Manager_Dashboard SHALL show the count in the Administration section
3. WHEN no JOs are pending invoice, THE Metrics_Fetcher SHALL return 0

### Requirement 17: Administration Workflow Pipeline

**User Story:** As a Finance Manager overseeing Administration, I want to see the document workflow pipeline status, so that I can identify bottlenecks.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate pipeline counts for: Draft PJOs, Pending Approval PJOs, Active JOs, and Completed JOs
2. WHEN displaying the pipeline, THE Finance_Manager_Dashboard SHALL show counts for each stage in a visual flow
3. THE Finance_Manager_Dashboard SHALL use the existing orange theme for Administration section metrics

### Requirement 18: Overdue Invoices Count

**User Story:** As a Finance Manager, I want to see the count of overdue invoices separately from AR Outstanding, so that I can prioritize collection follow-ups.

#### Acceptance Criteria

1. WHEN the Finance_Manager_Dashboard loads, THE Metrics_Fetcher SHALL calculate Overdue Invoices Count as the COUNT of invoices where `status` is 'overdue' OR (`status` is 'sent' AND `due_date` is in the past)
2. WHEN displaying Overdue Invoices Count, THE Finance_Manager_Dashboard SHALL show both count and total amount
3. WHEN no overdue invoices exist, THE Metrics_Fetcher SHALL return 0 for both count and amount
