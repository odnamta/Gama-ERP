# Implementation Plan: Finance Manager Dashboard Real Data Enhancement

## Overview

This implementation extends the existing Finance Manager Dashboard with comprehensive real data metrics. The work builds upon `lib/dashboard/finance-manager-data.ts` and `app/(main)/dashboard/finance-manager/page.tsx`, adding new financial metrics, AR/AP sections, approval queues, and recent activity feeds.

## Tasks

- [x] 1. Extend FinanceManagerMetrics interface and add new queries
  - [x] 1.1 Update FinanceManagerMetrics interface in finance-manager-data.ts
    - Add new fields: revenueYTD, expensesMTD, grossProfit, arOverdue, arAging, apOutstanding, apDueThisWeek, pendingPJOApprovals, pendingDisbursementApprovals, recentInvoices, recentPayments, recentPJOApprovals
    - Add supporting interfaces: ApprovalQueueItem, RecentInvoice, RecentPayment, RecentPJOApproval
    - Import ARAgingData from finance-dashboard-utils.ts
    - _Requirements: 14.1_

  - [x] 1.2 Add Revenue YTD and Expenses MTD queries
    - Query invoices where status='paid' and paid_at is in current year for Revenue YTD
    - Query bkk_records where workflow_status in ('approved','paid') and date is in current month for Expenses MTD
    - Calculate grossProfit as revenueMTD - expensesMTD
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 1.3 Add AR Overdue and AR Aging queries
    - Query invoices where status in ('sent','overdue') and due_date > 30 days ago for AR Overdue
    - Query all outstanding invoices and use groupInvoicesByAging() from finance-dashboard-utils.ts
    - _Requirements: 4.1, 5.1, 5.2_

  - [x] 1.4 Add AP Outstanding and AP Due This Week queries
    - Query bkk_records where workflow_status in ('draft','pending_check','pending_approval') for AP Outstanding
    - Query bkk_records where workflow_status='approved' and created_at within 7 days for AP Due This Week
    - _Requirements: 6.1, 7.1_

  - [x] 1.5 Add Approval Queue queries
    - Query proforma_job_orders where status='pending_approval' for count and sum of estimated_amount
    - Query bkk_records where workflow_status in ('pending_check','pending_approval') for count and sum of amount
    - _Requirements: 8.1, 8.2, 9.1, 9.2_

  - [x] 1.6 Add Recent Activity queries
    - Query 5 most recent invoices with customer join, ordered by created_at desc
    - Query 5 most recent paid invoices with customer join, ordered by paid_at desc
    - Query 5 most recent approved/rejected PJOs, ordered by decision timestamp desc
    - _Requirements: 10.1, 10.2, 11.1, 11.2, 12.1, 12.2_

  - [x] 1.7 Add Administration Enhancement queries
    - Query PJOs where status='approved' and converted_to_jo is false/null for PJOs Ready for JO
    - Query JOs where status in ('completed','submitted_to_finance') for JOs Pending Invoice
    - Query pipeline counts: draft PJOs, pending approval PJOs, active JOs, completed JOs
    - Query overdue invoices count and amount
    - _Requirements: 15.1, 16.1, 17.1, 18.1_

- [x] 2. Checkpoint - Verify data fetcher compiles and returns correct types
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Update Finance Manager Dashboard UI
  - [x] 3.1 Add Financial Overview section
    - Display Revenue YTD, Expenses MTD, Gross Profit in a new card section
    - Use formatCurrencyIDRCompact for all values
    - Apply red styling for negative Gross Profit
    - _Requirements: 1.2, 2.2, 3.2, 3.3_

  - [x] 3.2 Enhance Administration section
    - Add PJOs Ready for JO metric (approved, not converted)
    - Add JOs Pending Invoice metric (completed/submitted_to_finance)
    - Add Admin Pipeline visual showing document flow stages
    - Keep existing pendingPJOs, draftInvoices, documentQueue metrics
    - _Requirements: 15.2, 16.2, 17.2, 17.3_

  - [x] 3.3 Add AR Enhancement section
    - Display AR Overdue metric with formatting
    - Display Overdue Invoices count and amount
    - Add AR Aging breakdown showing count and amount for each bucket (0-30, 31-60, 61-90, 90+ days)
    - Apply color coding: orange for 61-90 days, red for 90+ days
    - _Requirements: 4.2, 5.3, 5.4, 18.2_

  - [x] 3.4 Add Accounts Payable section
    - Display AP Outstanding and AP Due This Week metrics
    - Use purple theme consistent with existing Finance section
    - _Requirements: 6.2, 7.2_

  - [x] 3.5 Add Approval Queue section
    - Display Pending PJO Approvals with count and total value
    - Display Pending Disbursement Approvals with count and total value
    - _Requirements: 8.3, 9.3_

  - [x] 3.6 Add Recent Activity section
    - Display Recent Invoices list (invoice number, customer, amount, status)
    - Display Recent Payments list (invoice number, customer, amount, date)
    - Display Recent PJO Approvals list (PJO number, description, amount, status with green/red indicator)
    - _Requirements: 10.3, 11.3, 12.3_

- [x] 4. Checkpoint - Verify dashboard renders correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add property-based tests for calculation functions
  - [x] 5.1 Write property test for Revenue YTD calculation
    - **Property 1: Revenue YTD Calculation**
    - Generate random invoice arrays, verify sum includes only paid invoices in current year
    - **Validates: Requirements 1.1**

  - [x] 5.2 Write property test for Expenses MTD calculation
    - **Property 2: Expenses MTD Calculation**
    - Generate random BKK record arrays, verify sum includes only approved/paid records in current month
    - **Validates: Requirements 2.1**

  - [x] 5.3 Write property test for Gross Profit invariant
    - **Property 3: Gross Profit Invariant**
    - For any revenue and expense values, verify grossProfit === revenue - expenses
    - **Validates: Requirements 3.1**

  - [x] 5.4 Write property test for AR Overdue calculation
    - **Property 4: AR Overdue Calculation**
    - Generate random invoice arrays, verify sum includes only overdue invoices >30 days
    - **Validates: Requirements 4.1**

  - [x] 5.5 Write property test for AR Aging bucket assignment
    - **Property 5: AR Aging Bucket Assignment**
    - Generate random invoices, verify each is assigned to exactly one bucket and bucket counts sum to total
    - **Validates: Requirements 5.2**

  - [x] 5.6 Write property test for AP Outstanding calculation
    - **Property 6: AP Outstanding Calculation**
    - Generate random BKK record arrays, verify sum includes only pending status records
    - **Validates: Requirements 6.1**

  - [x] 5.7 Write property test for Approval Queue accuracy
    - **Property 8: Approval Queue Count and Sum Accuracy**
    - Generate random record arrays, verify count equals array length and sum equals total of value field
    - **Validates: Requirements 8.2, 9.2**

  - [x] 5.8 Write property test for Recent Items ordering
    - **Property 9: Recent Items Ordering and Limiting**
    - Generate random record arrays, verify result is at most N items ordered by timestamp desc
    - **Validates: Requirements 10.1, 11.1, 12.1**

- [x] 6. Add unit tests for edge cases
  - [x] 6.1 Write unit tests for empty data handling
    - Test all metrics return 0 or empty arrays when no data exists
    - _Requirements: 1.3, 2.3, 4.3, 6.3, 7.3, 8.4, 9.4, 10.4, 11.4, 12.4_

  - [x] 6.2 Write unit tests for NULL value handling
    - Test calculations handle NULL values in numeric fields gracefully
    - _Requirements: Error Handling_

- [x] 7. Final checkpoint - Build verification
  - Run npm run build to verify 0 TypeScript errors
  - Verify dashboard loads in under 2 seconds
  - _Requirements: 13.3, 13.4, 14.3_

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All queries should be added to the existing Promise.all block for parallel execution
- Use existing formatCurrencyIDRCompact from lib/utils/format.ts
- Use existing groupInvoicesByAging from lib/finance-dashboard-utils.ts
